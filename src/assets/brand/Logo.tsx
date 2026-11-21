import React from 'react';
import { BRAND_COLORS } from './brand';

interface LogoProps {
  variant?: 'chocolate' | 'white' | 'cream';
  withSlogan?: boolean;
  className?: string;
  width?: number | string;
}

/**
 * Logotipo Vectorial — Los Brownies de Josefina
 * Basado en la tipografía extendida + caligrafía con corazón sobre la 'i'.
 */
export const Logo: React.FC<LogoProps> = ({
  variant = 'chocolate',
  withSlogan = false,
  className = '',
  width = 280,
}) => {
  const textColor =
    variant === 'chocolate'
      ? BRAND_COLORS.chocolate
      : variant === 'cream'
      ? BRAND_COLORS.cream
      : BRAND_COLORS.white;

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <svg
        viewBox="0 0 340 110"
        style={{ width, height: 'auto', display: 'block' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* "LOS" */}
        <text
          x="170"
          y="24"
          textAnchor="middle"
          fill={textColor}
          style={{
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            fontSize: '15px',
            fontWeight: 500,
            letterSpacing: '0.35em',
          }}
        >
          LOS
        </text>

        {/* "BROWNIES" — Tipografía extendida geométrica */}
        <text
          x="170"
          y="62"
          textAnchor="middle"
          fill={textColor}
          style={{
            fontFamily: "'Syne', 'Space Grotesk', system-ui, sans-serif",
            fontSize: '40px',
            fontWeight: 800,
            letterSpacing: '0.12em',
          }}
        >
          BROWNIES
        </text>

        {/* "de Josefina" — Cursiva artesanal entrelazada */}
        <g transform="translate(170, 78)">
          <text
            x="0"
            y="0"
            textAnchor="middle"
            fill={textColor}
            style={{
              fontFamily: "'Playfair Display', 'Caveat', cursive",
              fontStyle: 'italic',
              fontSize: '32px',
              fontWeight: 400,
            }}
          >
            de Josefina
          </text>

          {/* Pequeño corazón sobre la 'i' de Josefina */}
          <path
            d="M 23 -26 C 21 -29 18 -29 16 -27 C 14 -29 11 -29 9 -27 C 7 -24 9 -21 16 -16 C 23 -21 25 -24 23 -26 Z"
            fill={textColor}
            transform="scale(0.7) translate(18, -12)"
          />
        </g>
      </svg>

      {/* Eslogan y corazón opcional */}
      {withSlogan && (
        <div className="mt-3 flex flex-col items-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill={textColor}>
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          <span
            className="mt-2 text-[10px] font-bold tracking-[0.28em] text-center uppercase"
            style={{ color: textColor }}
          >
            ENCUENTRA AQUÍ EL AMOR MÁS DULCE
          </span>
        </div>
      )}
    </div>
  );
};
