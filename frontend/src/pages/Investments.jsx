import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import { Compass, Network, Plus, Edit2, Trash2, RefreshCw, TrendingUp, TrendingDown, Layers, X, Check, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import InvestmentsCharts from '../components/InvestmentsCharts';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

const fmt = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);

const ASSET_TYPES = [
  { value: 'stock', label: 'Stocks / Equities', badge: 'STOCK', color: 'border-lime-500/40 text-lime-400 bg-lime-950/30' },
  { value: 'mutual_fund', label: 'Mutual Funds / ETF', badge: 'MF / ETF', color: 'border-purple-500/40 text-purple-400 bg-purple-950/30' },
  { value: 'crypto', label: 'Cryptocurrency', badge: 'CRYPTO', color: 'border-cyan-500/40 text-cyan-400 bg-cyan-950/30' },
  { value: 'fd', label: 'Fixed Deposits / Bonds', badge: 'FD/BOND', color: 'border-orange-500/40 text-orange-400 bg-orange-950/30' },
  { value: 'gold', label: 'Gold / Precious Metals', badge: 'GOLD', color: 'border-amber-500/40 text-amber-400 bg-amber-950/30' },
  { value: 'real_estate', label: 'Real Estate / Property', badge: 'REALTY', color: 'border-emerald-500/40 text-emerald-400 bg-emerald-950/30' },
  { value: 'other', label: 'Other Assets', badge: 'OTHER', color: 'border-zinc-500/40 text-zinc-400 bg-zinc-900/30' }
];

