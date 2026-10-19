'use client';

import { useEffect, useState, useMemo } from 'react';
import { Trade, TradeStatus } from '@/types/trade';
import { useAccount } from '@/context/AccountContext';
import { getTrades, addOrUpdateTrade, deleteTrade } from '@/lib/clientStorage';
import TradeModal from '@/components/TradeModal';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Search,
  PlusCircle,
  Edit2,
  Trash2,
  ListChecks
} from 'lucide-react';
import ChecklistModal from '@/components/ChecklistModal';
import DatePicker from '@/components/DatePicker';

const LIVE_ASSETS = [
  { label: 'XAUUSD', symbol: 'PAXGUSDT', decimals: 2 },
  { label: 'BTCUSD', symbol: 'BTCUSDT', decimals: 2 },
  { label: 'ETHUSD', symbol: 'ETHUSDT', decimals: 2 },
  { label: 'EURUSD', symbol: 'EURUSDT', decimals: 5 },
  { label: 'GBPUSD', symbol: 'GBPUSDT', decimals: 5 },
];

const getMappedSymbol = (inst: string) => {
  const clean = inst.replace(/[^A-Z]/gi, '').toUpperCase();
  if (clean === 'XAUUSD' || clean === 'GOLD') return 'PAXGUSDT';
  if (clean.endsWith('USD')) return clean.replace('USD', 'USDT');
  return null;
};

const getMultiplier = (inst: string) => {
  const clean = inst.toUpperCase();
  if (clean.includes('XAU') || clean.includes('GOLD')) return 100;
  if (clean.includes('XAG') || clean.includes('SILVER')) return 5000;
  if (clean.includes('BTC') || clean.includes('ETH') || clean.includes('US30') || clean.includes('NAS100')) return 1;
  return 100000;
};

