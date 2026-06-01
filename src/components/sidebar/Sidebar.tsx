import { useDesignerStore, FENCE_HEIGHT_OPTIONS } from "../../store/useDesignerStore";
import { calcPrice, PRICES } from "../../lib/pricing";

export default function Sidebar() {
  const fenceHeightM = useDesignerStore((s) => s.fenceHeightM);
  const setFenceHeight = useDesignerStore((s) => s.setFenceHeight);
  const clearAll = useDesignerStore((s) => s.clearAll);
  const fenceItems = useDesignerStore((s) => s.fenceItems);

  const price = calcPrice(fenceItems);

  return (
    <div style={{
      width: 260,
      background: "#1a1a1a",
      color: "#fff",
      padding: "20px 16px",
      display: "flex",
      flexDirection: "column",
      gap: 16,
      height: "100vh",
      boxSizing: "border-box",
    }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
        Euromuro Configurator
      </h2>

      {/* Высота забора */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <label style={{ fontSize: 13, color: "#aaa", fontWeight: 600 }}>
          ВЫСОТА ЗАБОРА
        </label>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {FENCE_HEIGHT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFenceHeight(opt.value)}
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                border: `2px solid ${fenceHeightM === opt.value ? "#fff" : "#444"}`,
                background: fenceHeightM === opt.value ? "#333" : "transparent",
                color: fenceHeightM === opt.value ? "#fff" : "#aaa",
                cursor: "pointer",
                textAlign: "left",
                fontSize: 13,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ height: 1, background: "#333" }} />

      <button style={btnStyle}>Add Panel</button>
      <button style={{ ...btnStyle, color: "#888" }}>Add Gate (later)</button>
      <button
        style={{ ...btnStyle, borderColor: "#c0392b", color: "#c0392b" }}
        onClick={clearAll}
      >
        Reset
      </button>

      {/* Растягиваем оставшееся пространство */}
      <div style={{ flex: 1 }} />

      {/* Расчёт стоимости */}
      {fenceItems.length > 0 && (
        <div style={{
          background: "#111",
          borderRadius: 8,
          padding: "14px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}>
          <div style={{ fontSize: 12, color: "#aaa", fontWeight: 600, marginBottom: 2 }}>
            РАСЧЁТ СТОИМОСТИ
          </div>

          {/* Панели */}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: "#ccc" }}>
              Панели × {price.panelCount}
            </span>
            <span style={{ color: "#fff" }}>
              {price.panelTotal} €
            </span>
          </div>
          <div style={{ fontSize: 11, color: "#555", marginTop: -6 }}>
            {price.panelCount} × {PRICES.panel} €
          </div>

          {/* Столбы */}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: "#ccc" }}>
              Столбы × {price.postCount}
            </span>
            <span style={{ color: "#fff" }}>
              {price.postTotal} €
            </span>
          </div>
          <div style={{ fontSize: 11, color: "#555", marginTop: -6 }}>
            {price.postCount} × {PRICES.post} €
          </div>

          <div style={{ height: 1, background: "#333", margin: "4px 0" }} />

          {/* Total */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>ИТОГО</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: "#4fc3a1" }}>
              {price.total} €
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "9px 12px",
  borderRadius: 6,
  border: "1px solid #444",
  background: "transparent",
  color: "#fff",
  cursor: "pointer",
  textAlign: "left",
  fontSize: 13,
};