function StatusDot({ status }) {
  const colors = {
    dirty: 'bg-status-modified',
    clean: 'bg-status-clean',
    scanning: 'bg-accent animate-pulse',
    missing: 'bg-status-error',
    error: 'bg-status-error',
  };
  return <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${colors[status] || 'bg-text-muted'}`} />;
}

// Vault icon (lock)
function VaultIcon({ className = '' }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.2" fill="none"/>
      <circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.2" fill="none"/>
      <line x1="9.5" y1="7" x2="11" y2="7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

export function Sidebar({ projects, watchStatuses, selectedProjectId, onSelectProject, onNewProject, onLogout }) {
  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-border-subtle bg-bg-surface select-none">
      {/* Section header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
          My Vaults
        </span>
        <button
          onClick={onNewProject}
          className="flex h-5 w-5 items-center justify-center rounded text-text-muted hover:bg-bg-hover hover:text-text-primary transition-colors"
          title="New Vault"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
            <path d="M5 0v10M0 5h10" strokeWidth="1.5" stroke="currentColor" strokeLinecap="round" fill="none"/>
          </svg>
        </button>
      </div>

      {/* Projects list */}
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
        {projects.length === 0 && (
          <div className="px-2 py-6 text-center text-[11px] text-text-muted">
            No vaults yet.<br />
            <button onClick={onNewProject} className="mt-1 text-accent hover:underline">
              Create your first vault
            </button>
          </div>
        )}
        {projects.map((project) => {
          const status = watchStatuses[project.id]?.status;
          const isSelected = selectedProjectId === project.id;
          return (
            <button
              key={project.id}
              onClick={() => onSelectProject(project.id)}
              className={`group flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left transition-colors ${
                isSelected
                  ? 'bg-bg-active text-text-primary'
                  : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
              }`}
            >
              <VaultIcon className={isSelected ? 'text-accent' : 'text-text-muted'} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] font-medium leading-tight">
                  {project.name}
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-text-muted">
                  <StatusDot status={status} />
                  <span>
                    {status === 'dirty'
                      ? 'Updates detected'
                      : status === 'scanning'
                      ? 'Scanning…'
                      : status === 'missing'
                      ? 'Folder missing'
                      : status === 'error'
                      ? 'Error'
                      : 'Up to date'}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="border-t border-border-subtle px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-status-clean animate-pulse" />
          <span className="text-[10px] text-text-muted font-medium">Telegram connected</span>
        </div>
        <button
          onClick={onLogout}
          className="text-[10px] text-text-muted hover:text-status-error transition-colors font-medium"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
