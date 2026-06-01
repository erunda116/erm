import { useState } from "react";
import FencePlanEditor from "../2d/FencePlanEditor";
import Scene from "../3d/Scene";

type ViewMode = "2d" | "3d";

export default function Viewport() {
  const [mode, setMode] = useState<ViewMode>("2d");

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>

      {/* Кнопки 2D / 3D */}
      <div style={{
        position: "absolute",
        top: 12,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 100,
        display: "flex",
        gap: 4,
        background: "#1a1a1a",
        padding: 4,
        borderRadius: 8,
      }}>
        {(["2d", "3d"] as ViewMode[]).map((m) => (
          <button
            key={m}
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
      </div>

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