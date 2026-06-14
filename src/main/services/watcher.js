const chokidar = require('chokidar');
const { ensureFolder, hasChanges } = require('./files');

function createWatcherService({ db, notify }) {
  const watchers = new Map();
  const states = new Map();
  const timers = new Map();

  function setState(projectId, patch) {
    const previous = states.get(projectId) || {};
    const next = {
      projectId,
      status: 'clean',
      changed: false,
      fileCount: 0,
      message: '',
      ...previous,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    states.set(projectId, next);
    notify('projects:watchStatusChanged', next);
    return next;
  }

  async function evaluate(projectId) {
    const project = db.getProject(Number(projectId));
    if (!project) return null;

    setState(project.id, { status: 'scanning', message: 'Scanning folder...' });
    try {
      await ensureFolder(project.folder_path);
      const fileStates = db.getFileStates(project.id);
      const { changed, fileCount } = await hasChanges(project.folder_path, fileStates);
      
      return setState(project.id, {
        status: changed ? 'dirty' : 'clean',
        changed,
        fileCount,
        message: changed ? 'Updates detected.' : 'Everything is up to date.',
      });
    } catch (error) {
      return setState(project.id, {
        status: 'missing',
        changed: false,
        message: error.message || 'Folder is unavailable.',
      });
    }
  }

  function schedule(projectId, delay = 800) {
    clearTimeout(timers.get(projectId));
    timers.set(
      projectId,
      setTimeout(() => {
        timers.delete(projectId);
        evaluate(projectId);
      }, delay)
    );
  }

  function watchProject(project) {
    if (!project || watchers.has(project.id)) return;

    const watcher = chokidar.watch(project.folder_path, {
      ignoreInitial: true,
      usePolling: false,
      awaitWriteFinish: {
        stabilityThreshold: 1500,
        pollInterval: 200,
      },
      ignored: [
        /(^|[/\\])\.git([/\\]|$)/,
        /(^|[/\\])node_modules([/\\]|$)/,
        /(^|[/\\])\.DS_Store$/,
        /~$/,
        /\.tmp$/,
        /\.lock$/,
      ],
    });

    watcher
      .on('add', () => schedule(project.id, 500))
      .on('change', () => schedule(project.id, 800))
      .on('unlink', () => schedule(project.id, 500))
      .on('addDir', () => schedule(project.id, 500))
      .on('unlinkDir', () => schedule(project.id, 500))
      .on('error', (error) => {
        setState(project.id, {
          status: 'error',
          changed: false,
          message: error.message || 'Folder watcher failed.',
        });
      });

    watchers.set(project.id, watcher);
    evaluate(project.id);
  }

  async function unwatchProject(projectId) {
    clearTimeout(timers.get(projectId));
    timers.delete(projectId);
    const watcher = watchers.get(projectId);
    if (watcher) await watcher.close();
    watchers.delete(projectId);
    states.delete(projectId);
  }

  function watchAll() {
    db.listProjects().forEach((project) => watchProject(project));
  }

  async function closeAll() {
    for (const timer of timers.values()) clearTimeout(timer);
    timers.clear();
    await Promise.all([...watchers.values()].map((w) => w.close()));
    watchers.clear();
    states.clear();
  }

  return {
    watchProject,
    unwatchProject,
    watchAll,
    evaluate,
    closeAll,
    getStatus(projectId) {
      return states.get(Number(projectId)) || null;
    },
    getAllStatuses() {
      return [...states.values()];
    },
  };
}

module.exports = { createWatcherService };
