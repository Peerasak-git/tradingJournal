'use client';

import React, { useState, useRef, useEffect } from 'react';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
}

const PALETTE = [
  // Grayscale
  ['#ffffff', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b', '#475569', '#1e293b'],
  // Red
  ['#fee2e2', '#fecaca', '#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c', '#7f1d1d'],
  // Orange
  ['#ffedd5', '#fed7aa', '#fdba74', '#fb923c', '#f97316', '#ea580c', '#c2410c', '#7c2d12'],
  // Yellow
  ['#fef9c3', '#fef08a', '#fde047', '#facc15', '#eab308', '#ca8a04', '#a16207', '#713f12'],
  // Green
  ['#dcfce7', '#bbf7d0', '#86efac', '#4ade80', '#22c55e', '#16a34a', '#15803d', '#14532d'],
  // Teal
  ['#ccfbf1', '#99f6e4', '#5eead4', '#2dd4bf', '#14b8a6', '#0d9488', '#0f766e', '#134e4a'],
  // Cyan
  ['#cffafe', '#a5f3fc', '#67e8f9', '#22d3ee', '#06b6d4', '#0891b2', '#0e7490', '#164e63'],
  // Blue
  ['#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e3a8a'],
  // Purple
  ['#f3e8ff', '#e9d5ff', '#d8b4fe', '#c084fc', '#a855f7', '#9333ea', '#7e22ce', '#581c87'],
  // Pink
  ['#fce7f3', '#fbcfe8', '#f9a8d4', '#f472b6', '#ec4899', '#db2777', '#be185d', '#831843'],
];

// Transpose the matrix so each row is a shade and each column is a hue (like the image)
const GRID: string[][] = Array.from({ length: 8 }, (_, rowIndex) => 
  PALETTE.map(hueColumn => hueColumn[rowIndex])
);

export default function ColorPicker({ color, onChange, label }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={popoverRef}>
      {label && <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{label}</label>}
      
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono uppercase focus:ring-2 focus:ring-blue-500 transition-all"
      >
        <div 
          className="w-6 h-6 rounded-md shadow-sm border border-slate-200 dark:border-slate-800"
          style={{ backgroundColor: color }}
        />
        <span className="flex-1 text-left">{color}</span>
      </button>

      {/* Popover */}
      {isOpen && (
        <div className="absolute z-50 top-full left-0 mt-2 p-3 bg-[#1e1e1e] border border-zinc-800 rounded-xl shadow-2xl w-max animate-fade-in">
          <div className="flex flex-col gap-1.5">
            {GRID.map((row, rIdx) => (
              <div key={rIdx} className="flex gap-1.5">
                {row.map((c, cIdx) => (
                  <button
                    key={cIdx}
                    onClick={() => {
                      onChange(c);
                      setIsOpen(false);
                    }}
                    className={`w-6 h-6 rounded-sm transition-transform hover:scale-110 ${color.toLowerCase() === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1e1e1e] scale-110 z-10' : ''}`}
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-zinc-800">
            <div className="flex items-center gap-3">
              <span className="text-zinc-400 text-xs">Custom HEX</span>
              <input 
                type="text" 
                value={color}
                onChange={(e) => onChange(e.target.value)}
                className="flex-1 bg-black/30 border border-zinc-700 rounded-md px-2 py-1 text-xs text-white font-mono uppercase focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
