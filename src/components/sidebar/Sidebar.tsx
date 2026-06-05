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
import { searchCities, roadDistanceKm, calcDelivery, RATE_PER_KM_PER_TON } from '../../lib/delivery';
import type { CityResult } from '../../lib/delivery';
import { useT } from '../../lib/i18n';
import type { Locale } from '../../lib/i18n';

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
  const concreteColor = useDesignerStore((s) => s.concreteColor);
const setConcreteColor = useDesignerStore((s) => s.setConcreteColor);
const { deliveryCity, deliveryCost, deliveryDistanceKm, setDeliveryCity } = useDesignerStore();

  const price = calcPrice(fenceItems, rows, activePillar, concreteColor);
  const { totalLengthM, totalWeightKg } = price;

  return (
    <div style={{
        width: 340,
minWidth: 340,
maxWidth: 340,
    height: '100%',
      background: "#1a1a1a",
      color: "#fff",
      padding: "12px 14px",
      display: "flex",
      flexDirection: "column",
      gap: 10,
      boxSizing: "border-box",
      overflowY: "auto",
    }}>
      {/* Переключатель языков */}
<div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
  {(['en', 'pt', 'es'] as const).map((l) => (
    <button
      key={l}
      onClick={() => setLocale(l)}
      style={{
        padding: '2px 8px', borderRadius: 4, border: 'none', cursor: 'pointer',
        background: locale === l ? '#4fc3a1' : '#333',
        color: locale === l ? '#000' : '#888',
        fontSize: 11, fontWeight: locale === l ? 700 : 400,
      }}
    >
      {l.toUpperCase()}
    </button>
  ))}
</div>
      <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{t('title')}</h2>

      {/* ШАГ 1 */}
      <Section step="1" label={t('step1')}>
        <HeightDropdown value={fenceHeightCm} onChange={setFenceHeight} />
      </Section>

      <Divider />

      {/* ШАГ 2 */}
      {/* ШАГ 2 */}
{/* ШАГ 2 */}
<Section step="2" label={t('step2')}>
  {/* Переключатель — только если возможен одиночный режим */}
  {getPanelsForSingleModel(fenceHeightCm).length > 0 ? (
    <div style={{ display: "flex", background: "#222", borderRadius: 8, padding: 3, gap: 3 }}>
      <ToggleBtn active={singleModel} onClick={() => setSingleModel(true)}>
       {t('singleModel')}
      </ToggleBtn>
      <ToggleBtn active={!singleModel} onClick={() => setSingleModel(false)}>
         {t('byRows')}
      </ToggleBtn>
    </div>
  ) : (
    <div style={{ fontSize: 11, color: "#888", background: "#222", borderRadius: 6, padding: "6px 10px" }}>
      ℹ️ This height can only be achieved by combining rows
    </div>
  )}

  {singleModel && getPanelsForSingleModel(fenceHeightCm).length > 0 ? (
    <PanelDropdown
      selected={singlePanel}
      onSelect={setSinglePanel}
      availablePanels={getPanelsForSingleModel(fenceHeightCm)}
      isWhite={concreteColor !== 'grey'} 
    />
  ) : (
    <DynamicRows />
  )}
</Section>
{/* ШАГ 2.5 — ОРИЕНТАЦИЯ */}
      {singlePanel.side === 'one' && (
        <>
          <Divider />
          <Section step="2.5" label={t('textureStep')}>
            <div style={{ display: "flex", background: "#222", borderRadius: 8, padding: 3, gap: 3 }}>
              <ToggleBtn
                active={panelOrientation === 'outward'}
                onClick={() => setPanelOrientation('outward')}
              >
                {t('inward')}
              </ToggleBtn>
              <ToggleBtn
                active={panelOrientation === 'inward'}
                onClick={() => setPanelOrientation('inward')}
              >
                {t('outward')}
              </ToggleBtn>
            </div>
            <div style={{ fontSize: 11, color: "#666", padding: "2px 4px" }}>
              {panelOrientation === 'outward'
  ? t('textureFacingInside')
  : t('textureFacingOutside')}
            </div>
          </Section>
        </>
      )}
      <Divider />

      {/* ШАГ 3 */}
      <Section step="3" label={t('step3')}>
        <PillarDropdown
          selectedStyle={selectedPillarStyle}
          activePillar={activePillar}
          onSelectStyle={setSelectedPillarStyle}
          isWhite={concreteColor !== 'grey'}
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
  {activePillar.aboveGroundCm} cm {t('aboveGround')} · {concreteColor !== 'grey' ? activePillar.priceWhite : activePillar.price} €
</div>
          </div>
          <div style={{
            fontSize: 10, color: "#4fc3a1",
            background: "#1e3530", padding: "2px 6px", borderRadius: 4,
          }}>
            auto
          </div>
        </div>
      </Section>

      <Divider />
{/* ШАГ 4 — CONCRETE COLOR */}
<Section step="4" label={t('step4')}>
  {/* Серый / Белый */}
  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
    <ConcreteBtn
      hex="#888888"
      label="Grey"
      active={concreteColor === 'grey'}
      onClick={() => setConcreteColor('grey')}
    />
    <ConcreteBtn
      hex="#f0ede8"
      label="White"
      active={concreteColor === 'white'}
      onClick={() => setConcreteColor('white')}
    />
  </div>

  {/* RAL палитра */}
  <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>{t('customRal')}</div>
  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
    {RAL_COLORS.map((ral) => (
      <ConcreteBtn
        key={ral.hex}
        hex={ral.hex}
        label={ral.label}
        active={concreteColor === ral.hex}
        onClick={() => setConcreteColor(ral.hex)}
        small
      />
    ))}
  </div>

  {/* Подпись активного цвета */}
  <div style={{ fontSize: 11, color: "#666", padding: "2px 4px" }}>
  {concreteColor === 'grey'
    ? t('standardGrey')
    : concreteColor === 'white'
    ? t('whiteConcrete')
    : t('ralConcrete')}
</div>
</Section>
{/* Доставка */}
{fenceItems.length > 0 && (
  <DeliveryBlock
    weightKg={price.totalWeightKg}
    deliveryCity={deliveryCity}
    deliveryDistanceKm={deliveryDistanceKm}
    deliveryCost={deliveryCost}
    onCityChange={(city, dist, cost) => setDeliveryCity(city, dist, cost)}
  />
)}
{fenceItems.length > 0 && (
  <button
    style={{
      padding: "10px 12px", borderRadius: 6,
      border: "none", cursor: "pointer",
      background: "#d3001b", color: "#fff",
      fontWeight: 700, fontSize: 13,
      display: "flex", alignItems: "center",
      justifyContent: "center", gap: 8,
    }}
    onClick={() => generateQuotationPdf({
      price,
      pillar: activePillar,
      rows,
      fenceHeightCm,
      concreteColor,
      panelOrientation,
       deliveryCity,           // ← ДОБАВИТЬ
  deliveryDistanceKm,     // ← ДОБАВИТЬ
  deliveryCost,
   locale,     
    })}
  >
    {t('downloadPdf')}
  </button>
)}
      <button
        style={{ ...btnStyle, borderColor: "#c0392b", color: "#c0392b" }}
        onClick={clearAll}
      >
        {t('reset')}
      </button>

     

      {fenceItems.length > 0 && (
  <div style={{ marginTop: 'auto' }}>   {/* ← прилипает к низу */}
    <PriceBlock
      price={price}
      pillar={activePillar}
      totalLengthM={totalLengthM}
      totalWeightKg={totalWeightKg}
      isWhite={concreteColor !== 'grey'}
    />
  </div>
)}
    </div>
  );
}

