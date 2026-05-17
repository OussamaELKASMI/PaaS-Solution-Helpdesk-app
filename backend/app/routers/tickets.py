from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload
from urllib.parse import urlparse

from ..config import settings
from ..database import get_db
from ..dependencies import get_current_user
from ..models import Attachment, Comment, Ticket, TicketPriority, TicketStatus, User, UserRole
from ..schemas import (
    AttachmentRead,
    CommentCreate,
    CommentRead,
    TicketCreate,
    TicketRead,
    TicketSummary,
    TicketUpdate,
)


router = APIRouter(prefix="/tickets", tags=["tickets"])


ticket_list_load_options = (
    selectinload(Ticket.creator),
    selectinload(Ticket.assignee),
)

ticket_detail_load_options = (
    selectinload(Ticket.creator),
    selectinload(Ticket.assignee),
    selectinload(Ticket.comments).selectinload(Comment.author),
    selectinload(Ticket.attachments).selectinload(Attachment.uploader),
)


def validate_staff_assignee(assignee: User) -> None:
    if assignee.role not in {UserRole.agent, UserRole.admin}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tickets can only be assigned to support agents or admins.",
        )


def get_ticket_or_404(ticket_id: str, db: Session) -> Ticket:
    statement = (
        select(Ticket)
        .where(Ticket.id == ticket_id)
        .options(*ticket_detail_load_options)
    )
    ticket = db.scalar(statement)
    if ticket is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found.")
    return ticket


def ensure_ticket_access(ticket: Ticket, current_user: User) -> None:
    if current_user.role == UserRole.user and ticket.created_by != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this ticket.")


def build_attachment_url(request: Request, stored_name: str) -> str:
    base_url = str(request.base_url).rstrip("/")
    return f"{base_url}/uploads/{stored_name}"


def save_uploaded_file(upload: UploadFile) -> tuple[str, int]:
    original_suffix = Path(upload.filename or "").suffix
    stored_name = f"{uuid4().hex}{original_suffix}"
    destination = settings.uploads_dir_path / stored_name

    total_bytes = 0
    with destination.open("wb") as output_file:
        while True:
            chunk = upload.file.read(1024 * 1024)
            if not chunk:
                break
            total_bytes += len(chunk)
            if total_bytes > settings.max_attachment_size_bytes:
                output_file.close()
                destination.unlink(missing_ok=True)
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"Attachment exceeds the {settings.max_attachment_size_mb} MB limit.",
                )
            output_file.write(chunk)

    return stored_name, total_bytes


def delete_local_attachment_file(attachment: Attachment) -> None:
    parsed_url = urlparse(attachment.blob_url)
    stored_name = Path(parsed_url.path).name
    if not stored_name:
        return

    file_path = settings.uploads_dir_path / stored_name
    file_path.unlink(missing_ok=True)


def can_manage_attachment(attachment: Attachment, current_user: User) -> bool:
    return current_user.role in {UserRole.agent, UserRole.admin} or attachment.uploaded_by == current_user.id


@router.get("", response_model=list[TicketSummary])
def list_tickets(
    status_filter: TicketStatus | None = None,
    priority: TicketPriority | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Ticket]:
    statement = select(Ticket).options(*ticket_list_load_options)

    if current_user.role == UserRole.user:
        statement = statement.where(Ticket.created_by == current_user.id)

    if status_filter is not None:
        statement = statement.where(Ticket.status == status_filter)

    if priority is not None:
        statement = statement.where(Ticket.priority == priority)

    statement = statement.order_by(Ticket.created_at.desc())
    return list(db.scalars(statement).all())


@router.post("", response_model=TicketRead, status_code=status.HTTP_201_CREATED)
def create_ticket(
    payload: TicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Ticket:
    if payload.assigned_to and current_user.role == UserRole.user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only agents or admins can assign tickets during creation.",
        )

    if payload.assigned_to:
        assignee = db.get(User, payload.assigned_to)
        if assignee is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Assigned user does not exist.")
        validate_staff_assignee(assignee)

    ticket = Ticket(
        title=payload.title,
        description=payload.description,
        priority=payload.priority,
        created_by=current_user.id,
        assigned_to=payload.assigned_to,
    )
    db.add(ticket)
    db.commit()
    return get_ticket_or_404(ticket.id, db)


@router.get("/{ticket_id}", response_model=TicketRead)
def get_ticket(
    ticket_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Ticket:
    ticket = get_ticket_or_404(ticket_id, db)
    ensure_ticket_access(ticket, current_user)
    return ticket


@router.patch("/{ticket_id}", response_model=TicketRead)
def update_ticket(
    ticket_id: str,
    payload: TicketUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Ticket:
    ticket = get_ticket_or_404(ticket_id, db)
    ensure_ticket_access(ticket, current_user)

    if payload.title is not None:
        if current_user.role == UserRole.user and ticket.created_by != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot edit this ticket.")
        ticket.title = payload.title

    if payload.description is not None:
        if current_user.role == UserRole.user and ticket.created_by != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot edit this ticket.")
        ticket.description = payload.description

    privileged_update_requested = any(
        value is not None for value in [payload.status, payload.priority, payload.assigned_to]
    )
    if privileged_update_requested and current_user.role == UserRole.user:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only agents or admins can manage workflow.")

    if payload.status is not None:
        ticket.status = payload.status

    if payload.priority is not None:
        ticket.priority = payload.priority

    if payload.assigned_to is not None:
        if payload.assigned_to:
            assignee = db.get(User, payload.assigned_to)
            if assignee is None:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Assigned user does not exist.")
            validate_staff_assignee(assignee)
        ticket.assigned_to = payload.assigned_to

    db.commit()
    return get_ticket_or_404(ticket.id, db)


@router.post("/{ticket_id}/comments", response_model=CommentRead, status_code=status.HTTP_201_CREATED)
def add_comment(
    ticket_id: str,
    payload: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Comment:
    ticket = get_ticket_or_404(ticket_id, db)
    ensure_ticket_access(ticket, current_user)

    comment = Comment(ticket_id=ticket.id, user_id=current_user.id, content=payload.content)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


@router.post("/{ticket_id}/attachments", response_model=AttachmentRead, status_code=status.HTTP_201_CREATED)
def upload_attachment(
    ticket_id: str,
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Attachment:
    ticket = get_ticket_or_404(ticket_id, db)
    ensure_ticket_access(ticket, current_user)

    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Please choose a file to upload.")

    stored_name, file_size = save_uploaded_file(file)
    attachment = Attachment(
        ticket_id=ticket.id,
        uploaded_by=current_user.id,
        file_name=file.filename,
        blob_url=build_attachment_url(request, stored_name),
        mime_type=file.content_type,
        file_size=file_size,
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    return attachment


@router.delete("/{ticket_id}/attachments/{attachment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_attachment(
    ticket_id: str,
    attachment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    ticket = get_ticket_or_404(ticket_id, db)
    ensure_ticket_access(ticket, current_user)

    attachment = db.scalar(select(Attachment).where(Attachment.id == attachment_id, Attachment.ticket_id == ticket_id))
    if attachment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attachment not found.")

    if not can_manage_attachment(attachment, current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot delete this attachment.")

    delete_local_attachment_file(attachment)
    db.delete(attachment)
    db.commit()
