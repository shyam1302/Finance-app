import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Wallet, Scan, Fingerprint, Lock, Box, Globe, Settings as SettingsIcon, Key } from 'lucide-react';
import HorologyBackground from '../components/HorologyBackground';

function TypewriterText({ text, active, delay = 0, fontClass = "font-mono" }) {
  const [disp, setDisp] = useState('');
  useEffect(() => {
    if(!active) return;
    let t2 = setTimeout(() => {
        let i = 0;
        const t = setInterval(() => {
          setDisp(text.slice(0, i+1));
          i++;
          if (i > text.length) clearInterval(t);
        }, 50); 
        return () => clearInterval(t);
    }, delay * 1000);
    return () => clearTimeout(t2);
  }, [text, active, delay]);

  return <span className={`${fontClass} tracking-widest`}>{disp}<span className="animate-pulse">_</span></span>;
}

// Simulated rapid number counter on mount
function RapidCounter({ target, active }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let current = 0;
    const interval = setInterval(() => {
      current += Math.random() * 800;
      if (current >= target) {
         setVal(target);
         clearInterval(interval);
      } else {
         setVal(Math.floor(current));
      }
    }, 30);
    return () => clearInterval(interval);
  }, [active, target]);
  return <span>{val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>;
}

export default function Login() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [isAnimating, setIsAnimating] = useState(false);
  const [showGoldDust, setShowGoldDust] = useState(false);

  // Login Form
  const [email, setEmail] = useState('demo@wealth.os');
  const [password, setPassword] = useState('password123');
  const [rememberMe, setRememberMe] = useState(true);

  // Signup Form
  const [displayName, setDisplayName] = useState('');
  const [enable2FA, setEnable2FA] = useState(false);
  const [network, setNetwork] = useState('INR');

  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const { login, register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleModeSwitch = (newMode) => {
    if (newMode === mode || isAnimating) return;
    setIsAnimating(true);
    setTimeout(() => {
      setMode(newMode);
      if (newMode === 'signup') {
        setShowGoldDust(true);
        setTimeout(() => setShowGoldDust(false), 1200);
      }
      setTimeout(() => setIsAnimating(false), 500);
    }, 450); // Midpoint of page-turn animation
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        // Actual signup flow to create a unique user account
        await register(displayName, email, password);
      }
      setIsVerified(true);
      setTimeout(() => navigate('/'), 800); 
    } catch (err) {
      setError(err.response?.data?.error || 'Authorization Failed');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden group/vault bg-cotes-de-geneve animate-cotes-breathe z-0">
      
      {/* Dynamic Deep-Space Gradient Orb */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className={`w-[90vw] max-w-[900px] h-[90vw] max-h-[900px] blur-[150px] rounded-full transition-all duration-1000 ease-in-out ${mode === 'signup' ? 'bg-[#FF8C00]/15 scale-110' : 'bg-[#D4AF37]/15 scale-100'}`}></div>
      </div>

      {/* Swiss Horology Floating Particles */}
      <HorologyBackground />

      {/* Mode Selector - Floating Action Cards */}
      <div className="flex justify-center z-20 relative px-4 w-full pt-4 pb-2">
        <div className="flex gap-6 w-full max-w-md">
          <div 
            onClick={() => handleModeSwitch('login')}
            className={`flex-1 flex flex-col items-center justify-center gap-3 p-5 cursor-pointer rounded-2xl transition-all duration-500 font-sans relative overflow-hidden group/card ${mode === 'login' ? 'bg-[#000000] border border-[#D4AF37]/60 shadow-[0_10px_40px_rgba(212,175,55,0.2)] scale-[1.05] z-10' : 'bg-[#080808] border border-[#222] opacity-60 hover:opacity-100 hover:border-[#444] hover:shadow-[0_4px_15px_rgba(0,0,0,0.5)] scale-100'}`}
          >
            <div className={`absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-transparent to-[#D4AF37]/10 rounded-full blur-md pointer-events-none transition-opacity ${mode === 'login' ? 'opacity-100' : 'opacity-0'}`}></div>
            <SettingsIcon className={`w-7 h-7 transition-all duration-700 ${mode === 'login' ? 'text-[#D4AF37] animate-[spin_4s_linear_infinite] drop-shadow-[0_0_8px_rgba(212,175,55,0.8)]' : 'text-[#555] group-hover/card:text-[#888]'}`} />
            <span className={`text-[10px] sm:text-[11px] font-bold tracking-widest uppercase transition-colors duration-500 ${mode === 'login' ? 'text-[#D4AF37] drop-shadow-[0_0_5px_#D4AF37]' : 'text-[#666] group-hover/card:text-[#aaa]'}`}>SECURE LOGIN</span>
            {mode === 'login' && <div className="absolute bottom-0 left-[20%] right-[20%] h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent shadow-[0_0_10px_#D4AF37] animate-pulse"></div>}
          </div>
          <div 
            onClick={() => handleModeSwitch('signup')}
            className={`flex-1 flex flex-col items-center justify-center gap-3 p-5 cursor-pointer rounded-2xl transition-all duration-500 font-sans relative overflow-hidden group/card ${mode === 'signup' ? 'bg-[#000000] border border-[#FF8C00]/60 shadow-[0_10px_40px_rgba(255,140,0,0.15)] scale-[1.05] z-10' : 'bg-[#080808] border border-[#222] opacity-60 hover:opacity-100 hover:border-[#444] hover:shadow-[0_4px_15px_rgba(0,0,0,0.5)] scale-100'}`}
          >
            <div className={`absolute -top-10 -left-10 w-24 h-24 bg-gradient-to-bl from-transparent to-[#FF8C00]/10 rounded-full blur-md pointer-events-none transition-opacity ${mode === 'signup' ? 'opacity-100' : 'opacity-0'}`}></div>
            <Box className={`w-7 h-7 transition-all duration-500 ${mode === 'signup' ? 'text-[#FF8C00] scale-110 drop-shadow-[0_0_8px_rgba(255,140,0,0.8)]' : 'text-[#555] group-hover/card:text-[#888]'}`} />
            <span className={`text-[10px] sm:text-[11px] font-bold tracking-widest uppercase transition-colors duration-500 ${mode === 'signup' ? 'text-[#FF8C00] drop-shadow-[0_0_5px_#FF8C00]' : 'text-[#666] group-hover/card:text-[#aaa]'}`}>PROVISION</span>
            {mode === 'signup' && <div className="absolute bottom-0 left-[20%] right-[20%] h-[2px] bg-gradient-to-r from-transparent via-[#FF8C00] to-transparent shadow-[0_0_10px_#FF8C00] animate-pulse"></div>}
          </div>
        </div>
      </div>
      
      {/* Central Glass Terminal */}
      <div className={`sm:mx-auto sm:w-full sm:max-w-md relative z-10 transition-all duration-500 ${isVerified ? 'animate-vault-spin' : ''} ${isAnimating ? 'animate-mode-switch' : ''}`}>
        
        {showGoldDust && <div className="animate-gold-dust-burst"></div>}
        
        {/* Terminal Header */}
        <div className="flex flex-col items-center mb-6 relative">
          <div className="w-24 h-24 mb-4 rounded-2xl flex items-center justify-center relative">
             <div className={`absolute inset-0 border rounded-2xl transform rotate-45 transition-colors duration-500 ${mode === 'signup' ? 'border-[#FF8C00]/20 shadow-[inset_0_0_20px_rgba(255,140,0,0.1)]' : 'border-[#D4AF37]/40 shadow-[inset_0_0_20px_rgba(212,175,55,0.2)]'}`}></div>
             {mode === 'signup' ? (
                <Box className="w-12 h-12 text-[#FF8C00] relative z-10 animate-ignition drop-shadow-[0_0_15px_#FF8C00]" />
             ) : (
                <Wallet className="w-12 h-12 text-[#CC0000] relative z-10 animate-ignition-gold" />
             )}
          </div>
          
          <h2 className={`text-2xl text-transparent bg-clip-text pb-1 transition-all duration-500 ${mode === 'signup' ? 'bg-gradient-to-r from-[#FF8C00] to-[#FFD700]' : 'text-engraved-gold bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB]'}`}>
             {mode === 'signup' ? (
                 <TypewriterText text="PROVISION_NEW_WEALTH_NODE" active={mounted && mode === 'signup'} delay={0.1} />
             ) : (
                 <TypewriterText fontClass="font-sans font-bold" text="SIGN_IN_TO_WEALTH_OS" active={mounted && mode === 'login'} delay={0.1} />
             )}
          </h2>
        </div>

        {/* Data Entry Panel */}
        <div className={`py-8 px-6 sm:rounded-none sm:px-10 border relative overflow-hidden transition-colors duration-500 ${mode === 'signup' ? 'bg-[#050505]/80 shadow-[0_0_50px_rgba(0,0,0,0.9),inset_0_0_20px_rgba(255,140,0,0.15)] border-[#FF8C00]/30' : 'bg-sunray shadow-[inset_0_2px_10px_rgba(0,0,0,0.8),0_4px_12px_rgba(0,0,0,0.9)] plate-border'}`}>
          
          {/* Subtle moving scanline in the card edge */}
          <div className={`absolute top-0 left-0 w-full h-[1px] ${mode === 'signup' ? 'translate-x-[-100%] animate-[scan_3s_linear_infinite] bg-gradient-to-r from-transparent via-[#FF8C00] to-transparent' : 'animate-gold-scanline bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent'}`}></div>

          <form className="space-y-8 relative z-10" onSubmit={handleSubmit}>
            
            {error && (
              <div className="p-3 bg-[#110000] border-l-2 border-[#FF4444] text-[#FF4444] font-mono text-[11px] tracking-widest flex items-center shadow-[0_0_15px_rgba(255,68,68,0.2)]">
                <Lock className="w-4 h-4 mr-3 shrink-0" />
                {error}
              </div>
            )}
            
            {mode === 'signup' && (
                <div className="relative group animate-fade-in" style={{ animationDelay: '0.1s' }}>
                   <input
                     type="text"
                     value={displayName}
                     onChange={(e) => setDisplayName(e.target.value)}
                     className="peer block w-full px-0 py-2 bg-transparent border-0 border-b border-[#222] text-[#FF8C00] font-mono text-sm tracking-wider focus:outline-none focus:ring-0 focus:border-[#FF8C00] transition-colors shadow-none hover:border-[#444]"
                     placeholder=" "
                   />
                   <label className="absolute left-0 top-2 text-[#888] font-mono text-[11px] uppercase tracking-[0.2em] transition-all duration-300 peer-focus:-top-4 peer-focus:text-[9px] peer-focus:text-[#FF8C00] peer-not-placeholder-shown:-top-4 peer-not-placeholder-shown:text-[9px] peer-not-placeholder-shown:text-[#FF8C00] pointer-events-none">
                     NODE_OPERATOR_ALIAS [DISPLAY NAME]
                   </label>
                   <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-[#FF8C00] peer-focus:w-full transition-all duration-500 shadow-[0_0_10px_#FF8C00]"></div>
                </div>
            )}

            {/* Email Field */}
            <div className="relative group">
               <input
                 type="email"
                 required
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 className={`peer block w-full px-0 py-2 bg-transparent border-0 border-b border-[#2F4F4F] font-mono text-sm tracking-wider focus:outline-none focus:ring-0 transition-colors shadow-none hover:border-[#D4AF37]/50 caret-[#D4AF37] ${mode === 'signup' ? 'text-[#FF8C00] focus:border-[#FF8C00]' : 'text-[#e0e0e0] focus:border-[#D4AF37]'}`}
                 placeholder=" "
               />
               <label className={`absolute left-0 top-2 text-[#888] font-mono text-[11px] uppercase tracking-[0.2em] transition-all duration-300 peer-focus:-top-4 peer-focus:text-[9px] peer-not-placeholder-shown:-top-4 peer-not-placeholder-shown:text-[9px] pointer-events-none ${mode === 'signup' ? 'peer-focus:text-[#FF8C00] peer-not-placeholder-shown:text-[#FF8C00]' : 'peer-focus:text-[#D4AF37] peer-not-placeholder-shown:text-[#D4AF37]'}`}>
                 SYSTEM_ID [EMAIL]
               </label>
               <div className={`absolute bottom-0 left-0 h-[1px] w-0 peer-focus:w-full transition-all duration-500 ${mode === 'signup' ? 'bg-[#FF8C00] shadow-[0_0_10px_#FF8C00]' : 'bg-[#D4AF37] shadow-[0_0_10px_#D4AF37]'}`}></div>
            </div>

            {/* Password Field */}
            <div className="relative group">
               <input
                 type="password"
                 required
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 className={`peer block w-full px-0 py-2 bg-transparent border-0 border-b border-[#2F4F4F] font-mono text-xl tracking-[0.5em] focus:outline-none focus:ring-0 transition-colors shadow-none hover:border-[#D4AF37]/50 caret-[#D4AF37] ${mode === 'signup' ? 'text-[#ADFF2F] focus:border-[#ADFF2F]' : 'text-[#D4AF37] focus:border-[#D4AF37]'}`}
                 placeholder=" "
               />
               <label className={`absolute left-0 top-2 text-[#888] font-mono text-[11px] uppercase tracking-[0.2em] transition-all duration-300 peer-focus:-top-4 peer-focus:text-[9px] peer-not-placeholder-shown:-top-4 peer-not-placeholder-shown:text-[9px] pointer-events-none ${mode === 'signup' ? 'peer-focus:text-[#ADFF2F] peer-not-placeholder-shown:text-[#ADFF2F]' : 'peer-focus:text-[#D4AF37] peer-not-placeholder-shown:text-[#D4AF37]'}`}>
                 BIOMETRIC_KEY [PASSWORD]
               </label>
               <div className={`absolute bottom-0 left-0 h-[1px] w-0 peer-focus:w-full transition-all duration-500 ${mode === 'signup' ? 'bg-[#ADFF2F] shadow-[0_0_10px_#ADFF2F]' : 'bg-[#D4AF37] shadow-[0_0_10px_#D4AF37]'}`}></div>
            </div>

            <div className="flex items-center justify-between pt-2">
              {mode === 'login' ? (
                <>
                  <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setRememberMe(!rememberMe)}>
                    <div className={`w-8 h-4 border transition-colors flex items-center px-0.5 ${rememberMe ? 'border-[#D4AF37] bg-[#D4AF37]/10' : 'border-[#333] bg-[#111]'}`}>
                       <Scan className={`w-3 h-3 transition-transform ${rememberMe ? 'text-[#D4AF37] translate-x-3 animate-spin shadow-[0_0_5px_#D4AF37]' : 'text-[#555] translate-x-0'}`} />
                    </div>
                    <div className="px-2 py-0.5 border border-[#D4AF37]/30 bg-[#1A1A1A] shadow-[inset_0_1px_2px_rgba(0,0,0,0.8),0_1px_0_rgba(255,255,255,0.1)]">
                       <label className="text-[9px] font-sans font-bold text-[#D4AF37] tracking-[0.1em] uppercase group-hover:text-[#F3E5AB] cursor-pointer">
                         Persist Session
                       </label>
                    </div>
                  </div>
                  <a href="#" className="text-[9px] font-sans font-bold text-[#8B0000] tracking-[0.2em] uppercase hover:text-[#CC0000] hover:drop-shadow-[0_0_5px_#CC0000] transition-all animate-pulse">
                    Override Code?
                  </a>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setEnable2FA(!enable2FA)}>
                    <div className={`w-8 h-4 border transition-colors flex items-center px-0.5 ${enable2FA ? 'border-[#FF8C00] bg-[#FF8C00]/10' : 'border-[#333] bg-[#111]'}`}>
                       <div className={`w-2 h-2 bg-current transform transition-transform ${enable2FA ? 'text-[#FF8C00] translate-x-4 shadow-[0_0_5px_#FF8C00]' : 'text-[#555] translate-x-0'}`}></div>
                    </div>
                    <label className="text-[9px] font-mono text-[#888] tracking-[0.2em] uppercase group-hover:text-[#E0E0E0] cursor-pointer">
                      REQUEST_MULTISIG_LAYER [ENABLE 2FA]
                    </label>
                  </div>
                  
                  <div className="flex items-center gap-2 group">
                    <Globe className="w-3 h-3 text-[#FF8C00]" />
                    <select 
                       className="bg-transparent border-0 border-b border-[#333] text-[#FF8C00] font-mono text-[9px] tracking-[0.2em] focus:outline-none focus:ring-0 uppercase cursor-pointer"
                       value={network}
                       onChange={(e) => setNetwork(e.target.value)}
                    >
                       <option value="INR" className="bg-[#111] text-[#00E5FF]">[{'\u20B9'}] INR</option>
                       <option value="USD" className="bg-[#111] text-[#00E5FF]">[$] USD</option>
                       <option value="EUR" className="bg-[#111] text-[#00E5FF]">[{'\u20AC'}] EUR</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="pt-6 relative group/btn">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full relative flex justify-center py-4 px-4 border overflow-hidden transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed bg-[#0a0a0a] ${mode === 'signup' ? 'border-[#FF8C00]/40 hover:border-[#FFD700] hover:bg-[#140b00]' : 'border-[#D4AF37]/40 hover:border-[#F3E5AB] hover:bg-[#141108]'} shadow-plate hover:shadow-[0_6px_12px_rgba(0,0,0,0.9)] z-10`}
              >
                {isSubmitting ? (
                  <div className="flex items-center text-[#D4AF37] font-mono tracking-widest text-[11px] drop-shadow-[0_0_8px_#D4AF37]">
                     {mode === 'signup' ? <Scan className="w-5 h-5 animate-spin mr-3" /> : <Key className="w-5 h-5 animate-spin mr-3 text-[#D4AF37]" />}
                     {mode === 'signup' ? 'PROVISIONING...' : <span className="text-[#D4AF37]">VERIFYING_CREDENTIALS...</span>}
                  </div>
                ) : isVerified ? (
                  <div className="flex items-center text-[#D4AF37] font-mono font-bold tracking-[0.3em] text-[12px] drop-shadow-[0_0_10px_#D4AF37]">
                     {mode === 'signup' ? <Fingerprint className="w-5 h-5 mr-3 animate-pulse text-[#ADFF2F]" /> : <Key className="w-5 h-5 mr-3 animate-spin text-[#D4AF37]" />}
                     {mode === 'signup' ? 'NODE_CREATED' : <span className="text-[#D4AF37]">ACCESS_GRANTED</span>}
                  </div>
                ) : (
                  <span className={`relative z-10 text-[12px] font-mono font-bold tracking-[0.3em] uppercase transition-colors ${mode === 'signup' ? 'text-[#FF8C00] group-hover/btn:text-[#FFD700]' : 'text-[#D4AF37] group-hover/btn:text-[#F3E5AB]'}`}>
                    {mode === 'signup' ? 'INITIATE NODE CREATION' : 'Execute Safe-Login'}
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
        
        {/* Terminal decorative footer */}
        <div className="mt-4 flex justify-between px-2 text-[8px] font-mono text-[#00E5FF]/40 tracking-widest uppercase pointer-events-none">
           <span>
             SYNC: <RapidCounter target={9824} active={mounted} />ms
           </span>
           <span>LAT: 34.0522 N / LONG: 118.2437 W</span>
        </div>
      </div>
    </div>
  );
}
