export function ProjectCard({ project, status, onOpen }) {
  const dirty = status?.status === 'dirty';
  return (
    <button
      onClick={() => onOpen(project.id)}
      className="w-full rounded-lg border border-line bg-white p-4 text-left shadow-sm transition hover:border-accent hover:shadow"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-ink">{project.name}</h3>
          <p className="mt-1 truncate text-sm text-slate-500">{project.folder_path}</p>
        </div>
        <span className={`rounded-full px-2 py-1 text-xs ${dirty ? 'bg-green-100 text-green-700' : 'bg-panel text-slate-600'}`}>
          {dirty ? 'Changed' : project.last_commit_at ? 'Clean' : 'New'}
        </span>
      </div>
      <div className="mt-4 text-xs text-slate-500">
        {status?.message || `Last commit: ${project.last_commit_at ? new Date(project.last_commit_at).toLocaleString() : 'Never'}`}
      </div>
    </button>
  );
}
