import React, { useState } from "react";
import type { SpecState, Role, WorkflowStatus, AuditLogEntry } from "../../types";
import { call } from "../../api";

interface WorkflowScreenProps {
  specState: SpecState;
  onUpdateSpec: (updater: (prev: SpecState) => SpecState) => void;
  role: Role;
}

const WORKFLOW_STEPS: WorkflowStatus[] = [
  "Draft",
  "Submitted",
  "Under Review",
  "Pending HOD",
  "Approved",
];

export const WorkflowScreen: React.FC<WorkflowScreenProps> = ({
  specState,
  onUpdateSpec,
  role,
}) => {
  const [commentText, setCommentText] = useState("");
  const [transitionError, setTransitionError] = useState<string | null>(null);
  const currentStatus = specState.workflow_status;

  const addAuditEntry = (action: string, newStatus: WorkflowStatus, comment?: string) => {
    const entry: AuditLogEntry = {
      id: `log-${Date.now()}`,
      user: role === "Author" ? "Course Coordinator" : role === "Reviewer" ? "DAC Reviewer" : "Head of Department",
      role,
      timestamp: new Date().toISOString(),
      action,
      comment: comment || undefined,
    };

    onUpdateSpec((prev) => ({
      ...prev,
      workflow_status: newStatus,
      audit_log: [entry, ...prev.audit_log],
    }));
    setCommentText("");
  };

  const executeTransition = async (action: string, newStatus: WorkflowStatus, comment?: string) => {
    setTransitionError(null);
    try {
      await call<{ fromStatus: string; toStatus: string }>("/workflow/transition", {
        method: "POST",
        body: JSON.stringify({
          fromStatus: currentStatus,
          toStatus: newStatus,
          comment,
        }),
      });
      addAuditEntry(action, newStatus, comment);
    } catch (err) {
      setTransitionError((err as Error).message);
    }
  };

  // Workflow actions
  const handleAuthorSubmit = () => {
    executeTransition("Submitted course specification for DAC review", "Submitted", commentText);
  };

  const handleReviewerStart = () => {
    executeTransition("Opened specification for formal review", "Under Review", commentText);
  };

  const handleReviewerForward = () => {
    executeTransition("Endorsed and forwarded to Head of Department", "Pending HOD", commentText);
  };

  const handleReviewerReturn = () => {
    executeTransition("Returned to Author with revision remarks", "Returned", commentText);
  };

  const handleHodApprove = () => {
    executeTransition("Approved specification for academic curriculum inclusion", "Approved", commentText);
  };

  const handleHodReturn = () => {
    executeTransition("Returned for curricular remediation", "Returned", commentText);
  };

  return (
    <div className="bento-grid">
      {/* Top Banner & Stepper */}
      <div className="col-12">
        <div className="bento-card">
          <div className="bento-card-header">
            <div>
              <span className="badge badge-primary" style={{ marginBottom: "6px" }}>
                Governance & Institutional Quality
              </span>
              <h2 className="bento-card-title" style={{ fontSize: "1.3rem" }}>
                Curriculum Approval Workflow
              </h2>
              <p className="bento-card-subtitle">
                Role-gated multi-stage signoff: Author ➔ Department Academic Committee (DAC) ➔ Head of Department
              </p>
            </div>
            <span className={`badge ${currentStatus === "Approved" ? "badge-success" : currentStatus === "Returned" ? "badge-danger" : "badge-warning"}`} style={{ fontSize: "0.88rem", padding: "6px 14px" }}>
              Current State: {currentStatus}
            </span>
          </div>

          {/* Stepper Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              position: "relative",
              padding: "24px 16px 12px 16px",
              marginTop: "10px",
              overflowX: "auto",
            }}
          >
            {WORKFLOW_STEPS.map((step, idx) => {
              const isPast = WORKFLOW_STEPS.indexOf(currentStatus) >= idx && currentStatus !== "Returned";
              const isCurrent = currentStatus === step;

              return (
                <div key={step} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", position: "relative", zIndex: 2, minWidth: "100px" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      background: isCurrent ? "var(--primary)" : isPast ? "var(--emerald)" : "#f1f5f9",
                      color: isCurrent || isPast ? "#fff" : "var(--text-dim)",
                      border: isCurrent ? "3px solid #bfdbfe" : "1px solid var(--glass-border)",
                      boxShadow: isCurrent ? "0 0 12px rgba(26,61,124,0.3)" : "none",
                      transition: "all 0.2s",
                    }}
                  >
                    {isPast && !isCurrent ? "✓" : idx + 1}
                  </div>
                  <span
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: isCurrent ? 700 : 500,
                      color: isCurrent ? "var(--primary)" : isPast ? "var(--text-main)" : "var(--text-muted)",
                    }}
                  >
                    {step}
                  </span>
                </div>
              );
            })}
          </div>

          {currentStatus === "Returned" && (
            <div
              style={{
                marginTop: "16px",
                padding: "10px 16px",
                background: "var(--rose-bg)",
                border: "1px solid var(--rose-border)",
                borderRadius: "var(--radius-md)",
                color: "var(--rose)",
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <span>⚠️</span>
              <div>
                <strong>Returned for Revision:</strong> The specification was returned to the Author with review comments. Only the Author can edit content in this state.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Role Action Card */}
      <div className="col-6">
        <div className="bento-card" style={{ height: "100%" }}>
          <div className="bento-card-header">
            <div>
              <h3 className="bento-card-title">Role Actions ({role})</h3>
              <p className="bento-card-subtitle">Permitted actions for your active user persona</p>
            </div>
            <span className="badge badge-primary">{role} Active</span>
          </div>

          {/* Comment Box */}
          <div className="form-group">
            <label className="form-label">Review Comment / Remarks</label>
            <textarea
              className="form-textarea"
              placeholder="Enter audit remarks or revision feedback (required when returning)..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={3}
            />
          </div>

          {transitionError && (
            <div
              style={{
                marginBottom: "10px",
                padding: "8px 12px",
                background: "var(--rose-bg)",
                border: "1px solid var(--rose-border)",
                borderRadius: "var(--radius-md)",
                color: "var(--rose)",
                fontSize: "0.82rem",
                fontWeight: 500,
              }}
            >
              ⚠️ {transitionError}
            </div>
          )}

          {/* Action Buttons based on role */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {/* Author Actions */}
            {role === "Author" && (
              <>
                <button
                  className="btn btn-primary"
                  disabled={currentStatus !== "Draft" && currentStatus !== "Returned"}
                  onClick={handleAuthorSubmit}
                >
                  📤 Submit Specification for Review
                </button>
                {(currentStatus !== "Draft" && currentStatus !== "Returned") && (
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    Submission disabled: Document is currently under formal committee evaluation.
                  </span>
                )}
              </>
            )}

            {/* Reviewer Actions */}
            {role === "Reviewer" && (
              <>
                {currentStatus === "Submitted" && (
                  <button className="btn btn-secondary" onClick={handleReviewerStart}>
                    🔍 Open & Mark "Under Review"
                  </button>
                )}

                <button
                  className="btn btn-primary"
                  disabled={currentStatus !== "Under Review" && currentStatus !== "Submitted"}
                  onClick={handleReviewerForward}
                >
                  ⏩ Forward to Head of Department (HOD)
                </button>

                <button
                  className="btn btn-danger"
                  disabled={(!currentStatus.includes("Review") && currentStatus !== "Submitted") || !commentText.trim()}
                  onClick={handleReviewerReturn}
                >
                  ↩ Return to Author with Comment
                </button>

                {!commentText.trim() && (
                  <span style={{ fontSize: "0.76rem", color: "var(--amber)" }}>
                    * Comment is required to return a specification.
                  </span>
                )}
              </>
            )}

            {/* HOD Actions */}
            {role === "HOD" && (
              <>
                <button
                  className="btn btn-primary"
                  disabled={currentStatus !== "Pending HOD"}
                  onClick={handleHodApprove}
                >
                  🏆 Approve Specification (Official Release)
                </button>

                <button
                  className="btn btn-danger"
                  disabled={currentStatus !== "Pending HOD" || !commentText.trim()}
                  onClick={handleHodReturn}
                >
                  ↩ Return for Remediation
                </button>

                {currentStatus !== "Pending HOD" && (
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    HOD signoff requires prior review completion by the DAC reviewer.
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Audit Trail Timeline */}
      <div className="col-6">
        <div className="bento-card" style={{ height: "100%", maxHeight: "500px", overflowY: "auto" }}>
          <div className="bento-card-header">
            <div>
              <h3 className="bento-card-title">Governance Audit Log</h3>
              <p className="bento-card-subtitle">Immutable timeline of institutional decisions</p>
            </div>
            <span className="badge badge-neutral">{specState.audit_log.length} events</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {specState.audit_log.map((entry) => (
              <div
                key={entry.id}
                style={{
                  padding: "12px",
                  borderRadius: "var(--radius-md)",
                  background: "rgba(255, 255, 255, 0.8)",
                  border: "1px solid var(--glass-border)",
                  borderLeft: `4px solid ${
                    entry.role === "HOD"
                      ? "var(--emerald)"
                      : entry.role === "Reviewer"
                      ? "var(--indigo)"
                      : "var(--primary)"
                  }`,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <span style={{ fontWeight: 600, fontSize: "0.86rem", color: "var(--text-main)" }}>
                    {entry.action}
                  </span>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                    {new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                <div style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "0.76rem", color: "var(--text-muted)" }}>
                  <span>By: <strong>{entry.user}</strong></span>
                  <span className="badge badge-neutral" style={{ padding: "1px 6px" }}>{entry.role}</span>
                </div>

                {entry.comment && (
                  <div
                    style={{
                      marginTop: "6px",
                      padding: "6px 8px",
                      borderRadius: "var(--radius-sm)",
                      background: "#f1f5f9",
                      fontSize: "0.8rem",
                      color: "var(--text-main)",
                      fontStyle: "italic",
                    }}
                  >
                    "{entry.comment}"
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
