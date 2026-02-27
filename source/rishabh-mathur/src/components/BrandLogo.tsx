interface BrandLogoProps {
  compact?: boolean;
  variant?: "v1" | "v2" | "v3";
}

export default function BrandLogo({ compact = false, variant = "v1" }: BrandLogoProps) {
  const LogoMark = variant === "v2" ? LogoVariantTwo : variant === "v3" ? LogoVariantThree : LogoVariantOne;

  return (
    <div className="flex items-center gap-3 group">
      <div className="relative h-11 w-11 shrink-0 rounded-2xl border border-primary/30 bg-gradient-to-br from-cyan-400 via-primary to-fuchsia-500 p-[1px] shadow-[0_0_24px_rgba(168,85,247,0.35)]">
        <div className="h-full w-full rounded-[14px] bg-[var(--sidebar-bg)] flex items-center justify-center">
          <LogoMark />
        </div>
      </div>

      {!compact && (
        <div>
          <h1 className="text-base font-black tracking-tight uppercase text-[var(--text-main)] group-hover:text-primary transition-colors">
            Snowcone
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">
            Warehouse
          </p>
        </div>
      )}
    </div>
  );
}

function LogoVariantOne() {
  return (
    <svg viewBox="0 0 48 48" className="h-7 w-7 drop-shadow-[0_0_10px_rgba(56,189,248,0.45)]" aria-hidden="true">
      <defs>
        <linearGradient id="logoConeV1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="55%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#f472b6" />
        </linearGradient>
      </defs>
      <path d="M24 31.2l-4.5 8h9L24 31.2z" fill="#f8fafc" fillOpacity="0.95" />
      <path d="M24 9c6.8 0 12.2 4.6 12.2 10.3 0 5.6-4.6 10-10.8 10.7h-2.8C16.4 29.3 11.8 24.9 11.8 19.3 11.8 13.6 17.2 9 24 9z" fill="url(#logoConeV1)" />
      <g stroke="#e2e8f0" strokeWidth="1.25" strokeLinecap="round" opacity="0.95">
        <path d="M24 12.2v6.2" />
        <path d="M20.9 13.7l6.2 3.1" />
        <path d="M27.1 13.7l-6.2 3.1" />
      </g>
      <circle cx="24" cy="15.4" r="1.2" fill="#e2e8f0" />
    </svg>
  );
}

function LogoVariantTwo() {
  return (
    <svg viewBox="0 0 48 48" className="h-7 w-7 drop-shadow-[0_0_10px_rgba(56,189,248,0.45)]" aria-hidden="true">
      <defs>
        <linearGradient id="logoConeV2" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="60%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      <path d="M24 31.4l-4.3 7.6h8.6L24 31.4z" fill="#f1f5f9" fillOpacity="0.95" />
      <path d="M24 8.8c7 0 12.3 4.9 12.3 10.8 0 5.7-4.4 10.1-10.9 10.6h-2.8C16.1 29.7 11.7 25.3 11.7 19.6c0-5.9 5.3-10.8 12.3-10.8z" fill="url(#logoConeV2)" />
      <g stroke="#e2e8f0" strokeWidth="1.15" strokeLinecap="round" opacity="0.95">
        <path d="M24 11.8v6.8" />
        <path d="M20.6 13.3l6.8 3.4" />
        <path d="M27.4 13.3l-6.8 3.4" />
        <path d="M21.2 18.6l5.6-5.6" />
        <path d="M26.8 18.6l-5.6-5.6" />
      </g>
    </svg>
  );
}

function LogoVariantThree() {
  return (
    <svg viewBox="0 0 48 48" className="h-7 w-7 drop-shadow-[0_0_10px_rgba(56,189,248,0.45)]" aria-hidden="true">
      <defs>
        <linearGradient id="logoConeV3" x1="0%" y1="10%" x2="100%" y2="90%">
          <stop offset="0%" stopColor="#67e8f9" />
          <stop offset="45%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <path d="M24 31.5l-4.6 7.5h9.2L24 31.5z" fill="#f8fafc" fillOpacity="0.95" />
      <path d="M24 9c6.9 0 12 4.4 12 10.2 0 5.5-4.2 9.9-10.5 10.7h-3C16.2 29.1 12 24.7 12 19.2 12 13.4 17.1 9 24 9z" fill="url(#logoConeV3)" />
      <g stroke="#f8fafc" strokeWidth="1.2" strokeLinecap="round" opacity="0.95">
        <path d="M24 12v6.4" />
        <path d="M20.8 13.5l6.4 3.2" />
        <path d="M27.2 13.5l-6.4 3.2" />
      </g>
      <circle cx="24" cy="15.2" r="1.15" fill="#f8fafc" />
      <circle cx="28.7" cy="20.6" r="0.9" fill="#f8fafc" fillOpacity="0.9" />
      <circle cx="19.3" cy="20.6" r="0.9" fill="#f8fafc" fillOpacity="0.9" />
    </svg>
  );
}
