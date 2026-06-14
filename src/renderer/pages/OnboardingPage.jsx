import { useState, useEffect, useRef } from 'react';
import StepWelcome from './onboarding/StepWelcome';
import StepApiGuide from './onboarding/StepApiGuide';
import StepCredentials from './onboarding/StepCredentials';

const STEPS = ['welcome', 'guide', 'credentials'];

/**
 * OnboardingPage — Multi-step first-run wizard.
 * Shown once when no Telegram API credentials are stored.
 * On completion, calls onComplete() so App.jsx can proceed to auth.
 */
export default function OnboardingPage({ onComplete }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back
  const [animating, setAnimating] = useState(false);
  const timeoutRef = useRef(null);

  const currentStep = STEPS[stepIndex];

  function goTo(index) {
    if (animating || index === stepIndex) return;
    setDirection(index > stepIndex ? 1 : -1);
    setAnimating(true);
    timeoutRef.current = setTimeout(() => {
      setStepIndex(index);
      setAnimating(false);
    }, 260);
  }

  function next() { goTo(stepIndex + 1); }
  function back() { goTo(stepIndex - 1); }

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-bg-deep overflow-hidden select-none">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(47,129,247,0.08) 0%, transparent 70%)',
        }}
      />

      {/* Progress dots */}
      <div className="absolute top-8 flex items-center gap-2">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === stepIndex ? 20 : 6,
              height: 6,
              background: i === stepIndex
                ? '#2f81f7'
                : i < stepIndex
                  ? 'rgba(47,129,247,0.4)'
                  : 'rgba(255,255,255,0.1)',
            }}
          />
        ))}
      </div>

      {/* Step card */}
      <div
        className="relative z-10 w-full max-w-md px-6"
        style={{
          opacity: animating ? 0 : 1,
          transform: animating
            ? `translateX(${direction * 24}px)`
            : 'translateX(0)',
          transition: 'opacity 0.26s ease, transform 0.26s ease',
        }}
      >
        {currentStep === 'welcome' && <StepWelcome onNext={next} />}
        {currentStep === 'guide'   && <StepApiGuide onNext={next} onBack={back} />}
        {currentStep === 'credentials' && (
          <StepCredentials onComplete={onComplete} onBack={back} />
        )}
      </div>

      {/* Footer */}
      <p className="absolute bottom-6 text-[11px] text-text-muted">
        TelVault uses your own Telegram developer account — your data never touches our servers.
      </p>
    </div>
  );
}
