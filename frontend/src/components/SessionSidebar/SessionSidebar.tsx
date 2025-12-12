import React, { useState } from "react";
import type { WhiteboardSession } from "../../hooks/useWhiteboardSessions";

interface SessionSidebarProps {
  sessions: WhiteboardSession[];
  currentSessionId: string | null;
  onCreateNew: () => void;
  onSwitch: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
  onRename: (sessionId: string, newName: string) => void;
}

function SessionSidebar({
  sessions,
  currentSessionId,
  onCreateNew,
  onSwitch,
  onDelete,
  onRename,
}: SessionSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleRename = (sessionId: string) => {
    if (editName.trim()) {
      onRename(sessionId, editName.trim());
    }
    setEditingId(null);
    setEditName("");
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString([], { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="d-flex flex-column h-100 bg-light border-end" style={{ width: "280px" }}>
      <div className="p-3 border-bottom bg-white">
        <h6 className="mb-3 fw-bold">📋 Whiteboard Sessions</h6>
        <button
          className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2"
          onClick={onCreateNew}
        >
          <span style={{ fontSize: "1.2rem" }}>➕</span>
          New Whiteboard
        </button>
      </div>

      <div className="flex-grow-1 overflow-auto p-2">
        {sessions.length === 0 ? (
          <div className="text-center text-muted mt-5">
            <p>No sessions yet</p>
            <small>Create your first whiteboard!</small>
          </div>
        ) : (
          sessions.map((session) => {
            const isActive = session.id === currentSessionId;
            const isEditing = editingId === session.id;

            return (
              <div
                key={session.id}
                className={`card mb-2 ${isActive ? "border-primary" : ""}`}
                style={{ 
                  cursor: "pointer",
                  boxShadow: isActive ? "0 0 0 2px rgba(13, 110, 253, 0.25)" : "none"
                }}
              >
                <div className="card-body p-2">
                  <div
                    className="mb-2 bg-white border rounded d-flex align-items-center justify-content-center"
                    style={{ height: "80px", position: "relative" }}
                    onClick={() => !isEditing && onSwitch(session.id)}
                  >
                    {session.thumbnail ? (
                      <img
                        src={session.thumbnail}
                        alt={session.name}
                        style={{ 
                          maxWidth: "100%", 
                          maxHeight: "100%", 
                          objectFit: "contain" 
                        }}
                      />
                    ) : (
                      <div className="text-muted">
                        <span style={{ fontSize: "2rem" }}>🖼️</span>
                      </div>
                    )}
                    {isActive && (
                      <span
                        className="badge bg-primary position-absolute top-0 end-0 m-1"
                        style={{ fontSize: "0.7rem" }}
                      >
                        Active
                      </span>
                    )}
                  </div>

                  {isEditing ? (
                    <input
                      type="text"
                      className="form-control form-control-sm mb-2"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => handleRename(session.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename(session.id);
                        if (e.key === "Escape") {
                          setEditingId(null);
                          setEditName("");
                        }
                      }}
                      autoFocus
                    />
                  ) : (
                    <div
                      className="fw-bold small mb-1"
                      onClick={() => !isEditing && onSwitch(session.id)}
                      style={{ cursor: "pointer" }}
                    >
                      {session.name}
                    </div>
                  )}

                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted" style={{ fontSize: "0.7rem" }}>
                      {formatDate(session.updatedAt)}
                    </small>
                    
                    <div className="d-flex gap-1">
                      <button
                        className="btn btn-sm btn-outline-secondary p-1"
                        style={{ fontSize: "0.7rem", width: "24px", height: "24px" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(session.id);
                          setEditName(session.name);
                        }}
                        title="Rename"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger p-1"
                        style={{ fontSize: "0.7rem", width: "24px", height: "24px" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Delete "${session.name}"?`)) {
                            onDelete(session.id);
                          }
                        }}
                        title="Delete"
                        disabled={sessions.length === 1}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-2 border-top bg-white">
        <small className="text-muted d-block text-center">
          {sessions.length} session{sessions.length !== 1 ? "s" : ""} saved
        </small>
      </div>
    </div>
  );
}

export default SessionSidebar;