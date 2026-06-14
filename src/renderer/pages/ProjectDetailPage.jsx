import { useEffect, useRef, useState } from 'react';
import { Button } from '../components/Button';
import { VersionItem } from '../components/VersionItem';
import { api } from '../services/api.jsx';

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatRelativeTime(mtimeMs) {
  const diff = Date.now() - mtimeMs;
  const secs = Math.floor(diff / 1000);
  if (secs < 10) return 'just now';
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(mtimeMs).toLocaleDateString();
}

function getFileExt(relativePath) {
  const ext = relativePath.split('.').pop()?.toLowerCase() || '';
  return ext ? `.${ext}` : '';
}

function getFileName(relativePath) {
  return relativePath.split('/').pop() || relativePath;
}

function getFileDir(relativePath) {
  const parts = relativePath.split('/');
  return parts.length > 1 ? parts.slice(0, -1).join('/') + '/' : '';
}

// ── File status badge ──────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  if (status === 'new') {
    return (
      <span className="text-[9px] font-bold uppercase tracking-wider text-status-new">
        N
      </span>
    );
  }
  if (status === 'modified') {
    return (
      <span className="text-[9px] font-bold uppercase tracking-wider text-status-modified">
        M
      </span>
    );
  }
  return null;
}

// ── File row in the changes panel ──────────────────────────────────────────────

function FileRow({ file, checked, onToggle, showRelativeTimes }) {
  return (
    <label
      className={`flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 hover:bg-bg-hover group transition-colors ${
        checked ? 'bg-accent/5' : ''
      }`}
    >
      <input
        type="checkbox"
        className="tv-checkbox"
        checked={checked}
        onChange={() => onToggle(file.relativePath)}
      />
      <StatusBadge status={file.status} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1 min-w-0">
          <span className="text-text-muted text-[10px] font-mono truncate">{getFileDir(file.relativePath)}</span>
          <span className="text-text-primary text-[11px] font-mono font-medium truncate">{getFileName(file.relativePath)}</span>
        </div>
        <div className="text-[9px] text-text-muted mt-0.5">
          {formatSize(file.size)} · {showRelativeTimes ? formatRelativeTime(file.mtime) : new Date(file.mtime).toLocaleTimeString()}
        </div>
      </div>
    </label>
  );
}

// ── Onboarding ──────────────────────────────────────────────────────────────────

