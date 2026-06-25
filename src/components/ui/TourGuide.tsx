import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom"
import { useDesignerStore } from "../../store/useDesignerStore";
import { useT } from "../../lib/i18n";

const UNINIT = Symbol('uninit');

type TourStep = {
  titleKey: string;
  textKey: string;
  targetId: string | null;
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
  watchStore?: 'locale' | 'fenceHeightCm' | 'singleModel' | 'singlePanel'
             | 'selectedPillarStyle' | 'concreteColor' | 'panelOrientation' | 'activeTool';
              overlay?: boolean;
};

const BASE_STEPS: TourStep[] = [
  // 1. Языки
  {
    titleKey: 'tourStep1Title',
    textKey: 'tourStep1Text',
    targetId: 'tour-lang',
    placement: 'bottom',
    watchStore: 'locale',
    overlay: true,
  },

  // 2. Канва 2D (без оверлея, чтобы можно было рисовать)
  {
    titleKey: 'tourStep2Title',
    textKey: 'tourStep2Text',
    targetId: 'tour-canvas-2d',
    placement: 'bottom',
    overlay: false,
  },

  // 3. Кнопка выбора инструмента (house / fence)
  {
    titleKey: 'tourStep3Title',
    textKey: 'tourStep3Text',
    targetId: 'tour-building-btn',
    placement: 'bottom',
    watchStore: 'activeTool',
    overlay: false,
  },

  // 3b. Подсказка по канве
  {
    titleKey: 'tourStep3bTitle',
    textKey: 'tourStep3bText',
    targetId: 'tour-canvas-2d',
    placement: 'center',
    overlay: true,
  },

  // 4. Высота (контейнер HeightDropdown с id="tour-height-trigger")
  {
    titleKey: 'tourStep4Title',
    textKey: 'tourStep4Text',
    targetId: 'tour-height-trigger',
    placement: 'right',
    watchStore: 'fenceHeightCm',
    overlay: true,
  },
  {
  titleKey: 'tourStep4bTitle',
  textKey: 'tourStep4bText',
  targetId: 'tour-model-toggle',   // тот же контейнер с переключателем
  placement: 'right',
  watchStore: 'singleModel',          // ждём когда юзер переключит
  overlay: true,
},

  // 5. Панель single model (PanelDropdown с id="tour-pannel-dropdown")
  {
  titleKey: 'tourStep5Title',
  textKey: 'tourStep5Text',
  targetId: 'tour-pannel-dropdown',
  placement: 'right',
  watchStore: 'singlePanel',
  overlay: true,
},

  // 7. Пиллар (Section step 3, но нам важен dropdown; пока оставим контейнер tour-step3)
  {
    titleKey: 'tourStep7Title',
    textKey: 'tourStep7Text',
    targetId: 'tour-step3',
    placement: 'right',
    watchStore: 'selectedPillarStyle',
    overlay: true,
  },

  // 8. Цвет бетона (Section id="tour-step4")
  {
    titleKey: 'tourStep8Title',
    textKey: 'tourStep8Text',
    targetId: 'tour-step4',
    placement: 'right',
    watchStore: 'concreteColor',
    overlay: true,
  },

  // 9. Кнопка 3D
  {
    titleKey: 'tourStep9Title',
    textKey: 'tourStep9Text',
    targetId: 'tour-3d-btn',
    placement: 'bottom',
    overlay: true,
  },

  // 10. Выбор ground
  {
    titleKey: 'tourStep10Title',
    textKey: 'tourStep10Text',
    targetId: 'tour-ground',
    placement: 'bottom',
    overlay: true,
  },
    // 11. Delivery
  {
    titleKey: 'tourStep11Title',
    textKey: 'tourStep11Text',
    targetId: 'tour-delivery',
    placement: 'right',
    overlay: true,
  },

  // 12. Download PDF
  {
    titleKey: 'tourStep12Title',
    textKey: 'tourStep12Text',
    targetId: 'tour-pdf-btn',
    placement: 'right',
    overlay: true,
  },
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
    return { box: { top: vh / 2 - bh / 2, left: vw / 2 - bw / 2 }, arrow: null };
  }

  const tr = el.getBoundingClientRect();
  const tx = tr.left + tr.width  / 2;
  const ty = tr.top  + tr.height / 2;

  // placement 'center' — тултип поверх элемента по центру, без стрелки
  if (placement === 'center') {
    return {
      box: {
        top:  Math.max(8, Math.min(ty - bh / 2, vh - bh - 8)),
        left: Math.max(8, Math.min(tx - bw / 2, vw - bw - 8)),
      },
      arrow: null,
    };
  }

  let boxTop = 0, boxLeft = 0;
  let arrowTipX = tx, arrowTipY = ty;
  let arrowRot = '0deg';

  if (placement === 'bottom') {
    boxTop    = tr.bottom + GAP + 22;
    boxLeft   = tx - bw / 2;
    arrowTipX = tx;
    arrowTipY = tr.bottom + 5;
    arrowRot  = '0deg';
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
  const setTourOpen           = useDesignerStore((s) => s.setTourOpen);

  const locale              = useDesignerStore((s) => s.locale);
  const fenceHeightCm       = useDesignerStore((s) => s.fenceHeightCm);
  const singleModel         = useDesignerStore((s) => s.singleModel);
  const singlePanel         = useDesignerStore((s) => s.singlePanel);
  const selectedPillarStyle = useDesignerStore((s) => s.selectedPillarStyle);
  const baseConcreteColor = useDesignerStore((s) => s.baseConcreteColor);
  const panelOrientation    = useDesignerStore((s) => s.panelOrientation);
  const activeTool          = useDesignerStore((s) => s.activeTool);
  const fenceItems = useDesignerStore((s) => s.fenceItems);
const setRowsPopupOpen = useDesignerStore((s) => s.setRowsPopupOpen);

  const storeValues: Record<string, unknown> = {
    locale, fenceHeightCm, singleModel, singlePanel,
    selectedPillarStyle, baseConcreteColor, panelOrientation, activeTool,
  };

useEffect(() => {
  if (!open) {
    setRowsPopupOpen(false);
  }
}, [open]);
  // Синхронизируем tourOpen в store
  useEffect(() => {
    setTourOpen(open);
  }, [open]);

    const steps: TourStep[] = (() => {
  const list = [...BASE_STEPS];

  if (!singleModel) {
    // Убираем шаг tourStep5 (выбор single панели) — он не нужен при byRows
    const step5idx = list.findIndex((s) => s.titleKey === 'tourStep5Title');
    if (step5idx !== -1) list.splice(step5idx, 1);

    // Вместо него вставляем шаги для byRows
    const insertAfter = list.findIndex((s) => s.titleKey === 'tourStep4bTitle');
    const insertIdx = insertAfter !== -1 ? insertAfter + 1 : list.findIndex((s) => s.titleKey === 'tourStep7Title');

    list.splice(insertIdx, 0,
      // Шаг: объяснение кнопки summary / кнопки edit
      {
        titleKey: 'tourStep5bTitle',
        textKey: 'tourStep5bText',
        targetId: 'tour-rows-summary',
        placement: 'right',
        overlay: true,
      }
    );
  }
    

  // Шаг текстуры — только если singlePanel.side === 'one'
  if (singlePanel?.side === 'one') {
    const idx = list.findIndex((s) => s.titleKey === 'tourStep7Title');
    if (idx !== -1) {
      list.splice(idx, 0, {
        titleKey: 'tourStep6Title',
        textKey: 'tourStep6Text',
        targetId: 'tour-step25',
        placement: 'right',
        watchStore: 'panelOrientation',
        overlay: true,
      });
    }
  }
if (fenceItems.length === 0) {
  const d = list.findIndex((s) => s.targetId === 'tour-delivery');
  if (d !== -1) list.splice(d, 2);
}
  return list;
})();
const stepsRef = useRef(steps);
stepsRef.current = steps; 

  const total   = steps.length;
  const current = steps[Math.min(stepIdx, total - 1)];
// Пересчёт позиции
 useLayoutEffect(() => {
  if (!open) return;
  const calc = () => {
    const currentStep = stepsRef.current[Math.min(stepIdx, stepsRef.current.length - 1)];
    const box = boxRef.current;
    const bw  = box?.offsetWidth  || 280;
    const bh  = box?.offsetHeight || 160;
    let result = calcLayout(currentStep.targetId, currentStep.placement, bw, bh);
    setLayout(result);
  };
  const t1 = setTimeout(calc, 50);
  const t2 = setTimeout(calc, 300);
  const t3 = setTimeout(calc, 800);
  window.addEventListener('resize', calc);
  return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); window.removeEventListener('resize', calc); };
}, [open, stepIdx]);
  // Авто-переход при изменении store
  const watchInitVal = useRef<unknown>(UNINIT);

  useEffect(() => {
    if (!open || !current.watchStore) return;
    watchInitVal.current = storeValues[current.watchStore];
  }, [open, stepIdx]);

  useEffect(() => {
    if (!open || !current.watchStore) return;
    const val = storeValues[current.watchStore];
    if (watchInitVal.current !== UNINIT && val !== watchInitVal.current) {
      watchInitVal.current = UNINIT;
      setTimeout(() => setStepIdx((i) => Math.min(i + 1, total - 1)), 350);
    }
  }, [locale, fenceHeightCm, singleModel, singlePanel, selectedPillarStyle, baseConcreteColor, panelOrientation, activeTool]);

  

  const next  = () => setStepIdx((i) => Math.min(i + 1, total - 1));
  const prev  = () => setStepIdx((i) => Math.max(i - 1, 0));
  const close = () => { setOpen(false); setStepIdx(0); };
