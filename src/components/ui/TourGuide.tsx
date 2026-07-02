import { useState, useEffect, useRef, useLayoutEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useDesignerStore } from "../../store/useDesignerStore";
import { useT } from "../../lib/i18n";

const UNINIT = Symbol("uninit");

type WatchStoreKey =
  | "locale"
  | "fenceHeightCm"
  | "singleModel"
  | "singlePanel"
  | "selectedPillarStyle"
  | "baseConcreteColor"
  | "selectedRal"
  | "panelOrientation"
  | "activeTool"
  | "groundType"
  | "concreteColorWatch";

type TourStep = {
  titleKey: string;
  textKey: string;
  targetId: string | null;
  placement: "top" | "bottom" | "left" | "right" | "center";
  watchStore?: WatchStoreKey;
  overlay?: boolean;
  mobileTab?: "preview" | "settings";
  mobilePlacement?: "top" | "bottom" | "left" | "right" | "center";
};

const BASE_STEPS: TourStep[] = [
  {
    titleKey: "tourStep1Title",
    textKey: "tourStep1Text",
    targetId: "tour-lang",
    placement: "bottom",
    watchStore: "locale",
    overlay: true,
    mobileTab: "settings",
  },
  {
    titleKey: "tourStep2Title",
    textKey: "tourStep2Text",
    targetId: "tour-canvas-2d",
    placement: "bottom",
    overlay: false,
    mobileTab: "preview",
  },
  {
    titleKey: "tourStep3Title",
    textKey: "tourStep3Text",
    targetId: "tour-building-btn",
    placement: "bottom",
    watchStore: "activeTool",
    overlay: false,
    mobileTab: "preview",
  },
  {
    titleKey: "tourStep3bTitle",
    textKey: "tourStep3bText",
    targetId: "tour-canvas-2d",
    placement: "center",
    overlay: true,
    mobileTab: "preview",
  },
  {
    titleKey: "tourStep4Title",
    textKey: "tourStep4Text",
    targetId: "tour-height-trigger",
    placement: "right",
    watchStore: "fenceHeightCm",
    overlay: true,
    mobileTab: "settings",
    mobilePlacement: "bottom",
  },
  {
    titleKey: "tourStep4bTitle",
    textKey: "tourStep4bText",
    targetId: "tour-model-toggle",
    placement: "right",
    watchStore: "singleModel",
    overlay: true,
    mobileTab: "settings",
    mobilePlacement: "bottom",
  },
  {
    titleKey: "tourStep5Title",
    textKey: "tourStep5Text",
    targetId: "tour-pannel-dropdown",
    placement: "right",
    watchStore: "singlePanel",
    overlay: true,
    mobileTab: "settings",
    mobilePlacement: "bottom",
  },
  {
    titleKey: "tourStep7Title",
    textKey: "tourStep7Text",
    targetId: "tour-step3",
    placement: "right",
    watchStore: "selectedPillarStyle",
    overlay: true,
    mobilePlacement: "bottom",
    mobileTab: "settings",
  },
  {
    titleKey: "tourStep8Title",
    textKey: "tourStep8Text",
    targetId: "tour-step4",
    placement: "right",
    //watchStore: "concreteColorWatch",
    overlay: true,
    mobilePlacement: "bottom",
    mobileTab: "settings",
  },
  {
    titleKey: "tourStep9Title",
    textKey: "tourStep9Text",
    targetId: "tour-3d-btn",
    placement: "bottom",
    overlay: true,
    mobileTab: "preview",
  },
  {
    titleKey: "tourStep10Title",
    textKey: "tourStep10Text",
    targetId: "tour-ground",
    placement: "bottom",
    watchStore: "groundType",
    overlay: true,
  },
  {
    titleKey: "tourStep11Title",
    textKey: "tourStep11Text",
    targetId: "tour-delivery",
    placement: "right",
    overlay: true,
    mobileTab: "settings",
    mobilePlacement: "center",
  },
  {
    titleKey: "tourStep12Title",
    textKey: "tourStep12Text",
    targetId: "tour-pdf-btn",
    placement: "center",
    overlay: true,
    mobileTab: "settings",
    mobilePlacement: "center",
  },
];

// Steps at this index and beyond are always centered in the viewport
const CENTER_FROM_STEP = 9;

