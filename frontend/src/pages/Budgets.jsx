import { useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Plus, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Edit2, Trash2, X, Wallet, TrendingDown, Target, AlertTriangle, Settings, Coffee, Home, Plane, ShoppingBag, Play, Activity, Zap, Book, Heart, PiggyBank, Package } from 'lucide-react';
import { cn } from '../lib/utils';

const CATEGORY_STYLES = {
  Food: { color: 'text-[#8B0000]', bg: 'bg-[#111]', border: 'border-[#333]', icon: <Coffee strokeWidth={1.5} className="w-5 h-5" /> },
  Housing: { color: 'text-[#a38a3d]', bg: 'bg-[#1a1a1a]', border: 'border-[#333]', icon: <Home strokeWidth={1.5} className="w-5 h-5" /> },
  Travel: { color: 'text-[#D4AF37]', bg: 'bg-[#111]', border: 'border-[#333]', icon: <Plane strokeWidth={1.5} className="w-5 h-5" /> },
  Shopping: { color: 'text-[#555]', bg: 'bg-[#111]', border: 'border-[#333]', icon: <ShoppingBag strokeWidth={1.5} className="w-5 h-5" /> },
  Entertainment: { color: 'text-[#D4AF37]', bg: 'bg-[#1a1a1a]', border: 'border-[#333]', icon: <Play strokeWidth={1.5} className="w-5 h-5" /> },
  Health: { color: 'text-[#8B0000]', bg: 'bg-[#111]', border: 'border-[#333]', icon: <Activity strokeWidth={1.5} className="w-5 h-5" /> },
  Utilities: { color: 'text-[#2F4F4F]', bg: 'bg-[#111]', border: 'border-[#333]', icon: <Zap strokeWidth={1.5} className="w-5 h-5" /> },
  Education: { color: 'text-[#D4AF37]', bg: 'bg-[#111]', border: 'border-[#333]', icon: <Book strokeWidth={1.5} className="w-5 h-5" /> },
  'Personal Care': { color: 'text-[#888]', bg: 'bg-[#1a1a1a]', border: 'border-[#333]', icon: <Heart strokeWidth={1.5} className="w-5 h-5" /> },
  Savings: { color: 'text-[#005c00]', bg: 'bg-[#111]', border: 'border-[#333]', icon: <PiggyBank strokeWidth={1.5} className="w-5 h-5" /> },
  Other: { color: 'text-[#888]', bg: 'bg-[#111]', border: 'border-[#333]', icon: <Package strokeWidth={1.5} className="w-5 h-5" /> }
};

