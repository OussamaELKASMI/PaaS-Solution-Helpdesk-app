from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import require_roles
from ..models import Ticket, TicketStatus, User, UserRole
from ..schemas import AdminStats


router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats", response_model=AdminStats)
def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin)),
) -> AdminStats:
    del current_user

    total_users = db.scalar(select(func.count()).select_from(User)) or 0
    total_tickets = db.scalar(select(func.count()).select_from(Ticket)) or 0

    counts_by_status = {status.value: 0 for status in TicketStatus}
    for ticket_status, count in db.execute(select(Ticket.status, func.count()).group_by(Ticket.status)).all():
        counts_by_status[ticket_status.value] = count

    return AdminStats(
        total_users=total_users,
        total_tickets=total_tickets,
        open_tickets=counts_by_status[TicketStatus.open.value],
        in_progress_tickets=counts_by_status[TicketStatus.in_progress.value],
        resolved_tickets=counts_by_status[TicketStatus.resolved.value],
        closed_tickets=counts_by_status[TicketStatus.closed.value],
    )

