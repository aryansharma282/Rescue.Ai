import React from 'react';

interface LogoProps {
  className?: string;
  tile?: boolean;
}

export default function Logo({ className = "w-8 h-8", tile = false }: LogoProps) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      {/* Optional iOS-style rounded dark tile background */}
      {tile && (
        <rect 
          width="100" 
          height="100" 
          rx="22" 
          fill="#121212" 
          stroke="#ffde1a" 
          strokeWidth="1.5"
          className="dark:stroke-neutral-800/80 stroke-[#ffde1a]/30"
        />
      )}
      
      {/* Outer container group to center the logo paths */}
      <g transform={tile ? "translate(1, 1) scale(0.98)" : ""}>
        {/* Top Loop of 'R' */}
        <path
          d="M 28 44 V 27 H 53 A 13 13 0 0 1 53 53 H 42"
          stroke="#ffde1a"
          strokeWidth="8.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Checkmark portion */}
        <path
          d="M 28 56 L 37.5 65.5 L 56 44"
          stroke="#ffde1a"
          strokeWidth="8.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Leg of 'R' */}
        <path
          d="M 50 51 L 69 74"
          stroke="#ffde1a"
          strokeWidth="8.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>
    </svg>
  );
}