function DynamicRows() {
  const fenceHeightCm = useDesignerStore((s) => s.fenceHeightCm);
  const filledRows = useDesignerStore((s) => s.filledRows);
  const setFilledRow = useDesignerStore((s) => s.setFilledRow);
  const resetFilledRows = useDesignerStore((s) => s.resetFilledRows);
  const concreteColor = useDesignerStore((s) => s.concreteColor);
  const t = useT(); 

 const isWhite = concreteColor !== 'grey';
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
          {filledHeight} / {fenceHeightCm} cm
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
              <span>{t('nameRow')} {rowNum} ({t('below')})</span>
              {filled && <span style={{ color: "#4fc3a1" }}>{filled.heightCm} cm ✓</span>}
              {!filled && <span style={{ color: "#f39c12" }}>{t('calcLeft')} {remainingForThis} cm</span>}
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
                  <div style={{ fontSize: 11, color: "#888" }}>{filled.panel.heightCm} cm · {filled.panel.priceGrey} €</div>
                </div>
                <span style={{ fontSize: 10, color: "#888" }}>change</span>
              </button>
            ) : (
              // Пустой ряд — показываем дропдаун с доступными панелями
              <PanelDropdown
                selected={available[0]}
                onSelect={(panel) => setFilledRow(i, panel)}
                availablePanels={available}
                placeholder="Choose the panel..."
                isWhite={isWhite} 
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
          {t('startAgain')}
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
          <span style={{ fontWeight: 600, fontSize: 13 }}>{value} cm</span>
          <span style={{ color: "#888", fontSize: 12, marginLeft: 8 }}>
            ({(value / 100).toFixed(2)} m)
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
                {cm} cm
              </span>
              <span style={{ color: "#666", fontSize: 12, marginLeft: 8 }}>
                ({(cm / 100).toFixed(2)} m)
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
  isWhite = false,
}: {
  selected?: PanelModel;
  onSelect: (p: PanelModel) => void;
  availablePanels?: PanelModel[];
  placeholder?: string;
   isWhite?: boolean;
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
              <div style={{ fontSize: 11, color: "#888" }}>{selected.heightCm} cm · {selected.priceGrey} €</div>
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
                <div style={{ fontSize: 11, color: "#888" }}>
  {panel.heightCm} cm · {isWhite ? panel.priceWhite : panel.priceGrey} €/m²
</div>
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

function PillarDropdown({ selectedStyle, activePillar, onSelectStyle, isWhite = false }: {
  selectedStyle: PillarStyle;
  activePillar: PillarModel;
  onSelectStyle: (s: PillarStyle) => void;
  isWhite?: boolean;
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
          <div style={{ fontSize: 11, color: "#888" }}>
  {isWhite ? selectedPillar.priceWhite : selectedPillar.price} €/unit
</div>
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
                <div style={{ fontSize: 11, color: "#888" }}>
  {isWhite ? pillar.priceWhite : pillar.price} €/unit
</div>
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

function PriceBlock({ price, pillar, totalLengthM, totalWeightKg, isWhite}: {
  price: ReturnType<typeof calcPrice>;
  pillar: PillarModel;
  totalLengthM: number;
  totalWeightKg: number;
  isWhite: boolean;
}) {
  const weightLabel = `${totalWeightKg} kg`;
const t = useT(); 
  return (
    <div style={{ background: "#111", borderRadius: 8, padding: "14px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontSize: 12, color: "#aaa", fontWeight: 600, marginBottom: 2 }}>{t('calcTitle')}</div>

      {/* Панели */}
      {price.rowBreakdown.map((row, i) => (
        row.count > 0 && (
          <div key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span style={{ color: "#ccc" }}>{row.label} × {row.count}</span>
              <span style={{ color: "#fff" }}>{row.total} €</span>
            </div>
            <div style={{ fontSize: 11, color: "#555" }}>{row.count} × {row.price} €/m²</div>
          </div>
        )
      ))}

      {/* Столбы */}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
        <span style={{ color: "#ccc" }}>Pillars × {price.postCount}</span>
        <span style={{ color: "#fff" }}>{price.postTotal} €</span>
      </div>
      <div style={{ fontSize: 11, color: "#555" }}>
  {price.postCount} × {isWhite ? pillar.priceWhite : pillar.price} €/unit
</div>

      <div style={{ height: 1, background: "#333", margin: "4px 0" }} />

      {/* Длина и вес */}
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1, background: "#1a1a1a", borderRadius: 6, padding: "8px 10px" }}>
          <div style={{ fontSize: 10, color: "#666", marginBottom: 2 }}>{t('length')}</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#4fc3a1" }}>{totalLengthM} m</div>
        </div>
        <div style={{ flex: 1, background: "#1a1a1a", borderRadius: 6, padding: "8px 10px" }}>
          <div style={{ fontSize: 10, color: "#666", marginBottom: 2 }}>{t('weight')}</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#f39c12" }}>{weightLabel}</div>
        </div>
      </div>

      <div style={{ height: 1, background: "#333", margin: "4px 0" }} />

      {/* Итого */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 14, fontWeight: 700 }}>{t('total')}</span>
        <span style={{ fontSize: 18, fontWeight: 700, color: "#4fc3a1" }}>{price.total} €</span>
      </div>
    </div>
  );
}

// ─── Общие компоненты ──────────────────────────────────────────────────────────
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
  onCityChange: (city: CityResult | null, dist: number, cost: number) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CityResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t = useT();

  const handleInput = (val: string) => {
    setQuery(val);
    setOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const cities = await searchCities(val);
      setResults(cities);
      setLoading(false);
    }, 400);
  };

  const handleSelect = (city: CityResult) => {
    const dist = roadDistanceKm(city.lat, city.lng);
    const cost = calcDelivery(dist, weightKg);
    onCityChange(city, dist, cost);
    // Показать только первую часть имени (город, страна)
    const short = city.displayName.split(',').slice(0, 2).join(',');
    setQuery(short);
    setResults([]);
    setOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    onCityChange(null, 0, 0);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 11, color: '#888', fontWeight: 600, letterSpacing: 1 }}>
        {t('delivery')}
      </div>

      {/* Input */}
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
         placeholder={t('deliveryPlaceholder')}
          style={{
            width: '100%', padding: '9px 32px 9px 12px',
            background: '#1a1a1a', border: '1px solid #333',
            borderRadius: 6, color: '#fff', fontSize: 13,
            outline: 'none', boxSizing: 'border-box',
          }}
        />
        {query && (
          <button
            onClick={handleClear}
            style={{
              position: 'absolute', right: 8, top: '50%',
              transform: 'translateY(-50%)', background: 'none',
              border: 'none', color: '#666', cursor: 'pointer', fontSize: 16,
            }}
          >×</button>
        )}

        {/* Dropdown */}
        {open && (results.length > 0 || loading) && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0,
            background: '#222', border: '1px solid #444',
            borderRadius: 6, zIndex: 100, maxHeight: 220, overflowY: 'auto',
            marginTop: 2, boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          }}>
            {loading && (
              <div style={{ padding: '10px 12px', color: '#666', fontSize: 12 }}>
                {t('searching')}
              </div>
            )}
            {results.map((city, i) => {
              const parts = city.displayName.split(',');
              const name = parts[0];
              const region = parts.slice(1, 3).join(',');
              return (
                <div
                  key={i}
                  onClick={() => handleSelect(city)}
                  style={{
                    padding: '9px 12px', cursor: 'pointer',
                    borderBottom: '1px solid #2a2a2a',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#2a2a2a')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{name}</div>
                  <div style={{ color: '#666', fontSize: 11 }}>{region}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Результат */}
      {deliveryCity && (
        <div style={{
          background: '#1a1a1a', borderRadius: 6,
          padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ color: '#888' }}>Distance (est.)</span>
            <span style={{ color: '#fff', fontWeight: 600 }}>{deliveryDistanceKm} km</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ color: '#888' }}>Rate</span>
            <span style={{ color: '#666' }}>{RATE_PER_KM_PER_TON} €/km/t</span>
          </div>
          <div style={{ height: 1, background: '#2a2a2a' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Delivery cost</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#f39c12' }}>{deliveryCost} €</span>
          </div>
        </div>
      )}
    </div>
  );
}
function Section({ step, label, children }: { step: string; label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{
          width: 18, height: 18, borderRadius: "50%",
          background: "#333", color: "#4fc3a1",
          fontSize: 10, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          {step}
        </div>
        <label style={{ fontSize: 11, color: "#aaa", fontWeight: 600 }}>{label}</label>
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
    width: "100%", padding: "6px 8px", borderRadius: 8,
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

// ─── RAL Colors ────────────────────────────────────────────────────────────────

const RAL_COLORS = [
  { hex: "#F4A460", label: "RAL 1001" }, // Beige
  { hex: "#F5C518", label: "RAL 1021" }, // Yellow
  { hex: "#E8751A", label: "RAL 2004" }, // Orange
  { hex: "#C0392B", label: "RAL 3020" }, // Red
  { hex: "#8B1A1A", label: "RAL 3005" }, // Wine red
  { hex: "#4A90A4", label: "RAL 5024" }, // Pastel blue
  { hex: "#1B4F8A", label: "RAL 5010" }, // Blue
  { hex: "#2E7D32", label: "RAL 6002" }, // Green
  { hex: "#5D4037", label: "RAL 8011" }, // Brown
  { hex: "#37474F", label: "RAL 7016" }, // Anthracite
  { hex: "#263238", label: "RAL 9005" }, // Black
];

// ─── ConcreteBtn ───────────────────────────────────────────────────────────────

function ConcreteBtn({
  hex, label, active, onClick, small = false,
}: {
  hex: string; label: string; active: boolean; onClick: () => void; small?: boolean;
}) {
  const size = small ? 24 : 32;
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        width: size, height: size,
        borderRadius: "50%",
        background: hex,
        border: active ? "2px solid #4fc3a1" : "2px solid #444",
        cursor: "pointer",
        flexShrink: 0,
        boxShadow: active ? "0 0 0 2px #4fc3a1" : "none",
        transition: "all 0.15s",
      }}
    />
  );
}

const btnStyle: React.CSSProperties = {
  padding: "9px 12px", borderRadius: 6, border: "1px solid #444",
  background: "transparent", color: "#fff", cursor: "pointer", textAlign: "left", fontSize: 13,
};