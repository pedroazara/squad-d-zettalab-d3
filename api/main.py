from fastapi import FastAPI

app = FastAPI(title="Cerrado-Forca API", version="0.1.0")

@app.get("/health")
def health():
    return {"status": "ok"}
