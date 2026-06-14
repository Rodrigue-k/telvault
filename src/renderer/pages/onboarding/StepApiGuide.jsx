/**
 * StepApiGuide — Step 2: visual guide to create a Telegram app on my.telegram.org
 * Clear numbered steps with a link that opens in the default browser.
 */
export default function StepApiGuide({ onNext, onBack }) {
  const steps = [
    {
      num: '1',
      title: 'Open Telegram API portal',
      desc: (
        <>
          Go to{' '}
          <a
            href="https://my.telegram.org"
            target="_blank"
            rel="noreferrer"
            className="text-accent hover:underline"
            onClick={(e) => {
              // In Electron, anchor clicks with target=_blank open in the app.
              // We force them to the OS browser via shell.
              e.preventDefault();
              window.telvault?.shell?.openExternal?.('https://my.telegram.org') ??
                window.open('https://my.telegram.org', '_blank');
            }}
          >
            my.telegram.org
          </a>{' '}
          and sign in with your Telegram account.
        </>
      ),
    },
    {
      num: '2',
      title: 'Click "API development tools"',
      desc: 'You\'ll see a form to register a new application. Fill in any name (e.g. "TelVault") and short name.',
    },
    {
      num: '3',
      title: 'Copy your credentials',
      desc: 'After submitting, Telegram shows you your App api_id (a number) and App api_hash (a 32-char hex string). Keep this tab open.',
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2
          className="text-[22px] font-semibold text-text-primary tracking-tight"
          style={{ letterSpacing: '-0.015em' }}
        >
          Create your Telegram App
        </h2>
        <p className="mt-1.5 text-[13px] text-text-secondary leading-relaxed">
          TelVault uses your own Telegram developer credentials — this keeps your
          data entirely under your control.
        </p>
      </div>

      {/* Step cards */}
      <div className="space-y-3">
        {steps.map(({ num, title, desc }) => (
          <div
            key={num}
            className="flex gap-4 rounded-xl border border-border-subtle bg-bg-surface p-4"
          >
            {/* Number badge */}
            <div
              className="flex-shrink-0 flex items-center justify-center rounded-lg text-[13px] font-bold text-accent"
              style={{
                width: 32,
                height: 32,
                background: 'rgba(47,129,247,0.12)',
                border: '1px solid rgba(47,129,247,0.25)',
              }}
            >
              {num}
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[13px] font-medium text-text-primary">{title}</span>
              <span className="text-[12px] text-text-secondary leading-snug">{desc}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Info callout */}
      <div
        className="flex items-start gap-3 rounded-xl p-3.5"
        style={{ background: 'rgba(47,129,247,0.07)', border: '1px solid rgba(47,129,247,0.2)' }}
      >
        <svg className="flex-shrink-0 mt-0.5" width="15" height="15" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7" stroke="#2f81f7" strokeWidth="1.5"/>
          <path d="M8 7v4M8 5.5v.5" stroke="#2f81f7" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <p className="text-[11.5px] text-accent leading-snug">
          Your credentials are stored locally, encrypted with your OS keychain. They are never sent to TelVault servers.
        </p>
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          id="onboarding-guide-back"
          onClick={onBack}
          className="flex-1 py-2.5 rounded-lg text-[13px] font-medium text-text-secondary border border-border-subtle bg-bg-surface hover:bg-bg-hover transition-colors"
        >
          ← Back
        </button>
        <button
          id="onboarding-guide-next"
          onClick={onNext}
          className="flex-[2] py-2.5 rounded-lg text-[13px] font-medium text-white transition-all duration-150"
          style={{ background: 'linear-gradient(135deg, #2f81f7 0%, #1a6bd8 100%)' }}
        >
          I have my credentials →
        </button>
      </div>
    </div>
  );
}
