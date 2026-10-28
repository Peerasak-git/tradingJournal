'use client';

import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import {
  Star, PlusCircle, Trash2, Edit2, X,
  ChevronLeft, ChevronRight, BookOpen
} from 'lucide-react';
import { Review } from '@/types/review';
import { TranslationKey } from '@/lib/translations';
import { getReviews, addOrUpdateReview, deleteReview } from '@/lib/clientStorage';

function getFirstDayOffset(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getWeekDays(dateStr: string): string[] {
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(d);
    dd.setDate(d.getDate() + diff + i);
    return dd.toISOString().split('T')[0];
  });
}

const EMOTIONS: { key: string; tKey: TranslationKey; emoji: string }[] = [
  { key: 'calm',        tKey: 'emotionCalm',        emoji: '😌' },
  { key: 'focused',     tKey: 'emotionFocused',     emoji: '🎯' },
  { key: 'confident',   tKey: 'emotionConfident',   emoji: '💪' },
  { key: 'disciplined', tKey: 'emotionDisciplined', emoji: '🧘' },
  { key: 'neutral',     tKey: 'emotionNeutral',     emoji: '🧊' },
  { key: 'excited',     tKey: 'emotionExcited',     emoji: '🤩' },
  { key: 'anxious',     tKey: 'emotionAnxious',     emoji: '😰' },
  { key: 'fearful',     tKey: 'emotionFearful',     emoji: '😨' },
  { key: 'greedy',      tKey: 'emotionGreedy',      emoji: '🤑' },
  { key: 'impulsive',   tKey: 'emotionImpulsive',   emoji: '😤' },
  { key: 'frustrated',  tKey: 'emotionFrustrated',  emoji: '🤬' },
  { key: 'tired',       tKey: 'emotionTired',       emoji: '😴' },
];

function getReviewEmotions(review?: Review | null): { key: string; tKey: TranslationKey; emoji: string }[] {
  if (!review) return [];
  const keys: string[] = review.emotions && Array.isArray(review.emotions) && review.emotions.length > 0
    ? review.emotions
    : review.emotion
    ? review.emotion.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
    : [];
  return keys
    .map(k => EMOTIONS.find(e => e.key === k))
    .filter((e): e is { key: string; tKey: TranslationKey; emoji: string } => !!e);
}

const RATING_COLORS = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];

const EMPTY_FORM = {
  date: '',
  rating: 5,
  notes: '',
  emotion: '',
  emotions: [] as string[],
  followedRules: true as boolean | null,
  mistakes: '',
  lessons: '',
};