function serialize(value: unknown): string {
  if (value == null) return "null";
  if (typeof value !== "object") return String(value);
  try {
    const sorted = Object.keys(value as object)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        acc[k] = (value as Record<string, unknown>)[k];
        return acc;
      }, {});
    return JSON.stringify(sorted);
  } catch {
    return String(value);
  }
}

function calcLayout(
  targetId: string | null,
  placement: string,
  bw: number,
  bh: number,
  forceCenter = false
) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const GAP = 12;
  const isMobile = vw < 768;

  const effectivePlacement =
    isMobile && (placement === "right" || placement === "left")
      ? "bottom"
      : placement;

  const viewportCenter = {
    box: {
      top: Math.max(isMobile ? 56 : 8, Math.min(vh / 2 - bh / 2, vh - bh - 8)),
      left: Math.max(8, Math.min(vw / 2 - bw / 2, vw - bw - 8)),
    },
    arrow: null as { x: number; y: number; rot: string } | null,
  };

  if (forceCenter || effectivePlacement === "center" || !targetId) {
    return viewportCenter;
  }

  const el = document.getElementById(targetId);
  if (!el) return viewportCenter;

  const tr = el.getBoundingClientRect();
  const tx = tr.left + tr.width / 2;
  const ty = tr.top + tr.height / 2;

  let boxTop = 0;
  let boxLeft = 0;
  let arrowTipX = tx;
  let arrowTipY = ty;
  let arrowRot = "0deg";

  if (effectivePlacement === "bottom") {
    boxTop = tr.bottom + GAP + 22;
    boxLeft = tx - bw / 2;
    arrowTipX = tx;
    arrowTipY = tr.bottom + 5;
    arrowRot = "0deg";
  } else if (effectivePlacement === "top") {
    boxTop = tr.top - bh - GAP - 22;
    boxLeft = tx - bw / 2;
    arrowTipX = tx;
    arrowTipY = tr.top - 5;
    arrowRot = "180deg";
  } else if (effectivePlacement === "right") {
    boxTop = ty - bh / 2;
    boxLeft = tr.right + GAP + 22;
    arrowTipX = tr.right + 5;
    arrowTipY = ty;
    arrowRot = "-90deg";
  } else if (effectivePlacement === "left") {
    boxTop = ty - bh / 2;
    boxLeft = tr.left - bw - GAP - 22;
    arrowTipX = tr.left - 5;
    arrowTipY = ty;
    arrowRot = "90deg";
  }

  boxLeft = Math.max(8, Math.min(boxLeft, vw - bw - 8));
  boxTop = Math.max(isMobile ? 56 : 8, Math.min(boxTop, vh - bh - 8));

  return {
    box: { top: boxTop, left: boxLeft },
    arrow: { x: arrowTipX, y: arrowTipY, rot: arrowRot },
  };
}

function getScrollParent(el: HTMLElement | null): HTMLElement | Window {
  let parent = el?.parentElement ?? null;
  while (parent) {
    const style = window.getComputedStyle(parent);
    const ov = style.overflowY;
    if (ov === "auto" || ov === "scroll") return parent;
    parent = parent.parentElement;
  }
  return window;
}

