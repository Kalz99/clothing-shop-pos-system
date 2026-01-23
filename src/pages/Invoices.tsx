import { useState, useRef } from 'react';
import { useInvoices, type Invoice } from '../context/InvoiceContext';
import { useAuth } from '../context/AuthContext';
import { Printer, Search, FileText, Trash2 } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { Receipt } from '../components/Receipt';

const Invoices = () => {
    const { invoices, cancelInvoice } = useInvoices();
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const receiptRef = useRef<HTMLDivElement>(null);

    // Sort invoices by date (newest first)
    const sortedInvoices = [...invoices].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const filteredInvoices = sortedInvoices.filter(inv =>
        inv.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handlePrint = useReactToPrint({
        contentRef: receiptRef,
        onAfterPrint: () => setSelectedInvoice(null),
    });

    const triggerPrint = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        // We need a slight delay to allow the Modal/Hidden div to render with the selected invoice data
        setTimeout(() => {
            handlePrint();
        }, 100);
    };

    const handleCancel = async (invoice: Invoice) => {
        if (!window.confirm(`Are you sure you want to CANCEL and DELETE invoice ${invoice.invoiceNo}? \n\nThis will restore the following items to stock: \n${invoice.items.map(i => `- ${i.name} (Qty: ${i.quantity})`).join('\n')}`)) {
            return;
        }

        const result = await cancelInvoice(invoice.id);
        if (result.success) {
            alert('Invoice cancelled and stock re-balanced successfully.');
        } else {
            alert('Failed to cancel invoice: ' + result.message);
        }
    };


    return (
        <div className="h-full flex flex-col p-6 overflow-hidden">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Invoices</h1>
                    <p className="text-gray-500">View and manage past transactions</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search invoices..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                </div>
            </div>

            <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col min-h-0 overflow-hidden">
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-600">Date</th>
                                <th className="px-6 py-4 font-semibold text-gray-600">Invoice No</th>
                                <th className="px-6 py-4 font-semibold text-gray-600">Customer</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-right">Total</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredInvoices.map((invoice) => (
                                <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-gray-600">
                                        {new Date(invoice.date).toLocaleDateString()}
                                        <span className="text-xs text-gray-400 block">
                                            {new Date(invoice.date).toLocaleTimeString()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-800">
                                        {invoice.invoiceNo}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        <span className="font-medium text-gray-800">
                                            {(!invoice.customerName || invoice.customerName === 'Walk-in') ? 'Walk-in Customer' : invoice.customerName}
                                        </span>
                                        {invoice.customerMobile && (
                                            <span className="text-xs text-gray-400 block mt-0.5">
                                                {invoice.customerMobile}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 font-bold text-gray-800 text-right">
                                        Rs. {invoice.total.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center gap-2">
                                            <button
                                                onClick={() => triggerPrint(invoice)}
                                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                title="Reprint"
                                            >
                                                <Printer className="w-5 h-5" />
                                            </button>
                                            {user?.role === 'manager' && (
                                                <button
                                                    onClick={() => handleCancel(invoice)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Cancel & Delete Invoice"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredInvoices.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p>No invoices found</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Hidden Receipt for Printing */}
            <div className="hidden">
                {selectedInvoice && (
                    <Receipt
                        ref={receiptRef}
                        cart={selectedInvoice.items}
                        total={selectedInvoice.subtotal}
                        discount={selectedInvoice.discount}
                        paymentMethod={selectedInvoice.paymentMethod}
                        customerName={selectedInvoice.customerName}
                        customerMobile={selectedInvoice.customerMobile}
                        cashierName={selectedInvoice.cashierName}
                        date={new Date(selectedInvoice.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        cashReceived={selectedInvoice.cashReceived}
                        balance={selectedInvoice.balance}
                        invoiceNo={selectedInvoice.invoiceNo}
                    />
                )}
            </div>
        </div>
    );
};

export default Invoices;
