import joblib
import pandas as pd
from pathlib import Path
from urllib.parse import urlparse
from build_features import build_features

_MODEL_PATH = Path(__file__).resolve().parent / "webshield_rf_v1.joblib"
artifact = joblib.load(_MODEL_PATH)

model = artifact["model"]
feature_names = artifact["feature_names"]

def request_to_row(method, full_url, headers=None, body=""):
    headers = headers or {}

    parsed = urlparse(full_url)

    uri = parsed.path or "/"
    get_query = parsed.query or ""

    row = {
        "Method": method.upper(),
        "URI": uri,
        "GET-Query": get_query,
        "POST-Data": body or "",
        "Cookie": headers.get("Cookie", ""),
        "User-Agent": headers.get("User-Agent", ""),
        "Content-Length": headers.get("Content-Length", len(body or "")),
        # In the ECML dataset this column is the HTTP version line (HTTP/1.0), not the hostname.
        "Host-Header": headers.get("Host-Header", "HTTP/1.1"),
    }

    return pd.DataFrame([row])


def evaluate_http_request(method, full_url, headers=None, body=""):
    df_req = request_to_row(method, full_url, headers, body)

    X_req = build_features(df_req, feature_names=feature_names)

    prob_anomalous = float(model.predict_proba(X_req)[0, 1])
    verdict = "anomalous" if prob_anomalous >= 0.5 else "valid"

    return {
        "verdict": verdict,
        "label": "Anomalous" if verdict == "anomalous" else "Valid",
        "prob_anomalous": prob_anomalous,
        "action": waf_action(prob_anomalous),
    }


def waf_action(prob_anomalous, block_at=0.5):
    """WAF policy: block any request the model classifies as anomalous."""
    if prob_anomalous >= block_at:
        return "blocked"
    return "allowed"
