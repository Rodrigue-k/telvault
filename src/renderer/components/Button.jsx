export function Button({ children, variant = 'primary', size = 'md', className = '', disabled = false, ...props }) {
  const base = 'inline-flex items-center justify-center font-medium rounded-md border transition-colors disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-accent/50';

  const sizes = {
    sm: 'h-7 px-2.5 text-xs gap-1.5',
    md: 'h-8 px-3 text-xs gap-2',
    lg: 'h-9 px-4 text-sm gap-2',
  };

  const variants = {
    primary:  'bg-accent border-accent text-white hover:bg-accent-hover',
    secondary:'bg-bg-hover border-border-subtle text-text-primary hover:bg-bg-active',
    ghost:    'bg-transparent border-transparent text-text-secondary hover:bg-bg-hover hover:text-text-primary',
    danger:   'bg-transparent border-status-error/40 text-status-error hover:bg-status-error/10',
    success:  'bg-status-new/10 border-status-new/30 text-status-new hover:bg-status-new/20',
  };

  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
