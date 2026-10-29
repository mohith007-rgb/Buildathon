import React, { useState } from "react";
import type { SpecState, Role, CourseOutcome, CourseUnit } from "../../types";
import { BLOOM_DATA } from "../../configData";

interface SpecScreenProps {
  specState: SpecState;
  onUpdateSpec: (updater: (prev: SpecState) => SpecState) => void;
  role: Role;
  onNavigate: (screen: any) => void;
}

export const SpecScreen: React.FC<SpecScreenProps> = ({
  specState,
  onUpdateSpec,
  role,
  onNavigate,
}) => {
  const isEditable =
    role === "Author" &&
    (specState.workflow_status === "Draft" || specState.workflow_status === "Returned");

  const [newCoStatement, setNewCoStatement] = useState("");
  const [newCoBloom, setNewCoBloom] = useState(3);

  const handleCourseChange = (field: keyof typeof specState.course, value: string) => {
    if (!isEditable) return;
    onUpdateSpec((prev) => ({
      ...prev,
      course: {
        ...prev.course,
        [field]: value,
      },
    }));
  };

  const handleAddCo = () => {
    if (!isEditable || !newCoStatement.trim()) return;
    const nextId = `CO-${specState.course_outcomes.length + 1}`;
    const newCo: CourseOutcome = {
      id: nextId,
      statement: newCoStatement.trim(),
      bloom_level: newCoBloom,
    };
    onUpdateSpec((prev) => ({
      ...prev,
      course_outcomes: [...prev.course_outcomes, newCo],
      // Initialize map row
      co_po_pso_map: {
        ...prev.co_po_pso_map,
        [nextId]: {},
      },
    }));
    setNewCoStatement("");
  };

  const handleRemoveCo = (coId: string) => {
    if (!isEditable) return;
    onUpdateSpec((prev) => {
      const filtered = prev.course_outcomes.filter((c) => c.id !== coId);
      const newMap = { ...prev.co_po_pso_map };
      delete newMap[coId];
      return {
        ...prev,
        course_outcomes: filtered,
        co_po_pso_map: newMap,
      };
    });
  };

  const handleUpdateCoBloom = (coId: string, bloomLevel: number) => {
    if (!isEditable) return;
    onUpdateSpec((prev) => ({
      ...prev,
      course_outcomes: prev.course_outcomes.map((c) =>
        c.id === coId ? { ...c, bloom_level: bloomLevel } : c
      ),
    }));
  };

  const handleAddUnit = () => {
    if (!isEditable) return;
    const nextNum = specState.units.length + 1;
    const newUnit: CourseUnit = {
      number: nextNum,
      title: `Unit ${nextNum}: Topic Overview`,
      lab: null,
      hours: 8,
    };
    onUpdateSpec((prev) => ({
      ...prev,
      units: [...prev.units, newUnit],
    }));
  };

  const getBloomBadgeColor = (level: number) => {
    switch (level) {
      case 1:
        return "badge-neutral";
      case 2:
        return "badge-primary";
      case 3:
        return "badge-success";
      case 4:
        return "badge-warning";
      case 5:
      case 6:
        return "badge-danger";
      default:
        return "badge-neutral";
    }
  };

  return (
    <div className="bento-grid">
      {/* Role Permission Notice */}
      {!isEditable && (
        <div className="col-12">
          <div
            style={{
              padding: "10px 14px",
              background: "rgba(217, 119, 6, 0.08)",
              border: "1px solid var(--amber-border)",
              borderRadius: "var(--radius-md)",
              color: "var(--amber)",
              fontSize: "0.85rem",
              fontWeight: 500,
            }}
          >
            🔒 View-Only Mode: Course specifications may only be modified by the <strong>Author</strong> when in <strong>Draft</strong> or <strong>Returned</strong> status.
          </div>
        </div>
      )}

      {/* Card 1: Core Course Metadata */}
      <div className="col-12">
        <div className="bento-card">
          <div className="bento-card-header">
            <div>
              <span className="badge badge-primary" style={{ marginBottom: "6px" }}>
                Section 1 & 2: Course Details
              </span>
              <h2 className="bento-card-title" style={{ fontSize: "1.25rem" }}>
                {specState.course.title || "Course Specification Editor"}
              </h2>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <span className="badge badge-neutral">Code: {specState.course.code || "PENDING"}</span>
              <span className="badge badge-primary">Credits: {specState.course.credits_ltp || "3:0:0"}</span>
              <span className="badge badge-success">{specState.template === "integrated" ? "Integrated Lab" : "Non-Lab"}</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
            <div className="form-group">
              <label className="form-label">Course Title</label>
              <input
                className="form-input"
                disabled={!isEditable}
                value={specState.course.title}
                onChange={(e) => handleCourseChange("title", e.target.value)}
                placeholder="e.g. Computer Science Fundamentals"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Course Code</label>
              <input
                className="form-input"
                disabled={!isEditable}
                value={specState.course.code}
                onChange={(e) => handleCourseChange("code", e.target.value)}
                placeholder="e.g. CS201"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Department</label>
              <input
                className="form-input"
                disabled={!isEditable}
                value={specState.course.department}
                onChange={(e) => handleCourseChange("department", e.target.value)}
                placeholder="e.g. Computer Science & Engineering"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Credits (L:T:P)</label>
              <input
                className="form-input"
                disabled={!isEditable}
                value={specState.course.credits_ltp}
                onChange={(e) => handleCourseChange("credits_ltp", e.target.value)}
                placeholder="3:0:0"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Course Type</label>
              <input
                className="form-input"
                disabled={!isEditable}
                value={specState.course.course_type}
                onChange={(e) => handleCourseChange("course_type", e.target.value)}
                placeholder="Theory / Integrated / Laboratory"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: Course Summary */}
      <div className="col-12">
        <div className="bento-card">
          <div className="bento-card-header">
            <div>
              <h3 className="bento-card-title">Course Summary</h3>
              <p className="bento-card-subtitle">Comprehensive description covering all units and learning objectives</p>
            </div>
            <span className="badge badge-primary">✨ AI Verified</span>
          </div>

          <textarea
            className="form-textarea"
            disabled={!isEditable}
            value={specState.course.summary}
            onChange={(e) => handleCourseChange("summary", e.target.value)}
            placeholder="Provide a comprehensive academic summary of this course..."
            rows={4}
          />
        </div>
      </div>

      {/* Card 3: Course Outcomes (COs) */}
      <div className="col-12">
        <div className="bento-card">
          <div className="bento-card-header">
            <div>
              <h3 className="bento-card-title">Course Outcomes (COs) & Bloom's Taxonomy</h3>
              <p className="bento-card-subtitle">Defined in Section 3; each CO has a leading action verb and cognitive level</p>
            </div>
            <span className="badge badge-neutral">{specState.course_outcomes.length} COs</span>
          </div>

          <div className="glass-table-wrapper" style={{ marginBottom: "16px" }}>
            <table className="glass-table">
              <thead>
                <tr>
                  <th style={{ width: "90px" }}>CO ID</th>
                  <th>Outcome Statement (Action Verb)</th>
                  <th style={{ width: "170px" }}>Bloom's Level</th>
                  {isEditable && <th style={{ width: "80px", textAlign: "center" }}>Action</th>}
                </tr>
              </thead>
              <tbody>
                {specState.course_outcomes.length === 0 ? (
                  <tr>
                    <td colSpan={isEditable ? 4 : 3} style={{ textAlign: "center", color: "var(--text-muted)", padding: "24px" }}>
                      No Course Outcomes defined yet. Add one below or ingest a course blueprint.
                    </td>
                  </tr>
                ) : (
                  specState.course_outcomes.map((co) => (
                    <tr key={co.id}>
                      <td style={{ fontWeight: 700, color: "var(--primary)" }}>{co.id}</td>
                      <td>
                        {isEditable ? (
                          <input
                            className="form-input"
                            style={{ width: "100%", padding: "6px 8px" }}
                            value={co.statement}
                            onChange={(e) => {
                              const val = e.target.value;
                              onUpdateSpec((prev) => ({
                                ...prev,
                                course_outcomes: prev.course_outcomes.map((c) =>
                                  c.id === co.id ? { ...c, statement: val } : c
                                ),
                              }));
                            }}
                          />
                        ) : (
                          co.statement
                        )}
                      </td>
                      <td>
                        {isEditable ? (
                          <select
                            className="form-select"
                            style={{ padding: "6px 8px", fontSize: "0.82rem" }}
                            value={co.bloom_level}
                            onChange={(e) => handleUpdateCoBloom(co.id, Number(e.target.value))}
                          >
                            {BLOOM_DATA.map((b) => {
                              const num = parseInt(b.level.replace("L", ""), 10);
                              return (
                                <option key={b.level} value={num}>
                                  {b.level}: {b.name}
                                </option>
                              );
                            })}
                          </select>
                        ) : (
                          <span className={`badge ${getBloomBadgeColor(co.bloom_level)}`}>
                            L{co.bloom_level}
                          </span>
                        )}
                      </td>
                      {isEditable && (
                        <td style={{ textAlign: "center" }}>
                          <button
                            className="btn btn-ghost"
                            style={{ color: "var(--rose)", padding: "4px 8px" }}
                            onClick={() => handleRemoveCo(co.id)}
                            title="Remove Outcome"
                          >
                            ✕
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Add Outcome Form */}
          {isEditable && (
            <div
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "center",
                flexWrap: "wrap",
                background: "rgba(248, 250, 252, 0.8)",
                padding: "12px",
                borderRadius: "var(--radius-md)",
                border: "1px dashed var(--glass-border)",
              }}
            >
              <input
                className="form-input"
                style={{ flex: 1, minWidth: "260px" }}
                placeholder="Enter outcome statement (e.g., 'Apply sorting algorithms to optimize computational search...')"
                value={newCoStatement}
                onChange={(e) => setNewCoStatement(e.target.value)}
              />
              <select
                className="form-select"
                style={{ width: "160px" }}
                value={newCoBloom}
                onChange={(e) => setNewCoBloom(Number(e.target.value))}
              >
                {BLOOM_DATA.map((b) => {
                  const num = parseInt(b.level.replace("L", ""), 10);
                  return (
                    <option key={b.level} value={num}>
                      {b.level}: {b.name}
                    </option>
                  );
                })}
              </select>
              <button className="btn btn-primary" onClick={handleAddCo}>
                + Add Outcome
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Card 4: Syllabus Units */}
      <div className="col-8">
        <div className="bento-card">
          <div className="bento-card-header">
            <div>
              <h3 className="bento-card-title">Syllabus Units</h3>
              <p className="bento-card-subtitle">Course content, modules and instructional hours</p>
            </div>
            {isEditable && (
              <button className="btn btn-secondary" style={{ padding: "4px 10px", fontSize: "0.8rem" }} onClick={handleAddUnit}>
                + Add Unit
              </button>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {specState.units.length === 0 ? (
              <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "20px" }}>
                No syllabus units added yet.
              </div>
            ) : (
              specState.units.map((unit) => (
                <div
                  key={unit.number}
                  style={{
                    padding: "12px",
                    borderRadius: "var(--radius-md)",
                    background: "rgba(255, 255, 255, 0.9)",
                    border: "1px solid var(--glass-border)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontWeight: 600, color: "var(--primary)", fontSize: "0.9rem" }}>
                      Unit {unit.number}: {unit.title}
                    </span>
                    <span className="badge badge-neutral">{unit.hours || 8} Hours</span>
                  </div>
                  {unit.lab && (
                    <div style={{ fontSize: "0.82rem", color: "var(--emerald)", background: "var(--emerald-bg)", padding: "4px 8px", borderRadius: "var(--radius-sm)" }}>
                      Lab: {unit.lab}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Card 5: Teaching Hours & Assessment */}
      <div className="col-4">
        <div className="bento-card">
          <div className="bento-card-header">
            <h3 className="bento-card-title">Hours & Assessment</h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ padding: "10px", background: "#f8fafc", borderRadius: "var(--radius-md)" }}>
              <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "4px" }}>
                TEACHING HOURS
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.86rem" }}>
                <span>Lectures:</span>
                <span style={{ fontWeight: 600 }}>{specState.teaching_hours.lectures}h</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.86rem" }}>
                <span>Practical/Lab:</span>
                <span style={{ fontWeight: 600 }}>{specState.teaching_hours.lab}h</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.86rem" }}>
                <span>Tests/Exams:</span>
                <span style={{ fontWeight: 600 }}>{specState.teaching_hours.tests_exams}h</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.86rem", borderTop: "1px solid var(--glass-border)", paddingTop: "6px", marginTop: "4px" }}>
                <span style={{ fontWeight: 700 }}>Total:</span>
                <span style={{ fontWeight: 700, color: "var(--primary)" }}>{specState.teaching_hours.total}h</span>
              </div>
            </div>

            <div style={{ padding: "10px", background: "#f8fafc", borderRadius: "var(--radius-md)" }}>
              <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "4px" }}>
                ASSESSMENT WEIGHTAGE
              </div>
              {specState.assessment.components.length === 0 ? (
                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>Continuous (50%) + Exam (50%)</div>
              ) : (
                specState.assessment.components.map((comp) => (
                  <div key={comp.name} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.86rem" }}>
                    <span>{comp.name}:</span>
                    <span style={{ fontWeight: 600 }}>{comp.weight_percent}%</span>
                  </div>
                ))
              )}
            </div>

            <button
              className="btn btn-primary"
              onClick={() => onNavigate("mapping")}
              style={{ width: "100%", marginTop: "8px" }}
            >
              Proceed to CO-PO Mapping ➔
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
