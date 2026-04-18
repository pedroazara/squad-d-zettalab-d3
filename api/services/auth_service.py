from sqlalchemy import select
from sqlalchemy.orm import Session

from models.entities import User
from models.schemas import UserCreate
from services.security_service import hash_password, verify_password

def normalize_email(email: str) -> str:
    return email.strip().lower()


def create_user(db: Session, payload: UserCreate) -> User:
    user = User(
        name=payload.name.strip(),
        email=normalize_email(payload.email),
        organization=payload.organization.strip(),
        role=payload.role,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_user_by_email(db: Session, email: str) -> User | None:
    statement = select(User).where(User.email == normalize_email(email))
    return db.scalar(statement)


def get_user_by_id(db: Session, user_id: int) -> User | None:
    statement = select(User).where(User.id == user_id)
    return db.scalar(statement)


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = get_user_by_email(db, normalize_email(email))

    if not user:
        return None

    if not verify_password(password, user.password_hash):
        return None

    return user
