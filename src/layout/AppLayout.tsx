import { useState, useEffect } from "react";
import Sidebar from "../components/sidebar/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileTab, setMobileTab] = useState<'settings' | 'view'>('view');

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>

        {/* Вкладки */}
        <div style={{
          display: 'flex', height: 48, minHeight: 48,
          background: '#111', borderBottom: '1px solid #2a2a2a', zIndex: 50,
        }}>
          {(['view', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setMobileTab(tab)}
              style={{
                flex: 1, background: 'none', border: 'none',
                borderBottom: `3px solid ${mobileTab === tab ? '#4fc3a1' : 'transparent'}`,
                color: mobileTab === tab ? '#d3001b' : '#666',
                fontWeight: 600, fontSize: 13, cursor: 'pointer',
                transition: 'color 0.2s, border-color 0.2s',
              }}
            >
              {tab === 'settings' ? '⚙️ Settings' : '🗺️ Preview'}
            </button>
          ))}
        </div>

        {/* Контент */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          <div style={{
            position: 'absolute', inset: 0,
            overflowY: 'auto', WebkitOverflowScrolling: 'touch' as any,
            display: mobileTab === 'settings' ? 'block' : 'none',
          }}>
            <Sidebar />
          </div>
          <div style={{
            position: 'absolute', inset: 0,
            display: mobileTab === 'view' ? 'block' : 'none', 
          }}>
            {children}
          </div>
        </div>

      </div>
    );
  }

  return (
  <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
    <div style={{ position: 'relative', zIndex: 10, flexShrink: 0 }}>  {/* ← обёртка вокруг sidebar */}
      <Sidebar />
    </div>
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minWidth: 0 }}>
      {children}
    </div>
  </div>
);
}