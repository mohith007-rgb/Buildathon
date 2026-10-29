import { useEffect, useState } from "react";
import { call, loadSettings, setActiveUserRole } from "./api";
import type { ScreenId, Role, SpecState } from "./types";
import { EMPTY_SPEC } from "./initialState";
import { Navigation } from "./components/Navigation";
import { DashboardScreen } from "./components/screens/DashboardScreen";
import { SpecScreen } from "./components/screens/SpecScreen";
import { MappingScreen } from "./components/screens/MappingScreen";
import { ValidationScreen } from "./components/screens/ValidationScreen";
import { ExportScreen } from "./components/screens/ExportScreen";
import { WorkflowScreen } from "./components/screens/WorkflowScreen";
import Settings from "./Settings";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>("dashboard");
  const [role, setRoleState] = useState<Role>("Author");
  const [specState, setSpecState] = useState<SpecState>(() => {
    try {
      const stored = localStorage.getItem("specforge.specState");
      if (stored) return JSON.parse(stored);
    } catch {
      // storage unavailable
    }
    return EMPTY_SPEC;
  });
  const [serverHealth, setHealth] = useState("checking...");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hasAiKey, setHasAiKey] = useState(false);

  const handleRoleChange = (newRole: Role) => {
    setRoleState(newRole);
    setActiveUserRole(newRole);
  };

  useEffect(() => {
    try {
      localStorage.setItem("specforge.specState", JSON.stringify(specState));
    } catch {
      // ignore
    }
  }, [specState]);

  const checkKey = () => {
    const s = loadSettings();
    setHasAiKey(!!s.key && s.key.trim().length > 0);
  };

  useEffect(() => {
    call<{ status: string }>("/health")
      .then((d) => setHealth(d.status))
      .catch(() => setHealth("offline"));
    checkKey();
  }, []);

  const handleOpenSettings = () => {
    setSettingsOpen(true);
  };

  const handleCloseSettings = () => {
    setSettingsOpen(false);
    checkKey();
  };

  return (
    <div className="app-container">
      <Navigation
        currentScreen={currentScreen}
        onScreenChange={setCurrentScreen}
        role={role}
        onRoleChange={handleRoleChange}
        workflowStatus={specState.workflow_status}
        serverHealth={serverHealth}
        hasAiKey={hasAiKey}
        onOpenSettings={handleOpenSettings}
        defectsCount={specState.defects.length}
      />

      <main className="main-viewport">
        {currentScreen === "dashboard" && (
          <DashboardScreen
            specState={specState}
            onUpdateSpec={setSpecState}
            onNavigate={setCurrentScreen}
          />
        )}

        {currentScreen === "spec" && (
          <SpecScreen
            specState={specState}
            onUpdateSpec={setSpecState}
            role={role}
            onNavigate={setCurrentScreen}
          />
        )}

        {currentScreen === "mapping" && (
          <MappingScreen
            specState={specState}
            onUpdateSpec={setSpecState}
            role={role}
            onNavigate={setCurrentScreen}
          />
        )}

        {currentScreen === "validation" && (
          <ValidationScreen
            specState={specState}
            onUpdateSpec={setSpecState}
            onNavigate={setCurrentScreen}
          />
        )}

        {currentScreen === "export" && (
          <ExportScreen
            specState={specState}
            onUpdateSpec={setSpecState}
            role={role}
            onNavigate={setCurrentScreen}
          />
        )}

        {currentScreen === "workflow" && (
          <WorkflowScreen
            specState={specState}
            onUpdateSpec={setSpecState}
            role={role}
          />
        )}
      </main>

      {settingsOpen && <Settings onClose={handleCloseSettings} />}
    </div>
  );
}
