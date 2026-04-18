from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from db import get_db
from models.entities import User
from models.schemas import AuthResponse, UserCreate, UserLogin, UserPublic
from services.authz_service import get_current_user, has_permission, require_permission
from services.auth_service import authenticate_user, create_user, get_user_by_email
from services.security_service import create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        409: {"description": "E-mail ja cadastrado"},
        422: {"description": "Payload invalido"},
    },
)
def register(payload: UserCreate, db: Session = Depends(get_db)) -> AuthResponse:
    existing_user = get_user_by_email(db, payload.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="E-mail ja cadastrado. Tente fazer login ou usar outro e-mail.",
        )

    user = create_user(db, payload)
    return AuthResponse(
        message="Cadastro realizado com sucesso",
        token=create_access_token(user_id=user.id, role=user.role),
        user=UserPublic.model_validate(user, from_attributes=True),
    )


@router.post(
    "/login",
    response_model=AuthResponse,
    responses={
        401: {"description": "Credenciais invalidas"},
        422: {"description": "Payload invalido"},
    },
)
def login(payload: UserLogin, db: Session = Depends(get_db)) -> AuthResponse:
    user = authenticate_user(db, payload.email, payload.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais invalidas",
        )

    return AuthResponse(
        message="Login realizado com sucesso",
        token=create_access_token(user_id=user.id, role=user.role),
        user=UserPublic.model_validate(user, from_attributes=True),
    )


@router.get("/me", response_model=UserPublic)
def me(current_user: User = Depends(get_current_user)) -> UserPublic:
    return UserPublic.model_validate(current_user, from_attributes=True)


@router.get("/me/permissions", response_model=list[str])
def my_permissions(current_user: User = Depends(get_current_user)) -> list[str]:
    permission_checks = [
        "users.read",
        "users.create",
        "users.update",
        "users.delete",
        "reports.read",
        "reports.review",
        "risk.read",
        "risk.manage",
    ]
    return [permission for permission in permission_checks if has_permission(current_user.role, permission)]


@router.get("/permissions/reports-review")
def can_review_reports(_: User = Depends(require_permission("reports.review"))) -> dict[str, str]:
    return {"message": "Permissao concedida para revisar reportes"}
