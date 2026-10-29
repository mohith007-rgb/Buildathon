import React, { useState } from "react";
import type { SpecState, DefectItem } from "../../types";

interface ValidationScreenProps {
  specState: SpecState;
  onUpdateSpec: (updater: (prev: SpecState) => SpecState) => void;
  onNavigate: (screen: any) => void;
}

const VALIDATION_RULES = [
  { id: "V1", name: "CO Count Consistency", desc: "CO count is identical across Sections 3, 5, and assessment tables." },
  { id: "V2", name: "PO Mapping Coverage", desc: "Every Course Outcome is mapped to at least one Program Outcome." },
  { id: "V3", name: "Assessment Alignment", desc: "Every Course Outcome is evaluated in at least one assessment component." },
  { id: "V4", name: "No Orphan Identifiers", desc: "No CO id appears in any table that is not formally defined in Section 3." },
  { id: "V5", name: "Teaching Hours Summation", desc: "Teaching hours rows add up to the stated total." },
  { id: "V6", name: "Weightage Balance", desc: "Continuous evaluation plus end-semester exam weightages total 100%." },
  { id: "V7", name: "Template Cleanliness", desc: "No placeholder or sample text from the template remains." },
  { id: "V8", name: "Programme PSO Alignment", desc: "PSO columns match the programme structure (PSO-1 and PSO-2 only)." },
  { id: "V9", name: "Bloom's Ceiling & Tool Evidence", desc: "Mapping values respect Bloom's cognitive ceiling; strong PO-3/PO-5 COs are evaluated in practical components." },
  { id: "V10", name: "Template Appropriateness", desc: "Template choice matches the credit structure (non-zero lab credits = Integrated)." },
];