export default function TourGuide() {
  const [open, setOpen] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [layout, setLayout] = useState<{
    box: { top: number; left: number };
    arrow: { x: number; y: number; rot: string } | null;
  }>({ box: { top: 200, left: 400 }, arrow: null });
  const [pulse, setPulse] = useState(true);

  const boxRef = useRef<HTMLDivElement>(null);
  const watchBaselineRef = useRef<string | symbol>(UNINIT);
  const watchBaselineStepRef = useRef<number>(-1);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const t = useT();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const setTourOpen = useDesignerStore((s) => s.setTourOpen);
  const mobileTab = useDesignerStore((s) => s.mobileTab);
  const setMobileTab = useDesignerStore((s) => s.setMobileTab);

  const locale = useDesignerStore((s) => s.locale);
  const fenceHeightCm = useDesignerStore((s) => s.fenceHeightCm);
  const singleModel = useDesignerStore((s) => s.singleModel);
  const singlePanel = useDesignerStore((s) => s.singlePanel);
  const selectedPillarStyle = useDesignerStore((s) => s.selectedPillarStyle);
  const baseConcreteColor = useDesignerStore((s) => s.baseConcreteColor);
  const selectedRal = useDesignerStore((s) => s.selectedRal);
  const panelOrientation = useDesignerStore((s) => s.panelOrientation);
  const activeTool = useDesignerStore((s) => s.activeTool);
  const fenceItems = useDesignerStore((s) => s.fenceItems);
  const groundType = useDesignerStore((s) => s.groundType);
  const setRowsPopupOpen = useDesignerStore((s) => s.setRowsPopupOpen);

  const concreteColorWatch = `${baseConcreteColor}-${selectedRal ?? "none"}`;

  const storeSnapshot: Record<WatchStoreKey, unknown> = {
    locale,
    fenceHeightCm,
    singleModel,
    singlePanel,
    selectedPillarStyle,
    baseConcreteColor,
    selectedRal,
    panelOrientation,
    activeTool,
    concreteColorWatch,
    groundType,
  };

  useEffect(() => {
    if (!open) setRowsPopupOpen(false);
  }, [open, setRowsPopupOpen]);

  useEffect(() => {
    setTourOpen(open);
  }, [open, setTourOpen]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
    };
  }, []);
  

  const steps: TourStep[] = useMemo(() => {
    const list = [...BASE_STEPS];

    if (!singleModel) {
      const step5idx = list.findIndex((s) => s.titleKey === "tourStep5Title");
      if (step5idx !== -1) list.splice(step5idx, 1);

      const insertAfter = list.findIndex((s) => s.titleKey === "tourStep4bTitle");
      const insertIdx =
        insertAfter !== -1
          ? insertAfter + 1
          : list.findIndex((s) => s.titleKey === "tourStep7Title");

      list.splice(insertIdx, 0, {
        titleKey: "tourStep5bTitle",
        textKey: "tourStep5bText",
        targetId: "tour-rows-summary",
        placement: "right",
        overlay: true,
        mobileTab: "settings",
        mobilePlacement: "bottom",
      });
    }

    if (singlePanel?.side === "one") {
      const idx = list.findIndex((s) => s.titleKey === "tourStep7Title");
      if (idx !== -1) {
        list.splice(idx, 0, {
          titleKey: "tourStep6Title",
          textKey: "tourStep6Text",
          targetId: "tour-step25",
          placement: "right",
          watchStore: "panelOrientation",
          overlay: true,
          mobileTab: "settings",
          mobilePlacement: "bottom",
        });
      }
    }

    if (fenceItems.length === 0) {
      const d = list.findIndex((s) => s.targetId === "tour-delivery");
      if (d !== -1) list.splice(d, 2);
    }

    return list;
  }, [singleModel, singlePanel?.side, fenceItems.length]);

  useEffect(() => {
    if (stepIdx > steps.length - 1) {
      setStepIdx(Math.max(0, steps.length - 1));
    }
  }, [steps.length, stepIdx]);
  useEffect(() => {
  if (!open) return;
  const step = steps[Math.min(stepIdx, steps.length - 1)];
  if (step?.titleKey !== "tourStep9Title") return;

  const btn = document.getElementById("tour-3d-btn");
  if (!btn) return;

  const handleClick = () => {
    setTimeout(() => {
      setStepIdx((prev) => Math.min(prev + 1, stepsRef.current.length - 1));
    }, 300);
  };

  btn.addEventListener("click", handleClick);
  return () => btn.removeEventListener("click", handleClick);
}, [open, stepIdx, steps]);

  const stepsRef = useRef(steps);
  stepsRef.current = steps;

  const total = steps.length;
  const safeIdx = Math.min(stepIdx, total - 1);
  const current = steps[safeIdx];
  const isLateStep = safeIdx >= CENTER_FROM_STEP;
 const isMobileSettingsStep =
  isMobile && current?.mobileTab === "settings" && !isLateStep;
  const isMobilePreviewStep = isMobile && current?.mobileTab === "preview";

  // Reset baseline when step changes
  useEffect(() => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
    watchBaselineRef.current = UNINIT;
    watchBaselineStepRef.current = stepIdx;
  }, [open, stepIdx]);

  // Watch for store changes and auto-advance
  useEffect(() => {
    if (!open || !current?.watchStore) return;
    if (watchBaselineStepRef.current !== stepIdx) return;

    const currentVal = serialize(storeSnapshot[current.watchStore]);

    if (watchBaselineRef.current === UNINIT) {
      watchBaselineRef.current = currentVal;
      return;
    }

    if (currentVal !== watchBaselineRef.current) {
      watchBaselineRef.current = UNINIT;
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = setTimeout(() => {
        setStepIdx((prev) =>
          Math.min(prev + 1, stepsRef.current.length - 1)
        );
        advanceTimerRef.current = null;
      }, 220);
    }
  }, [
    open,
    stepIdx,
    locale,
    fenceHeightCm,
    singleModel,
    singlePanel,
    selectedPillarStyle,
    baseConcreteColor,
    selectedRal,
    concreteColorWatch,
    panelOrientation,
    activeTool,
  ]);

  // Layout calculation
  useLayoutEffect(() => {
    if (!open) return;

    const calc = () => {
      const step =
        stepsRef.current[Math.min(stepIdx, stepsRef.current.length - 1)];
      const box = boxRef.current;
      const bw = box?.offsetWidth || 320;
      const bh = box?.offsetHeight || 160;
      const isMobileNow = window.innerWidth < 768;
      const stepIsLate =
        Math.min(stepIdx, stepsRef.current.length - 1) >= CENTER_FROM_STEP;

      if (isMobileNow && step?.mobileTab === "settings" && !stepIsLate) {
  setLayout({ box: { top: 0, left: 12 }, arrow: null });
  return;
}
if (isMobileNow && stepIsLate) {
  const box = boxRef.current;
  const bw = box?.offsetWidth || 320;
  const vw = window.innerWidth;
  setLayout({
    box: {
      top: 140,                              // под шапку Preview/Settings
      left: Math.max(8, vw / 2 - bw / 2),  // по горизонтали по центру
    },
    arrow: null,
  });
  return;
}

      const actualPlacement =
        isMobileNow && step.mobilePlacement
          ? step.mobilePlacement
          : step.placement;

      const result = calcLayout(step.targetId, actualPlacement, bw, bh, false);
      setLayout(result);
    };

    const step =
      stepsRef.current[Math.min(stepIdx, stepsRef.current.length - 1)];
    const baseDelay = isMobile && step?.mobileTab ? 180 : 50;

    const t1 = setTimeout(calc, baseDelay);
    const t2 = setTimeout(calc, baseDelay + 200);
    const t3 = setTimeout(calc, baseDelay + 600);

    const currentEl = step?.targetId
      ? document.getElementById(step.targetId)
      : null;
    const scrollParent = getScrollParent(currentEl);

    window.addEventListener("resize", calc, { passive: true });
    window.visualViewport?.addEventListener("resize", calc);
    window.visualViewport?.addEventListener("scroll", calc);

    if (scrollParent === window) {
      window.addEventListener("scroll", calc, { passive: true });
    } else {
      scrollParent.addEventListener("scroll", calc, { passive: true });
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener("resize", calc);
      window.visualViewport?.removeEventListener("resize", calc);
      window.visualViewport?.removeEventListener("scroll", calc);
      if (scrollParent === window) {
        window.removeEventListener("scroll", calc);
      } else {
        scrollParent.removeEventListener("scroll", calc);
      }
    };
  }, [open, stepIdx, isMobile]);

  // Mobile: switch tab
  useEffect(() => {
    if (!open || !isMobile) return;
    const step = steps[Math.min(stepIdx, steps.length - 1)];
    if (step?.mobileTab && step.mobileTab !== mobileTab) {
      setMobileTab(step.mobileTab);
    }
  }, [open, isMobile, stepIdx, steps, mobileTab, setMobileTab]);

  // Mobile: scroll to target (skip late/center steps)
  useEffect(() => {
    if (!open || !isMobile) return;
    const step = steps[Math.min(stepIdx, steps.length - 1)];
    if (!step?.targetId || stepIdx >= CENTER_FROM_STEP) return;

    const scrollToTarget = () => {
      const el = document.getElementById(step.targetId!);
      if (!el) return;
      el.scrollIntoView({
        behavior: "smooth",
        block: step.mobileTab === "settings" ? "center" : "nearest",
        inline: "nearest",
      });
    };

    const delay = step.mobileTab === "settings" ? 260 : 120;
    const timer = setTimeout(scrollToTarget, delay);
    return () => clearTimeout(timer);
  }, [open, isMobile, stepIdx, steps]);

  const next = () => setStepIdx((i) => Math.min(i + 1, total - 1));
  const prev = () => setStepIdx((i) => Math.max(i - 1, 0));
  const close = () => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
    setOpen(false);
    setStepIdx(0);
  };

  return (
    <>
      <button
        onClick={() => {
          if (advanceTimerRef.current) {
            clearTimeout(advanceTimerRef.current);
            advanceTimerRef.current = null;
          }
          watchBaselineRef.current = UNINIT;
          watchBaselineStepRef.current = -1;
          setOpen(true);
          setStepIdx(0);
          setPulse(false);
        }}
        style={{
          position: "relative",
          padding: "5px 10px",
          borderRadius: 6,
          border: "none",
          background: "#d3001b",
          color: "#fff",
          fontWeight: 700,
          fontSize: 11,
          cursor: "pointer",
          flexShrink: 0,
          overflow: "visible",
          marginRight: 10,
        }}
      >
        {pulse && <PulseRing />}
        <span style={{ position: "relative", zIndex: 2 }}>
          {t("tourBtn" as any)}
        </span>
      </button>

      <style>{`
        @keyframes tourFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes tourBounceArrow {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(6px); }
        }
        @keyframes tourRingPulse {
          0% { transform: scale(1); opacity: 0.95; }
          70% { transform: scale(1.28); opacity: 0.25; }
          100% { transform: scale(1.55); opacity: 0; }
        }
        @keyframes spotlightPulse {
          0%,100% { box-shadow: 0 0 0 3px #d3001b, 0 0 16px 4px rgba(79,195,161,0.35); }
          50% { box-shadow: 0 0 0 5px #d3001b, 0 0 28px 8px rgba(79,195,161,0.55); }
        }
      `}</style>

      {open &&
        createPortal(
          <>
            {current.targetId && (
              <Spotlight targetId={current.targetId} active={true} />
            )}

            {layout.arrow && !isMobileSettingsStep && (
              <div
                style={{
                  position: "fixed",
                  left: layout.arrow.x - 10,
                  top: layout.arrow.y - 10,
                  width: 20,
                  height: 20,
                  zIndex: 99999,
                  pointerEvents: "none",
                  display:
                    isMobilePreviewStep || !isMobile ? "flex" : "none",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  color: "#d3001b",
                  rotate: layout.arrow.rot,
                  animation: "tourBounceArrow 0.85s ease-in-out infinite",
                }}
              >
                ▲
              </div>
            )}

            <div
              ref={boxRef}
              style={{
                position: "fixed",
                top: isLateStep
                  ? layout.box.top
                  : isMobileSettingsStep
                  ? "auto"
                  : layout.box.top,
                bottom: isLateStep ? "auto" : isMobileSettingsStep ? 12 : "auto",
                left: isLateStep
                  ? layout.box.left
                  : isMobileSettingsStep
                  ? 12
                  : isMobile
                  ? layout.box.left
                  : current.targetId === "tour-rows-summary"
                  ? layout.box.left + 380
                  : layout.box.left,
                right: isLateStep ? "auto" : isMobileSettingsStep ? 12 : "auto",
                width: isLateStep
                  ? isMobile
                    ? Math.min(320, window.innerWidth - 24)
                    : 320
                  : isMobileSettingsStep
                  ? "auto"
                  : isMobile
                  ? Math.min(320, window.innerWidth - 24)
                  : 320,
                maxWidth:
                  !isLateStep && isMobileSettingsStep ? "none" : undefined,
                maxHeight:
                  !isLateStep && isMobileSettingsStep ? "42dvh" : undefined,
                overflowY:
                  !isLateStep && isMobileSettingsStep ? "auto" : undefined,
                WebkitOverflowScrolling:
                  !isLateStep && isMobileSettingsStep ? "touch" : undefined,
                background: "#1a1a1a",
                border: "2px solid #d3001b",
                borderRadius: 12,
                padding: "14px 16px",
                zIndex: 99999,
                boxShadow: "0 12px 40px rgba(0,0,0,0.8)",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                animation: "tourFadeIn 0.2s ease",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", gap: 4 }}>
                  {steps.map((_, i) => (
                    <div
                      key={i}
                      onClick={() => setStepIdx(i)}
                      style={{
                        width: i === stepIdx ? 16 : 6,
                        height: 6,
                        borderRadius: 3,
                        cursor: "pointer",
                        background:
                          i === stepIdx
                            ? "#d3001b"
                            : i < stepIdx
                            ? "#fa667a"
                            : "#fff",
                        transition: "all 0.3s",
                      }}
                    />
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 10, color: "#fff" }}>
                    {stepIdx + 1} {t("tourOf" as any)} {total}
                  </span>
                  <button
                    onClick={close}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#fff",
                      cursor: "pointer",
                      fontSize: 18,
                      padding: 0,
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>

              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#fff",
                  lineHeight: 1.3,
                }}
              >
                {t(current.titleKey as any)}
              </div>

              <div style={{ fontSize: 12, color: "#fff", lineHeight: 1.5 }}>
                {t(current.textKey as any)}
              </div>

              {current.watchStore && (
                <div
                  style={{
                    fontSize: 11,
                    color: "#d3001b",
                    background: "rgba(211,0,97,0.1)",
                    borderRadius: 6,
                    padding: "5px 8px",
                    border: "1px solid rgba(211,0,97,0.3)",
                  }}
                >
                  ✨ {t("tourInteract" as any)}
                </div>
              )}

              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={close} style={btnGhost}>
                  {t("tourSkip" as any)}
                </button>
                <div style={{ flex: 1 }} />
                {stepIdx > 0 && (
                  <button onClick={prev} style={btnGhost}>
                    {t("tourPrev" as any)}
                  </button>
                )}
                {stepIdx < total - 1 ? (
                  <button onClick={next} style={btnPrimary}>
                    {t("tourNext" as any)}
                  </button>
                ) : (
                  <button onClick={close} style={btnPrimary}>
                    {t("tourClose" as any)} ✓
                  </button>
                )}
              </div>
            </div>
          </>,
          document.body
        )}
    </>
  );
}

