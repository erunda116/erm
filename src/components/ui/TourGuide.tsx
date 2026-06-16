import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useDesignerStore } from "../../store/useDesignerStore";
import { useT } from "../../lib/i18n";

const UNINIT = Symbol('uninit'); 

type TourStep = {
  titleKey: string;
  textKey: string;
  targetId: string | null;
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
  watchStore?: 'locale' | 'fenceHeightCm' | 'singleModel' | 'singlePanel' | 'selectedPillarStyle' | 'concreteColor' | 'panelOrientation';
};

const BASE_STEPS: TourStep[] = [
  { titleKey: 'tourStep1Title',  textKey: 'tourStep1Text',  targetId: 'tour-lang',        placement: 'bottom', watchStore: 'locale'             },
  { titleKey: 'tourStep2Title',  textKey: 'tourStep2Text',  targetId: 'tour-2d-btn',      placement: 'bottom'                                   },
  { titleKey: 'tourStep3Title',  textKey: 'tourStep3Text',  targetId: 'tour-building-btn',placement: 'bottom'                                   },
  { titleKey: 'tourStep4Title',  textKey: 'tourStep4Text',  targetId: 'tour-step1',       placement: 'bottom', watchStore: 'fenceHeightCm'       },
  { titleKey: 'tourStep5Title',  textKey: 'tourStep5Text',  targetId: 'tour-step2',       placement: 'bottom', watchStore: 'singleModel'         },
  { titleKey: 'tourStep7Title',  textKey: 'tourStep7Text',  targetId: 'tour-step3',       placement: 'bottom', watchStore: 'selectedPillarStyle' },
  { titleKey: 'tourStep8Title',  textKey: 'tourStep8Text',  targetId: 'tour-step4',       placement: 'bottom', watchStore: 'concreteColor'       },
  { titleKey: 'tourStep9Title',  textKey: 'tourStep9Text',  targetId: 'tour-3d-btn',      placement: 'bottom'                                   },
  { titleKey: 'tourStep10Title', textKey: 'tourStep10Text', targetId: 'tour-ground',      placement: 'bottom'                                   },
];

function calcLayout(targetId: string | null, placement: string, bw: number, bh: number) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const GAP = 12;

  if (!targetId) {
    return { box: { top: vh / 2 - bh / 2, left: vw / 2 - bw / 2 }, arrow: null };
  }

  const el = document.getElementById(targetId);
  if (!el) {
    // Элемент не найден — показываем по центру
    return { box: { top: vh / 2 - bh / 2, left: vw / 2 - bw / 2 }, arrow: null };
  }

  const tr = el.getBoundingClientRect();
  const tx = tr.left + tr.width  / 2;
  const ty = tr.top  + tr.height / 2;

  let boxTop = 0, boxLeft = 0;
  let arrowTipX = tx, arrowTipY = ty;
  let arrowRot = '0deg';

  if (placement === 'bottom') {
    boxTop    = tr.bottom + GAP + 22;
    boxLeft   = tx - bw / 2;
    arrowTipX = tx;
    arrowTipY = tr.bottom + 5;
    arrowRot  = '0deg'; // ▲ указывает вверх на элемент
  } else if (placement === 'top') {
    boxTop    = tr.top - bh - GAP - 22;
    boxLeft   = tx - bw / 2;
    arrowTipX = tx;
    arrowTipY = tr.top - 5;
    arrowRot  = '180deg';
  } else if (placement === 'right') {
    boxTop    = ty - bh / 2;
    boxLeft   = tr.right + GAP + 22;
    arrowTipX = tr.right + 5;
    arrowTipY = ty;
    arrowRot  = '-90deg';
  } else if (placement === 'left') {
    boxTop    = ty - bh / 2;
    boxLeft   = tr.left - bw - GAP - 22;
    arrowTipX = tr.left - 5;
    arrowTipY = ty;
    arrowRot  = '90deg';
  }

  boxLeft = Math.max(8, Math.min(boxLeft, vw - bw - 8));
  boxTop  = Math.max(8, Math.min(boxTop,  vh - bh - 8));

  return {
    box:   { top: boxTop, left: boxLeft },
    arrow: { x: arrowTipX, y: arrowTipY, rot: arrowRot },
  };
}

