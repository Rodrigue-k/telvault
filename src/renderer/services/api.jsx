const bridge = window.telvault;

function ensureBridge() {
  if (!bridge) throw new Error('TelVault preload bridge is unavailable.');
  return bridge;
}

export const api = {
  auth: {
    status: () => ensureBridge().auth.status(),
    startQrLogin: () => ensureBridge().auth.startQrLogin(),
    getQrLoginStatus: () => ensureBridge().auth.getQrLoginStatus(),
    cancelQrLogin: () => ensureBridge().auth.cancelQrLogin(),
    submitQrPassword: (payload) => ensureBridge().auth.submitQrPassword(payload),
    sendCode: (payload) => ensureBridge().auth.sendCode(payload),
    signIn: (payload) => ensureBridge().auth.signIn(payload),
    logout: () => ensureBridge().auth.logout(),
  },
  files: {
    selectFolder: () => ensureBridge().files.selectFolder(),
    diff: (projectId) => ensureBridge().files.diff(projectId),
  },
  projects: {
    list: () => ensureBridge().projects.list(),
    get: (id) => ensureBridge().projects.get(id),
    create: (payload) => ensureBridge().projects.create(payload),
    watchStatuses: () => ensureBridge().projects.watchStatuses(),
    watchStatus: (projectId) => ensureBridge().projects.watchStatus(projectId),
    onWatchStatusChanged: (callback) => ensureBridge().projects.onWatchStatusChanged(callback),
  },
  versions: {
    list: (projectId) => ensureBridge().versions.list(projectId),
    commit: (payload) => ensureBridge().versions.commit(payload),
    download: (payload) => ensureBridge().versions.download(payload),
    onUploadProgress: (callback) => ensureBridge().versions.onUploadProgress(callback),
  },
  sync: {
    onStatus: (callback) => ensureBridge().sync.onStatus(callback),
  }
};
