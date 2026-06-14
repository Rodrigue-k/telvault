import { useState, useRef } from 'react';

/**
 * StepCredentials — Step 3: enter API ID + API Hash, validate, save encrypted.
 */
export default function StepCredentials({ onComplete, onBack }) {
  const [apiId, setApiId]     = useState('');
  const [apiHash, setApiHash] = useState('');
  const [error, setError]     = useState('');
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState(false);
  const hashRef = useRef(null);

  // Client-side pre-validation for fast feedback
  function validate() {
    const id = apiId.trim();
    const hash = apiHash.trim();
    if (!id)   return 'API ID is required.';
    if (!/^\d+$/.test(id)) return 'API ID must be a number (e.g. 12345678).';
    if (!hash) return 'API Hash is required.';
    if (!/^[a-f0-9]{32}$/i.test(hash)) return 'API Hash must be a 32-character hex string.';
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setSaving(true);
    setError('');
    try {
      await window.telvault.onboarding.saveCredentials({
        apiId: apiId.trim(),
        apiHash: apiHash.trim(),
      });
      setSuccess(true);
      // Brief success moment, then proceed
      setTimeout(() => onComplete(), 900);
    } catch (err) {
      setError(err.message || 'Failed to save credentials.');
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2
          className="text-[22px] font-semibold text-text-primary tracking-tight"
          style={{ letterSpacing: '-0.015em' }}
        >
          Enter your credentials
        </h2>
        <p className="mt-1.5 text-[13px] text-text-secondary leading-relaxed">
          Copy the values from the Telegram API portal and paste them below.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* API ID */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-medium text-text-secondary" htmlFor="api-id-input">
            App api_id
          </label>
          <input
            id="api-id-input"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            spellCheck={false}
            placeholder="e.g. 12345678"
            value={apiId}
            onChange={(e) => { setApiId(e.target.value.trim()); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && hashRef.current?.focus()}
            disabled={saving || success}
            className="w-full rounded-lg border border-border-subtle bg-bg-surface px-3 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted font-mono
              focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30
              disabled:opacity-50 transition-colors"
          />
        </div>

        {/* API Hash */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-medium text-text-secondary" htmlFor="api-hash-input">
            App api_hash
          </label>
          <input
            id="api-hash-input"
            ref={hashRef}
            type="text"
            autoComplete="off"
            spellCheck={false}
            placeholder="32-character hex string"
            value={apiHash}
            onChange={(e) => { setApiHash(e.target.value.trim()); setError(''); }}
            disabled={saving || success}
            className="w-full rounded-lg border border-border-subtle bg-bg-surface px-3 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted font-mono
              focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30
              disabled:opacity-50 transition-colors"
          />
          <span className="text-[11px] text-text-muted">
            Looks like: <span className="font-mono text-text-muted">a1b2c3d4e5f6…</span> (32 chars, lowercase hex)
          </span>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-status-error/30 bg-status-error/10 px-3 py-2.5">
            <svg className="flex-shrink-0 mt-0.5" width="13" height="13" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="#f85149" strokeWidth="1.5"/>
              <path d="M8 5v4M8 10.5v.5" stroke="#f85149" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span className="text-[12px] text-status-error">{error}</span>
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-3 mt-1">
          <button
            type="button"
            id="onboarding-creds-back"
            onClick={onBack}
            disabled={saving || success}
            className="flex-1 py-2.5 rounded-lg text-[13px] font-medium text-text-secondary border border-border-subtle bg-bg-surface hover:bg-bg-hover transition-colors disabled:opacity-40"
          >
            ← Back
          </button>

          <button
            type="submit"
            id="onboarding-creds-submit"
            disabled={saving || success}
            className="flex-[2] py-2.5 rounded-lg text-[13px] font-medium text-white transition-all duration-150 disabled:opacity-60"
            style={{ background: success ? '#238636' : 'linear-gradient(135deg, #2f81f7 0%, #1a6bd8 100%)' }}
          >
            {success ? (
              <span className="flex items-center justify-center gap-2">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M2 8l4 4 8-8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Saved!
              </span>
            ) : saving ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Saving…
              </span>
            ) : (
              'Connect TelVault →'
            )}
          </button>
        </div>
      </form>

      {/* Security note */}
      <div className="flex items-center gap-2 justify-center">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <path d="M8 1L2 4v4c0 3.3 2.5 6.4 6 7.2C11.5 14.4 14 11.3 14 8V4L8 1z" stroke="#6e7681" strokeWidth="1.5"/>
          <path d="M5.5 8l2 2 3-3" stroke="#6e7681" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="text-[11px] text-text-muted">Encrypted locally with your OS keychain (DPAPI)</span>
      </div>
    </div>
  );
}
