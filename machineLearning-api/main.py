import os
import time
import threading
from typing import Dict, Optional, Any

import joblib
import pandas as pd
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

from ml_api.features import build_features


MODEL_PATH = os.getenv("MODEL_PATH", "models/webshield_rf_v1.joblib")
ANOMALY_THRESHOLD = float(os.getenv("ANOMALY_THRESHOLD", "0.90"))
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", "")

_model_lock = threading.Lock()
_model_artifact: Optional[Dict[str, Any]] = None
_model_mtime: Optional[float] = None


app = FastAPI(title="WebShield ML Inspection API")


class ParsedRequest(BaseModel):
    method: str
    uri: str
    query: str = ""
    headers: Dict[str, str] = Field(default_factory=dict)
    body: str = ""
    client_ip: Optional[str] = None


class InspectResponse(BaseModel):
    label: str
    prediction: int
    prob_anomalous: float
    threshold: float
    action: str
    model_version: Optional[str] = None
    inspected_at: float


def require_internal_auth(x_internal_api_key: Optional[str]) -> None:
    if INTERNAL_API_KEY and x_internal_api_key != INTERNAL_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid internal API key")


def load_model_if_needed() -> Dict[str, Any]:
    global _model_artifact, _model_mtime

    if not os.path.exists(MODEL_PATH):
        raise RuntimeError(f"Model file not found: {MODEL_PATH}")

    current_mtime = os.path.getmtime(MODEL_PATH)

    with _model_lock:
        if _model_artifact is None or _model_mtime != current_mtime:
            artifact = joblib.load(MODEL_PATH)

            if "model" not in artifact:
                raise RuntimeError("Invalid artifact: missing 'model'")

            if "feature_names" not in artifact:
                raise RuntimeError("Invalid artifact: missing 'feature_names'")

            _model_artifact = artifact
            _model_mtime = current_mtime

    return _model_artifact


def normalize_headers(headers: Dict[str, str]) -> Dict[str, str]:
    return {str(k).lower(): str(v) for k, v in headers.items()}


def parsed_request_to_dataframe(req: ParsedRequest) -> pd.DataFrame:
    headers = normalize_headers(req.headers)

    row = {
        "Method": req.method.upper(),
        "URI": req.uri or "/",
        "GET-Query": req.query or "",
        "POST-Data": req.body or "",
        "Cookie": headers.get("cookie", ""),
        "User-Agent": headers.get("user-agent", ""),
        "Content-Length": headers.get("content-length", len(req.body or "")),
        "Host-Header": headers.get("host", ""),
    }

    return pd.DataFrame([row])


def get_anomalous_probability(model: Any, x_req: pd.DataFrame) -> float:
    probabilities = model.predict_proba(x_req)[0]

    if hasattr(model, "classes_") and 1 in list(model.classes_):
        anomalous_index = list(model.classes_).index(1)
    else:
        anomalous_index = 1

    return float(probabilities[anomalous_index])


@app.get("/health")
def health():
    artifact = load_model_if_needed()

    return {
        "status": "ok",
        "model_path": MODEL_PATH,
        "model_version": artifact.get("version"),
        "trained_at": artifact.get("trained_at"),
        "metrics": artifact.get("metrics"),
        "threshold": ANOMALY_THRESHOLD,
        "feature_count": len(artifact["feature_names"]),
    }


@app.post("/inspect", response_model=InspectResponse)
def inspect(
    req: ParsedRequest,
    x_internal_api_key: Optional[str] = Header(default=None),
):
    require_internal_auth(x_internal_api_key)

    artifact = load_model_if_needed()

    model = artifact["model"]
    feature_names = artifact["feature_names"]

    df_req = parsed_request_to_dataframe(req)
    x_req = build_features(df_req, feature_names)

    prob_anomalous = get_anomalous_probability(model, x_req)

    prediction = 1 if prob_anomalous >= ANOMALY_THRESHOLD else 0
    label = "anomalous" if prediction == 1 else "valid"
    action = "block" if prediction == 1 else "allow"

    return InspectResponse(
        label=label,
        prediction=prediction,
        prob_anomalous=prob_anomalous,
        threshold=ANOMALY_THRESHOLD,
        action=action,
        model_version=artifact.get("version"),
        inspected_at=time.time(),
    )