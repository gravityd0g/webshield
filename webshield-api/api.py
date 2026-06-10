import os
import time
import joblib
import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import Dict, Optional

MODEL_PATH = os.getenv("MODEL_PATH", "webshield_rf_v1.joblib")
THRESHOLD = float(os.getenv("ANOMALY_THRESHOLD", "0.85"))

app = FastAPI(title="WebShield ML Inspection API")

_model_artifact = None
_model_mtime = None


class ParsedRequest(BaseModel):
    method: str
    uri: str
    query: str = ""
    headers: Dict[str, str] = Field(default_factory=dict)
    body: str = ""
    client_ip: Optional[str] = None


def load_model_if_needed():
    global _model_artifact, _model_mtime

    current_mtime = os.path.getmtime(MODEL_PATH)

    if _model_artifact is None or current_mtime != _model_mtime:
        _model_artifact = joblib.load(MODEL_PATH)
        _model_mtime = current_mtime

    return _model_artifact


def normalize_headers(headers: Dict[str, str]) -> Dict[str, str]:
    return {k.lower(): v for k, v in headers.items()}


def parsed_request_to_df(req: ParsedRequest) -> pd.DataFrame:
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


def build_features(df: pd.DataFrame, feature_names: list[str]) -> pd.DataFrame:
    """
    - Content-Length numérico
    - len_URI, len_GET_Query, len_POST_Data, len_Cookie, len_User_Agent
    - has_sql_kw, has_xss_kw, has_traversal, has_encoded, has_admin
    - conteos de símbolos
    - reglas CRS extendidas
    - User-Agent fingerprinting
    - pd.get_dummies para Method y Host-Header
    """

    x = pd.DataFrame(index=df.index)

    x["Content-Length"] = pd.to_numeric(
        df["Content-Length"], errors="coerce"
    ).fillna(0)

    attack_text_cols = ["URI", "GET-Query", "POST-Data", "Cookie", "User-Agent"]

    for col in attack_text_cols:
        new_col = "len_" + col.replace("-", "_")
        x[new_col] = df[col].astype(str).str.len()

    request_text = (
        df[attack_text_cols]
        .fillna("")
        .astype(str)
        .agg(" ".join, axis=1)
        .str.lower()
    )

    x["has_sql_kw"] = request_text.str.contains(
        r"\b(?:union|select|drop|insert|delete|update|where|from)\b",
        regex=True
    ).astype(int)

    x["has_xss_kw"] = request_text.str.contains(
        r"script|javascript|onload|onerror|alert|iframe",
        regex=True
    ).astype(int)

    x["has_traversal"] = request_text.str.contains(
        r"\.\./|\.\.\\|/etc/passwd|cmd\.exe|winnt|boot\.ini",
        regex=True
    ).astype(int)

    x["has_encoded"] = request_text.str.contains(
        r"%2f|%3c|%3e|%27|%22|%28|%29",
        regex=True
    ).astype(int)

    x["has_admin"] = request_text.str.contains(
        r"admin|login|password|passwd|root",
        regex=True
    ).astype(int)

    x["cnt_equal"] = request_text.str.count(r"=")
    x["cnt_ampersand"] = request_text.str.count(r"&")
    x["cnt_percent"] = request_text.str.count(r"%")
    x["cnt_slash"] = request_text.str.count(r"/")
    x["cnt_dot"] = request_text.str.count(r"\.")
    x["cnt_quote"] = request_text.str.count(r"'") + request_text.str.count(r'"')
    x["cnt_semicolon"] = request_text.str.count(r";")
    x["cnt_comment"] = request_text.str.count(r"--")

    ua = df["User-Agent"].astype(str).str.lower()

    x["ua_scanner"] = ua.str.contains(
        r"nikto|sqlmap|nmap|w3af|burp|acunetix|nessus|openvas|"
        r"masscan|fimap|wfuzz|skipfish|nuclei|httpx|"
        r"dirb|gobuster|wpscan|hydra|metasploit",
        regex=True
    ).astype(int)

    x["ua_lib"] = ua.str.contains(
        r"curl/|wget/|python-requests|python-urllib|libcurl|"
        r"java/|go-http-client|okhttp|apache-httpclient|node-fetch",
        regex=True
    ).astype(int)

    x["ua_browser"] = ua.str.contains(
        r"mozilla/|applewebkit|chrome/|firefox/|safari/|edge/|opera/",
        regex=True
    ).astype(int)

    x["ua_len"] = ua.str.len()
    x["ua_word_count"] = ua.str.split().str.len().fillna(0)

    x_cat = pd.get_dummies(
        df[["Method", "Host-Header"]],
        drop_first=True,
        dtype=int
    )

    x = pd.concat([x, x_cat], axis=1)
    x = x.fillna(0)

    # Punto crítico: mismas columnas y mismo orden que en entrenamiento
    x = x.reindex(columns=feature_names, fill_value=0)

    return x


@app.get("/health")
def health():
    artifact = load_model_if_needed()
    return {
        "status": "ok",
        "model_version": artifact.get("version"),
        "model_path": MODEL_PATH,
    }


@app.post("/inspect")
def inspect(req: ParsedRequest):
    artifact = load_model_if_needed()

    model = artifact["model"]
    feature_names = artifact["feature_names"]

    df_req = parsed_request_to_df(req)
    x_req = build_features(df_req, feature_names)

    prob_anomalous = float(model.predict_proba(x_req)[0, 1])

    prediction = 1 if prob_anomalous >= THRESHOLD else 0
    label = "anomalous" if prediction == 1 else "valid"
    action = "block" if prediction == 1 else "allow"

    return {
        "label": label,
        "prediction": prediction,
        "prob_anomalous": prob_anomalous,
        "threshold": THRESHOLD,
        "action": action,
        "model_version": artifact.get("version"),
    }