console.log(current.targetId);
  return (
  <>
    <button
      onClick={() => { setOpen(true); setStepIdx(0); setPulse(false); }}
      style={{
        position: 'relative',
        padding: '5px 10px',
        borderRadius: 6,
        border: 'none',
        background: '#d3001b',
        color: '#fff',
        fontWeight: 700,
        fontSize: 11,
        cursor: 'pointer',
        flexShrink: 0,
        overflow: 'visible',
        marginRight: 10,
      }}
    >
      {pulse && <PulseRing />}
      <span style={{ position: 'relative', zIndex: 2 }}>
        {t('tourBtn' as any)}
      </span>
    </button>

    <style>{`
      @keyframes tourFadeIn {
        from { opacity:0; transform:translateY(8px); }
        to { opacity:1; transform:translateY(0); }
      }

      @keyframes tourBounceArrow {
        0%,100% { transform:translateY(0); }
        50% { transform:translateY(6px); }
      }

      @keyframes tourRingPulse {
        0% {
          transform: scale(1);
          opacity: 0.95;
        }
        70% {
          transform: scale(1.28);
          opacity: 0.25;
        }
        100% {
          transform: scale(1.55);
          opacity: 0;
        }
      }

      @keyframes spotlightPulse {
        0%,100% { box-shadow:0 0 0 3px #d3001b, 0 0 16px 4px rgba(79,195,161,0.35); }
        50% { box-shadow:0 0 0 5px #d3001b, 0 0 28px 8px rgba(79,195,161,0.55); }
      }
    `}</style>

    {open && createPortal(
      <>
        {current.targetId && <Spotlight targetId={current.targetId} />}

        {layout.arrow && (
          <div style={{
            position: 'fixed',
            left: layout.arrow.x - 10,
            top: layout.arrow.y - 10,
            width: 20,
            height: 20,
            zIndex: 99999,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            color: '#d3001b',
            rotate: layout.arrow.rot,
            animation: 'tourBounceArrow 0.85s ease-in-out infinite',
          }}>▲</div>
        )}

        <div
          ref={boxRef}
          style={{
            position: 'fixed',
            top: layout.box.top,
            left: current.targetId === 'tour-rows-summary' ? layout.box.left + 380 : layout.box.left,
            width: 280,
            background: '#1a1a1a',
            border: '2px solid #d3001b',
            borderRadius: 12,
            padding: '14px 16px',
            zIndex: 99999,
            boxShadow: '0 12px 40px rgba(0,0,0,0.8)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            animation: 'tourFadeIn 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {steps.map((_, i) => (
                <div
                  key={i}
                  onClick={() => setStepIdx(i)}
                  style={{
                    width: i === stepIdx ? 16 : 6,
                    height: 6,
                    borderRadius: 3,
                    cursor: 'pointer',
                    background: i === stepIdx ? '#d3001b' : i < stepIdx ? '#fa667a' : '#fff',
                    transition: 'all 0.3s',
                  }}
                />
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, color: '#fff' }}>
                {stepIdx + 1} {t('tourOf' as any)} {total}
              </span>
              <button
                onClick={close}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 18,
                  padding: 0,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
          </div>

          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
            {t(current.titleKey as any)}
          </div>

          <div style={{ fontSize: 12, color: '#fff', lineHeight: 1.5 }}>
            {t(current.textKey as any)}
          </div>

          {current.watchStore && (
            <div
              style={{
                fontSize: 11,
                color: '#d3001b',
                background: 'rgba(211,0,97,0.1)',
                borderRadius: 6,
                padding: '5px 8px',
                border: '1px solid rgba(211,0,97,0.3)',
              }}
            >
              ✨ {t('tourInteract' as any)}
            </div>
          )}

          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={close} style={btnGhost}>{t('tourSkip' as any)}</button>
            <div style={{ flex: 1 }} />
            {stepIdx > 0 && <button onClick={prev} style={btnGhost}>{t('tourPrev' as any)}</button>}
            {stepIdx < total - 1
              ? <button onClick={next} style={btnPrimary}>{t('tourNext' as any)}</button>
              : <button onClick={close} style={btnPrimary}>{t('tourClose' as any)} ✓</button>}
          </div>
        </div>
      </>,
      document.body
    )}
  </>
);
}

function Spotlight({ targetId }: { targetId: string }) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  useLayoutEffect(() => {
    const update = () => { const el = document.getElementById(targetId); if (el) setRect(el.getBoundingClientRect()); };
    update();
    const timer = setTimeout(update, 80);
    return () => clearTimeout(timer);
  }, [targetId]);
  if (!rect) return null;
  return createPortal(
    <div style={{
      position: 'fixed',
      top: rect.top - 5, left: rect.left - 5,
      width: rect.width + 10, height: rect.height + 10,
      borderRadius: 8,
      zIndex: 99999,
      pointerEvents: 'none',
      border: '2px solid #d3001b',
      animation: 'spotlightPulse 1.4s ease-in-out infinite',
    }} />,
    document.body
  );
}

function PulseRing() {
  return (
    <>
      <span
        style={{
          position: 'absolute',
          inset: -3,
          borderRadius: 8,
          border: '2px solid rgba(211,0,27,0.85)',
          animation: 'tourRingPulse 1.6s ease-out infinite',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
      <span
        style={{
          position: 'absolute',
          inset: -3,
          borderRadius: 8,
          border: '2px solid rgba(211,0,27,0.55)',
          animation: 'tourRingPulse 1.6s ease-out infinite 0.8s',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
    </>
  );
}

const btnPrimary: React.CSSProperties = { padding: '6px 12px', borderRadius: 6, border: 'none', background: '#d3001b', color: '#fff', fontWeight: 700, fontSize: 11, cursor: 'pointer' };
const btnGhost: React.CSSProperties   = { padding: '6px 10px', borderRadius: 6, border: '1px solid #fff', background: 'transparent', color: '#fff', fontSize: 11, cursor: 'pointer' };