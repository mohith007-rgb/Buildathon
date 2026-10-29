import React from "react";
import type { ScreenId, Role, WorkflowStatus } from "../types";

interface NavigationProps {
  currentScreen: ScreenId;
  onScreenChange: (screen: ScreenId) => void;
  role: Role;
  onRoleChange: (role: Role) => void;
  workflowStatus: WorkflowStatus;
  serverHealth: string;
  hasAiKey: boolean;
  onOpenSettings: () => void;
  defectsCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentScreen,
  onScreenChange,
  role,
  onRoleChange,
  workflowStatus,
  serverHealth,
  hasAiKey,
  onOpenSettings,
  defectsCount,
}) => {
  const getStatusBadgeClass = (status: WorkflowStatus) => {
    switch (status) {
      case "Approved":
        return "badge-success";
      case "Returned":
        return "badge-danger";
      case "Under Review":
      case "Pending HOD":
        return "badge-warning";
      case "Submitted":
        return "badge-primary";
      default:
        return "badge-neutral";
    }
  };

  return (
    <>
      <header className="top-header">
        <div className="brand-section">
          <div className="brand-logo" title="SpecForge">
            SF
          </div>
          <div className="brand-title-wrap">
            <h1>SpecForge</h1>
            <p>University Course Specification & Mapping Engine</p>
          </div>
        </div>

        <div className="header-controls">
          {/* Workflow Status */}
          <span className={`badge ${getStatusBadgeClass(workflowStatus)}`} title="Current Approval Status">
            {workflowStatus}
          </span>

          {/* Role Switcher */}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.82rem",
              fontWeight: 600,
              color: "var(--text-muted)",
            }}
          >
            Role:
            <select
              className="form-select"
              style={{ padding: "4px 8px", fontSize: "0.82rem", fontWeight: 600 }}
              value={role}
              onChange={(e) => onRoleChange(e.target.value as Role)}
            >
              <option value="Author">Author (Faculty)</option>
              <option value="Reviewer">Reviewer (DAC)</option>
              <option value="HOD">HOD (Department Head)</option>
            </select>
          </label>

          {/* Server Health Pill */}
          <span
            className={`badge ${serverHealth === "up" ? "badge-success" : "badge-warning"}`}
            title={`Express API status: ${serverHealth}`}
          >
            ● Server: {serverHealth}
          </span>

          {/* AI Connection Chip */}
          <span
            className={`badge ${hasAiKey ? "badge-primary" : "badge-neutral"}`}
            title={hasAiKey ? "AI Provider Key Active" : "No AI Key Set in Settings"}
          >
            AI: {hasAiKey ? "Connected" : "No Key"}
          </span>

          {/* Settings Gear */}
          <button
            className="btn btn-secondary"
            style={{ padding: "6px 12px", fontSize: "0.82rem" }}
            onClick={onOpenSettings}
            title="Configure AI Provider & Key"
          >
            ⚙ Settings
          </button>
        </div>
      </header>

      {/* Screen Navigation Tabs */}
      <nav className="nav-bar-wrapper">
        <div className="bento-nav-tabs">
          <button
            className={`nav-tab-btn ${currentScreen === "dashboard" ? "active" : ""}`}
            onClick={() => onScreenChange("dashboard")}
          >
            <span>1. Dashboard & Upload</span>
          </button>

          <button
            className={`nav-tab-btn ${currentScreen === "spec" ? "active" : ""}`}
            onClick={() => onScreenChange("spec")}
          >
            <span>2. Course Spec</span>
          </button>

          <button
            className={`nav-tab-btn ${currentScreen === "mapping" ? "active" : ""}`}
            onClick={() => onScreenChange("mapping")}
          >
            <span>3. CO-PO-PSO Map</span>
          </button>

          <button
            className={`nav-tab-btn ${currentScreen === "validation" ? "active" : ""}`}
            onClick={() => onScreenChange("validation")}
          >
            <span>4. Validation & Defects</span>
            {defectsCount > 0 && <span className="tab-badge" style={{ background: "var(--amber-bg)", color: "var(--amber)" }}>{defectsCount}</span>}
          </button>

          <button
            className={`nav-tab-btn ${currentScreen === "export" ? "active" : ""}`}
            onClick={() => onScreenChange("export")}
          >
            <span>5. Template & Export</span>
          </button>

          <button
            className={`nav-tab-btn ${currentScreen === "workflow" ? "active" : ""}`}
            onClick={() => onScreenChange("workflow")}
          >
            <span>6. Approval Workflow</span>
          </button>
        </div>
      </nav>
    </>
  );
};
