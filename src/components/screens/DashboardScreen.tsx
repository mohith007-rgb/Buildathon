import React, { useState } from "react";
import type { SpecState } from "../../types";
import { createPracticeSpec } from "../../initialState";

interface DashboardScreenProps {
  specState: SpecState;
  onUpdateSpec: (updater: (prev: SpecState) => SpecState) => void;
  onNavigate: (screenId: any) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  specState,
  onUpdateSpec,
  onNavigate,
}) => {
  const [specFile, setSpecFile] = useState<File | null>(null);
  const [blueprintFile, setBlueprintFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState<string | null>(null);
  const [apiNotice, setApiNotice] = useState<string | null>(null);

  const handleSpecUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSpecFile(file);
      onUpdateSpec((prev) => ({
        ...prev,
        spec_file_name: file.name,
      }));
    }
  };

  const handleBlueprintUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBlueprintFile(file);
      onUpdateSpec((prev) => ({
        ...prev,
        blueprint_file_name: file.name,
      }));
    }
  };

  const loadSampleReferences = () => {
    onUpdateSpec(() => createPracticeSpec());
  };

  const handleSimulatePipeline = () => {
    if (!specFile && !specState.spec_file_name) return;
    setIsProcessing(true);
    setProcessStep("Reading files and extracting tables...");

    setTimeout(() => {
      setProcessStep("Analyzing credit structure and selecting template...");
      setTimeout(() => {
        setProcessStep("Evaluating Bloom's taxonomy verbs and CO statements...");
        setTimeout(() => {
          setProcessStep("Validating against university guidelines (V1-V10)...");
          setTimeout(() => {
            setIsProcessing(false);
            setProcessStep(null);
            setApiNotice(
              "Note: Backend automated parsing (`POST /api/v1/generate`) currently returns HTTP 501 (scheduled for Level 3). You can inspect and edit all specification attributes, mappings, and templates across Screens 2 through 6."
            );
          }, 600);
        }, 600);
      }, 600);
    }, 600);
  };

  // Credit signals
  const creditsLtp = specState.course.credits_ltp || "3:0:0";
  const parts = creditsLtp.split(":").map(Number);
  const practicalCredits = parts[2] || 0;
  const isIntegratedDetected =
    practicalCredits > 0 ||
    specState.course.course_type.toLowerCase().includes("lab");

  return (
    <div className="bento-grid">
      {/* Top Banner: Status & Overview */}
      <div className="col-12">
        <div
          className="bento-card"
          style={{
            background: "linear-gradient(135deg, rgba(26,61,124,0.06) 0%, rgba(37,99,235,0.04) 100%)",
            borderColor: "rgba(26,61,124,0.2)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <span className="badge badge-primary" style={{ marginBottom: "8px" }}>
                Step 1: Document Ingestion
              </span>
              <h2 style={{ margin: "4px 0", fontSize: "1.45rem", color: "var(--primary)" }}>
                Course Specification Intake & Ingestion
              </h2>
              <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.92rem", maxWidth: "680px" }}>
                Upload an existing faculty course specification and an optional question-paper blueprint to initiate automated defect analysis, CO-PO-PSO alignment, and compliance verification.
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <button
                className="btn btn-secondary"
                onClick={loadSampleReferences}
                title="Populate input slots with sample files from sample-inputs/"
              >
                📁 Load Practice File References
              </button>
            </div>
          </div>

          {/* Backend 501 Status Callout */}
          <div
            style={{
              marginTop: "16px",
              padding: "10px 14px",
              borderRadius: "var(--radius-md)",
              background: "rgba(2, 132, 199, 0.08)",
              border: "1px solid rgba(2, 132, 199, 0.25)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "0.86rem",
              color: "#0369a1",
            }}
          >
            <span style={{ fontSize: "1.1rem" }}>ℹ️</span>
            <div>
              <strong>Architecture Status:</strong> The full-stack API server is running. Server route{" "}
              <code>POST /api/v1/generate</code> is scaffolded (HTTP 501 Not Built, reserved for Level 3). You can view, edit, map, check, and export documents interactively across all workspace screens.
            </div>
          </div>
        </div>
      </div>

      {/* Box 1: Course Specification File (Required) */}
      <div className="col-6">
        <div className="bento-card" style={{ height: "100%" }}>
          <div className="bento-card-header">
            <div>
              <h3 className="bento-card-title">1. Course Specification</h3>
              <p className="bento-card-subtitle">Required source document (.docx, .pdf, .html, .doc)</p>
            </div>
            <span className="badge badge-primary">Required</span>
          </div>

          <label className="upload-dropzone" style={{ display: "block" }}>
            <input
              type="file"
              accept=".docx,.pdf,.html,.doc"
              onChange={handleSpecUpload}
              style={{ display: "none" }}
            />
            <div className="dropzone-icon">📄</div>
            <div style={{ fontWeight: 600, color: "var(--primary)", marginBottom: "4px" }}>
              {specFile
                ? specFile.name
                : specState.spec_file_name
                ? specState.spec_file_name
                : "Choose or drop course specification"}
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              {specFile
                ? `${(specFile.size / 1024).toFixed(1)} KB`
                : specState.spec_file_name
                ? "Referenced practice file"
                : "Supports Microsoft Word, PDF, or HTML exports"}
            </div>
          </label>

          {(specFile || specState.spec_file_name) && (
            <div style={{ marginTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="badge badge-success">✓ File Attached</span>
              <button
                className="btn btn-ghost"
                style={{ fontSize: "0.8rem", color: "var(--rose)" }}
                onClick={() => {
                  setSpecFile(null);
                  onUpdateSpec((prev) => ({ ...prev, spec_file_name: undefined }));
                }}
              >
                Remove
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Box 2: Question-Paper Blueprint (Optional) */}
      <div className="col-6">
        <div className="bento-card" style={{ height: "100%" }}>
          <div className="bento-card-header">
            <div>
              <h3 className="bento-card-title">2. Question-Paper Blueprint</h3>
              <p className="bento-card-subtitle">Optional source of truth for COs & units (.doc, .docx)</p>
            </div>
            <span className="badge badge-neutral">Optional</span>
          </div>

          <label className="upload-dropzone" style={{ display: "block" }}>
            <input
              type="file"
              accept=".docx,.pdf,.html,.doc"
              onChange={handleBlueprintUpload}
              style={{ display: "none" }}
            />
            <div className="dropzone-icon" style={{ background: "rgba(79, 70, 229, 0.1)", color: "var(--indigo)" }}>
              📋
            </div>
            <div style={{ fontWeight: 600, color: "var(--indigo)", marginBottom: "4px" }}>
              {blueprintFile
                ? blueprintFile.name
                : specState.blueprint_file_name
                ? specState.blueprint_file_name
                : "Choose or drop blueprint document"}
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              {blueprintFile
                ? `${(blueprintFile.size / 1024).toFixed(1)} KB`
                : specState.blueprint_file_name
                ? "Referenced practice file"
                : "Provides revised Bloom's taxonomy levels and unit coverage"}
            </div>
          </label>

          {(blueprintFile || specState.blueprint_file_name) && (
            <div style={{ marginTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="badge badge-success">✓ File Attached</span>
              <button
                className="btn btn-ghost"
                style={{ fontSize: "0.8rem", color: "var(--rose)" }}
                onClick={() => {
                  setBlueprintFile(null);
                  onUpdateSpec((prev) => ({ ...prev, blueprint_file_name: undefined }));
                }}
              >
                Remove
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Card 3: Detected Signals Bento */}
      <div className="col-4">
        <div className="bento-card">
          <div className="bento-card-header">
            <h3 className="bento-card-title">Detection Signals</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.86rem" }}>
              <span style={{ color: "var(--text-muted)" }}>Credit Structure:</span>
              <span className="badge badge-neutral">{specState.course.credits_ltp || "3:0:0"} (L:T:P)</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.86rem" }}>
              <span style={{ color: "var(--text-muted)" }}>Practical Credits:</span>
              <span style={{ fontWeight: 600 }}>{practicalCredits}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.86rem" }}>
              <span style={{ color: "var(--text-muted)" }}>Detected Template:</span>
              <span className={`badge ${isIntegratedDetected ? "badge-primary" : "badge-neutral"}`}>
                {isIntegratedDetected ? "Integrated (Lab)" : "Non-Lab (Theory)"}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.86rem" }}>
              <span style={{ color: "var(--text-muted)" }}>Active Course Outcomes:</span>
              <span style={{ fontWeight: 600 }}>{specState.course_outcomes.length} defined</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card 4: Action & Pipeline Execution */}
      <div className="col-8">
        <div className="bento-card">
          <div className="bento-card-header">
            <div>
              <h3 className="bento-card-title">Processing Pipeline</h3>
              <p className="bento-card-subtitle">Run automated document parsing, extraction & verification</p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap", marginBottom: "14px" }}>
            <button
              className="btn btn-primary"
              disabled={(!specFile && !specState.spec_file_name) || isProcessing}
              onClick={handleSimulatePipeline}
              style={{ padding: "10px 22px" }}
            >
              {isProcessing ? "Processing Pipeline..." : "⚡ Generate & Verify Spec"}
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => onNavigate("spec")}
            >
              Go to Spec Editor ➔
            </button>
          </div>

          {isProcessing && (
            <div style={{ padding: "12px", background: "var(--primary-light)", borderRadius: "var(--radius-md)", color: "var(--primary)", fontSize: "0.88rem", fontWeight: 500 }}>
              ⏳ {processStep}
            </div>
          )}

          {apiNotice && (
            <div style={{ padding: "12px", background: "#f8fafc", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-md)", fontSize: "0.84rem", color: "var(--text-main)" }}>
              {apiNotice}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
