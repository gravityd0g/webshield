import warnings

from sklearn.exceptions import InconsistentVersionWarning

warnings.filterwarnings("ignore", category=InconsistentVersionWarning)

from evaluate_http_request import evaluate_http_request

EXAMPLES = [
    {
        "name": "Valid request",
        "method": "GET",
        "full_url": "https://www.achnprea.biz/uXs5t/usEyiwescor/jQQhxlxRoZpFspA/eEUWe8_r/rZapvrQTZ0A0yE9ZVL/4k/ij7oXvcS/Ywp-6LoBMra_Y/MlAJQ21iTF.js",
        "headers": {
            "User-Agent": "Mozilla/2.0 (Windows; U; Windows NT 8.4; al-li; rv:2.0.2) Gecko/99823491",
            "Host": "www.achnprea.biz",
            "Host-Header": "HTTP/1.0",
            "Cookie": "k38e=up7BR_5fJ7;qNi=kb",
        },
        "body": "",
    },
    {
        "name": "SQL injection + sqlmap",
        "method": "GET",
        "full_url": "https://example.com/search?q=1+union+select+password+from+users",
        "headers": {
            "User-Agent": "sqlmap/1.7",
            "Host": "example.com",
            "Host-Header": "HTTP/1.1",
            "Cookie": "session=abc123",
        },
        "body": "",
    },
    {
        "name": "Path traversal",
        "method": "GET",
        "full_url": "https://example.com/../../../../etc/passwd",
        "headers": {
            "User-Agent": "python-requests/2.31.0",
            "Host": "example.com",
            "Host-Header": "HTTP/1.1",
        },
        "body": "",
    },
]

if __name__ == "__main__":
    print("WebShield model — 3 examples\n")

    for i, case in enumerate(EXAMPLES, 1):
        result = evaluate_http_request(
            method=case["method"],
            full_url=case["full_url"],
            headers=case["headers"],
            body=case["body"],
        )
        print(f"{i}. {case['name']}")
        print(f"   {result}\n")
