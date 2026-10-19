'use client';

import React, { useState, useEffect, useRef } from 'react';

type PetState = 'WALK' | 'SIT' | 'IDLE' | 'SLEEP' | 'RUN' | 'EAT' | 'PLAY';

export default function PixelPet() {
  const [isEnabled, setIsEnabled] = useState(true);
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [direction, setDirection] = useState<'LEFT' | 'RIGHT'>('RIGHT');
  const [state, setState] = useState<PetState>('WALK');
  const [frame, setFrame] = useState(0);
  
  // Activity Transitions
  const [targetActivity, setTargetActivity] = useState<PetState | null>(null);
  const [isEnteringRoom, setIsEnteringRoom] = useState(false);
  const [isExitingRoom, setIsExitingRoom] = useState(false);
  
  // Pet Stats (0-100)
  const [energy, setEnergy] = useState(100); // Replenished by SLEEP
  const [hunger, setHunger] = useState(100); // Replenished by EAT
  const [fun, setFun] = useState(100);       // Replenished by PLAY
  
  const containerRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef(position);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    // Initial load
    const saved = localStorage.getItem('petEnabled');
    if (saved === 'false') setIsEnabled(false);

    const handleToggle = () => {
      const current = localStorage.getItem('petEnabled');
      setIsEnabled(current !== 'false');
    };

    window.addEventListener('petToggle', handleToggle);
    return () => window.removeEventListener('petToggle', handleToggle);
  }, []);

  const frames = [
    // Frame 0 (Sit/Idle/Eat)
    [
      "                          ",
      "  00000        00000      ",
      " 03333300000000333330     ",
      " 03331111111111111330     ",
      " 03111111111111111130     ",
      " 01111000111100011110     ",
      " 01110040011004001110     ",
      " 01110000011000001110     ",
      " 01130000311300003110     ",
      " 01113331110113331110     ",
      "  001111111111111100      ",
      "    00000000000000        ",
      "    01111111111110        ",
      "    01111111111110     00 ",
      "    01111111111110    010 ",
      "    01110111101110   0110 ",
      "    01110111101110000110  ",
      "    0111011110111011110   ",
      "    011101111011101100    ",
      "    0222011110222000      ",
      "    02220222202220        ",
      "    00000000000000        "
    ],
    // Frame 1 (Walk/Run/Play)
    [
      "                          ",
      "                          ",
      "  00000        00000      ",
      " 03333300000000333330     ",
      " 03331111111111111330     ",
      " 03111111111111111130     ",
      " 01111000111100011110     ",
      " 01110040011004001110     ",
      " 01110000011000001110     ",
      " 01130000311300003110     ",
      " 01113331110113331110     ",
      "  001111111111111100      ",
      "    01111111111110    00  ",
      "    01111111111110   010  ",
      "    01111111111110  0110  ",
      "    01110111101110 0110   ",
      "    011101111011100110    ",
      "    01110111101110110     ",
      "    0111011110111000      ",
      "    02220111102220        ",
      "    02220222202220        ",
      "    00000000000000        "
    ],
    // Frame 2 (Sleep)
    [
      "                          ",
      "  00000        00000      ",
      " 03333300000000333330     ",
      " 03331111111111111330     ",
      " 03111111111111111130     ",
      " 01111111111111111110     ",
      " 01110000011000001110     ",
      " 01111111111111111110     ",
      " 01131111311311113110     ",
      " 01113331110113331110     ",
      "  001111111111111100      ",
      "    00000000000000        ",
      "    01111111111110        ",
      "    01111111111110     00 ",
      "    01111111111110    010 ",
      "    01110111101110   0110 ",
      "    01110111101110000110  ",
      "    0111011110111011110   ",
      "    011101111011101100    ",
      "    0222011110222000      ",
      "    02220222202220        ",
      "    00000000000000        "
    ]
  ];

  const colors: Record<string, string> = {
    '0': '#000000', // black
    '1': '#9ca3af', // gray-400
    '2': '#6b7280', // gray-500
    '3': '#f472b6', // pink-400
    '4': '#ffffff', // white
    ' ': 'transparent'
  };

  useEffect(() => {
    if (!isEnabled) return;
    const movePet = () => {
      if (isEnteringRoom) {
        const speed = 3.5;
        setPosition(prev => {
          const nextX = prev.x + (direction === 'RIGHT' ? speed : -speed);
          if (direction === 'RIGHT' && nextX > window.innerWidth) {
            setIsEnteringRoom(false);
            setState(targetActivity!);
            return { ...prev, x: nextX };
          }
          if (direction === 'LEFT' && nextX < -120) {
            setIsEnteringRoom(false);
            setState(targetActivity!);
            return { ...prev, x: nextX };
          }
          return { ...prev, x: nextX };
        });
        return;
      }

      if (isExitingRoom) {
        const speed = 2.5;
        setPosition(prev => {
          const nextX = prev.x + (direction === 'RIGHT' ? speed : -speed);
          const margin = window.innerWidth * 0.2;
          if (direction === 'RIGHT' && nextX > margin) {
            setIsExitingRoom(false);
            setState('WALK');
          }
          if (direction === 'LEFT' && nextX < window.innerWidth - margin) {
            setIsExitingRoom(false);
            setState('WALK');
          }
          return { ...prev, x: nextX };
        });
        return;
      }

      if (state === 'WALK' || state === 'RUN') {
        const speed = state === 'RUN' ? 3.5 : 1.5;
        setPosition(prev => {
          let newX = prev.x + (direction === 'RIGHT' ? speed : -speed);

          // Boundary check
          if (newX > window.innerWidth - 100) {
            setDirection('LEFT');
            return prev;
          }
          if (newX < 0) {
            setDirection('RIGHT');
            return prev;
          }
          return { ...prev, x: newX };
        });
      }
    };

    const intervalTime = (state === 'RUN' || state === 'PLAY') ? 80 : 150;
    const interval = setInterval(() => {
      movePet();
      setFrame(f => (f + 1) % 2);
    }, intervalTime);

    return () => clearInterval(interval);
  }, [state, direction, isEnteringRoom, isExitingRoom, targetActivity, isEnabled]);

  useEffect(() => {
    if (!isEnabled) return;
    // Stat drain and recovery loop
    const statInterval = setInterval(() => {
      setEnergy(prev => {
        if (state === 'SLEEP') return Math.min(100, prev + 5);
        if (state === 'RUN') return Math.max(0, prev - 2);
        return Math.max(0, prev - 0.5);
      });
      
      setHunger(prev => {
        if (state === 'EAT') return Math.min(100, prev + 8);
        if (state === 'RUN') return Math.max(0, prev - 1.5);
        return Math.max(0, prev - 0.5);
      });
      
      setFun(prev => {
        if (state === 'PLAY') return Math.min(100, prev + 6);
        if (state === 'SLEEP') return Math.max(0, prev - 0.1);
        return Math.max(0, prev - 0.8);
      });
    }, 1000);
    return () => clearInterval(statInterval);
  }, [state, isEnabled]);

  useEffect(() => {
    if (!isEnabled) return;
    // Activity Completion Check
    if (targetActivity && !isEnteringRoom && !isExitingRoom) {
      let done = false;
      if (targetActivity === 'SLEEP' && energy >= 100) done = true;
      if (targetActivity === 'EAT' && hunger >= 100) done = true;
      if (targetActivity === 'PLAY' && fun >= 100) done = true;

      if (done) {
        setIsExitingRoom(true);
        setTargetActivity(null);
        setState('RUN');
        setDirection(positionRef.current.x <= 0 ? 'RIGHT' : 'LEFT');
      }
    }
  }, [energy, hunger, fun, targetActivity, isEnteringRoom, isExitingRoom, isEnabled]);

  useEffect(() => {
    if (!isEnabled) return;
    // AI Decision loop
    const aiInterval = setInterval(() => {
      if (targetActivity || isEnteringRoom || isExitingRoom) return;

      let nextState: PetState = 'IDLE';
      
      // Urgent needs take priority
      if (energy < 20) {
        nextState = 'SLEEP';
      } else if (hunger < 30) {
        nextState = 'EAT';
      } else if (fun < 30) {
        nextState = 'PLAY';
      } else {
        const rand = Math.random();
        if (energy < 50 && rand < 0.4) {
          nextState = 'SLEEP';
        } else if (hunger < 50 && rand < 0.4) {
          nextState = 'EAT';
        } else if (fun < 50 && rand < 0.4) {
          nextState = 'PLAY';
        } else {
          const behaviorRand = Math.random();
          if (behaviorRand < 0.25) nextState = 'WALK';
          else if (behaviorRand < 0.35) nextState = 'RUN';
          else if (behaviorRand < 0.5) nextState = 'SIT';
          else if (behaviorRand < 0.6) nextState = 'SLEEP';
          else if (behaviorRand < 0.7) nextState = 'EAT';
          else if (behaviorRand < 0.85) nextState = 'PLAY';
          else nextState = 'IDLE';
        }
      }

      if (['SLEEP', 'EAT', 'PLAY'].includes(nextState)) {
        setTargetActivity(nextState);
        setIsEnteringRoom(true);
        setState('RUN');
        setDirection(positionRef.current.x > (typeof window !== 'undefined' ? window.innerWidth / 2 : 500) ? 'RIGHT' : 'LEFT');
      } else {
        setState(nextState);
        if (nextState === 'WALK' || nextState === 'RUN') {
          setDirection(Math.random() > 0.5 ? 'RIGHT' : 'LEFT');
        }
      }
    }, 4000);

    return () => clearInterval(aiInterval);
  }, [energy, hunger, fun, targetActivity, isEnteringRoom, isExitingRoom, isEnabled]);

  const renderPixel = (char: string, idx: number) => (
    <div 
      key={idx} 
      style={{ 
        width: '4px', 
        height: '4px', 
        backgroundColor: colors[char] || 'transparent' 
      }} 
    />
  );

  const getSpeechBubble = () => {
    switch (state) {
      case 'SIT': return 'Meow! 🐾';
      case 'SLEEP': return 'Zzz... 💤';
      case 'EAT': return 'Nom nom 🐟';
      case 'PLAY': return 'Purrr! 🧶';
      case 'RUN': return 'Zoom! 💨';
      default: return null;
    }
  };

  const bubbleText = getSpeechBubble();
  const currentFrame = state === 'SLEEP' ? 2 : (state === 'IDLE' || state === 'SIT' || state === 'EAT' ? 0 : frame);

  const StatBar = ({ label, value, colorClass }: { label: string, value: number, colorClass: string }) => (
    <div className="flex flex-col gap-0.5">
      <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 leading-none">{label}</span>
      <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full ${colorClass} transition-all duration-500`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );

  if (!isEnabled) return null;

  return (
    <div 
      className="fixed bottom-10 z-[9999] select-none transition-all duration-300 ease-linear flex flex-col items-center gap-2 group pointer-events-none"
      style={{ left: position.x }}
    >
      {/* HUD - Shows on hover */}
      <div className="flex gap-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-auto cursor-default transform translate-y-2 group-hover:translate-y-0">
        <StatBar label="Energy" value={energy} colorClass={energy > 30 ? 'bg-win-500' : 'bg-loss-500'} />
        <StatBar label="Hunger" value={hunger} colorClass={hunger > 30 ? 'bg-amber-500' : 'bg-loss-500'} />
        <StatBar label="Fun" value={fun} colorClass={fun > 30 ? 'bg-violet-500' : 'bg-loss-500'} />
      </div>

      <div className="relative pointer-events-auto cursor-pointer" style={{ transform: `scaleX(${direction === 'RIGHT' ? 1 : -1})` }}>
        <div 
          className="flex flex-col"
          style={{ 
            width: '104px', // 26 pixels * 4px size
            height: '88px'
          }}
        >
          {frames[currentFrame].map((row, rowIdx) => (
            <div key={rowIdx} className="flex">
              {row.split('').map((char, colIdx) => renderPixel(char, colIdx))}
            </div>
          ))}
        </div>

        {/* Speech Bubble */}
        {bubbleText && (
          <div className={`absolute -top-10 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-full text-[10px] font-black shadow-lg ${state === 'SLEEP' ? 'animate-pulse' : 'animate-bounce'}`}>
            <span style={{ display: 'inline-block', transform: `scaleX(${direction === 'RIGHT' ? 1 : -1})` }}>
              {bubbleText}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
