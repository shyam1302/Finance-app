import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Wallet, Loader2 } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await register(name, email, password);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create account');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-ignite-bg animate-fade-in relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-ignite-red/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-ignite-card border border-ignite-border rounded-2xl flex items-center justify-center shadow-ignite-card transform -rotate-3 transition-transform hover:rotate-0 hover:border-ignite-bhover">
            <Wallet className="w-10 h-10 text-ignite-red transform rotate-3 drop-shadow-[0_0_8px_rgba(204,0,0,0.5)]" />
          </div>
        </div>
        <h2 className="mt-8 text-center text-5xl font-bebas tracking-[2px] text-ignite-white drop-shadow-md">
          Create an Account
        </h2>
        <p className="mt-2 text-center text-sm text-ignite-muted font-medium">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-ignite-red hover:text-ignite-hover hover:underline transition-colors">
            Sign in here
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-ignite-card py-8 px-4 shadow-ignite-card sm:rounded-2xl sm:px-10 border border-ignite-border transition-colors hover:border-ignite-bhover">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-4 bg-ignite-bg border-l-[4px] border-l-ignite-alert text-ignite-white font-bold text-sm rounded-r-xl border-y border-r border-y-ignite-border border-r-ignite-border shadow-md">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-[13px] font-bold text-ignite-muted uppercase tracking-wider">Full Name</label>
              <div className="mt-2">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="appearance-none block w-full px-4 py-3 bg-ignite-bg border border-ignite-border rounded-xl text-ignite-white font-medium shadow-sm placeholder-[#6B5555] focus:outline-none focus:border-ignite-red focus:shadow-ignite-focus transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-bold text-ignite-muted uppercase tracking-wider">Email address</label>
              <div className="mt-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="appearance-none block w-full px-4 py-3 bg-ignite-bg border border-ignite-border rounded-xl text-ignite-white font-medium shadow-sm placeholder-[#6B5555] focus:outline-none focus:border-ignite-red focus:shadow-ignite-focus transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-bold text-ignite-muted uppercase tracking-wider">Password</label>
              <div className="mt-2">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="appearance-none block w-full px-4 py-3 bg-ignite-bg border border-ignite-border rounded-xl text-ignite-white font-medium shadow-sm placeholder-[#6B5555] focus:outline-none focus:border-ignite-red focus:shadow-ignite-focus transition-all"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-black text-white bg-ignite-red hover:bg-ignite-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'IGNITE MY WEALTH'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
