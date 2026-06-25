import { useState, useEffect } from "react";
import Sidebar from "../components/sidebar/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileTab, setMobileTab] = useState<"settings" | "view">("view");

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  if (isMobile) {
    return (
      <div className="app-layout app-layout--mobile">
        <div className="app-layout__mobile-tabs">
          {(["view", "settings"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setMobileTab(tab)}
              className={`app-layout__mobile-tab ${
                mobileTab === tab ? "is-active" : ""
              }`}
            >
              {tab === "settings" ? "⚙️ Settings" : "🗺️ Preview"}
            </button>
          ))}
        </div>

        <div className="app-layout__mobile-content">
          <div
            className="app-layout__mobile-panel app-layout__mobile-panel--settings"
            style={{ display: mobileTab === "settings" ? "block" : "none" }}
          >
            <Sidebar />
          </div>

          <div
            className="app-layout__mobile-panel app-layout__mobile-panel--view"
            style={{ display: mobileTab === "view" ? "block" : "none" }}
          >
            {children}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout app-layout--desktop">
      <div className="app-layout__sidebar-wrap">
        <Sidebar />
      </div>
      <div className="app-layout__viewport-wrap">
        {children}
      </div>
    </div>
  );
}