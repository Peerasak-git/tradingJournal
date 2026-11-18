'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '@/context/LanguageContext';
import {
  Sparkles,
  X,
  Brain,
  ShieldAlert,
  Zap,
  Activity,
  Trophy,
  Heart,
  TrendingUp,
  Clock,
  CheckCircle2,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

interface WhatsNewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ReleaseItem {
  icon: any;
  color: string;
  titleTh: string;
  descTh: string;
  subItems?: string[];
  href?: string;
}

interface Release {
  version: string;
  date: string;
  titleTh: string;
  badgeTh: string;
  items: ReleaseItem[];
}

const RELEASES: Release[] = [
  {
    version: 'v2.2 (ล่าสุด)',
    date: 'พฤศจิกายน 2026',
    titleTh: '🚀 ยกระดับจิตวิทยาระดับโปร: Mindset Master Hub & Spot Gold',
    badgeTh: 'Major Update',
    items: [
      {
        icon: Brain,
        color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
        titleTh: 'เปิดตัวหน้าศูนย์พัฒนาจิตวิทยา (Mindset & Psychology Hub)',
        descTh: 'เพิ่มเมนูใหม่ในแถบ Sidebar รวบรวม 4 เครื่องมือทรงพลังสำหรับเทรดเดอร์มืออาชีพ:',
        subItems: [
          '🏆 A/B/C Game Spectrum: วิเคราะห์ระดับจิตวิทยาตามโมเดล Jared Tendler (The Inchworm Concept) พร้อม Diagnostic Checklist',
          '⚡ In-Trade Emotion & Mid-Trade Urges: บันทึกแรงกระตุ้นขณะถือออเดอร์ (กลัวกำไรหด, จ้องจอตลอดเวลา, โลภเลื่อน TP) พร้อมตรวจจับ Open Trades',
          '🧘 Zen Reset & Box Breathing 4-4-4-4: ห้องฝึกหายใจอินเทอร์แอคทีฟลด Cortisol พร้อมการ์ด 5 สัจธรรมแห่งตลาด (Mark Douglas)',
          '🧬 Bio & Lifestyle Correlation: ติดตามชั่วโมงนอน คุณภาพการนอน พลังงานร่างกาย และความเครียดภายนอก พร้อมวิเคราะห์ผลกระทบต่อผลกำไร',
        ],
        href: '/mindset',
      },
      {
        icon: TrendingUp,
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        titleTh: 'ปรับปรุงระบบดึงราคาทองคำ Spot Gold Real-time (XAUUSD)',
        descTh: 'เชื่อมต่อ Feed ราคาทองคำแท่งโลกจริง (Spot Gold) แทนเหรียญคริปโต พร้อมแสดงผลและคำนวณ Floating PnL ของออเดอร์สดอย่างแม่นยำ',
        href: '/history',
      },
    ],
  },
  {
    version: 'v2.1',
    date: 'พฤศจิกายน 2026',
    titleTh: '🛡️ เกราะป้องกันพอร์ต: Mindset Checklist & Tilt Circuit Breaker',
    badgeTh: 'Psychology Protection',
    items: [
      {
        icon: ShieldAlert,
        color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
        titleTh: 'Tilt Circuit Breaker (ระบบตัดวงจรอารมณ์อัตโนมัติ)',
        descTh: 'ตรวจจับการแพ้ติดกัน 2 ไม้, เทรดถี่เกินไปใน 1 ชั่วโมง, หรือขาดทุนเกินลิมิต พร้อมแบนเนอร์ฉุกเฉินและปุ่มพักใจทันที',
      },
      {
        icon: CheckCircle2,
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        titleTh: 'Pre-Trade Mindset Checklist (ด่านตรวจสติ 4 ข้อ)',
        descTh: 'เช็คลิสต์ก่อนกดยืนยันออเดอร์: ตรวจสอบความถูกต้องของ Setup, ขนาดความเสี่ยง, การยอมรับ SL, และสติสัมปชัญญะ',
      },
      {
        icon: Zap,
        color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
        titleTh: 'Cognitive Biases Tracker & Estimated Financial Damage',
        descTh: 'แท็กกับดักความคิด 7 รูปแบบ (เช่น FOMO Chase, Moved SL, Revenge Lot, Paper Hands) พร้อมคำนวณมูลค่าความเสียหายที่เสียไป ($)',
      },
      {
        icon: Heart,
        color: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
        titleTh: 'Daily Post-Market Emotional De-brief',
        descTh: 'โมดอลประเมินสภาวะจิตวิทยาหลังปิดตลาด ให้คะแนนวินัย 1-10 ⭐ บันทึกสิ่งที่ทำได้ดี และบทเรียนสำคัญประจำวัน',
      },
    ],
  },
  {
    version: 'v2.0',
    date: 'พฤศจิกายน 2026',
    titleTh: '✨ Honeycomb Emotional Check-in & AI Auto Slip Scanner',
    badgeTh: 'Foundation',
    items: [
      {
        icon: Sparkles,
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        titleTh: 'Honeycomb 6-Hexagon Pre-Trade Check-in',
        descTh: 'ประเมินสภาวะอารมณ์ก่อนเริ่มเทรดแบบรังผึ้ง 6 ด้าน พร้อมระบบเก็บ Log เช้า / บ่าย / เย็น / ค่ำ',
      },
      {
        icon: Clock,
        color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        titleTh: 'Trading Cooldown & Countdown Timer (พักใจ)',
        descTh: 'ระบบตั้งเวลานับถอยหลังพักการเทรดเพื่อรีเซ็ตอารมณ์ พร้อมเหตุผลและคำแนะนำในการกู้คืนสมาธิ',
      },
    ],
  },
];

export default function WhatsNewModal({ isOpen, onClose }: WhatsNewModalProps) {
  const { language } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#161616] border border-slate-200 dark:border-white/[0.1] rounded-3xl shadow-2xl shadow-black/40 overflow-hidden z-10 flex flex-col max-h-[90vh] animate-fade-in">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-white/[0.08] flex items-center justify-between bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  {language === 'th' ? "What's New มีอะไรใหม่ในระบบ" : "What's New in Trading Journal"}
                </h2>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 uppercase">
                  v2.2 LIVE
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'th'
                  ? 'สรุปการอัปเดตฟีเจอร์และระบบล่าสุดที่คุณสามารถใช้งานได้แล้ววันนี้'
                  : 'Latest features, improvements, and trading psychology tools'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
          {RELEASES.map((rel, idx) => (
            <div key={rel.version} className="space-y-3">
              {/* Release Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                    {rel.version}
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {rel.titleTh}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                    <Calendar size={11} />
                    {rel.date}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-500 border border-blue-500/20">
                    {rel.badgeTh}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {rel.items.map((item, itemIdx) => {
                  const ItemIcon = item.icon;
                  return (
                    <div
                      key={itemIdx}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.05] hover:border-slate-300 dark:hover:border-white/[0.1] transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${item.color}`}>
                          <ItemIcon size={16} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                              {item.titleTh}
                            </h4>
                            {item.href && (
                              <Link
                                href={item.href}
                                onClick={onClose}
                                className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                              >
                                {language === 'th' ? 'เปิดใช้งาน →' : 'Explore →'}
                              </Link>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                            {item.descTh}
                          </p>

                          {/* Subitems */}
                          {item.subItems && (
                            <div className="mt-2.5 space-y-1.5 pl-2 border-l-2 border-purple-500/30">
                              {item.subItems.map((sub, subIdx) => (
                                <p key={subIdx} className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                                  {sub}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-between bg-slate-50 dark:bg-white/[0.01]">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            ระบบอัปเดตต่อเนื่องเพื่อประสิทธิภาพสูงสุดของพอร์ตคุณ
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 transition cursor-pointer"
          >
            {language === 'th' ? 'เข้าใจแล้ว / ปิดหน้าต่าง' : 'Got it / Close'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
