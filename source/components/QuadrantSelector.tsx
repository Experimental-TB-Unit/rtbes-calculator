import React, { useState } from "react";
import type { QuadrantData } from "../model.ts";
import { LungIcon } from "./ui/IconComponents";

interface QuadrantSelectorProps {
  label: string;
  quadrantData: QuadrantData;
  onChange: (data: QuadrantData) => void;
  colorClass?: string;
}

type QuadrantKey = keyof QuadrantData;

const quadrantNames: Record<QuadrantKey, string> = {
  RS: "Right upper",
  RI: "Right lower",
  LS: "Left upper",
  LI: "Left lower",
};
const displayCodes: Record<QuadrantKey, string> = {
  RS: "RU",
  RI: "RL",
  LS: "LU",
  LI: "LL",
};

const QuadrantSelector: React.FC<QuadrantSelectorProps> = ({
  label,
  quadrantData,
  onChange,
  colorClass,
}) => {
  const [hoveredQuadrant, setHoveredQuadrant] = useState<QuadrantKey | null>(
    null,
  );

  const handleQuadrantClick = (quadrant: QuadrantKey) => {
    onChange({
      ...quadrantData,
      [quadrant]: !quadrantData[quadrant],
    });
  };

  // Determine color theme based on text color class passed from parent
  const selectionColor = colorClass?.includes("teal") ? "teal" : "indigo";
  const count = Object.values(quadrantData).filter((v) => v).length;

  return (
    <div
      className="flex flex-col items-center w-full max-w-[220px]"
      aria-label={`${label}. Select affected quadrants.`}
    >
      <div className="flex items-center justify-center w-full mb-2 relative">
        <span className="text-sm font-medium text-slate-600 text-center leading-tight h-10 flex items-center">
          {label}
        </span>
        {count > 0 && (
          <span
            className={`absolute -top-2 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold shadow-sm ${
              selectionColor === "teal"
                ? "bg-teal-500 text-white"
                : "bg-indigo-500 text-white"
            }`}
          >
            {count}
          </span>
        )}
      </div>

      <div
        className="w-full aspect-[1.2] transition-transform duration-200 hover:scale-105"
        aria-label={`Interactive lung diagram for ${label}`}
      >
        <LungIcon
          selectedQuadrants={quadrantData}
          hoveredQuadrant={hoveredQuadrant}
          onQuadrantClick={handleQuadrantClick}
          onQuadrantHover={setHoveredQuadrant}
          selectionColor={selectionColor}
        />
      </div>
      <div className="grid grid-cols-2 gap-1 w-full no-print">
        {(Object.keys(quadrantData) as QuadrantKey[]).map((q) => (
          <button
            type="button"
            key={q}
            aria-label={`${label} ${quadrantNames[q]} lung zone`}
            aria-pressed={quadrantData[q]}
            onClick={() => handleQuadrantClick(q)}
            className={`min-h-11 text-xs rounded border px-2 py-2 ${quadrantData[q] ? "bg-slate-200 border-slate-400" : "border-slate-200"}`}
          >
            {displayCodes[q]} · {quadrantNames[q]}
          </button>
        ))}
      </div>

      <p className="mt-2 text-xs text-center text-slate-600">
        Image left = patient&apos;s right · Image right = patient&apos;s left
      </p>

      <div className="mt-1 h-4">
        <span
          className={`text-xs font-medium transition-opacity duration-300 ${count > 0 ? "opacity-100" : "opacity-0"} ${selectionColor === "teal" ? "text-teal-700" : "text-indigo-700"}`}
        >
          {count === 4 ? "Diffused" : count > 0 ? "Localized" : ""}
        </span>
      </div>
    </div>
  );
};

export default QuadrantSelector;
