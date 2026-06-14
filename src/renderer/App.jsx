import { useEffect, useMemo, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { TitleBar } from './components/TopMenuBar';
import { AuthPage } from './pages/AuthPage';
import { NewProjectPage } from './pages/NewProjectPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import OnboardingPage from './pages/OnboardingPage';
import { api } from './services/api.jsx';

export default function App() {
  const [booting, setBooting] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [telegramConfigured, setTelegramConfigured] = useState(true);
  const [projects, setProjects] = useState([]);
  const [watchStatuses, setWatchStatuses] = useState({});
  const [view, setView] = useState('detail');
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [error, setError] = useState('');

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) || null,
    [projects, selectedProjectId]
  );

  const loadProjects = async () => {
    const rows = await api.projects.list();
    setProjects(rows);
    if (!selectedProjectId && rows.length) setSelectedProjectId(rows[0].id);
    return rows;
  };

  const [syncStatus, setSyncStatus] = useState(null);

  const boot = async () => {
    setBooting(true);
    setError('');
    try {
      // Check for first-run: no credentials stored yet
      const hasCredentials = await api.onboarding.hasCredentials();
      if (!hasCredentials) {
        setNeedsOnboarding(true);
        return;
      }
      setNeedsOnboarding(false);
      const status = await api.auth.status();
      setTelegramConfigured(status.telegramConfigured);
      setAuthenticated(status.authenticated);
      if (status.authenticated) await loadProjects();
    } catch (err) {
      setError(err.message);
    } finally {
      setBooting(false);
    }
  };

  useEffect(() => {
    return api.sync.onStatus((payload) => {
      setSyncStatus(payload.message);
      if (payload.message === null) {
        // Refresh projects after sync completes
        loadProjects();
      }
    });
  }, []);

  useEffect(() => { boot(); }, []);

  useEffect(() => {
    if (!authenticated) return undefined;
    let active = true;
    api.projects.watchStatuses().then((statuses) => {
      if (!active) return;
      setWatchStatuses(Object.fromEntries(statuses.map((s) => [s.projectId, s])));
    });
    const unsubscribe = api.projects.onWatchStatusChanged((status) => {
      setWatchStatuses((prev) => ({ ...prev, [status.projectId]: status }));
    });
    return () => { active = false; unsubscribe(); };
  }, [authenticated]);

  const refreshProject = async (projectId) => {
    const rows = await loadProjects();
    if (projectId) setSelectedProjectId(projectId);
    return rows;
  };

  const logout = async () => {
    await api.auth.logout();
    setAuthenticated(false);
    setProjects([]);
    setWatchStatuses({});
    setSelectedProjectId(null);
    setView('detail');
  };

  if (booting) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-deep text-[12px] text-text-muted">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-border-subtle border-t-accent mr-3" />
        Loading TelVault…
      </div>
    );
  }

  if (needsOnboarding) {
    return (
      <OnboardingPage
        onComplete={async () => {
          setNeedsOnboarding(false);
          await boot();
        }}
      />
    );
  }

  if (!authenticated) {
    return (
      <AuthPage
        telegramConfigured={telegramConfigured}
        onAuthenticated={async () => {
          setAuthenticated(true);
          await loadProjects();
        }}
      />
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg-deep text-text-primary">
      <TitleBar
        onNewProject={() => setView('new')}
        onLogout={logout}
        projectName={selectedProject?.name}
      />
      {syncStatus && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-bg-deep/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-xl border border-border-subtle bg-bg-surface p-8 shadow-xl">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            <p className="text-[13px] font-medium text-text-primary">{syncStatus}</p>
          </div>
        </div>
      )}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          projects={projects}
          watchStatuses={watchStatuses}
          selectedProjectId={selectedProjectId}
          onSelectProject={(id) => {
            setSelectedProjectId(id);
            setView('detail');
          }}
          onNewProject={() => setView('new')}
          onLogout={logout}
        />

        {error ? (
          <main className="flex flex-1 items-center justify-center bg-bg-deep px-8">
            <div className="rounded-lg border border-status-error/30 bg-status-error/10 px-4 py-3 text-[12px] text-status-error">
              {error}
            </div>
          </main>
        ) : view === 'new' ? (
          <NewProjectPage
            onCancel={() => setView('detail')}
            onCreated={async (project) => {
              await refreshProject(project.id);
              setView('detail');
            }}
          />
        ) : (
          <ProjectDetailPage
            project={selectedProject}
            watchStatus={selectedProject ? watchStatuses[selectedProject.id] : null}
            onRefreshProject={refreshProject}
            onNewProject={() => setView('new')}
          />
        )}
      </div>
    </div>
  );
}
