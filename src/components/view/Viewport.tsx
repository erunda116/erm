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
  { id: "grid",    label: "groundGrid",    emoji: "⬜" },
  { id: "grass",   label: "groundLawn",    emoji: "🌿" },
  { id: "calcada", label: "groundCalcada", emoji: "🪨" },
  { id: "ground",  label: "groundGround",  emoji: "🟫" },
];

export default function Viewport() {
  const [mode, setMode] = useState<ViewMode>("2d");
  const activeTool      = useDesignerStore((s) => s.activeTool);
  const setActiveTool   = useDesignerStore((s) => s.setActiveTool);
  const groundType      = useDesignerStore((s) => s.groundType);
  const setGroundType   = useDesignerStore((s) => s.setGroundType);
  const t               = useT();

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {/* Wrapper, который центрирует панель, но не содержит transform внутри */}
      <div
        style={{
          position: "absolute",
          top: 12,
          left: "50%",
          transform: "translateX(-50%)",
          width: "max-content",
          zIndex: 100,
        }}
      >
        {/* Панель кнопок — без transform, чтобы не создавать отдельный stacking context */}
        <div
          style={{
            display: "flex",
            gap: 4,
            alignItems: "center",
            background: "#1a1a1a",
            padding: 4,
            borderRadius: 8,
            maxWidth: "calc(100vw - 32px)",
            overflowX: "auto",
          }}
        >
          {(["2d", "3d"] as ViewMode[]).map((m) => (
            <button
              key={m}
              id={m === "2d" ? "tour-2d-btn" : "tour-3d-btn"}
              onClick={() => setMode(m)}
              style={{
                padding: "6px 20px",
                borderRadius: 6,
                border: "none",
                background: mode === m ? "#fff" : "transparent",
                color: mode === m ? "#000" : "#aaa",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              {m.toUpperCase()}
            </button>
          ))}

          {mode === "2d" && (
            <>
              <div
                style={{
                  width: 1,
                  height: 24,
                  background: "#444",
                  margin: "0 4px",
                }}
              />
              {(["fence", "house"] as const).map((tool) => (
                <button
                  key={tool}
                  id={
                    tool === "fence"
                      ? "tour-fence-btn"
                      : "tour-building-btn"
                  }
                  onClick={() => setActiveTool(tool)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 6,
                    border: "none",
                    background:
                      activeTool === tool ? "#d3001b" : "transparent",
                    color: activeTool === tool ? "#fff" : "#fff",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  {tool === "fence"
                    ? t("toolFence")
                    : t("toolBuilding")}
                </button>
              ))}
            </>
          )}

          {mode === "3d" && (
  <>
    <div id="tour-ground" style={{ display: "flex", gap: 4 }}>
      {GROUND_OPTIONS.map((opt) => (
        <button
          key={opt.id}
          // ← убери id={opt.id === "grid" ? "tour-ground" : undefined}
          onClick={() => setGroundType(opt.id)}
          style={{
            padding: "6px 10px",
            borderRadius: 6,
            border: "none",
            background: groundType === opt.id ? "#d3001b" : "transparent",
            color: groundType === opt.id ? "#fff" : "#fff",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 12,
          }}
        >
          {opt.emoji} {t(opt.label as any)}
        </button>
      ))}
    </div>
  </>
)}
        </div>
      </div>

      {/* Контент */}
      {mode === "2d" && (
        <div
          id="tour-canvas-2d"
          style={{ width: "100%", height: "100%" }}
        >
          <FencePlanEditor />
        </div>
      )}

      {mode === "3d" && (
        <div style={{ width: "100%", height: "100%" }}>
          <Scene />
        </div>
      )}
    </div>
  );
}