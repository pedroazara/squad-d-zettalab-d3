from contextlib import asynccontextmanager

from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware

from db import Base, engine
from routes.auth import router as auth_router
from routes.fires import router as fires_router
from routes.regions import router as regions_router
from routes.reports import router as reports_router
from routes.risk import router as risk_router


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    # Nota: Ingestão de dados movida para scripts/seed.py
    # Executar manualmente: python scripts/seed.py
    yield


app = FastAPI(
    title="Cerrado-Forca API",
    version="0.2.0",
    description="API inicial para autenticação, risco de incêndio e reportes colaborativos.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:4173",
        "http://localhost:4173",
        "http://127.0.0.1:5173",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(regions_router)
app.include_router(risk_router)
app.include_router(fires_router)
app.include_router(reports_router)


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/", tags=["health"])
def root() -> dict[str, str]:
    return {"message": "Cerrado-Forca API online", "docs": "/docs"}


@app.get("/favicon.ico", include_in_schema=False)
def favicon() -> Response:
    return Response(status_code=204)
