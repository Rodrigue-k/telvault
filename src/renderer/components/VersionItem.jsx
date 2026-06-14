import { Button } from './Button';

function formatSize(bytes) {
  if (!bytes || bytes === 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatDate(isoString) {
  const d = new Date(isoString);
  const now = new Date();
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return `Today at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  if (diffDays === 1) return `Yesterday at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
}

// Hash-style version identifier (e.g. v3 → "003")
function VersionTag({ num }) {
  return (
    <span className="inline-flex items-center rounded-md border border-accent/30 bg-accent/10 px-2 py-0.5 text-[9px] font-mono font-bold text-accent">
      v{String(num).padStart(2, '0')}
    </span>
  );
}

export function VersionItem({ version, onDownload, busy }) {
  return (
    <div className="group flex items-start gap-3 rounded-lg border border-border-subtle bg-bg-card px-4 py-3 hover:border-border-default transition-all">
      {/* Left: version tag + icon */}
      <div className="flex flex-col items-center gap-2 pt-0.5">
        <VersionTag num={version.version_num} />
      </div>

      {/* Center: info */}
      <div className="min-w-0 flex-1">
        <div className="text-[12px] font-semibold text-text-primary truncate">{version.title}</div>
        {version.description && (
          <p className="mt-1 text-[11px] text-text-secondary leading-relaxed line-clamp-2">
            {version.description}
          </p>
        )}
        <div className="mt-1.5 flex items-center gap-2 text-[10px] text-text-muted">
          <span>{formatDate(version.created_at)}</span>
          {version.file_size > 0 && (
            <>
              <span>·</span>
              <span>{formatSize(version.file_size)}</span>
            </>
          )}
          <span>·</span>
          <span className="font-mono">#{version.tg_message_id}</span>
        </div>
      </div>

      {/* Right: download */}
      <Button
        variant="ghost"
        size="sm"
        disabled={busy}
        onClick={() => onDownload(version)}
        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Download this snapshot"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M6 1v7M3 5l3 3 3-3"/>
          <path d="M1 9v1a1 1 0 001 1h8a1 1 0 001-1V9"/>
        </svg>
        Download
      </Button>
    </div>
  );
}
