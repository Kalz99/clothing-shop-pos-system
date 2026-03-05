import { useState } from 'react';
import { Search, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { useReturns } from '../context/ReturnContext';

const Returns = () => {
    const { returns } = useReturns();
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const filtered = returns.filter(r =>
        r.returnNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleExpand = (id: string) => {
        setExpandedId(prev => prev === id ? null : id);
    };

    return (
        <div className="h-full flex flex-col p-6 overflow-hidden">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Returns</h1>
                    <p className="text-gray-500">All processed item returns</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by return no, invoice, customer..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-72"
                    />
                </div>
            </div>

            <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col min-h-0 overflow-hidden">
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-600">Date</th>
                                <th className="px-6 py-4 font-semibold text-gray-600">Return No</th>
                                <th className="px-6 py-4 font-semibold text-gray-600">Original Invoice</th>
                                <th className="px-6 py-4 font-semibold text-gray-600">Customer</th>
                                <th className="px-6 py-4 font-semibold text-gray-600">Items Returned</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-right">Refund Amount</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-center">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.map((ret) => (
                                <>
                                    <tr key={ret.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-gray-600">
                                            {new Date(ret.date).toLocaleDateString()}
                                            <span className="text-xs text-gray-400 block">
                                                {new Date(ret.date).toLocaleTimeString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-semibold text-orange-600">{ret.returnNo}</span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-blue-600">
                                            {ret.invoiceNo}
                                        </td>
                                        <td className="px-6 py-4 text-gray-700">
                                            {ret.customerName}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {ret.items.reduce((sum, i) => sum + i.qty, 0)} pcs
                                        </td>
                                        <td className="px-6 py-4 font-bold text-red-600 text-right">
                                            - Rs. {ret.totalRefund.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => toggleExpand(ret.id)}
                                                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                                                title="Toggle details"
                                            >
                                                {expandedId === ret.id
                                                    ? <ChevronUp className="w-4 h-4" />
                                                    : <ChevronDown className="w-4 h-4" />}
                                            </button>
                                        </td>
                                    </tr>

                                    {/* Expanded detail row */}
                                    {expandedId === ret.id && (
                                        <tr key={`${ret.id}-detail`} className="bg-orange-50/50">
                                            <td colSpan={7} className="px-8 py-4">
                                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Returned Items</p>
                                                <table className="w-full text-sm max-w-2xl">
                                                    <thead>
                                                        <tr className="text-gray-400">
                                                            <th className="text-left font-semibold pb-1">Item</th>
                                                            <th className="text-right font-semibold pb-1">Qty</th>
                                                            <th className="text-right font-semibold pb-1">Unit Price</th>
                                                            <th className="text-right font-semibold pb-1">Total</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-orange-100">
                                                        {ret.items.map((item, idx) => (
                                                            <tr key={idx}>
                                                                <td className="py-1.5 text-gray-700 font-medium">{item.productName}</td>
                                                                <td className="py-1.5 text-right text-gray-600">{item.qty}</td>
                                                                <td className="py-1.5 text-right text-gray-600">Rs. {item.unitPrice.toLocaleString()}</td>
                                                                <td className="py-1.5 text-right font-bold text-red-600">Rs. {item.lineTotal.toLocaleString()}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))}

                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                                        <RotateCcw className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p>No returns found</p>
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

export default Returns;
