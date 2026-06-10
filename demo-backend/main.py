from fastapi import FastAPI, Request


app = FastAPI(title="Demo Backend")


@app.get("/")
def home():
    return {
        "message": "Request reached the backend",
        "status": "allowed",
    }


@app.get("/search")
def search(q: str = ""):
    return {
        "endpoint": "/search",
        "query": q,
        "message": "Search request processed",
    }


@app.post("/login")
async def login(request: Request):
    body = await request.body()

    return {
        "endpoint": "/login",
        "received_body": body.decode("utf-8", errors="ignore"),
        "message": "Login request reached backend",
    }