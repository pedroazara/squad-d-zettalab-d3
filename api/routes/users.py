from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from db import get_db
from models.entities import User
from models.schemas import UserAdminItem, UserAdminUpdate, UsersListResponse, UserPublic
from services.authz_service import require_permission

router = APIRouter(tags=["users"])


@router.get("", response_model=UsersListResponse)
def list_users(
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("users.read")),
) -> UsersListResponse:
    safe_limit = max(1, min(limit, 100))
    safe_offset = max(0, offset)

    total = db.scalar(select(func.count()).select_from(User)) or 0
    statement = (
        select(User)
        .order_by(User.created_at.desc(), User.id.desc())
        .limit(safe_limit)
        .offset(safe_offset)
    )
    users = list(db.scalars(statement).all())

    return UsersListResponse(
        items=[UserAdminItem.model_validate(user, from_attributes=True) for user in users],
        total=total,
        limit=safe_limit,
        offset=safe_offset,
    )


@router.get("/{user_id}", response_model=UserAdminItem)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("users.read")),
) -> UserAdminItem:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario nao encontrado")

    return UserAdminItem.model_validate(user, from_attributes=True)


@router.patch("/{user_id}", response_model=UserPublic)
def update_user(
    user_id: int,
    payload: UserAdminUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("users.update")),
) -> UserPublic:
    target_user = db.get(User, user_id)
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario nao encontrado")

    if current_user.id == target_user.id and payload.role is not None and payload.role != current_user.role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nao e permitido alterar o proprio nivel de acesso",
        )

    if current_user.id == target_user.id and payload.active is False:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nao e permitido desativar o proprio usuario",
        )

    if payload.name is not None:
        target_user.name = payload.name
    if payload.organization is not None:
        target_user.organization = payload.organization
    if payload.role is not None:
        target_user.role = payload.role
    if payload.active is not None:
        target_user.active = payload.active

    db.commit()
    db.refresh(target_user)

    return UserPublic.model_validate(target_user, from_attributes=True)
