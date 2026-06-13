from __future__ import annotations

import json
import logging
import os
import time
from typing import Any, Iterable

import httpx
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, Response

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger("webshield-waf")

ML_API_URL = os.getenv("ML_API_URL", "http://172.16.67.67:8000/inspect")
ML_API_TOKEN = os.getenv("ML_API_TOKEN", "")

ML_TIMEOUT_SECONDS = float(os.getenv("ML_TIMEOUT_SECONDS", "1.5"))
FAIL_MODE = os.getenv("FAIL_MODE", "open").lower()
MAX_INSPECT_BODY_BYTES = int(os.getenv("MAX_INSPECT_BODY_BYTES", str(1024 * 1024)))

WAF_ROUTES_JSON = os.getenv("WAF_ROUTES_JSON", "{}")

HOP_BY_HOP_HEADERS = {
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
}

app = FastAPI(title="WebShield Port-Based WAF Proxy", version="1.0.0")


def load_routes() -> dict[str, Any]:
    try:
        routes = json.loads(WAF_ROUTES_JSON)
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"Invalid WAF_ROUTES_JSON: {exc}") from exc

    if "apps" not in routes or not isinstance(routes["apps"], dict):
        raise RuntimeError("WAF_ROUTES_JSON must contain an 'apps' object")

    return routes


def filtered_headers(headers: Iterable[tuple[str, str]]) -> dict[str, str]:
    clean: dict[str, str] = {}
    for key, value in headers:
        if key.lower() not in HOP_BY_HOP_HEADERS:
            clean[key] = value
    return clean


def get_client_ip(request: Request) -> str:
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    if request.client:
        return request.client.host
    return ""


def normalize_host(host: str) -> str:
    return host.split(":")[0].strip().lower()


def get_app_config(request: Request) -> tuple[str, dict[str, Any]]:
    """
    172.16.67.172:8081 -> X-WebShield-App: split_app
    172.16.67.172:8082 -> X-WebShield-App: single_app
    """
    routes = load_routes()
    apps = routes["apps"]

    app_header = request.headers.get("x-webshield-app", "").strip()
    if app_header in apps:
        return app_header, apps[app_header]

    # Optional fallback by Host, useful if later you add domains.
    host = normalize_host(request.headers.get("host", ""))
    if host in apps:
        return host, apps[host]

    raise RuntimeError(f"No WAF route configured for app/host '{app_header or host}'")


def path_matches_prefix(path: str, prefixes: list[str]) -> bool:
    return any(path.startswith(prefix) for prefix in prefixes)


def choose_upstream(app_config: dict[str, Any], path: str) -> str:
    mode = app_config.get("mode")

    if mode == "single_vm":
        return str(app_config["app_url"]).rstrip("/")

    if mode == "split":
        api_prefixes = app_config.get("api_prefixes", ["/api"])
        if path_matches_prefix(path, api_prefixes):
            return str(app_config["backend_url"]).rstrip("/")
        return str(app_config["frontend_url"]).rstrip("/")

    raise RuntimeError(f"Unsupported app mode: {mode}")


def build_upstream_url(request: Request) -> tuple[str, str, dict[str, Any]]:
    app_name, app_config = get_app_config(request)
    path = request.url.path or "/"

    upstream = choose_upstream(app_config, path)
    url = f"{upstream}{path}"

    if request.url.query:
        url = f"{url}?{request.url.query}"

    return app_name, url, app_config


def decode_body_for_inspection(body: bytes) -> tuple[str, bool]:
    truncated = len(body) > MAX_INSPECT_BODY_BYTES
    body_for_model = body[:MAX_INSPECT_BODY_BYTES]
    return body_for_model.decode("utf-8", errors="ignore"), truncated


async def inspect_with_ml(request: Request, body: bytes, app_name: str) -> dict[str, Any]:
    body_text, truncated = decode_body_for_inspection(body)

    payload = {
        "method": request.method,
        "uri": request.url.path or "/",
        "query": request.url.query or "",
        "headers": {k: v for k, v in request.headers.items()},
        "body": body_text,
        "client_ip": get_client_ip(request),
        "body_truncated": truncated,
        "app_name": app_name,
    }

    auth_headers = {}
    if ML_API_TOKEN:
        auth_headers["Authorization"] = f"Bearer {ML_API_TOKEN}"

    async with httpx.AsyncClient(timeout=httpx.Timeout(ML_TIMEOUT_SECONDS)) as client:
        response = await client.post(
            ML_API_URL,
            json=payload,
            headers=auth_headers,
        )
        response.raise_for_status()
        return response.json()


async def forward_request(request: Request, body: bytes, upstream_url: str) -> Response:
    headers = filtered_headers(request.headers.items())
    headers.pop("x-webshield-app", None)
    headers.pop("X-WebShield-App", None)

    headers["x-forwarded-for"] = get_client_ip(request)
    headers["x-forwarded-host"] = request.headers.get("host", "")
    headers["x-forwarded-proto"] = request.url.scheme

    async with httpx.AsyncClient(follow_redirects=False, timeout=None) as client:
        upstream_response = await client.request(
            method=request.method,
            url=upstream_url,
            headers=headers,
            content=body,
        )

    response_headers = filtered_headers(upstream_response.headers.items())

    return Response(
        content=upstream_response.content,
        status_code=upstream_response.status_code,
        headers=response_headers,
        media_type=upstream_response.headers.get("content-type"),
    )


@app.get("/health")
def health() -> dict[str, Any]:
    routes = load_routes()
    return {
        "status": "ok",
        "routing": "port-based via X-WebShield-App",
        "ml_api_url": ML_API_URL,
        "fail_mode": FAIL_MODE,
        "apps": list(routes.get("apps", {}).keys()),
    }


@app.api_route(
    "/{full_path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
)
async def waf_entrypoint(full_path: str, request: Request) -> Response:
    start = time.perf_counter()
    body = await request.body()

    try:
        app_name, upstream_url, app_config = build_upstream_url(request)
    except Exception as exc:
        logger.exception("Routing failed")
        return JSONResponse(
            status_code=421,
            content={
                "detail": "No route configured for this port/app",
                "error": str(exc),
            },
        )

    bypass_paths = app_config.get("bypass_paths", [])
    if request.url.path in bypass_paths:
        return await forward_request(request, body, upstream_url)

    try:
        decision = await inspect_with_ml(request, body, app_name)
    except Exception:
        elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
        logger.exception("ML inspection failed app=%s elapsed_ms=%s", app_name, elapsed_ms)

        if FAIL_MODE == "close":
            return JSONResponse(
                status_code=503,
                content={
                    "detail": "WebShield inspection unavailable",
                    "action": "block",
                    "fail_mode": "close",
                    "app": app_name,
                },
            )

        return await forward_request(request, body, upstream_url)

    action = decision.get("action")
    prob = decision.get("prob_anomalous")
    label = decision.get("label")
    elapsed_ms = round((time.perf_counter() - start) * 1000, 2)

    logger.info(
        "app=%s decision=%s label=%s prob=%s method=%s path=%s upstream=%s client_ip=%s elapsed_ms=%s",
        app_name,
        action,
        label,
        prob,
        request.method,
        request.url.path,
        upstream_url,
        get_client_ip(request),
        elapsed_ms,
    )

    if action == "block":
        return JSONResponse(
            status_code=403,
            content={
                "detail": "Request blocked by WebShield",
                "app": app_name,
                "label": label,
                "prob_anomalous": prob,
                "model_version": decision.get("model_version"),
            },
        )

    return await forward_request(request, body, upstream_url)
