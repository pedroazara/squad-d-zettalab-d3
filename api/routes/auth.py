from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from db import get_db
from models.schemas import AuthResponse, UserCreate, UserLogin, UserPublic
from services.auth_service import authenticate_user, create_user, get_user_by_email
from services.security_service import generate_access_token

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
        token=generate_access_token(),
        user=UserPublic.model_validate(user, from_attributes=True),
    )


@router.post("/login", response_model=AuthResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)) -> AuthResponse:
    user = authenticate_user(db, payload.email, payload.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais invalidas",
        )

    return AuthResponse(
        message="Login realizado com sucesso",
        token=generate_access_token(),
        user=UserPublic.model_validate(user, from_attributes=True),
    )