function Spotlight({
  targetId,
  active = true,
}: {
  targetId: string;
  active?: boolean;
}) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useLayoutEffect(() => {
    if (!active) return;
    let raf = 0;
    const update = () => {
      const el = document.getElementById(targetId);
      if (!el) return;
      setRect(el.getBoundingClientRect());
    };
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    const el = document.getElementById(targetId);
    const scrollParent = getScrollParent(el ?? null);
    update();
    const t1 = setTimeout(schedule, 80);
    const t2 = setTimeout(schedule, 220);
    const t3 = setTimeout(schedule, 500);
    window.addEventListener("resize", schedule, { passive: true });
    window.addEventListener("scroll", schedule, { passive: true });
    window.visualViewport?.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("scroll", schedule);
    if (scrollParent !== window) {
      scrollParent.addEventListener("scroll", schedule, { passive: true });
    }
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("scroll", schedule);
      if (scrollParent !== window) {
        scrollParent.removeEventListener("scroll", schedule);
      }
    };
  }, [targetId, active]);

  if (!rect) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: rect.top - 5,
        left: rect.left - 5,
        width: rect.width + 10,
        height: rect.height + 10,
        borderRadius: 8,
        zIndex: 99998,
        pointerEvents: "none",
        border: "2px solid #d3001b",
        animation: "spotlightPulse 1.4s ease-in-out infinite",
      }}
    />,
    document.body
  );
}

function PulseRing() {
  return (
    <>
      <span
        style={{
          position: "absolute",
          inset: -3,
          borderRadius: 8,
          border: "2px solid rgba(211,0,27,0.85)",
          animation: "tourRingPulse 1.6s ease-out infinite",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      <span
        style={{
          position: "absolute",
          inset: -3,
          borderRadius: 8,
          border: "2px solid rgba(211,0,27,0.55)",
          animation: "tourRingPulse 1.6s ease-out infinite 0.8s",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
    </>
  );
}

const btnPrimary: React.CSSProperties = {
  padding: "6px 12px",
  borderRadius: 6,
  border: "none",
  background: "#d3001b",
  color: "#fff",
  fontWeight: 700,
  fontSize: 11,
  cursor: "pointer",
};

const btnGhost: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 6,
  border: "1px solid #fff",
  background: "transparent",
  color: "#fff",
  fontSize: 11,
  cursor: "pointer",
};