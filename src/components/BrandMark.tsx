export function BrandMark({ size = 38 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 44"
      fill="none"
      aria-hidden="true"
      className="brand-mark-svg"
    >
      <rect x="0.75" y="0.75" width="42.5" height="42.5" rx="10" stroke="currentColor" strokeOpacity="0.22" />
      <circle cx="22" cy="22" r="12.5" stroke="currentColor" strokeWidth="1.35" />
      <circle cx="22" cy="22" r="4.2" fill="currentColor" />
      <path d="M22 4.5v7M22 32.5v7M4.5 22h7M32.5 22h7" stroke="currentColor" strokeWidth="1.35" />
      <path d="M31.8 12.2l-4.4 4.4" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.35" />
    </svg>
  );
}

export function ArrowUpRight({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4.5 11.5L11.5 4.5M5.4 4.5h6.1v6.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
