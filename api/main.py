from contextlib import asynccontextmanager
import os

from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware

from db import Base, engine, ensure_users_active_column
from routes.auth import router as auth_router
from routes.climate import router as climate_router
from routes.fires import router as fires_router
from routes.regions import router as regions_router
from routes.reports import router as reports_router
from routes.risk import router as risk_router
from routes.users import router as users_router


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    ensure_users_active_column()
    # Nota: Ingestão de dados movida para scripts/seed.py
    # Executar manualmente: python scripts/seed.py
    yield


app = FastAPI(
    title="GuaraWatch API",
    version="0.2.0",
    description="API inicial para autenticação, risco de incêndio e reportes colaborativos.",
    lifespan=lifespan,
)


def get_cors_origins() -> list[str]:
    configured = os.getenv("CORS_ALLOW_ORIGINS", "").strip()
    if configured:
        return [origin.strip() for origin in configured.split(",") if origin.strip()]

    return [
        "http://127.0.0.1:4173",
        "http://localhost:4173",
        "http://127.0.0.1:5173",
        "http://localhost:5173",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(regions_router)
app.include_router(risk_router)
app.include_router(fires_router)
app.include_router(climate_router)
app.include_router(reports_router)
app.include_router(users_router)


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/", tags=["health"])
def root() -> dict[str, str]:
    return {"message": "GuaraWatch API online", "docs": "/docs"}


@app.get("/favicon.ico", include_in_schema=False)
def favicon() -> Response:
    return Response(status_code=204)
