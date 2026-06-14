import { useState } from 'react';
import { Button } from './Button';

export function CommitModal({ open, onClose, onCommit, busy }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  if (!open) return null;

  const submit = async (event) => {
    event.preventDefault();
    await onCommit({ title, description });
    setTitle('');
    setDescription('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <form onSubmit={submit} className="w-full max-w-lg rounded-lg border border-line bg-white shadow-xl">
        <div className="border-b border-line px-5 py-4">
          <h2 className="text-base font-semibold text-ink">Commit project</h2>
          <p className="mt-1 text-sm text-slate-500">A complete ZIP snapshot will be uploaded to Telegram.</p>
        </div>
        <div className="space-y-4 px-5 py-4">
          <label className="block">
            <span className="text-sm font-medium text-ink">Title</span>
            <input
              className="mt-1 h-10 w-full rounded-md border border-line px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-blue-100"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              autoFocus
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink">Description</span>
            <textarea
              className="mt-1 min-h-28 w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-blue-100"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-5 py-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy || !title.trim()}>
            {busy ? 'Uploading...' : 'Commit'}
          </Button>
        </div>
      </form>
    </div>
  );
}
