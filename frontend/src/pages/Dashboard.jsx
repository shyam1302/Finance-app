import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Link } from 'react-router-dom';
import { Compass, Activity, Target, ChevronRight } from 'lucide-react';
import DashboardCharts from '../components/DashboardCharts';
import RecentTransactions from '../components/RecentTransactions';

export default function Dashboard() {
  const { user } = useAuth();
  
  const { data: summary, isLoading } = useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: async () => {
       const res = await api.get('/analytics/summary');
       return res.data.data;
    }
  });

  const income = summary?.income || 0;
  const expense = summary?.expense || 0;
  const savings = summary?.totalSavings || 0;
  const savingsRate = summary?.savingsRate || 0;

  return (
    <div className="space-y-6 animate-fade-in pb-10 max-w-7xl mx-auto px-4 mt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[28px] font-bebas tracking-[4px] text-engraved-gold flex items-center shadow-gold-text">
            DASHBOARD // {user?.name?.toUpperCase() || 'PRIMARY'}
          </h1>
          <p className="text-[#888] font-mono text-[10px] tracking-[0.2em] uppercase mt-1">Status: Online • {new Date().toLocaleTimeString()}</p>
        </div>
      </div>
      
      {/* Complications Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-cotes-de-geneve p-6 rounded-2xl plate-border shadow-plate relative z-10">
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[rgba(255,255,255,0.02)] to-black/60 pointer-events-none rounded-2xl"></div>

        {/* Live Net Savings Complication */}
        <div className="bg-[#0a0a0a] p-5 rounded-xl border border-[#333] shadow-recessed relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <h3 className="text-[#666] text-[10px] font-mono font-bold uppercase tracking-[0.2em] relative z-10">Net Savings</h3>
            
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
            ₹{savings.toLocaleString('en-IN')}
          </p>
        </div>
        
        {/* Monthly Income */}
        <div className="bg-[#0a0a0a] p-5 rounded-xl border border-[#333] shadow-recessed relative overflow-hidden group">
          <div className="absolute top-2 right-2 opacity-10">
            <Compass className="w-16 h-16 text-[var(--color-champagne-gold)]" />
          </div>
          <h3 className="text-[#666] text-[10px] font-mono font-bold uppercase tracking-[0.2em] relative z-10">Monthly Income</h3>
          <p className="text-2xl font-mono font-black text-[#00C853] mt-1 tracking-tight drop-shadow-[0_0_8px_rgba(0,200,83,0.3)] relative z-10">
            ₹{income.toLocaleString('en-IN')}
          </p>
        </div>
        
        {/* Monthly Expense */}
        <div className="bg-[#0a0a0a] p-5 rounded-xl border border-[#333] shadow-recessed relative overflow-hidden group">
          <div className="absolute top-2 right-2 opacity-10">
            <Activity className="w-16 h-16 text-[var(--color-enamel-red)]" />
          </div>
          <h3 className="text-[#666] text-[10px] font-mono font-bold uppercase tracking-[0.2em] relative z-10">Monthly Expense</h3>
          <p className="text-2xl font-mono font-black text-[var(--color-enamel-red)] mt-1 tracking-tight drop-shadow-[0_0_8px_rgba(139,0,0,0.3)] relative z-10">
            ₹{expense.toLocaleString('en-IN')}
          </p>
        </div>

        {/* Savings Rate Tourbillon */}
        <div className="bg-[#0a0a0a] p-5 rounded-xl border border-[#333] shadow-recessed relative overflow-hidden flex flex-col justify-between items-end text-right">
           <div className="flex justify-between w-full items-start">
             {/* Gravity Defying Tourbillon Gauge */}
             <div className="w-10 h-10 rounded-full border border-[#444] shadow-[0_0_10px_rgba(0,0,0,0.9),inset_0_0_5px_rgba(0,0,0,0.9)] flex items-center justify-center relative bg-[#111] shrink-0">
                <div className="absolute inset-2 border border-[var(--color-champagne-gold)] rounded-full opacity-30 shadow-[inset_0_0_3px_#D4AF37]"></div>
                <div className="w-1 h-6 bg-[var(--color-champagne-gold)] rounded-full animate-tourbillon-tick shadow-[0_0_5px_rgba(212,175,55,0.8)]"></div>
             </div>
             <h3 className="text-[#666] text-[10px] font-mono font-bold uppercase tracking-[0.2em]">Savings Rate</h3>
           </div>
           <div>
             <p className="text-xl font-mono font-black text-engraved-gold tracking-widest">{Number(savingsRate).toFixed(1)}%</p>
             <p className="text-[#888] text-[9px] font-mono font-bold uppercase tracking-[0.2em]">{Number(savingsRate) > 20 ? 'Good' : 'Low'}</p>
           </div>
        </div>

      </div>

      {isLoading ? (
        <div className="h-40 flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-transparent border-t-[var(--color-champagne-gold)] animate-spin"></div></div>
      ) : (
        <>
          <DashboardCharts />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <RecentTransactions />
            <ActiveDirectives />
          </div>
        </>
      )}
    </div>
  );
}