export default function Investments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [hoveredNode, setHoveredNode] = useState(null);

  // Modal States
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | null
  const [selectedHolding, setSelectedHolding] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: invData, isLoading } = useQuery({
    queryKey: ['investments'],
    queryFn: async () => {
      const res = await api.get('/investments');
      return res.data.data;
    }
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['investments'] });
    queryClient.invalidateQueries({ queryKey: ['networth'] });
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
  };

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/investments', payload);
      return res.data;
    },
    onSuccess: () => {
      invalidateAll();
      setModalMode(null);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await api.put(`/investments/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      invalidateAll();
      setModalMode(null);
      setSelectedHolding(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`/investments/${id}`);
      return res.data;
    },
    onSuccess: () => {
      invalidateAll();
      setDeleteTarget(null);
    }
  });

  const handleRefreshPrices = async () => {
    try {
      setIsRefreshing(true);
      await api.post('/investments/refresh-prices');
      invalidateAll();
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 800);
    }
  };

  const holdings = invData?.holdings || [];
  const summary = invData?.summary || { totalInvested: 0, currentValue: 0, totalPnl: 0, pnlPercent: 0 };
  const pnlIsPositive = summary.totalPnl >= 0;

  return (
    <div className="space-y-6 animate-fade-in pb-16 max-w-7xl mx-auto px-4 mt-6">
      {/* Add / Edit Investment Modal */}
      {(modalMode === 'add' || modalMode === 'edit') && (
        <InvestmentFormModal 
          mode={modalMode}
          holding={selectedHolding}
          onClose={() => {
            setModalMode(null);
            setSelectedHolding(null);
          }}
          onSave={(data) => {
            if (modalMode === 'add') {
              createMutation.mutate(data);
            } else if (modalMode === 'edit' && selectedHolding) {
              updateMutation.mutate({ id: selectedHolding.id, payload: data });
            }
          }}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <DeleteConfirmModal 
          holding={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          isDeleting={deleteMutation.isPending}
        />
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[28px] font-bebas tracking-[4px] text-engraved-gold flex items-center shadow-gold-text">
            INVESTMENTS // {user?.name?.toUpperCase() || 'PRIMARY'}
          </h1>
          <p className="text-[#888] font-mono text-[10px] tracking-[0.2em] uppercase mt-1">
            Status: Synced • {summary.lastUpdated ? new Date(summary.lastUpdated).toLocaleDateString() : 'REALTIME'}
          </p>
        </div>
        
        {/* Top Actions */}
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefreshPrices} 
            disabled={isRefreshing}
            title="Sync live prices"
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#333] bg-[#111] hover:border-[var(--color-champagne-gold)] text-[#888] hover:text-[var(--color-champagne-gold)] text-[10px] font-mono font-bold tracking-widest uppercase transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin text-[var(--color-champagne-gold)]")} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Prices'}</span>
          </button>

          {/* Watch Crown Button (Add Node) */}
          <button 
            onClick={() => {
              setSelectedHolding(null);
              setModalMode('add');
            }} 
            className="flex items-center gap-2 px-6 py-2 rounded-full plate-border bg-sunray shadow-[0_4px_10px_rgba(0,0,0,0.9),inset_0_1px_2px_rgba(255,255,255,0.2)] active:scale-[0.97] active:shadow-[0_1px_2px_rgba(0,0,0,0.9),inset_0_4px_10px_rgba(0,0,0,0.8)] transition-all group cursor-pointer z-10 relative"
          >
            <div className="w-5 h-5 flex items-center justify-center border border-[var(--color-champagne-gold)] rounded-full bg-[#111] shadow-engraving">
              <Plus className="w-3 h-3 text-[var(--color-champagne-gold)]" />
            </div>
            <span className="text-[11px] font-bold tracking-[0.2em] text-engraved-gold uppercase group-active:text-[#AA8222] transition-colors">
              + Allocate
            </span>
          </button>
        </div>
      </div>
      
      {/* Complications Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-cotes-de-geneve p-6 rounded-2xl plate-border shadow-plate relative">
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[rgba(255,255,255,0.02)] to-black/60 pointer-events-none rounded-2xl"></div>

        {/* Gross Invested */}
        <div className="bg-[#0a0a0a] p-5 rounded-xl border border-[#333] shadow-recessed relative overflow-hidden group">
          <div className="absolute top-2 right-2 opacity-10">
            <Compass className="w-16 h-16 text-[var(--color-champagne-gold)]" />
          </div>
          <h3 className="text-[#666] text-[10px] font-mono font-bold uppercase tracking-[0.2em]">Gross Invested</h3>
          <p className="text-2xl font-mono font-black text-[var(--color-champagne-gold)] mt-1 tracking-tight drop-shadow-[0_0_8px_rgba(212,175,55,0.3)]">
            {isLoading ? '...' : fmt(summary.totalInvested)}
          </p>
        </div>

        {/* Current Value Complication */}
        <div className="bg-[#0a0a0a] p-5 rounded-xl border border-[#333] shadow-recessed relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <h3 className="text-[#666] text-[10px] font-mono font-bold uppercase tracking-[0.2em] relative z-10">Current Value</h3>
            
            {/* Animated Gear System */}
            <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
               <svg viewBox="0 0 100 100" className="absolute w-10 h-10 text-[#444] animate-gear-spin fill-current">
                 <path d="M50,10 L55,20 L65,18 L68,28 L78,32 L75,42 L85,50 L75,58 L78,68 L68,72 L65,82 L55,80 L50,90 L45,80 L35,82 L32,72 L22,68 L25,58 L15,50 L25,42 L22,32 L32,28 L35,18 L45,20 Z" />
                 <circle cx="50" cy="50" r="15" fill="#0a0a0a" />
               </svg>
               <svg viewBox="0 0 100 100" className="absolute w-6 h-6 text-[var(--color-champagne-gold)] animate-gear-spin fill-current drop-shadow-[0_0_3px_#D4AF37]" style={{ animationDirection: 'reverse', animationDuration: '4s' }}>
                 <path d="M50,15 L54,25 L64,25 L66,35 L76,40 L70,48 L76,56 L66,61 L64,71 L54,71 L50,81 L46,71 L36,71 L34,61 L24,56 L30,48 L24,40 L34,35 L36,25 L46,25 Z" />
                 <circle cx="50" cy="50" r="10" fill="#0a0a0a" />
               </svg>
            </div>
          </div>
          <p className="text-2xl font-mono font-black text-engraved-gold mt-1 tracking-tight z-10">
            {isLoading ? '...' : fmt(summary.currentValue)}
          </p>
        </div>

        {/* PNL Gold Tag */}
        <div className="bg-sunray p-4 rounded-xl border border-[var(--color-champagne-gold)] shadow-[inset_0_0_20px_rgba(0,0,0,0.9),0_4px_10px_rgba(0,0,0,0.9)] relative overflow-hidden flex flex-col justify-center items-center text-center group">
            <h3 className="text-[#888] text-[9px] font-mono font-bold uppercase tracking-[0.2em] mb-2 pointer-events-none drop-shadow-[0_1px_1px_#000]">Total P&L</h3>
            <p className={cn(
              "text-[12px] font-mono font-black tracking-widest px-3 py-1.5 border border-[#000] shadow-recessed mx-auto",
              pnlIsPositive 
                ? "text-[#00ff66] bg-[#002b0e] border-[#00ff66]/30 shadow-[0_0_10px_rgba(0,255,102,0.2)]" 
                : "text-[#ff4444] bg-[#2b0000] border-[#ff4444]/30 shadow-[0_0_10px_rgba(255,68,68,0.2)]"
            )}>
               {isLoading ? '...' : `${pnlIsPositive ? '+' : ''}${fmt(summary.totalPnl)} (${pnlIsPositive ? '+' : ''}${summary.pnlPercent.toFixed(2)}%)`}
            </p>
        </div>
        
        {/* Complexity Complication */}
        <div className="bg-[#0a0a0a] p-5 rounded-xl border border-[#333] shadow-recessed relative overflow-hidden flex flex-col justify-between items-end text-right">
           <div className="flex justify-between w-full items-start">
             {/* Gravity Defying Tourbillon Gauge */}
             <div className="w-10 h-10 rounded-full border border-[#444] shadow-[0_0_10px_rgba(0,0,0,0.9),inset_0_0_5px_rgba(0,0,0,0.9)] flex items-center justify-center relative bg-[#111] shrink-0">
                <div className="absolute inset-2 border border-[var(--color-champagne-gold)] rounded-full opacity-30 shadow-[inset_0_0_3px_#D4AF37]"></div>
                <div className="w-1 h-6 bg-[var(--color-champagne-gold)] rounded-full animate-tourbillon-tick shadow-[0_0_5px_rgba(212,175,55,0.8)]"></div>
             </div>
             <h3 className="text-[#666] text-[10px] font-mono font-bold uppercase tracking-[0.2em]">Complexity</h3>
           </div>
           <div>
             <p className="text-xl font-mono font-black text-engraved-gold tracking-widest">{holdings.length} Assets</p>
             <p className="text-[#888] text-[9px] font-mono font-bold uppercase tracking-[0.2em]">(LIVE DATA)</p>
           </div>
        </div>

      </div>

      {/* Analytics Charts */}
      <InvestmentsCharts hoveredNode={hoveredNode} data={holdings} summary={summary} isLoading={isLoading} />
      
      {/* Network Nodes Table (Engraved Plate) */}
      <div className="mt-8 bg-pvd-plate p-6 md:p-8 rounded-none border border-[#333] border-b-[#444] border-r-[#444] shadow-plate relative z-10">
         {/* Screws */}
         <div className="absolute top-4 left-4 w-3 h-3 rounded-full bg-[#1A1A1A] border border-[#333] shadow-recessed flex items-center justify-center"><div className="w-1.5 h-[1.5px] bg-[#0a0a0a] rotate-45 shadow-[0_1px_0_rgba(255,255,255,0.1)]"></div></div>
         <div className="absolute top-4 right-4 w-3 h-3 rounded-full bg-[#1A1A1A] border border-[#333] shadow-recessed flex items-center justify-center"><div className="w-1.5 h-[1.5px] bg-[#0a0a0a] -rotate-12 shadow-[0_1px_0_rgba(255,255,255,0.1)]"></div></div>
         <div className="absolute bottom-4 left-4 w-3 h-3 rounded-full bg-[#1A1A1A] border border-[#333] shadow-recessed flex items-center justify-center"><div className="w-1.5 h-[1.5px] bg-[#0a0a0a] rotate-90 shadow-[0_1px_0_rgba(255,255,255,0.1)]"></div></div>
         <div className="absolute bottom-4 right-4 w-3 h-3 rounded-full bg-[#1A1A1A] border border-[#333] shadow-recessed flex items-center justify-center"><div className="w-1.5 h-[1.5px] bg-[#0a0a0a] rotate-180 shadow-[0_1px_0_rgba(255,255,255,0.1)]"></div></div>
         
         <div className="mb-6 flex items-center justify-between">
             <h3 className="text-xl font-bebas tracking-[3px] text-[#888] uppercase flex items-center gap-3">
                <Network className="w-5 h-5 text-[#666]" />
                Your Holdings Portfolio ({holdings.length})
             </h3>
             <span className="text-[10px] font-mono text-[#666] tracking-widest uppercase hidden sm:inline">
               Click ✏️ to edit or 🗑️ to delete
             </span>
         </div>

         <div className="overflow-x-auto pb-2">
            <div className="min-w-[900px] flex flex-col gap-3">
               {holdings.length === 0 && !isLoading && (
                 <div className="text-center py-12 text-[#666] font-mono tracking-widest text-xs border border-[#222] bg-[#0a0a0a] flex flex-col items-center justify-center gap-3">
                    <Layers className="w-8 h-8 text-[#444]" />
                    <span>NO NODES ALLOCATED. INITIATE INVESTMENT PROTOCOL.</span>
                    <button 
                      onClick={() => { setSelectedHolding(null); setModalMode('add'); }}
                      className="px-4 py-2 border border-[var(--color-champagne-gold)] text-[var(--color-champagne-gold)] hover:bg-[var(--color-champagne-gold)]/10 text-[10px] font-mono font-bold tracking-widest uppercase transition-colors cursor-pointer"
                    >
                      + Add Your First Investment
                    </button>
                 </div>
               )}

               {holdings.map((row) => {
                 const isPositive = Number(row.pnl) >= 0;
                 const typeConfig = ASSET_TYPES.find(t => t.value === row.asset_type) || ASSET_TYPES[6];

                 return (
                 <div 
                    key={row.id}
                    onMouseEnter={() => setHoveredNode(row.name)}
                    onMouseLeave={() => setHoveredNode(null)}
                    className="flex flex-row items-center justify-between px-5 py-3.5 bg-[#0d0d0d] border border-[#222] rounded-none hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,0.9)] hover:border-[#383838] hover:bg-[#121212] transition-all duration-200 group cursor-default relative w-full"
                 >
                    {/* Hover Balance Wheel */}
                    <div className={cn("absolute -left-3 opacity-0 transition-opacity duration-300 z-20 pointer-events-none", hoveredNode === row.name && "opacity-100")}>
                       <div className="w-6 h-6 rounded-full border-2 border-[#333] shadow-plate flex items-center justify-center bg-[#0a0a0a]">
                         <div className="w-4 h-4 rounded-full border-2 border-[var(--color-champagne-gold)] animate-balance-wheel flex items-center justify-center">
                            <div className="w-1 h-2 bg-[var(--color-champagne-gold)]"></div>
                         </div>
                       </div>
                    </div>

                    {/* Name and Type */}
                    <div className="flex items-center gap-3 w-56 shrink-0">
                       <div className="flex flex-col min-w-0">
                         <span className="font-mono text-[13px] font-bold tracking-wider text-engraved-gold drop-shadow-md truncate" title={row.name}>
                           {row.name || (row.symbol ? `${row.symbol} Node` : 'Asset Node')}
                         </span>
                         {row.symbol && (
                           <span className="text-[9px] font-mono text-[#666] tracking-widest uppercase">
                             {row.symbol}
                           </span>
                         )}
                       </div>
                       <span className={cn("px-2 py-0.5 text-[8px] font-mono font-bold tracking-widest border uppercase rounded-xs shrink-0", typeConfig.color)}>
                         {typeConfig.badge}
                       </span>
                    </div>

                    {/* Financial Metrics */}
                    <div className="flex-1 flex flex-row items-center justify-between text-right px-4 shrink-0">
                       <div className="flex flex-col text-right w-16">
                           <span className="text-[#555] text-[8px] font-mono font-bold uppercase tracking-widest mb-0.5">QTY</span>
                           <span className="text-[#b0b0b0] font-mono text-[11px] font-bold bg-[#111] px-1.5 py-0.5 rounded-xs border border-[#222]">
                             {Number(row.quantity)}
                           </span>
                       </div>
                       <div className="flex flex-col text-right w-24">
                           <span className="text-[#555] text-[8px] font-mono font-bold uppercase tracking-widest mb-0.5">AVG_PRC</span>
                           <span className="text-[#888] font-mono text-[11px] tracking-wider">{fmt(row.buy_price)}</span>
                       </div>
                       <div className="flex flex-col text-right w-24">
                           <span className="text-[#555] text-[8px] font-mono font-bold uppercase tracking-widest mb-0.5">LTP</span>
                           <span className="text-[var(--color-champagne-gold)] font-mono text-[12px] font-semibold">{fmt(row.current_price || row.buy_price)}</span>
                       </div>
                       <div className="flex flex-col text-right w-28">
                           <span className="text-[#555] text-[8px] font-mono font-bold uppercase tracking-widest mb-0.5">INVESTED</span>
                           <span className="text-[#aaa] font-mono text-[11px]">{fmt(row.amount_invested || (row.quantity * row.buy_price))}</span>
                       </div>
                       <div className="flex flex-col text-right w-28">
                           <span className="text-[#555] text-[8px] font-mono font-bold uppercase tracking-widest mb-0.5">CUR_VAL</span>
                           <span className="text-engraved-gold font-mono text-[13px] font-black">{fmt(row.live_value)}</span>
                       </div>
                    </div>

                    {/* P&L Column */}
                    <div className="w-36 text-right flex flex-col justify-center shrink-0 px-3 border-l border-[#222]">
                       <div className="flex items-center justify-end gap-1">
                         {isPositive ? <TrendingUp className="w-3 h-3 text-[#00ff66]" /> : <TrendingDown className="w-3 h-3 text-[#ff4444]" />}
                         <span className={cn("font-mono text-[11px] font-black tracking-wider", isPositive ? "text-[#00ff66]" : "text-[#ff4444]")}>
                            {isPositive ? '+' : ''}{fmt(row.pnl)}
                         </span>
                       </div>
                       <span className={cn("font-mono text-[9px] font-bold tracking-widest", isPositive ? "text-[#00ff66]/80" : "text-[#ff4444]/80")}>
                          ({isPositive ? '+' : ''}{Number(row.pnl_percent).toFixed(2)}%)
                       </span>
                    </div>

                    {/* Action Buttons (Edit / Delete) */}
                    <div className="w-20 shrink-0 flex items-center justify-end gap-2 pl-3 border-l border-[#222]">
                       <button
                         onClick={(e) => {
                           e.stopPropagation();
                           setSelectedHolding(row);
                           setModalMode('edit');
                         }}
                         title="Edit investment"
                         className="p-1.5 rounded-sm border border-[#333] bg-[#111] hover:border-[var(--color-champagne-gold)] text-[#888] hover:text-[var(--color-champagne-gold)] transition-colors active:scale-90 cursor-pointer"
                       >
                         <Edit2 className="w-3.5 h-3.5" />
                       </button>

                       <button
                         onClick={(e) => {
                           e.stopPropagation();
                           setDeleteTarget(row);
                         }}
                         title="Delete investment"
                         className="p-1.5 rounded-sm border border-[#333] bg-[#111] hover:border-red-500/60 text-[#888] hover:text-red-400 transition-colors active:scale-90 cursor-pointer"
                       >
                         <Trash2 className="w-3.5 h-3.5" />
                       </button>
                    </div>

                 </div>
                 );
               })}
            </div>
         </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// ADD / EDIT MODAL COMPONENT
// -------------------------------------------------------------
function InvestmentFormModal({ mode, holding, onClose, onSave, isSubmitting }) {
  const isEdit = mode === 'edit';

  const [form, setForm] = useState({
    name: holding?.name || '',
    asset_type: holding?.asset_type || 'stock',
    symbol: holding?.symbol || '',
    quantity: holding ? String(holding.quantity) : '1',
    buy_price: holding ? String(holding.buy_price) : '',
    current_price: holding ? String(holding.current_price || holding.buy_price) : '',
    buy_date: holding?.buy_date ? holding.buy_date.split('T')[0] : new Date().toISOString().split('T')[0],
    notes: holding?.notes || ''
  });

  const qty = Number(form.quantity) || 0;
  const bp = Number(form.buy_price) || 0;
  const cp = form.current_price !== '' && !isNaN(Number(form.current_price)) ? Number(form.current_price) : bp;

  const totalInvested = qty * bp;
  const totalCurrentValue = qty * cp;
  const estPnl = totalCurrentValue - totalInvested;
  const estPnlPct = totalInvested > 0 ? (estPnl / totalInvested) * 100 : 0;
  const pnlPositive = estPnl >= 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert('Please enter an investment name');
      return;
    }
    if (!form.buy_price || Number(form.buy_price) < 0) {
      alert('Please enter a valid buy price');
      return;
    }
    if (!form.quantity || Number(form.quantity) <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    onSave({
      name: form.name.trim(),
      asset_type: form.asset_type,
      symbol: form.symbol.trim().toUpperCase(),
      quantity: Number(form.quantity),
      buy_price: Number(form.buy_price),
      current_price: form.current_price !== '' ? Number(form.current_price) : Number(form.buy_price),
      buy_date: form.buy_date,
      notes: form.notes.trim()
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4 font-mono">
       <div className="bg-[#0a0a0a] border border-[var(--color-champagne-gold)] rounded-xl flex flex-col max-w-lg w-full shadow-[0_0_40px_rgba(212,175,55,0.2)] relative overflow-hidden my-auto max-h-[92vh]">
          
          {/* Subtle gold glow behind header */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-[var(--color-champagne-gold)]/10 blur-[60px] pointer-events-none"></div>

          {/* Modal Header */}
          <div className="p-5 border-b border-[#222] bg-[#111] flex items-center justify-between relative z-10">
            <div>
              <h3 className="text-[var(--color-champagne-gold)] font-mono font-black tracking-widest text-base uppercase">
                {isEdit ? 'Modify Holding Node' : 'Allocate Investment Node'}
              </h3>
              <p className="text-[#888] font-mono text-[9px] tracking-[0.2em] uppercase mt-0.5">
                {isEdit ? 'Update position pricing & metrics' : 'Enter asset parameters to track returns'}
              </p>
            </div>
            <button 
              onClick={onClose} 
              className="p-1.5 text-[#666] hover:text-[#bbb] transition-colors rounded-sm hover:bg-[#222] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto relative z-10 flex-1">
            
            {/* Asset Name & Ticker */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[9px] text-[#888] font-bold uppercase tracking-[0.2em] mb-1.5">
                  Asset Name *
                </label>
                <input 
                  type="text" 
                  required
                  value={form.name} 
                  onChange={(e) => setForm({ ...form, name: e.target.value })} 
                  placeholder="e.g. Tata Motors, Nifty 50, Bitcoin" 
                  className="w-full bg-[#111] border border-[#333] p-2.5 text-xs text-engraved-gold font-bold focus:outline-none focus:border-[var(--color-champagne-gold)]" 
                  autoFocus={!isEdit}
                />
              </div>

              <div>
                <label className="block text-[9px] text-[#888] font-bold uppercase tracking-[0.2em] mb-1.5">
                  Ticker / Symbol
                </label>
                <input 
                  type="text" 
                  value={form.symbol} 
                  onChange={(e) => setForm({ ...form, symbol: e.target.value })} 
                  placeholder="e.g. TATAMOTORS" 
                  className="w-full bg-[#111] border border-[#333] p-2.5 text-xs text-[#bbb] uppercase font-bold focus:outline-none focus:border-[var(--color-champagne-gold)]" 
                />
              </div>
            </div>

            {/* Asset Type Selection */}
            <div>
              <label className="block text-[9px] text-[#888] font-bold uppercase tracking-[0.2em] mb-1.5">
                Asset Category
              </label>
              <select 
                value={form.asset_type} 
                onChange={(e) => setForm({ ...form, asset_type: e.target.value })}
                className="w-full bg-[#111] border border-[#333] text-[var(--color-champagne-gold)] text-xs font-semibold p-2.5 focus:outline-none focus:border-[var(--color-champagne-gold)] cursor-pointer"
              >
                 {ASSET_TYPES.map(t => (
                   <option key={t.value} value={t.value}>{t.label}</option>
                 ))}
              </select>
            </div>

            {/* Quantity, Buy Price, Current Price */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[9px] text-[#888] font-bold uppercase tracking-[0.2em] mb-1.5">
                  Quantity / Units *
                </label>
                <input 
                  type="number" 
                  step="any"
                  required
                  min="0.000001"
                  value={form.quantity} 
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })} 
                  placeholder="e.g. 10" 
                  className="w-full bg-[#111] border border-[#333] p-2.5 text-xs text-[#E0E0E0] font-bold focus:outline-none focus:border-[var(--color-champagne-gold)]" 
                />
              </div>

              <div>
                <label className="block text-[9px] text-[#888] font-bold uppercase tracking-[0.2em] mb-1.5">
                  Buy Price / Unit (₹) *
                </label>
                <input 
                  type="number" 
                  step="any"
                  required
                  min="0"
                  value={form.buy_price} 
                  onChange={(e) => setForm({ ...form, buy_price: e.target.value })} 
                  placeholder="e.g. 500" 
                  className="w-full bg-[#111] border border-[#333] p-2.5 text-xs text-engraved-gold font-bold focus:outline-none focus:border-[var(--color-champagne-gold)]" 
                />
              </div>

              <div>
                <label className="block text-[9px] text-[#888] font-bold uppercase tracking-[0.2em] mb-1.5">
                  LTP / Market Price (₹)
                </label>
                <input 
                  type="number" 
                  step="any"
                  min="0"
                  value={form.current_price} 
                  onChange={(e) => setForm({ ...form, current_price: e.target.value })} 
                  placeholder="e.g. 620" 
                  className="w-full bg-[#111] border border-[#333] p-2.5 text-xs text-[#00ff66] font-bold focus:outline-none focus:border-[var(--color-champagne-gold)]" 
                />
              </div>
            </div>

            {/* Date and Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] text-[#888] font-bold uppercase tracking-[0.2em] mb-1.5">
                  Purchase Date
                </label>
                <input 
                  type="date" 
                  value={form.buy_date} 
                  onChange={(e) => setForm({ ...form, buy_date: e.target.value })} 
                  className="w-full bg-[#111] border border-[#333] p-2.5 text-xs text-[#aaa] focus:outline-none focus:border-[var(--color-champagne-gold)]" 
                />
              </div>

              <div>
                <label className="block text-[9px] text-[#888] font-bold uppercase tracking-[0.2em] mb-1.5">
                  Notes (Optional)
                </label>
                <input 
                  type="text" 
                  value={form.notes} 
                  onChange={(e) => setForm({ ...form, notes: e.target.value })} 
                  placeholder="e.g. Long term hold, Zerodha" 
                  className="w-full bg-[#111] border border-[#333] p-2.5 text-xs text-[#aaa] focus:outline-none focus:border-[var(--color-champagne-gold)]" 
                />
              </div>
            </div>

            {/* Live Profit / Loss Calculation Preview Card */}
            <div className="mt-4 p-3.5 bg-[#0e0e0e] border border-[#2a2a2a] rounded-lg space-y-2">
              <div className="flex justify-between items-center text-[10px] uppercase tracking-wider text-[#777]">
                <span>Valuation Preview</span>
                <span className="text-[9px] font-bold text-[#aaa]">LIVE CALCULATION</span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[#222]">
                <div>
                  <span className="text-[8px] text-[#666] uppercase block">Total Invested</span>
                  <span className="text-xs font-bold text-[#bbb]">{fmt(totalInvested)}</span>
                </div>
                <div>
                  <span className="text-[8px] text-[#666] uppercase block">Current Value</span>
                  <span className="text-xs font-bold text-engraved-gold">{fmt(totalCurrentValue)}</span>
                </div>
                <div>
                  <span className="text-[8px] text-[#666] uppercase block">Estimated P&L</span>
                  <span className={cn("text-xs font-black", pnlPositive ? "text-[#00ff66]" : "text-[#ff4444]")}>
                    {pnlPositive ? '+' : ''}{fmt(estPnl)}
                    <span className="text-[9px] block">
                      ({pnlPositive ? '+' : ''}{estPnlPct.toFixed(2)}%)
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 pt-3 border-t border-[#222]">
              <button 
                type="button" 
                onClick={onClose} 
                disabled={isSubmitting}
                className="flex-1 py-2.5 border border-[#333] text-[#888] hover:border-[#666] hover:bg-[#111] text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer"
              >
                Cancel
              </button>
              
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-sunray border border-[var(--color-champagne-gold)] text-[#111] font-black tracking-widest hover:bg-[var(--color-champagne-gold)] transition-all text-[10px] uppercase shadow-[0_0_15px_rgba(212,175,55,0.3)] disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Executing...' : (isEdit ? 'Save Changes' : 'Confirm Allocation')}
              </button>
            </div>

          </form>
       </div>
    </div>,
    document.body
  );
}

// -------------------------------------------------------------
// DELETE CONFIRMATION MODAL COMPONENT
// -------------------------------------------------------------
function DeleteConfirmModal({ holding, onClose, onConfirm, isDeleting }) {
  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 backdrop-blur-sm animate-fade-in p-4 font-mono">
       <div className="bg-[#0a0a0a] border border-red-500/50 rounded-xl flex flex-col max-w-sm w-full p-6 shadow-[0_0_30px_rgba(255,50,50,0.2)] relative overflow-hidden my-auto">
          
          <div className="w-12 h-12 rounded-full border border-red-500/40 bg-red-950/40 flex items-center justify-center mb-4 text-red-400 mx-auto">
             <AlertTriangle className="w-6 h-6" />
          </div>

          <h3 className="text-white font-mono font-bold tracking-widest text-center text-sm uppercase mb-2">
            Delete Holding Node?
          </h3>
          
          <p className="text-[#888] font-mono text-[11px] text-center mb-6 leading-relaxed">
            Are you sure you want to remove <span className="text-engraved-gold font-bold font-mono">"{holding.name}"</span>? This will permanently delete this node and recalculate portfolio valuation.
          </p>

          <div className="flex gap-3">
             <button 
               type="button" 
               onClick={onClose} 
               disabled={isDeleting}
               className="flex-1 py-2.5 border border-[#333] text-[#888] hover:border-[#666] text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer"
             >
               Cancel
             </button>
             
             <button 
               type="button" 
               onClick={onConfirm} 
               disabled={isDeleting}
               className="flex-1 py-2.5 bg-red-700 hover:bg-red-600 border border-red-500 text-white font-bold text-[10px] tracking-widest uppercase transition-colors shadow-[0_0_10px_rgba(255,0,0,0.3)] disabled:opacity-50 cursor-pointer"
             >
               {isDeleting ? 'Deleting...' : 'Delete Node'}
             </button>
          </div>
       </div>
    </div>,
    document.body
  );
}
