from fastapi import FastAPI, Request

app = FastAPI()

@app.middleware("http")
async def ml_waf_middleware(request: Request, call_next):
    body_bytes = await request.body()
    body = body_bytes.decode("utf-8", errors="ignore")

    headers = dict(request.headers)

    full_url = str(request.url)
    method = request.method

    result = evaluate_http_request(
        method=method,
        full_url=full_url,
        headers={
            "User-Agent": headers.get("user-agent", ""),
            "Cookie": headers.get("cookie", ""),
            "Content-Length": headers.get("content-length", len(body)),
            "Host": headers.get("host", ""),
        },
        body=body,
    )

    # Primero úsalo en modo monitoreo
    request.state.ml_security_result = result

    # Después de validar falsos positivos, podrías bloquear:
    if result["prob_anomalous"] >= 0.85:
        return JSONResponse(
            status_code=403,
            content={
                "detail": "Request blocked by ML security model",
                "score": result["prob_anomalous"],
            },
        )

    response = await call_next(request)
    return response