function ActiveDirectives() {
  const { data: goals, isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      const { data } = await api.get('/goals');
      return data.data?.filter(g => g.status === 'active').slice(0, 3) || [];
    }
  });

  if (isLoading) {
    return (
      <div className="bg-[#0a0a0a] rounded-2xl border border-[#333] shadow-plate relative overflow-hidden flex flex-col mt-6 p-6 justify-center items-center min-h-[220px]">
        <div className="w-8 h-8 rounded-full border-2 border-transparent border-t-[var(--color-champagne-gold)] animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0a] rounded-2xl border border-[#333] shadow-plate relative overflow-hidden flex flex-col group mt-6 p-6 justify-between min-h-[220px]">
      <div className="absolute inset-0 bg-cotes-de-geneve opacity-20 pointer-events-none"></div>
      <div className="relative z-10 w-full flex-1">
        <h3 className="text-[12px] font-mono font-bold text-[#888] uppercase tracking-widest flex items-center mb-6">
          <Target className="w-4 h-4 mr-2 text-[#D4AF37]" />
          Active Goals
        </h3>
        
        {goals?.length === 0 ? (
           <div className="text-center py-6 text-[#555] text-[10px] font-mono uppercase tracking-widest">No active goals yet</div>
        ) : (
          <div className="space-y-5">
            {goals.map(goal => {
              const pct = Math.min((goal.saved_amount / goal.target_amount) * 100, 100);
              return (
                <div key={goal.id} className="group/goal cursor-pointer">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[11px] font-mono text-[#e0e0e0] tracking-[0.1em] uppercase truncate max-w-[60%] group-hover/goal:text-white transition-colors">{goal.name}</span>
                    <span className="text-[10px] font-mono text-engraved-gold tracking-widest">
                      {pct.toFixed(1)}% <span className="text-[#555]">/ ₹{(goal.target_amount/1000).toFixed(0)}K</span>
                    </span>
                  </div>
                  <div className="w-full bg-[#111] h-1.5 rounded-[1px] overflow-hidden border border-[#222] shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]">
                    <div className="h-full bg-[#D4AF37] opacity-80 shadow-[0_0_8px_#D4AF37] transition-all duration-1000" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="flex justify-between items-end relative z-10 mt-6 pt-4 border-t border-[#222]">
        <Link to="/goals" className="text-[9px] font-mono text-[#666] hover:text-[#D4AF37] uppercase tracking-widest transition-colors flex items-center">
          View All Goals <ChevronRight className="w-3 h-3 ml-1" />
        </Link>
        <span className="text-[9px] font-mono text-[#666] uppercase tracking-widest">Goals Tracking</span>
      </div>
    </div>
  );
}
