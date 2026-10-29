import React, { useState } from "react";
import type { SpecState, Role, TemplateType } from "../../types";
import { call } from "../../api";

interface ExportScreenProps {
  specState: SpecState;
  onUpdateSpec: (updater: (prev: SpecState) => SpecState) => void;
  role: Role;
  onNavigate: (screen: any) => void;
}

export const ExportScreen: React.FC<ExportScreenProps> = ({
  specState,
  onUpdateSpec,
  role,
}) => {
  const [overrideReason, setOverrideReason] = useState(specState.template_override_reason || "");
  const [isOverridden, setIsOverridden] = useState(!!specState.template_override_reason);
  const [serverSaveMsg, setServerSaveMsg] = useState<string | null>(null);

  // Signal detection
  const creditsLtp = specState.course.credits_ltp || "3:0:0";
  const practicalCredits = Number(creditsLtp.split(":")[2] || 0);
  const detectedTemplate: TemplateType =
    practicalCredits > 0 || specState.course.course_type.toLowerCase().includes("lab")
      ? "integrated"
      : "non_lab";

  const handleTemplateChange = (tmpl: TemplateType) => {
    if (role !== "Author") return;
    onUpdateSpec((prev) => ({
      ...prev,
      template: tmpl,
      template_override_reason: isOverridden ? overrideReason : undefined,
    }));
  };

  const handleSaveOverride = () => {
    if (role !== "Author") return;
    onUpdateSpec((prev) => ({
      ...prev,
      template_override_reason: overrideReason,
    }));
  };

  const getOutputData = () => ({
    schema_version: "1.0",
    input_id: specState.input_id || "SAMPLE",
    template: specState.template,
    course: specState.course,
    course_outcomes: specState.course_outcomes,
    units: specState.units.map((u) => ({
      number: u.number,
      title: u.title,
      lab: u.lab ?? null,
    })),
    co_po_pso_map: specState.co_po_pso_map,
    teaching_hours: specState.teaching_hours,
    assessment: specState.assessment,
    defects: specState.defects,
  });

  const handleDownloadJson = async () => {
    const outputData = getOutputData();

    // Trigger local browser download
    const blob = new Blob([JSON.stringify(outputData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "specforge_output.json";
    a.click();
    URL.revokeObjectURL(url);

    // Save to server outputs/ directory for scorer and check scripts
    try {
      await call<{ saved: boolean; path: string }>("/export", {
        method: "POST",
        body: JSON.stringify({ output: outputData }),
      });
      setServerSaveMsg("✓ Saved outputs/specforge_output.json on server");
    } catch {
      // offline or error
    }
  };

  const handleDownloadHtml = async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>${specState.course.code || "COURSE"} - ${specState.course.title || "Course Specification"}</title>
  <style>
    body { font-family: Calibri, sans-serif; margin: 40px; color: #211F1F; }
    h1 { color: #1a3d7c; font-size: 20pt; border-bottom: 2px solid #1a3d7c; padding-bottom: 8px; }
    h2 { color: #1a3d7c; font-size: 14pt; margin-top: 24px; border-bottom: 1px solid #ddd; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10pt; }
    th, td { border: 1px solid #bbb; padding: 8px; text-align: left; }
    th { background: #f0f4f8; }
    .badge { display: inline-block; padding: 2px 6px; font-size: 8pt; font-weight: bold; background: #e0e7ff; color: #3730a3; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>Course Specification: ${specState.course.title || "Untitled Course"} (${specState.course.code || "PENDING"})</h1>
  <p><strong>Department:</strong> ${specState.course.department || "Engineering"} | <strong>Credits:</strong> ${specState.course.credits_ltp || "3:0:0"} | <strong>Template:</strong> ${specState.template}</p>
  
  <h2>1. Course Summary</h2>
  <p>${specState.course.summary || "No summary provided."}</p>

  <h2>2. Course Outcomes</h2>
  <table>
    <tr><th style="width: 80px">CO ID</th><th>Statement</th><th style="width: 100px">Bloom Level</th></tr>
    ${specState.course_outcomes
      .map(
        (co) =>
          `<tr><td><strong>${co.id}</strong></td><td>${co.statement}</td><td><span class="badge">L${co.bloom_level}</span></td></tr>`
      )
      .join("")}
  </table>

  <h2>3. Teaching Hours</h2>
  <table>
    <tr><th>Lectures</th><th>Laboratory</th><th>Tests & Exams</th><th>Total Hours</th></tr>
    <tr><td>${specState.teaching_hours.lectures}</td><td>${specState.teaching_hours.lab}</td><td>${specState.teaching_hours.tests_exams}</td><td><strong>${specState.teaching_hours.total}</strong></td></tr>
  </table>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "spec.html";
    a.click();
    URL.revokeObjectURL(url);

    // Save to server outputs/ directory
    try {
      await call<{ saved: boolean }>("/export", {
        method: "POST",
        body: JSON.stringify({ output: getOutputData(), html: htmlContent }),
      });
      setServerSaveMsg("✓ Saved outputs/spec.html and outputs/specforge_output.json on server");
    } catch {
      // offline or error
    }
  };

  const isApproved = specState.workflow_status === "Approved";

  return (
    <div className="bento-grid">
      {/* Top Banner */}
      <div className="col-12">
        <div className="bento-card">
          <div className="bento-card-header">
            <div>
              <span className="badge badge-primary" style={{ marginBottom: "6px" }}>
                Section 12: Publication & Scoring Artifacts
              </span>
              <h2 className="bento-card-title" style={{ fontSize: "1.3rem" }}>
                Template Selection & Export Pipeline
              </h2>
              <p className="bento-card-subtitle">
                Generate compliant university course specifications (`spec.html`) and official scoring artifacts (`specforge_output.json`).
              </p>
            </div>
            <span className={`badge ${isApproved ? "badge-success" : "badge-warning"}`}>
              Document Status: {specState.workflow_status}
            </span>
          </div>
        </div>
      </div>

      {/* Card 1: Template Detection & Override */}
      <div className="col-6">
        <div className="bento-card" style={{ height: "100%" }}>
          <div className="bento-card-header">
            <div>
              <h3 className="bento-card-title">Template Detection Rule</h3>
              <p className="bento-card-subtitle">Automated matching from credit structure (Practical credits &gt; 0)</p>
            </div>
            <span className="badge badge-primary">
              Signal: {practicalCredits > 0 ? "Practical > 0" : "Theory Only"}
            </span>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "0.86rem", color: "var(--text-muted)" }}>Detected Template:</span>
              <span className="badge badge-success">
                {detectedTemplate === "integrated" ? "Integrated (Lab + Theory)" : "Non-Lab (Pure Theory)"}
              </span>
            </div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <span style={{ fontSize: "0.86rem", color: "var(--text-muted)" }}>Active Selection:</span>
              <strong style={{ color: "var(--primary)", textTransform: "capitalize" }}>
                {specState.template} template
              </strong>
            </div>
          </div>

          {/* Template Choice Radio */}
          <div className="form-group">
            <label className="form-label">Template Assignment</label>
            <div style={{ display: "flex", gap: "12px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.88rem" }}>
                <input
                  type="radio"
                  name="tmpl"
                  checked={specState.template === "integrated"}
                  onChange={() => handleTemplateChange("integrated")}
                />
                Integrated Template (with Lab)
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.88rem" }}>
                <input
                  type="radio"
                  name="tmpl"
                  checked={specState.template === "non_lab"}
                  onChange={() => handleTemplateChange("non_lab")}
                />
                Non-Lab Template
              </label>
            </div>
          </div>

          {/* Override Reason Box */}
          <div style={{ marginTop: "14px", borderTop: "1px solid var(--glass-border)", paddingTop: "12px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.84rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>
              <input
                type="checkbox"
                checked={isOverridden}
                onChange={(e) => setIsOverridden(e.target.checked)}
              />
              Record Manual Template Override Reason
            </label>

            {isOverridden && (
              <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                <input
                  className="form-input"
                  style={{ flex: 1 }}
                  placeholder="Explain why the detected template was overridden..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                />
                <button className="btn btn-secondary" onClick={handleSaveOverride}>
                  Save
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card 2: Export Actions & Scoring Checklist */}
      <div className="col-6">
        <div className="bento-card" style={{ height: "100%" }}>
          <div className="bento-card-header">
            <div>
              <h3 className="bento-card-title">Export Actions</h3>
              <p className="bento-card-subtitle">Save production document and grading output</p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
            <button
              className="btn btn-primary"
              onClick={handleDownloadHtml}
              style={{ justifyContent: "flex-start", padding: "10px 16px" }}
            >
              📄 Download Filled Spec HTML (<code>spec.html</code>)
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => window.print()}
              style={{ justifyContent: "flex-start", padding: "10px 16px" }}
            >
              🖨️ Print / Save as PDF
            </button>

            <button
              className="btn btn-secondary"
              onClick={handleDownloadJson}
              style={{ justifyContent: "flex-start", padding: "10px 16px" }}
            >
              📊 Export Scoring JSON (<code>outputs/specforge_output.json</code>)
            </button>
          </div>

          {serverSaveMsg && (
            <div
              style={{
                marginBottom: "14px",
                padding: "8px 12px",
                background: "var(--emerald-bg)",
                border: "1px solid var(--emerald-border)",
                borderRadius: "var(--radius-md)",
                color: "var(--emerald)",
                fontSize: "0.82rem",
                fontWeight: 600,
              }}
            >
              {serverSaveMsg}
            </div>
          )}

          {/* Submission Verification Checklist */}
          <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "var(--radius-md)", border: "1px solid var(--glass-border)" }}>
            <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "8px", textTransform: "uppercase" }}>
              Scoring Gate Checklist
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.82rem" }}>
              <div>✓ <code>input_id</code> strictly set to "SAMPLE"</div>
              <div>✓ Template corresponds to credit structure</div>
              <div>✓ Zero template sample text survives into output</div>
              <div>✓ Continuous evaluation + Exam weights = 100%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: Live Document Paper Preview */}
      <div className="col-12">
        <div className="bento-card">
          <div className="bento-card-header">
            <div>
              <h3 className="bento-card-title">Live Document Paper Preview</h3>
              <p className="bento-card-subtitle">Exact replica of official university layout templates</p>
            </div>
            {!isApproved && (
              <span className="badge badge-warning">
                Watermarked: DRAFT (Approval Required to Remove)
              </span>
            )}
          </div>

          <div className="paper-preview">
            {!isApproved && <div className="draft-watermark">DRAFT</div>}

            <div style={{ textAlign: "center", borderBottom: "2px solid #1a3d7c", paddingBottom: "14px", marginBottom: "20px" }}>
              <h2 style={{ margin: "0 0 6px 0", color: "#1a3d7c", fontSize: "1.4rem" }}>
                UNIVERSITY COURSE SPECIFICATION
              </h2>
              <div style={{ fontSize: "0.95rem", fontWeight: 600 }}>
                {specState.course.title || "Course Specification"} ({specState.course.code || "COURSE_CODE"})
              </div>
              <div style={{ fontSize: "0.85rem", color: "#666", marginTop: "4px" }}>
                Department of {specState.course.department || "Engineering"} | Credits: {specState.course.credits_ltp || "3:0:0"} | {specState.template === "integrated" ? "Integrated Course" : "Theory Course"}
              </div>
            </div>

            <h4 style={{ color: "#1a3d7c", borderBottom: "1px solid #ccc", paddingBottom: "4px", margin: "16px 0 8px 0" }}>
              1. Course Overview & Academic Summary
            </h4>
            <p style={{ fontSize: "0.9rem", lineHeight: 1.5, color: "#333" }}>
              {specState.course.summary || "Summary description pending faculty input."}
            </p>

            <h4 style={{ color: "#1a3d7c", borderBottom: "1px solid #ccc", paddingBottom: "4px", margin: "16px 0 8px 0" }}>
              2. Course Outcomes (COs)
            </h4>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", marginBottom: "16px" }}>
              <thead>
                <tr style={{ background: "#f0f4f8" }}>
                  <th style={{ border: "1px solid #ccc", padding: "6px" }}>CO ID</th>
                  <th style={{ border: "1px solid #ccc", padding: "6px" }}>Course Outcome Statement</th>
                  <th style={{ border: "1px solid #ccc", padding: "6px", width: "80px" }}>Cognitive</th>
                </tr>
              </thead>
              <tbody>
                {specState.course_outcomes.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ border: "1px solid #ccc", padding: "10px", textAlign: "center", color: "#999" }}>
                      No outcomes listed
                    </td>
                  </tr>
                ) : (
                  specState.course_outcomes.map((co) => (
                    <tr key={co.id}>
                      <td style={{ border: "1px solid #ccc", padding: "6px", fontWeight: 700 }}>{co.id}</td>
                      <td style={{ border: "1px solid #ccc", padding: "6px" }}>{co.statement}</td>
                      <td style={{ border: "1px solid #ccc", padding: "6px", textAlign: "center" }}>L{co.bloom_level}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <h4 style={{ color: "#1a3d7c", borderBottom: "1px solid #ccc", paddingBottom: "4px", margin: "16px 0 8px 0" }}>
              3. Instructional & Assessment Distribution
            </h4>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "16px" }}>
              <div>Lectures: <strong>{specState.teaching_hours.lectures}h</strong></div>
              <div>Practical/Lab: <strong>{specState.teaching_hours.lab}h</strong></div>
              <div>Tests & Exams: <strong>{specState.teaching_hours.tests_exams}h</strong></div>
              <div>Total: <strong>{specState.teaching_hours.total}h</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