export default function ReviewsPage() {
  const { t, language } = useLanguage();
  const locale = language === 'th' ? 'th-TH' : 'en-US';
  const today = new Date().toISOString().split('T')[0];

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(today);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [viewMode, setViewMode] = useState<'all' | 'day' | 'week' | 'month'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM, date: today });

  // Locale-aware names
  const calDayNames = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date(2024, 0, 1 + i); // Jan 1 2024 = Monday
      return d.toLocaleDateString(locale, { weekday: 'narrow' });
    }), [locale]);

  const weekDayNames = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date(2024, 0, 1 + i);
      return d.toLocaleDateString(locale, { weekday: 'short' });
    }), [locale]);

  useEffect(() => { fetchReviews(); }, []);

  const fetchReviews = async () => {
    try {
      const data = await getReviews();
      setReviews(data);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const reviewsByDate = useMemo(() => {
    const map: Record<string, Review[]> = {};
    reviews.forEach(r => {
      if (!map[r.date]) map[r.date] = [];
      map[r.date].push(r);
    });
    return map;
  }, [reviews]);

  const allReviewsSorted = useMemo(() => {
    return [...reviews].sort((a, b) => {
      const dDiff = b.date.localeCompare(a.date);
      if (dDiff !== 0) return dDiff;
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
  }, [reviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const existing = editingId ? reviews.find(r => r.id === editingId) : null;
    const emList = formData.emotions || [];
    const primaryEmotion = emList[0] || formData.emotion || 'calm';
    const payload: Review = {
      id: editingId || 'rev-' + Math.random().toString(36).substr(2, 9),
      date: formData.date || new Date().toISOString().split('T')[0],
      rating: formData.rating || 3,
      emotions: emList,
      emotion: primaryEmotion,
      notes: formData.notes || '',
      mistakes: formData.mistakes,
      lessons: formData.lessons,
      followedRules: formData.followedRules ?? true,
      createdAt: existing ? existing.createdAt : new Date().toISOString()
    };
    try {
      await addOrUpdateReview(payload);
      setIsModalOpen(false);
      setEditingId(null);
      selectDate(payload.date);
      await fetchReviews();
    } catch (error) {
      console.error('Failed to save review:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteReviewConfirm'))) return;
    try {
      await deleteReview(id);
      fetchReviews();
    } catch (error) {
      console.error('Failed to delete review:', error);
    }
  };

  const openModal = (review?: Review, date?: string) => {
    if (review) {
      const emKeys = review.emotions && Array.isArray(review.emotions)
        ? review.emotions
        : review.emotion
        ? review.emotion.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
        : [];
      setFormData({
        date: review.date,
        rating: review.rating,
        notes: review.notes,
        emotion: emKeys[0] || review.emotion || '',
        emotions: emKeys,
        followedRules: review.followedRules ?? null,
        mistakes: review.mistakes || '',
        lessons: review.lessons || '',
      });
      setEditingId(review.id);
    } else {
      setFormData({ ...EMPTY_FORM, date: date || selectedDate, emotions: [] });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const selectDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    const d = new Date(dateStr + 'T12:00:00');
    setCalYear(d.getFullYear());
    setCalMonth(d.getMonth());
  };

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  };

  const calDays = getDaysInMonth(calYear, calMonth);
  const firstOffset = getFirstDayOffset(calYear, calMonth);
  const weekDays = getWeekDays(selectedDate);

  const calMonthLabel = new Date(calYear, calMonth, 1)
    .toLocaleDateString(locale, { month: 'long', year: 'numeric' });

  const monthReviews = useMemo(() =>
    reviews
      .filter(r => {
        const d = new Date(r.date + 'T12:00:00');
        return d.getFullYear() === calYear && d.getMonth() === calMonth;
      })
      .sort((a, b) => a.date.localeCompare(b.date)),
    [reviews, calYear, calMonth]
  );

  const avgRating = monthReviews.length > 0
    ? monthReviews.reduce((s, r) => s + r.rating, 0) / monthReviews.length
    : 0;

  const selectedReviews = reviewsByDate[selectedDate] || [];

  const formatDate = (dateStr: string, opts: Intl.DateTimeFormatOptions) =>
    new Date(dateStr + 'T12:00:00').toLocaleDateString(locale, opts);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            {t('dailyReviews')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {t('reviewSubtitle')}
          </p>
        </div>
        <button
          onClick={() => openModal(undefined, today)}
          className="flex items-center gap-2 px-4 py-2.5 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/30"
          style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)' }}
        >
          <PlusCircle size={18} />
          {t('addTodayReview')}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* LEFT: Calendar + Stats */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-slate-200 dark:border-zinc-800 p-4">
              {/* Month Nav */}
              <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth} className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-black text-slate-900 dark:text-white capitalize">
                  {calMonthLabel}
                </span>
                <button onClick={nextMonth} className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-1">
                {calDayNames.map((d, i) => (
                  <div key={i} className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400 py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-y-0.5">
                {Array.from({ length: firstOffset }).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: calDays }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const dayReviews = reviewsByDate[dateStr] || [];
                  const isSelected = dateStr === selectedDate;
                  const isToday = dateStr === today;

                  return (
                    <button
                      key={day}
                      onClick={() => { selectDate(dateStr); setViewMode('day'); }}
                      className={`
                        relative flex flex-col items-center justify-center h-8 rounded-lg text-xs font-bold transition-all
                        ${isSelected
                          ? 'text-white shadow-md'
                          : isToday
                          ? 'ring-2 ring-blue-400 text-blue-500 dark:text-blue-400'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800'}
                      `}
                      style={isSelected ? { background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)' } : {}}
                    >
                      {day}
                      {dayReviews.length > 0 && !isSelected && (
                        <div
                          className="absolute bottom-0.5 w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: RATING_COLORS[dayReviews[0].rating] || '#94a3b8' }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Rating legend */}
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800 flex flex-wrap gap-x-3 gap-y-1">
                {[1, 2, 3, 4, 5].map(r => (
                  <div key={r} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: RATING_COLORS[r] }} />
                    <span className="text-[9px] text-slate-400">{r}★</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly stats */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-slate-200 dark:border-zinc-800 p-4 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {t('monthStats')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { val: monthReviews.length, label: t('reviewsCount'), color: 'text-slate-900 dark:text-white' },
                  { val: avgRating > 0 ? avgRating.toFixed(1) : '—', label: t('avgRating'), color: 'text-yellow-400' },
                  { val: monthReviews.filter(r => r.rating >= 4).length, label: t('goodDays'), color: 'text-green-400' },
                  { val: monthReviews.filter(r => r.rating <= 2).length, label: t('hardDays'), color: 'text-red-400' },
                ].map(stat => (
                  <div key={stat.label} className="bg-slate-50 dark:bg-[#121212] rounded-xl p-3 text-center">
                    <p className={`text-2xl font-black ${stat.color}`}>{stat.val}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Content Panel */}
          <div className="space-y-4">
            {/* View Tabs */}
            <div className="flex gap-1 p-1 bg-slate-100 dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-zinc-800 w-fit">
              {([
                { mode: 'all', label: t('viewAll') },
                { mode: 'day', label: t('viewDay') },
                { mode: 'week', label: t('viewWeek') },
                { mode: 'month', label: t('viewMonth') },
              ] as const).map(({ mode, label }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                    viewMode === mode
                      ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* ─── ALL VIEW ─── */}
            {viewMode === 'all' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-black text-slate-900 dark:text-white">{t('dailyReviews')}</p>
                    <span className="px-2.5 py-0.5 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-lg text-xs font-bold">
                      {allReviewsSorted.length} {t('reviewsCount')}
                    </span>
                  </div>
                  <button
                    onClick={() => openModal(undefined, today)}
                    className="flex items-center gap-2 px-3.5 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-blue-500/20"
                  >
                    <PlusCircle size={15} />
                    {t('addReview')}
                  </button>
                </div>

                {allReviewsSorted.length === 0 ? (
                  <div className="p-16 text-center bg-white dark:bg-[#1a1a1a] rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-3">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                      <BookOpen size={24} className="text-slate-400" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">{t('noReviewsAll')}</p>
                    <button
                      onClick={() => openModal(undefined, today)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-all text-sm shadow-lg shadow-blue-500/30"
                    >
                      <PlusCircle size={16} />
                      {t('writeReview')}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allReviewsSorted.map((rev) => {
                      const revEmotions = getReviewEmotions(rev);
                      return (
                        <div
                          key={rev.id}
                          className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-slate-200 dark:border-zinc-800 p-5 space-y-4 transition-all hover:border-blue-300 dark:hover:border-blue-700/60"
                        >
                          <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100 dark:border-zinc-800">
                            <div className="flex items-center gap-3 flex-wrap">
                              <button
                                onClick={() => { selectDate(rev.date); setViewMode('day'); }}
                                className="font-black text-slate-900 dark:text-white text-base hover:text-blue-500 transition-colors"
                              >
                                {formatDate(rev.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                              </button>
                              {rev.date === today && (
                                <span className="text-xs font-bold text-blue-500 px-2 py-0.5 bg-blue-50 dark:bg-blue-500/10 rounded-md">
                                  {t('todayLabel')}
                                </span>
                              )}
                              <div className="flex gap-1 items-center">
                                {[1, 2, 3, 4, 5].map(i => (
                                  <Star
                                    key={i}
                                    size={16}
                                    className={i <= rev.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200 dark:text-zinc-700'}
                                  />
                                ))}
                                <span className="text-xs text-slate-400 ml-1 font-bold">{rev.rating}/5</span>
                              </div>
                              {revEmotions.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 items-center">
                                  {revEmotions.map(em => (
                                    <span
                                      key={em.key}
                                      className="px-2.5 py-0.5 bg-slate-100 dark:bg-zinc-800 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-zinc-700/60 inline-flex items-center gap-1"
                                    >
                                      <span>{em.emoji}</span>
                                      <span>{t(em.tKey)}</span>
                                    </span>
                                  ))}
                                </div>
                              )}
                              {typeof rev.followedRules === 'boolean' && (
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                                  rev.followedRules
                                    ? 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400'
                                    : 'bg-red-50 dark:bg-red-500/10 text-red-500'
                                }`}>
                                  {rev.followedRules ? t('followedRulesLabel') : t('brokeRulesLabel')}
                                </span>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => openModal(rev)}
                                className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                                title={t('editReview')}
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                onClick={() => handleDelete(rev.id)}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                title={t('deleteReview')}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>

                          {/* Notes */}
                          {rev.notes && (
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{t('notesSection')}</p>
                              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed text-sm">{rev.notes}</p>
                            </div>
                          )}

                          {/* Mistakes & Lessons */}
                          {(rev.mistakes || rev.lessons) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                              {rev.mistakes && (
                                <div className="p-3 bg-red-50 dark:bg-red-500/5 rounded-xl border border-red-100 dark:border-red-500/20">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-1">{t('mistakesSection')}</p>
                                  <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed text-xs">{rev.mistakes}</p>
                                </div>
                              )}
                              {rev.lessons && (
                                <div className="p-3 bg-green-50 dark:bg-green-500/5 rounded-xl border border-green-100 dark:border-green-500/20">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-green-500 mb-1">{t('lessonsSection')}</p>
                                  <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed text-xs">{rev.lessons}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ─── DAY VIEW ─── */}
            {viewMode === 'day' && (
              <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-slate-200 dark:border-zinc-800">
                <div className="p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const d = new Date(selectedDate + 'T12:00:00');
                        d.setDate(d.getDate() - 1);
                        selectDate(d.toISOString().split('T')[0]);
                      }}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <div>
                      <p className="font-black text-slate-900 dark:text-white capitalize">
                        {formatDate(selectedDate, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                      {selectedDate === today && (
                        <span className="text-xs font-bold text-blue-500">{t('todayLabel')}</span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        const d = new Date(selectedDate + 'T12:00:00');
                        d.setDate(d.getDate() + 1);
                        selectDate(d.toISOString().split('T')[0]);
                      }}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  <button
                    onClick={() => openModal(undefined, selectedDate)}
                    className="flex items-center gap-2 px-3.5 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-blue-500/20"
                  >
                    <PlusCircle size={14} />
                    {t('addReview')}
                  </button>
                </div>

                {selectedReviews.length > 0 ? (
                  <div className="p-5 space-y-4">
                    {selectedReviews.map((rev) => {
                      const revEmotions = getReviewEmotions(rev);
                      return (
                        <div
                          key={rev.id}
                          className="p-5 rounded-2xl border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-[#141414] space-y-4"
                        >
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-3 flex-wrap">
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map(i => (
                                  <Star
                                    key={i}
                                    size={20}
                                    className={i <= rev.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200 dark:text-zinc-700'}
                                  />
                                ))}
                              </div>
                              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{rev.rating}/5</span>
                              {revEmotions.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 items-center">
                                  {revEmotions.map(em => (
                                    <span
                                      key={em.key}
                                      className="px-2.5 py-1 bg-white dark:bg-zinc-800 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-zinc-700 inline-flex items-center gap-1"
                                    >
                                      <span>{em.emoji}</span>
                                      <span>{t(em.tKey)}</span>
                                    </span>
                                  ))}
                                </div>
                              )}
                              {typeof rev.followedRules === 'boolean' && (
                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                                  rev.followedRules
                                    ? 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400'
                                    : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                                }`}>
                                  {rev.followedRules ? t('followedRulesLabel') : t('brokeRulesLabel')}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => openModal(rev)}
                                className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(rev.id)}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>

                          {/* Notes */}
                          {rev.notes && (
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{t('notesSection')}</p>
                              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed text-sm">{rev.notes}</p>
                            </div>
                          )}

                          {/* Mistakes */}
                          {rev.mistakes && (
                            <div className="p-3.5 bg-red-50 dark:bg-red-500/5 rounded-xl border border-red-100 dark:border-red-500/20">
                              <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-1">{t('mistakesSection')}</p>
                              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed text-sm">{rev.mistakes}</p>
                            </div>
                          )}

                          {/* Lessons */}
                          {rev.lessons && (
                            <div className="p-3.5 bg-green-50 dark:bg-green-500/5 rounded-xl border border-green-100 dark:border-green-500/20">
                              <p className="text-[10px] font-black uppercase tracking-widest text-green-500 mb-1">{t('lessonsSection')}</p>
                              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed text-sm">{rev.lessons}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-16 text-center space-y-3">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                      <BookOpen size={24} className="text-slate-400" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">{t('noReviewThisDay')}</p>
                    <button
                      onClick={() => openModal(undefined, selectedDate)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-all text-sm shadow-lg shadow-blue-500/30"
                    >
                      <PlusCircle size={16} />
                      {t('writeReview')}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ─── WEEK VIEW ─── */}
            {viewMode === 'week' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      const d = new Date(weekDays[0] + 'T12:00:00');
                      d.setDate(d.getDate() - 7);
                      selectDate(d.toISOString().split('T')[0]);
                    }}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg border border-slate-200 dark:border-zinc-800 transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <p className="text-sm font-black text-slate-700 dark:text-slate-300">
                    {formatDate(weekDays[0], { month: 'short', day: 'numeric' })}
                    {' – '}
                    {formatDate(weekDays[6], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  <button
                    onClick={() => {
                      const d = new Date(weekDays[6] + 'T12:00:00');
                      d.setDate(d.getDate() + 1);
                      selectDate(d.toISOString().split('T')[0]);
                    }}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg border border-slate-200 dark:border-zinc-800 transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {weekDays.map((dateStr, i) => {
                    const dayReviews = reviewsByDate[dateStr] || [];
                    const review = dayReviews[0];
                    const isToday = dateStr === today;
                    const isSelected = dateStr === selectedDate;
                    const dayNum = new Date(dateStr + 'T12:00:00').getDate();
                    const revEmotions = getReviewEmotions(review);

                    return (
                      <div
                        key={dateStr}
                        onClick={() => { selectDate(dateStr); setViewMode('day'); }}
                        className={`
                          cursor-pointer rounded-2xl p-3 border transition-all min-h-[140px]
                          ${isSelected ? 'border-blue-400 dark:border-blue-500 shadow-sm' : 'border-slate-200 dark:border-zinc-800'}
                          ${review ? 'bg-white dark:bg-[#1a1a1a]' : 'bg-slate-50/50 dark:bg-[#0f0f0f]'}
                          hover:border-blue-300 dark:hover:border-blue-700
                        `}
                      >
                        <p className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${isToday ? 'text-blue-500' : 'text-slate-400'}`}>
                          {weekDayNames[i]}
                        </p>
                        <div className="flex items-center justify-between mb-2">
                          <p className={`text-xl font-black ${isToday ? 'text-blue-500' : 'text-slate-900 dark:text-white'}`}>
                            {dayNum}
                          </p>
                          {dayReviews.length > 1 && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-md">
                              {dayReviews.length}
                            </span>
                          )}
                        </div>
                        {review ? (
                          <div className="space-y-1.5">
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map(s => (
                                <Star key={s} size={10}
                                  className={s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200 dark:text-zinc-700'}
                                />
                              ))}
                            </div>
                            {revEmotions.length > 0 && (
                              <div className="flex flex-wrap gap-0.5 text-sm">
                                {revEmotions.map(em => (
                                  <span key={em.key} title={t(em.tKey)}>{em.emoji}</span>
                                ))}
                              </div>
                            )}
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-4 leading-relaxed">{review.notes}</p>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); openModal(undefined, dateStr); }}
                            className="text-[10px] text-blue-500 font-bold hover:underline"
                          >
                            + {t('addReview')}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ─── MONTH VIEW ─── */}
            {viewMode === 'month' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <p className="text-lg font-black text-slate-900 dark:text-white capitalize">{calMonthLabel}</p>
                  <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-lg text-xs font-bold">
                    {monthReviews.length} {t('reviewsCount')}
                  </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { val: monthReviews.length, label: t('daysReviewed'), color: 'text-slate-900 dark:text-white' },
                    { val: avgRating > 0 ? avgRating.toFixed(1) + '★' : '—', label: t('avgRating'), color: 'text-yellow-400' },
                    { val: monthReviews.filter(r => r.rating >= 4).length, label: t('goodDaysPlus'), color: 'text-green-400' },
                    { val: monthReviews.filter(r => r.rating <= 2).length, label: t('hardDaysLow'), color: 'text-red-400' },
                  ].map(stat => (
                    <div key={stat.label} className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-slate-200 dark:border-zinc-800 p-4 text-center">
                      <p className={`text-3xl font-black ${stat.color}`}>{stat.val}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Review list */}
                {monthReviews.length === 0 ? (
                  <div className="p-12 text-center bg-white dark:bg-[#1a1a1a] rounded-2xl border border-slate-200 dark:border-zinc-800">
                    <p className="text-slate-500">{t('noReviewsMonth')}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {monthReviews.map(review => {
                      const d = new Date(review.date + 'T12:00:00');
                      const revEmotions = getReviewEmotions(review);
                      return (
                        <div
                          key={review.id}
                          onClick={() => { selectDate(review.date); setViewMode('day'); }}
                          className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-slate-200 dark:border-zinc-800 p-4 flex gap-4 group cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-all"
                        >
                          <div className="flex-shrink-0 text-center w-12">
                            <p className="text-2xl font-black text-slate-900 dark:text-white">{d.getDate()}</p>
                            <p className="text-[10px] font-black uppercase text-slate-400">
                              {d.toLocaleDateString(locale, { weekday: 'short' })}
                            </p>
                          </div>
                          <div className="border-l border-slate-100 dark:border-zinc-800 pl-4 flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map(s => (
                                  <Star key={s} size={12}
                                    className={s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200 dark:text-zinc-700'}
                                  />
                                ))}
                              </div>
                              {revEmotions.length > 0 && (
                                <div className="flex flex-wrap gap-1 items-center">
                                  {revEmotions.map(em => (
                                    <span key={em.key} className="text-xs inline-flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 rounded-full font-bold text-slate-600 dark:text-slate-300">
                                      <span>{em.emoji}</span>
                                      <span className="text-[11px] text-slate-400">{t(em.tKey)}</span>
                                    </span>
                                  ))}
                                </div>
                              )}
                              {typeof review.followedRules === 'boolean' && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  review.followedRules
                                    ? 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400'
                                    : 'bg-red-50 dark:bg-red-500/10 text-red-500'
                                }`}>
                                  {review.followedRules ? t('followedRulesShort') : t('brokeRulesShort')}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{review.notes}</p>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity self-center">
                            <button onClick={(e) => { e.stopPropagation(); openModal(review); }}
                              className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleDelete(review.id); }}
                              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── MODAL ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl max-w-lg w-full border border-slate-200 dark:border-zinc-800 shadow-2xl flex flex-col max-h-[92vh]">
            <div className="p-6 border-b border-slate-200 dark:border-zinc-800 flex justify-between items-center flex-shrink-0">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  {editingId ? t('editReview') : t('addReview')}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">{formData.date}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Date */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{t('date')}</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Rating */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{t('overallRating')}</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: formData.rating === star ? 0 : star })}
                      className="transition-transform hover:scale-110 active:scale-95"
                    >
                      <Star size={32}
                        className={star <= formData.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200 dark:text-zinc-700'}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Emotion */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {t('emotionMood')}
                  </label>
                  <span className="text-[11px] font-bold text-blue-500">
                    {formData.emotions.length > 0
                      ? `${formData.emotions.length} ${t('emotionsSelected')}`
                      : t('selectMultipleEmotions')}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {EMOTIONS.map(e => {
                    const isSelected = formData.emotions.includes(e.key);
                    return (
                      <button
                        key={e.key}
                        type="button"
                        onClick={() => {
                          const next = isSelected
                            ? formData.emotions.filter(k => k !== e.key)
                            : [...formData.emotions, e.key];
                          setFormData({
                            ...formData,
                            emotions: next,
                            emotion: next[0] || ''
                          });
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-blue-500 border-blue-500 text-white shadow-sm shadow-blue-500/25 scale-[1.02]'
                            : 'border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-slate-400 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-[#151515]'
                        }`}
                      >
                        <span>{e.emoji}</span>
                        <span>{t(e.tKey)}</span>
                        {isSelected && <span className="text-[10px] ml-0.5 opacity-90">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Discipline */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{t('discipline')}</label>
                <div className="flex gap-2">
                  {[
                    { v: true,  labelKey: 'followedRulesLabel' as TranslationKey },
                    { v: false, labelKey: 'brokeRulesLabel' as TranslationKey },
                  ].map(opt => (
                    <button
                      key={String(opt.v)}
                      type="button"
                      onClick={() => setFormData({ ...formData, followedRules: formData.followedRules === opt.v ? null : opt.v })}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                        formData.followedRules === opt.v
                          ? opt.v
                            ? 'bg-green-50 dark:bg-green-500/10 border-green-300 dark:border-green-500/40 text-green-700 dark:text-green-400'
                            : 'bg-red-50 dark:bg-red-500/10 border-red-300 dark:border-red-500/40 text-red-700 dark:text-red-400'
                          : 'border-slate-200 dark:border-zinc-700 text-slate-400 dark:text-slate-600'
                      }`}
                    >
                      {t(opt.labelKey)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{t('notesObservations')}</label>
                <textarea
                  required
                  rows={3}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder={t('howWasTrading')}
                  className="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>

              {/* Mistakes */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-red-400 mb-2">{t('mistakesOptional')}</label>
                <textarea
                  rows={2}
                  value={formData.mistakes}
                  onChange={e => setFormData({ ...formData, mistakes: e.target.value })}
                  placeholder={t('whatMistakes')}
                  className="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-400 outline-none resize-none"
                />
              </div>

              {/* Lessons */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-green-500 mb-2">{t('lessonsOptional')}</label>
                <textarea
                  rows={2}
                  value={formData.lessons}
                  onChange={e => setFormData({ ...formData, lessons: e.target.value })}
                  placeholder={t('whatLearned')}
                  className="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-400 outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-xl font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl font-bold text-white transition-all shadow-lg shadow-blue-500/30"
                  style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)' }}
                >
                  {t('saveReview')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