export default function TourGuide() {
  const [open, setOpen]       = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [layout, setLayout]   = useState<{
    box: { top: number; left: number };
    arrow: { x: number; y: number; rot: string } | null;
  }>({ box: { top: 200, left: 400 }, arrow: null });
  const [pulse, setPulse]     = useState(true);
  const boxRef                = useRef<HTMLDivElement>(null);
  const t                     = useT();

  const locale              = useDesignerStore((s) => s.locale);
  const fenceHeightCm       = useDesignerStore((s) => s.fenceHeightCm);
  const singleModel         = useDesignerStore((s) => s.singleModel);
  const singlePanel         = useDesignerStore((s) => s.singlePanel);
  const selectedPillarStyle = useDesignerStore((s) => s.selectedPillarStyle);
  const concreteColor       = useDesignerStore((s) => s.concreteColor);
  const panelOrientation    = useDesignerStore((s) => s.panelOrientation);

  const storeValues: Record<string, unknown> = {
    locale, fenceHeightCm, singleModel,
    singlePanel, selectedPillarStyle, concreteColor, panelOrientation,
  };

  const steps: TourStep[] = (() => {
    const list = [...BASE_STEPS];
    if (!singleModel) {
      const idx = list.findIndex((s) => s.titleKey === 'tourStep5Title');
      list.splice(idx + 1, 0, {
        titleKey: 'tourStep5bTitle', textKey: 'tourStep5bText',
        targetId: 'tour-rows-summary', placement: 'bottom',
      });
    }
    if (singlePanel?.side === 'one') {
      const idx = list.findIndex((s) => s.titleKey === 'tourStep7Title');
      list.splice(idx, 0, {
        titleKey: 'tourStep6Title', textKey: 'tourStep6Text',
        targetId: 'tour-step25', placement: 'bottom',
        watchStore: 'panelOrientation',
      });
    }
    return list;
  })();

  const total   = steps.length;
  const current = steps[Math.min(stepIdx, total - 1)];

  // ── Авто-переход при изменении store ──────────────────────────────────────
  // Используем ref чтобы хранить "начальное" значение при входе на шаг
 const watchInitVal = useRef<unknown>(UNINIT); // Symbol — уникален, не совпадёт ни с чем

  // Когда меняется шаг — запоминаем текущее значение как "начальное"
  useEffect(() => {
    if (!open || !current.watchStore) return;
    watchInitVal.current = storeValues[current.watchStore];
  }, [open, stepIdx]); // только при смене шага

  // Когда меняется значение store — сравниваем с начальным
  useEffect(() => {
    if (!open || !current.watchStore) return;
    const val = storeValues[current.watchStore];
    // Если значение изменилось относительно момента входа на шаг — переходим
    if (val !== watchInitVal.current && watchInitVal.current !== UNINIT) {
      setTimeout(() => setStepIdx((i) => Math.min(i + 1, total - 1)), 350);
    }
  }, [locale, fenceHeightCm, singleModel, singlePanel, selectedPillarStyle, concreteColor, panelOrientation]);

  // Пересчёт позиции тултипа
  useLayoutEffect(() => {
    if (!open) return;
    const calc = () => {
      const box = boxRef.current;
      const bw  = box?.offsetWidth  || 280;
      const bh  = box?.offsetHeight || 160;
      setLayout(calcLayout(current.targetId, current.placement, bw, bh));
    };
    const t1 = setTimeout(calc, 30);
    const t2 = setTimeout(calc, 200);
    window.addEventListener('resize', calc);
    return () => { clearTimeout(t1); clearTimeout(t2); window.removeEventListener('resize', calc); };
  }, [open, stepIdx]);

  const next  = () => setStepIdx((i) => Math.min(i + 1, total - 1));
  const prev  = () => setStepIdx((i) => Math.max(i - 1, 0));
  const close = () => { setOpen(false); setStepIdx(0); };

  return (
    <>
      <button
        onClick={() => { setOpen(true); setStepIdx(0); setPulse(false); }}
        style={{
          position: 'relative', padding: '5px 10px', borderRadius: 6,
          border: 'none', background: '#4fc3a1', color: '#000',
          fontWeight: 700, fontSize: 11, cursor: 'pointer', flexShrink: 0,
        }}
      >
        {pulse && <PulseRing />}
        {t('tourBtn' as any)}
      </button>

      {open && (
        <>
          {/* Оверлей — НЕ перехватывает клики, пользователь может кликать элементы */}
          <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 9000,
            pointerEvents: 'none',
          }} />

          {/* Подсветка target */}
          {current.targetId && <Spotlight targetId={current.targetId} />}

          {/* Стрелка — fixed, острие точно на краю target */}
          {layout.arrow && (
            <div style={{
              position: 'fixed',
              left: layout.arrow.x - 10,
              top:  layout.arrow.y - 10,
              width: 20, height: 20,
              zIndex: 9200,
              pointerEvents: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, color: '#4fc3a1',
              rotate: layout.arrow.rot,
              animation: 'tourBounceArrow 0.85s ease-in-out infinite',
            }}>
              ▲
            </div>
          )}

          {/* Тултип */}
          <div ref={boxRef} style={{
            position: 'fixed',
            top:  layout.box.top,
            left: layout.box.left,
            width: 280,
            background: '#1a1a1a',
            border: '2px solid #4fc3a1',
            borderRadius: 12,
            padding: '14px 16px',
            zIndex: 9100,
            boxShadow: '0 12px 40px rgba(0,0,0,0.8)',
            display: 'flex', flexDirection: 'column', gap: 10,
            animation: 'tourFadeIn 0.2s ease',
          }}>

            {/* Шапка */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {steps.map((_, i) => (
                  <div key={i} onClick={() => setStepIdx(i)} style={{
                    width: i === stepIdx ? 16 : 6, height: 6,
                    borderRadius: 3, cursor: 'pointer',
                    background: i === stepIdx ? '#4fc3a1' : i < stepIdx ? '#2a6b59' : '#333',
                    transition: 'all 0.3s',
                  }} />
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10, color: '#666' }}>
                  {stepIdx + 1} {t('tourOf' as any)} {total}
                </span>
                <button onClick={close} style={{
                  background: 'none', border: 'none', color: '#666',
                  cursor: 'pointer', fontSize: 18, padding: 0, lineHeight: 1,
                }}>×</button>
              </div>
            </div>

            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
              {t(current.titleKey as any)}
            </div>

            <div style={{ fontSize: 12, color: '#aaa', lineHeight: 1.5 }}>
              {t(current.textKey as any)}
            </div>

            {current.watchStore && (
              <div style={{
                fontSize: 11, color: '#4fc3a1',
                background: 'rgba(79,195,161,0.1)',
                borderRadius: 6, padding: '5px 8px',
                border: '1px solid rgba(79,195,161,0.3)',
              }}>
                ✨ {t('tourInteract' as any)}
              </div>
            )}

            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={close} style={btnGhost}>{t('tourSkip' as any)}</button>
              <div style={{ flex: 1 }} />
              {stepIdx > 0 && (
                <button onClick={prev} style={btnGhost}>{t('tourPrev' as any)}</button>
              )}
              {stepIdx < total - 1 ? (
                <button onClick={next} style={btnPrimary}>{t('tourNext' as any)}</button>
              ) : (
                <button onClick={close} style={btnPrimary}>{t('tourClose' as any)} ✓</button>
              )}
            </div>
          </div>

          <style>{`
            @keyframes tourFadeIn {
              from { opacity: 0; transform: translateY(8px); }
              to   { opacity: 1; transform: translateY(0); }
            }
            @keyframes tourBounceArrow {
              0%, 100% { transform: translateY(0); }
              50%       { transform: translateY(6px); }
            }
            @keyframes tourPulse {
              0%   { transform: scale(1);   opacity: 0.8; }
              70%  { transform: scale(2.2); opacity: 0; }
              100% { transform: scale(2.2); opacity: 0; }
            }
            @keyframes spotlightPulse {
              0%, 100% { box-shadow: 0 0 0 3px #4fc3a1, 0 0 16px 4px rgba(79,195,161,0.35); }
              50%       { box-shadow: 0 0 0 5px #4fc3a1, 0 0 28px 8px rgba(79,195,161,0.55); }
            }
          `}</style>
        </>
      )}
    </>
  );
}

