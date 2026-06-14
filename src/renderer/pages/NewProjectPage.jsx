import { useState } from 'react';
import { Button } from '../components/Button';
import { api } from '../services/api.jsx';

function FolderIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <path d="M1 3.5A1.5 1.5 0 012.5 2h2.086a1 1 0 01.707.293L6.5 3.5H11.5A1.5 1.5 0 0113 5v5.5A1.5 1.5 0 0111.5 12h-9A1.5 1.5 0 011 10.5v-7z"/>
    </svg>
  );
}

export function NewProjectPage({ onCreated, onCancel }) {
  const [name, setName] = useState('');
  const [folderPath, setFolderPath] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const selectFolder = async () => {
    const selected = await api.files.selectFolder();
    if (selected) {
      setFolderPath(selected);
      if (!name) {
        setName(selected.split(/[/\\]/).filter(Boolean).pop() || '');
      }
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const project = await api.projects.create({ name, folderPath });
      onCreated(project);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex flex-1 flex-col items-center justify-center overflow-y-auto bg-bg-deep p-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-text-primary">Create a new vault</h1>
          <p className="mt-1.5 text-[12px] text-text-secondary leading-relaxed">
            A private Telegram channel will be created automatically to securely store all your file snapshots.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="space-y-5">
          {/* Vault name */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1.5">
              Vault name
            </label>
            <input
              className="w-full rounded-lg border border-border-subtle bg-bg-card px-3 py-2.5 text-[13px] text-text-primary placeholder-text-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Office Tower – Phase 2"
              required
              autoFocus
            />
          </div>

          {/* Folder path */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1.5">
              Local folder to track
            </label>
            <div className="flex gap-2">
              <div
                className={`flex-1 flex items-center gap-2 rounded-lg border px-3 py-2.5 text-[12px] font-mono cursor-pointer transition-colors ${
                  folderPath
                    ? 'border-border-subtle bg-bg-card text-text-primary'
                    : 'border-dashed border-border-subtle bg-bg-surface text-text-muted hover:border-accent/50'
                }`}
                onClick={selectFolder}
                title="Click to browse"
              >
                <FolderIcon />
                <span className="truncate">
                  {folderPath || 'Click to choose a folder…'}
                </span>
              </div>
              <Button type="button" variant="secondary" size="md" onClick={selectFolder}>
                Browse
              </Button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-status-error/30 bg-status-error/10 px-3 py-2.5 text-[11px] text-status-error">
              {error}
            </div>
          )}

          {/* What will happen note */}
          {name && folderPath && (
            <div className="rounded-lg border border-accent/20 bg-accent/5 px-3 py-2.5 text-[11px] text-text-secondary leading-relaxed">
              A private Telegram channel named <strong className="text-text-primary">TelVault – {name}</strong> will be created, and TelVault will start watching <span className="font-mono text-accent">{folderPath}</span> for changes.
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="flex-1 justify-center"
              disabled={busy || !name.trim() || !folderPath}
            >
              {busy ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border border-white/40 border-t-white" />
                  Creating vault…
                </>
              ) : (
                'Create vault'
              )}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={onCancel}
              disabled={busy}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
