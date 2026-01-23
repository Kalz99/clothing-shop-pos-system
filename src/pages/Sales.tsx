import { BarChart3, TrendingUp, DollarSign, Calendar, ShoppingBag } from 'lucide-react';
import { useInvoices } from '../context/InvoiceContext';
import { useState } from 'react';

const Sales = () => {
    const { invoices } = useInvoices();
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
    const [timeframe, setTimeframe] = useState<'daily' | 'monthly' | 'yearly'>('daily');

    // Calculate Metrics
    const today = new Date().toISOString().split('T')[0];
    const todaySales = invoices
        .filter(inv => inv.date.startsWith(today))
        .reduce((sum, inv) => sum + inv.total, 0);

    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalOrders = invoices.length;

    const filteredInvoices = invoices.filter(inv => {
        if (!filterDate) return true;
        if (timeframe === 'daily') return inv.date.split('T')[0] === filterDate;
        if (timeframe === 'monthly') return inv.date.startsWith(filterDate.slice(0, 7));
        if (timeframe === 'yearly') return inv.date.startsWith(filterDate.slice(0, 4));
        return true;
    });

    const filteredTotal = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);

    return (
        <div className="p-8 max-w-7xl mx-auto w-full h-full overflow-y-auto">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Sales Reports</h1>
                    <p className="text-gray-500">Overview of store performance</p>
                </div>
                <div className="flex gap-4 items-center bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex rounded-lg bg-gray-100 p-1">
                        {(['daily', 'monthly', 'yearly'] as const).map((t) => (
                            <button
                                key={t}
                                onClick={() => setTimeframe(t)}
                                className={`px-4 py-1.5 rounded-md text-xs font-bold capitalize transition-all ${timeframe === t ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                    <div className="relative">
                        <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type={timeframe === 'yearly' ? 'number' : timeframe === 'monthly' ? 'month' : 'date'}
                            value={timeframe === 'yearly' ? filterDate.slice(0, 4) : timeframe === 'monthly' ? filterDate.slice(0, 7) : filterDate}
                            onChange={(e) => {
                                let val = e.target.value;
                                if (timeframe === 'yearly') val = `${val}-01-01`;
                                if (timeframe === 'monthly') val = `${val}-01`;
                                setFilterDate(val);
                            }}
                            className="pl-9 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                    { label: 'Today Sales', value: `Rs. ${todaySales.toLocaleString()}`, icon: TrendingUp, color: 'bg-green-500' },
                    { label: 'Total Sales', value: `Rs. ${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'bg-blue-600' },
                    { label: 'Total Orders', value: totalOrders.toString(), icon: ShoppingBag, color: 'bg-purple-500' },
                    { label: 'Filtered Sales', value: `Rs. ${filteredTotal.toLocaleString()}`, icon: BarChart3, color: 'bg-orange-500' },
                ].map((stat, index) => (
                    <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className={`${stat.color} p-3 rounded-xl text-white shadow-lg`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400 font-medium">{stat.label}</p>
                            <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Orders Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-800">
                        {timeframe === 'daily' ? 'Daily' : timeframe === 'monthly' ? 'Monthly' : 'Yearly'} Transactions
                    </h2>
                    <span className="text-sm text-gray-500">{filteredInvoices.length} results found</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                            <tr>
                                <th className="px-6 py-4 font-bold">Invoice ID</th>
                                <th className="px-6 py-4 font-bold">Date</th>
                                <th className="px-6 py-4 font-bold">Customer</th>
                                <th className="px-6 py-4 font-bold text-center">Items</th>
                                <th className="px-6 py-4 font-bold">Payment</th>
                                <th className="px-6 py-4 font-bold text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredInvoices.map((inv) => (
                                <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-blue-600">{inv.invoiceNo}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(inv.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">
                                            {(!inv.customerName || inv.customerName === 'Walk-in') ? 'Walk-in Customer' : inv.customerName}
                                        </div>
                                        {inv.customerMobile && (
                                            <div className="text-xs text-gray-400">{inv.customerMobile}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 text-center">
                                        {inv.items.reduce((acc, item) => acc + item.quantity, 0)}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${inv.paymentMethod === 'cash' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                                            {inv.paymentMethod}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                                        Rs. {inv.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            ))}
                            {filteredInvoices.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                        <div className="flex flex-col items-center">
                                            <ShoppingBag className="w-12 h-12 mb-3 opacity-20" />
                                            <p>No transactions found for the selected period</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Sales;
