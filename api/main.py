from contextlib import asynccontextmanager

from fastapi import FastAPI

from db import Base, SessionLocal, engine
from routes.auth import router as auth_router
from routes.regions import router as regions_router
from routes.reports import router as reports_router
from routes.risk import router as risk_router
from services.seed_service import ensure_seed_data


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)

    with SessionLocal() as db:
        ensure_seed_data(db)

    yield


app = FastAPI(
    title="Cerrado-Forca API",
    version="0.2.0",
    description="API inicial para autenticação, risco de incêndio e reportes colaborativos.",
    lifespan=lifespan,
)

app.include_router(auth_router)
app.include_router(regions_router)
app.include_router(risk_router)
app.include_router(reports_router)


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok"}
