from sqlalchemy import select
from sqlalchemy.orm import Session

from models.entities import User
from models.schemas import UserCreate
from services.auth_service import create_user
from services.region_service import sync_climate_dataset, sync_foco_dataset, sync_state_risk_dataset


def ensure_seed_data(db: Session) -> None:
    existing = db.scalar(select(User.id).limit(1))
    if existing is not None:
        sync_foco_dataset(db)
        sync_climate_dataset(db)
        sync_state_risk_dataset(db)
        return

    create_user(
        db,
        UserCreate(
            name="Ana Ribeiro",
            email="comando@cerradoforca.org",
            organization="Coordenacao Regional do Cerrado",
            role="coordenacao",
            password="cerrado123",
        ),
    )

    create_user(
        db,
        UserCreate(
            name="Lucas Martins",
            email="brigada@cerradoforca.org",
            organization="Brigada Integrada do Cerrado",
            role="brigadista",
            password="brigada123",
        ),
    )

    sync_foco_dataset(db)
    sync_climate_dataset(db)
    sync_state_risk_dataset(db)
