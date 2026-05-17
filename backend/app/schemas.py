from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from .models import TicketPriority, TicketStatus, UserRole


class UserRegister(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserRoleUpdate(BaseModel):
    role: UserRole


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    full_name: str
    email: EmailStr
    role: UserRole


class UserRead(UserSummary):
    model_config = ConfigDict(from_attributes=True)

    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


class CommentCreate(BaseModel):
    content: str = Field(min_length=1)


class CommentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    ticket_id: str
    user_id: str
    author: UserSummary
    content: str
    created_at: datetime


class AttachmentCreate(BaseModel):
    file_name: str = Field(min_length=1, max_length=255)
    blob_url: str = Field(min_length=1)
    mime_type: str | None = None
    file_size: int | None = Field(default=None, ge=0)


class AttachmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    ticket_id: str
    uploaded_by: str
    uploader: UserSummary
    file_name: str
    blob_url: str
    mime_type: str | None
    file_size: int | None
    created_at: datetime


class TicketCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=10)
    priority: TicketPriority = TicketPriority.medium
    assigned_to: str | None = None


class TicketUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=200)
    description: str | None = Field(default=None, min_length=10)
    status: TicketStatus | None = None
    priority: TicketPriority | None = None
    assigned_to: str | None = None


class TicketSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    status: TicketStatus
    priority: TicketPriority
    created_by: str
    assigned_to: str | None
    creator: UserSummary
    assignee: UserSummary | None = None
    created_at: datetime
    updated_at: datetime


class TicketRead(TicketSummary):
    description: str
    comments: list[CommentRead] = Field(default_factory=list)
    attachments: list[AttachmentRead] = Field(default_factory=list)


class AdminStats(BaseModel):
    total_users: int
    total_tickets: int
    open_tickets: int
    in_progress_tickets: int
    resolved_tickets: int
    closed_tickets: int
