import React from 'react';

export const MaleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${className}`}>
    <path fillRule="evenodd" d="M12.75 2.25a.75.75 0 00-1.5 0v1.508c-1.141.16-2.209.564-3.161 1.169a.75.75 0 00-.512 1.085l.777 1.553a.75.75 0 001.44-.227l-.348-.696A9.002 9.002 0 0111.25 6.03V9.75a.75.75 0 001.5 0V6.03A9.002 9.002 0 0113.5 6.886l-.348.696a.75.75 0 001.44.227l.777-1.553a.75.75 0 00-.512-1.085c-.952-.605-2.02-.998-3.161-1.169V2.25zM6.852 9.75A8.25 8.25 0 003.75 15.75c0 2.502 1.114 4.727 2.862 6.256A.75.75 0 007.5 21.16a6.75 6.75 0 014.5-10.923.75.75 0 00-.499-1.413 8.225 8.225 0 00-4.649.926zM17.148 9.75a8.225 8.225 0 00-4.649-.926.75.75 0 00-.499 1.413A6.75 6.75 0 0116.5 21.16a.75.75 0 00.888.846A8.25 8.25 0 0020.25 15.75c0-2.502-1.114-4.727-2.862-6.256A.75.75 0 0017.148 9.75z" clipRule="evenodd" />
  </svg>
);

export const FemaleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${className}`}>
    <path fillRule="evenodd" d="M12 2.25c-2.429 0-4.393 1.73-4.393 3.872 0 2.141 1.964 3.872 4.393 3.872s4.393-1.73 4.393-3.872c0-2.141-1.964-3.872-4.393-3.872zM12 12.75a.75.75 0 00-.75.75v6a.75.75 0 001.5 0v-6a.75.75 0 00-.75-.75zM12 11.25a8.153 8.153 0 015.99 2.665 8.318 8.318 0 01.428 5.689A.75.75 0 0117.67 20.25h-3.92a.75.75 0 00-.75.75.75.75 0 00.75.75h3.92a2.25 2.25 0 002.23-1.907 9.818 9.818 0 00-.506-6.747A9.653 9.653 0 0012 9.75a9.653 9.653 0 00-7.196 3.346 9.818 9.818 0 00-.506 6.747A2.25 2.25 0 006.53 21.75H10.45a.75.75 0 00.75-.75.75.75 0 00-.75-.75H6.53a.75.75 0 01-.748-.634 8.318 8.318 0 01.428-5.689A8.153 8.153 0 0112 11.25z" clipRule="evenodd" />
  </svg>
);

export const CalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${className}`}>
    <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zM5.25 6.75c-.621 0-1.125.504-1.125 1.125V18.75c0 .621.504 1.125 1.125 1.125h13.5c.621 0 1.125-.504 1.125-1.125V7.875c0-.621-.504-1.125-1.125-1.125H5.25z" clipRule="evenodd" />
  </svg>
);

export const UserIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${className}`}>
    <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
  </svg>
);

export const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${className}`}>
    <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
  </svg>
);

export const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${className}`}>
    <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.499.058l.346-9z" clipRule="evenodd" />
  </svg>
);

type QuadrantKey = 'RS' | 'RI' | 'LS' | 'LI';

interface LungIconProps {
  className?: string;
  selectedQuadrants: Record<QuadrantKey, boolean>;
  hoveredQuadrant: QuadrantKey | null;
  onQuadrantClick: (quadrant: QuadrantKey) => void;
  onQuadrantHover: (quadrant: QuadrantKey | null) => void;
  selectionColor?: 'indigo' | 'teal'; // Distinguish activity (indigo) vs chronicity (teal)
}

