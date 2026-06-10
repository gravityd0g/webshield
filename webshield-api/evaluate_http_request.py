import joblib
import pandas as pd
from urllib.parse import urlparse
from build_features import build_features

artifact = joblib.load("webshield_rf_v1.joblib")

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
        "Host-Header": headers.get("Host", ""),
    }

    return pd.DataFrame([row])


def evaluate_http_request(method, full_url, headers=None, body=""):
    df_req = request_to_row(method, full_url, headers, body)

    X_req = build_features(df_req, feature_names=feature_names)

    pred = model.predict(X_req)[0]
    prob_anomalous = model.predict_proba(X_req)[0, 1]

    return {
        "prediction": int(pred),
        "label": "Anomalous" if pred == 1 else "Valid",
        "prob_anomalous": float(prob_anomalous),
    }