function OnboardingScreen({ onNewProject }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-bg-deep p-8 text-center select-none">
      <div className="max-w-xs">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 border border-accent/20">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect x="4" y="4" width="24" height="24" rx="4" stroke="#2f81f7" strokeWidth="2"/>
            <circle cx="16" cy="16" r="5" stroke="#2f81f7" strokeWidth="2"/>
            <line x1="21" y1="16" x2="26" y2="16" stroke="#2f81f7" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="10.5" cy="10.5" r="1" fill="#2f81f7"/>
            <circle cx="21.5" cy="10.5" r="1" fill="#2f81f7"/>
            <circle cx="10.5" cy="21.5" r="1" fill="#2f81f7"/>
            <circle cx="21.5" cy="21.5" r="1" fill="#2f81f7"/>
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-text-primary">No vault selected</h2>
        <p className="mt-2 text-[12px] text-text-secondary leading-relaxed">
          Create your first vault to start tracking and archiving your professional files on Telegram.
        </p>
        <Button
          onClick={onNewProject}
          variant="primary"
          size="md"
          className="mt-6 w-full justify-center"
        >
          Create your first vault
        </Button>
      </div>
    </main>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export function ProjectDetailPage({ project, watchStatus, onRefreshProject, onNewProject }) {
  const [versions, setVersions] = useState([]);
  const [allFiles, setAllFiles] = useState([]);
  const [selectedPaths, setSelectedPaths] = useState(new Set());
  const [archiveTitle, setArchiveTitle] = useState('');
  const [archiveDescription, setArchiveDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [, setTick] = useState(0);

  const prevProjectId = useRef(null);

  // Relative time refresh
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 15000);
    return () => clearInterval(t);
  }, []);

  // Listen to upload progress
  useEffect(() => {
    return api.versions.onUploadProgress((data) => {
      if (project && data.projectId === project.id) {
        setUploadProgress(data.progress);
      }
    });
  }, [project?.id]);

  const loadVersions = async () => {
    if (!project) return;
    setVersions(await api.versions.list(project.id));
  };

  const loadDiff = async () => {
    if (!project) return;
    try {
      const files = await api.files.diff(project.id);
      setAllFiles(files);
      // Auto-select all changed files
      const changedPaths = new Set(
        files.filter((f) => f.status !== 'unchanged').map((f) => f.relativePath)
      );
      setSelectedPaths(changedPaths);
    } catch {
      setAllFiles([]);
      setSelectedPaths(new Set());
    }
  };

  useEffect(() => {
    if (!project) return;
    if (prevProjectId.current !== project.id) {
      setError('');
      setNotice('');
      setAllFiles([]);
      setSelectedPaths(new Set());
      setArchiveTitle('');
      setArchiveDescription('');
      prevProjectId.current = project.id;
    }
    loadVersions();
    loadDiff();
  }, [project?.id]);

  const prevStatus = useRef(null);
  useEffect(() => {
    if (!project) return;
    if (watchStatus?.status === 'dirty' && prevStatus.current !== 'dirty') {
      loadDiff();
    }
    prevStatus.current = watchStatus?.status;
  }, [watchStatus?.status]);

  const changedFiles = allFiles.filter((f) => f.status !== 'unchanged');
  const unchangedCount = allFiles.filter((f) => f.status === 'unchanged').length;

  // Select all / deselect all
  const allChangedSelected =
    changedFiles.length > 0 && changedFiles.every((f) => selectedPaths.has(f.relativePath));
  const someSelected = changedFiles.some((f) => selectedPaths.has(f.relativePath));

  const toggleSelectAll = () => {
    if (allChangedSelected) {
      setSelectedPaths(new Set());
    } else {
      setSelectedPaths(new Set(changedFiles.map((f) => f.relativePath)));
    }
  };

  const toggleFile = (relativePath) => {
    setSelectedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(relativePath)) next.delete(relativePath);
      else next.add(relativePath);
      return next;
    });
  };

  const archive = async (e) => {
    e.preventDefault();
    if (!archiveTitle.trim()) return;
    setBusy(true);
    setUploadProgress(0);
    setError('');
    setNotice('');
    try {
      const selectedFiles = [...selectedPaths];
      await api.versions.commit({
        projectId: project.id,
        title: archiveTitle.trim(),
        description: archiveDescription,
        selectedFiles: selectedFiles.length > 0 ? selectedFiles : undefined,
      });
      setArchiveTitle('');
      setArchiveDescription('');
      await loadVersions();
      await onRefreshProject(project.id);
      await loadDiff();
      setNotice(`Snapshot archived successfully on Telegram ✓`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      setUploadProgress(null);
    }
  };

  const download = async (version) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await api.versions.download({ projectId: project.id, versionId: version.id });
      if (result?.outputPath) setNotice(`Downloaded to: ${result.outputPath}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!project) {
    return <OnboardingScreen onNewProject={onNewProject} />;
  }

  const canArchive = watchStatus?.status === 'dirty' && selectedPaths.size > 0;

  return (
    <div className="flex h-full flex-1 overflow-hidden">
      {/* ── Left column: Changed Files ── */}
      <div className="flex w-72 shrink-0 flex-col border-r border-border-subtle bg-bg-surface overflow-hidden">
        {/* Panel header */}
        <div className="border-b border-border-subtle px-4 py-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
              Updated Files
              {changedFiles.length > 0 && (
                <span className="ml-2 rounded-full bg-status-modified/20 px-1.5 py-0.5 text-[9px] font-bold text-status-modified">
                  {changedFiles.length}
                </span>
              )}
            </h2>
          </div>
        </div>

        {/* Select all header */}
        {changedFiles.length > 0 && (
          <div className="border-b border-border-subtle/50 px-3 py-2 flex items-center gap-2.5">
            <input
              type="checkbox"
              className="tv-checkbox"
              checked={allChangedSelected}
              ref={(el) => { if (el) el.indeterminate = someSelected && !allChangedSelected; }}
              onChange={toggleSelectAll}
            />
            <span className="text-[10px] text-text-secondary font-medium">
              {selectedPaths.size} of {changedFiles.length} file{changedFiles.length !== 1 ? 's' : ''} selected
            </span>
          </div>
        )}

        {/* File list */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {watchStatus?.status === 'scanning' ? (
            <div className="flex items-center gap-2 px-4 py-6 text-[11px] text-text-muted">
              <span className="h-3 w-3 animate-spin rounded-full border border-text-muted border-t-transparent" />
              Scanning workspace…
            </div>
          ) : watchStatus?.status === 'missing' || watchStatus?.status === 'error' ? (
            <div className="px-4 py-4 text-[11px] text-status-error">{watchStatus.message}</div>
          ) : changedFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-text-muted mb-3">
                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <div className="text-[11px] font-medium text-text-secondary">All up to date</div>
              <div className="mt-1 text-[10px] text-text-muted">No changes since last snapshot.</div>
            </div>
          ) : (
            changedFiles.map((file) => (
              <FileRow
                key={file.relativePath}
                file={file}
                checked={selectedPaths.has(file.relativePath)}
                onToggle={toggleFile}
                showRelativeTimes
              />
            ))
          )}
          {unchangedCount > 0 && changedFiles.length > 0 && (
            <div className="px-4 py-2 text-[9px] text-text-muted text-center border-t border-border-subtle/50">
              {unchangedCount} unchanged file{unchangedCount !== 1 ? 's' : ''} not shown
            </div>
          )}
        </div>

        {/* Archive form (inline, at bottom) */}
        <div className="border-t border-border-subtle bg-bg-deep">
          {error && (
            <div className="px-3 pt-3 text-[10px] text-status-error font-medium">{error}</div>
          )}
          {notice && (
            <div className="px-3 pt-3 text-[10px] text-status-new font-medium">{notice}</div>
          )}
          <form onSubmit={archive} className="p-3 space-y-2">
            <input
              className="w-full rounded-md border border-border-subtle bg-bg-card px-3 py-2 text-[11px] text-text-primary placeholder-text-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent/40 transition-colors"
              placeholder="Snapshot title…"
              value={archiveTitle}
              onChange={(e) => setArchiveTitle(e.target.value)}
              disabled={busy || !canArchive}
            />
            <textarea
              className="w-full resize-none rounded-md border border-border-subtle bg-bg-card px-3 py-2 text-[11px] text-text-primary placeholder-text-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent/40 transition-colors"
              placeholder="Description (optional)…"
              rows={2}
              value={archiveDescription}
              onChange={(e) => setArchiveDescription(e.target.value)}
              disabled={busy || !canArchive}
            />
            <Button
              type="submit"
              variant="success"
              size="sm"
              className="relative w-full justify-center font-semibold overflow-hidden"
              disabled={busy || !canArchive || !archiveTitle.trim()}
            >
              {busy && uploadProgress !== null && (
                <div 
                  className="absolute inset-y-0 left-0 bg-black/20 transition-all duration-300 ease-out" 
                  style={{ width: `${uploadProgress}%` }} 
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                {busy ? (
                  <>
                    <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                    {uploadProgress !== null ? `Uploading... ${uploadProgress}%` : 'Archiving…'}
                  </>
                ) : (
                  `Archive ${selectedPaths.size > 0 ? selectedPaths.size + ' file' + (selectedPaths.size !== 1 ? 's' : '') : ''}`
                )}
              </span>
            </Button>
          </form>
        </div>
      </div>

      {/* ── Right column: Project info + Timeline ── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-bg-deep">
        {/* Project header */}
        <div className="border-b border-border-subtle bg-bg-surface px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h1 className="text-[15px] font-semibold text-text-primary truncate">{project.name}</h1>
              <p className="mt-0.5 text-[10px] font-mono text-text-muted truncate">{project.folder_path}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-4">
              {watchStatus && (
                <span
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium border ${
                    watchStatus.status === 'dirty'
                      ? 'bg-status-modified/10 border-status-modified/30 text-status-modified'
                      : watchStatus.status === 'missing' || watchStatus.status === 'error'
                      ? 'bg-status-error/10 border-status-error/30 text-status-error'
                      : 'bg-status-clean/10 border-status-clean/30 text-status-clean'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      watchStatus.status === 'dirty'
                        ? 'bg-status-modified'
                        : watchStatus.status === 'missing' || watchStatus.status === 'error'
                        ? 'bg-status-error'
                        : 'bg-status-clean'
                    }`}
                  />
                  {watchStatus.status === 'dirty'
                    ? 'Updates pending'
                    : watchStatus.status === 'missing'
                    ? 'Folder missing'
                    : watchStatus.status === 'error'
                    ? 'Error'
                    : 'Synchronized'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Timeline / Snapshot history */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {/* Timeline header */}
          <div className="sticky top-0 z-10 border-b border-border-subtle bg-bg-surface/80 px-6 py-3 backdrop-blur-sm">
            <h2 className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
              Snapshot Timeline
              {versions.length > 0 && (
                <span className="ml-2 text-text-muted font-normal normal-case tracking-normal">
                  — {versions.length} snapshot{versions.length !== 1 ? 's' : ''}
                </span>
              )}
            </h2>
          </div>

          {versions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-text-muted mb-4">
                <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3"/>
                <path d="M20 12v8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div className="text-[12px] font-medium text-text-secondary">No snapshots yet</div>
              <div className="mt-1.5 text-[11px] text-text-muted leading-relaxed max-w-xs">
                Select files on the left and create your first archive to build your vault's timeline.
              </div>
            </div>
          ) : (
            <div className="px-6 py-4 space-y-2">
              {versions.map((version) => (
                <VersionItem
                  key={version.id}
                  version={version}
                  onDownload={download}
                  busy={busy}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
