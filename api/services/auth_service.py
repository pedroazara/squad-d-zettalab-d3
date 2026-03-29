from sqlalchemy import select
from sqlalchemy.orm import Session

from models.entities import User
from models.schemas import UserCreate
from services.security_service import hash_password, verify_password


def create_user(db: Session, payload: UserCreate) -> User:
    user = User(
        name=payload.name.strip(),
        email=payload.email.strip().lower(),
        organization=payload.organization.strip(),
        role=payload.role,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_user_by_email(db: Session, email: str) -> User | None:
    statement = select(User).where(User.email == email.strip().lower())
    return db.scalar(statement)


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = get_user_by_email(db, email)

    if not user:
        return None

    if not verify_password(password, user.password_hash):
        return None

    return user
