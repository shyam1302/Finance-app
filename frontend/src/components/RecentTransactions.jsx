import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

export default function RecentTransactions() {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions', 'recent'],
    queryFn: async () => {
      const res = await api.get('/transactions?limit=5');
      return res.data.data;
    }
  });

  if (isLoading) {
    return (
      <div className="bg-[#0a0a0a] rounded-2xl border border-[#333] shadow-plate p-6 h-64 flex items-center justify-center relative mt-6">
        <div className="w-8 h-8 rounded-full border-2 border-transparent border-t-[var(--color-champagne-gold)] animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0a] rounded-2xl border border-[#333] shadow-plate relative overflow-hidden flex flex-col group mt-6">
       <div className="absolute inset-0 bg-cotes-de-geneve opacity-30 pointer-events-none mix-blend-overlay"></div>
       
       <div className="p-6 border-b border-[#222] relative z-10 flex justify-between items-center shadow-engraving bg-[#111]/80">
          <h3 className="text-[14px] font-mono font-bold text-[#888] uppercase tracking-widest flex items-center">
            RECENT TRANSMISSIONS
          </h3>
          <span className="text-[10px] text-[#666] font-mono tracking-[0.2em]">{transactions?.length || 0} LOGS FOUND</span>
       </div>

       <div className="p-0 relative z-10">
         {transactions?.length > 0 ? (
           <ul className="divide-y divide-[#222]">
             {transactions.map((tx) => (
               <li 
                 key={tx.id} 
                 className="flex justify-between items-center px-6 py-4 hover:bg-[#111] transition-colors cursor-default group/row"
               >
                 <div className="flex items-center gap-4">
                   <div className={`p-2 rounded border shadow-[inset_0_0_5px_rgba(0,0,0,0.8)] flex items-center justify-center shrink-0 w-10 h-10 ${tx.type === 'income' ? 'border-[#00C853]/30 bg-[#00C853]/10 text-[#00C853]' : 'border-[#CC0000]/30 bg-[#CC0000]/10 text-[#CC0000]'}`}>
                     {tx.type === 'income' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                   </div>
                   <div className="flex flex-col">
                     <span className="text-[12px] font-sans font-bold text-[#e0e0e0] uppercase tracking-wider">{tx.merchant}</span>
                     <span className="text-[10px] font-mono text-[#666] tracking-widest mt-1">
                       {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })} • {tx.category}
                     </span>
                   </div>
                 </div>
                 <div className="flex flex-col items-end">
                   <span className={`text-[14px] font-mono font-bold tracking-tight ${tx.type === 'income' ? 'text-[#00C853]' : 'text-engraved-gold'}`}>
                     {tx.type === 'income' ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN')}
                   </span>
                 </div>
               </li>
             ))}
           </ul>
         ) : (
           <div className="text-[11px] font-mono text-[#888] font-bold p-8 uppercase tracking-widest text-center flex flex-col items-center">
             <div className="w-8 h-8 opacity-20 border rounded-full border-dashed animate-spin-slow mb-4 border-[#888]"></div>
             NO TRANSACTION DATA AVAILABLE
           </div>
         )}
       </div>
    </div>
  );
}
