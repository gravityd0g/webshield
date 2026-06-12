import os
from typing import Dict

import httpx
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, Response


ML_API_URL = os.getenv("ML_API_URL", "http://ml-api:8001/inspect")
BACKEND_URL = os.getenv("BACKEND_URL", "http://demo-backend:9000")
ML_API_KEY = os.getenv("INTERNAL_API_KEY", "")

ML_TIMEOUT_SECONDS = float(os.getenv("ML_TIMEOUT_SECONDS", "2.0"))

# closed = si el modelo falla, rechaza
# open   = si el modelo falla, deja pasar
FAIL_MODE = os.getenv("FAIL_MODE", "closed").lower()

MAX_BODY_BYTES = int(os.getenv("MAX_BODY_BYTES", "65536"))

app = FastAPI(title="WebShield WAF Proxy")


HOP_BY_HOP_HEADERS = {
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
    "host",
    "content-length",
}


RESPONSE_HEADERS_TO_DROP = {
    "connection",
    "transfer-encoding",
    "content-encoding",
    "content-length",
}


def filter_request_headers(headers: Dict[str, str]) -> Dict[str, str]:
    return {
        k: v
        for k, v in headers.items()
        if k.lower() not in HOP_BY_HOP_HEADERS
    }


def filter_response_headers(headers: Dict[str, str]) -> Dict[str, str]:
    return {
        k: v
        for k, v in headers.items()
        if k.lower() not in RESPONSE_HEADERS_TO_DROP
    }


def get_client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()

    if request.client:
        return request.client.host

    return ""


async def inspect_with_ml(request: Request, body: bytes) -> Dict:
    body_for_model = body[:MAX_BODY_BYTES].decode("utf-8", errors="ignore")

    payload = {
        "method": request.method,
        "uri": request.url.path,
        "query": request.url.query,
        "headers": dict(request.headers),
        "body": body_for_model,
        "client_ip": get_client_ip(request),
    }

    headers = {}
    if ML_API_KEY:
        headers["X-Internal-API-Key"] = ML_API_KEY

    async with httpx.AsyncClient(timeout=ML_TIMEOUT_SECONDS) as client:
        response = await client.post(
            ML_API_URL,
            json=payload,
            headers=headers,
        )
        response.raise_for_status()
        return response.json()


async def forward_to_backend(request: Request, body: bytes, path: str) -> Response:
    query = request.url.query
    target_url = f"{BACKEND_URL.rstrip('/')}/{path}"

    if query:
        target_url = f"{target_url}?{query}"

    headers = filter_request_headers(dict(request.headers))

    # Headers útiles para trazabilidad
    headers["x-webshield-inspected"] = "true"
    headers["x-forwarded-for"] = get_client_ip(request)
    headers["x-forwarded-proto"] = request.url.scheme

    async with httpx.AsyncClient(timeout=None, follow_redirects=False) as client:
        backend_response = await client.request(
            method=request.method,
            url=target_url,
            headers=headers,
            content=body,
        )

    return Response(
        content=backend_response.content,
        status_code=backend_response.status_code,
        headers=filter_response_headers(dict(backend_response.headers)),
        media_type=backend_response.headers.get("content-type"),
    )


@app.get("/health")
def health():
    return {
        "status": "ok",
        "ml_api_url": ML_API_URL,
        "backend_url": BACKEND_URL,
        "fail_mode": FAIL_MODE,
    }


@app.api_route(
    "/{path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
)
async def waf_proxy(path: str, request: Request):
    body = await request.body()

    try:
        inspection = await inspect_with_ml(request, body)

    except Exception as exc:
        if FAIL_MODE == "closed":
            return JSONResponse(
                status_code=503,
                content={
                    "detail": "Request rejected because ML inspection is unavailable",
                    "error": str(exc),
                },
            )

        # FAIL_MODE = open
        return await forward_to_backend(request, body, path)

    action = inspection.get("action")
    label = inspection.get("label")
    prob_anomalous = inspection.get("prob_anomalous")

    if action == "block" or label == "anomalous":
        return JSONResponse(
            status_code=403,
            content={
                "detail": "Request blocked by WebShield",
                "label": label,
                "prob_anomalous": prob_anomalous,
                "threshold": inspection.get("threshold"),
                "model_version": inspection.get("model_version"),
            },
        )

    return await forward_to_backend(request, body, path)