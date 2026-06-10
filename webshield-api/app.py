from evaluate_http_request import evaluate_http_request

result = evaluate_http_request(
    method="GET",
    full_url="https://example.com/search?q=1 union select password from users",
    headers={
        "User-Agent": "sqlmap/1.7",
        "Host": "example.com",
        "Cookie": "session=abc123"
    },
    body=""
)

print(result)
