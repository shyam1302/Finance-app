import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { cn } from '../lib/utils';
import { Calculator, Calendar, Landmark, Plus, Trash2, Edit2, ChevronDown, ChevronUp, AlertCircle, PlayCircle, Home, Car, CreditCard, BookOpen, Gift, Shield, Activity, Monitor, Coffee, Settings } from 'lucide-react';

const formatInr = (num) => Number(Math.max(0, num || 0)).toLocaleString('en-IN', { maximumFractionDigits: 0 });

// Categories and icons mapping
const LOAN_TYPES = {
  'Home Loan': Home, 'Car Loan': Car, 'Personal Loan': CreditCard, 'Education Loan': BookOpen, 'Credit Card': CreditCard, 'Other': Calculator
};
const SUB_CATS = {
  'Streaming': Monitor, 'Fitness': Activity, 'Software': Calculator, 'Insurance': Shield, 'Utility': Home, 'Other': Gift
};
const SUB_COLORS = {
  'Streaming': 'text-[#8B0000] bg-[#1a0f0f] border-[#333]',
  'Fitness': 'text-[#005c00] bg-[#0a1a0a] border-[#333]',
  'Software': 'text-[#D4AF37] bg-[#1a1a0f] border-[#333]',
  'Insurance': 'text-[#a38a3d] bg-[#111] border-[#333]',
  'Utility': 'text-[#555] bg-[#1a1a1a] border-[#333]',
  'Other': 'text-[#888] bg-[#0d0d0d] border-[#222]',
};

// Horology panel style
const horologyPanelClass = "bg-sunray shadow-plate plate-border rounded-sm";
const horologyPanelAltClass = "bg-[#111] border border-[#333] shadow-[var(--shadow-recessed)] rounded-sm";

export default function Planner() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('plannerTab') || 'loans');
  
  useEffect(() => { localStorage.setItem('plannerTab', activeTab); }, [activeTab]);

  // Modals Data
  const [loanModal, setLoanModal] = useState(null); // { mode, data }
  const [subModal, setSubModal] = useState(null);
  const [taxModal, setTaxModal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { title, name, path }

  // Queries
  const { data: loans = [], isLoading: loadingLoans } = useQuery({ queryKey:['loans'], queryFn: async () => (await api.get('/loans')).data.data });
  const { data: subs = [], isLoading: loadingSubs } = useQuery({ queryKey:['subscriptions'], queryFn: async () => (await api.get('/subscriptions')).data.data });
  const { data: taxRaw, isLoading: loadingTaxes } = useQuery({ queryKey:['taxes'], queryFn: async () => (await api.get('/taxes')).data.data });

  // Mutations
  const executeMut = useMutation({
     mutationFn: async ({ path, method, data }) => {
        if(method === 'DELETE') return await api.delete(path);
        if(method === 'PUT') return await api.put(path, data);
        return await api.post(path, data);
     },
     onSuccess: (_, v) => {
        if(v.path.includes('loans')) queryClient.invalidateQueries(['loans']);
        if(v.path.includes('subscription')) queryClient.invalidateQueries(['subscriptions']);
        if(v.path.includes('tax')) queryClient.invalidateQueries(['taxes']);
        setLoanModal(null); setSubModal(null); setTaxModal(null); setDeleteConfirm(null);
     }
  });

  const tabs = [
    { id: 'loans', label: 'LOANS & EMIs', icon: Calculator },
    { id: 'subs', label: 'SUBSCRIPTIONS', icon: Calendar },
    { id: 'tax', label: 'TAX PLANNER [80C]', icon: Landmark }
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-20 relative min-h-[90vh]">
      <div className="fixed inset-0 pointer-events-none bg-cotes-de-geneve animate-cotes-breathe z-[-1]"></div>
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#333] pb-4 relative z-10">
        <h1 className="text-2xl font-bold text-engraved-gold tracking-[0.2em] uppercase font-sans drop-shadow-sm pt-6 px-6">
          Financial Caliber Planner
        </h1>
        <div className="flex bg-[#0d0d0d] rounded-sm shadow-[var(--shadow-recessed)] border border-[#333] p-1 w-full sm:w-auto overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center px-4 py-2 text-[10px] font-bold transition-all tracking-[0.2em] uppercase whitespace-nowrap rounded-sm animate-button-compress",
                activeTab === tab.id 
                  ? "bg-[#1a1a1a] text-[#D4AF37] border border-[#D4AF37] shadow-plate" 
                  : "text-[#888] hover:text-[#e0e0e0] border border-transparent hover:bg-[#111]"
              )}
            >
              <tab.icon className="w-3 h-3 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-[500px] relative z-10 font-sans">
        {activeTab === 'loans' && <LoansTab loans={loans} isLoading={loadingLoans} onAdd={()=>setLoanModal({mode:'add'})} onEdit={l=>setLoanModal({mode:'edit', data:l})} onDelete={l=>setDeleteConfirm({title:'Loan / EMI', name:l.lender_name, path:`/loans/${l.id}`})} />}
        {activeTab === 'subs' && <SubsTab subs={subs} isLoading={loadingSubs} onAdd={()=>setSubModal({mode:'add'})} onEdit={s=>setSubModal({mode:'edit', data:s})} onDelete={s=>setDeleteConfirm({title:'Automated Node', name:s.name, path:`/subscriptions/${s.id}`})} />}
        {activeTab === 'tax' && <TaxTab taxRaw={taxRaw} isLoading={loadingTaxes} onAdd={preset=>setTaxModal({mode:'add', data:preset})} onEdit={t=>setTaxModal({mode:'edit', data:t})} onDelete={t=>setDeleteConfirm({title:'80C Asset', name:t.scheme, path:`/taxes/investments/${t.id}`})} />}
      </div>

      {deleteConfirm && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in font-sans">
          <div className="bg-sunray shadow-plate plate-border rounded-sm p-8 w-full max-w-sm relative overflow-hidden my-auto">
            <h3 className="text-xl font-bold tracking-widest text-[#8B0000] mb-2 uppercase">Delete {deleteConfirm.title}</h3>
            <p className="text-[#888] text-[11px] font-bold mb-8 tracking-widest uppercase">
              Are you sure you want to delete <b className="text-engraved-gold">{deleteConfirm.name}</b>? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={()=>setDeleteConfirm(null)} 
                className="flex-1 py-3 bg-[#111] border border-[#333] text-[#888] hover:text-[#e0e0e0] font-bold rounded-sm shadow-[var(--shadow-recessed)] transition-colors text-[10px] uppercase tracking-widest text-center animate-button-compress"
              >
                Cancel
              </button>
              <button 
                onClick={()=>executeMut.mutate({path: deleteConfirm.path, method:'DELETE'})} 
                disabled={executeMut.isPending}
                className="flex-1 py-3 border border-[#8B0000] bg-[#1a0a0a] text-[#8B0000] hover:bg-[#8B0000] hover:text-[#fff] font-bold rounded-sm shadow-plate transition-all flex justify-center items-center text-[10px] uppercase tracking-widest animate-button-compress"
              >
                {executeMut.isPending ? <Settings className="w-4 h-4 animate-gear-spin" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {loanModal && <LoanEditorModal initial={loanModal.data} onClose={()=>setLoanModal(null)} onSave={(d)=>executeMut.mutate({path: loanModal.data ? `/loans/${loanModal.data.id}` : '/loans', method: loanModal.data ? 'PUT' : 'POST', data:d})} />}
      {subModal && <SubEditorModal initial={subModal.data} onClose={()=>setSubModal(null)} onSave={(d)=>executeMut.mutate({path: subModal.data ? `/subscriptions/${subModal.data.id}` : '/subscriptions', method: subModal.data ? 'PUT' : 'POST', data:d})} />}
      {taxModal && <TaxEditorModal initial={taxModal.data} onClose={()=>setTaxModal(null)} onSave={(d)=>executeMut.mutate({path: taxModal.data && taxModal.data.id ? `/taxes/investments/${taxModal.data.id}` : '/taxes/investments', method: taxModal.data && taxModal.data.id ? 'PUT' : 'POST', data:d})} />}
    </div>
  );
}

