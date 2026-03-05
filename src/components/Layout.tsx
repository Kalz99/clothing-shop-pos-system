import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, ShoppingBag, PlusCircle, LogOut, Menu, Tag, FileText, Users, RotateCcw } from 'lucide-react';
import logo from '../assets/logo_n.png';

const Layout = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
            {/* Sidebar */}
            <aside
                className={`bg-gray-900 text-white flex flex-col transition-all duration-300 ease-in-out relative ${isSidebarOpen ? 'w-64' : 'w-16'}`}
            >
                {/* Logo & Toggle Area */}
                <div className="p-4 border-b border-gray-800 relative flex items-center justify-center min-h-[5rem]">
                    {isSidebarOpen ? (
                        <>
                            <div className="flex flex-col items-start flex-1 gap-1">
                                <div className="w-24 h-auto overflow-hidden">
                                    <img src={logo} alt="Logo" className="w-full h-auto object-contain" />
                                </div>
                                <div>
                                    <h1 className="text-sm font-bold tracking-tight">Lazaro Clothing</h1>
                                    <p className="text-[10px] text-gray-400">POS System</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsSidebarOpen(false)}
                                className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors focus:outline-none absolute top-4 right-4"
                            >
                                <Menu className="w-5 h-5" />
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors focus:outline-none"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Sidebar Content - only show fully if open */}
                <div className={`flex-1 flex flex-col transition-all duration-300 overflow-hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <div className="min-w-[16rem] flex flex-col h-full">
                        {/* Navigation Menu */}
                        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                            <Link
                                to="/"
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${isActive('/')
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                    }`}
                            >
                                <LayoutDashboard className={`w-5 h-5 ${isActive('/') ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                                <span className="font-medium">Billing</span>
                            </Link>

                            <Link
                                to="/invoices"
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${isActive('/invoices')
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                    }`}
                            >
                                <FileText className={`w-5 h-5 ${isActive('/invoices') ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                                <span className="font-medium">Invoices</span>
                            </Link>

                            <Link
                                to="/returns"
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${isActive('/returns')
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                    }`}
                            >
                                <RotateCcw className={`w-5 h-5 ${isActive('/returns') ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                                <span className="font-medium">Returns</span>
                            </Link>

                            {user?.role === 'manager' && (
                                <>
                                    <Link
                                        to="/sales"
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${isActive('/sales')
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                            }`}
                                    >
                                        <ShoppingBag className={`w-5 h-5 ${isActive('/sales') ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                                        <span className="font-medium">Sales Reports</span>
                                    </Link>
                                    <Link
                                        to="/inventory"
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${isActive('/inventory')
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                            }`}
                                    >
                                        <PlusCircle className={`w-5 h-5 ${isActive('/inventory') ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                                        <span className="font-medium">Inventory</span>
                                    </Link>
                                    <Link
                                        to="/categories"
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${isActive('/categories')
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                            }`}
                                    >
                                        <Tag className={`w-5 h-5 ${isActive('/categories') ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                                        <span className="font-medium">Categories</span>
                                    </Link>
                                    <Link
                                        to="/customers"
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${isActive('/customers')
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                            }`}
                                    >
                                        <Users className={`w-5 h-5 ${isActive('/customers') ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                                        <span className="font-medium">Customers</span>
                                    </Link>
                                </>
                            )}
                        </nav>

                        {/* User Profile / Logout (Bottom) */}
                        <div className="p-4 border-t border-gray-800">
                            <div className="bg-gray-800 rounded-xl p-4 flex items-center justify-between group hover:bg-gray-750 transition-colors">
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-white truncate">{user?.name}</p>
                                    <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
                                </div>
                                <button
                                    onClick={logout}
                                    className="text-gray-400 hover:text-red-400 p-2 rounded-lg transition-colors"
                                    title="Logout"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                <main className="flex-1 overflow-hidden relative">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
