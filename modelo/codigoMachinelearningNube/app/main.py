from __future__ import annotations

import logging
import os
import time
from pathlib import Path
from typing import Any

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel, Field

from app.features import build_features

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger("webshield-ml")

MODEL_PATH = Path(os.getenv("MODEL_PATH", "/opt/webshield-ml/models/current_model.joblib"))
ANOMALY_THRESHOLD = float(os.getenv("ANOMALY_THRESHOLD", "0.90"))
API_TOKEN = os.getenv("ML_API_TOKEN", "")

app = FastAPI(title="WebShield ML Inspection API", version="1.0.0")

_artifact: dict[str, Any] | None = None
_model_mtime_ns: int | None = None
_last_loaded_at: float | None = None


class ParsedRequest(BaseModel):
    method: str
    uri: str = "/"
    query: str = ""
    headers: dict[str, str] = Field(default_factory=dict)
    body: str = ""
    client_ip: str | None = None
    body_truncated: bool = False


def normalize_headers(headers: dict[str, str]) -> dict[str, str]:
    return {str(k).lower(): str(v) for k, v in headers.items()}


def auth_or_raise(request: Request) -> None:
    if not API_TOKEN:
        return
    auth = request.headers.get("authorization", "")
    expected = f"Bearer {API_TOKEN}"
    if auth != expected:
        raise HTTPException(status_code=401, detail="Unauthorized")


def load_model_if_needed() -> dict[str, Any]:
    global _artifact, _model_mtime_ns, _last_loaded_at

    if not MODEL_PATH.exists():
        raise RuntimeError(f"Model file not found: {MODEL_PATH}")

    stat = MODEL_PATH.stat()
    current_mtime_ns = stat.st_mtime_ns

    if _artifact is None or _model_mtime_ns != current_mtime_ns:
        logger.info("Loading model from %s", MODEL_PATH)
        loaded = joblib.load(MODEL_PATH)

        if "model" not in loaded or "feature_names" not in loaded:
            raise RuntimeError("Invalid artifact: expected keys 'model' and 'feature_names'")

        _artifact = loaded
        _model_mtime_ns = current_mtime_ns
        _last_loaded_at = time.time()
        logger.info(
            "Model loaded: version=%s features=%s",
            _artifact.get("version", "unknown"),
            len(_artifact.get("feature_names", [])),
        )

    return _artifact


def parsed_request_to_df(req: ParsedRequest) -> pd.DataFrame:
    headers = normalize_headers(req.headers)

    content_length = headers.get("content-length")
    if content_length is None or content_length == "":
        content_length = len(req.body.encode("utf-8", errors="ignore"))

    row = {
        "Method": req.method.upper(),
        "URI": req.uri or "/",
        "GET-Query": req.query or "",
        "POST-Data": req.body or "",
        "Cookie": headers.get("cookie", ""),
        "User-Agent": headers.get("user-agent", ""),
        "Content-Length": content_length,
        "Host-Header": headers.get("host", ""),
    }
    return pd.DataFrame([row])


@app.on_event("startup")
def startup() -> None:
    try:
        load_model_if_needed()
    except Exception as exc:
        logger.error("Could not load model on startup: %s", exc)
        # No se detiene el proceso para permitir corregir el archivo y probar /health.


@app.get("/health")
def health() -> dict[str, Any]:
    try:
        artifact = load_model_if_needed()
        return {
            "status": "ok",
            "model_path": str(MODEL_PATH),
            "model_version": artifact.get("version", "unknown"),
            "trained_at": artifact.get("trained_at"),
            "sklearn_version": artifact.get("sklearn_version"),
            "features": len(artifact.get("feature_names", [])),
            "threshold": ANOMALY_THRESHOLD,
            "last_loaded_at": _last_loaded_at,
        }
    except Exception as exc:
        return {"status": "error", "detail": str(exc)}


@app.post("/inspect")
def inspect(req: ParsedRequest, request: Request) -> dict[str, Any]:
    auth_or_raise(request)

    try:
        artifact = load_model_if_needed()
        model = artifact["model"]
        feature_names = artifact["feature_names"]

        df_req = parsed_request_to_df(req)
        x_req = build_features(df_req, feature_names=feature_names)

        prob_anomalous = float(model.predict_proba(x_req)[0, 1])
        prediction = 1 if prob_anomalous >= ANOMALY_THRESHOLD else 0
        label = "anomalous" if prediction == 1 else "valid"
        action = "block" if prediction == 1 else "allow"

        return {
            "label": label,
            "prediction": prediction,
            "prob_anomalous": prob_anomalous,
            "threshold": ANOMALY_THRESHOLD,
            "action": action,
            "model_version": artifact.get("version", "unknown"),
            "body_truncated": req.body_truncated,
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Inspection failed")
        raise HTTPException(status_code=500, detail=str(exc))