export default function HistoryPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>(() => {
    const today = new Date();
    // Format YYYY-MM-DD adjusted for local timezone offset
    const offset = today.getTimezoneOffset() * 60000;
    return new Date(today.getTime() - offset).toISOString().split('T')[0];
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const { selectedAccount } = useAccount();
  const [liveAsset, setLiveAsset] = useState(LIVE_ASSETS[0]);
  const [livePrice, setLivePrice] = useState<string | null>(null);
  const [allPrices, setAllPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch('https://api.binance.com/api/v3/ticker/price');
        const data = await res.json();
        if (Array.isArray(data)) {
          const priceMap: Record<string, number> = {};
          data.forEach((item: any) => {
            priceMap[item.symbol] = parseFloat(item.price);
          });
          setAllPrices(priceMap);
          
          if (priceMap[liveAsset.symbol]) {
             const formatted = priceMap[liveAsset.symbol].toFixed(liveAsset.decimals);
             setLivePrice(formatted);
             document.title = `$${formatted} ${liveAsset.label} | Trading Journal`;
          }
        }
      } catch (err) {
        // silently ignore
      }
    };
    
    setLivePrice(null);
    fetchPrice();
    const interval = setInterval(fetchPrice, 3000); // 3s
    return () => {
      clearInterval(interval);
      document.title = 'Trading Journal';
    };
  }, [liveAsset]);

  // Auto-close open orders if price hits TP or SL
  useEffect(() => {
    if (Object.keys(allPrices).length === 0 || trades.length === 0) return;
    
    let hasUpdates = false;
    const updatedTrades = [...trades];
    
    updatedTrades.forEach((t, i) => {
      if (t.status === 'OPEN') {
        const symbol = getMappedSymbol(t.instrument);
        if (symbol && allPrices[symbol]) {
          const currentPrice = allPrices[symbol];
          let newStatus: TradeStatus = t.status;
          let closePrice = 0;
          
          if (t.direction === 'LONG') {
             if (t.takeProfit != null && t.takeProfit > 0 && currentPrice >= t.takeProfit) { newStatus = 'WIN'; closePrice = t.takeProfit; }
             else if (t.stopLoss != null && t.stopLoss > 0 && currentPrice <= t.stopLoss) { newStatus = 'LOSS'; closePrice = t.stopLoss; }
          } else {
             if (t.takeProfit != null && t.takeProfit > 0 && currentPrice <= t.takeProfit) { newStatus = 'WIN'; closePrice = t.takeProfit; }
             else if (t.stopLoss != null && t.stopLoss > 0 && currentPrice >= t.stopLoss) { newStatus = 'LOSS'; closePrice = t.stopLoss; }
          }
          
          if (newStatus !== 'OPEN') {
            const diff = t.direction === 'LONG' ? (closePrice - t.entryPrice) : (t.entryPrice - closePrice);
            const multiplier = getMultiplier(t.instrument);
            const commission = t.financials.commission || 0;
            const swap = t.financials.swap || 0;
            const pnl = (diff * t.lotSize * multiplier) - (commission + swap);
            
            const risk = t.stopLoss != null ? Math.abs(t.entryPrice - t.stopLoss) : 0;
            const actualRR = risk > 0 ? (diff / risk) : 0;

            updatedTrades[i] = { 
              ...t, 
              status: newStatus as 'WIN'|'LOSS', 
              exitPrice: closePrice, 
              exitDate: new Date().toISOString(),
              financials: { ...t.financials, netPnL: pnl },
              analysis: { ...t.analysis, actualRR: parseFloat(actualRR.toFixed(2)) }
            };
            hasUpdates = true;
            handleSaveTrade(updatedTrades[i]);
          }
        }
      }
    });
    
    if (hasUpdates) {
      setTrades(updatedTrades);
    }
  }, [allPrices, trades]);

  useEffect(() => {
    getTrades()
      .then(data => {
        setTrades(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching trades:', err);
        setLoading(false);
      });
  }, []);

  const handleSaveTrade = async (trade: Trade) => {
    const isEditing = !!selectedTrade;
    const tradeWithAccount = { ...trade, accountId: trade.accountId || selectedAccount?.id || '' };

    try {
      await addOrUpdateTrade(tradeWithAccount);
      if (isEditing) {
        setTrades(trades.map(t => t.id === trade.id ? tradeWithAccount : t));
      } else {
        setTrades([tradeWithAccount, ...trades]);
      }
    } catch (err) {
      console.error('Error saving trade:', err);
    }
  };

  const handleDeleteTrade = async (id: string) => {
    if (!confirm('Are you sure you want to delete this trade?')) return;

    try {
      await deleteTrade(id);
      setTrades(trades.filter(t => t.id !== id));
    } catch (err) {
      console.error('Error deleting trade:', err);
    }
  };

  const openAddModal = () => {
    setSelectedTrade(null);
    setIsModalOpen(true);
  };

  const openEditModal = (trade: Trade) => {
    setSelectedTrade(trade);
    setIsModalOpen(true);
  };

  const filteredTrades = useMemo(() => trades.filter(t => {
    const isSameAccount = !selectedAccount || t.accountId === selectedAccount.id;
    if (!isSameAccount) return false;

    const matchSearch =
      t.instrument.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.direction.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.analysis.strategy || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchDate = !dateFilter || t.entryDate.startsWith(dateFilter);
    return matchSearch && matchStatus && matchDate;
  }), [trades, searchTerm, statusFilter, dateFilter, selectedAccount]);

  if (loading) return (
    <main className="p-6 md:p-8 animate-pulse">
      <div className="mb-6 space-y-3">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
        <div className="h-4 w-64 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
      </div>
      <div className="flex flex-wrap gap-2 mb-5">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="h-10 flex-1 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-10 w-16 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          ))}
        </div>
      </div>
      <div className="glass-card rounded-2xl h-96 bg-slate-200/50 dark:bg-slate-800/50"></div>
    </main>
  );

  const wins = filteredTrades.filter(t => t.status === 'WIN').length;
  const losses = filteredTrades.filter(t => t.status === 'LOSS').length;
  const openCount = filteredTrades.filter(t => t.status === 'OPEN').length;

  return (
    <main className="p-6 md:p-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Trade History</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">
            Review and analyze all your past trades
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="hidden sm:flex items-center bg-slate-50 dark:bg-slate-800/50 rounded-xl px-3 py-1.5 border border-slate-200/60 dark:border-slate-700/50 mr-2">
            <select
              value={liveAsset.symbol}
              onChange={(e) => setLiveAsset(LIVE_ASSETS.find(a => a.symbol === e.target.value) || LIVE_ASSETS[0])}
              className="bg-transparent text-[10px] font-bold text-amber-500/80 uppercase tracking-wider outline-none cursor-pointer border-none appearance-none pr-1"
            >
              {LIVE_ASSETS.map(a => (
                <option key={a.symbol} value={a.symbol} className="text-slate-800">{a.label}</option>
              ))}
            </select>
            <div className="text-sm font-black text-slate-700 dark:text-slate-200 ml-2 border-l border-slate-200 dark:border-slate-700 pl-2">
              {livePrice ? `$${livePrice}` : <span className="animate-pulse text-slate-400">...</span>}
            </div>
          </div>
          <button
            onClick={() => setIsChecklistModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-win-600 bg-win-50 dark:text-win-400 dark:bg-win-500/10 hover:bg-win-100 dark:hover:bg-win-500/20 transition-all active:scale-95 whitespace-nowrap"
          >
            <ListChecks size={16} strokeWidth={2.5} />
            Checklist
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all active:scale-95 shadow-lg whitespace-nowrap"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
              boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)'
            }}
          >
            <PlusCircle size={16} strokeWidth={2.5} />
            Add Trade
          </button>
        </div>
      </div>

      {/* Quick stat pills */}
      <div className="flex flex-wrap gap-2 mb-5">
        <StatPill label="Total" count={filteredTrades.length} colorClass="text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800" />
        <StatPill label="Wins" count={wins} colorClass="text-win-700 dark:text-win-400 bg-win-50 dark:bg-win-500/10" />
        <StatPill label="Losses" count={losses} colorClass="text-loss-700 dark:text-loss-400 bg-loss-50 dark:bg-loss-500/10" />
        <StatPill label="Open" count={openCount} colorClass="text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            type="text"
            placeholder="Search instrument, strategy, direction..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 outline-none transition-all text-sm font-medium placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <DatePicker 
            value={dateFilter} 
            onChange={setDateFilter} 
            onClear={() => setDateFilter('')} 
            placeholder="All dates" 
          />
        </div>
        <div className="flex gap-2">
          {(['ALL', 'WIN', 'LOSS', 'OPEN'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === s
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-900/70 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                <th className="px-5 py-3.5">#</th>
                <th className="px-5 py-3.5">Instrument</th>
                <th className="px-5 py-3.5">Direction</th>
                <th className="px-5 py-3.5">Lot</th>
                <th className="px-5 py-3.5">Entry</th>
                <th className="px-5 py-3.5">Exit</th>
                <th className="px-5 py-3.5">Strategy</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Net P&L</th>
                <th className="px-5 py-3.5">R:R</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5 text-right pr-8">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrades.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-5 py-14 text-center text-sm text-slate-400 font-medium">
                    No trades match your filters.
                  </td>
                </tr>
              ) : filteredTrades.map((trade, index) => (
                <tr
                  key={trade.id}
                  className="border-t border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                >
                  <td className="px-5 py-4 text-xs font-bold text-slate-400 dark:text-slate-600">
                    {String(index + 1).padStart(2, '0')}
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-black text-slate-900 dark:text-white">{trade.instrument}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg
                      ${trade.direction === 'LONG'
                        ? 'bg-win-50 text-win-700 dark:bg-win-500/10 dark:text-win-400'
                        : 'bg-loss-50 text-loss-700 dark:bg-loss-500/10 dark:text-loss-400'}`}>
                      {trade.direction === 'LONG'
                        ? <ArrowUpRight size={11} strokeWidth={2.5} />
                        : <ArrowDownLeft size={11} strokeWidth={2.5} />}
                      {trade.direction}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-mono text-sm font-bold text-slate-600 dark:text-slate-300">
                    {trade.lotSize}
                  </td>
                  <td className="px-5 py-4 font-mono text-sm text-slate-700 dark:text-slate-300">
                    {trade.entryPrice.toFixed(2)}
                  </td>
                  <td className="px-5 py-4 font-mono text-sm text-slate-700 dark:text-slate-300">
                    {trade.exitPrice?.toFixed(2) ?? '—'}
                  </td>
                  <td className="px-5 py-4">
                    {trade.analysis.strategy
                      ? <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">{trade.analysis.strategy}</span>
                      : <span className="text-slate-400 dark:text-slate-600">—</span>}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={trade.status} />
                  </td>
                  <td className="px-5 py-4">
                    {(() => {
                      if (trade.status !== 'OPEN') {
                        return (
                          <span className={`font-black text-sm ${(trade.financials.netPnL || 0) >= 0 ? 'text-win-500 dark:text-win-400' : 'text-loss-500 dark:text-loss-400'}`}>
                            {trade.financials.netPnL !== null
                              ? `${trade.financials.netPnL >= 0 ? '+' : ''}$${trade.financials.netPnL.toFixed(2)}`
                              : <span className="text-slate-400 dark:text-slate-600 font-normal">—</span>}
                          </span>
                        );
                      }
                      
                      // For OPEN trades, calculate floating PnL
                      const symbol = getMappedSymbol(trade.instrument);
                      if (symbol && allPrices[symbol]) {
                        const currentPrice = allPrices[symbol];
                        const diff = trade.direction === 'LONG' ? (currentPrice - trade.entryPrice) : (trade.entryPrice - currentPrice);
                        const multiplier = getMultiplier(trade.instrument);
                        const commission = trade.financials.commission || 0;
                        const swap = trade.financials.swap || 0;
                        const floatingPnL = (diff * trade.lotSize * multiplier) - (commission + swap);
                        
                        return (
                          <div className="flex flex-col">
                            <span className={`font-black text-sm animate-pulse ${floatingPnL >= 0 ? 'text-win-500' : 'text-loss-500'}`}>
                              {floatingPnL >= 0 ? '+' : ''}${floatingPnL.toFixed(2)}
                            </span>
                            <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest mt-0.5">Live</span>
                          </div>
                        );
                      }
                      
                      return <span className="text-slate-400 dark:text-slate-600 font-normal animate-pulse">Running...</span>;
                    })()}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-bold ${
                      (trade.analysis.actualRR ?? 0) > 0
                        ? 'text-win-500 dark:text-win-400'
                        : (trade.analysis.actualRR ?? 0) < 0
                        ? 'text-loss-500 dark:text-loss-400'
                        : 'text-slate-400 dark:text-slate-600'
                    }`}>
                      {trade.analysis.actualRR !== null ? `${trade.analysis.actualRR}R` : '—'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap">
                      <Calendar size={11} />
                      {new Date(trade.entryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right pr-6">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); openEditModal(trade); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteTrade(trade.id); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-loss-500 hover:bg-loss-50 dark:hover:bg-loss-500/10 transition-all"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">
            Showing {filteredTrades.length} of {trades.length} trades
          </span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-win-500 inline-block" />
              {wins} wins
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-loss-500 inline-block" />
              {losses} losses
            </span>
          </div>
        </div>
      </div>

      <TradeModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveTrade} 
        initialData={selectedTrade}
      />

      <ChecklistModal
        isOpen={isChecklistModalOpen}
        onClose={() => setIsChecklistModalOpen(false)}
      />
    </main>
  );
}

function StatPill({ label, count, colorClass }: { label: string; count: number; colorClass: string }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${colorClass}`}>
      <span className="text-xs font-bold">{label}</span>
      <span className="text-sm font-black">{count}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    WIN:        'bg-win-500 text-white',
    LOSS:       'bg-loss-500 text-white',
    OPEN:       'bg-blue-500 text-white',
    BREAK_EVEN: 'bg-slate-500 text-white',
  };

  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm ${styles[status] || styles.OPEN}`}>
      {status === 'BREAK_EVEN' ? 'B/E' : status}
    </span>
  );
}
