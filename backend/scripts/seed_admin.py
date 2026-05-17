import argparse
import sys
from pathlib import Path

project_backend_dir = Path(__file__).resolve().parents[1]
if str(project_backend_dir) not in sys.path:
    sys.path.insert(0, str(project_backend_dir))

from app.database import Base, SessionLocal, engine
from app.models import User, UserRole
from app.security import hash_password


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Create a new admin account or promote an existing account to admin."
    )
    parser.add_argument("--email", required=True, help="Email address of the admin account.")
    parser.add_argument("--password", required=True, help="Password for the admin account.")
    parser.add_argument("--full-name", required=True, help="Full name for the admin account.")
    return parser


def seed_admin(email: str, password: str, full_name: str) -> tuple[str, User]:
    Base.metadata.create_all(bind=engine)

    with SessionLocal() as db:
        existing_user = db.query(User).filter(User.email == email).one_or_none()

        if existing_user is None:
            user = User(
                full_name=full_name,
                email=email,
                password_hash=hash_password(password),
                role=UserRole.admin,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            return "created", user

        existing_user.full_name = full_name
        existing_user.password_hash = hash_password(password)
        existing_user.role = UserRole.admin
        db.commit()
        db.refresh(existing_user)
        return "promoted", existing_user


def main() -> int:
    args = build_parser().parse_args()
    action, user = seed_admin(args.email, args.password, args.full_name)

    verb = "Created" if action == "created" else "Promoted"
    print(f"{verb} admin account: {user.email} ({user.full_name})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
