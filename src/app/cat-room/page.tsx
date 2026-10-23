'use client';

import React, { useEffect, useState } from 'react';
import PixelObject from '@/components/PixelObject';
import { Cat, Sparkles, ShieldCheck, AlertTriangle, CheckCircle2, XCircle, Heart } from 'lucide-react';
import { getTrades, getReviews } from '@/lib/clientStorage';
import { evaluateDiscipline, DisciplineMetrics } from '@/lib/discipline';

export default function CatRoom() {
  const [discipline, setDiscipline] = useState<DisciplineMetrics | null>(null);

  useEffect(() => {
    const loadDiscipline = async () => {
      try {
        const [trades, reviews] = await Promise.all([getTrades(), getReviews()]);
        setDiscipline(evaluateDiscipline(trades, reviews));
      } catch (err) {
        console.error('Error loading discipline in CatRoom:', err);
      }
    };
    loadDiscipline();
  }, []);
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl mb-12 relative z-10">
        {/* Today's Discipline Card */}
        {discipline && (
          <div className={`lg:col-span-2 glass-card p-6 md:p-8 rounded-3xl border shadow-xl transition-all duration-300 ${
            discipline.mood === 'TILT'
              ? 'border-rose-400 bg-rose-50/40 dark:bg-rose-950/20'
              : discipline.mood === 'WARNING'
              ? 'border-amber-400 bg-amber-50/40 dark:bg-amber-950/20'
              : discipline.mood === 'HAPPY'
              ? 'border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20'
              : 'border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5 border-b border-black/5 dark:border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">
                  {discipline.mood === 'HAPPY' ? '😺' : discipline.mood === 'WARNING' ? '😿' : discipline.mood === 'TILT' ? '🛑' : '🐱'}
                </span>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    {discipline.title}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    ประเมินวินัยและการคุมอารมณ์ของการเทรดประจำวันนี้
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">คะแนนวินัย:</span>
                <span className={`text-xl font-black px-3 py-1 rounded-xl ${
                  discipline.score >= 80 ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300' :
                  discipline.score >= 60 ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300' :
                  discipline.score >= 40 ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300' :
                  'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300'
                }`}>
                  {discipline.score}/100
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden mb-6">
              <div 
                className={`h-full transition-all duration-700 rounded-full ${
                  discipline.score >= 80 ? 'bg-emerald-500' :
                  discipline.score >= 60 ? 'bg-blue-500' :
                  discipline.score >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${discipline.score}%` }}
              />
            </div>

            {/* Cat Speech Balloon */}
            <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 mb-6 relative">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 font-bold text-sm">
                  🐾
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                    คำพูดจากน้องแมว ณ ตอนนี้
                  </div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                    &ldquo;{discipline.message}&rdquo;
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1.5 flex items-center gap-1.5">
                    <Sparkles size={13} className="text-amber-500 shrink-0" />
                    <span>คำแนะนำ: {discipline.advice}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Checklist Matrix */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Metric 1 */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-white/[0.06]">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">ไม้เทรดวันนี้</div>
                <div className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>{discipline.todayTradeCount} ไม้</span>
                  {discipline.isOvertrading ? (
                    <span className="text-[10px] text-rose-500 font-bold">(Overtrade)</span>
                  ) : (
                    <CheckCircle2 size={14} className="text-emerald-500" />
                  )}
                </div>
              </div>

              {/* Metric 2 */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-white/[0.06]">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">การตั้ง SL</div>
                <div className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  {discipline.noSlTradesCount === 0 ? (
                    <>
                      <CheckCircle2 size={14} className="text-emerald-500" />
                      <span>ตั้งครบทุกไม้</span>
                    </>
                  ) : (
                    <>
                      <XCircle size={14} className="text-rose-500" />
                      <span className="text-rose-500">{discipline.noSlTradesCount} ไม้ไร้ SL</span>
                    </>
                  )}
                </div>
              </div>

              {/* Metric 3 */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-white/[0.06]">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">สภาวะจิตใจ</div>
                <div className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  {discipline.isRevengeTrading ? (
                    <>
                      <AlertTriangle size={14} className="text-rose-500" />
                      <span className="text-rose-500">เสี่ยง Tilt</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={14} className="text-emerald-500" />
                      <span>สงบนิ่งดี</span>
                    </>
                  )}
                </div>
              </div>

              {/* Metric 4 */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-white/[0.06]">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">ทำตามแผน</div>
                <div className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  {discipline.followedRules ? (
                    <>
                      <CheckCircle2 size={14} className="text-emerald-500" />
                      <span>ตามกฎ</span>
                    </>
                  ) : (
                    <>
                      <XCircle size={14} className="text-rose-500" />
                      <span className="text-rose-500">ฝ่าฝืนกฎ</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Welcome & Info Card */}
        <div className="glass-card p-6 md:p-8 rounded-3xl border border-amber-200/50 dark:border-amber-900/30 bg-amber-50/30 dark:bg-amber-900/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-black text-lg mb-3">
              <Heart size={20} className="fill-amber-500 text-amber-500" />
              <span>ยินดีต้อนรับสู่ Cat Room!</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-sm mb-4 leading-relaxed font-medium">
              น้องแมวตัวนี้เป็น **Trading Buddy** ประจำตัวคุณ จะคอยเดินเล่นและจับตาดูวินัยการเทรด หากคุณรักษาวินัยดี น้องจะคอยให้กำลังใจ แต่ถ้าเริ่มใจร้อน น้องจะคอยร้องเตือนสติครับ
            </p>
          </div>
          <p className="text-slate-400 dark:text-slate-500 text-xs italic border-t border-amber-200/40 dark:border-amber-800/30 pt-3">
            * คลิกที่ตัวน้องแมวที่กำลังเดินเล่นด้านล่าง เพื่อเปิด/ปิดกล่องคำพูดเตือนสติได้ตลอดเวลา *
          </p>
        </div>
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
