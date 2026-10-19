import React from 'react';

interface PixelObjectProps {
  data: string[];
  colors: Record<string, string>;
  scale?: number;
  className?: string;
}

export default function PixelObject({ data, colors, scale = 4, className = '' }: PixelObjectProps) {
  return (
    <div className={`flex flex-col ${className}`}>
      {data.map((row, rowIdx) => (
        <div key={rowIdx} className="flex">
          {row.split('').map((char, colIdx) => (
            <div 
              key={colIdx} 
              style={{ 
                width: `${scale}px`, 
                height: `${scale}px`, 
                backgroundColor: colors[char] || 'transparent' 
              }} 
            />
          ))}
        </div>
      ))}
    </div>
  );
}
