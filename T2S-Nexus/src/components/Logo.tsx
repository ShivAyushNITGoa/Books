import React from 'react';

const Logo: React.FC<{ className?: string, src?: string }> = ({ className = "w-10 h-10", src = "/Logo-real.png" }) => {
  const [currentSrc, setCurrentSrc] = React.useState(src || "/Logo-real.png");
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    setCurrentSrc(src || "/Logo-real.png");
    setError(false);
  }, [src]);

  const handleError = () => {
    if (currentSrc === "/Logo-real.png") {
      setCurrentSrc("/logo.png");
    } else {
      setError(true);
    }
  };

  return (
    <div className={`relative flex items-center justify-center ${className} group cursor-pointer transition-transform duration-500 hover:scale-105 active:scale-95 bg-black/40 rounded-full overflow-hidden border border-white/10 shadow-[0_0_20px_rgba(245,158,11,0.05)]`}>
      {!error ? (
        <img 
          src={currentSrc} 
          alt="Talk2Society Logo" 
          className="w-full h-full object-cover" 
          onError={handleError}
        />
      ) : (
        // Premium crafted vector fallback SVG
        <svg 
          viewBox="0 0 100 100" 
          className="w-[85%] h-[85%]"
        >
          <defs>
            <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>
            <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </radialGradient>
          </defs>
          
          {/* Subtle background glow */}
          <circle cx="50" cy="50" r="45" fill="url(#glowGrad)" />
          
          {/* Sleek outer hexagon */}
          <polygon 
            points="50,12 83,31 83,69 50,88 17,69 17,31" 
            fill="none" 
            stroke="url(#logoGrad)" 
            strokeWidth="3.5"
            strokeLinejoin="round" 
          />
          
          {/* Nested inner mini geometric diamond */}
          <polygon 
            points="50,22 74,36 74,64 50,78 26,64 26,36" 
            fill="none" 
            stroke="white" 
            strokeOpacity="0.12"
            strokeWidth="1.5"
            strokeLinejoin="round" 
          />

          {/* Elegant Sovereign Geometric Emblem instead of T2S text */}
          <path
            d="M50,28 L64,42 L64,58 L50,72 L36,58 L36,42 Z"
            fill="url(#logoGrad)"
            opacity="0.9"
          />
          <circle cx="50" cy="50" r="4" fill="#ffffff" />

          {/* Golden accent dots */}
          <circle cx="50" cy="12" r="2" fill="white" />
          <circle cx="50" cy="88" r="2" fill="white" />
        </svg>
      )}
    </div>
  );
};

export default Logo;