// -------------------------------------------------------------
// TAB 1: LOANS
// -------------------------------------------------------------
function LoansTab({ loans, isLoading, onAdd, onEdit, onDelete }) {
   const [expanded, setExpanded] = useState({});

   const toggleL = (id) => setExpanded(p => ({...p, [id]: !p[id]}));

   const sumOut = loans.reduce((acc,l)=>acc+Number(l.outstanding||0), 0);
   const sumPrin = loans.reduce((acc,l)=>acc+Number(l.principal||0), 0);
   const sumEmi = loans.reduce((acc,l)=>acc+Number(l.emi_amount||0), 0);

   return (
      <div className="space-y-6 animate-fade-in w-full">
        {/* STATS HEADER */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
           <div className={`${horologyPanelClass} p-5 border-l-[4px] border-l-[#8B0000] flex flex-col justify-center`}>
             <span className="text-[#888] text-[9px] font-bold uppercase tracking-[0.2em]">Total Outstanding Liability</span>
             <span className="text-xl font-mono font-black text-[#8B0000] mt-1 tracking-tight">₹{formatInr(sumOut)}</span>
           </div>
           <div className={`${horologyPanelAltClass} bg-sunray plate-border p-5 flex flex-col justify-center`}>
             <span className="text-[#888] text-[9px] font-bold uppercase tracking-[0.2em]">Monthly Caliber Burden (EMI)</span>
             <span className="text-xl font-mono font-black text-engraved-gold mt-1 tracking-tight">₹{formatInr(sumEmi)}<span className="text-[10px] font-sans text-[#555] ml-1 uppercase tracking-widest">/mo</span></span>
           </div>
           <div className={`${horologyPanelAltClass} bg-sunray plate-border p-5 hidden sm:flex flex-col justify-center`}>
             <span className="text-[#888] text-[9px] font-bold uppercase tracking-[0.2em]">Total Mechanism Principal</span>
             <span className="text-xl font-mono font-black text-[#e0e0e0] mt-1 tracking-tight drop-shadow-sm">₹{formatInr(sumPrin)}</span>
           </div>
           <div className={`${horologyPanelAltClass} bg-sunray plate-border p-5 hidden sm:flex flex-col justify-center`}>
             <span className="text-[#888] text-[9px] font-bold uppercase tracking-[0.2em]">Est. Interest Bleed</span>
             <span className="text-xl font-mono font-black text-[#D4AF37] mt-1 tracking-tight">₹{formatInr(sumPrin * 0.15)}</span>
           </div>
        </div>

        <div className="flex justify-between items-center px-1 mt-8 mb-4">
          <h2 className="text-[11px] font-bold text-[#E0E0E0] tracking-[0.3em] uppercase border-b border-[#333] pb-1">Active Financial Cogs</h2>
          <button onClick={onAdd} className="flex items-center px-4 py-2 text-[10px] border border-[#D4AF37] bg-[#111] text-engraved-gold font-bold uppercase tracking-widest shadow-[var(--shadow-recessed)] hover:bg-[#1a1a1a] transition-all animate-button-compress rounded-sm">
            <Plus className="w-4 h-4 mr-1" /> Provision Mechanism
          </button>
        </div>

        {isLoading ? (
           <div className={`${horologyPanelAltClass} h-64 flex bg-sunray plate-border items-center justify-center`}>
              <Settings className="w-8 h-8 text-[#D4AF37] animate-gear-spin mr-3" />
              <span className="text-[#888] font-bold tracking-[0.2em] text-xs uppercase text-engraved-gold">Syncing Master Ledger...</span>
           </div>
        ) : loans.length === 0 ? (
           <div className={`${horologyPanelClass} p-16 text-center flex flex-col items-center`}>
             <div className="w-20 h-20 bg-[#0d0d0d] border border-[#333] rounded-sm flex items-center justify-center mb-6 shadow-[var(--shadow-recessed)]"><Landmark className="w-8 h-8 text-[#555]" /></div>
             <h2 className="text-lg font-bold text-engraved-gold tracking-widest mb-2 uppercase">Caliber Debt Free</h2>
             <p className="text-[#888] max-w-sm mb-8 text-[11px] font-bold tracking-[0.2em] uppercase">No active loan vectors detected. System running completely unencumbered.</p>
           </div>
        ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              {loans.map(loan => (
                 <LoanCard key={loan.id} loan={loan} expanded={expanded[loan.id]} toggle={()=>toggleL(loan.id)} onEdit={()=>onEdit(loan)} onDelete={()=>onDelete(loan)}/>
              ))}
           </div>
        )}
      </div>
   );
}

function LoanCard({ loan, expanded, toggle, onEdit, onDelete }) {
   const Icon = LOAN_TYPES[loan.lender_name] || Calculator;
   const prin = Number(loan.principal);
   const out = Number(loan.outstanding);
   const emi = Number(loan.emi_amount);
   const rate = Number(loan.interest_rate);
   const repaid = Math.max(0, prin - out);
   let pct = (repaid / prin) * 100;
   if(isNaN(pct) || pct < 0) pct = 0;

   let pColorClass = 'bg-[#8B0000]';
   let pTextColor = 'text-[#8B0000]';
   if(pct > 25) { pColorClass = 'bg-[#D4AF37]'; pTextColor = 'text-[#D4AF37]'; }
   if(pct > 60) { pColorClass = 'bg-[#005c00]'; pTextColor = 'text-[#005c00]'; }

   const estMonthsLeft = emi > 0 ? out / emi : 0;
   const pDate = new Date();
   pDate.setMonth(pDate.getMonth() + estMonthsLeft);

   return (
     <div className={`${horologyPanelClass} overflow-hidden group`}>
       <div className="p-6 relative">
          
          <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
             <button title="Edit Loan" onClick={onEdit} className="p-1.5 text-[#888] hover:text-[#D4AF37] bg-[#111] border border-transparent hover:border-[#333] rounded-sm transition-colors animate-button-compress shadow-[var(--shadow-recessed)]"><Edit2 className="w-4 h-4"/></button>
             <button title="Delete Loan" onClick={onDelete} className="p-1.5 text-[#888] hover:text-[#8B0000] hover:bg-[#2a0a0a] bg-[#111] border border-transparent hover:border-[#8B0000] rounded-sm transition-colors animate-button-compress shadow-[var(--shadow-recessed)]"><Trash2 className="w-4 h-4"/></button>
          </div>

          <div className="flex items-center space-x-3 mb-5">
             <div className="w-12 h-12 rounded-sm bg-[#0d0d0d] border border-[#333] flex items-center justify-center text-[#D4AF37] shadow-[var(--shadow-recessed)]">
                <Icon className="w-5 h-5"/>
             </div>
             <div>
                <h3 className="font-bold text-engraved-gold tracking-[0.2em] uppercase text-sm">{loan.lender_name}</h3>
                <span className="text-[8px] uppercase font-bold tracking-[0.2em] text-[#005c00] bg-[#0a1a0a] border border-[#005c00]/50 px-2 py-0.5 rounded-sm mt-1 inline-block">ENGAGED</span>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-[#0d0d0d] p-4 rounded-sm border border-[#333] mb-6 shadow-[var(--shadow-recessed)]">
             <div>
                <p className="text-[9px] uppercase font-bold text-[#888] tracking-widest mb-1">Outstanding</p>
                <p className="text-lg font-mono font-black text-[#8B0000] tracking-tight">₹{formatInr(out)}</p>
             </div>
             <div>
                <p className="text-[9px] uppercase font-bold text-[#888] tracking-widest mb-1">Original Principal</p>
                <p className="text-lg font-mono font-black text-[#e0e0e0] tracking-tight">₹{formatInr(prin)}</p>
             </div>
             <div className="col-span-2 flex justify-between border-t border-[#333] pt-3 mt-1">
                <div className="flex flex-col"><span className="text-[9px] uppercase font-bold text-[#888] tracking-[0.2em]">EMI Magnitude</span><span className="font-mono font-bold text-engraved-gold">₹{formatInr(emi)}<span className="text-[9px] font-sans text-[#555] ml-1 uppercase">/MO</span></span></div>
                <div className="flex flex-col text-right"><span className="text-[9px] uppercase font-bold text-[#888] tracking-[0.2em]">Interest Factor</span><span className="font-mono font-bold text-[#a38a3d]">{rate}% <span className="text-[9px] font-sans text-[#555] uppercase">P.A</span></span></div>
             </div>
          </div>

          <div>
             <div className="flex justify-between text-[9px] tracking-[0.2em] uppercase font-bold text-[#888] mb-2">
                <span>₹{formatInr(repaid)} COMPLETED</span>
                <span className={pTextColor}>{Math.floor(pct)}% CLEARED</span>
             </div>
             <div className="w-full bg-[#111] border border-[#333] h-1.5 rounded-sm overflow-hidden shadow-[var(--shadow-recessed)]">
                <div className={cn("h-full transition-all", pColorClass)} style={{width: `${pct}%`}}></div>
             </div>
          </div>
       </div>

       <div className="border-t border-[#333] bg-[#050505] p-4 flex justify-between items-center">
          <div className="flex flex-col">
             <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#555]">Est. Release Date</span>
             <span className="text-[10px] uppercase tracking-widest font-bold text-engraved-gold">{pDate.toLocaleString('default',{month:'short', year:'numeric'})}</span>
          </div>
          <button onClick={toggle} className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#888] hover:text-[#D4AF37] bg-[#111] hover:border-[#D4AF37] px-3 py-1.5 rounded-sm border border-[#333] shadow-[var(--shadow-recessed)] flex items-center transition animate-button-compress">
             {expanded ? 'CONCEAL LEDGER' : 'REVEAL LEDGER'} {expanded ? <ChevronUp className="w-3 h-3 ml-1"/> : <ChevronDown className="w-3 h-3 ml-1"/>}
          </button>
       </div>

       {expanded && <AmortizationViewer loan={loan} />}
     </div>
   );
}

function AmortizationViewer({ loan }) {
   const p = Number(loan.outstanding);
   const r = (Number(loan.interest_rate)/100)/12;
   const emi = Number(loan.emi_amount);

   const [extra, setExtra] = useState('');
   const E = Math.max(emi, emi + Number(extra||0));
   
   let bal = p;
   const rows = [];
   for(let i=1; i<=6; i++) {
      if(bal <= 0) break;
      const intComp = bal * r;
      const prinComp = E - intComp;
      bal -= prinComp;
      rows.push({m: i, emi: E, pComp: prinComp, iComp: intComp, cb: Math.max(0, bal)});
   }

   return (
      <div className="border-t border-[#333] bg-[#0d0d0d] p-4 relative overflow-hidden animate-fade-in shadow-[var(--shadow-recessed)]">
         <div className="bg-[#111] border border-[#333] p-3 rounded-sm mb-4 flex items-center justify-between shadow-[var(--shadow-recessed)]">
            <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-[#888]">Calibrator (Extra +₹):</span>
            <input type="number" value={extra} onChange={e=>setExtra(e.target.value)} placeholder="0" className="w-24 text-right ml-2 px-2 py-1 text-xs font-bold font-mono bg-[#050505] border border-[#333] text-engraved-gold rounded-sm outline-none focus:border-[#D4AF37] shadow-[var(--shadow-recessed)]" />
         </div>
         <table className="w-full text-left text-[9px] tracking-[0.2em] uppercase">
            <thead>
               <tr className="text-[#555] border-b border-[#333]">
                  <th className="pb-2">Mo</th>
                  <th className="pb-2">Prin. Comp</th>
                  <th className="pb-2">Int. Comp</th>
                  <th className="pb-2 text-right">Balance</th>
               </tr>
            </thead>
            <tbody>
               {rows.map(r => (
                  <tr key={r.m} className="border-b border-[#222] text-[#888] font-mono">
                     <td className="py-2 text-[#e0e0e0]">{r.m}</td>
                     <td className="py-2 text-[#005c00]">₹{formatInr(r.pComp)}</td>
                     <td className="py-2 text-[#8B0000]">₹{formatInr(r.iComp)}</td>
                     <td className="py-2 text-right font-bold text-engraved-gold">₹{formatInr(r.cb)}</td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>
   );
}

function LoanEditorModal({ initial, onClose, onSave }) {
   const [fd, setFd] = useState(initial || { lender_name:'', type:'Personal Loan', principal:'', outstanding:'', interest_rate:'', emi_amount:'', tenure_months:'', start_date:new Date().toISOString().split('T')[0]});
   const calcEmi = () => {
      if(!fd.principal || !fd.interest_rate || !fd.tenure_months) return;
      const P = Number(fd.principal);
      const r = (Number(fd.interest_rate)/100)/12;
      const n = Number(fd.tenure_months);
      const emi = (P * r * Math.pow(1+r, n)) / (Math.pow(1+r, n) - 1);
      setFd({...fd, emi_amount: Math.ceil(emi)});
   };
   
   return createPortal(
     <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in font-sans">
       <div className={`${horologyPanelClass} w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] my-auto`}>
          <div className="p-4 border-b border-[#333] bg-[#0d0d0d]">
             <h3 className="text-[11px] tracking-[0.3em] font-bold text-engraved-gold uppercase">{initial?'Adjust Caliber Settings':'Instantiate Ledger'}</h3>
          </div>
          <div className="p-6 overflow-y-auto space-y-5 bg-sunray plate-border">
             <div>
                <label className="block text-[9px] font-bold text-[#888] uppercase tracking-[0.2em] mb-2">Lender Entity</label>
                <input required value={fd.lender_name} onChange={e=>setFd({...fd, lender_name:e.target.value})} className="w-full bg-[#111] border border-[#333] text-[#e0e0e0] font-mono text-sm rounded-sm p-2 focus:border-[#D4AF37] focus:outline-none shadow-[var(--shadow-recessed)]" />
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-[#888] uppercase tracking-[0.2em] mb-2">Principal [₹]</label>
                  <input type="number" required value={fd.principal} onChange={e=>setFd({...fd, principal:e.target.value})} onBlur={calcEmi} className="w-full bg-[#111] border border-[#333] text-[#e0e0e0] font-mono text-sm rounded-sm p-2 focus:border-[#D4AF37] focus:outline-none shadow-[var(--shadow-recessed)]" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-[#888] uppercase tracking-[0.2em] mb-2">Outstanding [₹]</label>
                  <input type="number" value={fd.outstanding} onChange={e=>setFd({...fd, outstanding:e.target.value})} className="w-full bg-[#1a0a0a] border border-[#8B0000]/50 text-[#8B0000] font-mono text-sm rounded-sm p-2 focus:border-[#8B0000] focus:outline-none shadow-[var(--shadow-recessed)]" />
                </div>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[9px] font-bold text-[#888] uppercase tracking-[0.2em] mb-2">Rate [% p.a]</label><input type="number" step="0.1" required value={fd.interest_rate} onChange={e=>setFd({...fd, interest_rate:e.target.value})} onBlur={calcEmi} className="w-full bg-[#111] border border-[#333] text-[#a38a3d] font-mono text-sm rounded-sm p-2 focus:border-[#a38a3d] focus:outline-none shadow-[var(--shadow-recessed)]" /></div>
                <div><label className="block text-[9px] font-bold text-[#888] uppercase tracking-[0.2em] mb-2">Term [Mo]</label><input type="number" required value={fd.tenure_months} onChange={e=>setFd({...fd, tenure_months:e.target.value})} onBlur={calcEmi} className="w-full bg-[#111] border border-[#333] text-[#e0e0e0] font-mono text-sm rounded-sm p-2 focus:border-[#D4AF37] focus:outline-none shadow-[var(--shadow-recessed)]" /></div>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[9px] font-bold text-[#888] uppercase tracking-[0.2em] mb-2">Calculated EMI</label><input type="number" required value={fd.emi_amount} onChange={e=>setFd({...fd, emi_amount:e.target.value})} className="w-full bg-[#1a1a0f] border border-[#D4AF37]/50 text-engraved-gold font-mono text-sm rounded-sm p-2 focus:border-[#D4AF37] shadow-[var(--shadow-recessed)] focus:outline-none" /></div>
                <div><label className="block text-[9px] font-bold text-[#888] uppercase tracking-[0.2em] mb-2">Initiation Date</label><input type="date" required value={fd.start_date.split('T')[0]} onChange={e=>setFd({...fd, start_date:e.target.value})} className="w-full bg-[#111] border border-[#333] text-[#e0e0e0] font-mono text-sm rounded-sm p-2 focus:border-[#D4AF37] focus:outline-none shadow-[var(--shadow-recessed)] [color-scheme:dark]" /></div>
             </div>
          </div>
          <div className="p-4 border-t border-[#333] bg-[#050505] flex gap-3">
             <button onClick={onClose} className="flex-1 py-2.5 bg-[#111] border border-[#333] text-[#888] hover:text-[#e0e0e0] text-[9px] uppercase font-bold tracking-[0.2em] rounded-sm shadow-[var(--shadow-recessed)] animate-button-compress">Abort</button>
             <button onClick={()=>onSave(fd)} className="flex-1 py-2.5 bg-[#D4AF37] border border-[#D4AF37] text-black text-[9px] uppercase font-bold tracking-[0.2em] shadow-plate hover:bg-[#b0912c] rounded-sm transition-all animate-button-compress">Execute Bind</button>
          </div>
       </div>
     </div>,
     document.body
   );
}

// -------------------------------------------------------------
// TAB 2: SUBSCRIPTIONS
// -------------------------------------------------------------
function SubsTab({ subs, isLoading, onAdd, onEdit, onDelete }) {
   const today = new Date();
   
   const moTotal = subs.filter(s=>s.frequency==='monthly').reduce((acc,s)=>acc+Number(s.amount), 0);
   const yrTotal = subs.filter(s=>s.frequency==='yearly').reduce((acc,s)=>acc+Number(s.amount), 0) + (moTotal*12);
   
   let due7 = 0; let due7Amnt = 0;
   const sorted = [...subs].sort((a,b)=>new Date(a.next_due) - new Date(b.next_due));
   
   sorted.forEach(s => {
      const d = new Date(s.next_due);
      const diff = Math.ceil((d - today)/(1000*60*60*24));
      if(diff >= 0 && diff <= 7) { due7++; due7Amnt += Number(s.amount); }
   });

   const mostEx = [...subs].sort((a,b)=>Number(b.amount)-Number(a.amount))[0] || null;

   return (
      <div className="space-y-6 animate-fade-in w-full">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
           <div className={`${horologyPanelAltClass} bg-sunray plate-border p-5 flex flex-col justify-center`}>
             <span className="text-[#888] text-[9px] font-bold uppercase tracking-[0.2em]">Monthly Mechanism Burn</span>
             <span className="text-xl font-mono font-black text-[#e0e0e0] mt-1 tracking-tight">₹{formatInr(moTotal)}<span className="text-xs font-sans text-[#555] ml-1 uppercase">/mo</span></span>
           </div>
           <div className={`${horologyPanelAltClass} bg-sunray plate-border p-5 flex flex-col justify-center`}>
             <span className="text-[#888] text-[9px] font-bold uppercase tracking-[0.2em]">Annual Cyclic Cost</span>
             <span className="text-xl font-mono font-black text-[#D4AF37] mt-1 tracking-tight">₹{formatInr(yrTotal)}</span>
           </div>
           <div className={cn("p-5 rounded-sm flex flex-col justify-center transition-colors border plate-border shadow-plate", due7>0 ? "bg-[#1a1a0f] border-[#a38a3d]" : "bg-sunray border-[#333]")}>
             <span className="text-[#888] text-[9px] font-bold uppercase tracking-[0.2em]">Upcoming 7 Rotations</span>
             <span className="text-xl font-mono font-black text-[#a38a3d] mt-1 drop-shadow-sm">{due7} <span className="text-[9px] tracking-widest text-[#a38a3d] font-sans">QUEUED [₹{formatInr(due7Amnt)}]</span></span>
           </div>
           <div className={`${horologyPanelAltClass} bg-sunray plate-border p-5 hidden sm:flex flex-col justify-center`}>
             <span className="text-[#888] text-[9px] font-bold uppercase tracking-[0.2em]">Heaviest Vector</span>
             <span className="text-[13px] font-bold text-[#D4AF37] mt-1 leading-tight tracking-[0.2em] uppercase truncate">{mostEx ? mostEx.name : '--'}</span>
             <span className="text-[10px] font-bold font-mono text-[#888] mt-1">₹{formatInr(mostEx?.amount||0)}</span>
           </div>
        </div>

        <div className="flex justify-between items-center px-1 mt-8 mb-4">
          <h2 className="text-[11px] font-bold text-[#e0e0e0] tracking-[0.3em] uppercase border-b border-[#333] pb-1">Automated Nodes</h2>
          <button onClick={onAdd} className="flex items-center px-4 py-2 text-[10px] border border-[#D4AF37] bg-[#111] text-engraved-gold font-bold uppercase tracking-widest shadow-[var(--shadow-recessed)] hover:bg-[#1a1a1a] transition-all animate-button-compress rounded-sm">
            <Plus className="w-4 h-4 mr-1" /> Provision Node
          </button>
        </div>

        {subs.length === 0 && !isLoading && (
           <div className={`${horologyPanelClass} p-12 text-center flex flex-col items-center`}>
             <div className="w-16 h-16 bg-[#0d0d0d] border border-[#333] rounded-sm flex items-center justify-center mb-6 shadow-[var(--shadow-recessed)]"><Monitor className="w-6 h-6 text-[#555]" /></div>
             <h2 className="text-sm font-bold text-[#888] tracking-[0.2em] uppercase mb-1">No Active Synchronizations</h2>
             <button onClick={onAdd} className="mt-4 px-6 py-2 bg-[#D4AF37] text-black font-bold text-[9px] tracking-[0.2em] uppercase shadow-plate rounded-sm hover:bg-[#b0912c] transition animate-button-compress">+ Initialize Sync</button>
           </div>
        )}

        {subs.length > 0 && (
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {subs.map(sub => {
                    const d = new Date(sub.next_due);
                    const diff = Math.ceil((d - today)/(1000*60*60*24));
                    const isAlert = diff >= 0 && diff <= 7;
                    const isOver = diff < 0;
                    const ccClass = SUB_COLORS[sub.category] || SUB_COLORS['Other'];
                    
                    return (
                        <div key={sub.id} className={cn("p-5 rounded-sm border relative transition shadow-plate plate-border group", isOver ? "bg-[#1a0a0a] border-[#8B0000]/50" : isAlert ? "bg-[#1a1a0f] border-[#a38a3d]/50" : "bg-sunray border-[#333] hover:border-[#555]")}>
                          <div className="absolute top-4 right-4 flex space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                            <button title="Edit Subscription" onClick={()=>onEdit(sub)} className="p-1.5 rounded-sm bg-[#111] border border-[#333] text-[#888] hover:text-[#D4AF37] hover:border-[#D4AF37] shadow-[var(--shadow-recessed)] transition-all animate-button-compress"><Edit2 className="w-3.5 h-3.5"/></button>
                            <button title="Delete Subscription" onClick={()=>onDelete(sub)} className="p-1.5 rounded-sm bg-[#111] border border-[#333] text-[#888] hover:text-[#8B0000] hover:bg-[#2a0a0a] hover:border-[#8B0000] shadow-[var(--shadow-recessed)] transition-all animate-button-compress"><Trash2 className="w-3.5 h-3.5"/></button>
                          </div>
                          <div className="flex items-center space-x-3 mb-4 pr-16">
                             <div className={cn("w-10 h-10 flex items-center justify-center font-bold text-lg rounded-sm border shadow-[var(--shadow-recessed)]", ccClass)}>{sub.name.charAt(0)}</div>
                             <div>
                                <h4 className="font-bold text-engraved-gold tracking-widest uppercase text-xs">{sub.name}</h4>
                                <span className={cn("text-[8px] uppercase font-bold tracking-[0.2em] px-1.5 py-0.5 rounded-sm inline-block mt-1 shadow-plate border", ccClass)}>{sub.category}</span>
                             </div>
                          </div>
                          <div className="flex justify-between items-end border-t border-[#333] pt-3">
                             <div className="flex flex-col">
                                <span className="text-xl font-mono font-black tracking-tight text-[#e0e0e0]">₹{formatInr(sub.amount)}</span>
                                <span className="text-[9px] uppercase font-bold text-[#888] tracking-widest">{sub.frequency}</span>
                             </div>
                             <div className="flex flex-col text-right">
                                <span className="text-[8px] font-bold text-[#888] tracking-[0.2em] uppercase">Next Cycle</span>
                                <span className={cn("text-[11px] tracking-widest font-bold uppercase", isOver ? "text-[#8B0000]" : isAlert ? "text-[#a38a3d]" : "text-[#D4AF37]")}>
                                   {d.toLocaleDateString('en-IN', {month:'short', day:'numeric'})}
                                </span>
                             </div>
                          </div>
                          {isAlert && <div className="absolute -top-2 left-4 bg-[#1a1a0f] text-[#a38a3d] text-[8px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 border border-[#a38a3d]/50 rounded-sm shadow-plate">DUE_IN_{diff}D</div>}
                          {isOver && <div className="absolute -top-2 left-4 bg-[#1a0a0a] text-[#8B0000] text-[8px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 border border-[#8B0000]/50 rounded-sm shadow-plate">FAULT_OVERDUE</div>}
                       </div>
                    )
                 })}
              </div>

              {/* CALENDAR COLUMN */}
              <div className={`${horologyPanelClass} p-5 h-fit lg:sticky lg:top-6`}>
                 <h3 className="text-[10px] font-bold text-[#e0e0e0] uppercase tracking-[0.2em] border-b border-[#333] pb-3 mb-4 flex items-center"><Calendar className="w-4 h-4 mr-2 text-[#D4AF37]"/> Rotation Outlook [30D]</h3>
                 <div className="space-y-4">
                    {sorted.slice(0, 10).map((s, i) => {
                       const d = new Date(s.next_due);
                       const isOver = Math.ceil((d - today)/(86400000)) < 0;
                       return (
                          <div key={i} className="flex items-center justify-between group py-2 border-b border-[#333]">
                             <div className="flex items-center space-x-3">
                                <div className={cn("w-10 text-center font-bold text-[8px] tracking-[0.2em] uppercase", isOver ? "text-[#8B0000]" : "text-[#888]")}>
                                   {d.toLocaleDateString('en-IN', {month:'short'})}<br/><span className={cn("text-lg font-mono leading-none font-black", isOver ? "text-[#8B0000]" : "text-[#e0e0e0] group-hover:text-[#D4AF37]")}>{d.getDate()}</span>
                                </div>
                                <div className="h-6 w-px bg-[#333]"></div>
                                <span className="text-[10px] font-bold text-engraved-gold tracking-widest uppercase">{s.name}</span>
                             </div>
                             <span className="font-mono font-black text-[#888] tracking-widest text-xs">₹{formatInr(s.amount)}</span>
                          </div>
                       )
                    })}
                 </div>
              </div>
           </div>
        )}
      </div>
   );
}

function SubEditorModal({ initial, onClose, onSave }) {
  const [fd, setFd] = useState(initial || { name:'', amount:'', frequency:'monthly', category:'Streaming', next_due:new Date().toISOString().split('T')[0] });
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in font-sans">
       <div className={`${horologyPanelClass} w-full max-w-sm overflow-hidden flex flex-col my-auto`}>
          <div className="p-4 border-b border-[#333] bg-[#0d0d0d]"><h3 className="text-[10px] tracking-[0.3em] font-bold text-engraved-gold uppercase">{initial?'Modify Sub Node':'Configure Node'}</h3></div>
          <div className="p-6 space-y-4 bg-sunray plate-border">
             <div><label className="block text-[9px] font-bold text-[#888] uppercase tracking-[0.2em] mb-2">Service ID</label><input required value={fd.name} onChange={e=>setFd({...fd, name:e.target.value})} className="w-full bg-[#111] border border-[#333] text-[#e0e0e0] font-mono text-sm rounded-sm p-2 focus:border-[#D4AF37] outline-none shadow-[var(--shadow-recessed)]" /></div>
             <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[9px] font-bold text-[#888] uppercase tracking-[0.2em] mb-2">Debit [₹]</label><input type="number" required value={fd.amount} onChange={e=>setFd({...fd, amount:e.target.value})} className="w-full bg-[#111] border border-[#333] text-engraved-gold font-mono text-sm rounded-sm p-2 focus:border-[#D4AF37] outline-none shadow-[var(--shadow-recessed)]" /></div>
                <div><label className="block text-[9px] font-bold text-[#888] uppercase tracking-[0.2em] mb-2">Cycle</label><select value={fd.frequency} onChange={e=>setFd({...fd, frequency:e.target.value})} className="w-full bg-[#111] border border-[#333] text-[#e0e0e0] font-mono text-xs uppercase tracking-widest rounded-sm p-2 focus:border-[#D4AF37] outline-none shadow-[var(--shadow-recessed)]"><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="yearly">Yearly</option></select></div>
             </div>
             <div>
               <label className="block text-[9px] font-bold text-[#888] uppercase tracking-[0.2em] mb-2">Class</label>
               <select value={fd.category} onChange={e=>setFd({...fd, category:e.target.value})} className="w-full bg-[#111] border border-[#333] text-[#e0e0e0] font-mono text-xs uppercase tracking-widest rounded-sm p-2 focus:border-[#D4AF37] outline-none shadow-[var(--shadow-recessed)]">
                 {Object.keys(SUB_CATS).map(c=><option key={c} value={c} className="bg-[#111]">{c}</option>)}
               </select>
             </div>
             <div><label className="block text-[9px] font-bold text-[#888] uppercase tracking-[0.2em] mb-2">Next Execution</label><input type="date" required value={fd.next_due.split('T')[0]} onChange={e=>setFd({...fd, next_due:e.target.value})} className="w-full bg-[#111] border border-[#333] text-[#e0e0e0] font-mono text-xs rounded-sm p-2 focus:border-[#D4AF37] outline-none shadow-[var(--shadow-recessed)] [color-scheme:dark]" /></div>
          </div>
          <div className="p-4 border-t border-[#333] bg-[#050505] flex gap-3">
             <button onClick={onClose} className="flex-1 py-2.5 bg-[#111] border border-[#333] text-[#888] text-[9px] uppercase font-bold tracking-[0.2em] rounded-sm shadow-[var(--shadow-recessed)] animate-button-compress hover:text-[#e0e0e0]">Abort</button>
             <button onClick={()=>onSave(fd)} className="flex-1 py-2.5 bg-[#D4AF37] border border-[#D4AF37] text-black text-[9px] uppercase font-bold tracking-[0.2em] shadow-plate rounded-sm transition-all animate-button-compress hover:bg-[#b0912c]">Compile</button>
          </div>
       </div>
    </div>,
    document.body
  );
}

// -------------------------------------------------------------
// TAB 3: TAX PLANNER
// -------------------------------------------------------------
function TaxTab({ taxRaw, isLoading, onAdd, onEdit, onDelete }) {
   const [slab, setSlab] = useState(30);
   
   if(isLoading) return <div className="h-64 flex bg-[#0d0d0d] border plate-border rounded-sm items-center justify-center animate-pulse text-[#D4AF37] font-mono tracking-[0.2em] shadow-[var(--shadow-recessed)]">CALIBRATING SCHEMAS...</div>;

   const data = taxRaw?.investments || [];
   const sumData = taxRaw?.summary || { total_invested:0, progress_percentage:0, remaining_80c:150000, total_80c_limit:150000 };

   let pct = sumData.progress_percentage || 0;
   if(pct > 100) pct = 100;
   if(pct < 0) pct = 0;

   const saved = sumData.total_invested * (slab/100);
   const potSave = sumData.remaining_80c * (slab/100);

   return (
      <div className="space-y-6 animate-fade-in w-full">
         {/* HEADER SUMMARY */}
         <div className="p-8 bg-[#0a0a0a] border-[#333] border rounded-sm relative overflow-hidden shadow-plate">
            <div className="absolute inset-0 pattern-cotes opacity-40"></div>
            <Landmark className="absolute right-0 top-1/2 -translate-y-1/2 w-48 h-48 opacity-5 text-[#D4AF37] stroke-1" />
            
            <div className="flex justify-between items-start mb-6 border-b border-[#333] pb-4 relative z-10">
               <div>
                  <h2 className="text-xl font-bold tracking-[0.2em] text-[#e0e0e0] uppercase"><span className="text-[#D4AF37]">FY {sumData.financial_year}</span> · 80C LIMIT</h2>
                  <p className="text-[#888] text-[9px] font-bold tracking-[0.2em] uppercase mt-1">Deduction Maximization Protocol</p>
               </div>
               <span className="text-xl font-mono font-black text-engraved-gold border border-[#333] bg-[#111] px-3 py-1 rounded-sm shadow-[var(--shadow-recessed)] tracking-widest">₹{formatInr(sumData.total_80c_limit)}</span>
            </div>

            <div className="relative z-10">
               <div className="flex justify-between items-end mb-3 text-[9px] uppercase tracking-[0.2em] font-bold">
                  <span className="text-2xl font-mono font-black text-engraved-gold drop-shadow-sm">₹{formatInr(sumData.total_invested)} <span className="text-[10px] text-[#a38a3d] font-bold font-sans">ALLOCATED ({Math.floor(sumData.progress_percentage)}%)</span></span>
                  <span className="text-[10px] text-[#8B0000] font-bold tracking-[0.2em]">₹{formatInr(sumData.remaining_80c)} LEFT</span>
               </div>
               <div className="w-full bg-[#050505] border border-[#333] h-3 rounded-xs overflow-hidden shadow-[var(--shadow-recessed)] p-0.5">
                  <div className="bg-[#D4AF37] h-full rounded-[1px] relative shadow-[inset_0_0_5px_rgba(0,0,0,0.3)] transition-all duration-1000 ease-out" style={{width: `${pct}%`}}>
                     <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/30"></div>
                  </div>
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
            <div className="lg:col-span-2">
               <div className="flex justify-between items-center mb-4 px-1">
                 <h3 className="text-[11px] font-bold text-[#e0e0e0] uppercase tracking-[0.3em] border-b border-[#333] pb-1">Declared Assets [80C]</h3>
                 <button onClick={()=>onAdd(null)} className="flex items-center px-4 py-2 text-[9px] font-bold tracking-[0.2em] uppercase border border-[#D4AF37] bg-sunray text-black hover:bg-[#b0912c] transition-all shadow-plate rounded-sm animate-button-compress">
                    <Plus className="w-4 h-4 mr-1" /> Append
                 </button>
               </div>
               
               {data.length === 0 ? (
                 <div className={`${horologyPanelClass} p-8 text-center border-dashed border-[#555]`}>
                    <p className="text-[#888] text-[9px] uppercase font-bold tracking-[0.2em]">Deduction array empty. Sub-optimal tax metrics applied.</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {data.map(t => (
                       <div key={t.id} className={`${horologyPanelAltClass} bg-sunray p-5 rounded-sm border-l-2 border-l-[#D4AF37] relative group hover:border-[#D4AF37]/50 transition plate-border shadow-plate`}>
                          <div className="absolute top-4 right-4 flex space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                             <button title="Edit 80C Asset" onClick={()=>onEdit(t)} className="p-1.5 rounded-sm bg-[#111] border border-[#333] text-[#888] hover:text-[#D4AF37] hover:border-[#D4AF37] shadow-[var(--shadow-recessed)] transition-all animate-button-compress"><Edit2 className="w-3.5 h-3.5"/></button>
                             <button title="Delete 80C Asset" onClick={()=>onDelete(t)} className="p-1.5 rounded-sm bg-[#111] border border-[#333] text-[#888] hover:text-[#8B0000] hover:bg-[#2a0a0a] hover:border-[#8B0000] shadow-[var(--shadow-recessed)] transition-all animate-button-compress"><Trash2 className="w-3.5 h-3.5"/></button>
                          </div>
                          <span className="text-[9px] uppercase font-bold tracking-[0.2em] text-[#a38a3d] border border-[#a38a3d]/30 bg-[#111] px-2 py-0.5 rounded-sm inline-block mb-3 shadow-[var(--shadow-recessed)]">{t.scheme}</span>
                          <h4 className="text-xs font-bold text-engraved-gold tracking-widest uppercase pr-10">{t.scheme} Asset</h4>
                          <div className="mt-4 pt-4 border-t border-[#333] flex flex-col">
                             <span className="text-xl font-mono font-black tracking-tight text-[#e0e0e0]">₹{formatInr(t.amount)}</span>
                             <span className="text-[9px] uppercase font-bold text-[#888] tracking-[0.2em]">DECLARED {t.financial_year}</span>
                          </div>
                       </div>
                    ))}
                 </div>
               )}
            </div>

            {/* LIVE TAX CALCULATOR */}
            <div className={`${horologyPanelClass} p-6 lg:sticky lg:top-6 border-t border-t-[#D4AF37]`}>
               <h3 className="text-[10px] font-bold text-[#e0e0e0] uppercase tracking-[0.2em] mb-4 flex items-center border-b border-[#333] pb-3">
                 <Calculator className="w-4 h-4 mr-2 text-[#D4AF37]"/> Diagnostic Core
               </h3>
               
               <div className="bg-[#111] p-4 border border-[#333] rounded-sm mb-6 flex justify-between items-center shadow-[var(--shadow-recessed)]">
                  <span className="text-[9px] font-bold text-[#888] uppercase tracking-[0.2em]">Tax Vector</span>
                  <select value={slab} onChange={e=>setSlab(Number(e.target.value))} className="bg-[#050505] border border-[#333] px-2 py-1 font-bold font-mono text-[#D4AF37] text-xs uppercase focus:outline-none appearance-none rounded-sm shadow-[var(--shadow-recessed)]">
                     <option className="bg-[#111]" value={5}>BRACKET [05%]</option>
                     <option className="bg-[#111]" value={20}>BRACKET [20%]</option>
                     <option className="bg-[#111]" value={30}>BRACKET [30%]</option>
                  </select>
               </div>
               
               <div className="space-y-4">
                  <div className="flex justify-between border-b border-[#333] pb-3">
                     <span className="text-[9px] font-bold text-[#888] uppercase tracking-[0.2em]">Deflected Load</span>
                     <span className="font-mono font-black text-[#D4AF37] text-sm tracking-widest">₹{formatInr(saved)}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#333] pb-3">
                     <span className="text-[9px] font-bold text-[#888] uppercase tracking-[0.2em]">Capacity Yield</span>
                     <span className="font-mono font-black text-[#a38a3d] text-sm tracking-widest">+₹{formatInr(potSave)}</span>
                  </div>
               </div>

               <div className="mt-8">
                  <p className="text-[9px] uppercase font-bold tracking-[0.3em] text-engraved-gold text-center mb-4">Quick Provision</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                     {['ELSS', 'PPF', 'LIC'].map(p => (
                       <button key={p} onClick={()=>onAdd(p)} className="px-3 py-1.5 border border-[#333] bg-[#111] hover:bg-[#1a1a1a] hover:border-[#D4AF37]/50 hover:text-[#D4AF37] text-[#888] text-[9px] font-bold tracking-[0.2em] rounded-sm uppercase transition shadow-[var(--shadow-recessed)] animate-button-compress">
                          + {p}
                       </button>
                     ))}
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}

function TaxEditorModal({ initial, onClose, onSave }) {
  let initialDef = { scheme: 'ELSS', amount:'', financial_year:'2025-26' };
  if(typeof initial === 'string') initialDef.scheme = initial;
  if(typeof initial === 'object' && initial !== null) initialDef = initial;

  const [fd, setFd] = useState(initialDef);
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in font-sans">
       <div className={`${horologyPanelClass} w-full max-w-sm overflow-hidden flex flex-col my-auto`}>
          <div className="p-4 border-b border-[#333] bg-[#0d0d0d]"><h3 className="text-[10px] tracking-[0.3em] font-bold text-engraved-gold uppercase">{initial?.id?'Alter Asset':'Declare Asset'}</h3></div>
          <div className="p-6 space-y-4 bg-sunray plate-border">
             <div>
               <label className="block text-[9px] font-bold text-[#888] uppercase tracking-[0.2em] mb-2">Instrument Type</label>
               <select value={fd.scheme} onChange={e=>setFd({...fd, scheme:e.target.value})} className="w-full bg-[#111] border border-[#333] text-[#e0e0e0] rounded-sm p-2 focus:border-[#D4AF37] focus:outline-none text-xs uppercase font-mono tracking-widest shadow-[var(--shadow-recessed)]">
                 {['ELSS','PPF','LIC','NPS','NSC','EPF','Home Loan Principal','Other'].map(c=><option key={c} value={c} className="bg-[#111]">{c}</option>)}
               </select>
             </div>
             <div><label className="block text-[9px] font-bold text-[#888] uppercase tracking-[0.2em] mb-2">Quantum [₹]</label><input type="number" required value={fd.amount} onChange={e=>setFd({...fd, amount:e.target.value})} className="w-full bg-[#1a1a0f] border border-[#a38a3d]/30 text-[#D4AF37] font-mono font-black tracking-widest rounded-sm p-2 focus:border-[#D4AF37] focus:outline-none shadow-[var(--shadow-recessed)]" /></div>
             <div><label className="block text-[9px] font-bold text-[#888] uppercase tracking-[0.2em] mb-2">Fiscal Cycle</label><input value={fd.financial_year} disabled className="w-full bg-[#050505] border border-[#333] text-[#555] rounded-sm p-2 font-mono font-black text-sm cursor-not-allowed shadow-[var(--shadow-recessed)]" /></div>
          </div>
          <div className="p-4 border-t border-[#333] bg-[#050505] flex gap-3"><button onClick={onClose} className="flex-1 py-2.5 bg-[#111] border border-[#333] text-[#888] text-[9px] uppercase font-bold tracking-[0.2em] hover:text-[#e0e0e0] rounded-sm shadow-[var(--shadow-recessed)] animate-button-compress">Abort</button><button onClick={()=>onSave(fd)} className="flex-1 py-2.5 bg-[#D4AF37] text-black text-[9px] uppercase font-bold tracking-[0.2em] shadow-plate hover:bg-[#b0912c] rounded-sm transition-all animate-button-compress">Submit Bind</button></div>
       </div>
    </div>,
    document.body
  );
}
