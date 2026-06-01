import { useState } from "react";
import FencePlanEditor from "../2d/FencePlanEditor";
import Scene from "../3d/Scene";
import { useDesignerStore } from "../../store/useDesignerStore";

type ViewMode = "2d" | "3d";

export default function Viewport() {
  const [mode, setMode]       = useState<ViewMode>("2d");
  const activeTool            = useDesignerStore((s) => s.activeTool);
  const setActiveTool         = useDesignerStore((s) => s.setActiveTool);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>

      {/* Кнопки 2D / 3D + инструменты */}
      <div style={{
        position: "absolute", top: 12, left: "50%",
        transform: "translateX(-50%)",
        zIndex: 100, display: "flex", gap: 4, alignItems: "center",
        background: "#1a1a1a", padding: 4, borderRadius: 8,
      }}>
        {(["2d", "3d"] as ViewMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              padding: "6px 20px", borderRadius: 6, border: "none",
              background: mode === m ? "#fff" : "transparent",
              color: mode === m ? "#000" : "#aaa",
              cursor: "pointer", fontWeight: 600, fontSize: 14,
            }}
          >
            {m.toUpperCase()}
          </button>
        ))}

        {mode === "2d" && (
          <>
            <div style={{ width: 1, height: 24, background: "#444", margin: "0 4px" }} />
            {(["fence", "house"] as const).map((tool) => (
              <button
                key={tool}
                onClick={() => setActiveTool(tool)}
                style={{
                  padding: "6px 14px", borderRadius: 6, border: "none",
                  background: activeTool === tool ? "#4fc3a1" : "transparent",
                  color: activeTool === tool ? "#000" : "#aaa",
                  cursor: "pointer", fontWeight: 600, fontSize: 13,
                }}
              >
                {tool === "fence" ? "✏️ Fence" : "🏠 Building"}
              </button>
            ))}
          </>
        )}
      </div>

      {/* Контент */}
      {mode === "2d" && (
        <div style={{ width: "100%", height: "100%" }}>
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