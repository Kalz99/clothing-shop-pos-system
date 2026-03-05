import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useInvoices, type Invoice } from '../context/InvoiceContext';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductContext';
import { useReturns } from '../context/ReturnContext';
import { Printer, Search, FileText, Trash2, RotateCcw } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { Receipt } from '../components/Receipt';
import ConfirmModal from '../components/ConfirmModal';

// Tracks already-returned qty per product for a specific invoice
interface ReturnedQtyMap {
    [productId: string]: number;
}

// Item in the return modal selection
interface ReturnSelection {
    selected: boolean;
    qty: number;
    maxQty: number; // original qty minus already returned
}

const Invoices = () => {
    const { invoices, cancelInvoice } = useInvoices();
    const { user } = useAuth();
    const { fetchProducts } = useProducts();
    const { createReturn, getReturnsBySale } = useReturns();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [invoiceToCancel, setInvoiceToCancel] = useState<Invoice | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const receiptRef = useRef<HTMLDivElement>(null);

    // Invoice View Modal
    const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);

    // Return Modal
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    const [returnSelections, setReturnSelections] = useState<{ [itemIndex: number]: ReturnSelection }>({});
    const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

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
        setTimeout(() => { handlePrint(); }, 100);
    };

    const handleCancelRequest = (invoice: Invoice) => {
        setInvoiceToCancel(invoice);
        setIsConfirmOpen(true);
    };

    const handleConfirmCancel = async () => {
        if (!invoiceToCancel) return;
        const invoice = invoiceToCancel;
        setIsConfirmOpen(false);
        setInvoiceToCancel(null);
        const result = await cancelInvoice(invoice.id);
        if (result.success) {
            await fetchProducts();
            toast.success('Invoice cancelled and stock re-balanced successfully.');
        } else {
            toast.error('Failed to cancel invoice: ' + result.message);
        }
    };

    // ── View Modal ──
    const handleViewInvoice = (invoice: Invoice) => setViewInvoice(invoice);
    const handleCloseViewModal = () => setViewInvoice(null);

    const handlePrintFromModal = () => {
        if (!viewInvoice) return;
        setSelectedInvoice(viewInvoice);
        setTimeout(() => { handlePrint(); }, 100);
    };

    // ── Return Modal ──
    const openReturnModal = async () => {
        if (!viewInvoice) return;

        // Fetch already-returned quantities for this invoice
        const existingReturns = await getReturnsBySale(viewInvoice.id);

        // Build a map of productId -> total qty already returned
        const qtyMap: ReturnedQtyMap = {};
        for (const ret of existingReturns) {
            for (const ri of ret.items) {
                const key = ri.productId ?? `noId-${ri.productName}`;
                qtyMap[key] = (qtyMap[key] || 0) + ri.qty;
            }
        }

        // Initialize selections for each item
        const initialSelections: { [idx: number]: ReturnSelection } = {};
        viewInvoice.items.forEach((item, idx) => {
            const key = item.id ?? `noId-${item.name}`;
            const alreadyReturned = qtyMap[key] || 0;
            const available = item.quantity - alreadyReturned;
            initialSelections[idx] = {
                selected: false,
                qty: available > 0 ? 1 : 0,
                maxQty: available,
            };
        });
        setReturnSelections(initialSelections);
        setIsReturnModalOpen(true);
    };

    const closeReturnModal = () => {
        setIsReturnModalOpen(false);
        setReturnSelections({});
    };

    const toggleItemSelection = (idx: number) => {
        setReturnSelections(prev => ({
            ...prev,
            [idx]: { ...prev[idx], selected: !prev[idx].selected }
        }));
    };

    const updateReturnQty = (idx: number, qty: number) => {
        const max = returnSelections[idx]?.maxQty || 1;
        const clamped = Math.max(1, Math.min(qty, max));
        setReturnSelections(prev => ({
            ...prev,
            [idx]: { ...prev[idx], qty: clamped }
        }));
    };

    const totalRefund = viewInvoice
        ? viewInvoice.items.reduce((sum, item, idx) => {
            const sel = returnSelections[idx];
            if (sel?.selected && sel.maxQty > 0) {
                return sum + item.price * sel.qty;
            }
            return sum;
        }, 0)
        : 0;

    const hasAnySelected = Object.values(returnSelections).some(s => s.selected && s.maxQty > 0);

    const handleConfirmReturn = async () => {
        if (!viewInvoice || !user) return;
        setIsSubmittingReturn(true);

        const itemsToReturn = viewInvoice.items
            .map((item, idx) => ({ item, sel: returnSelections[idx] }))
            .filter(({ sel }) => sel?.selected && sel.maxQty > 0)
            .map(({ item, sel }) => ({
                productId: item.id,
                productName: item.name,
                unitPrice: item.price,
                qty: sel.qty,
            }));

        const result = await createReturn({
            saleId: viewInvoice.id,
            cashierName: user.name,
            items: itemsToReturn,
        });

        setIsSubmittingReturn(false);

        if (result.success) {
            await fetchProducts();
            toast.success(`Return ${result.returnNo} processed. Refund: Rs. ${result.totalRefund?.toLocaleString()}`);
            closeReturnModal();
        } else {
            toast.error('Return failed: ' + result.message);
        }
    };

    // Fetch returns for current view invoice to show "Returned" badges
    const [currentInvoiceReturns, setCurrentInvoiceReturns] = useState<ReturnedQtyMap>({});
    useEffect(() => {
        if (!viewInvoice) { setCurrentInvoiceReturns({}); return; }
        getReturnsBySale(viewInvoice.id).then(returns => {
            const qtyMap: ReturnedQtyMap = {};
            for (const ret of returns) {
                for (const ri of ret.items) {
                    const key = ri.productId ?? `noId-${ri.productName}`;
                    qtyMap[key] = (qtyMap[key] || 0) + ri.qty;
                }
            }
            setCurrentInvoiceReturns(qtyMap);
        });
    }, [viewInvoice]);

    const allItemsFullyReturned = viewInvoice
        ? viewInvoice.items.every(item => {
            const key = item.id ?? `noId-${item.name}`;
            return (currentInvoiceReturns[key] || 0) >= item.quantity;
        })
        : false;

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
                                    <td className="px-6 py-4 font-medium text-gray-800">{invoice.invoiceNo}</td>
                                    <td className="px-6 py-4 text-gray-600">
                                        <span className="font-medium text-gray-800">
                                            {(!invoice.customerName || invoice.customerName === 'Walk-in') ? 'Walk-in Customer' : invoice.customerName}
                                        </span>
                                        {invoice.customerMobile && (
                                            <span className="text-xs text-gray-400 block mt-0.5">{invoice.customerMobile}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 font-bold text-gray-800 text-right">
                                        Rs. {invoice.total.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center gap-2">
                                            {/* View Button */}
                                            <button
                                                onClick={() => handleViewInvoice(invoice)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="View Invoice"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                    <circle cx="12" cy="12" r="3" />
                                                </svg>
                                            </button>
                                            {/* Reprint Button */}
                                            <button
                                                onClick={() => triggerPrint(invoice)}
                                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                title="Reprint"
                                            >
                                                <Printer className="w-5 h-5" />
                                            </button>
                                            {/* Cancel Button (manager only) */}
                                            {user?.role === 'manager' && (
                                                <button
                                                    onClick={() => handleCancelRequest(invoice)}
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

            <ConfirmModal
                isOpen={isConfirmOpen}
                title="Cancel Invoice"
                message={`Are you sure you want to CANCEL invoice ${invoiceToCancel?.invoiceNo}? \n\nThis will restore the following items to stock: \n${invoiceToCancel?.items.map(i => `• ${i.name} (Qty: ${i.quantity})`).join('\n')}`}
                confirmText="Yes, Cancel Invoice"
                cancelText="No, Keep It"
                onConfirm={handleConfirmCancel}
                onCancel={() => setIsConfirmOpen(false)}
                type="danger"
            />

            {/* ── Invoice Detail View Modal ── */}
            {viewInvoice && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={handleCloseViewModal} />

                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
                        {/* Close button */}
                        <button
                            onClick={handleCloseViewModal}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-20 bg-white rounded-full p-1 shadow-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>

                        <div className="p-6 pb-4 overflow-y-auto flex-1">
                            {/* Header */}
                            <div className="flex justify-between items-start mb-5">
                                <h2 className="text-xl font-bold text-gray-800">Invoice Detail</h2>
                                <div className="text-right mr-8">
                                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Date</p>
                                    <p className="text-sm font-medium text-gray-700">{new Date(viewInvoice.date).toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Invoice number */}
                            <div className="mb-5">
                                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-0.5">Invoice Number</p>
                                <p className="text-2xl font-extrabold text-blue-600">{viewInvoice.invoiceNo}</p>
                            </div>

                            {/* Customer */}
                            {viewInvoice.customerName && viewInvoice.customerName !== 'Walk-in' && (
                                <div className="mb-5">
                                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-0.5">Customer</p>
                                    <p className="font-medium text-gray-800">
                                        {viewInvoice.customerName}
                                        {viewInvoice.customerMobile && (
                                            <span className="ml-2 text-sm text-gray-500">{viewInvoice.customerMobile}</span>
                                        )}
                                    </p>
                                </div>
                            )}

                            {/* Items table with returned badges */}
                            <div className="mb-4">
                                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-2">Item Name</p>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-gray-400 text-right">
                                            <th className="text-left font-semibold pb-1"></th>
                                            <th className="font-semibold pb-1">Qty</th>
                                            <th className="font-semibold pb-1">Price</th>
                                            <th className="font-semibold pb-1">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {viewInvoice.items.map((item, idx) => {
                                            const key = item.id ?? `noId-${item.name}`;
                                            const returnedQty = currentInvoiceReturns[key] || 0;
                                            const fullyReturned = returnedQty >= item.quantity;
                                            return (
                                                <tr key={idx}>
                                                    <td className="py-2 pr-4 text-gray-700 font-medium">
                                                        <div>{item.name}</div>
                                                        {returnedQty > 0 && (
                                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${fullyReturned ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                                                                {fullyReturned ? 'Fully Returned' : `Returned ${returnedQty} pc${returnedQty > 1 ? 's' : ''}`}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-2 text-right text-gray-600">{item.quantity.toFixed(2)}</td>
                                                    <td className="py-2 text-right text-gray-600">{item.price.toLocaleString()}</td>
                                                    <td className="py-2 text-right font-bold text-gray-800">{(item.price * item.quantity).toLocaleString()}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Totals */}
                            <div className="border-t border-gray-100 pt-3 space-y-1.5 text-sm">
                                <div className="flex justify-between text-gray-500">
                                    <span>Subtotal</span>
                                    <span>Rs. {viewInvoice.subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-gray-500">
                                    <span>Discount ({viewInvoice.subtotal > 0 ? ((viewInvoice.discount / viewInvoice.subtotal) * 100).toFixed(0) : 0}%)</span>
                                    <span>- Rs. {viewInvoice.discount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between font-extrabold text-blue-600 text-base pt-1">
                                    <span>Grand Total</span>
                                    <span>Rs. {viewInvoice.total.toLocaleString()}</span>
                                </div>
                                {viewInvoice.paymentMethod === 'cash' && (
                                    <>
                                        <div className="flex justify-between text-gray-500 pt-1">
                                            <span>Cash Received</span>
                                            <span>Rs. {(viewInvoice.cashReceived || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-500">
                                            <span>Balance</span>
                                            <span>Rs. {(viewInvoice.balance || 0).toLocaleString()}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Footer actions */}
                        <div className="px-6 pb-6 pt-2 flex flex-col gap-2 border-t border-gray-100 bg-white">
                            {/* Process Return button */}
                            {!allItemsFullyReturned && (
                                <button
                                    onClick={openReturnModal}
                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all active:scale-95 shadow-md shadow-orange-500/30"
                                >
                                    <RotateCcw className="w-5 h-5" />
                                    Process Return
                                </button>
                            )}
                            <button
                                onClick={handlePrintFromModal}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all active:scale-95 shadow-md shadow-blue-500/30"
                            >
                                <Printer className="w-5 h-5" />
                                Print Re-issue
                            </button>
                            <button onClick={handleCloseViewModal} className="w-full text-center py-2 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors">
                                Close Window
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Return Modal ── */}
            {isReturnModalOpen && viewInvoice && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm" onClick={closeReturnModal} />

                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-gray-100">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">Process Return</h2>
                                    <p className="text-sm text-gray-500 mt-0.5">
                                        Invoice: <span className="font-semibold text-blue-600">{viewInvoice.invoiceNo}</span>
                                    </p>
                                </div>
                                <button
                                    onClick={closeReturnModal}
                                    className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Item list */}
                        <div className="px-6 py-4 max-h-80 overflow-y-auto space-y-3">
                            {viewInvoice.items.map((item, idx) => {
                                const sel = returnSelections[idx];
                                if (!sel) return null;
                                const disabled = sel.maxQty === 0;

                                return (
                                    <div
                                        key={idx}
                                        className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${disabled ? 'bg-gray-50 border-gray-100 opacity-50' : sel.selected ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-200 hover:border-gray-300'}`}
                                    >
                                        {/* Checkbox */}
                                        <input
                                            type="checkbox"
                                            disabled={disabled}
                                            checked={sel.selected}
                                            onChange={() => toggleItemSelection(idx)}
                                            className="w-5 h-5 rounded accent-orange-500 cursor-pointer flex-shrink-0"
                                        />

                                        {/* Item info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-800 truncate">{item.name}</p>
                                            <p className="text-xs text-gray-500">
                                                Rs. {item.price.toLocaleString()} / pc
                                                {disabled && <span className="ml-2 text-red-500 font-medium">• All returned</span>}
                                                {!disabled && sel.maxQty < item.quantity && (
                                                    <span className="ml-2 text-orange-500 font-medium">• {item.quantity - sel.maxQty} already returned</span>
                                                )}
                                            </p>
                                        </div>

                                        {/* Qty input */}
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <button
                                                disabled={disabled || !sel.selected}
                                                onClick={() => updateReturnQty(idx, sel.qty - 1)}
                                                className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-gray-700 font-bold flex items-center justify-center transition-colors"
                                            >−</button>
                                            <span className="w-8 text-center font-bold text-gray-800">
                                                {sel.selected ? sel.qty : '—'}
                                            </span>
                                            <button
                                                disabled={disabled || !sel.selected}
                                                onClick={() => updateReturnQty(idx, sel.qty + 1)}
                                                className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-gray-700 font-bold flex items-center justify-center transition-colors"
                                            >+</button>
                                            <span className="text-xs text-gray-400 w-10">max {sel.maxQty}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                            {/* Total refund display */}
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-sm text-gray-600 font-medium">Total Refund</span>
                                <span className="text-2xl font-extrabold text-orange-600">
                                    Rs. {totalRefund.toLocaleString()}
                                </span>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={closeReturnModal}
                                    className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={!hasAnySelected || isSubmittingReturn}
                                    onClick={handleConfirmReturn}
                                    className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold transition-all active:scale-95 shadow-md shadow-orange-500/30"
                                >
                                    {isSubmittingReturn ? 'Processing...' : 'Confirm Return'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Invoices;
