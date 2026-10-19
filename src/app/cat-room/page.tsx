'use client';

import PixelObject from '@/components/PixelObject';
import { Cat } from 'lucide-react';

export default function CatRoom() {
  const foodBowlFrames = [
    "                ",
    "                ",
    "                ",
    "                ",
    "                ",
    "                ",
    "                ",
    "      2222      ",
    "     222222     ",
    "    11111111    ",
    "   1111111111   ",
    "   1111111111   ",
    "   1111111111   ",
    "    11111111    ",
    "                ",
    "                "
  ];
  const bowlColors = {
    '0': '#000000', // black outline (optional)
    '1': '#94a3b8', // slate-400 (bowl)
    '2': '#b45309', // amber-700 (food)
    ' ': 'transparent'
  };

  const litterBoxFrames = [
    "                                ",
    "                                ",
    "                                ",
    "                                ",
    "                                ",
    "                                ",
    "                                ",
    "                                ",
    "   11111111111111111111111111   ",
    "  1122222222222222222222222211  ",
    "  1233333333333333333333333321  ",
    "  1233333333333333333333333321  ",
    "  1222222222222222222222222221  ",
    "  1111111111111111111111111111  ",
    "                                ",
    "                                "
  ];
  const litterColors = {
    '1': '#9ca3af', // gray-400 (box outer)
    '2': '#d1d5db', // gray-300 (box inner rim)
    '3': '#fde68a', // amber-200 (sand)
    ' ': 'transparent'
  };

  const scratchPostFrames = [
    "      1111      ",
    "      1111      ",
    "      2222      ",
    "      2222      ",
    "      2222      ",
    "      2222      ",
    "      2222      ",
    "      2222      ",
    "      2222      ",
    "      2222      ",
    "      2222      ",
    "      2222      ",
    "    11111111    ",
    "   1111111111   ",
    "   1111111111   ",
    "                "
  ];
  const scratchColors = {
    '1': '#b45309', // wood
    '2': '#fef3c7', // rope
    ' ': 'transparent'
  };

  return (
    <main className="p-6 md:p-8 animate-fade-in relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <div className="mb-8 relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-amber-500 text-white shadow-lg shadow-amber-500/20">
            <Cat size={20} strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">ห้องพักน้องแมว</h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
          โซนพักผ่อนสำหรับสัตว์เลี้ยงของคุณ มีทั้งชามข้าวและกระบะทราย 🐾
        </p>
      </div>

      <div className="glass-card mt-12 p-8 rounded-3xl border border-amber-200/50 dark:border-amber-900/30 max-w-2xl bg-amber-50/30 dark:bg-amber-900/10">
        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-4">ยินดีต้อนรับสู่ Cat Room!</h2>
        <p className="text-slate-600 dark:text-slate-300 mb-4 leading-relaxed font-medium">
          น้องแมวจะเดินมาเยี่ยมคุณในหน้านี้ (และหน้าอื่นๆ) คุณสามารถนั่งดูน้องกินข้าว นอนหลับ หรือวิ่งเล่นไปมาได้ เป็นการคลายเครียดหลังจากเทรดมาทั้งวัน 
        </p>
        <p className="text-slate-500 dark:text-slate-400 text-sm italic">
          * ปล่อยให้น้องเดินเล่นได้อย่างอิสระ ข้าวและกระบะทรายจะอยู่ด้านล่างสุดของจอ *
        </p>
      </div>

      {/* Room Scenery (Floor and baseboard) */}
      <div className="fixed bottom-0 left-0 right-0 h-10 bg-amber-100 dark:bg-slate-800 z-[9980] border-t-[4px] border-amber-200 dark:border-slate-700 shadow-inner" />
      <div className="fixed bottom-10 left-0 right-0 h-4 bg-amber-50 dark:bg-slate-900 z-[9981]" />

      {/* Pixel Art Props Container */}
      {/* Set to z-[9985] to be just behind the cat (z-9999) but in front of the floor */}
      <div className="fixed bottom-10 left-0 right-0 pointer-events-none z-[9985] flex justify-between items-end px-[10vw] lg:px-[20vw] xl:px-[25vw] pb-1">
        
        {/* Food Bowl */}
        <div className="transform hover:-translate-y-1 transition-transform">
          <PixelObject data={foodBowlFrames} colors={bowlColors} scale={4} />
        </div>

        {/* Scratching Post */}
        <div className="transform hover:-translate-y-1 transition-transform">
          <PixelObject data={scratchPostFrames} colors={scratchColors} scale={4} />
        </div>

        {/* Litter Box */}
        <div className="transform hover:-translate-y-1 transition-transform">
          <PixelObject data={litterBoxFrames} colors={litterColors} scale={4} />
        </div>

      </div>
    </main>
  );
}