export const LungIcon: React.FC<LungIconProps> = ({
  className,
  selectedQuadrants,
  hoveredQuadrant,
  onQuadrantClick,
  onQuadrantHover,
  selectionColor = 'indigo'
}) => {
  
  // Modernized Medical Color Palette
  // Indigo for Active (Hotter/Alert), Teal for Chronic (Cooler/Stable)
  const colors = {
    indigo: {
      base: '#eef2ff',      // slate-50ish but tinted
      stroke: '#818cf8',    // indigo-400
      hover: '#c7d2fe',     // indigo-200
      active: '#4f46e5',    // indigo-600
      activeHover: '#4338ca', // indigo-700
    },
    teal: {
      base: '#f0fdfa',      // teal-50
      stroke: '#2dd4bf',    // teal-400
      hover: '#99f6e4',     // teal-200
      active: '#0d9488',    // teal-600
      activeHover: '#0f766e', // teal-700
    }
  };

  const palette = colors[selectionColor];

  const getPathStyle = (q: QuadrantKey) => {
    const isSelected = selectedQuadrants[q];
    const isHovered = hoveredQuadrant === q;
    
    let fill = palette.base;
    let stroke = palette.stroke;
    let strokeWidth = 1.5;

    if (isHovered && !isSelected) {
        fill = palette.hover;
    }
    if (isSelected) {
        fill = isHovered ? palette.activeHover : palette.active;
        stroke = isHovered ? palette.activeHover : palette.active;
        strokeWidth = 0; // Filled shape looks cleaner without outline usually, or matching outline
    }

    return {
      fill,
      stroke,
      strokeWidth,
      transition: 'all 0.2s ease-in-out',
      cursor: 'pointer',
      filter: isSelected ? 'drop-shadow(0px 2px 3px rgba(0,0,0,0.2))' : 'none'
    };
  };

  // Anatomical Paths (0 0 200 200)
  // Smooth organic curves representing lungs
  const paths: Record<QuadrantKey, string> = {
    // Right Superior (RS) - Top Right (in SVG coordinates, Left Lung visually)
    // Actually standard CXR view: Right lung is on Left of screen.
    RS: "M 55,20 C 30,20 15,45 15,75 C 15,85 18,95 22,100 L 90,95 L 90,45 C 88,35 80,20 55,20 Z",
    
    // Right Inferior (RI)
    RI: "M 22,100 C 28,135 45,160 90,155 L 90,95 L 22,100 Z",
    
    // Left Superior (LS) - Top Left (CXR view: Right side of screen)
    // Slightly narrower top
    LS: "M 145,20 C 170,20 185,45 185,75 C 185,85 182,95 178,100 L 110,95 L 110,45 C 112,35 120,20 145,20 Z",
    
    // Left Inferior (LI) - Has cardiac notch (concave part)
    // Starting from bottom of LS
    LI: "M 178,100 C 175,135 160,160 110,155 L 110,95 L 178,100 Z"
  };

  // Trachea (Central pipe)
  const tracheaPath = "M 100,5 L 100,45";

  return (
    <svg viewBox="0 0 200 170" className={`w-full h-full ${className}`} aria-hidden="true">
       {/* Soft Drop Shadow Definition */}
       <defs>
        <filter id="innerGlow" x="-20%" y="-20%" width="140%" height="140%">
           <feGaussianBlur stdDeviation="2" result="blur"/>
           <feComposite in="SourceGraphic" in2="blur" operator="arithmetic" k2="-1" k3="1"/>
        </filter>
      </defs>

      {/* Trachea */}
      <path d={tracheaPath} fill="none" stroke="#cbd5e1" strokeWidth="8" strokeLinecap="round" />

      {/* Lobes */}
      {(Object.keys(paths) as QuadrantKey[]).map(q => (
        <g key={q}>
            <path
                d={paths[q]}
                style={getPathStyle(q)}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQuadrantClick(q);}}
                onMouseEnter={() => onQuadrantHover(q)}
                onMouseLeave={() => onQuadrantHover(null)}
            />
            {/* Labels - Only show if selected for clarity or always subtle? Always subtle is better for non-technical */}
            <text 
                x={q === 'RS' ? 55 : q === 'RI' ? 60 : q === 'LS' ? 145 : 140} 
                y={q === 'RS' ? 65 : q === 'RI' ? 130 : q === 'LS' ? 65 : 130} 
                textAnchor="middle" 
                fill={selectedQuadrants[q] ? "white" : "rgba(100,116,139, 0.5)"}
                className="text-[12px] font-bold pointer-events-none select-none uppercase"
                style={{ fontSize: '12px', fontWeight: 700 }}
            >
                {q}
            </text>
        </g>
      ))}
    </svg>
  );
};