const getStyle = (cat) => CATEGORY_STYLES[cat] || CATEGORY_STYLES.Other;
const formatInr = (num) => Number(num).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export default function Budgets() {
  const queryClient = useQueryClient();

  // -- STATE: Month Navigation --
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const monthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  const [modalMode, setModalMode] = useState(null); // 'edit', 'delete'
  const [activeBudget, setActiveBudget] = useState(null);
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  // -- API FETCH --
  const { data: alerts, isLoading } = useQuery({
    queryKey: ['budgets', monthStr],
    queryFn: async () => {
      const { data } = await api.get(`/budgets/alerts?month=${monthStr}`);
      return data.data;
    },
    refetchInterval: 5000
  });

  // -- MUTATIONS --
  const deleteMut = useMutation({
    mutationFn: async (id) => await api.delete(`/budgets/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['budgets']);
      setModalMode(null);
      showToast('Budget Deleted');
    }
  });

  // -- COMPUTED STATS --
  const stats = useMemo(() => {
    if (!alerts) return { budgeted: 0, spent: 0, remaining: 0 };
    const budgeted = alerts.reduce((sum, a) => sum + a.limit, 0);
    const spent = alerts.reduce((sum, a) => sum + a.spent, 0);
    return { budgeted, spent, remaining: budgeted - spent };
  }, [alerts]);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const today = new Date();
  const isCurrentMonth = today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();
  const currentDay = isCurrentMonth ? today.getDate() : daysInMonth;
  const daysRemaining = daysInMonth - currentDay;
  const expectedPace = currentDay / daysInMonth; // e.g. 0.5 if halfway through month

  // -- INSIGHTS GENERATOR --
  const insights = useMemo(() => {
    if (!alerts) return [];
    let msgs = [];

    // Day Tracker
    if (isCurrentMonth && daysRemaining > 0) {
      msgs.push({ type: 'info', text: `${daysRemaining} ticks remaining in ${currentDate.toLocaleString('default', { month: 'long' }).toUpperCase()} — regulate velocity.` });
    }

    alerts.forEach(a => {
      const pct = a.percentage / 100;
      if (pct >= 1) {
        msgs.push({ type: 'danger', icon: <AlertTriangle className="w-4 h-4 text-[#8B0000]" />, text: `${a.category.toUpperCase()} constraint breached (${a.percentage.toFixed(0)}%) — ₹${formatInr(a.spent - a.limit)} deficit!` });
      } else if (pct >= 0.8) {
        msgs.push({ type: 'warning', icon: <AlertCircle className="w-4 h-4 text-[#a38a3d]" />, text: `${a.category.toUpperCase()} at ${a.percentage.toFixed(0)}% capacity — ₹${formatInr(a.limit - a.spent)} margin available.` });
      } else if (isCurrentMonth && (pct > expectedPace + 0.15)) {
        // Pacing warning (spending too fast)
        const projected = (a.spent / currentDay) * daysInMonth;
        if (projected > a.limit) {
          msgs.push({ type: 'warning', icon: <TrendingDown className="w-4 h-4 text-[#a38a3d]" />, text: `Bleed rate critical: ${a.category.toUpperCase()} projecting ₹${formatInr(projected - a.limit)} structural overrun.` });
        }
      } else if (pct < 0.6 && a.limit > 0 && isCurrentMonth && currentDay > 15) {
        msgs.push({ type: 'success', icon: <CheckCircle2 className="w-4 h-4 text-[#005c00]" />, text: `${a.category.toUpperCase()} optimizing efficiently — ₹${formatInr(a.limit - a.spent)} buffer active!` });
      }
    });

    if (msgs.length === 0 && alerts.length > 0) {
      msgs.push({ type: 'success', icon: <CheckCircle2 className="w-4 h-4 text-[#005c00]" />, text: `Mechanism running optimally across all vectors.` });
    }
    return msgs;
  }, [alerts, isCurrentMonth, daysRemaining, currentDay, daysInMonth, expectedPace, currentDate]);

  return (
    <div className="space-y-6 animate-fade-in pb-20 relative z-0 min-h-[90vh]">
      <div className="fixed inset-0 pointer-events-none bg-cotes-de-geneve animate-cotes-breathe z-[-1]"></div>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-sunray plate-border text-[#D4AF37] px-6 py-3 rounded-sm shadow-plate z-50 flex items-center mb-8 animate-fade-in font-sans font-bold text-[10px] tracking-widest uppercase">
          {toast}
        </div>
      )}

      {/* HEADER & MONTH SELECTOR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#333] pb-4 relative z-10">
        <div>
          <h1 className="text-3xl font-sans text-engraved-gold tracking-widest font-bold pt-6 px-6">BUDGETS</h1>
          <p className="text-xs font-sans font-bold text-[#888] uppercase tracking-widest mt-1 px-6">Set Your Spending Limits</p>
        </div>

        <div className="flex items-center justify-between bg-[#0d0d0d] px-2 py-2 rounded-sm shadow-[var(--shadow-recessed)] border border-[#333] min-w-[280px]">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-[#1a1a1a] rounded-sm transition-colors text-[#888] hover:text-[#D4AF37] border border-transparent hover:border-[#333] animate-button-compress"><ChevronLeft className="w-5 h-5" /></button>
          <span className="font-sans font-bold text-sm uppercase text-engraved-gold tracking-[0.2em] px-2">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={handleNextMonth} className="p-2 hover:bg-[#1a1a1a] rounded-sm transition-colors text-[#888] hover:text-[#D4AF37] border border-transparent hover:border-[#333] animate-button-compress"><ChevronRight className="w-5 h-5" /></button>
        </div>

        <button onClick={() => { setActiveBudget(null); setModalMode('edit'); }} className="flex justify-center items-center px-6 py-3 bg-[#1a1a1a] text-[#000] bg-[#D4AF37] rounded-sm shadow-plate border border-[#D4AF37] hover:bg-[#b0912c] transition-all font-bold tracking-widest uppercase text-[10px] animate-button-compress">
          <Plus className="w-4 h-4 mr-1" /> ALLOCATE BUDGET
        </button>
      </div>

      {/* SUMMARY STATS BAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        <div className="bg-sunray p-6 rounded-sm shadow-plate border-y border-r border-y-[#333] border-r-[#333] border-l-[4px] border-l-[#D4AF37] flex items-center space-x-6 relative overflow-hidden group hover:border-[#555] transition-all plate-border">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><Target className="w-24 h-24 text-[#D4AF37]" /></div>
          <div className="w-14 h-14 bg-[#0d0d0d] rounded-sm flex items-center justify-center border border-[#333] shadow-[var(--shadow-recessed)] relative z-10"><Target className="w-6 h-6 text-[#D4AF37]" /></div>
          <div className="relative z-10"><p className="text-[9px] font-sans font-bold text-[#888] uppercase tracking-[0.2em]">Total Budget</p><p className="text-2xl font-mono font-black text-engraved-gold mt-1 drop-shadow-sm">₹{formatInr(stats.budgeted)}</p></div>
        </div>
        <div className="bg-sunray p-6 rounded-sm shadow-plate border-y border-r border-y-[#333] border-r-[#333] border-l-[4px] border-l-[#8B0000] flex items-center space-x-6 relative overflow-hidden group hover:border-[#555] transition-all plate-border">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><TrendingDown className="w-24 h-24 text-[#8B0000]" /></div>
          <div className="w-14 h-14 bg-[#0d0d0d] rounded-sm flex items-center justify-center border border-[#333] shadow-[var(--shadow-recessed)] relative z-10"><TrendingDown className="w-6 h-6 text-[#8B0000]" /></div>
          <div className="relative z-10"><p className="text-[9px] font-sans font-bold text-[#888] uppercase tracking-[0.2em]">Total Spent</p><p className="text-2xl font-mono font-black text-[#8B0000] mt-1 drop-shadow-sm">₹{formatInr(stats.spent)}</p></div>
        </div>
        <div className={`bg-sunray p-6 rounded-sm shadow-plate border-y border-r border-y-[#333] border-r-[#333] border-l-[4px] ${stats.remaining >= 0 ? 'border-l-[#005c00]' : 'border-l-[#8B0000]'} flex items-center space-x-6 relative overflow-hidden group hover:border-[#555] transition-all plate-border`}>
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><Wallet className="w-24 h-24 text-current" /></div>
          <div className="w-14 h-14 bg-[#0d0d0d] rounded-sm flex items-center justify-center border border-[#333] shadow-[var(--shadow-recessed)] relative z-10">
            <Wallet className={`w-6 h-6 ${stats.remaining >= 0 ? 'text-[#005c00]' : 'text-[#8B0000]'}`} />
          </div>
          <div className="relative z-10">
            <p className="text-[9px] font-sans font-bold text-[#888] uppercase tracking-[0.2em]">{stats.remaining >= 0 ? 'Remaining' : 'Over Budget'}</p>
            <p className={`text-2xl font-mono font-black mt-1 ${stats.remaining >= 0 ? 'text-[#005c00]' : 'text-[#8B0000]'}`}>₹{formatInr(Math.abs(stats.remaining))}</p>
          </div>
        </div>
      </div>

      {/* MAIN CARDS GRID + SIDEBAR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start relative z-10">
        <div className="col-span-1 lg:col-span-2 space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => <div key={i} className="bg-sunray plate-border p-6 rounded-sm border border-[#333] animate-pulse h-40"></div>)}
            </div>
          ) : alerts?.length === 0 ? (
            <div className="bg-sunray p-16 rounded-sm shadow-plate plate-border border border-[#333] text-center flex flex-col items-center">
              <div className="w-24 h-24 bg-[#0d0d0d] border border-[#333] rounded-sm flex items-center justify-center mb-6 shadow-[var(--shadow-recessed)]">
                <Target className="w-10 h-10 text-[#888]" />
              </div>
              <h2 className="text-xl font-sans font-bold tracking-widest uppercase text-engraved-gold mb-2">No Budget Set Yet</h2>
              <p className="text-[#888] max-w-md mb-8 text-[11px] uppercase tracking-widest font-bold">Set budget limits for each category to track your spending.</p>
              <button onClick={() => { setActiveBudget(null); setModalMode('edit'); }} className="px-8 py-4 bg-[#1a1a1a] border border-[#D4AF37] bg-[#D4AF37] text-[#000] font-bold text-[10px] tracking-widest uppercase rounded-sm shadow-plate hover:bg-[#b0912c] transition-all hover:scale-105 active:scale-95 animate-button-compress">
                ENGAGE CALIBRATION
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {alerts?.map((alert) => (
                <BudgetCard
                  key={alert.category}
                  alert={alert}
                  onEdit={(b) => { setActiveBudget(b); setModalMode('edit'); }}
                  onDelete={(b) => { setActiveBudget(b); setModalMode('delete'); }}
                />
              ))}
            </div>
          )}
        </div>

        {/* INSIGHTS PANEL (Sticky) */}
        {!isLoading && alerts?.length > 0 && (
          <div className="col-span-1 lg:sticky lg:top-8 space-y-6">
            <div className="bg-sunray p-6 rounded-sm shadow-plate border border-[#333] relative overflow-hidden plate-border">
              <div className="flex items-center mb-6 border-b border-[#333] pb-4">
                <Settings className="w-6 h-6 text-[#D4AF37] mr-3 animate-gear-spin" />
                <h3 className="text-sm font-sans font-bold tracking-widest uppercase text-engraved-gold drop-shadow-md">Smart Insights</h3>
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {insights.map((insight, idx) => {
                  let blockClass = "bg-[#111] border-[#333] text-[#888] shadow-[var(--shadow-recessed)]";
                  if (insight.type === 'danger') blockClass = "bg-[#1a0a0a] border-[#8B0000] text-[#8B0000] shadow-plate";
                  if (insight.type === 'warning') blockClass = "bg-[#1a1a0f] border-[#a38a3d] text-[#a38a3d] shadow-plate";
                  if (insight.type === 'success') blockClass = "bg-[#0a1a0a] border-[#005c00] text-[#005c00] shadow-plate";

                  return (
                    <div key={idx} className={`flex items-start p-4 rounded-sm border ${blockClass}`}>
                      {(insight.type === 'info') && <AlertCircle className="w-4 h-4 text-[#888] mt-0.5 mr-3 flex-shrink-0" />}
                      {insight.icon && <div className="mt-0.5 mr-3 flex-shrink-0 text-current">{insight.icon}</div>}
                      <span className={`text-[10px] uppercase tracking-widest font-bold leading-loose text-current`}>
                        {insight.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      {modalMode === 'delete' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in font-sans">
          <div className="bg-sunray shadow-plate plate-border rounded-sm p-8 w-full max-w-sm relative overflow-hidden z-10 my-auto">
            <h3 className="text-xl font-bold tracking-widest text-[#8B0000] mb-2 relative z-10 uppercase">Delete Budget</h3>
            <p className="text-[#888] text-[11px] font-bold mb-8 relative z-10 tracking-widest uppercase">Are you sure you want to delete budget for <b className="text-engraved-gold">{activeBudget?.category}</b>? This category will no longer be tracked.</p>
            <div className="flex gap-4 relative z-10">
              <button onClick={() => setModalMode(null)} className="flex-1 py-3 bg-[#111] border border-[#333] text-[#888] font-bold rounded-sm hover:border-[#555] shadow-[var(--shadow-recessed)] transition-colors text-[10px] uppercase tracking-widest text-center animate-button-compress">Cancel</button>
              <button onClick={() => deleteMut.mutate(activeBudget.id)} className="flex-1 py-3 border border-[#8B0000] bg-[#1a0a0a] text-[#8B0000] font-bold rounded-sm hover:bg-[#8B0000] hover:text-[#fff] shadow-plate transition-all flex justify-center items-center text-[10px] uppercase tracking-widest animate-button-compress">
                {deleteMut.isPending ? <Settings className="w-4 h-4 animate-gear-spin text-[#8B0000]" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {(modalMode === 'edit') && (
        <BudgetModal
          tx={activeBudget}
          monthStr={monthStr}
          onClose={() => setModalMode(null)}
          onSuccess={(cat, limit) => {
            queryClient.invalidateQueries(['budgets']);
            setModalMode(null);
            showToast(`Budget saved for ${cat} : ₹${formatInr(limit)}/mo`);
          }}
        />
      )}
    </div>
  );
}

function BudgetModal({ tx, monthStr, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    category: tx?.category || 'Food',
    monthly_limit: tx?.limit || '',
    month: tx ? tx.month : monthStr
  });

  const mut = useMutation({
    mutationFn: async (data) => await api.post('/budgets', data),
    onSuccess: () => onSuccess(formData.category, formData.monthly_limit)
  });

  const onSubmit = (e) => {
    e.preventDefault();
    mut.mutate({ ...formData, monthly_limit: Number(formData.monthly_limit) });
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in font-sans">
      <div className="bg-sunray plate-border shadow-plate rounded-sm w-full max-w-md overflow-hidden flex flex-col relative z-20 my-auto">
        <div className="flex justify-between items-center p-6 border-b border-[#333] relative z-10 bg-[#0d0d0d]">
          <h3 className="text-sm font-bold tracking-widest text-[#D4AF37] uppercase">{tx ? 'Edit Budget' : 'Create Budget'}</h3>
          <button onClick={onClose} className="p-2 bg-[#111] border border-[#333] shadow-[var(--shadow-recessed)] rounded-sm hover:border-[#D4AF37] hover:text-[#D4AF37] text-[#888] animate-button-compress transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 relative z-10 bg-sunray">
          <form id="bg-form" onSubmit={onSubmit} className="space-y-6">
            <div>
              <label className="block text-[11px] font-bold text-[#888] uppercase tracking-widest mb-2">Category *</label>
              <select required disabled={!!tx} value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full bg-[#0d0d0d] border border-[#333] shadow-[var(--shadow-recessed)] rounded-sm p-3 outline-none focus:border-[#D4AF37] text-[13px] font-bold text-[#e0e0e0] uppercase tracking-widest appearance-none disabled:opacity-50">
                {Object.keys(CATEGORY_STYLES).map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#888] uppercase tracking-widest mb-2">Monthly Max Limit (₹) *</label>
              <input type="number" required min="1" step="1" value={formData.monthly_limit} onChange={e => setFormData({ ...formData, monthly_limit: e.target.value })} className="w-full bg-[#111] border border-[#333] shadow-[var(--shadow-recessed)] rounded-sm p-4 outline-none focus:border-[#D4AF37] text-xl font-mono font-black text-engraved-gold tracking-tight text-center placeholder-[#555]" placeholder="10000" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#888] uppercase tracking-widest mb-2">Month</label>
              <input type="month" required value={formData.month} onChange={e => setFormData({ ...formData, month: e.target.value })} className="w-full bg-[#0d0d0d] border border-[#333] shadow-[var(--shadow-recessed)] rounded-sm p-3 outline-none focus:border-[#D4AF37] text-xs font-mono font-bold text-[#e0e0e0] [color-scheme:dark]" />
            </div>
          </form>
        </div>
        <div className="p-5 border-t border-[#333] bg-[#050505] flex gap-4 relative z-10">
          <button type="button" onClick={onClose} className="flex-[0.5] py-3.5 bg-[#111] border border-[#333] shadow-[var(--shadow-recessed)] text-[#888] font-bold text-[10px] tracking-widest uppercase rounded-sm hover:border-[#555] transition-colors animate-button-compress">Abort</button>
          <button type="submit" form="bg-form" disabled={mut.isPending} className="flex-1 py-3.5 bg-[#1a1a1a] border border-[#D4AF37] text-[#000] bg-[#D4AF37] font-bold text-[10px] tracking-widest uppercase rounded-sm shadow-plate hover:bg-[#b0912c] transition-all flex justify-center items-center animate-button-compress">
            {mut.isPending ? <Settings className="w-4 h-4 animate-gear-spin text-[#000]" /> : 'Save Budget'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function BudgetCard({ alert, onEdit, onDelete }) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const style = getStyle(alert.category);
  const pct = alert.percentage;

  let barColor = "bg-[#005c00]";
  if (pct > 100) barColor = "bg-[#8B0000] shadow-[0_0_15px_rgba(139,0,0,0.8)]";
  else if (pct >= 86) barColor = "bg-[#a38a3d] shadow-[0_0_10px_rgba(163,138,61,0.5)]";
  else if (pct >= 61) barColor = "bg-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.4)]";

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative rounded-[2px] p-[1px] overflow-hidden group transition-transform duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
    >
      {/* Dynamic Border Layer */}
      <div 
        className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
        style={{
          background: isHovered 
            ? `radial-gradient(150px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(198, 163, 79, 1), #333 100%)`
            : '#333'
        }}
      />

      {/* Main Card Content */}
      <div className="relative h-full bg-[#0D0D0D] p-6 z-10 overflow-hidden flex flex-col justify-between rounded-[1px]">
        {/* Grain Layer */}
        <div 
          className="absolute inset-0 opacity-30 pointer-events-none mix-blend-screen"
          style={{
             backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(255, 255, 255, 0.03) 1px, rgba(255, 255, 255, 0.03) 2px)`
          }}
        />

        {/* Sweep Layer - 45 deg Ellipse */}
        <div 
          className="absolute pointer-events-none transition-opacity duration-150 ease-out z-0"
          style={{
             left: mousePosition.x - 400,
             top: mousePosition.y - 150,
             width: 800,
             height: 300,
             transform: 'rotate(-45deg)',
             background: `radial-gradient(ellipse 50% 50%, rgba(198, 163, 79, 0.15) 0%, transparent 100%)`,
             opacity: isHovered ? 1 : 0
          }}
        />

        {/* The top accent line */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-[#333] z-20">
          <div className={`h-full w-full ${barColor}`} style={{ maxWidth: `${Math.min(pct, 100)}%` }}></div>
        </div>

        {/* Content */}
        <div className="relative z-20 flex justify-between items-start mb-6 mt-1 pointer-events-none">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-[#2a2a2a] rounded-lg flex items-center justify-center text-[#888]">
              {style.icon}
            </div>
            <h3 className="font-sans font-bold tracking-widest uppercase text-sm text-[#e0e0e0] drop-shadow-sm group-hover:text-white transition-colors">{alert.category}</h3>
          </div>
          {/* Hover Actions */}
          <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-2 pointer-events-auto">
            <button onClick={() => onEdit(alert)} className="p-2 text-[#888] hover:text-[#D4AF37] hover:bg-[#1a1a1a] border border-transparent hover:border-[#333] rounded-sm transition-colors animate-button-compress"><Edit2 className="w-4 h-4" /></button>
            <button onClick={() => onDelete(alert)} className="p-2 text-[#888] hover:text-[#8B0000] hover:bg-[#1a1a1a] border border-transparent hover:border-[#333] rounded-sm transition-colors animate-button-compress"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="relative z-20 flex justify-between items-end mb-3 pointer-events-none">
          <div className="text-[#888] text-[9px] font-sans font-bold uppercase tracking-[0.2em] leading-none mb-1 group-hover:text-[#aaa] transition-colors">Spent</div>
          <div className="text-right leading-none">
            <span className={`text-xl font-mono font-black tracking-tight transition-all duration-300 inline-block ${pct > 100 ? 'text-[#8B0000]' : 'text-engraved-gold group-hover:brightness-125 group-hover:drop-shadow-[0_0_8px_rgba(198,163,79,0.5)]'}`}>
              ₹{formatInr(alert.spent)}
            </span>
            <span className="text-[10px] font-sans font-bold text-[#555] ml-1 uppercase tracking-widest">/ ₹{formatInr(alert.limit)}</span>
          </div>
        </div>

        <div className="relative z-20 w-full bg-[#111] rounded-[1px] h-1.5 mb-3 overflow-hidden shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)] border border-[#222]">
          <div className={cn("h-full transition-all duration-1000 ease-out", barColor)} style={{ width: `${Math.min(pct, 100)}%` }}></div>
        </div>

        <div className="relative z-20 flex justify-between items-center mt-2 cursor-default pointer-events-none">
          <p className={`text-[9px] font-sans font-bold uppercase tracking-[0.2em] ${pct > 100 ? 'text-[#8B0000]' : 'text-[#888]'}`}>{pct.toFixed(0)}% USED</p>
          {pct > 100 && (
            <div className="flex items-center text-[#8B0000] text-[9px] font-sans font-bold tracking-widest uppercase px-2 py-0.5 bg-[#8B0000]/10 border border-[#8B0000]/30 rounded-sm">
              <AlertTriangle className="w-3 h-3 mr-1" /> ₹{formatInr(alert.spent - alert.limit)} BREACH
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

