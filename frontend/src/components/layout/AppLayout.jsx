import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, Receipt, PieChart, Target, LogOut, Wallet, Menu, ClipboardList, Bot, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils';

export default function AppLayout() {
  const { logout, user } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Transactions', href: '/transactions', icon: Receipt },
    { name: 'Budgets', href: '/budgets', icon: PieChart },
    { name: 'Investments', href: '/investments', icon: Wallet },
    { name: 'Goals', href: '/goals', icon: Target },
    { name: 'Planner', href: '/planner', icon: ClipboardList },
    { name: 'AI CHATBOT', href: '/coach', icon: Bot },
    { name: 'AI COMMERCE', href: '/commerce', icon: ShoppingBag },
  ];

  return (
    <div className="h-screen w-full overflow-hidden bg-[#0a0a0a] flex animate-fade-in text-[#e0e0e0]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/85 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-cotes-de-geneve border-r border-[#222] transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 shadow-[4px_0_24px_rgba(0,0,0,0.9)]",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full relative plate-border">
          <div className="absolute inset-0 bg-gradient-to-br from-[rgba(255,255,255,0.02)] to-black/60 pointer-events-none"></div>

          <div className="flex items-center justify-center h-32 px-4 shadow-engraving bg-[#111]/80">
            <h1 className="text-4xl font-bebas tracking-[2px] text-engraved-gold relative flex items-center">
              WEALTH.OS
              <div className="absolute -bottom-3 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--color-champagne-gold)] to-transparent opacity-30"></div>
            </h1>
          </div>

          <nav className="flex-1 px-6 py-10 overflow-y-auto relative scrollbar-hide z-10">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center text-[11px] font-bold transition-all relative w-full mb-4 p-4 rounded-xl border group outline-none overflow-hidden hover:shadow-[0_4px_15px_rgba(0,0,0,0.5)]",
                    isActive
                      ? "bg-[#0a0a0a] border-[#D4AF37]/50 text-[#D4AF37] shadow-[0_4px_15px_rgba(212,175,55,0.15)] scale-[1.02] z-10"
                      : "bg-[#050505] border-[#222] text-[#666] hover:bg-[#0f0f0f] hover:border-[#333] hover:text-[#999]"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-transparent rounded-tr-xl pointer-events-none transition-opacity ${isActive ? 'to-[#D4AF37]/10 opacity-100' : 'opacity-0 group-hover:to-white/5 group-hover:opacity-100'}`}></div>

                  <div className={cn("mr-4 p-2 rounded-lg transition-all duration-500 shadow-[inset_0_1px_3px_rgba(0,0,0,0.9)] relative z-10", isActive ? "bg-[#1f1f1f] border border-[#D4AF37]/30" : "bg-[#0d0d0d] border border-[#222]")}>
                    <Icon className="w-4 h-4 text-current" />
                  </div>

                  <span className="font-mono tracking-[0.15em] uppercase transition-all duration-300 transform flex-1 relative z-10">{item.name}</span>

                  {isActive && <div className="absolute left-0 top-1/4 bottom-1/4 w-[3px] bg-[#D4AF37] rounded-r-sm shadow-[0_0_8px_#D4AF37]"></div>}
                </Link>
              );
            })}
          </nav>

          <div className="px-6 pb-6 pt-4 border-t border-[#222] bg-[#0a0a0a] relative z-20 shadow-[0_-5px_20px_rgba(0,0,0,0.8)]">
            <div className="flex items-center mb-4 px-2">
              <div className="w-8 h-8 rounded-full bg-[#111] border border-[#333] flex items-center justify-center mr-3 shadow-recessed relative">
                <div className="w-2 h-2 rounded-full border border-[#D4AF37] border-t-transparent animate-spin"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-mono font-bold text-engraved-gold uppercase tracking-widest leading-none">{user?.name?.split(' ')[0] || 'USER'}</span>
                <span className="text-[8px] font-mono text-[#555] tracking-[0.2em] mt-1 uppercase">AUTHENTICATED</span>
              </div>
            </div>

            <button
              onClick={logout}
              className="w-full flex items-center text-[11px] font-bold transition-all relative p-4 rounded-xl border group outline-none overflow-hidden bg-[#050505] border-[#333] text-[#cc0000] hover:bg-[#1a0a0a] hover:border-[#cc0000]/60 hover:text-[#ff3333] hover:shadow-[0_4px_15px_rgba(204,0,0,0.2)]"
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-transparent to-[#cc0000]/10 rounded-tr-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>

              <div className="mr-4 p-2 rounded-lg transition-all duration-500 shadow-[inset_0_1px_3px_rgba(0,0,0,0.9)] relative z-10 bg-[#0d0d0d] border border-[#333] group-hover:border-[#cc0000]/40">
                <LogOut className="w-4 h-4 text-current group-hover:drop-shadow-[0_0_5px_#cc0000] transition-transform" />
              </div>

              <span className="font-mono tracking-[0.15em] uppercase transition-all duration-300 transform flex-1 text-left relative z-10">LOGOUT</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-[#0a0a0a]">
        <header className="flex items-center justify-between h-16 px-4 border-b border-[#222] bg-[#111] lg:hidden relative z-30 shadow-engraving">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 text-[var(--color-champagne-gold)] rounded-md"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="text-xl font-bebas tracking-[3px] text-engraved-gold mt-1">WEALTH OS</span>
          <div className="w-6" />
        </header>

        <main className="flex-1 overflow-y-auto w-full relative custom-scrollbar p-[2px]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}