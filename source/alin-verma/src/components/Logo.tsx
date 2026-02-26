/**
 * Snowcone Warehouse Logo
 * A creative ice cream cone SVG logo with animated elements
 */

interface LogoProps {
  className?: string;
  size?: number;
  animated?: boolean;
}

export function Logo({ className = "", size = 40, animated = true }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Gradient definitions */}
      <defs>
        {/* Ice cream gradients */}
        <linearGradient id="iceCreamGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id="iceCreamGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F472B6" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
        <linearGradient id="iceCreamGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        {/* Cone gradient */}
        <linearGradient id="coneGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        {/* Waffle pattern */}
        <pattern id="wafflePattern" patternUnits="userSpaceOnUse" width="8" height="8">
          <path d="M0 4 L8 4 M4 0 L4 8" stroke="#B45309" strokeWidth="0.8" opacity="0.4" />
        </pattern>
        {/* Shine effect */}
        <linearGradient id="shineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="white" stopOpacity="0.4" />
          <stop offset="50%" stopColor="white" stopOpacity="0" />
          <stop offset="100%" stopColor="white" stopOpacity="0.1" />
        </linearGradient>
        {/* Snow sparkle */}
        <radialGradient id="sparkle" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Drop shadow */}
      <g filter="url(#dropShadow)">
        <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.2" />
        </filter>

        {/* Cone - waffle cone shape */}
        <path
          d="M22 38 L32 58 L42 38 Q32 42 22 38 Z"
          fill="url(#coneGradient)"
          className={animated ? "animate-pulse" : ""}
          style={{ animationDuration: "3s" }}
        />
        
        {/* Waffle pattern overlay on cone */}
        <path
          d="M22 38 L32 58 L42 38 Q32 42 22 38 Z"
          fill="url(#wafflePattern)"
        />

        {/* Ice cream scoops */}
        {/* Bottom scoop - blue */}
        <ellipse
          cx="32"
          cy="36"
          rx="14"
          ry="12"
          fill="url(#iceCreamGradient1)"
        />
        
        {/* Middle scoop - pink */}
        <ellipse
          cx="32"
          cy="24"
          rx="12"
          ry="11"
          fill="url(#iceCreamGradient2)"
        />
        
        {/* Top scoop - purple */}
        <ellipse
          cx="32"
          cy="13"
          rx="10"
          ry="9"
          fill="url(#iceCreamGradient3)"
        />

        {/* Shine effects on scoops */}
        <ellipse
          cx="26"
          cy="34"
          rx="4"
          ry="3"
          fill="url(#shineGradient)"
        />
        <ellipse
          cx="27"
          cy="22"
          rx="3"
          ry="2.5"
          fill="url(#shineGradient)"
        />
        <ellipse
          cx="28"
          cy="11"
          rx="2.5"
          ry="2"
          fill="url(#shineGradient)"
        />

        {/* Snowcone texture - small ice crystals */}
        <circle cx="36" cy="35" r="1.5" fill="white" opacity="0.6" />
        <circle cx="28" cy="38" r="1" fill="white" opacity="0.5" />
        <circle cx="35" cy="24" r="1.2" fill="white" opacity="0.6" />
        <circle cx="28" cy="26" r="0.8" fill="white" opacity="0.5" />
        <circle cx="34" cy="12" r="1" fill="white" opacity="0.6" />
        <circle cx="29" cy="15" r="0.8" fill="white" opacity="0.5" />

        {/* Cherry on top */}
        <circle cx="32" cy="5" r="4" fill="#EF4444" />
        <ellipse cx="30.5" cy="3.5" rx="1" ry="0.8" fill="white" opacity="0.4" />
        
        {/* Cherry stem */}
        <path
          d="M32 1 Q34 -2 36 0"
          stroke="#15803D"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        
        {/* Leaf */}
        <ellipse
          cx="35"
          cy="0"
          rx="3"
          ry="1.5"
          fill="#22C55E"
          transform="rotate(30 35 0)"
        />
      </g>

      {/* Sparkle animations */}
      {animated && (
        <>
          <circle cx="18" cy="8" r="2" fill="url(#sparkle)" opacity="0.8">
            <animate
              attributeName="opacity"
              values="0.8;0.2;0.8"
              dur="2s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="r"
              values="2;1.5;2"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="48" cy="15" r="1.5" fill="url(#sparkle)" opacity="0.6">
            <animate
              attributeName="opacity"
              values="0.6;0.1;0.6"
              dur="2.5s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="12" cy="28" r="1.8" fill="url(#sparkle)" opacity="0.7">
            <animate
              attributeName="opacity"
              values="0.7;0.2;0.7"
              dur="1.8s"
              repeatCount="indefinite"
            />
          </circle>
        </>
      )}
    </svg>
  );
}

/**
 * Compact logo variant for smaller spaces
 */
export function LogoCompact({ className = "", size = 32 }: Omit<LogoProps, 'animated'>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="compactIceCream" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="50%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#F472B6" />
        </linearGradient>
        <linearGradient id="compactCone" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>
      
      {/* Cone */}
      <path
        d="M16 28 L24 44 L32 28 Q24 31 16 28 Z"
        fill="url(#compactCone)"
      />
      
      {/* Ice cream swirl */}
      <path
        d="M12 26 Q12 14 24 10 Q36 14 36 26 Q36 30 24 28 Q12 30 12 26 Z"
        fill="url(#compactIceCream)"
      />
      
      {/* Shine */}
      <ellipse cx="18" cy="20" rx="3" ry="4" fill="white" opacity="0.3" />
      
      {/* Cherry */}
      <circle cx="24" cy="6" r="3" fill="#EF4444" />
      <path d="M24 3 Q26 0 28 2" stroke="#15803D" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export default Logo;