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
import { PANEL_MODELS } from "../../data/panels";
import { generateQuotationPdf } from '../../lib/generateQuotationPdf';
import { searchCities, roadDistanceKm, calcDelivery, getTruckCount } from '../../lib/delivery';
import type { CityResult } from '../../lib/delivery';
import { useT } from '../../lib/i18n';
import TourGuide from '../ui/TourGuide';
import type { Locale } from '../../lib/i18n';
import { createPortal } from "react-dom";

export default function Sidebar() {
  const locale = useDesignerStore((s) => s.locale);
  const setLocale = useDesignerStore((s) => s.setLocale);
  const t = useT();
  const fenceHeightCm = useDesignerStore((s) => s.fenceHeightCm);
  const setFenceHeight = useDesignerStore((s) => s.setFenceHeight);
  const singleModel = useDesignerStore((s) => s.singleModel);
  const setSingleModel = useDesignerStore((s) => s.setSingleModel);
  const singlePanel = useDesignerStore((s) => s.singlePanel);
  const setSinglePanel = useDesignerStore((s) => s.setSinglePanel);
  const rows = useDesignerStore((s) => s.rows);
  const selectedPillarStyle = useDesignerStore((s) => s.selectedPillarStyle);
  const setSelectedPillarStyle = useDesignerStore((s) => s.setSelectedPillarStyle);
  const activePillar = useDesignerStore((s) => s.activePillar);
  const fenceItems = useDesignerStore((s) => s.fenceItems);
  const clearAll = useDesignerStore((s) => s.clearAll);
  const panelOrientation = useDesignerStore((s) => s.panelOrientation);
  const setPanelOrientation = useDesignerStore((s) => s.setPanelOrientation);
  const baseConcreteColor = useDesignerStore((s) => s.baseConcreteColor);
const selectedRal = useDesignerStore((s) => s.selectedRal);
const setBaseConcreteColor = useDesignerStore((s) => s.setBaseConcreteColor);
const setSelectedRal = useDesignerStore((s) => s.setSelectedRal);
 const deliveryCity = useDesignerStore((s) => s.deliveryCity);
const deliveryCost = useDesignerStore((s) => s.deliveryCost);
const deliveryDistanceKm = useDesignerStore((s) => s.deliveryDistanceKm);
const setDeliveryCity = useDesignerStore((s) => s.setDeliveryCity);
 

  const price = calcPrice(fenceItems, rows, activePillar, baseConcreteColor);
  const { totalLengthM, totalWeightKg } = price;
  const hasItems = fenceItems.length > 0;
  const rowsPopupOpen = useDesignerStore((s) => s.rowsPopupOpen);
const setRowsPopupOpen = useDesignerStore((s) => s.setRowsPopupOpen);
const concreteColor = selectedRal ?? baseConcreteColor;

  return (
   <div className="config-sidebar">

      {/* Язык + заголовок */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{t('title')}</h2>
        <TourGuide />
        <div id="tour-lang" style={{ display: 'flex', gap: 4 }}>
          {(['en', 'pt', 'es'] as const).map((l) => (
            <button key={l} onClick={() => setLocale(l)} style={{
              padding: '2px 6px', borderRadius: 4, border: 'none', cursor: 'pointer',
              background: locale === l ? '#d3001b' : '#a1a1a1',
              color: locale === l ? '#fff' : '#fff',
              fontSize: 10, fontWeight: locale === l ? 700 : 400,
            }}>{l.toUpperCase()}</button>
          ))}
        </div>
      </div>

      <Divider />

      {/* ШАГ 1 */}
      <Section id="tour-step1" step="1" label={t('step1')}>
        <HeightDropdown value={fenceHeightCm} onChange={setFenceHeight} />
      </Section>

      <Divider />

      {/* ШАГ 2 */}
      <Section id="tour-step2" step="2" label={t('step2')}>
  {getPanelsForSingleModel(fenceHeightCm).length > 0 ? (
    <div id="tour-model-toggle" style={{ display: "flex", background: "#ffffff", borderRadius: 8, padding: 3, gap: 3, border: '2px solid #000000' }}>
      <ToggleBtn active={singleModel} onClick={() => setSingleModel(true)}>{t('singleModel')}</ToggleBtn>
      <ToggleBtn active={!singleModel} onClick={() => { setSingleModel(false); setRowsPopupOpen(true); }}>
        {t('byRows')}
      </ToggleBtn>
    </div>
  ) : (
    <div style={{ fontSize: 11, color: "#d3001b", background: "#ffffff", borderRadius: 6, padding: "4px 8px", border: '2px solid #d3001b' }}>
      {t('thisFenceNotificatorRed')}
    </div>
  )}

  {singleModel && getPanelsForSingleModel(fenceHeightCm).length > 0 ? (
    <PanelDropdown
      selected={singlePanel}
      onSelect={setSinglePanel}
      availablePanels={getPanelsForSingleModel(fenceHeightCm)}
      isWhite={baseConcreteColor === 'white'}
    />
  ) : (
    /* Компактный summary рядов вместо полного UI */
    <RowsSummary id="tour-rows-summary" onEdit={() => setRowsPopupOpen(true)} />
  )}
</Section>

      {/* ШАГ 2.5 */}
      {singlePanel.side === 'one' && (
        <>
          <Divider />
          <Section step="2.5" label={t('textureStep')}>
            <div id="tour-step25" style={{ display: "flex", background: "#ffffff", borderRadius: 8, padding: 3, gap: 3, border: '2px solid #000000' }}>
              <ToggleBtn active={panelOrientation === 'outward'} onClick={() => setPanelOrientation('outward')}>
                {t('inward')}
              </ToggleBtn>
              <ToggleBtn active={panelOrientation === 'inward'} onClick={() => setPanelOrientation('inward')}>
                {t('outward')}
              </ToggleBtn>
            </div>
            <div style={{ fontSize: 10, color: "#fff" }}>
              {panelOrientation === 'outward' ? t('textureFacingInside') : t('textureFacingOutside')}
            </div>
          </Section>
        </>
      )}

            <Divider />

      {/* Нижняя часть — две колонки */}
      <div style={{ display: "flex", gap: 10, flex: 1, minHeight: 0 }}>

        {/* ЛЕВАЯ — степы 3, 4, кнопки */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>

          <Section step="3" label={t('step3')}>
            <div id="tour-step3">
  <PillarDropdown
    selectedStyle={selectedPillarStyle}
    activePillar={activePillar}
    onSelectStyle={setSelectedPillarStyle}
    isWhite={baseConcreteColor === 'white'}
  />
</div>
            <div style={{ background: "#ffffff", borderRadius: 6, padding: "5px 7px", display: "flex", alignItems: "center", gap: 6, border: '2px solid #00000' }}>
              <Thumb src={activePillar.imagePath} alt={activePillar.id} w={32} h={26} />
              <div>
                <div style={{ fontSize: 11, fontWeight: 600 }}>{activePillar.heightCm} cm</div>
                <div style={{ fontSize: 10, color: "#000" }}>{activePillar.aboveGroundCm}cm · {baseConcreteColor === 'white' ? activePillar.priceWhite : activePillar.price}€</div>
              </div>
            </div>
          </Section>

          <Divider />

          <Section step="4" label={t('step4')}>
  <div id="tour-step4">
    <div style={{ display: "flex", gap: 6 }}>
      <ConcreteBtn
  hex="#000000"
  label="Grey"
  active={baseConcreteColor === 'grey' && selectedRal === null}
  onClick={() => {
    setBaseConcreteColor('grey');
    setSelectedRal(null);
  }}
  small
/>
      <ConcreteBtn
  hex="#f0ede8"
  label="White"
  active={baseConcreteColor === 'white' && selectedRal === null}
  onClick={() => {
    setBaseConcreteColor('white');
    setSelectedRal(null);
  }}
  small
/>
    </div>

    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop:5, }}>
      {RAL_COLORS.map((ral) => (
  <ConcreteBtn
    key={ral.hex}
    hex={ral.hex}
    label={ral.label}
    active={selectedRal === ral.hex}
    onClick={() => setSelectedRal(ral.hex)}
    small
  />
))}
    </div>
  </div>

 <div style={{ fontSize: 10, color: "#000" }}>
  {selectedRal
    ? baseConcreteColor === 'white'
      ? t('paintingRalTip')
      : t('paintingRalGrey')
    : baseConcreteColor === 'grey'
    ? t('standardGrey')
    : t('whiteConcrete')}
</div>
</Section>

          <Divider />

          <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: "auto" }}>
            {hasItems && (
              <button id="tour-pdf-btn"
                style={{ padding: "8px", borderRadius: 6, border: "none", cursor: "pointer", background: "#d3001b", color: "#fff", fontWeight: 700, fontSize: 12 }}
                onClick={() => generateQuotationPdf({
  price,
  pillar: activePillar,
  rows,
  fenceHeightCm,
  baseConcreteColor,
  selectedRal: selectedRal ?? undefined,
  panelOrientation,
  deliveryCity,
  deliveryDistanceKm,
  deliveryTrucks: deliveryCity ? getTruckCount(price.totalWeightKg) : 0,
  deliveryCost,
  locale
})}
              >
                {t('downloadPdf')}
              </button>
            )}
            <button
              style={{ padding: "8px", borderRadius: 6, border: "1px solid #c0392b", background: "transparent", color: "#c0392b", cursor: "pointer", fontSize: 12 }}
              onClick={clearAll}
            >
              {t('reset')}
            </button>
          </div>

        </div>

        {/* ПРАВАЯ — delivery + price */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          {hasItems ? (
            <>
             <div id="tour-delivery">
  <DeliveryBlock
  weightKg={price.totalWeightKg}
  deliveryCity={deliveryCity}
  deliveryDistanceKm={deliveryDistanceKm}
  deliveryCost={deliveryCost}
  onCityChange={(city, dist, cost) =>
    setDeliveryCity(city, dist, cost)
  }
/>
</div>
              <PriceBlock
                price={price}
                pillar={activePillar}
                totalLengthM={totalLengthM}
                totalWeightKg={totalWeightKg}
                isWhite={baseConcreteColor === 'white'}
              />
            </>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontSize: 11, color: "#444", textAlign: "center" }}>
                 {t('drawTheFenceToSee')}
              </div>
            </div>
          )}
        </div>

      </div>

      {rowsPopupOpen && createPortal(
  <RowsPopup onClose={() => setRowsPopupOpen(false)} />,
  document.body
)}

    </div>
  );
}

