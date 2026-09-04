import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Target, Plus, Award, Plane, Shield, Laptop, Home, Briefcase, Car, Heart, Coffee, PlayCircle, PauseCircle, Edit2, Trash2, MoreVertical, Settings } from 'lucide-react';
import { cn } from '../lib/utils';
import Confetti from 'react-confetti';

const CAT_ICONS = {
  'Travel': Plane, 'Savings': Shield, 'Gadget': Laptop, 'House': Home,
  'Retirement': Briefcase, 'Vehicle': Car, 'Health': Heart, 'Other': Coffee
};

const formatInr = (num) => Number(num || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export default function Goals() {
  const queryClient = useQueryClient();
  const [modalMode, setModalMode] = useState(null);
  const [activeGoal, setActiveGoal] = useState(null);
  const [contribGoal, setContribGoal] = useState(null); 
  const [showConfetti, setShowConfetti] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);
  const menuRef = useRef();
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 100); }, []);

  useEffect(() => {
    const handleClickOutside = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenu(null); };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: async () => { const { data } = await api.get('/goals'); return data.data; }
  });

  const activeGoals = goals.filter(g => g.status !== 'achieved');
  const sumTarget = goals.reduce((acc, g) => acc + Number(g.target_amount), 0);
  const sumSaved = goals.reduce((acc, g) => acc + Number(g.saved_amount), 0);
  const sumSip = activeGoals.reduce((acc, g) => g.status !== 'paused' ? acc + Number(g.monthly_sip) : acc, 0);

  const mutateGoal = useMutation({
    mutationFn: async ({ id, data, method }) => {
      if(method === 'DELETE') return await api.delete(`/goals/${id}`);
      if(method === 'PUT') return await api.put(`/goals/${id}`, data);
      return await api.post('/goals', data);
    },
    onSuccess: () => { queryClient.invalidateQueries(['goals']); setModalMode(null); setOpenMenu(null); }
  });

  return (
    <div className="space-y-6 animate-fade-in pb-20 relative text-[#E0E0E0] min-h-[90vh]">
      <div className="fixed inset-0 pointer-events-none bg-cotes-de-geneve animate-cotes-breathe z-[-1]"></div>

      {showConfetti && <Confetti recycle={false} numberOfPieces={500} onConfettiComplete={() => setShowConfetti(false)} style={{zIndex: 9999, position: 'fixed'}} />}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 border-b border-[#222] pb-6">
        <div>
          <h1 className="text-3xl font-sans text-engraved-gold tracking-widest font-bold pt-6 px-6">FINANCIAL GOALS</h1>
          <p className="text-xs font-sans tracking-widest text-[#B0A0A0] mt-1.5 uppercase px-6">Goals & Targets</p>
        </div>
        <button onClick={() => { setActiveGoal(null); setModalMode('add'); }} className="group flex items-center px-6 py-2.5 bg-[#1a1a1a] border border-[#d4af37] text-engraved-gold font-sans font-bold tracking-widest shadow-[0_4px_6px_rgba(0,0,0,0.3)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.8)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] hover:bg-[#111] animate-button-compress transition-all w-full sm:w-auto justify-center relative overflow-hidden">
          <Plus className="w-4 h-4 mr-3 group-hover:rotate-90 transition-transform duration-500" />
          CREATE GOAL
        </button>
      </div>

      {/* SUMMARY STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-sunray shadow-[var(--shadow-recessed)] plate-border p-5 flex flex-col justify-center relative group overflow-hidden">
          <span className="text-[#888] text-[10px] font-sans font-bold uppercase tracking-[0.2em] mb-1">Active Goals</span>
          <span className="text-3xl font-mono font-black text-[#D4AF37]">{mounted ? activeGoals.length : 0}</span>
        </div>
        <div className="bg-sunray shadow-[var(--shadow-recessed)] plate-border p-5 flex flex-col justify-center relative group overflow-hidden">
          <span className="text-[#888] text-[10px] font-sans font-bold uppercase tracking-[0.2em] mb-1">Total Target</span>
          <span className="text-3xl font-mono font-black text-[#E0E0E0]">₹{formatInr(sumTarget)}</span>
        </div>
        <div className="bg-sunray shadow-[var(--shadow-recessed)] plate-border p-5 flex flex-col justify-center relative group overflow-hidden">
          <span className="text-[#888] text-[10px] font-sans font-bold uppercase tracking-[0.2em] mb-1">Saved So Far</span>
          <span className="text-3xl font-mono font-black text-[#00b300]">₹{formatInr(sumSaved)}</span>
        </div>
        <div className="bg-sunray shadow-[var(--shadow-recessed)] plate-border p-5 flex flex-col justify-center relative group overflow-hidden">
          <span className="text-[#888] text-[10px] font-sans font-bold uppercase tracking-[0.2em] mb-1">Monthly SIP</span>
          <div className="flex font-mono items-end gap-1">
             <span className="text-3xl font-black text-[#D4AF37]">₹{formatInr(sumSip)}</span>
             <span className="text-[10px] text-[#888] tracking-widest mb-1.5 uppercase">/ mo</span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center bg-transparent"><Settings className="w-10 h-10 text-[#D4AF37] animate-gear-spin" /></div>
      ) : goals.length === 0 ? (
        <div className="bg-sunray plate-border shadow-[var(--shadow-recessed)] p-16 text-center flex flex-col items-center">
           <Target className="w-16 h-16 text-[#D4AF37] mb-6 drop-shadow-md" />
           <h2 className="text-2xl font-sans font-bold text-[#F5F5F5] mb-2 uppercase tracking-widest">No Goals Yet</h2>
           <p className="text-[#B0A0A0] max-w-sm mb-8 font-sans text-xs leading-loose">Create your first financial goal to start tracking your progress.</p>
           <button onClick={() => { setActiveGoal(null); setModalMode('add'); }} className="px-6 py-3 bg-[#111] border border-[#D4AF37] text-engraved-gold shadow-md font-sans font-bold text-xs uppercase tracking-widest hover:bg-[#D4AF37] hover:text-[#111] transition-colors">Create Goal</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
          {goals.map(goal => (
             <GoalCard 
               key={goal.id} 
               goal={goal} 
               onContribute={() => setContribGoal(goal)} 
               menuOpen={openMenu === goal.id}
               setOpenMenu={setOpenMenu}
               menuRef={menuRef}
               onAction={(action) => {
                 if(action === 'edit') { setActiveGoal(goal); setModalMode('edit'); }
                 else if(action === 'delete') mutateGoal.mutate({ id: goal.id, method: 'DELETE' });
                 else mutateGoal.mutate({ id: goal.id, method: 'PUT', data: { status: action === 'pause' ? 'paused' : action === 'achieve' ? 'achieved' : 'active' }});
                 setOpenMenu(null);
               }}
             />
          ))}
          <SIPHUD goals={activeGoals} />
        </div>
      )}

      {(modalMode === 'add' || modalMode === 'edit') && (
        <GoalEditorModal goal={activeGoal} onClose={() => setModalMode(null)} onSave={(data) => mutateGoal.mutate({ id: activeGoal?.id, data, method: activeGoal ? 'PUT' : 'POST' })} />
      )}
      
      {contribGoal && (
        <ContributionModal goal={contribGoal} onClose={() => setContribGoal(null)} onConfirm={async (amount) => {
             const res = await api.put(`/goals/${contribGoal.id}/contribute`, { amount });
             if (Number(res.data.data.saved_amount) >= Number(res.data.data.target_amount)) setShowConfetti(true);
             queryClient.invalidateQueries(['goals']);
             setContribGoal(null);
        }} />
      )}
    </div>
  );
}

function GoalCard({ goal, onContribute, menuOpen, setOpenMenu, menuRef, onAction }) {
  const Icon = CAT_ICONS[goal.category] || Target;
  const isAchieved = goal.status === 'achieved';
  const isPaused = goal.status === 'paused';
  const target = Number(goal.target_amount);
  const saved = Number(goal.saved_amount);
  const sip = Number(goal.monthly_sip);
  
  let fundPct = Math.min(100, Math.max(0, (saved / target) * 100));
  if (isNaN(fundPct)) fundPct = 0;

  const today = new Date();
  const tDate = new Date(goal.target_date);
  const CREATED_FICT = new Date(today);
  CREATED_FICT.setFullYear(today.getFullYear()-1);
  if(goal.createdAt) CREATED_FICT.setTime(new Date(goal.createdAt).getTime());
  
  const totalDays = Math.max(1, (tDate - CREATED_FICT) / (1000*60*60*24));
  const daysPassed = Math.max(0, (today - CREATED_FICT) / (1000*60*60*24));
  let timePct = Math.min(100, (daysPassed / totalDays) * 100);
  
  const daysLeft = Math.ceil((tDate - today) / (1000 * 60 * 60 * 24));
  let monthsLeft = Math.max(1, daysLeft / 30);
  
  let projectionStr = '';
  let ringColor = '#D4AF37'; 
  let timeColor = 'rgba(212,175,55,0.2)'; 
  let statusTx = 'text-[#D4AF37]';
  
  if (isAchieved) {
     ringColor = '#005c00'; timeColor = 'rgba(0,92,0,0.3)'; statusTx = 'text-[#005c00]';
  } else if (isPaused) {
     ringColor = '#555'; timeColor = '#333'; statusTx = 'text-[#888]';
     projectionStr = "PAUSED";
  } else {
     const reqSip = (target - saved) / monthsLeft;
     const monthsToFinish = sip > 0 ? (target - saved) / sip : 999;
     if (sip >= reqSip * 0.95) {
        const d2 = new Date(today); d2.setMonth(d2.getMonth() + monthsToFinish);
        projectionStr = `On Track: ETA ${d2.toLocaleString('default',{month:'short', year:'2-digit'})}`;
     } else {
        const short = Math.ceil(monthsToFinish - monthsLeft);
        projectionStr = short > 100 ? "Stalled" : `Behind by ${short}mo`;
        ringColor = '#8B0000'; timeColor = 'rgba(139,0,0,0.3)'; statusTx = 'text-[#8B0000]';
     }
  }

  const outerR = 45; const innerR = 30;
  const outerCirc = 2 * Math.PI * outerR;
  const innerCirc = 2 * Math.PI * innerR;
  const outerDash = outerCirc - (fundPct / 100) * outerCirc;
  const innerDash = innerCirc - (timePct / 100) * innerCirc;

  return (
    <div className={cn("bg-[#0d0d0d] p-6 plate-border relative transition-all group overflow-hidden shadow-plate", isAchieved ? "border-[#005c00]/30" : isPaused ? "border-[#222]" : "hover:border-[#D4AF37]/50 hover:shadow-[0_0_15px_rgba(212,175,55,0.05)]")}>
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-pvd-plate"></div>
      
      <div className="absolute top-4 right-4 z-20" ref={menuOpen ? menuRef : null}>
         <button onClick={(e) => { e.stopPropagation(); setOpenMenu(menuOpen ? null : goal.id); }} className="p-1 text-[#555] hover:text-[#D4AF37] outline-none transition-colors">
           <MoreVertical className="w-4 h-4" />
         </button>
         {menuOpen && (
           <div className="absolute right-0 top-6 w-36 bg-[#0a0a0a] plate-border shadow-plate py-1 font-sans text-[10px] font-bold uppercase tracking-widest z-50">
             <button onClick={()=>onAction('edit')} className="w-full text-left px-3 py-2 text-[#E0E0E0] hover:bg-[#1a1a1a] hover:text-[#D4AF37]"><Edit2 className="w-3 h-3 inline mr-2"/> EDIT</button>
             {isPaused ? 
               <button onClick={()=>onAction('active')} className="w-full text-left px-3 py-2 text-[#E0E0E0] hover:bg-[#1a1a1a] hover:text-[#D4AF37]"><PlayCircle className="w-3 h-3 inline mr-2"/> RESUME</button>
               : !isAchieved && <button onClick={()=>onAction('pause')} className="w-full text-left px-3 py-2 text-[#E0E0E0] hover:bg-[#1a1a1a] hover:text-[#8B0000]"><PauseCircle className="w-3 h-3 inline mr-2"/> PAUSE</button>
             }
             {!isAchieved && <button onClick={()=>onAction('achieve')} className="w-full text-left px-3 py-2 text-[#ADFF2F] hover:bg-[#1a1a1a]"><Award className="w-3 h-3 inline mr-2"/> ACHIEVE</button>}
             <button onClick={()=>onAction('delete')} className="w-full text-left px-3 py-2 text-[#8B0000] hover:bg-[#1a1a1a] mt-1 border-t border-[#222]"><Trash2 className="w-3 h-3 inline mr-2"/> DELETE</button>
           </div>
         )}
      </div>

      <div className="flex justify-between items-start mb-6 relative z-10">
         <div className="pr-10">
            <div className="flex items-center space-x-3">
               <div className="text-[#888]"><Icon className="w-4 h-4"/></div>
               <span className="text-[9px] uppercase font-sans font-bold tracking-[0.2em] text-[#888] shadow-[var(--shadow-recessed)] bg-[#111] px-2 py-0.5 rounded-sm">{goal.category}</span>
            </div>
            <h3 className="text-xl font-sans tracking-wide text-engraved-gold mt-3 font-semibold truncate w-[200px]">{goal.name}</h3>
         </div>
      </div>

      <div className="flex flex-col items-center justify-center my-8 relative z-10">
         <div className="relative w-32 h-32 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
            <svg className="absolute inset-0 w-full h-full transform -rotate-90 filter drop-shadow-md" style={{color: ringColor}}>
               {[...Array(12)].map((_, i) => <line key={i} x1="64" y1="15" x2="64" y2="18" transform={`rotate(${i*30} 64 64)`} stroke="#444" strokeWidth="2" />)}
               <circle cx="64" cy="64" r={innerR} stroke="#111" strokeWidth="4" fill="none" />
               <circle cx="64" cy="64" r={innerR} stroke={timeColor} strokeWidth="4" fill="none" strokeDasharray={innerCirc} strokeDashoffset={innerDash} strokeLinecap="square" className="transition-all duration-1000" />
               <circle cx="64" cy="64" r={outerR} stroke="#111" strokeWidth="2" fill="none" />
               <circle cx="64" cy="64" r={outerR} stroke={ringColor} strokeWidth="6" fill="none" strokeDasharray={outerCirc} strokeDashoffset={outerDash} strokeLinecap="butt" className="transition-all duration-1000" />
            </svg>
            <div className="flex flex-col items-center">
               <span className="text-xl font-mono font-black text-engraved-gold" style={{color: ringColor}}>{Math.floor(fundPct)}%</span>
            </div>
         </div>
      </div>

      <div className="border-t border-[#222] pt-4 flex flex-col gap-3 relative z-10">
         <div className="flex justify-between items-center text-xs">
            <div className="flex flex-col">
               <span className="text-[9px] font-sans font-bold text-[#888] tracking-widest uppercase">Target</span>
               <span className="text-[#D4AF37] font-mono">₹{formatInr(target)}</span>
            </div>
            <div className="flex flex-col text-right">
               <span className="text-[9px] font-sans font-bold text-[#888] tracking-widest uppercase">Funded</span>
               <span className={cn(statusTx, "font-mono")}>₹{formatInr(saved)}</span>
            </div>
         </div>
         <div className="flex justify-between items-center text-xs">
            <div className="flex flex-col">
               <span className="text-[9px] font-sans font-bold text-[#888] tracking-widest uppercase">Target Date</span>
               <span className="text-[#E0E0E0] font-sans font-medium">{tDate.toLocaleString('default',{month:'short', year:'numeric'})}</span>
            </div>
            <div className="flex flex-col text-right">
               <span className="text-[9px] font-sans font-bold text-[#888] tracking-widest uppercase">Monthly SIP</span>
               <span className="text-[#E0E0E0] font-mono">₹{formatInr(sip)}</span>
            </div>
         </div>
         
         <div className="flex justify-between items-end mt-2 pt-2 border-t border-[#222] border-dashed">
            <div className="flex flex-col">
               <span className={cn("text-[9px] font-sans font-bold tracking-widest uppercase", statusTx)}>{projectionStr}</span>
               <span className="text-[10px] font-sans font-bold text-[#666] uppercase mt-0.5">{daysLeft > 0 ? `${daysLeft} Days Left` : 'EXPIRED'}</span>
            </div>
            {!isAchieved && (
               <button onClick={onContribute} className="px-3 py-1 bg-[#1a1a1a] shadow-[var(--shadow-recessed)] plate-border text-engraved-gold hover:bg-[#D4AF37] hover:text-[#000] font-sans font-bold text-[10px] tracking-widest animate-button-compress transition-all">
                 + Add
               </button>
            )}
         </div>
      </div>
    </div>
  );
}

function SIPHUD({ goals }) {
  const [tgt, setTgt] = useState(5000000);
  const [yrs, setYrs] = useState(10);
  const [rate, setRate] = useState(12);

  const handleLink = (e) => {
    const id = e.target.value;
    if(!id) return;
    const g = goals.find(x => x.id === parseInt(id));
    if(g) {
      setTgt(Number(g.target_amount));
      const mLeft = Math.max(1, (new Date(g.target_date) - new Date()) / (1000*60*60*24*30));
      setYrs(Math.max(1, Math.ceil(mLeft/12)));
    }
  };

  const r = (rate / 100) / 12;
  const n = yrs * 12;
  const sip = r===0 ? tgt/n : tgt / (((Math.pow(1+r, n) - 1) / r) * (1+r));
  const invested = sip * n;
  const returns = tgt - invested;

  return (
    <div className="bg-sunray plate-border shadow-[var(--shadow-plate)] flex flex-col overflow-hidden">
       <div className="p-5 border-b border-[#333] relative overflow-hidden bg-[#0d0d0d]">
          <div className="absolute inset-0 opacity-20 bg-pvd-plate"></div>
          <h3 className="text-lg font-sans font-bold tracking-widest text-[#D4AF37] flex items-center relative z-10">
             <Settings className="w-5 h-5 mr-3 group-hover:animate-gear-spin text-[#D4AF37]" /> SIP Calculator
          </h3>
          <p className="text-[#888] font-sans font-bold text-[9px] tracking-widest mt-1 uppercase relative z-10">Calculate your monthly SIP</p>
       </div>

       <div className="p-6 flex-1 flex flex-col space-y-6">
          {goals.length > 0 && (
             <div className="bg-[#111] p-3 plate-border border mb-2 relative group focus-within:border-[#D4AF37]/40 transition-colors shadow-[calc(var(--shadow-recessed))]">
                <label className="text-[9px] font-sans font-bold uppercase text-[#D4AF37] mb-2 block tracking-widest">Link to Goal</label>
                <select onChange={handleLink} defaultValue="" className="w-full bg-[#0a0a0a] border border-[#333] p-1.5 text-[11px] font-sans font-semibold text-[#E0E0E0] outline-none hover:border-[#555] focus:border-[#D4AF37]/50">
                   <option value="" disabled>-- Select Goal --</option>
                   {goals.map(g => <option key={g.id} value={g.id}>{g.name} (Target: {formatInr(g.target_amount)})</option>)}
                </select>
             </div>
          )}

          <div className="space-y-6">
             {[{lbl:'Target Amount', v:tgt, min:10000, max:100000000, step:10000, sx:'₹'+formatInr(tgt), set:setTgt, col:'accent-[#D4AF37]'},
               {lbl:'Time Period', v:yrs, min:1, max:30, step:1, sx:yrs+' YRS', set:setYrs, col:'accent-[#a38a3d]'},
               {lbl:'Expected Return', v:rate, min:4, max:30, step:1, sx:rate+'% PA', set:setRate, col:'accent-[#a38a3d]'}
              ].map((inp, idx) => (
                <div key={idx}>
                   <div className="flex justify-between items-end mb-1.5 font-sans font-bold text-[10px] tracking-widest">
                      <span className="text-[#888] uppercase">{inp.lbl}</span>
                      <span className="text-engraved-gold font-mono" style={{fontVariantNumeric:'tabular-nums', minWidth:'80px', textAlign:'right'}}>{inp.sx}</span>
                   </div>
                   <input type="range" min={inp.min} max={inp.max} step={inp.step} value={inp.v} onChange={e=>inp.set(e.target.value)} className={`w-full h-1.5 bg-[#222] border-y border-[#333] appearance-none cursor-pointer ${inp.col} hover:h-2 transition-all shadow-[var(--shadow-recessed)]`} />
                </div>
             ))}
          </div>
          
          <div className="mt-auto pt-6">
             <div className="border border-[#333] bg-[#0d0d0d] p-5 relative overflow-hidden shadow-[var(--shadow-recessed)] text-center plate-border">
                <div className="absolute top-0 right-0 p-3 opacity-10"><Target className="w-16 h-16 text-[#D4AF37]" /></div>
                <p className="text-[10px] font-sans font-bold uppercase tracking-[0.3em] text-[#D4AF37] mb-2">Required Monthly SIP</p>
                <p className="text-3xl font-mono font-black text-engraved-gold tracking-tight" style={{fontVariantNumeric:'tabular-nums', minHeight:'40px'}}>₹{formatInr(Math.ceil(sip))}</p>
                
                <div className="mt-8 pt-4 border-t border-[#333]">
                  <div className="flex w-full h-[8px] bg-[#111] overflow-hidden gap-[1px] shadow-[var(--shadow-recessed)] rounded-sm">
                     {[...Array(20)].map((_, i) => {
                        const cellPct = (i / 20) * 100;
                        const invPct = (invested / tgt) * 100;
                        let colorClass = "bg-[#222]";
                        if (cellPct < invPct) colorClass = "bg-[#444] shadow-[insert_0_1px_rgba(255,255,255,0.1)]";
                        else colorClass = "bg-[#D4AF37] shadow-[insert_0_1px_rgba(255,255,255,0.3)]";
                        return <div key={i} className={`flex-1 ${colorClass}`}></div>;
                     })}
                  </div>
                  <div className="grid grid-cols-2 mt-3" style={{fontVariantNumeric:'tabular-nums'}}>
                    <div className="flex items-center text-[#888] text-[9px] font-sans font-bold tracking-widest">
                      <div className="w-1.5 h-1.5 bg-[#555] border border-[#333] mr-2 flex-shrink-0"></div>
                      <span className="truncate">Invested:</span>
                      <span className="ml-1">₹{formatInr(invested)}</span>
                    </div>
                    <div className="flex items-center text-engraved-gold text-[9px] font-sans font-bold tracking-widest justify-end">
                      <div className="w-1.5 h-1.5 bg-[#D4AF37] mr-2 flex-shrink-0"></div>
                      <span className="truncate">Returns:</span>
                      <span className="ml-1">₹{formatInr(returns)}</span>
                    </div>
                  </div>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}

function ContributionModal({ goal, onClose, onConfirm }) {
  const [val, setVal] = useState(goal.monthly_sip || 5000);
  const presets = [1000, 5000, 10000, 25000];
  
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#000]/80 backdrop-blur-md p-4 animate-fade-in font-sans">
       <div className="bg-[#050505] border border-[#333] w-full max-w-sm shadow-[0_4px_20px_rgba(0,0,0,0.9)] relative overflow-hidden my-auto">
          <div className="p-5 border-b border-[#222] bg-[#111]"><h3 className="text-sm font-bold tracking-widest text-[#D4AF37]">+ Contribute</h3></div>
          <div className="p-5">
             <p className="text-[10px] font-bold text-[#888] mb-4 uppercase tracking-widest">Adding to {goal.name}</p>
             <div className="flex flex-wrap gap-2 mb-6">
                {presets.map(p => (
                   <button key={p} onClick={()=>setVal(p)} className={cn("px-3 py-1.5 font-bold text-[10px] tracking-wide border transition-all animate-button-compress", val === p ? "bg-[#D4AF37] text-[#000] border-[#D4AF37]" : "bg-[#111] text-[#888] border-[#333] hover:border-[#666] hover:text-[#bbb]")}>
                     ₹{formatInr(p)}
                   </button>
                ))}
             </div>
             <input type="number" min="1" value={val} onChange={e=>setVal(e.target.value)} className="w-full font-mono font-bold text-xl bg-[#111] border border-[#333] shadow-[var(--shadow-recessed)] text-[#D4AF37] p-3 outline-none focus:border-[#D4AF37]/50 transition-colors mb-6 text-center" />
             <div className="flex gap-2">
                <button onClick={onClose} className="flex-1 py-3 bg-[#111] text-[#888] font-bold text-[10px] tracking-widest uppercase hover:bg-[#222] border border-[#333]">Cancel</button>
                <button onClick={()=>onConfirm(val)} disabled={!val || Number(val)<=0} className="flex-1 py-3 bg-[#D4AF37] text-[#000] font-bold border border-[#D4AF37] text-[10px] tracking-widest uppercase hover:bg-[#b0912c] disabled:opacity-50 animate-button-compress shadow-md">Add</button>
             </div>
          </div>
       </div>
    </div>,
    document.body
  );
}

function GoalEditorModal({ goal, onClose, onSave }) {
  const [fd, setFd] = useState({
     name: goal?.name || '', category: goal?.category || 'Travel',
     target_amount: goal?.target_amount || '', saved_amount: goal?.saved_amount || 0,
     target_date: goal ? goal.target_date.split('T')[0] : '', monthly_sip: goal?.monthly_sip || ''
  });
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#000]/80 backdrop-blur-md p-4 animate-fade-in font-sans">
       <div className="bg-[#050505] border border-[#333] w-full max-w-lg shadow-[0_4px_20px_rgba(0,0,0,0.9)] relative max-h-[90vh] flex flex-col overflow-hidden my-auto">
          <div className="p-5 border-b border-[#222] bg-[#111]"><h3 className="text-sm font-bold tracking-widest text-[#D4AF37]">{goal ? 'Edit Goal' : 'Create New Goal'}</h3></div>
          <div className="p-5 overflow-y-auto space-y-4">
             <div><label className="text-[9px] font-bold text-[#888] uppercase tracking-widest mb-1 block">Goal Name</label><input required value={fd.name} onChange={e=>setFd({...fd, name:e.target.value})} className="w-full bg-[#111] border border-[#333] shadow-[var(--shadow-recessed)] text-[#E0E0E0] p-2 outline-none focus:border-[#D4AF37]/50 text-xs font-semibold" /></div>
             <div><label className="text-[9px] font-bold text-[#888] uppercase tracking-widest mb-1 block">Category</label><select value={fd.category} onChange={e=>setFd({...fd, category:e.target.value})} className="w-full bg-[#111] border border-[#333] shadow-[var(--shadow-recessed)] text-[#E0E0E0] p-2 outline-none focus:border-[#D4AF37]/50 text-xs font-semibold">{Object.keys(CAT_ICONS).map(c => <option key={c} value={c}>{c}</option>)}</select></div>
             <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[9px] font-bold text-[#888] uppercase tracking-widest mb-1 block">Target Amount (₹)</label><input type="number" required value={fd.target_amount} onChange={e=>setFd({...fd, target_amount:e.target.value})} className="w-full bg-[#111] border border-[#333] shadow-[var(--shadow-recessed)] text-[#D4AF37] p-2 outline-none focus:border-[#D4AF37]/50 text-xs font-mono font-bold" /></div>
                <div><label className="text-[9px] font-bold text-[#888] uppercase tracking-widest mb-1 block">Already Saved (₹)</label><input type="number" disabled={!!goal} value={fd.saved_amount} onChange={e=>setFd({...fd, saved_amount:e.target.value})} className="w-full bg-[#0a0a0a] border border-[#222] shadow-[var(--shadow-recessed)] text-[#666] p-2 outline-none text-xs font-mono font-bold" /></div>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[9px] font-bold text-[#888] uppercase tracking-widest mb-1 block">Target Date</label><input type="date" required value={fd.target_date} onChange={e=>setFd({...fd, target_date:e.target.value})} className="w-full bg-[#111] border border-[#333] shadow-[var(--shadow-recessed)] text-[#E0E0E0] p-2 outline-none focus:border-[#D4AF37]/50 text-xs font-mono" /></div>
                <div><label className="text-[9px] font-bold text-[#888] uppercase tracking-widest mb-1 block">Monthly SIP (₹)</label><input type="number" value={fd.monthly_sip} onChange={e=>setFd({...fd, monthly_sip:e.target.value})} className="w-full bg-[#1a1a1a] border border-[#D4AF37]/30 shadow-[var(--shadow-recessed)] text-[#a38a3d] p-2 outline-none focus:border-[#D4AF37] text-xs font-mono font-bold" /></div>
             </div>
          </div>
          <div className="p-4 border-t border-[#333] flex gap-2 bg-[#111]">
             <button onClick={onClose} className="flex-1 py-3 bg-[#111] font-bold text-[#888] text-[10px] tracking-widest uppercase hover:bg-[#222] border border-[#333]">Cancel</button>
             <button onClick={()=>onSave(fd)} className="flex-1 py-3 bg-[#D4AF37] text-[#000] font-bold border border-[#D4AF37] text-[10px] tracking-widest uppercase hover:bg-[#b0912c] animate-button-compress shadow-md">Save</button>
          </div>
       </div>
    </div>,
    document.body
  );
}