interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 24, className = "" }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="4" y="6" width="56" height="40" rx="12" className="fill-slate-900 dark:fill-slate-100" />
      <path d="M22 46 L32 58 L42 46" className="fill-slate-900 dark:fill-slate-100" />
      <path
        d="M18 28 L28 38 L46 20"
        stroke="#10B981"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
