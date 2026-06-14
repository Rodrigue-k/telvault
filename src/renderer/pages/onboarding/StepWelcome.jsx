/**
 * StepWelcome — First step of the onboarding flow.
 * Brand moment: logo, tagline, CTA button.
 */
export default function StepWelcome({ onNext }) {
  return (
    <div className="flex flex-col items-center text-center gap-6">
      {/* Logo mark */}
      <div className="relative flex items-center justify-center">
        <div
          className="absolute rounded-full blur-2xl"
          style={{ width: 96, height: 96, background: 'rgba(47,129,247,0.25)' }}
        />
        <div
          className="relative flex items-center justify-center rounded-2xl"
          style={{
            width: 72,
            height: 72,
            background: 'linear-gradient(135deg, #1a3a6e 0%, #0d1f42 100%)',
            border: '1.5px solid rgba(47,129,247,0.3)',
            boxShadow: '0 0 0 1px rgba(47,129,247,0.1), 0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          {/* Vault icon */}
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="6" width="18" height="14" rx="2" stroke="#2f81f7" strokeWidth="1.5"/>
            <circle cx="12" cy="13" r="3" stroke="#2f81f7" strokeWidth="1.5"/>
            <path d="M12 13h3" stroke="#2f81f7" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" stroke="#2f81f7" strokeWidth="1.5"/>
          </svg>
        </div>
      </div>

      {/* Heading */}
      <div>
        <h1
          className="text-[28px] font-semibold tracking-tight text-text-primary"
          style={{ letterSpacing: '-0.02em' }}
        >
          Welcome to TelVault
        </h1>
        <p className="mt-2 text-[14px] text-text-secondary leading-relaxed">
          Version-control your project folders using<br />
          Telegram as unlimited private cloud storage.
        </p>
      </div>

      {/* Feature bullets */}
      <div className="w-full rounded-xl border border-border-subtle bg-bg-surface p-4 text-left space-y-3">
        {[
          { icon: '🔒', text: 'End-to-end private — your own Telegram channels, no shared infrastructure' },
          { icon: '♾️', text: 'Unlimited storage via Telegram file hosting (up to 2 GB per archive)' },
          { icon: '🔄', text: 'Cross-device sync — restore your vault index on any PC in seconds' },
        ].map(({ icon, text }) => (
          <div key={text} className="flex items-start gap-3">
            <span className="text-[16px] leading-none mt-0.5">{icon}</span>
            <span className="text-[12px] text-text-secondary leading-snug">{text}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        id="onboarding-start-btn"
        onClick={onNext}
        className="w-full py-3 rounded-lg font-medium text-[14px] text-white transition-all duration-150"
        style={{
          background: 'linear-gradient(135deg, #2f81f7 0%, #1a6bd8 100%)',
          boxShadow: '0 4px 16px rgba(47,129,247,0.3)',
        }}
        onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 6px 20px rgba(47,129,247,0.45)')}
        onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(47,129,247,0.3)')}
      >
        Get Started →
      </button>
    </div>
  );
}
