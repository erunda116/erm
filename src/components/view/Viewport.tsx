import { useState } from "react";
import FencePlanEditor from "../2d/FencePlanEditor";
import Scene from "../3d/Scene";
import { useDesignerStore } from "../../store/useDesignerStore";
import { useT } from "../../lib/i18n";

type ViewMode = "2d" | "3d";

const GROUND_OPTIONS: {
  id: "grass" | "calcada" | "ground" | "grid";
  label: string;
  emoji: string;
}[] = [
  { id: "grid", label: "groundGrid", emoji: "⬜" },
  { id: "grass", label: "groundLawn", emoji: "🌿" },
  { id: "calcada", label: "groundCalcada", emoji: "🪨" },
  { id: "ground", label: "groundGround", emoji: "🟫" },
];

export default function Viewport() {
  const [mode, setMode] = useState<ViewMode>("2d");
  const activeTool = useDesignerStore((s) => s.activeTool);
  const setActiveTool = useDesignerStore((s) => s.setActiveTool);
  const groundType = useDesignerStore((s) => s.groundType);
  const setGroundType = useDesignerStore((s) => s.setGroundType);
  const t = useT();

  return (
    <div className="viewport-root">
      <div className="viewport-toolbar-wrap">
        <div className="viewport-toolbar">
          {(["2d", "3d"] as ViewMode[]).map((m) => (
            <button
              key={m}
              id={m === "2d" ? "tour-2d-btn" : "tour-3d-btn"}
              onClick={() => setMode(m)}
              className={`viewport-btn viewport-btn--mode ${
                mode === m ? "is-active is-active-light" : ""
              }`}
              type="button"
            >
              {m.toUpperCase()}
            </button>
          ))}

          {mode === "2d" && (
            <>
              <div className="viewport-toolbar-divider" />

              {(["fence", "house"] as const).map((tool) => (
                <button
                  key={tool}
                  id={tool === "fence" ? "tour-fence-btn" : "tour-building-btn"}
                  onClick={() => setActiveTool(tool)}
                  className={`viewport-btn viewport-btn--tool ${
                    activeTool === tool ? "is-active is-active-red" : ""
                  }`}
                  type="button"
                >
                  {tool === "fence" ? t("toolFence") : t("toolBuilding")}
                </button>
              ))}
            </>
          )}

          {mode === "3d" && (
            <>
              <div className="viewport-toolbar-divider" />

              <div id="tour-ground" className="viewport-ground-group">
                {GROUND_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setGroundType(opt.id)}
                    className={`viewport-btn viewport-btn--ground ${
                      groundType === opt.id ? "is-active is-active-red" : ""
                    }`}
                    type="button"
                  >
                    <span className="viewport-btn-emoji" aria-hidden="true">
                      {opt.emoji}
                    </span>
                    <span>{t(opt.label as any)}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {mode === "2d" && (
        <div id="tour-canvas-2d" className="viewport-content">
          <FencePlanEditor />
        </div>
      )}

      {mode === "3d" && (
        <div className="viewport-content">
          <Scene />
        </div>
      )}
    </div>
  );
}