// ─── DynamicRows ───────────────────────────────────────────────────────────────

function DynamicRows() {
  const fenceHeightCm = useDesignerStore((s) => s.fenceHeightCm);
  const filledRows = useDesignerStore((s) => s.filledRows);
  const setFilledRow = useDesignerStore((s) => s.setFilledRow);
  const resetFilledRows = useDesignerStore((s) => s.resetFilledRows);
 const baseConcreteColor = useDesignerStore((s) => s.baseConcreteColor);
const t = useT();
const isWhite = baseConcreteColor === 'white';
  const filledHeight = getFilledHeight(filledRows);
  const remaining = fenceHeightCm - filledHeight;
  const isComplete = remaining === 0;
  const visibleCount = isComplete ? filledRows.length : filledRows.length + 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ flex: 1, height: 3, background: "#333", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${(filledHeight / fenceHeightCm) * 100}%`, background: isComplete ? "#d3001b" : "#f39c12", borderRadius: 2, transition: "width 0.3s ease" }} />
        </div>
        <span style={{ fontSize: 10, color: isComplete ? "#d3001b" : "#000", whiteSpace: "nowrap" }}>
          {filledHeight} / {fenceHeightCm} cm
        </span>
      </div>

      {Array.from({ length: visibleCount }).map((_, i) => {
        const filled = filledRows[i];
        const prevHeight = getFilledHeight(filledRows.slice(0, i));
        const remainingForThis = fenceHeightCm - prevHeight;
        const isTopRow = i === visibleCount - 1 && filledRows.length > 0;
        const available = getAvailablePanels(remainingForThis, isTopRow);

        return (
          <div key={i} style={{ opacity: i > filledRows.length ? 0.4 : 1 }}>
            <div style={{ fontSize: 10, color: "#fff", marginBottom: 2, display: "flex", justifyContent: "space-between" }}>
              <span>{t('nameRow')} {i + 1} ({t('below')})</span>
              {filled
                ? <span style={{ color: "#d3001b" }}>{filled.heightCm} cm ✓</span>
                : <span style={{ color: "#f39c12" }}>{t('calcLeft')} {remainingForThis} cm</span>}
            </div>
            {filled ? (
              <button onClick={() => setFilledRow(i, filled.panel)} style={{ ...triggerStyle(false), borderColor: "#d3001b", cursor: "pointer" }}>
                <Thumb src={filled.panel.imagePath} alt={filled.panel.label} w={38} h={28} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{filled.panel.label}</div>
                  <div style={{ fontSize: 10, color: "#000" }}>{filled.panel.heightCm} cm · {filled.panel.priceGrey} €</div>
                </div>
                <span style={{ fontSize: 10, color: "#000" }}>change</span>
              </button>
            ) : (
              <PanelDropdown selected={available[0]} onSelect={(panel) => setFilledRow(i, panel)} availablePanels={available} placeholder="Choose panel..." isWhite={isWhite} />
            )}
          </div>
        );
      })}

      {filledRows.length > 0 && (
        <button onClick={resetFilledRows} style={{ fontSize: 10, color: "#fff", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: "1px 0" }}>
          {t('startAgain')}
        </button>
      )}
    </div>
  );
}
function RowsSummary({ onEdit, id }: { onEdit: () => void, id?: string }) {
  const filledRows = useDesignerStore((s) => s.filledRows);
  const fenceHeightCm = useDesignerStore((s) => s.fenceHeightCm);
  const filledHeight = getFilledHeight(filledRows);
  const isComplete = filledHeight === fenceHeightCm;
  const t = useT();

  return (
    <button
      onClick={onEdit}
      style={{
        width: "100%", background: "#222", border: `2px solid ${isComplete ? "#d3001b" : "#f39c12"}`,
        borderRadius: 8, padding: "7px 10px", cursor: "pointer", color: "#fff",
        display: "flex", alignItems: "center", gap: 8, textAlign: "left",
      }}
    >
      <div style={{ flex: 1 }}>
        {filledRows.length === 0 ? (
          <div style={{ fontSize: 12, color: "#000" }}>Configure rows...</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {filledRows.map((row, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                <span style={{ color: "#ccc" }}>{t('nameRow')} {i + 1}: {row.panel.label}</span>
                <span style={{ color: "#000" }}>{row.heightCm} cm</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2, flexShrink: 0 }}>
        <span style={{ fontSize: 10, color: isComplete ? "#d3001b" : "#f39c12" }}>
          {filledHeight}/{fenceHeightCm} cm
        </span>
        <span style={{ fontSize: 10, color: "#d3001b", background: "#1e3530", padding: "1px 5px", borderRadius: 3 }}>
          edit ✎
        </span>
      </div>
    </button>
  );
}

// ─── RowsPopup ─────────────────────────────────────────────────────────────────

function RowsPopup({ onClose }: { onClose: () => void }) {
  const baseConcreteColor = useDesignerStore((s) => s.baseConcreteColor);
const t = useT();
  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
         inset: 0,
          background: "rgba(0,0,0,0.6)",
          zIndex: 100000,
        }}
      />

      {/* Попап */}
        <div
        id="tour-rows-popup"
        style={{
          position: "fixed",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: 360,
          background: "#1a1a1a",
          border: "2px solid #333",
          borderRadius: 12,
          padding: "16px",
          zIndex: 100001,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          boxShadow: "0 24px 64px rgba(0,0,0,0.8)",
          maxHeight: "70vh",
          minHeight: "70vh",
          overflowY: "auto",
        }}
      >
        {/* Шапка попапа */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{t('rowModelsTitle')}</div>
          <button
            onClick={onClose}
            style={{
              background: "#333", border: "none", borderRadius: 6,
              color: "#aaa", cursor: "pointer", fontSize: 16,
              width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >×</button>
        </div>

        <div style={{ height: 1, background: "#333" }} />

        <DynamicRows />

        <div style={{ height: 1, background: "#333" }} />

        <button
          onClick={onClose}
          style={{
            padding: "9px", borderRadius: 8, border: "none",
            background: "#d3001b", color: "#000",
            fontWeight: 700, fontSize: 13, cursor: "pointer",
          }}
        >
          Done ✓
        </button>
      </div>
    </>
  );
}
// ─── HeightDropdown ────────────────────────────────────────────────────────────

function HeightDropdown({ value, onChange }: { value: number; onChange: (cm: number) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function outside(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);
  return (
    <div id="tour-height-trigger" ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen((v) => !v)} style={triggerStyle(open)}>
        <div style={{ flex: 1 }}>
          <span style={{ fontWeight: 600, fontSize: 13 }}>{value} cm</span>
          <span style={{ color: "#000", fontSize: 11, marginLeft: 8 }}>({(value / 100).toFixed(2)} m)</span>
        </div>
        <Arrow open={open} />
      </button>
      {open && (
        <div style={dropdownListStyle}>
          {FENCE_HEIGHTS_CM.map((cm, idx) => (
            <button key={cm} onClick={() => { onChange(cm); setOpen(false); }} style={dropdownItemStyle(value === cm, idx === FENCE_HEIGHTS_CM.length - 1)}>
              <span style={{ fontWeight: 600, color: value === cm ? "#d3001b" : "#fff" }}>{cm} cm</span>
              <span style={{ color: "#fff", fontSize: 11, marginLeft: 8 }}>({(cm / 100).toFixed(2)} m)</span>
              {value === cm && <span style={{ marginLeft: "auto", color: "#d3001b" }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PanelDropdown ─────────────────────────────────────────────────────────────

function PanelDropdown({ selected, onSelect, availablePanels = PANEL_MODELS, placeholder, isWhite = false }: {
  selected?: PanelModel; onSelect: (p: PanelModel) => void;
  availablePanels?: PanelModel[]; placeholder?: string; isWhite?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function outside(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);
  return (
    <div id="tour-pannel-dropdown" ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen((v) => !v)} style={triggerStyle(open)}>
        {selected ? (
          <>
            <Thumb src={selected.imagePath} alt={selected.label} w={38} h={28} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{selected.label}</div>
              <div style={{ fontSize: 10, color: "#000" }}>{selected.heightCm} cm · {isWhite ? selected.priceWhite : selected.priceGrey} €</div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, fontSize: 12, color: "#000" }}>{placeholder ?? "Choose..."}</div>
        )}
        <Arrow open={open} />
      </button>
      {open && (
        <div style={dropdownListStyle}>
          {availablePanels.map((panel, idx) => (
            <button key={panel.id} onClick={() => { onSelect(panel); setOpen(false); }} style={dropdownItemStyle(selected?.id === panel.id, idx === availablePanels.length - 1)}>
              <Thumb src={panel.imagePath} alt={panel.label} w={44} h={32} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: selected?.id === panel.id ? "#d3001b" : "#fff" }}>{panel.label}</div>
                <div style={{ fontSize: 10, color: "#fff" }}>{panel.heightCm} cm · {isWhite ? panel.priceWhite : panel.priceGrey} €/m²</div>
              </div>
              {selected?.id === panel.id && <span style={{ color: "#d3001b" }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PillarDropdown ────────────────────────────────────────────────────────────

function PillarDropdown({ selectedStyle, activePillar, onSelectStyle, isWhite = false }: {
  selectedStyle: PillarStyle; activePillar: PillarModel;
  onSelectStyle: (s: PillarStyle) => void; isWhite?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function outside(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);
  const pillarOptions = (["smooth", "woodlike"] as PillarStyle[]).map((style) =>
    PILLAR_MODELS.find((p) => p.style === style && p.heightCm === activePillar.heightCm) ?? PILLAR_MODELS.find((p) => p.style === style)!
  );
  const selectedPillar = pillarOptions.find((p) => p.style === selectedStyle)!;
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen((v) => !v)} style={triggerStyle(open)}>
        <Thumb src={selectedPillar.imagePath} alt={selectedPillar.id} w={38} h={28} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600 }}>{selectedPillar.style === "smooth" ? "Smooth" : "Woodlike"}</div>
          <div style={{ fontSize: 10, color: "#fff" }}>{isWhite ? selectedPillar.priceWhite : selectedPillar.price} €/unit</div>
        </div>
        <Arrow open={open} />
      </button>
      {open && (
        <div style={dropdownListStyle}>
          {pillarOptions.map((pillar, idx) => (
            <button key={pillar.id} onClick={() => { onSelectStyle(pillar.style); setOpen(false); }} style={dropdownItemStyle(selectedStyle === pillar.style, idx === pillarOptions.length - 1)}>
              <Thumb src={pillar.imagePath} alt={pillar.id} w={44} h={32} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: selectedStyle === pillar.style ? "#d3001b" : "#fff" }}>{pillar.style === "smooth" ? "Smooth" : "Woodlike"}</div>
                <div style={{ fontSize: 10, color: "#fff" }}>{isWhite ? pillar.priceWhite : pillar.price} €/unit</div>
              </div>
              {selectedStyle === pillar.style && <span style={{ color: "#d3001b" }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PriceBlock ────────────────────────────────────────────────────────────────

function PriceBlock({ price, pillar, totalLengthM, totalWeightKg, isWhite }: {
  price: ReturnType<typeof calcPrice>; pillar: PillarModel;
  totalLengthM: number; totalWeightKg: number; isWhite: boolean;
}) {
  const t = useT();
  return (
    <div style={{ background: "#ffffff", borderRadius: 8, padding: "8px", display: "flex", flexDirection: "column", gap: 4, border: '2px solid #000000' }}>
      <div style={{ fontSize: 10, color: "#000", fontWeight: 600 }}>{t('calcTitle')}</div>
      {price.rowBreakdown.map((row, i) => row.count > 0 && (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
          <span style={{ color: "#000" }}>{row.label} ×{row.count}</span>
          <span style={{ color: "#000" }}>{row.total}€</span>
        </div>
      ))}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
        <span style={{ color: "#000" }}>Pillars ×{price.postCount}</span>
        <span style={{ color: "#000" }}>{price.postTotal}€</span>
      </div>
      <div style={{ height: 1, background: "#333" }} />
      <div style={{ display: "flex", gap: 4 }}>
        <div style={{ flex: 1, background: "#fff", borderRadius: 4, padding: "4px 6px", border: '1px solid #000' }}>
          <div style={{ fontSize: 9, color: "#000" }}>{t('length')}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#d3001b" }}>{totalLengthM}m</div>
        </div>
        <div style={{ flex: 1, background: "#fff", borderRadius: 4, padding: "4px 6px", border: '1px solid #000' }}>
          <div style={{ fontSize: 9, color: "#000" }}>{t('weight')}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#f39c12" }}>{totalWeightKg}kg</div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 700 }}>{t('total')}</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#d3001b" }}>{price.total}€</span>
      </div>
    </div>
  );
}

// ─── DeliveryBlock ─────────────────────────────────────────────────────────────

function DeliveryBlock({
  weightKg,
  deliveryCity,
  deliveryDistanceKm,
  deliveryCost,
  onCityChange,
}: {
  weightKg: number;
  deliveryCity: CityResult | null;
  deliveryDistanceKm: number;
  deliveryCost: number;
  onCityChange: (
    city: CityResult | null,
    dist: number,
    cost: number
  ) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CityResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t = useT();
  useEffect(() => {
  if (deliveryCity) {
    setQuery(deliveryCity.displayName.split(',').slice(0, 2).join(','));
  }
}, [deliveryCity]);

  const trucks = weightKg > 0 ? getTruckCount(weightKg) : 0;

  const handleInput = (val: string) => {
    setQuery(val);
    setOpen(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (val.trim().length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const cities = await searchCities(val);
        setResults(cities);
      } catch (e) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  };
  useEffect(() => {
  if (!deliveryCity) return;

  if (weightKg <= 0) {
    onCityChange(deliveryCity, 0, 0);
    return;
  }

  const dist = roadDistanceKm(deliveryCity.lat, deliveryCity.lng);
  const cost = calcDelivery(dist, weightKg);

  onCityChange(deliveryCity, dist, cost);
}, [deliveryCity, weightKg]);

  const handleSelect = (city: CityResult) => {
  const dist = roadDistanceKm(city.lat, city.lng);
  const cost = calcDelivery(dist, weightKg);  // ← вот тут считаем цену

  onCityChange(city, dist, cost);             // ← и тут её передаём

  setQuery(city.displayName.split(',').slice(0, 2).join(','));
  setResults([]);
  setOpen(false);
  
};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ fontSize: 10, color: '#000', fontWeight: 600, letterSpacing: 1 }}>
        🚚 {t('delivery')}
      </div>

      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          placeholder={t('deliveryPlaceholder')}
          style={{
            width: '100%',
            padding: '6px 28px 6px 8px',
            background: '#fff',
            border: '1px solid #333',
            borderRadius: 6,
            color: '#000',
            fontSize: 11,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />

        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              setOpen(false);
              onCityChange(null, 0, 0);
            }}
            style={{
              position: 'absolute',
              right: 6,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: '#000',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            ×
          </button>
        )}

        {open && (results.length > 0 || loading) && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: '#222',
              border: '1px solid #444',
              borderRadius: 6,
              zIndex: 100,
              maxHeight: 180,
              overflowY: 'auto',
              marginTop: 2,
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}
          >
            {loading && (
              <div style={{ padding: '8px', color: '#fff', fontSize: 11 }}>
                {t('searching')}
              </div>
            )}

            {!loading &&
              results.map((city, i) => {
                const parts = city.displayName.split(',');

                return (
                  <div
                    key={i}
                    onClick={() => handleSelect(city)}
                    style={{
                      padding: '7px 10px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #2a2a2a',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#2a2a2a')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>
                      {parts[0]}
                    </div>
                    <div style={{ color: '#fff', fontSize: 10 }}>
                      {parts.slice(1, 3).join(',')}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {deliveryCity && (
        <div
          style={{
            background: '#fff',
            borderRadius: 6,
            padding: '6px 8px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            border: '1px solid #000000',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
            <span style={{ color: '#000' }}>Distance</span>
            <span style={{ color: '#000', fontWeight: 600 }}>
              {deliveryDistanceKm} km
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
            <span style={{ color: '#666' }}>🚚 Trucks</span>
            <span style={{ color: '#000', fontWeight: 600 }}>
              {trucks}
            </span>
          </div>

          <div style={{ height: 1, background: '#dcdcdc' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#000' }}>
              Delivery
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#f39c12' }}>
              {Number.isFinite(deliveryCost) ? `${deliveryCost}€` : '0€'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Общие компоненты ──────────────────────────────────────────────────────────

function StepBadge({ step }: { step: string }) {
  return (
    <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#d3001b", color: "#fff", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {step}
    </div>
  );
}

function Section({ step, label, children, id }: { step: string; label: string; children: React.ReactNode, id?: string; }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <StepBadge step={step} />
        <label style={{ fontSize: 10, color: "#000", fontWeight: 600 }}>{label}</label>
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
    <button onClick={onClick} style={{ flex: 1, padding: "5px 4px", borderRadius: 6, border: "none", background: active ? "#d3001b" : "transparent", color: active ? "#fff" : "#000", cursor: "pointer", fontSize: 11, fontWeight: active ? 700 : 400, transition: "all 0.15s" }}>
      {children}
    </button>
  );
}

function Thumb({ src, alt, w, h }: { src: string; alt: string; w: number; h: number }) {
  return (
    <div style={{ width: w, height: h, borderRadius: 4, overflow: "hidden", flexShrink: 0, background: "#333", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <img src={src} alt={alt} style={{ width: "100%", height: "100%", objectFit: "cover" }}
        onError={(e) => { const t = e.target as HTMLImageElement; t.style.display = "none"; t.parentElement!.innerHTML = `<span style="font-size:14px">🧱</span>`; }} />
    </div>
  );
}

function Arrow({ open }: { open: boolean }) {
  return <div style={{ fontSize: 9, color: "#000", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}>▼</div>;
}

function triggerStyle(open: boolean): React.CSSProperties {
  return { width: "100%", padding: "5px 7px", borderRadius: 8, border: `2px solid ${open ? "#d3001b" : "#444"}`, background: "#fff", color: "#000", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, textAlign: "left" };
}

const dropdownListStyle: React.CSSProperties = {
  position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
  background: "#222", border: "2px solid #444", borderRadius: 8,
  overflow: "auto", maxHeight: 240, zIndex: 999999, boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
};

function dropdownItemStyle(selected: boolean, isLast: boolean): React.CSSProperties {
  return { width: "100%", padding: "8px", background: selected ? "#1e3530" : "transparent", border: "none", borderBottom: isLast ? "none" : "1px solid #333", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, textAlign: "left" };
}

const RAL_COLORS = [
  { hex: "#F4A460", label: "RAL 1001" },
  { hex: "#F5C518", label: "RAL 1021" },
  { hex: "#E8751A", label: "RAL 2004" },
  { hex: "#C0392B", label: "RAL 3020" },
  { hex: "#8B1A1A", label: "RAL 3005" },
  { hex: "#4A90A4", label: "RAL 5024" },
  { hex: "#1B4F8A", label: "RAL 5010" },
  { hex: "#2E7D32", label: "RAL 6002" },
  { hex: "#5D4037", label: "RAL 8011" },
  { hex: "#37474F", label: "RAL 7016" },
  { hex: "#263238", label: "RAL 9005" },
];

function ConcreteBtn({ hex, label, active, onClick, small = false }: {
  hex: string; label: string; active: boolean; onClick: () => void; small?: boolean;
}) {
  const size = small ? 20 : 28;
  return (
    <button onClick={onClick} title={label} style={{ width: size, height: size, borderRadius: "50%", background: hex, border: active ? "2px solid #d3001b" : "2px solid #444", cursor: "pointer", flexShrink: 0, boxShadow: active ? "0 0 0 2px #d3001b" : "none", transition: "all 0.15s" }} />
  );
}

const btnStyle: React.CSSProperties = {
  padding: "7px 10px", borderRadius: 6, border: "1px solid #444",
  background: "transparent", color: "#fff", cursor: "pointer", textAlign: "left", fontSize: 12,
};