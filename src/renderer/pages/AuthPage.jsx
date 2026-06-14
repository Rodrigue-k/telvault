import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '../components/Button';
import { api } from '../services/api.jsx';

// TelVault Logo
function Logo() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="12" fill="#2f81f7"/>
      <rect x="10" y="10" width="28" height="28" rx="5" stroke="white" strokeWidth="2.5" fill="none"/>
      <circle cx="24" cy="24" r="6" stroke="white" strokeWidth="2.5" fill="none"/>
      <line x1="30" y1="24" x2="35" y2="24" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
      <rect x="12" y="13" width="3" height="3" rx="1" fill="white" opacity="0.6"/>
      <rect x="33" y="13" width="3" height="3" rx="1" fill="white" opacity="0.6"/>
      <rect x="12" y="32" width="3" height="3" rx="1" fill="white" opacity="0.6"/>
      <rect x="33" y="32" width="3" height="3" rx="1" fill="white" opacity="0.6"/>
    </svg>
  );
}

export function AuthPage({ onAuthenticated, telegramConfigured }) {
  const [mode, setMode] = useState('qr');
  const [step, setStep] = useState('phone');
  const [form, setForm] = useState({ phoneNumber: '', code: '', password: '' });
  const [qr, setQr] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const qrPollRef = useRef(null);

  const stopQrPolling = () => {
    if (qrPollRef.current) window.clearInterval(qrPollRef.current);
    qrPollRef.current = null;
  };

  const update = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const startQr = async () => {
    setBusy(true);
    setError('');
    setQr(null);
    try {
      stopQrPolling();
      const started = await api.auth.startQrLogin();
      setQr(started);
      qrPollRef.current = window.setInterval(async () => {
        try {
          const status = await api.auth.getQrLoginStatus();
          setQr(status);
          if (status.authenticated) {
            stopQrPolling();
            onAuthenticated();
          }
          if (status.status === 'error') {
            stopQrPolling();
            setError(status.error || 'QR login failed. Please try again.');
          }
        } catch (pollErr) {
          stopQrPolling();
          setError(pollErr.message || 'Error checking login status.');
        }
      }, 1500);
    } catch (err) {
      setError(err.message || 'Could not connect to Telegram.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (mode === 'qr' && telegramConfigured) startQr();
    return () => {
      stopQrPolling();
      api.auth.cancelQrLogin().catch(() => {});
    };
  }, [mode, telegramConfigured]);

  const submitQrPassword = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.auth.submitQrPassword({ password: form.password });
      setForm((prev) => ({ ...prev, password: '' }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const sendCode = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.auth.sendCode({ phoneNumber: form.phoneNumber });
      setStep('code');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const signIn = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.auth.signIn({ code: form.code, password: form.password });
      onAuthenticated();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex h-full min-h-screen items-center justify-center bg-bg-deep px-4">
      <div className="w-full max-w-sm">
        {/* Logo + App name */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 inline-block">
            <Logo />
          </div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">TelVault</h1>
          <p className="mt-1.5 text-[12px] text-text-secondary">
            Professional file versioning, backed by Telegram
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border-subtle bg-bg-surface shadow-card overflow-hidden">
          {!telegramConfigured ? (
            <div className="p-6 text-center space-y-3">
              <div className="text-2xl">⚙️</div>
              <div className="text-[12px] font-semibold text-text-primary">Configuration required</div>
              <div className="rounded-lg border border-status-error/30 bg-status-error/10 px-3 py-2.5 text-[11px] text-status-error leading-relaxed">
                Missing <code className="font-mono">TELEGRAM_API_ID</code> and{' '}
                <code className="font-mono">TELEGRAM_API_HASH</code> in <code className="font-mono">.env</code>.
                Add them and restart TelVault.
              </div>
            </div>
          ) : mode === 'qr' ? (
            <div className="p-6 space-y-5">
              {/* QR container */}
              <div className="flex min-h-52 items-center justify-center rounded-xl border border-border-subtle bg-bg-card">
                {qr?.url && qr?.status !== 'waiting_password' ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="rounded-xl bg-white p-3 shadow-card">
                      <QRCodeSVG value={qr.url} size={148} level="M" />
                    </div>
                    {qr.expiresAt && (
                      <span className="text-[9px] uppercase tracking-widest text-text-muted font-semibold">
                        Expires {new Date(qr.expiresAt).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                ) : qr?.status === 'waiting_password' ? (
                  <form onSubmit={submitQrPassword} className="flex flex-col items-center gap-3 w-full px-4">
                    <div className="text-center">
                      <div className="text-3xl mb-2">🔐</div>
                      <div className="text-[12px] font-semibold text-text-primary">Two-step verification</div>
                      <div className="mt-1 text-[11px] text-text-secondary">
                        {qr.hint ? `Hint: ${qr.hint}` : 'Enter your Telegram password to continue'}
                      </div>
                    </div>
                    <input
                      className="w-full rounded-lg border border-border-subtle bg-bg-surface px-3 py-2 text-[12px] text-text-primary placeholder-text-muted outline-none focus:border-accent transition-colors"
                      type="password"
                      value={form.password}
                      onChange={update('password')}
                      placeholder="Password"
                      autoFocus
                      required
                      disabled={busy}
                    />
                    {error && (
                      <div className="w-full rounded-lg border border-status-error/30 bg-status-error/10 px-3 py-2 text-[10px] text-status-error">
                        {error}
                      </div>
                    )}
                    <Button type="submit" variant="primary" size="md" className="w-full justify-center" disabled={busy}>
                      {busy ? 'Verifying…' : 'Confirm'}
                    </Button>
                  </form>
                ) : error ? (
                  <div className="flex flex-col items-center gap-3 px-4 text-center">
                    <span className="text-2xl">⚠️</span>
                    <div className="text-[11px] text-status-error font-medium leading-relaxed">{error}</div>
                    <Button onClick={startQr} variant="secondary" size="sm">
                      Try again
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2.5">
                    <span className="h-6 w-6 animate-spin rounded-full border-2 border-border-subtle border-t-accent" />
                    <span className="text-[11px] text-text-muted">Generating QR code…</span>
                  </div>
                )}
              </div>

              {qr?.status !== 'waiting_password' && (
                <p className="text-center text-[11px] text-text-secondary leading-relaxed">
                  Open Telegram on your phone →{' '}
                  <strong className="text-text-primary">Settings → Devices → Link Desktop Device</strong>
                </p>
              )}

              <div className="border-t border-border-subtle pt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-center text-text-muted"
                  onClick={() => {
                    stopQrPolling();
                    api.auth.cancelQrLogin().catch(() => {});
                    setMode('phone');
                    setStep('phone');
                  }}
                >
                  Sign in with phone number instead
                </Button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={step === 'phone' ? sendCode : signIn}
              className="p-6 space-y-4"
            >
              <div className="text-[13px] font-semibold text-text-primary">
                {step === 'phone' ? 'Enter your phone number' : 'Verify your identity'}
              </div>

              {step === 'phone' ? (
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1.5">
                    Phone number (with country code)
                  </label>
                  <input
                    className="w-full rounded-lg border border-border-subtle bg-bg-card px-3 py-2.5 text-[12px] text-text-primary placeholder-text-muted outline-none focus:border-accent transition-colors"
                    value={form.phoneNumber}
                    onChange={update('phoneNumber')}
                    placeholder="+33 6 00 00 00 00"
                    required
                    autoFocus
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1.5">
                      Confirmation code
                    </label>
                    <input
                      className="w-full rounded-lg border border-border-subtle bg-bg-card px-3 py-2.5 text-[12px] text-text-primary placeholder-text-muted outline-none focus:border-accent transition-colors"
                      value={form.code}
                      onChange={update('code')}
                      placeholder="5-digit code from Telegram"
                      required
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1.5">
                      2FA password{' '}
                      <span className="text-text-muted font-normal normal-case tracking-normal">(if enabled)</span>
                    </label>
                    <input
                      className="w-full rounded-lg border border-border-subtle bg-bg-card px-3 py-2.5 text-[12px] text-text-primary placeholder-text-muted outline-none focus:border-accent transition-colors"
                      type="password"
                      value={form.password}
                      onChange={update('password')}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-lg border border-status-error/30 bg-status-error/10 px-3 py-2.5 text-[11px] text-status-error">
                  {error}
                </div>
              )}

              <Button type="submit" variant="primary" size="lg" className="w-full justify-center" disabled={busy}>
                {busy
                  ? 'Processing…'
                  : step === 'phone'
                  ? 'Send verification code'
                  : 'Sign in'}
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-center text-text-muted"
                onClick={() => { setStep('phone'); setMode('qr'); }}
              >
                ← Back to QR code login
              </Button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
