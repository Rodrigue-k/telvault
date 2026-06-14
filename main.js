const path = require('path');
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { loadConfig } = require('./src/main/services/config');
const { createDatabase } = require('./src/main/services/database');
const { createTelegramService } = require('./src/main/services/telegram');
const { createWatcherService } = require('./src/main/services/watcher');
const { zipFolder, diffFolder, ensureFolder } = require('./src/main/services/files');

let mainWindow;
let db;
let telegram;
let watcher;
let config;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1000,
    minHeight: 640,
    title: 'TelVault',
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0d1117',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

function registerIpc() {
  // Window controls (frameless)
  ipcMain.handle('win:minimize', () => mainWindow?.minimize());
  ipcMain.handle('win:maximize', () => {
    if (mainWindow?.isMaximized()) mainWindow.unmaximize();
    else mainWindow?.maximize();
  });
  ipcMain.handle('win:close', () => mainWindow?.close());
  ipcMain.handle('win:isMaximized', () => mainWindow?.isMaximized() ?? false);

  // Auth
  ipcMain.handle('auth:status', async () => {
    const authenticated = await telegram.hasSession();
    return { authenticated, telegramConfigured: telegram.getConfigStatus().configured };
  });

  ipcMain.handle('auth:startQrLogin', async () => telegram.startQrLogin());
  ipcMain.handle('auth:getQrLoginStatus', async () => telegram.getQrLoginStatus());
  ipcMain.handle('auth:cancelQrLogin', async () => telegram.cancelQrLogin());
  ipcMain.handle('auth:submitQrPassword', async (_event, payload) => telegram.submitQrPassword(payload.password));
  ipcMain.handle('auth:sendCode', async (_event, payload) => telegram.sendCode(payload));
  ipcMain.handle('auth:signIn', async (_event, payload) => telegram.signIn(payload));
  ipcMain.handle('auth:logout', async () => {
    await telegram.logout();
    return { ok: true };
  });

  // Files
  ipcMain.handle('files:selectFolder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Select a project folder',
      properties: ['openDirectory'],
    });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle('files:diff', async (_event, projectId) => {
    const project = db.getProject(Number(projectId));
    if (!project) throw new Error('Vault not found.');
    const fileStates = db.getFileStates(project.id);
    return diffFolder(project.folder_path, fileStates);
  });

  // Projects / Vaults
  ipcMain.handle('projects:list', () => db.listProjects());

  ipcMain.handle('projects:create', async (_event, payload) => {
    if (!payload?.name?.trim()) throw new Error('Vault name is required.');
    if (!payload?.folderPath) throw new Error('Vault folder is required.');
    await ensureFolder(payload.folderPath);
    const channel = await telegram.createPrivateChannel(payload.name.trim());
    const project = db.createProject({
      name: payload.name.trim(),
      folderPath: payload.folderPath,
      tgChannelId: String(channel.id),
    });
    watcher.watchProject(project);
    return project;
  });

  ipcMain.handle('projects:get', (_event, id) => db.getProject(Number(id)));
  ipcMain.handle('projects:watchStatuses', () => watcher.getAllStatuses());
  ipcMain.handle('projects:watchStatus', (_event, projectId) => watcher.getStatus(Number(projectId)));

  // Versions / Snapshots
  ipcMain.handle('versions:list', (_event, projectId) => db.listVersions(Number(projectId)));

  ipcMain.handle('versions:commit', async (_event, payload) => {
    const project = db.getProject(Number(payload.projectId));
    if (!project) throw new Error('Vault not found.');
    if (!payload?.title?.trim()) throw new Error('Snapshot title is required.');

    await ensureFolder(project.folder_path);
    const fileStates = db.getFileStates(project.id);
    const diff = await diffFolder(project.folder_path, fileStates);
    const changedFiles = diff.filter((f) => f.status !== 'unchanged');

    if (changedFiles.length === 0) throw new Error('No updates detected since the last snapshot.');

    const tempDir = path.join(app.getPath('temp'), 'telvault');
    const versionNum = db.nextVersionNumber(project.id);
    const safeName = project.name.replace(/[^\w.-]+/g, '-').slice(0, 48) || 'vault';
    const zipPath = path.join(tempDir, `${safeName}-v${versionNum}-${Date.now()}.zip`);

    // Optional selective file archiving
    const selectedFiles = Array.isArray(payload.selectedFiles) && payload.selectedFiles.length > 0
      ? payload.selectedFiles
      : null;

    const zipInfo = await zipFolder(project.folder_path, zipPath, selectedFiles);
    try {
      const message = await telegram.uploadZip({
        channelId: project.tg_channel_id,
        filePath: zipPath,
        caption: `${payload.title.trim()}\n\n${payload.description || ''}`.trim(),
        progressCallback: (progress) => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('versions:uploadProgress', {
              projectId: project.id,
              progress: Math.round(progress * 100),
            });
          }
        },
      });

      const version = db.createVersion({
        projectId: project.id,
        versionNum,
        title: payload.title.trim(),
        description: payload.description || '',
        tgMessageId: String(message.id),
        fileSize: zipInfo.size,
      });

      // Update the index!
      const filesToUpdate = selectedFiles
        ? changedFiles.filter((f) => selectedFiles.includes(f.relativePath))
        : changedFiles;

      db.updateFileStates(
        project.id,
        filesToUpdate.map((f) => ({
          relativePath: f.relativePath,
          mtime: f.mtime,
          size: f.size,
        }))
      );

      await watcher.evaluate(project.id);
      return version;
    } finally {
      await zipInfo.cleanup();
    }
  });

  ipcMain.handle('versions:download', async (_event, payload) => {
    const project = db.getProject(Number(payload.projectId));
    const version = db.getVersion(Number(payload.versionId));
    if (!project || !version) throw new Error('Snapshot not found.');

    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Choose download destination',
      properties: ['openDirectory', 'createDirectory'],
    });
    if (result.canceled) return null;

    const outputPath = path.join(
      result.filePaths[0],
      `${project.name.replace(/[^\w.-]+/g, '-')}-v${version.version_num}.zip`
    );
    await telegram.downloadZip({
      channelId: project.tg_channel_id,
      messageId: Number(version.tg_message_id),
      outputPath,
    });
    return { outputPath };
  });
}

app.whenReady().then(() => {
  config = loadConfig(__dirname);
  db = createDatabase(app.getPath('userData'));
  telegram = createTelegramService(db, config);
  watcher = createWatcherService({
    db,
    notify: (channel, payload) => {
      if (!mainWindow?.isDestroyed()) mainWindow.webContents.send(channel, payload);
    },
  });
  registerIpc();
  createWindow();
  watcher.watchAll();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', async (event) => {
  if (!watcher) return;
  event.preventDefault();
  const currentWatcher = watcher;
  watcher = null;
  await currentWatcher.closeAll();
  app.quit();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
