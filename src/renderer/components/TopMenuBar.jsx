import { useEffect, useRef, useState } from 'react';

// TelVault Logo SVG
function TelVaultLogo({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="7" fill="#2f81f7"/>
      {/* Vault door shape */}
      <rect x="7" y="7" width="18" height="18" rx="3" stroke="white" strokeWidth="2" fill="none"/>
      {/* Lock circle */}
      <circle cx="16" cy="16" r="4" stroke="white" strokeWidth="2" fill="none"/>
      {/* Handle */}
      <line x1="20" y1="16" x2="23" y2="16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      {/* Bolt indicators */}
      <rect x="8.5" y="9" width="2" height="2" rx="0.5" fill="white" opacity="0.7"/>
      <rect x="21.5" y="9" width="2" height="2" rx="0.5" fill="white" opacity="0.7"/>
      <rect x="8.5" y="21" width="2" height="2" rx="0.5" fill="white" opacity="0.7"/>
      <rect x="21.5" y="21" width="2" height="2" rx="0.5" fill="white" opacity="0.7"/>
    </svg>
  );
}

export function TitleBar({ onNewProject, onLogout, projectName }) {
  const [activeMenu, setActiveMenu] = useState(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    window.telvault.win.isMaximized().then(setIsMaximized);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = (menu) => setActiveMenu(activeMenu === menu ? null : menu);

  const handleAction = (action) => {
    setActiveMenu(null);
    action();
  };

  const handleMaximize = async () => {
    await window.telvault.win.maximize();
    const maximized = await window.telvault.win.isMaximized();
    setIsMaximized(maximized);
  };

  return (
    <header
      className="drag-region flex h-10 w-full shrink-0 items-center justify-between border-b border-border-subtle bg-bg-surface select-none"
      style={{ zIndex: 100 }}
    >
      {/* Left: Logo + Menus */}
      <div ref={menuRef} className="no-drag flex items-center gap-0.5 pl-3 h-full">
        <div className="mr-2 flex items-center gap-2">
          <TelVaultLogo size={18} />
        </div>

        {[
          {
            label: 'File',
            items: [
              { label: 'New Vault', action: onNewProject },
              null,
              { label: 'Quit TelVault', action: () => window.telvault.win.close() },
            ],
          },
          {
            label: 'Account',
            items: [
              { label: 'Sign Out', action: onLogout, danger: true },
            ],
          },
          {
            label: 'Help',
            items: [
              { label: 'About TelVault', action: () => {} },
            ],
          },
        ].map((menu) => (
          <div key={menu.label} className="relative h-full flex items-center">
            <button
              onClick={() => toggleMenu(menu.label)}
              className={`flex h-full items-center px-3 text-xs font-medium transition-colors ${
                activeMenu === menu.label
                  ? 'bg-bg-hover text-text-primary'
                  : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
              }`}
            >
              {menu.label}
            </button>
            {activeMenu === menu.label && (
              <div className="absolute left-0 top-full mt-0.5 z-50 w-48 rounded-lg border border-border-subtle bg-bg-card shadow-popup overflow-hidden">
                {menu.items.map((item, i) =>
                  item === null ? (
                    <div key={i} className="my-1 border-t border-border-subtle" />
                  ) : (
                    <button
                      key={item.label}
                      onClick={() => handleAction(item.action)}
                      className={`flex w-full items-center px-3 py-2 text-left text-xs transition-colors ${
                        item.danger
                          ? 'text-status-error hover:bg-status-error/10'
                          : 'text-text-primary hover:bg-bg-hover'
                      }`}
                    >
                      {item.label}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Center: Title */}
      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-xs font-medium text-text-muted tracking-wide">
        {projectName ? `${projectName} — TelVault` : 'TelVault'}
      </div>

      {/* Right: Window controls */}
      <div className="no-drag flex h-full items-center">
        {/* Minimize */}
        <button
          onClick={() => window.telvault.win.minimize()}
          className="flex h-10 w-12 items-center justify-center text-text-muted hover:bg-bg-hover hover:text-text-primary transition-colors"
          title="Minimize"
        >
          <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor">
            <rect width="10" height="1"/>
          </svg>
        </button>
        {/* Maximize */}
        <button
          onClick={handleMaximize}
          className="flex h-10 w-12 items-center justify-center text-text-muted hover:bg-bg-hover hover:text-text-primary transition-colors"
          title={isMaximized ? 'Restore' : 'Maximize'}
        >
          {isMaximized ? (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="2" y="0" width="8" height="8"/>
              <rect x="0" y="2" width="8" height="8" fill="#161b22"/>
              <rect x="0" y="2" width="8" height="8"/>
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="0" y="0" width="10" height="10"/>
            </svg>
          )}
        </button>
        {/* Close */}
        <button
          onClick={() => window.telvault.win.close()}
          className="flex h-10 w-12 items-center justify-center text-text-muted hover:bg-red-600 hover:text-white transition-colors"
          title="Close"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
            <line x1="0" y1="0" x2="10" y2="10"/>
            <line x1="10" y1="0" x2="0" y2="10"/>
          </svg>
        </button>
      </div>
    </header>
  );
}
