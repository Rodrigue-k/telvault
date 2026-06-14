import { Button } from '../components/Button';
import { ProjectCard } from '../components/ProjectCard';

export function ProjectsPage({ projects, watchStatuses, onOpenProject, onNewProject }) {
  return (
    <main className="flex-1 overflow-y-auto bg-white">
      <header className="border-b border-line px-8 py-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-ink">Projects</h1>
            <p className="mt-1 text-sm text-slate-600">Version local folders into private Telegram channels.</p>
          </div>
          <Button onClick={onNewProject}>New project</Button>
        </div>
      </header>

      <div className="px-8 py-6">
        {projects.length ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} status={watchStatuses[project.id]} onOpen={onOpenProject} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-line bg-panel px-8 py-12 text-center">
            <h2 className="text-lg font-semibold text-ink">No projects yet</h2>
            <p className="mt-2 text-sm text-slate-600">Create a project to bind a local folder to a private Telegram archive channel.</p>
            <Button className="mt-5" onClick={onNewProject}>Create project</Button>
          </div>
        )}
      </div>
    </main>
  );
}
