import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { parseStatementFile } from '../lib/fileParser';
import { 
  Plus, Search, Filter, Edit2, Trash2, UploadCloud, X, 
  ChevronLeft, ChevronRight, Upload, Settings, FileText, 
  FileSpreadsheet, Check, CheckSquare, Square, AlertCircle, 
  ArrowUpRight, ArrowDownLeft 
} from 'lucide-react';

const CATEGORY_COLORS = {
  Food: 'bg-[#111] text-[#8B0000] border-[#333] shadow-[var(--shadow-recessed)]',
  Travel: 'bg-[#111] text-[#D4AF37] border-[#333] shadow-[var(--shadow-recessed)]',
  Shopping: 'bg-[#111] text-[#a38a3d] border-[#333] shadow-[var(--shadow-recessed)]',
  Housing: 'bg-[#111] text-[#8B0000] border-[#333] shadow-[var(--shadow-recessed)]',
  Salary: 'bg-[#111] text-[#00C853] border-[#333] shadow-[var(--shadow-recessed)]',
  Health: 'bg-[#111] text-[#8B0000] border-[#333] shadow-[var(--shadow-recessed)]',
  Entertainment: 'bg-[#111] text-[#D4AF37] border-[#333] shadow-[var(--shadow-recessed)]',
  Utilities: 'bg-[#111] text-[#2F4F4F] border-[#333] shadow-[var(--shadow-recessed)]',
  Other: 'bg-[#111] text-[#888] border-[#333] shadow-[var(--shadow-recessed)]'
};

