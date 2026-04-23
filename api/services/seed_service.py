from sqlalchemy import select
from sqlalchemy.orm import Session

from models.entities import User
from models.schemas import UserCreate
from services.auth_service import create_user
from services.region_service import (
    sync_burn_scar_dataset,
    sync_climate_dataset,
    sync_cross_risk_dataset,
    sync_fire_points_dataset,
    sync_foco_dataset,
    sync_pasture_risk_dataset,
    sync_state_risk_dataset,
)


def _run_all_dataset_syncs(db: Session) -> None:
    steps = [
        ("burn_scar", sync_burn_scar_dataset),
        ("pasture_risk", sync_pasture_risk_dataset),
        ("cross_risk", sync_cross_risk_dataset),
        ("fire_points", sync_fire_points_dataset),
        ("climate", sync_climate_dataset),
        ("foco", sync_foco_dataset),
        ("state_risk", sync_state_risk_dataset),
    ]

    for step_name, step_fn in steps:
        try:
            step_fn(db)
        except Exception as exc:
            raise RuntimeError(f"Falha no seed durante a etapa '{step_name}': {exc}") from exc


def ensure_seed_data(db: Session) -> None:
    existing = db.scalar(select(User.id).limit(1))
    if existing is not None:
        _run_all_dataset_syncs(db)
        return

    create_user(
        db,
        UserCreate(
            name="Ana Ribeiro",
            email="comando@guarawatch.org",
            organization="Coordenacao Regional do Cerrado",
            role="coordenacao",
            password="guarawatch123",
        ),
    )

    create_user(
        db,
        UserCreate(
            name="Lucas Martins",
            email="brigada@guarawatch.org",
            organization="Brigada Integrada do Cerrado",
            role="brigadista",
            password="brigada123",
        ),
    )

    _run_all_dataset_syncs(db)
