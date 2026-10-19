import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  onClear?: () => void;
  placeholder?: string;
  className?: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function DatePicker({ value, onChange, onClear, placeholder = "Select date", className = "" }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value ? new Date(value) : new Date());
  const popupRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleSelectDate = (day: number) => {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    // Format to YYYY-MM-DD local time safely
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    onChange(`${year}-${month}-${date}`);
    setIsOpen(false);
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    // Empty cells for first day offset
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
    }
    
    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isSelected = value === dateStr;
      const isToday = new Date().toISOString().split('T')[0] === dateStr;
      
      days.push(
        <button
          key={day}
          onClick={() => handleSelectDate(day)}
          className={`h-8 w-8 flex items-center justify-center rounded-full text-xs font-medium transition-all ${
            isSelected 
              ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30' 
              : isToday 
                ? 'bg-slate-100 dark:bg-slate-800 text-blue-500' 
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {day}
        </button>
      );
    }
    return days;
  };

  const displayValue = value ? new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : placeholder;

  return (
    <div className={`relative ${className}`} ref={popupRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500/40 outline-none transition-all text-sm font-medium text-slate-600 dark:text-slate-300 min-w-[140px] justify-between group hover:border-slate-300 dark:hover:border-slate-700"
      >
        <div className="flex items-center gap-2">
          <CalendarIcon size={14} className="text-blue-500" />
          <span>{displayValue}</span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 top-full left-0 mt-2 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl animate-fade-in w-72">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={handlePrevMonth} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <div className="font-bold text-slate-800 dark:text-white text-sm">
              {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </div>
            <button onClick={handleNextMonth} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
          
          {/* Days of week */}
          <div className="grid grid-cols-7 gap-1 mb-2 text-center">
            {DAYS.map(d => (
              <div key={d} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{d}</div>
            ))}
          </div>
          
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {renderCalendar()}
          </div>
          
          {/* Footer Actions */}
          {onClear && value && (
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
              <button 
                onClick={() => { onClear(); setIsOpen(false); }}
                className="text-xs font-bold text-loss-500 hover:text-loss-600 transition-colors"
              >
                Clear selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
