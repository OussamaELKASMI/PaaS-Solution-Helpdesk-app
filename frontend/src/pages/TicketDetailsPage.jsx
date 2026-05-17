import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
import {
  addComment,
  deleteAttachment,
  getStaffUsers,
  getTicket,
  updateTicket,
  uploadAttachment,
} from "../lib/api";

function describeUser(user, fallbackLabel) {
  if (!user) {
    return fallbackLabel;
  }

  return `${user.full_name} (${user.role})`;
}

function formatFileSize(fileSize) {
  if (!fileSize && fileSize !== 0) {
    return "Unknown size";
  }

  if (fileSize < 1024) {
    return `${fileSize} B`;
  }

  if (fileSize < 1024 * 1024) {
    return `${(fileSize / 1024).toFixed(1)} KB`;
  }

  return `${(fileSize / (1024 * 1024)).toFixed(1)} MB`;
}

export default function TicketDetailsPage() {
  const { ticketId } = useParams();
  const { token, user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [comment, setComment] = useState("");
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [staffUsers, setStaffUsers] = useState([]);
  const [workflowForm, setWorkflowForm] = useState({ status: "open", priority: "medium", assigned_to: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [isDeletingAttachmentId, setIsDeletingAttachmentId] = useState("");

  useEffect(() => {
    async function loadPageData() {
      setIsLoading(true);
      setError("");

      try {
        const [ticketResponse, staffResponse] = await Promise.all([
          getTicket(token, ticketId),
          user?.role === "user" ? Promise.resolve([]) : getStaffUsers(token),
        ]);

        setTicket(ticketResponse);
        setStaffUsers(staffResponse);
        setWorkflowForm({
          status: ticketResponse.status,
          priority: ticketResponse.priority,
          assigned_to: ticketResponse.assigned_to || "",
        });
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadPageData();
  }, [ticketId, token, user?.role]);

  async function refreshTicket() {
    const refreshedTicket = await getTicket(token, ticketId);
    setTicket(refreshedTicket);
    return refreshedTicket;
  }

  async function handleCommentSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      await addComment(token, ticketId, { content: comment });
      await refreshTicket();
      setComment("");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAttachmentUpload(event) {
    event.preventDefault();
    if (!selectedAttachment) {
      setError("Please choose a file before uploading.");
      return;
    }

    setError("");
    setIsUploadingAttachment(true);

    try {
      await uploadAttachment(token, ticketId, selectedAttachment);
      await refreshTicket();
      setSelectedAttachment(null);
      event.currentTarget.reset();
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setIsUploadingAttachment(false);
    }
  }

  async function handleAttachmentDelete(attachmentId) {
    setError("");
    setIsDeletingAttachmentId(attachmentId);

    try {
      await deleteAttachment(token, ticketId, attachmentId);
      await refreshTicket();
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setIsDeletingAttachmentId("");
    }
  }

  async function handleWorkflowUpdate(event) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      const updatedTicket = await updateTicket(token, ticketId, {
        ...workflowForm,
        assigned_to: workflowForm.assigned_to || null,
      });
      setTicket(updatedTicket);
      setWorkflowForm({
        status: updatedTicket.status,
        priority: updatedTicket.priority,
        assigned_to: updatedTicket.assigned_to || "",
      });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <p>Loading ticket details...</p>;
  }

  if (error && !ticket) {
    return <p className="error-text">{error}</p>;
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Ticket Detail</span>
          <h2>{ticket.title}</h2>
          <p>{ticket.description}</p>
        </div>
        <div className="page-actions">
          <StatusBadge label={ticket.status.replaceAll("_", " ")} tone={ticket.status} />
          <StatusBadge label={ticket.priority} tone={ticket.priority} />
        </div>
      </header>

      {error ? <p className="error-text">{error}</p> : null}

      <div className="details-grid">
        <div className="panel">
          <h3>Ticket Summary</h3>
          <dl className="detail-list">
            <div>
              <dt>Created By</dt>
              <dd>{describeUser(ticket.creator, ticket.created_by)}</dd>
            </div>
            <div>
              <dt>Assigned To</dt>
              <dd>{describeUser(ticket.assignee, "Unassigned")}</dd>
            </div>
            <div>
              <dt>Comments</dt>
              <dd>{ticket.comments.length}</dd>
            </div>
            <div>
              <dt>Attachments</dt>
              <dd>{ticket.attachments.length}</dd>
            </div>
          </dl>
        </div>

        {user?.role !== "user" ? (
          <form className="panel form-stack" onSubmit={handleWorkflowUpdate}>
            <h3>Workflow Controls</h3>
            <label>
              Status
              <select
                value={workflowForm.status}
                onChange={(event) =>
                  setWorkflowForm((current) => ({ ...current, status: event.target.value }))
                }
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </label>

            <label>
              Priority
              <select
                value={workflowForm.priority}
                onChange={(event) =>
                  setWorkflowForm((current) => ({ ...current, priority: event.target.value }))
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>

            <label>
              Assigned To
              <select
                value={workflowForm.assigned_to}
                onChange={(event) =>
                  setWorkflowForm((current) => ({ ...current, assigned_to: event.target.value }))
                }
              >
                <option value="">Unassigned</option>
                {staffUsers.map((staffUser) => (
                  <option key={staffUser.id} value={staffUser.id}>
                    {staffUser.full_name} ({staffUser.role})
                  </option>
                ))}
              </select>
            </label>

            <button type="submit" className="primary-button" disabled={isSaving}>
              {isSaving ? "Saving..." : "Update Ticket"}
            </button>
          </form>
        ) : null}
      </div>

      <div className="details-grid">
        <div className="panel">
          <h3>Comments</h3>
          <div className="comment-list">
            {ticket.comments.length === 0 ? <p>No comments yet.</p> : null}
            {ticket.comments.map((item) => (
              <article key={item.id} className="comment-card">
                <div className="comment-meta">
                  <strong>{item.author.full_name}</strong>
                  <span>{item.author.role}</span>
                </div>
                <p>{item.content}</p>
              </article>
            ))}
          </div>

          <form className="form-stack" onSubmit={handleCommentSubmit}>
            <label>
              Add Comment
              <textarea
                rows="4"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                required
              />
            </label>

            <button type="submit" className="primary-button" disabled={isSaving}>
              {isSaving ? "Saving..." : "Post Comment"}
            </button>
          </form>
        </div>

        <div className="panel">
          <h3>Attachments</h3>
          <form className="form-stack attachment-upload-form" onSubmit={handleAttachmentUpload}>
            <label>
              Upload file
              <input
                type="file"
                onChange={(event) => setSelectedAttachment(event.target.files?.[0] || null)}
              />
            </label>
            <span className="field-hint">
              Local MVP uploads are stored on the backend container now. We can swap this to Azure Blob Storage later.
            </span>
            <button type="submit" className="primary-button" disabled={isUploadingAttachment}>
              {isUploadingAttachment ? "Uploading..." : "Upload Attachment"}
            </button>
          </form>

          <div className="attachment-list">
            {ticket.attachments.length === 0 ? <p>No attachments yet.</p> : null}
            {ticket.attachments.map((item) => (
              <div key={item.id} className="attachment-card">
                <a href={item.blob_url} target="_blank" rel="noreferrer" className="attachment-link">
                  <strong>{item.file_name}</strong>
                  <span>{item.mime_type || "unknown type"}</span>
                  <span className="muted-text">
                    Uploaded by {item.uploader.full_name} - {formatFileSize(item.file_size)}
                  </span>
                </a>
                {(user?.role !== "user" || item.uploaded_by === user?.id) ? (
                  <button
                    type="button"
                    className="danger-button"
                    disabled={isDeletingAttachmentId === item.id}
                    onClick={() => handleAttachmentDelete(item.id)}
                  >
                    {isDeletingAttachmentId === item.id ? "Removing..." : "Remove"}
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
