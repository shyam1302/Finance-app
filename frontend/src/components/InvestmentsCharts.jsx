import { useState, useEffect } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, Filler);

const DONUT_COLORS = {
  Crypto: 'rgba(0, 229, 255, 0.7)',
  Stock: 'rgba(173, 255, 47, 0.7)',
  FD: 'rgba(255, 140, 0, 0.7)',
  Gold: 'rgba(212, 175, 55, 0.7)',
  'Mutual Fund': 'rgba(168, 85, 247, 0.7)'
};

function MassiveCounter({ target, isLoading }) {
  const [val, setVal] = useState(0);
  
  useEffect(() => {
    if (isLoading || !target) return;
    let current = 0;
    const step = target / 20; // Ensure consistent speed
    
    const interval = setInterval(() => {
      current += step;
      if (current >= target) {
         setVal(target);
         clearInterval(interval);
      } else {
         setVal(current);
      }
    }, 20);
    return () => clearInterval(interval);
  }, [target, isLoading]);

  if (isLoading) return <>...</>;
  return <>{val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>;
}

export default function DashboardCharts({ hoveredNode, data = [], summary = {}, isLoading }) {
  const lineLabels = ['Nov 25', 'Dec 25', 'Jan 26', 'Feb 26', 'Mar 26', 'LIVE'];
  const baseLine = [680000, 710000, 725000, 755000, 770000];
  const liveValuation = summary.currentValue || 0;
  // If we have live data, connect it to the end of the trajectory
  const lineDataPoints = liveValuation > 0 ? [...baseLine, liveValuation] : [...baseLine, baseLine[baseLine.length-1]];

  const lineData = {
    labels: lineLabels,
    datasets: [
      {
        label: 'Valuation Trace',
        data: lineDataPoints,
        borderColor: '#ADFF2F',
        borderWidth: 1.5,
        backgroundColor: 'rgba(173, 255, 47, 0.1)',
        tension: 0.3,
        fill: true,
        pointBackgroundColor: '#ADFF2F',
        pointBorderColor: '#111',
        pointRadius: 4,
        pointHoverRadius: 6,
      }
    ]
  };

  const lineOptions = {
    maintainAspectRatio: false,
    plugins: { 
      legend: { display: false } 
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

  const donutLabels = ['Crypto', 'Stock', 'FD', 'Gold', 'Mutual Fund'];
  const donutDataRaw = [0, 0, 0, 0, 0];
  
  const typeMap = {
     stock: 'Stock',
     crypto: 'Crypto',
     bond: 'FD',
     mutual_fund: 'Mutual Fund',
     gold: 'Gold'
  };

  data.forEach(inv => {
     let label = typeMap[inv.asset_type] || 'Stock';
     const idx = donutLabels.indexOf(label);
     if(idx > -1) {
        donutDataRaw[idx] += Number(inv.live_value || 0);
     }
  });

  // If completely empty initially, put a 1 in a placeholder to show empty grey donut
  const hasData = donutDataRaw.some(val => val > 0);
  const displayData = hasData ? donutDataRaw : [1];
  
  const donutBgColors = displayData === donutDataRaw ? donutLabels.map(cat => {
    if (hoveredNode) {
       const hNode = data.find(n => n.name === hoveredNode);
       if(hNode && typeMap[hNode.asset_type] === cat) return DONUT_COLORS[cat].replace('0.7', '1');
    }
    return DONUT_COLORS[cat];
  }) : ['#333']; // placeholder color
  
  const borderColors = displayData === donutDataRaw ? donutLabels.map(cat => {
    if (hoveredNode) {
       const hNode = data.find(n => n.name === hoveredNode);
       if(hNode && typeMap[hNode.asset_type] === cat) return '#ADFF2F';
    }
    return '#D4AF37'; 
  }) : ['#111'];

  const donutDataConfig = {
    labels: hasData ? donutLabels : ['No Assets'],
    datasets: [{
      data: displayData,
      backgroundColor: donutBgColors,
      borderColor: borderColors,
      borderWidth: 1,
      hoverOffset: hasData ? 6 : 0
    }]
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8 relative z-10">
      
      {/* Chronograph (Valuation Trajectory) */}
      <div className="bg-[#0a0a0a] p-6 rounded-2xl border border-[#333] shadow-plate relative overflow-hidden flex flex-col group">
        <div className="absolute inset-0 bg-pvd-plate opacity-50 point-events-none"></div>
        <div className="flex justify-between items-center mb-6 relative z-10">
           <h3 className="text-[14px] font-mono font-bold text-[#888] uppercase tracking-widest flex items-center">
             Chronograph Matrix
           </h3>
           <div className="w-2 h-2 rounded-full bg-[var(--color-champagne-gold)] shadow-[0_0_5px_#D4AF37] animate-pulse"></div>
        </div>
        
        <div className="flex-1 relative z-10 h-72 [filter:drop-shadow(0_5px_15px_rgba(173,255,47,0.1))]">
            <Line data={lineData} options={lineOptions} />
        </div>
      </div>
      
      {/* Asset Geography Donut (Massive Recessed Sub-dial) */}
      <div className="bg-[#0d0d0d] rounded-2xl border border-[#333] shadow-recessed relative overflow-hidden flex items-center justify-center min-h-[400px]">
         <div className="absolute inset-2 bg-sunray rounded-full opacity-40 mix-blend-overlay"></div>
         
         <div className="absolute top-4 left-4 z-10">
            <h3 className="text-[12px] font-mono font-bold text-[#666] uppercase tracking-[0.3em]">Asset Geography</h3>
         </div>

         {/* massive recessed sub-dial container */}
         <div className="w-[320px] h-[320px] rounded-full border-4 border-[#222] bg-[#0a0a0a] shadow-recessed flex items-center justify-center relative p-8">
            <Doughnut 
              data={donutDataConfig} 
              options={{ 
                maintainAspectRatio: false, 
                cutout: '84%', 
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
                          if (!hasData) return 'No Valuation';
                          return ' ₹' + context.raw.toLocaleString('en-IN'); 
                       }
                    }
                  }
                } 
              }} 
            />
            
            {/* Massive Gold Ticker & Secondary Stats */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
               <span className="text-[#666] text-[8px] font-mono font-bold uppercase tracking-[0.3em] mb-1">Total Asset Volume</span>
               <span className="text-2xl font-mono font-black text-engraved-gold drop-shadow-md">
                 {isLoading ? '...' : <>₹<MassiveCounter key={`count-${liveValuation}`} target={liveValuation} isLoading={isLoading} /></>}
               </span>
               
               <div className="flex flex-wrap justify-center max-w-[180px] gap-x-2 gap-y-1 mt-3">
                 {hasData ? donutLabels.map((label, idx) => (
                    donutDataRaw[idx] > 0 && (
                      <span key={label} className="text-[7px] font-mono font-bold uppercase tracking-wider text-[#888]">
                        {label} <span className="text-[#bbb]">[{donutDataRaw[idx].toLocaleString('en-IN')}]</span>
                      </span>
                    )
                 )) : (
                    <span className="text-[7px] font-mono font-bold uppercase tracking-wider text-[#888]">
                       AWAITING NODE ALLOCATIONS
                    </span>
                 )}
               </div>
            </div>
         </div>
      </div>
      
    </div>
  );
}
