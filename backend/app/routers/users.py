from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user, require_roles
from ..models import User, UserRole
from ..schemas import UserRead, UserRoleUpdate


router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserRead)
def get_me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.get("", response_model=list[UserRead])
def list_users(
    role: UserRole | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.agent, UserRole.admin)),
) -> list[User]:
    del current_user

    statement = select(User)
    if role is not None:
        statement = statement.where(User.role == role)

    statement = statement.order_by(User.created_at.asc())
    return list(db.scalars(statement).all())


@router.get("/staff", response_model=list[UserRead])
def list_staff_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.agent, UserRole.admin)),
) -> list[User]:
    del current_user

    statement = (
        select(User)
        .where(User.role.in_([UserRole.agent, UserRole.admin]))
        .order_by(User.full_name.asc())
    )
    return list(db.scalars(statement).all())


@router.patch("/{user_id}/role", response_model=UserRead)
def update_user_role(
    user_id: str,
    payload: UserRoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin)),
) -> User:
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="For this MVP, admins cannot change their own role from the dashboard.",
        )

    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    user.role = payload.role
    db.commit()
    db.refresh(user)
    return user