const getBadgeColor = (cat) => CATEGORY_COLORS[cat] || CATEGORY_COLORS.Other;
const formatInr = (num) => Number(num || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

export default function Transactions() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [filters, setFilters] = useState({
    type: '',
    category: [],
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: ''
  });

  const [showFilters, setShowFilters] = useState(false);
  const [modalMode, setModalMode] = useState(null);
  const [activeTx, setActiveTx] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', page, limit, filters],
    queryFn: async () => {
      const params = new URLSearchParams({ page, limit });
      if (filters.type && filters.type !== 'all') params.append('type', filters.type);
      if (filters.category.length > 0) params.append('category', filters.category.join(','));
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.minAmount) params.append('minAmount', filters.minAmount);
      if (filters.maxAmount) params.append('maxAmount', filters.maxAmount);

      const res = await api.get(`/transactions?${params.toString()}`);
      return res.data;
    }
  });

  const txs = useMemo(() => data?.data || [], [data?.data]);
  const pagination = data?.pagination || { total: 0, page: 1, totalPages: 1 };

  const filteredTxs = useMemo(() => {
    if (!debouncedSearch) return txs;
    const lower = debouncedSearch.toLowerCase();
    return txs.filter(t =>
      t.merchant?.toLowerCase().includes(lower) ||
      t.category?.toLowerCase().includes(lower) ||
      t.notes?.toLowerCase().includes(lower)
    );
  }, [txs, debouncedSearch]);

  const activeFilterCount = Object.values(filters).filter(v =>
    (Array.isArray(v) && v.length > 0) || (typeof v === 'string' && v !== '' && v !== 'all')
  ).length;

  const deleteMut = useMutation({
    mutationFn: async (id) => await api.delete(`/transactions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['transactions']);
      queryClient.invalidateQueries(['analytics']);
      setModalMode(null);
      showToast('Transaction deleted');
    }
  });

  return (
    <div className="space-y-6 animate-fade-in pb-20 relative z-0 min-h-[90vh]">
      <div className="fixed inset-0 pointer-events-none bg-cotes-de-geneve animate-cotes-breathe z-[-1]"></div>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-sunray plate-border text-[#D4AF37] px-6 py-3 rounded-sm shadow-plate z-50 flex items-center animate-fade-in font-sans font-bold text-sm tracking-widest uppercase">
          {toast}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#333] pb-6">
        <div>
          <h1 className="text-[28px] font-bebas tracking-[4px] text-engraved-gold flex items-center shadow-gold-text pt-6 px-6">
            TRANSACTIONS
          </h1>
          <p className="text-[#888] font-mono text-[10px] tracking-[0.2em] uppercase mt-1 px-6">Status: Online • Track Spending & Incoming Money</p>
        </div>
        <div className="flex w-full sm:w-auto gap-3 px-6">
          <button onClick={() => setModalMode('import')} className="flex-1 sm:flex-none flex items-center px-4 py-2 bg-[#0d0d0d] border border-[#333] text-[#888] hover:text-[#D4AF37] hover:border-[#D4AF37] shadow-[var(--shadow-recessed)] animate-button-compress transition-all justify-center font-sans font-bold tracking-widest rounded-sm">
            <UploadCloud className="w-4 h-4 mr-2" /> IMPORT STATEMENT
          </button>
          <button onClick={() => { setActiveTx(null); setModalMode('add'); }} className="flex-1 sm:flex-none flex items-center px-5 py-2 bg-[#1a1a1a] border border-[#D4AF37] text-engraved-gold shadow-plate hover:bg-[#D4AF37] hover:text-[#000] animate-button-compress transition-all justify-center font-sans font-bold tracking-widest rounded-sm">
            <Plus className="w-4 h-4 mr-1" /> CREATE
          </button>
        </div>
      </div>

      {/* Quick Type Selection Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex bg-[#0d0d0d] p-1 border border-[#333] rounded-sm shadow-[var(--shadow-recessed)]">
          <button 
            onClick={() => { setFilters(f => ({ ...f, type: '' })); setPage(1); }}
            className={`px-5 py-2 text-xs font-sans font-bold tracking-widest uppercase rounded-sm transition-all ${
              !filters.type || filters.type === 'all'
                ? 'bg-[#1f1f1f] text-[#D4AF37] shadow-plate border border-[#444]'
                : 'text-[#888] hover:text-[#e0e0e0]'
            }`}
          >
            All Logs
          </button>
          <button 
            onClick={() => { setFilters(f => ({ ...f, type: 'income' })); setPage(1); }}
            className={`px-5 py-2 text-xs font-sans font-bold tracking-widest uppercase rounded-sm transition-all flex items-center gap-1.5 ${
              filters.type === 'income'
                ? 'bg-[#0a1a0a] text-[#00C853] shadow-plate border border-[#00C853]'
                : 'text-[#888] hover:text-[#00C853]'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            Incoming Money
          </button>
          <button 
            onClick={() => { setFilters(f => ({ ...f, type: 'expense' })); setPage(1); }}
            className={`px-5 py-2 text-xs font-sans font-bold tracking-widest uppercase rounded-sm transition-all flex items-center gap-1.5 ${
              filters.type === 'expense'
                ? 'bg-[#1a0a0a] text-[#CC0000] shadow-plate border border-[#8B0000]'
                : 'text-[#888] hover:text-[#CC0000]'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            Spending Money
          </button>
        </div>

        <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center px-6 py-2.5 border rounded-sm transition-all font-sans font-bold tracking-widest text-xs animate-button-compress ${showFilters || activeFilterCount > 0 ? 'bg-[#D4AF37] border-[#D4AF37] text-[#000] shadow-plate' : 'bg-[#111] border-[#333] text-[#888] shadow-[var(--shadow-recessed)] hover:text-[#D4AF37] hover:border-[#D4AF37]'}`}>
          <Filter className="w-3.5 h-3.5 mr-2" />
          MORE FILTERS {activeFilterCount > 0 && <span className="ml-2 bg-[#050505] text-[#D4AF37] text-[10px] px-2 py-0.5 rounded-sm border border-[#333]">{activeFilterCount}</span>}
        </button>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555] group-focus-within:text-[#D4AF37] transition-colors w-5 h-5" />
        <input
          type="text"
          placeholder="Search by merchant, category, notes, or txn ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-[#0d0d0d] border border-[#333] rounded-sm outline-none focus:shadow-[var(--shadow-recessed)] focus:border-[#D4AF37] transition-all text-sm font-sans font-bold tracking-wide text-engraved-gold placeholder-[#555] shadow-[var(--shadow-recessed)]"
        />
      </div>

      {showFilters && (
        <div className="bg-sunray p-6 rounded-sm shadow-plate plate-border animate-fade-in relative z-10">
          <div className="flex justify-between items-center mb-5 relative z-10">
            <h3 className="font-sans font-bold tracking-widest uppercase text-engraved-gold">Filters</h3>
            <button onClick={() => setFilters({ type: '', category: [], startDate: '', endDate: '', minAmount: '', maxAmount: '' })} className="text-xs font-bold text-[#888] uppercase tracking-wider hover:text-[#D4AF37] transition-colors">Reset All</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
            <div>
              <label className="block text-[11px] font-sans font-bold text-[#888] uppercase tracking-widest mb-2">Type</label>
              <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })} className="w-full border border-[#333] bg-[#0d0d0d] text-[#e0e0e0] rounded-sm p-3 text-sm font-sans font-bold outline-none focus:border-[#D4AF37] focus:shadow-[var(--shadow-recessed)] shadow-[var(--shadow-recessed)] transition-all">
                <option value="all">All (Income & Expense)</option>
                <option value="income">Income (Incoming Only)</option>
                <option value="expense">Expense (Spending Only)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-sans font-bold text-[#888] uppercase tracking-widest mb-2">Category</label>
              <input type="text" placeholder="e.g. Food, Travel" disabled title="Multi-select UI simplified for demo" value={filters.category.join(', ')} onChange={(e) => setFilters({ ...filters, category: e.target.value ? e.target.value.split(',').map(s => s.trim()) : [] })} className="w-full border border-[#333] bg-[#111] text-[#555] rounded-sm p-3 text-sm font-sans font-bold shadow-[var(--shadow-recessed)] outline-none cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-[11px] font-sans font-bold text-[#888] uppercase tracking-widest mb-2">Date Range</label>
              <div className="flex gap-2">
                <input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} className="w-full border border-[#333] bg-[#0d0d0d] text-[#e0e0e0] shadow-[var(--shadow-recessed)] rounded-sm p-2 text-[11px] font-mono outline-none focus:border-[#D4AF37] transition-all [color-scheme:dark]" />
                <input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} className="w-full border border-[#333] bg-[#0d0d0d] text-[#e0e0e0] shadow-[var(--shadow-recessed)] rounded-sm p-2 text-[11px] font-mono outline-none focus:border-[#D4AF37] transition-all [color-scheme:dark]" />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-sans font-bold text-[#888] uppercase tracking-widest mb-2">Amount Range</label>
              <div className="flex gap-2">
                <input type="number" placeholder="Min ₹" value={filters.minAmount} onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })} className="w-full border border-[#333] shadow-[var(--shadow-recessed)] bg-[#0d0d0d] text-engraved-gold placeholder-[#555] rounded-sm p-3 text-sm font-mono font-bold outline-none focus:border-[#D4AF37] transition-all" />
                <input type="number" placeholder="Max ₹" value={filters.maxAmount} onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })} className="w-full border border-[#333] shadow-[var(--shadow-recessed)] bg-[#0d0d0d] text-engraved-gold placeholder-[#555] rounded-sm p-3 text-sm font-mono font-bold outline-none focus:border-[#D4AF37] transition-all" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-sunray rounded-sm shadow-plate plate-border overflow-hidden">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center text-[#D4AF37]">
            <Settings className="w-8 h-8 animate-gear-spin mb-4 text-[#D4AF37]" />
            <p className="font-bold tracking-widest uppercase text-sm font-sans">Loading...</p>
          </div>
        ) : filteredTxs.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center">
            <div className="w-24 h-24 bg-[#0d0d0d] border border-[#333] rounded-full flex items-center justify-center mb-6 shadow-[var(--shadow-recessed)]">
              <Search className="w-10 h-10 text-[#555]" />
            </div>
            <p className="text-2xl font-sans font-bold tracking-widest text-[#D4AF37] mb-2 uppercase">No Transactions Found</p>
            <p className="text-[#888] max-w-sm mb-8 text-xs font-bold uppercase tracking-widest">Try adjusting your filters or import a statement.</p>
            <button onClick={() => { setActiveTx(null); setModalMode('add'); }} className="px-8 py-3 bg-[#111] border border-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#000] text-engraved-gold rounded-sm shadow-plate animate-button-compress font-bold tracking-widest uppercase text-sm transition-all">
              Add Transaction
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto min-h-[400px]">
            <table className="min-w-full divide-y divide-[#333]">
              <thead className="bg-[#050505]">
                <tr>
                  <th className="px-6 py-4 text-left text-[9px] font-sans font-bold text-[#888] uppercase tracking-[0.2em]">Date</th>
                  <th className="px-6 py-4 text-left text-[9px] font-sans font-bold text-[#888] uppercase tracking-[0.2em]">Type</th>
                  <th className="px-6 py-4 text-left text-[9px] font-sans font-bold text-[#888] uppercase tracking-[0.2em]">Description</th>
                  <th className="px-6 py-4 text-left text-[9px] font-sans font-bold text-[#888] uppercase tracking-[0.2em]">Category</th>
                  <th className="px-6 py-4 text-right text-[9px] font-sans font-bold text-[#888] uppercase tracking-[0.2em]">Amount</th>
                  <th className="px-6 py-4 text-center text-[9px] font-sans font-bold text-[#888] uppercase tracking-[0.2em] w-20">Control</th>
                </tr>
              </thead>
              <tbody className="bg-transparent divide-y divide-[#222]">
                {filteredTxs.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#111] transition-colors group">
                    <td className="px-6 py-5 whitespace-nowrap text-[11px] text-[#e0e0e0] font-sans font-bold tracking-widest uppercase">
                      {new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex items-center gap-1 text-[9px] uppercase tracking-widest font-sans font-bold rounded-sm border ${
                        tx.type === 'income' 
                          ? 'bg-[#0a1a0a] text-[#00C853] border-[#00C853]/40 shadow-plate' 
                          : 'bg-[#1a0a0a] text-[#888] border-[#333]'
                      }`}>
                        {tx.type === 'income' ? <ArrowUpRight className="w-3 h-3 text-[#00C853]" /> : <ArrowDownLeft className="w-3 h-3 text-[#CC0000]" />}
                        {tx.type === 'income' ? 'Income' : 'Expense'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-[13px] font-bold text-engraved-gold uppercase tracking-widest">{tx.merchant}</div>
                      {tx.notes && <div className="text-[10px] font-sans font-medium text-[#888] mt-1.5 truncate max-w-[280px] uppercase tracking-widest">{tx.notes}</div>}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-[9px] uppercase tracking-widest font-sans font-bold rounded-sm border ${getBadgeColor(tx.category)}`}>
                        {tx.category || 'OTHER'}
                      </span>
                    </td>
                    <td className={`px-6 py-5 whitespace-nowrap text-right font-mono font-black text-lg ${tx.type === 'income' ? 'text-[#00C853]' : 'text-engraved-gold'}`}>
                      {tx.type === 'income' ? '+' : '-'}₹{formatInr(tx.amount)}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-center text-sm">
                      <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-3">
                        <button onClick={() => { setActiveTx(tx); setModalMode('edit'); }} className="p-2 text-[#888] hover:text-[#D4AF37] hover:bg-[#1a1a1a] rounded-sm transition-colors border border-transparent hover:border-[#333] shadow-[var(--shadow-recessed)]">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setActiveTx(tx); setModalMode('delete'); }} className="p-2 text-[#888] hover:text-[#8B0000] hover:bg-[#1a1a1a] rounded-sm transition-colors border border-transparent hover:border-[#333] shadow-[var(--shadow-recessed)]">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && txs.length > 0 && !debouncedSearch && (
          <div className="bg-[#050505] px-6 py-4 border-t border-[#333] flex items-center justify-between">
            <p className="text-[10px] font-sans font-bold text-[#888] uppercase tracking-widest">
              Showing <span className="text-[#e0e0e0]">{(page - 1) * limit + 1}</span> to <span className="text-[#e0e0e0]">{Math.min(page * limit, pagination.total)}</span> of <span className="text-[#D4AF37]">{pagination.total}</span>
            </p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-1 px-2 border border-[#333] rounded-sm hover:bg-[#111] hover:border-[#555] disabled:opacity-30 disabled:cursor-not-allowed bg-[#0d0d0d] text-[#e0e0e0] transition-all shadow-[var(--shadow-recessed)] animate-button-compress">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-4 py-1.5 text-[10px] font-sans font-bold text-engraved-gold tracking-widest bg-[#0d0d0d] plate-border shadow-[var(--shadow-recessed)]">Page {page} / {pagination.totalPages}</div>
              <button disabled={page === pagination.totalPages} onClick={() => setPage(p => p + 1)} className="p-1 px-2 border border-[#333] rounded-sm hover:bg-[#111] hover:border-[#555] disabled:opacity-30 disabled:cursor-not-allowed bg-[#0d0d0d] text-[#e0e0e0] transition-all shadow-[var(--shadow-recessed)] animate-button-compress">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {modalMode === 'delete' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in font-sans">
          <div className="bg-sunray shadow-plate plate-border rounded-sm p-8 w-full max-w-sm relative overflow-hidden my-auto">
            <h3 className="text-xl font-bold tracking-widest text-[#8B0000] mb-2 relative z-10 uppercase">Delete Transaction</h3>
            <p className="text-[#888] text-[11px] font-bold mb-8 relative z-10 tracking-widest uppercase">Are you sure you want to delete <b className="text-engraved-gold">{activeTx?.merchant}</b>? This action cannot be undone.</p>
            <div className="flex gap-4 relative z-10">
              <button onClick={() => setModalMode(null)} className="flex-1 py-3 bg-[#111] border border-[#333] text-[#888] font-bold rounded-sm hover:border-[#555] shadow-[var(--shadow-recessed)] transition-colors text-[10px] uppercase tracking-widest text-center animate-button-compress">Cancel</button>
              <button onClick={() => deleteMut.mutate(activeTx.id)} className="flex-1 py-3 border border-[#8B0000] bg-[#1a0a0a] text-[#8B0000] font-bold rounded-sm hover:bg-[#8B0000] hover:text-[#fff] shadow-plate transition-all flex justify-center items-center text-[10px] uppercase tracking-widest animate-button-compress">
                {deleteMut.isPending ? <Settings className="w-4 h-4 animate-gear-spin" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {(modalMode === 'add' || modalMode === 'edit') && (
        <TransactionModal
          mode={modalMode}
          tx={activeTx}
          onClose={() => setModalMode(null)}
          onSuccess={() => {
            queryClient.invalidateQueries(['transactions']);
            queryClient.invalidateQueries(['analytics']);
            setModalMode(null);
            showToast(modalMode === 'add' ? 'Transaction added!' : 'Transaction updated!');
          }}
        />
      )}

      {modalMode === 'import' && (
        <ImportStatementModal
          onClose={() => setModalMode(null)}
          onSuccess={(inserted) => {
            queryClient.invalidateQueries(['transactions']);
            queryClient.invalidateQueries(['analytics']);
            setModalMode(null);
            showToast(`${inserted} transactions imported!`);
          }}
        />
      )}
    </div>
  );
}

function TransactionModal({ mode, tx, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    type: tx?.type || 'expense', merchant: tx?.merchant || '', amount: tx?.amount || '',
    category: tx?.category || '', date: tx ? tx.date.split('T')[0] : new Date().toISOString().split('T')[0], notes: tx?.notes || ''
  });

  const mut = useMutation({
    mutationFn: async (data) => mode === 'add' ? await api.post('/transactions', data) : await api.put(`/transactions/${tx.id}`, data),
    onSuccess
  });

  const onSubmit = (e) => {
    e.preventDefault();
    mut.mutate({ ...formData, amount: Number(formData.amount) });
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in font-sans overflow-y-auto">
      <div className="bg-sunray plate-border shadow-plate rounded-sm w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] relative z-20 my-auto">
        <div className="flex justify-between items-center p-6 border-b border-[#333] relative z-10 bg-[#0d0d0d]">
          <h3 className="text-sm font-bold tracking-widest text-[#D4AF37] uppercase">{mode === 'add' ? 'Add Transaction' : 'Edit Transaction'}</h3>
          <button onClick={onClose} className="p-2 bg-[#111] border border-[#333] shadow-[var(--shadow-recessed)] rounded-sm hover:border-[#D4AF37] hover:text-[#D4AF37] text-[#888] animate-button-compress transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 overflow-y-auto relative z-10 bg-sunray">
          <form id="tx-form" onSubmit={onSubmit} className="space-y-6">
            <div className="flex p-1.5 bg-[#0d0d0d] border border-[#333] rounded-sm shadow-[var(--shadow-recessed)]">
              <button type="button" onClick={() => setFormData({ ...formData, type: 'expense' })} className={`flex-1 py-2.5 text-[10px] tracking-[0.2em] uppercase font-bold rounded-sm transition-all ${formData.type === 'expense' ? 'bg-[#1a0a0a] border border-[#8B0000] text-[#8B0000] shadow-plate' : 'text-[#888] hover:text-[#e0e0e0]'}`}>Expense</button>
              <button type="button" onClick={() => setFormData({ ...formData, type: 'income' })} className={`flex-1 py-2.5 text-[10px] tracking-[0.2em] uppercase font-bold rounded-sm transition-all ${formData.type === 'income' ? 'bg-[#0a1a0a] border border-[#005c00] text-[#005c00] shadow-plate' : 'text-[#888] hover:text-[#e0e0e0]'}`}>Income</button>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#888] uppercase tracking-widest mb-2">Amount (₹) *</label>
              <input type="number" required min="0" step="any" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} className="w-full bg-[#111] border border-[#333] shadow-[var(--shadow-recessed)] rounded-sm p-4 outline-none focus:border-[#D4AF37] text-xl font-mono font-black text-engraved-gold tracking-tight text-center placeholder-[#555]" placeholder="0" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#888] uppercase tracking-widest mb-2">Merchant / Description *</label>
              <input type="text" required value={formData.merchant} onChange={e => setFormData({ ...formData, merchant: e.target.value })} className="w-full bg-[#0d0d0d] border border-[#333] shadow-[var(--shadow-recessed)] rounded-sm p-3 outline-none focus:border-[#D4AF37] text-[13px] font-bold text-[#e0e0e0] placeholder-[#555] uppercase tracking-widest" placeholder="e.g. Amazon, Salary" />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-[11px] font-bold text-[#888] uppercase tracking-widest mb-2">Date *</label>
                <input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full bg-[#0d0d0d] border border-[#333] shadow-[var(--shadow-recessed)] rounded-sm p-2 outline-none focus:border-[#D4AF37] text-xs font-mono font-bold text-[#e0e0e0] [color-scheme:dark]" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#888] uppercase tracking-widest mb-2">Category</label>
                <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full bg-[#0d0d0d] border border-[#333] shadow-[var(--shadow-recessed)] rounded-sm p-2.5 outline-none focus:border-[#D4AF37] text-xs font-bold text-[#e0e0e0] uppercase tracking-widest">
                  <option value="">Auto</option>
                  <option value="Food">Food</option>
                  <option value="Travel">Travel</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Housing">Housing</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Health">Health</option>
                  <option value="Salary">Salary</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#888] uppercase tracking-widest mb-2">Notes (Optional)</label>
              <input type="text" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="w-full bg-[#0d0d0d] border border-[#333] shadow-[var(--shadow-recessed)] rounded-sm p-3 outline-none focus:border-[#D4AF37] text-[11px] font-bold text-[#888] uppercase tracking-widest placeholder-[#555]" placeholder="Add a note..." />
            </div>
          </form>
        </div>
        <div className="p-5 border-t border-[#333] bg-[#050505] flex gap-4 relative z-10">
          <button type="button" onClick={onClose} className="flex-[0.5] py-3.5 bg-[#111] border border-[#333] shadow-[var(--shadow-recessed)] text-[#888] font-bold text-[10px] tracking-widest uppercase rounded-sm hover:border-[#555] transition-colors animate-button-compress">Cancel</button>
          <button type="submit" form="tx-form" disabled={mut.isPending} className="flex-1 py-3.5 bg-[#D4AF37] text-[#000] border border-[#D4AF37] font-bold text-[10px] tracking-widest uppercase rounded-sm shadow-plate hover:bg-[#b0912c] transition-all flex justify-center items-center animate-button-compress">
            {mut.isPending ? <Settings className="w-4 h-4 animate-gear-spin text-[#000]" /> : (mode === 'add' ? 'Save' : 'Update')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function ImportStatementModal({ onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [previewPage, setPreviewPage] = useState(1);
  const previewLimit = 25;

  const mut = useMutation({
    mutationFn: async (transactions) => {
      const payload = transactions.map(t => ({
        date: t.date,
        merchant: t.merchant,
        amount: Number(t.amount),
        type: t.type,
        category: t.category,
        notes: t.notes || ''
      }));
      const res = await api.post('/transactions/import', { transactions: payload });
      return res.data;
    },
    onSuccess: (data) => {
      onSuccess(data.inserted);
    },
    onError: (err) => {
      setParseError(err.response?.data?.error || 'Import failed. Please try again.');
    }
  });

  const handleFileSelect = async (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setParseError('');
    setIsParsing(true);
    setPreviewPage(1);

    try {
      const results = await parseStatementFile(selectedFile);
      if (!results || results.length === 0) {
        setParseError('No valid transaction rows found in the selected file. Please make sure the statement has dates, amounts, and descriptions.');
        setParsedRows([]);
      } else {
        setParsedRows(results);
      }
    } catch (err) {
      console.error('File parsing error:', err);
      setParseError(err.message || 'Error parsing file. Please check format.');
      setParsedRows([]);
    } finally {
      setIsParsing(false);
    }
  };

  const toggleSelectRow = (index) => {
    setParsedRows(prev => prev.map((r, i) => i === index ? { ...r, selected: !r.selected } : r));
  };

  const toggleAll = (selectVal) => {
    setParsedRows(prev => prev.map(r => ({ ...r, selected: selectVal })));
  };

  const updateRowField = (index, field, value) => {
    setParsedRows(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  };

  const removeRow = (index) => {
    setParsedRows(prev => prev.filter((_, i) => i !== index));
  };

  const selectedTransactions = useMemo(() => {
    return parsedRows.filter(r => r.selected);
  }, [parsedRows]);

  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    selectedTransactions.forEach(t => {
      if (t.type === 'income') income += Number(t.amount || 0);
      else expense += Number(t.amount || 0);
    });
    return { income, expense, count: selectedTransactions.length };
  }, [selectedTransactions]);

  const previewTotalPages = Math.ceil(parsedRows.length / previewLimit) || 1;
  const paginatedRows = useMemo(() => {
    const start = (previewPage - 1) * previewLimit;
    return parsedRows.slice(start, start + previewLimit).map((row, idx) => ({
      ...row,
      originalIndex: start + idx
    }));
  }, [parsedRows, previewPage]);

  const handleImport = () => {
    if (selectedTransactions.length === 0) return;
    mut.mutate(selectedTransactions);
  };

  const getFileIcon = () => {
    if (!file) return <Upload className="w-12 h-12 text-[#D4AF37] mx-auto mb-3" />;
    const name = file.name.toLowerCase();
    if (name.endsWith('.pdf')) return <FileText className="w-12 h-12 text-[#8B0000] mx-auto mb-3" />;
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) return <FileSpreadsheet className="w-12 h-12 text-[#005c00] mx-auto mb-3" />;
    return <UploadCloud className="w-12 h-12 text-[#D4AF37] mx-auto mb-3" />;
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in font-sans overflow-y-auto">
      <div className={`bg-sunray shadow-plate plate-border rounded-sm w-full ${parsedRows.length > 0 ? 'max-w-4xl' : 'max-w-lg'} relative overflow-hidden my-auto transition-all duration-300 max-h-[92vh] flex flex-col`}>
        
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-[#333] relative z-10 bg-[#0d0d0d]">
          <div>
            <h3 className="text-sm font-bold tracking-widest text-[#D4AF37] uppercase flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-[#D4AF37]" />
              Import Statement / Transactions
            </h3>
            <p className="text-[10px] text-[#888] font-bold tracking-widest uppercase mt-0.5">
              Supports PhonePe, GPay, Bank Statements (PDF), CSV, Excel (.xlsx, .xls), & TXT
            </p>
          </div>
          <button onClick={onClose} className="p-2 bg-[#111] border border-[#333] shadow-[var(--shadow-recessed)] rounded-sm hover:border-[#D4AF37] text-[#888] hover:text-[#D4AF37] transition-colors animate-button-compress">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto relative z-10 bg-sunray space-y-6 flex-1">
          {parsedRows.length === 0 ? (
            /* Upload Zone */
            <div className="space-y-4">
              <div 
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
                }}
                className={`border-2 border-dashed rounded-sm p-10 text-center transition-all bg-[#0d0d0d] shadow-[var(--shadow-recessed)] relative ${isDragging ? 'border-[#D4AF37] bg-[#1a1811]' : 'border-[#444] hover:border-[#D4AF37]'}`}
              >
                {isParsing ? (
                  <div className="py-6 flex flex-col items-center">
                    <Settings className="w-12 h-12 text-[#D4AF37] animate-gear-spin mb-4" />
                    <p className="text-xs font-bold text-engraved-gold uppercase tracking-widest mb-1">Parsing Statement File...</p>
                    <p className="text-[10px] text-[#888] font-mono tracking-wider">Extracting dates, merchants, debit & credit amounts across all pages...</p>
                  </div>
                ) : (
                  <>
                    {getFileIcon()}
                    <p className="text-xs font-bold tracking-widest uppercase text-[#e0e0e0] mb-1">
                      Drag & Drop or Browse Your File
                    </p>
                    <p className="text-[10px] text-[#888] font-bold tracking-widest uppercase mb-6 leading-relaxed">
                      PhonePe Statement PDF • Bank Statement PDF • CSV Export • Excel Sheet (.xlsx) • Notepad (.txt)
                    </p>

                    <label className="inline-flex items-center px-6 py-3 bg-[#111] border border-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#000] text-engraved-gold rounded-sm shadow-plate font-sans font-bold tracking-widest uppercase text-xs cursor-pointer transition-all animate-button-compress">
                      <Upload className="w-3.5 h-3.5 mr-2" /> Select File
                      <input 
                        type="file" 
                        accept=".csv, .pdf, .xlsx, .xls, .txt, text/csv, application/pdf, text/plain, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
                        }} 
                        className="hidden" 
                      />
                    </label>
                  </>
                )}
              </div>

              {parseError && (
                <div className="p-4 bg-[#1a0a0a] border border-[#8B0000] rounded-sm flex items-start gap-3 text-[#e0e0e0] text-xs font-sans animate-fade-in">
                  <AlertCircle className="w-5 h-5 text-[#8B0000] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-[#8B0000] uppercase tracking-wider mb-1">Parsing Error</p>
                    <p className="text-[11px] text-[#888] font-bold uppercase tracking-wide leading-relaxed">{parseError}</p>
                  </div>
                </div>
              )}

              {/* Supported Format Badges */}
              <div className="bg-[#050505] p-4 border border-[#333] rounded-sm shadow-[var(--shadow-recessed)]">
                <p className="text-[10px] font-sans font-bold text-[#888] uppercase tracking-widest mb-3">Supported Formats & Auto-Detection:</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[10px] font-bold uppercase tracking-widest">
                  <div className="p-2 bg-[#111] border border-[#333] rounded-sm text-[#D4AF37]">📄 CSV & TSV</div>
                  <div className="p-2 bg-[#111] border border-[#333] rounded-sm text-[#e0e0e0]">📑 PhonePe & Bank PDF</div>
                  <div className="p-2 bg-[#111] border border-[#333] rounded-sm text-[#005c00]">📊 Excel XLSX</div>
                  <div className="p-2 bg-[#111] border border-[#333] rounded-sm text-[#888]">📝 TXT Files</div>
                </div>
              </div>
            </div>
          ) : (
            /* Review & Preview Table */
            <div className="space-y-5">
              {/* Top File Summary Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#050505] p-4 border border-[#333] rounded-sm shadow-[var(--shadow-recessed)] gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-engraved-gold uppercase tracking-wider">{file?.name}</span>
                    <span className="text-[10px] font-mono text-[#888] bg-[#111] px-2 py-0.5 rounded-sm border border-[#333]">
                      {(file?.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <p className="text-[10px] text-[#888] font-bold uppercase tracking-widest mt-1">
                    Found {parsedRows.length} transactions across your statement. Review and edit before importing.
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => toggleAll(true)} 
                    className="px-3 py-1.5 bg-[#111] border border-[#333] text-[#888] hover:text-[#D4AF37] hover:border-[#D4AF37] text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all animate-button-compress"
                  >
                    Select All
                  </button>
                  <button 
                    onClick={() => toggleAll(false)} 
                    className="px-3 py-1.5 bg-[#111] border border-[#333] text-[#888] hover:text-[#e0e0e0] text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all animate-button-compress"
                  >
                    Clear
                  </button>
                  <button 
                    onClick={() => { setParsedRows([]); setFile(null); }} 
                    className="px-3 py-1.5 bg-[#1a0a0a] border border-[#8B0000] text-[#8B0000] text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all animate-button-compress"
                  >
                    Change File
                  </button>
                </div>
              </div>

              {/* Summary Stats Badges */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#0d0d0d] border border-[#333] p-3 rounded-sm text-center shadow-[var(--shadow-recessed)]">
                  <p className="text-[9px] font-bold text-[#888] uppercase tracking-widest mb-1">Selected</p>
                  <p className="text-base font-bold text-engraved-gold">{summary.count} / {parsedRows.length}</p>
                </div>
                <div className="bg-[#0d0d0d] border border-[#333] p-3 rounded-sm text-center shadow-[var(--shadow-recessed)]">
                  <p className="text-[9px] font-bold text-[#888] uppercase tracking-widest mb-1">Total Expense</p>
                  <p className="text-base font-bold text-engraved-gold font-mono">-₹{formatInr(summary.expense)}</p>
                </div>
                <div className="bg-[#0d0d0d] border border-[#333] p-3 rounded-sm text-center shadow-[var(--shadow-recessed)]">
                  <p className="text-[9px] font-bold text-[#888] uppercase tracking-widest mb-1">Total Income (Incoming)</p>
                  <p className="text-base font-bold text-[#00C853] font-mono">+₹{formatInr(summary.income)}</p>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-[#333] rounded-sm overflow-hidden bg-[#050505] shadow-[var(--shadow-recessed)] max-h-[360px] overflow-y-auto">
                <table className="min-w-full divide-y divide-[#333] text-left">
                  <thead className="bg-[#0d0d0d] sticky top-0 z-10 border-b border-[#333]">
                    <tr>
                      <th className="px-3 py-3 w-10 text-center">
                        <button 
                          onClick={() => toggleAll(selectedTransactions.length !== parsedRows.length)}
                          className="text-[#888] hover:text-[#D4AF37]"
                        >
                          {selectedTransactions.length === parsedRows.length ? (
                            <CheckSquare className="w-4 h-4 text-[#D4AF37]" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="px-3 py-3 text-[9px] font-bold text-[#888] uppercase tracking-widest">Date</th>
                      <th className="px-3 py-3 text-[9px] font-bold text-[#888] uppercase tracking-widest">Description / Merchant</th>
                      <th className="px-3 py-3 text-[9px] font-bold text-[#888] uppercase tracking-widest">Category</th>
                      <th className="px-3 py-3 text-[9px] font-bold text-[#888] uppercase tracking-widest">Type</th>
                      <th className="px-3 py-3 text-right text-[9px] font-bold text-[#888] uppercase tracking-widest">Amount (₹)</th>
                      <th className="px-3 py-3 w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222]">
                    {paginatedRows.map((row) => {
                      const idx = row.originalIndex;
                      return (
                        <tr 
                          key={row.id || idx} 
                          className={`transition-colors ${row.selected ? 'hover:bg-[#111]' : 'opacity-40 bg-[#080808]'}`}
                        >
                          <td className="px-3 py-2.5 text-center">
                            <button onClick={() => toggleSelectRow(idx)} className="text-[#888] hover:text-[#D4AF37]">
                              {row.selected ? (
                                <CheckSquare className="w-4 h-4 text-[#D4AF37]" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <input 
                              type="date" 
                              value={row.date} 
                              onChange={(e) => updateRowField(idx, 'date', e.target.value)}
                              className="bg-[#0d0d0d] border border-[#333] text-[#e0e0e0] rounded-sm p-1 text-[11px] font-mono outline-none focus:border-[#D4AF37] [color-scheme:dark]" 
                            />
                          </td>
                          <td className="px-3 py-2.5">
                            <input 
                              type="text" 
                              value={row.merchant} 
                              onChange={(e) => updateRowField(idx, 'merchant', e.target.value)}
                              className="w-full bg-[#0d0d0d] border border-[#333] text-[#e0e0e0] rounded-sm p-1.5 text-xs font-bold uppercase tracking-wider outline-none focus:border-[#D4AF37]"
                            />
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <select 
                              value={row.category || 'Other'} 
                              onChange={(e) => updateRowField(idx, 'category', e.target.value)}
                              className="bg-[#0d0d0d] border border-[#333] text-[#e0e0e0] rounded-sm p-1.5 text-[11px] font-bold uppercase tracking-wider outline-none focus:border-[#D4AF37]"
                            >
                              <option value="Food">Food</option>
                              <option value="Travel">Travel</option>
                              <option value="Shopping">Shopping</option>
                              <option value="Salary">Salary</option>
                              <option value="Housing">Housing</option>
                              <option value="Entertainment">Entertainment</option>
                              <option value="Utilities">Utilities</option>
                              <option value="Health">Health</option>
                              <option value="Other">Other</option>
                            </select>
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => updateRowField(idx, 'type', row.type === 'income' ? 'expense' : 'income')}
                              className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest rounded-sm border transition-all ${
                                row.type === 'income' 
                                  ? 'bg-[#0a1a0a] border-[#00C853] text-[#00C853] shadow-plate' 
                                  : 'bg-[#1a0a0a] border-[#8B0000] text-[#CC0000] shadow-plate'
                              }`}
                            >
                              {row.type}
                            </button>
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap text-right">
                            <input 
                              type="number" 
                              min="0"
                              step="any"
                              value={row.amount} 
                              onChange={(e) => updateRowField(idx, 'amount', e.target.value)}
                              className="w-24 bg-[#0d0d0d] border border-[#333] text-right text-engraved-gold font-mono font-bold rounded-sm p-1.5 text-xs outline-none focus:border-[#D4AF37]"
                            />
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <button onClick={() => removeRow(idx)} className="text-[#666] hover:text-[#8B0000] p-1">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Preview Pagination */}
              {previewTotalPages > 1 && (
                <div className="flex items-center justify-between px-2 pt-1 text-[10px] font-sans font-bold text-[#888] uppercase tracking-widest">
                  <span>Showing page {previewPage} of {previewTotalPages} ({parsedRows.length} items total)</span>
                  <div className="flex gap-2">
                    <button 
                      disabled={previewPage === 1}
                      onClick={() => setPreviewPage(p => p - 1)}
                      className="px-3 py-1 bg-[#0d0d0d] border border-[#333] rounded-sm disabled:opacity-30 hover:border-[#D4AF37] text-engraved-gold transition-all"
                    >
                      Prev
                    </button>
                    <button 
                      disabled={previewPage === previewTotalPages}
                      onClick={() => setPreviewPage(p => p + 1)}
                      className="px-3 py-1 bg-[#0d0d0d] border border-[#333] rounded-sm disabled:opacity-30 hover:border-[#D4AF37] text-engraved-gold transition-all"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-[#333] bg-[#050505] flex justify-between items-center relative z-10">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-6 py-3 bg-[#111] border border-[#333] shadow-[var(--shadow-recessed)] text-[#888] hover:text-[#e0e0e0] font-bold text-[10px] tracking-widest uppercase rounded-sm hover:border-[#555] transition-colors animate-button-compress"
          >
            Cancel
          </button>

          {parsedRows.length > 0 && (
            <button 
              type="button" 
              onClick={handleImport} 
              disabled={selectedTransactions.length === 0 || mut.isPending}
              className="px-8 py-3 bg-[#D4AF37] text-[#000] border border-[#D4AF37] font-bold text-[11px] tracking-widest uppercase rounded-sm shadow-plate hover:bg-[#b0912c] transition-all flex items-center gap-2 animate-button-compress disabled:opacity-40"
            >
              {mut.isPending ? (
                <>
                  <Settings className="w-4 h-4 animate-gear-spin text-[#000]" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-[#000]" />
                  <span>Import {selectedTransactions.length} Transactions</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
}