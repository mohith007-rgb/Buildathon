import React, { useState } from "react";
import type { SpecState, Role } from "../../types";
import { PO_DATA, PSO_DATA, BLOOM_DATA, getPo, getPso, getBloomCeiling } from "../../configData";

interface MappingScreenProps {
  specState: SpecState;
  onUpdateSpec: (updater: (prev: SpecState) => SpecState) => void;
  role: Role;
  onNavigate: (screen: any) => void;
}

export const MappingScreen: React.FC<MappingScreenProps> = ({
  specState,
  onUpdateSpec,
  role,
  onNavigate,
}) => {
  const isEditable =
    role === "Author" &&
    (specState.workflow_status === "Draft" || specState.workflow_status === "Returned");

  const [activeCell, setActiveCell] = useState<{ coId: string; outcomeId: string } | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [justificationInput, setJustificationInput] = useState("");

  const handleCellClick = (coId: string, outcomeId: string) => {
    setActiveCell({ coId, outcomeId });
    const existing = specState.co_po_pso_map[coId]?.[outcomeId];
    setJustificationInput(existing?.justification || "");
  };

  const handleSetStrength = (level: 1 | 2 | 3 | null) => {
    if (!isEditable || !activeCell) return;
    const { coId, outcomeId } = activeCell;

    onUpdateSpec((prev) => {
      const coMap = { ...(prev.co_po_pso_map[coId] || {}) };
      if (level === null) {
        delete coMap[outcomeId];
      } else {
        coMap[outcomeId] = {
          level,
          justification: justificationInput.trim() || `Contributes at level ${level} toward ${outcomeId}.`,
        };
      }
      return {
        ...prev,
        co_po_pso_map: {
          ...prev.co_po_pso_map,
          [coId]: coMap,
        },
      };
    });
  };

  const handleSaveJustification = () => {
    if (!isEditable || !activeCell) return;
    const { coId, outcomeId } = activeCell;
    const current = specState.co_po_pso_map[coId]?.[outcomeId];
    if (!current) return;

    onUpdateSpec((prev) => ({
      ...prev,
      co_po_pso_map: {
        ...prev.co_po_pso_map,
        [coId]: {
          ...prev.co_po_pso_map[coId],
          [outcomeId]: {
            ...current,
            justification: justificationInput,
          },
        },
      },
    }));
  };

  // Inspect currently selected cell details
  const selectedCo = activeCell
    ? specState.course_outcomes.find((c) => c.id === activeCell.coId)
    : null;
  const selectedPo = activeCell ? getPo(activeCell.outcomeId) : undefined;
  const selectedPso = activeCell ? getPso(activeCell.outcomeId) : undefined;
  const currentCellData = activeCell
    ? specState.co_po_pso_map[activeCell.coId]?.[activeCell.outcomeId]
    : null;

  // Ceiling violation check
  const ceiling = selectedCo ? getBloomCeiling(selectedCo.bloom_level) : 3;
  const hasCeilingViolation = currentCellData && currentCellData.level > ceiling;

  return (
    <div className="bento-grid">
      {/* Top Banner & Legend */}
      <div className="col-12">
        <div className="bento-card">
          <div className="bento-card-header">
            <div>
              <span className="badge badge-primary" style={{ marginBottom: "6px" }}>
                Section 5: Outcome Alignment
              </span>
              <h2 className="bento-card-title" style={{ fontSize: "1.3rem" }}>
                CO-PO-PSO Articulation Matrix
              </h2>
              <p className="bento-card-subtitle">
                Align Course Outcomes with the 11 Washington Accord POs and Department PSOs (Annexure A)
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <button
                className={`btn ${showDrawer ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setShowDrawer(!showDrawer)}
              >
                📖 {showDrawer ? "Hide Annexure A" : "Annexure A Reference"}
              </button>
            </div>
          </div>

          {/* Scale Legend */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "18px",
              flexWrap: "wrap",
              background: "#f8fafc",
              padding: "10px 16px",
              borderRadius: "var(--radius-md)",
              fontSize: "0.84rem",
            }}
          >
            <span style={{ fontWeight: 600, color: "var(--text-muted)" }}>Articulation Scale:</span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div className="matrix-cell-btn matrix-cell-3" style={{ width: "24px", height: "24px", fontSize: "0.72rem" }}>
                3
              </div>
              <span>Very Strong</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div className="matrix-cell-btn matrix-cell-2" style={{ width: "24px", height: "24px", fontSize: "0.72rem" }}>
                2
              </div>
              <span>Strong</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div className="matrix-cell-btn matrix-cell-1" style={{ width: "24px", height: "24px", fontSize: "0.72rem" }}>
                1
              </div>
              <span>Moderate</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div className="matrix-cell-btn matrix-cell-blank" style={{ width: "24px", height: "24px", fontSize: "0.72rem" }}>
                -
              </div>
              <span>No Correlation (Blank)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--amber)" }} />
              <span style={{ color: "var(--amber)", fontWeight: 600 }}>Rule Advisory (Bloom's Ceiling)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Matrix Table */}
      <div className={activeCell || showDrawer ? "col-8" : "col-12"}>
        <div className="bento-card">
          <div className="glass-table-wrapper">
            <table className="glass-table" style={{ textAlign: "center" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", minWidth: "80px" }}>CO ID</th>
                  <th style={{ minWidth: "75px" }}>Bloom</th>
                  {PO_DATA.map((po) => (
                    <th key={po.id} title={`${po.id}: ${po.title} - ${po.statement}`} style={{ minWidth: "48px" }}>
                      {po.id.replace("PO-", "P")}
                    </th>
                  ))}
                  {PSO_DATA.map((pso) => (
                    <th key={pso.id} title={`${pso.id}: ${pso.statement}`} style={{ minWidth: "48px", background: "rgba(79, 70, 229, 0.08)", color: "var(--indigo)" }}>
                      {pso.id.replace("PSO-", "PS")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {specState.course_outcomes.length === 0 ? (
                  <tr>
                    <td colSpan={15} style={{ padding: "30px", color: "var(--text-muted)" }}>
                      No Course Outcomes available. Please define Course Outcomes in Screen 2 first.
                    </td>
                  </tr>
                ) : (
                  specState.course_outcomes.map((co) => (
                    <tr key={co.id}>
                      <td style={{ textAlign: "left", fontWeight: 700, color: "var(--primary)" }}>
                        {co.id}
                      </td>
                      <td>
                        <span className="badge badge-neutral" style={{ fontSize: "0.72rem" }}>
                          L{co.bloom_level}
                        </span>
                      </td>

                      {/* PO Columns */}
                      {PO_DATA.map((po) => {
                        const cell = specState.co_po_pso_map[co.id]?.[po.id];
                        const lvl = cell?.level;
                        const violates = lvl && lvl > getBloomCeiling(co.bloom_level);
                        const isSelected = activeCell?.coId === co.id && activeCell?.outcomeId === po.id;

                        return (
                          <td key={po.id} style={{ position: "relative", padding: "6px 2px" }}>
                            <button
                              className={`matrix-cell-btn ${
                                lvl === 3
                                  ? "matrix-cell-3"
                                  : lvl === 2
                                  ? "matrix-cell-2"
                                  : lvl === 1
                                  ? "matrix-cell-1"
                                  : "matrix-cell-blank"
                              }`}
                              style={{
                                outline: isSelected ? "2px solid var(--primary)" : "none",
                              }}
                              onClick={() => handleCellClick(co.id, po.id)}
                              title={`${co.id} ➔ ${po.id}: ${cell?.justification || "No mapping"}`}
                            >
                              {lvl || ""}
                            </button>
                            {violates && <div className="matrix-violation-indicator" title="Exceeds Bloom's cognitive ceiling" />}
                          </td>
                        );
                      })}

                      {/* PSO Columns */}
                      {PSO_DATA.map((pso) => {
                        const cell = specState.co_po_pso_map[co.id]?.[pso.id];
                        const lvl = cell?.level;
                        const violates = lvl && lvl > getBloomCeiling(co.bloom_level);
                        const isSelected = activeCell?.coId === co.id && activeCell?.outcomeId === pso.id;

                        return (
                          <td key={pso.id} style={{ position: "relative", padding: "6px 2px", background: "rgba(79, 70, 229, 0.03)" }}>
                            <button
                              className={`matrix-cell-btn ${
                                lvl === 3
                                  ? "matrix-cell-3"
                                  : lvl === 2
                                  ? "matrix-cell-2"
                                  : lvl === 1
                                  ? "matrix-cell-1"
                                  : "matrix-cell-blank"
                              }`}
                              style={{
                                outline: isSelected ? "2px solid var(--indigo)" : "none",
                              }}
                              onClick={() => handleCellClick(co.id, pso.id)}
                              title={`${co.id} ➔ ${pso.id}: ${cell?.justification || "No mapping"}`}
                            >
                              {lvl || ""}
                            </button>
                            {violates && <div className="matrix-violation-indicator" title="Exceeds Bloom's cognitive ceiling" />}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Side Inspector / Cell Editor */}
      {activeCell && (
        <div className="col-4">
          <div className="bento-card" style={{ borderColor: "var(--primary-border)" }}>
            <div className="bento-card-header">
              <div>
                <span className="badge badge-primary">{activeCell.coId} ➔ {activeCell.outcomeId}</span>
                <h3 className="bento-card-title" style={{ marginTop: "4px" }}>
                  Cell Inspector
                </h3>
              </div>
              <button className="btn btn-ghost" style={{ padding: "4px 8px" }} onClick={() => setActiveCell(null)}>
                ✕
              </button>
            </div>

            {/* Outcome Details */}
            <div style={{ marginBottom: "14px" }}>
              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--primary)" }}>
                {selectedPo ? `${selectedPo.id}: ${selectedPo.title}` : selectedPso ? selectedPso.id : activeCell.outcomeId}
              </div>
              <p style={{ margin: "4px 0", fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
                {selectedPo?.statement || selectedPso?.statement}
              </p>
            </div>

            {/* Course Outcome statement */}
            {selectedCo && (
              <div style={{ padding: "8px 10px", background: "#f8fafc", borderRadius: "var(--radius-sm)", marginBottom: "14px", fontSize: "0.82rem" }}>
                <strong>{selectedCo.id} Statement:</strong> {selectedCo.statement} (Cognitive Level: L{selectedCo.bloom_level})
              </div>
            )}

            {/* Ceiling Advisory */}
            {hasCeilingViolation && (
              <div style={{ padding: "8px 10px", background: "var(--amber-bg)", border: "1px solid var(--amber-border)", borderRadius: "var(--radius-sm)", color: "var(--amber)", fontSize: "0.8rem", marginBottom: "14px" }}>
                ⚠️ <strong>Bloom's Ceiling Advisory:</strong> A level L{selectedCo?.bloom_level} outcome should generally not map to strength 3 on complex design POs without lab/practical components.
              </div>
            )}

            {/* Strength Selector */}
            <div className="form-group">
              <label className="form-label">Articulation Strength</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  className={`btn ${currentCellData?.level === 3 ? "btn-primary" : "btn-secondary"}`}
                  disabled={!isEditable}
                  style={{ flex: 1, padding: "6px" }}
                  onClick={() => handleSetStrength(3)}
                >
                  3 (Very)
                </button>
                <button
                  className={`btn ${currentCellData?.level === 2 ? "btn-primary" : "btn-secondary"}`}
                  disabled={!isEditable}
                  style={{ flex: 1, padding: "6px" }}
                  onClick={() => handleSetStrength(2)}
                >
                  2 (Strong)
                </button>
                <button
                  className={`btn ${currentCellData?.level === 1 ? "btn-primary" : "btn-secondary"}`}
                  disabled={!isEditable}
                  style={{ flex: 1, padding: "6px" }}
                  onClick={() => handleSetStrength(1)}
                >
                  1 (Mod)
                </button>
                <button
                  className="btn btn-ghost"
                  disabled={!isEditable}
                  style={{ flex: 1, padding: "6px", color: "var(--rose)" }}
                  onClick={() => handleSetStrength(null)}
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Justification Input */}
            <div className="form-group">
              <label className="form-label">One-Line Justification</label>
              <textarea
                className="form-textarea"
                disabled={!isEditable || !currentCellData}
                placeholder="Explain the curricular linkage between this outcome and the program outcome..."
                value={justificationInput}
                onChange={(e) => setJustificationInput(e.target.value)}
                rows={3}
              />
              {isEditable && currentCellData && (
                <button
                  className="btn btn-secondary"
                  style={{ marginTop: "6px", fontSize: "0.8rem" }}
                  onClick={handleSaveJustification}
                >
                  Save Justification
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Annexure A Drawer */}
      {showDrawer && !activeCell && (
        <div className="col-4">
          <div className="bento-card" style={{ maxHeight: "600px", overflowY: "auto" }}>
            <div className="bento-card-header">
              <h3 className="bento-card-title">Annexure A: Reference</h3>
              <button className="btn btn-ghost" onClick={() => setShowDrawer(false)}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.82rem" }}>
              <div style={{ fontWeight: 700, color: "var(--primary)" }}>PROGRAM OUTCOMES (PO-1 to PO-11)</div>
              {PO_DATA.map((p) => (
                <div key={p.id} style={{ borderBottom: "1px solid var(--glass-border)", paddingBottom: "8px" }}>
                  <strong>{p.id}: {p.title}</strong>
                  <p style={{ margin: "2px 0 0 0", color: "var(--text-muted)" }}>{p.statement}</p>
                </div>
              ))}

              <div style={{ fontWeight: 700, color: "var(--indigo)", marginTop: "10px" }}>PROGRAM SPECIFIC OUTCOMES</div>
              {PSO_DATA.map((pso) => (
                <div key={pso.id} style={{ borderBottom: "1px solid var(--glass-border)", paddingBottom: "8px" }}>
                  <strong>{pso.id}</strong>
                  <p style={{ margin: "2px 0 0 0", color: "var(--text-muted)" }}>{pso.statement}</p>
                </div>
              ))}

              <div style={{ fontWeight: 700, color: "var(--emerald)", marginTop: "10px" }}>BLOOM'S TAXONOMY LEVELS</div>
              {BLOOM_DATA.map((b) => (
                <div key={b.level} style={{ padding: "4px 0" }}>
                  <strong>{b.level}: {b.name}</strong> - <span style={{ color: "var(--text-muted)" }}>{b.verbs}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
