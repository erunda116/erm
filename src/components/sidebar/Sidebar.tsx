import {
  useDesignerStore,
  FENCE_HEIGHTS_CM,
  getAvailablePanels,
  getFilledHeight,
} from "../../store/useDesignerStore";
import { getPanelsForSingleModel } from "../../data/panels";
import { useState, useRef, useEffect } from "react";
import { calcPrice } from "../../lib/pricing";
import { PILLAR_MODELS } from "../../data/posts";
import type { PanelModel } from "../../data/panels";
import type { PillarModel, PillarStyle } from "../../data/posts";

export default function Sidebar() {
  const fenceHeightCm = useDesignerStore((s) => s.fenceHeightCm);
  const setFenceHeight = useDesignerStore((s) => s.setFenceHeight);
  const singleModel = useDesignerStore((s) => s.singleModel);
  const setSingleModel = useDesignerStore((s) => s.setSingleModel);
  const singlePanel = useDesignerStore((s) => s.singlePanel);
  const setSinglePanel = useDesignerStore((s) => s.setSinglePanel);
  const rows = useDesignerStore((s) => s.rows);
  const setRowPanel = useDesignerStore((s) => s.setRowPanel);
  const selectedPillarStyle = useDesignerStore((s) => s.selectedPillarStyle);
  const setSelectedPillarStyle = useDesignerStore((s) => s.setSelectedPillarStyle);
  const activePillar = useDesignerStore((s) => s.activePillar);
  const fenceItems = useDesignerStore((s) => s.fenceItems);
  const clearAll = useDesignerStore((s) => s.clearAll);

  const price = calcPrice(fenceItems, rows, activePillar);

  return (
    <div style={{
      width: 270,
      background: "#1a1a1a",
      color: "#fff",
      padding: "20px 16px",
      display: "flex",
      flexDirection: "column",
      gap: 14,
      height: "100vh",
      boxSizing: "border-box",
      overflowY: "auto",
    }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Euromuro Configurator</h2>

      {/* ШАГ 1 */}
      <Section step="1" label="ВЫСОТА ЗАБОРА">
        <HeightDropdown value={fenceHeightCm} onChange={setFenceHeight} />
      </Section>

      <Divider />

      {/* ШАГ 2 */}
      {/* ШАГ 2 */}
{/* ШАГ 2 */}
<Section step="2" label="ПАНЕЛИ">
  {/* Переключатель — только если возможен одиночный режим */}
  {getPanelsForSingleModel(fenceHeightCm).length > 0 ? (
    <div style={{ display: "flex", background: "#222", borderRadius: 8, padding: 3, gap: 3 }}>
      <ToggleBtn active={singleModel} onClick={() => setSingleModel(true)}>
        Одна модель
      </ToggleBtn>
      <ToggleBtn active={!singleModel} onClick={() => setSingleModel(false)}>
        По рядам
      </ToggleBtn>
    </div>
  ) : (
    <div style={{ fontSize: 11, color: "#888", background: "#222", borderRadius: 6, padding: "6px 10px" }}>
      ℹ️ Эту высоту можно набрать только комбинацией рядов
    </div>
  )}

  {singleModel && getPanelsForSingleModel(fenceHeightCm).length > 0 ? (
    <PanelDropdown
      selected={singlePanel}
      onSelect={setSinglePanel}
      availablePanels={getPanelsForSingleModel(fenceHeightCm)}
    />
  ) : (
    <DynamicRows />
  )}
</Section>

      <Divider />

      {/* ШАГ 3 */}
      <Section step="3" label="СТОЛБ">
        <PillarDropdown
          selectedStyle={selectedPillarStyle}
          activePillar={activePillar}
          onSelectStyle={setSelectedPillarStyle}
        />
        <div style={{
          background: "#222",
          borderRadius: 6,
          padding: "8px 10px",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
          <Thumb src={activePillar.imagePath} alt={activePillar.id} w={44} h={36} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600 }}>{activePillar.heightCm} cm</div>
            <div style={{ fontSize: 11, color: "#888" }}>
              {activePillar.aboveGroundCm} см над землёй · {activePillar.price} €
            </div>
          </div>
          <div style={{
            fontSize: 10, color: "#4fc3a1",
            background: "#1e3530", padding: "2px 6px", borderRadius: 4,
          }}>
            авто
          </div>
        </div>
      </Section>

      <Divider />

      <button
        style={{ ...btnStyle, borderColor: "#c0392b", color: "#c0392b" }}
        onClick={clearAll}
      >
        Reset
      </button>

      <div style={{ flex: 1 }} />

      {fenceItems.length > 0 && <PriceBlock price={price} pillar={activePillar} />}
    </div>
  );
}

function DynamicRows() {
  const fenceHeightCm = useDesignerStore((s) => s.fenceHeightCm);
  const filledRows = useDesignerStore((s) => s.filledRows);
  const setFilledRow = useDesignerStore((s) => s.setFilledRow);
  const resetFilledRows = useDesignerStore((s) => s.resetFilledRows);

  const filledHeight = getFilledHeight(filledRows);
  const remaining = fenceHeightCm - filledHeight;
  const isComplete = remaining === 0;

  // Ряды которые показываем: все заполненные + один пустой (если ещё не набрали высоту)
  const visibleCount = isComplete ? filledRows.length : filledRows.length + 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {/* Прогресс-бар */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
        <div style={{ flex: 1, height: 4, background: "#333", borderRadius: 2, overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${(filledHeight / fenceHeightCm) * 100}%`,
            background: isComplete ? "#4fc3a1" : "#f39c12",
            borderRadius: 2,
            transition: "width 0.3s ease",
          }} />
        </div>
        <span style={{ fontSize: 11, color: isComplete ? "#4fc3a1" : "#888", whiteSpace: "nowrap" }}>
          {filledHeight} / {fenceHeightCm} см
        </span>
      </div>

      {/* Ряды снизу вверх */}
      {Array.from({ length: visibleCount }).map((_, i) => {
        const filled = filledRows[i];
        const prevHeight = getFilledHeight(filledRows.slice(0, i));
        const remainingForThis = fenceHeightCm - prevHeight;
        const available = getAvailablePanels(remainingForThis);
        const rowNum = i + 1;

        return (
          <div key={i} style={{ opacity: i > filledRows.length ? 0.4 : 1, transition: "opacity 0.2s" }}>
            <div style={{ fontSize: 11, color: "#666", marginBottom: 3, display: "flex", justifyContent: "space-between" }}>
              <span>Ряд {rowNum} (снизу)</span>
              {filled && <span style={{ color: "#4fc3a1" }}>{filled.heightCm} см ✓</span>}
              {!filled && <span style={{ color: "#f39c12" }}>осталось {remainingForThis} см</span>}
            </div>

            {filled ? (
              // Заполненный ряд — показываем выбранную панель, можно кликнуть чтобы изменить
              <button
                onClick={() => setFilledRow(i, filled.panel)}
                style={{
                  ...triggerStyle(false),
                  borderColor: "#4fc3a1",
                  cursor: "pointer",
                }}
              >
                <Thumb src={filled.panel.imagePath} alt={filled.panel.label} w={44} h={34} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{filled.panel.label}</div>
                  <div style={{ fontSize: 11, color: "#888" }}>{filled.panel.heightCm} см · {filled.panel.price} €</div>
                </div>
                <span style={{ fontSize: 10, color: "#888" }}>изменить</span>
              </button>
            ) : (
              // Пустой ряд — показываем дропдаун с доступными панелями
              <PanelDropdown
                selected={available[0]}
                onSelect={(panel) => setFilledRow(i, panel)}
                availablePanels={available}
                placeholder="Выберите панель..."
              />
            )}
          </div>
        );
      })}

      {/* Кнопка сброса рядов */}
      {filledRows.length > 0 && (
        <button
          onClick={resetFilledRows}
          style={{ fontSize: 11, color: "#888", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: "2px 0" }}
        >
          ↩ Начать заново
        </button>
      )}
    </div>
  );
}
// ─── HeightDropdown ────────────────────────────────────────────────────────────

function HeightDropdown({ value, onChange }: { value: number; onChange: (cm: number) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function outside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen((v) => !v)} style={triggerStyle(open)}>
        <div style={{ flex: 1 }}>
          <span style={{ fontWeight: 600, fontSize: 13 }}>{value} см</span>
          <span style={{ color: "#888", fontSize: 12, marginLeft: 8 }}>
            ({(value / 100).toFixed(2)} м)
          </span>
        </div>
        <Arrow open={open} />
      </button>

      {open && (
        <div style={dropdownListStyle}>
          {FENCE_HEIGHTS_CM.map((cm, idx) => (
            <button
              key={cm}
              onClick={() => { onChange(cm); setOpen(false); }}
              style={dropdownItemStyle(value === cm, idx === FENCE_HEIGHTS_CM.length - 1)}
            >
              <span style={{ fontWeight: 600, color: value === cm ? "#4fc3a1" : "#fff" }}>
                {cm} см
              </span>
              <span style={{ color: "#666", fontSize: 12, marginLeft: 8 }}>
                ({(cm / 100).toFixed(2)} м)
              </span>
              {value === cm && <span style={{ marginLeft: "auto", color: "#4fc3a1" }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PanelDropdown ─────────────────────────────────────────────────────────────

function PanelDropdown({
  selected,
  onSelect,
  availablePanels = PANEL_MODELS,
  placeholder,
}: {
  selected?: PanelModel;
  onSelect: (p: PanelModel) => void;
  availablePanels?: PanelModel[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function outside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen((v) => !v)} style={triggerStyle(open)}>
        {selected ? (
          <>
            <Thumb src={selected.imagePath} alt={selected.label} w={44} h={34} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{selected.label}</div>
              <div style={{ fontSize: 11, color: "#888" }}>{selected.heightCm} см · {selected.price} €</div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, fontSize: 13, color: "#888" }}>{placeholder ?? "Выберите..."}</div>
        )}
        <Arrow open={open} />
      </button>

      {open && (
        <div style={dropdownListStyle}>
          {availablePanels.map((panel, idx) => (
            <button
              key={panel.id}
              onClick={() => { onSelect(panel); setOpen(false); }}
              style={dropdownItemStyle(selected?.id === panel.id, idx === availablePanels.length - 1)}
            >
              <Thumb src={panel.imagePath} alt={panel.label} w={52} h={38} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: selected?.id === panel.id ? "#4fc3a1" : "#fff" }}>
                  {panel.label}
                </div>
                <div style={{ fontSize: 11, color: "#888" }}>{panel.heightCm} см · {panel.price} €/шт</div>
              </div>
              {selected?.id === panel.id && <span style={{ color: "#4fc3a1" }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PillarDropdown ────────────────────────────────────────────────────────────

function PillarDropdown({ selectedStyle, activePillar, onSelectStyle }: {
  selectedStyle: PillarStyle;
  activePillar: PillarModel;
  onSelectStyle: (s: PillarStyle) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function outside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  const pillarOptions = (["smooth", "woodlike"] as PillarStyle[]).map((style) => {
    return PILLAR_MODELS.find((p) => p.style === style && p.heightCm === activePillar.heightCm)
      ?? PILLAR_MODELS.find((p) => p.style === style)!;
  });

  const selectedPillar = pillarOptions.find((p) => p.style === selectedStyle)!;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen((v) => !v)} style={triggerStyle(open)}>
        <Thumb src={selectedPillar.imagePath} alt={selectedPillar.id} w={44} h={34} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>
            {selectedPillar.style === "smooth" ? "Smooth" : "Woodlike"}
          </div>
          <div style={{ fontSize: 11, color: "#888" }}>{selectedPillar.price} €/шт</div>
        </div>
        <Arrow open={open} />
      </button>

      {open && (
        <div style={dropdownListStyle}>
          {pillarOptions.map((pillar, idx) => (
            <button
              key={pillar.id}
              onClick={() => { onSelectStyle(pillar.style); setOpen(false); }}
              style={dropdownItemStyle(selectedStyle === pillar.style, idx === pillarOptions.length - 1)}
            >
              <Thumb src={pillar.imagePath} alt={pillar.id} w={52} h={38} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: selectedStyle === pillar.style ? "#4fc3a1" : "#fff" }}>
                  {pillar.style === "smooth" ? "Smooth" : "Woodlike"}
                </div>
                <div style={{ fontSize: 11, color: "#888" }}>{pillar.price} €/шт</div>
              </div>
              {selectedStyle === pillar.style && <span style={{ color: "#4fc3a1" }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PriceBlock ────────────────────────────────────────────────────────────────

function PriceBlock({ price, pillar }: { price: ReturnType<typeof calcPrice>; pillar: PillarModel }) {
  return (
    <div style={{ background: "#111", borderRadius: 8, padding: "14px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontSize: 12, color: "#aaa", fontWeight: 600, marginBottom: 2 }}>РАСЧЁТ СТОИМОСТИ</div>

      {price.rowBreakdown.map((row, i) => (
        row.count > 0 && (
          <div key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span style={{ color: "#ccc" }}>{row.label} × {row.count}</span>
              <span style={{ color: "#fff" }}>{row.total} €</span>
            </div>
            <div style={{ fontSize: 11, color: "#555" }}>{row.count} × {row.price} €</div>
          </div>
        )
      ))}

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
        <span style={{ color: "#ccc" }}>Столбы × {price.postCount}</span>
        <span style={{ color: "#fff" }}>{price.postTotal} €</span>
      </div>
      <div style={{ fontSize: 11, color: "#555" }}>{price.postCount} × {pillar.price} €</div>

      <div style={{ height: 1, background: "#333", margin: "4px 0" }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 14, fontWeight: 700 }}>ИТОГО</span>
        <span style={{ fontSize: 18, fontWeight: 700, color: "#4fc3a1" }}>{price.total} €</span>
      </div>
    </div>
  );
}

// ─── Общие компоненты ──────────────────────────────────────────────────────────

function Section({ step, label, children }: { step: string; label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          width: 20, height: 20, borderRadius: "50%",
          background: "#333", color: "#4fc3a1",
          fontSize: 11, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          {step}
        </div>
        <label style={{ fontSize: 12, color: "#aaa", fontWeight: 600 }}>{label}</label>
      </div>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "#333" }} />;
}

function ToggleBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: "6px 4px", borderRadius: 6, border: "none",
      background: active ? "#4fc3a1" : "transparent",
      color: active ? "#000" : "#888",
      cursor: "pointer", fontSize: 12, fontWeight: active ? 700 : 400,
      transition: "all 0.15s",
    }}>
      {children}
    </button>
  );
}

function Thumb({ src, alt, w, h }: { src: string; alt: string; w: number; h: number }) {
  return (
    <div style={{ width: w, height: h, borderRadius: 4, overflow: "hidden", flexShrink: 0, background: "#333", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <img
        src={src}
        alt={alt}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
        onError={(e) => {
          const t = e.target as HTMLImageElement;
          t.style.display = "none";
          t.parentElement!.innerHTML = `<span style="font-size:16px">🧱</span>`;
        }}
      />
    </div>
  );
}

function Arrow({ open }: { open: boolean }) {
  return (
    <div style={{
      fontSize: 10, color: "#888",
      transform: open ? "rotate(180deg)" : "none",
      transition: "transform 0.2s", flexShrink: 0,
    }}>▼</div>
  );
}

function triggerStyle(open: boolean): React.CSSProperties {
  return {
    width: "100%", padding: "8px 10px", borderRadius: 8,
    border: `2px solid ${open ? "#4fc3a1" : "#444"}`,
    background: "#222", color: "#fff", cursor: "pointer",
    display: "flex", alignItems: "center", gap: 8, textAlign: "left",
  };
}

const dropdownListStyle: React.CSSProperties = {
  position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
  background: "#222", border: "2px solid #444", borderRadius: 8,
  overflow: "auto", maxHeight: 260,
  zIndex: 1000, boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
};

function dropdownItemStyle(selected: boolean, isLast: boolean): React.CSSProperties {
  return {
    width: "100%", padding: "10px",
    background: selected ? "#1e3530" : "transparent",
    border: "none", borderBottom: isLast ? "none" : "1px solid #333",
    color: "#fff", cursor: "pointer",
    display: "flex", alignItems: "center", gap: 10, textAlign: "left",
  };
}

const btnStyle: React.CSSProperties = {
  padding: "9px 12px", borderRadius: 6, border: "1px solid #444",
  background: "transparent", color: "#fff", cursor: "pointer", textAlign: "left", fontSize: 13,
};