function Spotlight({ targetId }: { targetId: string }) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useLayoutEffect(() => {
    const update = () => {
      const el = document.getElementById(targetId);
      if (el) setRect(el.getBoundingClientRect());
    };
    update();
    const timer = setTimeout(update, 80);
    return () => clearTimeout(timer);
  }, [targetId]);

  if (!rect) return null;

  return (
    <div style={{
      position: 'fixed',
      top:    rect.top    - 5,
      left:   rect.left   - 5,
      width:  rect.width  + 10,
      height: rect.height + 10,
      borderRadius: 8,
      zIndex: 9050,
      pointerEvents: 'none',
      animation: 'spotlightPulse 1.4s ease-in-out infinite',
    }} />
  );
}

function PulseRing() {
  return (
    <span style={{
      position: 'absolute', inset: 0, borderRadius: 6,
      border: '2px solid #4fc3a1',
      animation: 'tourPulse 1.4s ease-out infinite',
      pointerEvents: 'none',
    }} />
  );
}

const btnPrimary: React.CSSProperties = {
  padding: '6px 12px', borderRadius: 6, border: 'none',
  background: '#4fc3a1', color: '#000',
  fontWeight: 700, fontSize: 11, cursor: 'pointer',
};

const btnGhost: React.CSSProperties = {
  padding: '6px 10px', borderRadius: 6,
  border: '1px solid #444', background: 'transparent',
  color: '#888', fontSize: 11, cursor: 'pointer',
};