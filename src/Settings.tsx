import { useState } from "react";
import { call, clearKey, DEFAULT_MODELS, loadSettings, saveSettings, type Provider } from "./api";

export default function Settings({ onClose }: { onClose: () => void }) {
  const [s, setS] = useState(loadSettings());
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const update = (patch: Partial<typeof s>) => {
    const n = { ...s, ...patch };
    setS(n);
    saveSettings(n);
    setMsg(null);
  };

  async function test() {
    setBusy(true);
    setMsg(null);
    try {
      const r = await call<{ model: string }>("/llm-check");
      setMsg({ ok: true, text: `Key verified successfully with model ${r.model}.` });
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="liquid-modal-overlay" role="dialog" aria-modal="true" aria-label="AI Settings">
      <div className="liquid-modal-panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.25rem", color: "var(--primary)", fontWeight: 700 }}>
              AI Provider Settings
            </h2>
            <p style={{ margin: "2px 0 0 0", fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Bring Your Own Key (Ephemeral browser storage only)
            </p>
          </div>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: "4px 8px" }}>
            ✕
          </button>
        </div>

        <div style={{ padding: "10px 12px", background: "var(--primary-light)", borderRadius: "var(--radius-md)", fontSize: "0.8rem", color: "var(--primary)", lineHeight: 1.4 }}>
          🔒 <strong>Privacy Assurance:</strong> Your API key is stored only in this browser's <code>localStorage</code>. It is transmitted in ephemeral headers per request and is never persisted on the server or logged.
        </div>

        <div className="form-group" style={{ marginBottom: "10px" }}>
          <label className="form-label">AI Provider</label>
          <select
            className="form-select"
            value={s.provider}
            onChange={(e) => update({ provider: e.target.value as Provider, model: "" })}
          >
            <option value="gemini">Google Gemini (Recommended)</option>
            <option value="openrouter">OpenRouter</option>
            <option value="anthropic">Anthropic (Claude)</option>
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: "10px" }}>
          <label className="form-label">API Key</label>
          <div style={{ display: "flex", gap: "6px" }}>
            <input
              className="form-input"
              style={{ flex: 1 }}
              type={showKey ? "text" : "password"}
              autoComplete="off"
              value={s.key}
              onChange={(e) => update({ key: e.target.value })}
              placeholder="Paste provider API key..."
            />
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: "8px 12px", fontSize: "0.8rem" }}
              onClick={() => setShowKey(!showKey)}
              title={showKey ? "Hide key" : "Show key"}
            >
              {showKey ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: "12px" }}>
          <label className="form-label">Model Identifier</label>
          <input
            className="form-input"
            value={s.model}
            onChange={(e) => update({ model: e.target.value })}
            placeholder={DEFAULT_MODELS[s.provider]}
          />
          <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: "2px" }}>
            Default for {s.provider}: <code>{DEFAULT_MODELS[s.provider]}</code>
          </span>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end", borderTop: "1px solid var(--glass-border)", paddingTop: "14px" }}>
          <button
            className="btn btn-ghost"
            style={{ color: "var(--rose)", marginRight: "auto" }}
            onClick={() => {
              clearKey();
              setS(loadSettings());
              setMsg({ ok: true, text: "API key cleared from browser storage." });
            }}
          >
            Clear key
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button className="btn btn-primary" onClick={test} disabled={busy || !s.key}>
            {busy ? "Verifying..." : "⚡ Test Key"}
          </button>
        </div>

        {msg && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "var(--radius-md)",
              background: msg.ok ? "var(--emerald-bg)" : "var(--rose-bg)",
              border: `1px solid ${msg.ok ? "var(--emerald-border)" : "var(--rose-border)"}`,
              color: msg.ok ? "var(--emerald)" : "var(--rose)",
              fontSize: "0.84rem",
              fontWeight: 500,
            }}
          >
            {msg.ok ? "✓ " : "✕ "} {msg.text}
          </div>
        )}
      </div>
    </div>
  );
}
