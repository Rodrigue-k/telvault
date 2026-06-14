const { TelegramClient, Api } = require('telegram');
const { StringSession } = require('telegram/sessions');
const bigInt = require('big-integer');

function createTelegramService(db, config) {
  let client = null;
  let pendingPhoneCodeHash = null;
  let pendingPhoneNumber = null;
  let qrLogin = null;

  function getCredentials() {
    if (!config.telegram.configured) {
      throw new Error('Telegram app credentials are missing. Add TELEGRAM_API_ID and TELEGRAM_API_HASH to .env.');
    }
    return { apiId: config.telegram.apiId, apiHash: config.telegram.apiHash };
  }

  async function getClient() {
    if (client?.connected) return client;
    const { apiId, apiHash } = getCredentials();
    const session = new StringSession(db.getSetting('telegram_session') || '');
    client = new TelegramClient(session, apiId, apiHash, {
      connectionRetries: 5,
    });
    await client.connect();
    return client;
  }

  async function saveSession(activeClient) {
    db.setSetting('telegram_session', activeClient.session.save());
  }

  function createLoginClient() {
    const { apiId, apiHash } = getCredentials();
    client = new TelegramClient(new StringSession(''), apiId, apiHash, {
      connectionRetries: 5,
    });
    return client;
  }

  function qrUrlFromToken(token) {
    return `tg://login?token=${token.toString('base64url')}`;
  }

  function serializeChannel(channel) {
    return `${channel.id.toString()}:${channel.accessHash?.toString() || ''}`;
  }

  function resolveChannel(channelId) {
    const [id, accessHash] = String(channelId).split(':');
    if (accessHash) {
      return new Api.InputPeerChannel({
        channelId: bigInt(id),
        accessHash: bigInt(accessHash),
      });
    }
    return channelId;
  }

  return {
    async hasSession() {
      try {
        if (!db.getSetting('telegram_session')) return false;
        const active = await getClient();
        return await active.isUserAuthorized();
      } catch {
        return false;
      }
    },

    getConfigStatus() {
      return { configured: config.telegram.configured };
    },

    async startQrLogin() {
      const credentials = getCredentials();
      if (qrLogin?.promise) {
        if (qrLogin.status === 'error') {
          qrLogin = null;
        } else {
          return qrLogin.snapshot;
        }
      }

      const active = createLoginClient();
      await active.connect();

      qrLogin = {
        status: 'pending',
        url: null,
        expiresAt: null,
        error: null,
        promise: null,
        snapshot: null,
      };

      qrLogin.promise = active
        .signInUserWithQrCode(credentials, {
          qrCode: async (code) => {
            qrLogin.url = qrUrlFromToken(code.token);
            qrLogin.expiresAt = new Date(code.expires * 1000).toISOString();
            qrLogin.snapshot = {
              status: qrLogin.status,
              url: qrLogin.url,
              expiresAt: qrLogin.expiresAt,
              authenticated: false,
            };
          },
          password: async (hintParam) => {
            qrLogin.status = 'waiting_password';
            qrLogin.snapshot = {
              status: qrLogin.status,
              hint: typeof hintParam === 'string' ? hintParam : hintParam?.hint || '',
              authenticated: false,
            };
            return new Promise((resolve, reject) => {
              qrLogin.resolvePassword = resolve;
              qrLogin.rejectPassword = reject;
            });
          },
          onError: async (error) => {
            qrLogin.status = 'error';
            qrLogin.error = error.message;
            return true;
          },
        })
        .then(async () => {
          await saveSession(active);
          qrLogin.status = 'authenticated';
          qrLogin.snapshot = { status: 'authenticated', authenticated: true };
          return qrLogin.snapshot;
        })
        .catch((error) => {
          qrLogin.status = 'error';
          qrLogin.error = error.message;
          qrLogin.snapshot = {
            status: 'error',
            authenticated: false,
            error: error.message,
          };
          return qrLogin.snapshot;
        });

      const startedAt = Date.now();
      while (!qrLogin.url && qrLogin.status === 'pending' && Date.now() - startedAt < 5000) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      if (!qrLogin.url) throw new Error(qrLogin.error || 'Unable to generate Telegram QR code.');
      return qrLogin.snapshot;
    },

    async getQrLoginStatus() {
      if (!qrLogin) return { status: 'idle', authenticated: false };
      if (qrLogin.status === 'authenticated' || qrLogin.status === 'error') {
        return qrLogin.snapshot;
      }
      return qrLogin.snapshot || { status: qrLogin.status, authenticated: false };
    },

    async cancelQrLogin() {
      if (qrLogin?.status === 'pending' && client) {
        await client.disconnect().catch(() => {});
      }
      if (qrLogin?.rejectPassword) {
        qrLogin.rejectPassword(new Error('QR login cancelled'));
      }
      qrLogin = null;
      return { ok: true };
    },

    async submitQrPassword(password) {
      if (qrLogin?.status === 'waiting_password' && qrLogin?.resolvePassword) {
        qrLogin.resolvePassword(password);
        qrLogin.status = 'pending';
        qrLogin.snapshot = { status: 'pending', authenticated: false };
        return { ok: true };
      }
      throw new Error('Not currently waiting for a QR login password.');
    },

    async sendCode({ phoneNumber }) {
      const credentials = getCredentials();
      if (!phoneNumber) throw new Error('Phone number is required.');
      pendingPhoneNumber = phoneNumber;
      client = createLoginClient();
      await client.connect();
      const result = await client.sendCode(credentials, phoneNumber);
      pendingPhoneCodeHash = result.phoneCodeHash;
      return { ok: true };
    },

    async signIn({ code, password }) {
      if (!client || !pendingPhoneNumber || !pendingPhoneCodeHash) throw new Error('Request a Telegram code first.');
      try {
        await client.invoke(
          new Api.auth.SignIn({
            phoneNumber: pendingPhoneNumber,
            phoneCodeHash: pendingPhoneCodeHash,
            phoneCode: code,
          })
        );
      } catch (error) {
        if (error.errorMessage !== 'SESSION_PASSWORD_NEEDED') throw error;
        if (!password) throw new Error('Two-step verification password is required.');
        const credentials = getCredentials();
        await client.signInWithPassword(credentials, { password: async () => password });
      }
      await saveSession(client);
      pendingPhoneCodeHash = null;
      pendingPhoneNumber = null;
      return { authenticated: true };
    },

    async logout() {
      if (client) {
        try {
          await client.disconnect();
        } catch {
          // Ignore disconnect failures during local logout.
        }
      }
      client = null;
      db.deleteSetting('telegram_session');
    },

    async createPrivateChannel(title) {
      const active = await getClient();
      if (!(await active.isUserAuthorized())) throw new Error('Telegram is not authenticated.');
      const result = await active.invoke(
        new Api.channels.CreateChannel({
          title: `TelVault - ${title}`,
          about: 'Private TelVault project archive',
          megagroup: false,
          broadcast: true,
        })
      );
      const channel = result.chats?.[0];
      if (!channel) throw new Error('Telegram channel creation failed.');
      return { id: serializeChannel(channel), title: channel.title };
    },

    async uploadZip({ channelId, filePath, caption, progressCallback }) {
      const active = await getClient();
      const entity = resolveChannel(channelId);
      return active.sendFile(entity, {
        file: filePath,
        caption,
        forceDocument: true,
        progressCallback,
      });
    },

    async downloadZip({ channelId, messageId, outputPath }) {
      const active = await getClient();
      const entity = resolveChannel(channelId);
      const messages = await active.getMessages(entity, { ids: [messageId] });
      const message = Array.isArray(messages) ? messages[0] : messages;
      if (!message?.media) throw new Error('Telegram message has no downloadable file.');
      await active.downloadMedia(message, { outputFile: outputPath });
      return outputPath;
    },
    
    // --- Cloud Sync ---
    async getSystemSyncChannel() {
      const active = await getClient();
      if (!(await active.isUserAuthorized())) return null;

      for await (const dialog of active.iterDialogs({ limit: 100 })) {
        if (dialog.title === 'TelVault - System Sync' && dialog.isChannel) {
          return serializeChannel(dialog.entity);
        }
      }

      const result = await active.invoke(
        new Api.channels.CreateChannel({
          title: 'TelVault - System Sync',
          about: 'DO NOT DELETE. This channel stores your TelVault configuration and database backups.',
          megagroup: false,
          broadcast: true,
        })
      );
      const channel = result.chats?.[0];
      if (!channel) throw new Error('Could not create System Sync channel.');
      return serializeChannel(channel);
    },

    async uploadDatabaseBackup(filePath) {
      const channelId = await this.getSystemSyncChannel();
      if (!channelId) return null;
      
      const active = await getClient();
      const entity = resolveChannel(channelId);
      
      return active.sendFile(entity, {
        file: filePath,
        caption: `Backup - ${new Date().toISOString()}`,
        forceDocument: true,
      });
    },

    async downloadLatestBackup(destinationPath) {
      const active = await getClient();
      if (!(await active.isUserAuthorized())) return false;

      let channelId;
      for await (const dialog of active.iterDialogs({ limit: 100 })) {
        if (dialog.title === 'TelVault - System Sync' && dialog.isChannel) {
          channelId = serializeChannel(dialog.entity);
          break;
        }
      }
      
      if (!channelId) return false;

      const entity = resolveChannel(channelId);
      const messages = await active.getMessages(entity, { limit: 1 });
      const message = Array.isArray(messages) ? messages[0] : messages;
      
      if (!message?.media || !message?.document) return false;
      
      await active.downloadMedia(message, { outputFile: destinationPath });
      return true;
    }
  };
}

module.exports = { createTelegramService };
