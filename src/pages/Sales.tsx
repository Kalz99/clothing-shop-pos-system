import { BarChart3, TrendingUp, DollarSign, Calendar, ShoppingBag, RotateCcw } from 'lucide-react';
import { useInvoices } from '../context/InvoiceContext';
import { useProducts } from '../context/ProductContext';
import { useReturns } from '../context/ReturnContext';
import { useState } from 'react';

const Sales = () => {
    const { invoices } = useInvoices();
    const { products } = useProducts();
    const { returns } = useReturns();
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
    const [timeframe, setTimeframe] = useState<'daily' | 'monthly' | 'yearly'>('daily');

    // Calculate Metrics (Only for ACTIVE invoices)
    const activeInvoices = invoices.filter(inv => inv.status);

    // Total Metrics — subtract returns from totals
    const totalInvoicedSales = activeInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0);
    const totalRefundedValue = returns.reduce((sum, r) => sum + Number(r.totalRefund || 0), 0);
    const totalSales = totalInvoicedSales - totalRefundedValue;

    // Calculate total cost of all sold items in active invoices
    const totalInvoicedCost = activeInvoices.reduce((sum, inv) =>
        sum + (inv.items || []).reduce((itemSum, item) => {
            const product = products.find(p => p.id === item.id || p.barcode === item.barcode);
            const cost = Number(product ? product.costPrice : (item.costPrice || 0)) || 0;
            return itemSum + (cost * Number(item.quantity || 0));
        }, 0), 0
    );

    // Calculate cost of returned items (lookup from their original invoice for accuracy)
    const totalReturnedCost = returns.reduce((sum, ret) => {
        const originalInvoice = invoices.find(inv => inv.id === (ret.saleId || '').toString());
        if (!originalInvoice) return sum;

        return sum + (ret.items || []).reduce((itemSum, retItem) => {
            const invItem = (originalInvoice.items || []).find(i => i.id === retItem.productId || i.name === retItem.productName);
            // Fallback: If original invoice item doesn't have cost, try to find current product cost
            let cost = Number(invItem ? invItem.costPrice : 0) || 0;
            if (cost === 0) {
                const product = products.find(p => p.id === retItem.productId || p.name === retItem.productName);
                cost = Number(product ? product.costPrice : 0) || 0;
            }
            return itemSum + (cost * Number(retItem.qty || 0));
        }, 0);
    }, 0);

    const totalCost = totalInvoicedCost - totalReturnedCost;
    const totalProfit = totalSales - totalCost;
    const totalOrderCount = activeInvoices.length;

    // Date filter helper
    const matchesFilter = (dateStr: string) => {
        if (!filterDate) return true;
        if (timeframe === 'daily') return (dateStr || '').split('T')[0] === filterDate;
        if (timeframe === 'monthly') return (dateStr || '').startsWith(filterDate.slice(0, 7));
        if (timeframe === 'yearly') return (dateStr || '').startsWith(filterDate.slice(0, 4));
        return true;
    };

    // Filtered Invoices
    const filteredInvoices = invoices.filter(inv => matchesFilter(inv.date));
    const activeFilteredInvoices = filteredInvoices.filter(inv => inv.status);

    // Filtered Returns (returns that fall within the selected period)
    const filteredReturns = returns.filter(r => matchesFilter(r.date));

    const filteredInvoicedSales = activeFilteredInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0);
    const filteredRefundedValue = filteredReturns.reduce((sum, r) => sum + Number(r.totalRefund || 0), 0);
    const filteredSales = filteredInvoicedSales - filteredRefundedValue;

    const filteredInvoicedCost = activeFilteredInvoices.reduce((sum, inv) =>
        sum + (inv.items || []).reduce((itemSum, item) => {
            const product = products.find(p => p.id === item.id || p.barcode === item.barcode);
            const cost = Number(product ? product.costPrice : (item.costPrice || 0)) || 0;
            return itemSum + (cost * Number(item.quantity || 0));
        }, 0), 0
    );

    const filteredReturnedCost = filteredReturns.reduce((sum, ret) => {
        const originalInvoice = invoices.find(inv => inv.id === (ret.saleId || '').toString());
        if (!originalInvoice) return sum;

        return sum + (ret.items || []).reduce((itemSum, retItem) => {
            const invItem = (originalInvoice.items || []).find(i => i.id === retItem.productId || i.name === retItem.productName);
            let cost = Number(invItem ? invItem.costPrice : 0) || 0;
            if (cost === 0) {
                const product = products.find(p => p.id === retItem.productId || p.name === retItem.productName);
                cost = Number(product ? product.costPrice : 0) || 0;
            }
            return itemSum + (cost * Number(retItem.qty || 0));
        }, 0);
    }, 0);

    const filteredCost = filteredInvoicedCost - filteredReturnedCost;
    const filteredProfit = filteredSales - filteredCost;
    const filteredOrderCount = activeFilteredInvoices.length;

    // Merge invoices and returns into a single timeline, sorted by date descending
    type TransactionRow =
        | { kind: 'sale'; data: typeof activeInvoices[0] }
        | { kind: 'return'; data: typeof returns[0] };

    const transactionRows: TransactionRow[] = [
        ...filteredInvoices.map(inv => ({ kind: 'sale' as const, data: inv })),
        ...filteredReturns.map(ret => ({ kind: 'return' as const, data: ret })),
    ].sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime());

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
                            value={timeframe === 'yearly' ? filterDate.split('-')[0] : timeframe === 'monthly' ? filterDate.slice(0, 7) : filterDate}
                            onChange={(e) => {
                                let val = e.target.value;
                                if (timeframe === 'yearly') {
                                    const year = val.slice(0, 4);
                                    setFilterDate(year ? `${year}-01-01` : '');
                                    return;
                                }
                                if (timeframe === 'monthly') val = `${val}-01`;
                                setFilterDate(val);
                            }}
                            className="pl-9 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Total Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                    { label: 'Total Sales', value: `Rs. ${totalSales.toLocaleString()}`, icon: TrendingUp, color: 'bg-green-500' },
                    { label: 'Total Cost', value: `Rs. ${totalCost.toLocaleString()}`, icon: DollarSign, color: 'bg-blue-600' },
                    { label: 'Total Profit', value: `Rs. ${totalProfit.toLocaleString()}`, icon: BarChart3, color: 'bg-purple-500' },
                    { label: 'Total Orders', value: totalOrderCount.toString(), icon: ShoppingBag, color: 'bg-orange-500' },
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

            {/* Filtered Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                    { label: 'Filtered Sales', value: `Rs. ${filteredSales.toLocaleString()}`, icon: TrendingUp, color: 'bg-green-500' },
                    { label: 'Filtered Cost', value: `Rs. ${filteredCost.toLocaleString()}`, icon: DollarSign, color: 'bg-blue-600' },
                    { label: 'Filtered Profit', value: `Rs. ${filteredProfit.toLocaleString()}`, icon: BarChart3, color: 'bg-purple-500' },
                    { label: 'Filtered Orders', value: filteredOrderCount.toString(), icon: ShoppingBag, color: 'bg-orange-500' },
                ].map((stat, index) => (
                    <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow border-l-4 border-l-orange-500">
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

            {/* Transactions Table — invoices + returns merged */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-800">
                        {timeframe === 'daily' ? 'Daily' : timeframe === 'monthly' ? 'Monthly' : 'Yearly'} Transactions
                    </h2>
                    <span className="text-sm text-gray-500">{transactionRows.length} results found</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                            <tr>
                                <th className="px-6 py-4 font-bold">ID</th>
                                <th className="px-6 py-4 font-bold">Date</th>
                                <th className="px-6 py-4 font-bold">Customer</th>
                                <th className="px-6 py-4 font-bold text-center">Items</th>
                                <th className="px-6 py-4 font-bold">Payment</th>
                                <th className="px-6 py-4 font-bold text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {transactionRows.map((row) => {
                                if (row.kind === 'sale') {
                                    const inv = row.data;
                                    return (
                                        <tr key={`sale-${inv.id}`} className="hover:bg-gray-50 transition-colors">
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
                                    );
                                } else {
                                    // Return row — show as a red negative entry
                                    const ret = row.data;
                                    return (
                                        <tr key={`return-${ret.id}`} className="bg-red-50/50 hover:bg-red-50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-medium text-orange-600">
                                                <div>{ret.returnNo}</div>
                                                <div className="text-[10px] text-gray-400 font-normal">ref: {ret.invoiceNo}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {new Date(ret.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">{ret.customerName}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 text-center">
                                                {ret.items.reduce((acc, item) => acc + item.qty, 0)}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className="px-2 py-1 rounded text-xs font-bold uppercase bg-orange-100 text-orange-700 flex items-center gap-1 w-fit">
                                                    <RotateCcw className="w-3 h-3" /> return
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-red-600 text-right">
                                                - Rs. {ret.totalRefund.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    );
                                }
                            })}
                            {transactionRows.length === 0 && (
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
