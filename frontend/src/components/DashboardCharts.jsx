import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, Filler);

const DONUT_COLORS = {
  Housing: 'rgba(204, 0, 0, 0.7)',
  Food: 'rgba(255, 107, 107, 0.7)',
  Travel: 'rgba(255, 159, 67, 0.7)',
  Shopping: 'rgba(168, 85, 247, 0.7)',
  Health: 'rgba(0, 200, 83, 0.7)',
  Entertainment: 'rgba(59, 130, 246, 0.7)',
  Utilities: 'rgba(6, 182, 212, 0.7)',
  Other: 'rgba(107, 114, 128, 0.7)'
};

export default function DashboardCharts() {
  const { data: trend } = useQuery({
    queryKey: ['analytics', 'trend'],
    queryFn: async () => (await api.get('/analytics/trend')).data.data
  });

  const { data: category } = useQuery({
    queryKey: ['analytics', 'category'],
    queryFn: async () => (await api.get('/analytics/category')).data.data
  });

  const lineData = {
    labels: trend?.map(t => new Date(t.month + '-01').toLocaleDateString(undefined, {month: 'short'})) || [],
    datasets: [
      {
        label: 'Income',
        data: trend?.map(t => t.income) || [],
        borderColor: '#00C853',
        backgroundColor: 'rgba(0, 200, 83, 0.1)',
        tension: 0.4,
        fill: true,
        borderWidth: 1.5,
        pointBackgroundColor: '#00C853',
        pointBorderColor: '#111',
      },
      {
        label: 'Expenses',
        data: trend?.map(t => t.expense) || [],
        borderColor: '#CC0000',
        backgroundColor: 'rgba(204, 0, 0, 0.1)',
        tension: 0.4,
        fill: true,
        borderWidth: 1.5,
        pointBackgroundColor: '#CC0000',
        pointBorderColor: '#111',
      }
    ]
  };

  const lineOptions = {
    maintainAspectRatio: false,
    plugins: { 
      legend: { 
        position: 'top',
        labels: { color: '#F5F5F5', font: { family: '"JetBrains Mono", monospace', weight: 'bold' } } 
      } 
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.03)', drawBorder: false },
        ticks: { color: '#666', font: { family: '"JetBrains Mono", monospace', size: 9, weight: 'bold' } }
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.03)', drawBorder: false },
        ticks: { color: '#666', font: { family: '"JetBrains Mono", monospace', size: 9, weight: 'bold' }, callback: (v) => '₹' + v.toLocaleString('en-IN') }
      }
    }
  };

  const donutLabels = category?.map(c => c.category) || [];
  const donutDataRaw = category?.map(c => c.total) || [];
  const donutBgColors = donutLabels.map(cat => DONUT_COLORS[cat] || DONUT_COLORS.Other);

  const donutData = {
    labels: donutLabels,
    datasets: [{
      data: donutDataRaw,
      backgroundColor: donutBgColors,
      borderColor: '#D4AF37', // Gold border beneath enamel
      borderWidth: 1,
      hoverOffset: 6
    }]
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 relative z-10">
      
      {/* 6-Month Trend Matrix */}
      <div className="lg:col-span-2 bg-[#0a0a0a] p-6 rounded-2xl border border-[#333] shadow-plate relative overflow-hidden flex flex-col group text-[#e0e0e0]">
        <div className="absolute inset-0 bg-pvd-plate opacity-50 point-events-none"></div>
        <div className="flex justify-between items-center mb-6 relative z-10">
           <h3 className="text-[14px] font-mono font-bold text-[#888] uppercase tracking-widest flex items-center">
             6-Month Overview
           </h3>
           <div className="w-2 h-2 rounded-full bg-[var(--color-champagne-gold)] shadow-[0_0_5px_#D4AF37] animate-pulse"></div>
        </div>
        
        <div className="h-72 relative z-10 [filter:drop-shadow(0_5px_15px_rgba(204,0,0,0.1))]">
          {trend ? (
            <Line data={lineData} options={lineOptions} />
          ) : (
            <div className="animate-pulse bg-[#111] border border-[#222] h-full rounded-xl w-full"></div>
          )}
        </div>
      </div>
      
      {/* Expense Allocation Sub-dial */}
      <div className="bg-[#0d0d0d] rounded-2xl border border-[#333] shadow-recessed relative overflow-hidden flex flex-col items-center justify-center p-6 text-[#e0e0e0]">
         <div className="absolute inset-2 bg-sunray rounded-full opacity-40 mix-blend-overlay max-h-[350px]"></div>
         
         <div className="flex w-full justify-start z-10 absolute top-6 left-6">
            <h3 className="text-[12px] font-mono font-bold text-[#666] uppercase tracking-[0.3em]">Expense Breakdown</h3>
         </div>

         <div className="w-[280px] h-[280px] rounded-full border-4 border-[#222] bg-[#0a0a0a] shadow-recessed flex items-center justify-center relative p-6 mt-6">
           {category?.length > 0 ? (
             <Doughnut 
               data={donutData} 
               options={{ 
                 maintainAspectRatio: false, 
                 cutout: '80%', 
                 plugins: { 
                   legend: { display: false },
                   tooltip: {
                     backgroundColor: '#111',
                     titleColor: '#D4AF37',
                     bodyColor: '#F5F5F5',
                     borderColor: '#D4AF37',
                     borderWidth: 1,
                     titleFont: { family: '"JetBrains Mono", monospace' },
                     bodyFont: { family: '"JetBrains Mono", monospace' },
                     callbacks: {
                       label: function(context) {
                         let label = context.label || '';
                         if (label) label += ': ';
                         const total = context.dataset.data.reduce((a, b) => a + b, 0);
                         const value = context.raw;
                         const percentage = ((value / total) * 100).toFixed(1) + '%';
                         return label + '₹' + Number(value).toLocaleString('en-IN') + ' (' + percentage + ')';
                       }
                     }
                   }
                 } 
               }} 
             />
           ) : (
             <div className="text-[10px] font-mono text-[#888] font-bold flex items-center justify-center h-full w-full uppercase tracking-widest text-center">
               No Expense Data
             </div>
           )}
           
           {/* Center Details */}
           {category?.length > 0 && (
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
               <span className="text-[#666] text-[8px] font-mono font-bold uppercase tracking-[0.3em] mb-1">Total Spent</span>
               <span className="text-xl font-mono font-black text-engraved-gold drop-shadow-md">
                 ₹{donutDataRaw.reduce((a, b) => a + b, 0).toLocaleString('en-IN')}
               </span>
             </div>
           )}
         </div>
      </div>
      
    </div>
  );
}
