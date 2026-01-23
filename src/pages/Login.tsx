import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UserCircle, Store } from 'lucide-react';
import logo from '../assets/logo_n.png';

const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'manager' | 'cashier' | null>(null);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !password || !role) return;
        const success = await login(username, password, role);
        if (success) {
            navigate('/');
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-[340px] space-y-6">
                <div className="text-center">
                    <div className="w-24 h-auto mx-auto mb-1">
                        <img src={logo} alt="Lazaro Clothing Logo" className="w-full h-auto object-contain" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">POS System</h1>
                    <p className="text-slate-400 text-xs mt-0.5">Select role and sign in</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    {/* Role Selection */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setRole('manager')}
                            className={`group relative flex flex-col items-center justify-center p-3 border-2 rounded-xl transition-all duration-200 ${role === 'manager'
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-slate-100 hover:border-blue-200 hover:bg-slate-50'
                                }`}
                        >
                            <UserCircle className={`w-6 h-6 mb-1.5 transition-colors ${role === 'manager' ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-400'}`} />
                            <span className={`text-xs font-bold ${role === 'manager' ? 'text-blue-700' : 'text-slate-600'}`}>Manager</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setRole('cashier')}
                            className={`group relative flex flex-col items-center justify-center p-3 border-2 rounded-xl transition-all duration-200 ${role === 'cashier'
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-slate-100 hover:border-purple-200 hover:bg-slate-50'
                                }`}
                        >
                            <Store className={`w-6 h-6 mb-1.5 transition-colors ${role === 'cashier' ? 'text-purple-600' : 'text-slate-400 group-hover:text-purple-400'}`} />
                            <span className={`text-xs font-bold ${role === 'cashier' ? 'text-purple-700' : 'text-slate-600'}`}>Cashier</span>
                        </button>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label htmlFor="username" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 px-1">
                                Username
                            </label>
                            <input
                                id="username"
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all text-sm"
                                placeholder="Username"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 px-1">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all text-sm"
                                placeholder="Password"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={!role}
                        className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 hover:bg-blue-700 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 transition-all active:scale-[0.98]"
                    >
                        Login
                    </button>
                </form>

                <div className="text-center text-[10px] text-slate-400 mt-6 pt-2 border-t border-slate-50">
                    System by <a href="https://it.luxn.lk" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 transition-colors font-medium">LUXN IT</a>
                </div>
            </div>
        </div>
    );
};

export default Login;
