from collections.abc import Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from db import get_db
from models.entities import User
from services.auth_service import get_user_by_id
from services.security_service import decode_access_token, is_invalid_token_error

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

ROLE_PERMISSIONS: dict[str, set[str]] = {
    "administrador": {
        "users.read",
        "users.create",
        "users.update",
        "users.delete",
        "reports.read",
        "reports.review",
        "risk.read",
        "risk.manage",
    },
    "coordenacao": {
        "users.read",
        "reports.read",
        "reports.review",
        "risk.read",
    },
    "brigadista": {
        "reports.read",
        "risk.read",
    },
    "fazendeiro": {
        "reports.read",
        "risk.read",
    },
}


def _raise_unauthorized(detail: str = "Nao autenticado") -> None:
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    try:
        payload = decode_access_token(token)
    except Exception as exc:
        if is_invalid_token_error(exc):
            _raise_unauthorized("Token invalido ou expirado")
        raise

    subject = payload.get("sub")
    if not subject:
        _raise_unauthorized("Token sem identificacao de usuario")

    try:
        user_id = int(str(subject))
    except ValueError:
        _raise_unauthorized("Token com identificacao de usuario invalida")

    user = get_user_by_id(db, user_id)
    if not user:
        _raise_unauthorized("Usuario nao encontrado")

    return user


def has_permission(role: str, permission: str) -> bool:
    return permission in ROLE_PERMISSIONS.get(role, set())


def require_permission(permission: str) -> Callable[[User], User]:
    def dependency(current_user: User = Depends(get_current_user)) -> User:
        if has_permission(current_user.role, permission):
            return current_user

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao insuficiente",
        )

    return dependency