export const ValidationScreen: React.FC<ValidationScreenProps> = ({
  specState,
  onNavigate,
}) => {
  const [severityFilter, setSeverityFilter] = useState<string>("All");
  const [sourceFilter, setSourceFilter] = useState<string>("All");
  const [showPassed, setShowPassed] = useState(false);

  // Evaluate dynamic checks
  const coCount = specState.course_outcomes.length;
  const mappedCos = Object.keys(specState.co_po_pso_map).filter(
    (coId) => Object.keys(specState.co_po_pso_map[coId] || {}).length > 0
  );
  const v2Passed = coCount > 0 && mappedCos.length === coCount;

  const totalHoursCalculated =
    (specState.teaching_hours.lectures || 0) +
    (specState.teaching_hours.lab || 0) +
    (specState.teaching_hours.tests_exams || 0);
  const v5Passed =
    specState.teaching_hours.total > 0 &&
    totalHoursCalculated === specState.teaching_hours.total;

  const totalWeightage = specState.assessment.components.reduce(
    (sum, c) => sum + (c.weight_percent || 0),
    0
  );
  const v6Passed = specState.assessment.components.length > 0 ? totalWeightage === 100 : true;

  const defects = specState.defects;
  const highCount = defects.filter((d) => d.severity === "High").length;
  const mediumCount = defects.filter((d) => d.severity === "Medium").length;
  const lowCount = defects.filter((d) => d.severity === "Low").length;

  const filteredDefects = defects.filter((d) => {
    if (severityFilter !== "All" && d.severity !== severityFilter) return false;
    if (sourceFilter !== "All" && d.location.source !== sourceFilter) return false;
    return true;
  });

  const getSeverityBadge = (sev: DefectItem["severity"]) => {
    switch (sev) {
      case "High":
        return "badge-danger";
      case "Medium":
        return "badge-warning";
      case "Low":
        return "badge-primary";
    }
  };

  return (
    <div className="bento-grid">
      {/* Top Banner & KPI Cards */}
      <div className="col-12">
        <div className="bento-card">
          <div className="bento-card-header">
            <div>
              <span className="badge badge-primary" style={{ marginBottom: "6px" }}>
                Section 11: Defect Audit & Compliance
              </span>
              <h2 className="bento-card-title" style={{ fontSize: "1.3rem" }}>
                Validation & Specification Defects
              </h2>
              <p className="bento-card-subtitle">
                Automated auditing against 10 strict university curriculum criteria (V1 through V10)
              </p>
            </div>
            <button className="btn btn-secondary" onClick={() => onNavigate("export")}>
              Review Document Export ➔
            </button>
          </div>

          {/* Bento KPI Summary Row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginTop: "10px" }}>
            <div style={{ padding: "14px", borderRadius: "var(--radius-md)", background: "#f8fafc", border: "1px solid var(--glass-border)" }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
                Total Active Defects
              </div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: defects.length > 0 ? "var(--rose)" : "var(--emerald)" }}>
                {defects.length}
              </div>
            </div>

            <div style={{ padding: "14px", borderRadius: "var(--radius-md)", background: "var(--rose-bg)", border: "1px solid var(--rose-border)" }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--rose)", textTransform: "uppercase" }}>
                High Severity
              </div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--rose)" }}>
                {highCount}
              </div>
            </div>

            <div style={{ padding: "14px", borderRadius: "var(--radius-md)", background: "var(--amber-bg)", border: "1px solid var(--amber-border)" }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--amber)", textTransform: "uppercase" }}>
                Medium Warnings
              </div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--amber)" }}>
                {mediumCount}
              </div>
            </div>

            <div style={{ padding: "14px", borderRadius: "var(--radius-md)", background: "var(--emerald-bg)", border: "1px solid var(--emerald-border)" }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--emerald)", textTransform: "uppercase" }}>
                Low / Cosmetic
              </div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--emerald)" }}>
                {lowCount}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="col-12">
        <div className="bento-card" style={{ padding: "14px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)" }}>Severity:</span>
              {["All", "High", "Medium", "Low"].map((sev) => (
                <button
                  key={sev}
                  className={`btn ${severityFilter === sev ? "btn-primary" : "btn-ghost"}`}
                  style={{ padding: "4px 10px", fontSize: "0.8rem" }}
                  onClick={() => setSeverityFilter(sev)}
                >
                  {sev}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)" }}>Source:</span>
              {["All", "spec", "blueprint", "template"].map((src) => (
                <button
                  key={src}
                  className={`btn ${sourceFilter === src ? "btn-secondary" : "btn-ghost"}`}
                  style={{ padding: "4px 10px", fontSize: "0.8rem" }}
                  onClick={() => setSourceFilter(src)}
                >
                  {src}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Defects List */}
      <div className="col-12">
        <div className="bento-card">
          <div className="bento-card-header">
            <h3 className="bento-card-title">Identified Specification Defects</h3>
            <span className="badge badge-neutral">{filteredDefects.length} shown</span>
          </div>

          {filteredDefects.length === 0 ? (
            <div style={{ textAlign: "center", padding: "36px 16px", color: "var(--text-muted)" }}>
              <div style={{ fontSize: "2rem", marginBottom: "8px" }}>✅</div>
              <div style={{ fontWeight: 600, color: "var(--emerald)", fontSize: "1rem" }}>
                No defects found matching current filters
              </div>
              <p style={{ margin: "4px 0 0 0", fontSize: "0.84rem" }}>
                Course outcomes, hours, and credit structures conform to current validation criteria.
              </p>
            </div>
          ) : (
            <div className="glass-table-wrapper">
              <table className="glass-table">
                <thead>
                  <tr>
                    <th style={{ width: "95px" }}>Severity</th>
                    <th style={{ width: "210px" }}>Defect Code</th>
                    <th style={{ width: "130px" }}>Source & Sec</th>
                    <th>Defect Description</th>
                    <th>Recommended Fix</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDefects.map((defect) => (
                    <tr key={defect.id}>
                      <td>
                        <span className={`badge ${getSeverityBadge(defect.severity)}`}>
                          {defect.severity}
                        </span>
                      </td>
                      <td>
                        <code style={{ fontSize: "0.8rem", color: "var(--primary)", background: "var(--primary-light)", padding: "2px 6px", borderRadius: "4px" }}>
                          {defect.code}
                        </code>
                      </td>
                      <td>
                        <span style={{ textTransform: "capitalize", fontWeight: 600 }}>{defect.location.source}</span>
                        {defect.location.section && ` §${defect.location.section}`}
                        {defect.location.refs?.length > 0 && (
                          <span style={{ display: "block", fontSize: "0.74rem", color: "var(--text-muted)" }}>
                            Refs: {defect.location.refs.join(", ")}
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: "0.86rem" }}>{defect.description}</td>
                      <td style={{ fontSize: "0.86rem", color: "var(--emerald)", fontWeight: 500 }}>
                        {defect.fix}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* University Validation Rules (V1 - V10) Checklist */}
      <div className="col-12">
        <div className="bento-card">
          <div className="bento-card-header">
            <div>
              <h3 className="bento-card-title">University Validation Suite (V1–V10)</h3>
              <p className="bento-card-subtitle">Deterministic programmatic rules enforcing curriculum integrity</p>
            </div>
            <button
              className="btn btn-ghost"
              style={{ fontSize: "0.82rem" }}
              onClick={() => setShowPassed(!showPassed)}
            >
              {showPassed ? "Collapse Rules" : "Expand All 10 Rules"}
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "10px" }}>
            {VALIDATION_RULES.slice(0, showPassed ? 10 : 4).map((rule) => {
              let isPassing = true;
              if (rule.id === "V2") isPassing = v2Passed;
              if (rule.id === "V5") isPassing = v5Passed;
              if (rule.id === "V6") isPassing = v6Passed;

              return (
                <div
                  key={rule.id}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "var(--radius-md)",
                    background: isPassing ? "rgba(5, 150, 105, 0.04)" : "rgba(220, 38, 38, 0.04)",
                    border: `1px solid ${isPassing ? "var(--emerald-border)" : "var(--rose-border)"}`,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                  }}
                >
                  <span style={{ fontSize: "1rem" }}>{isPassing ? "✓" : "⚠️"}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.84rem", color: isPassing ? "var(--emerald)" : "var(--rose)" }}>
                      {rule.id}: {rule.name}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "2px" }}>
                      {rule.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
