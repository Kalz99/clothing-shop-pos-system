import { useState, useEffect, useRef } from 'react';
import { useProducts } from '../context/ProductContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useInvoices } from '../context/InvoiceContext';
import { Search, ShoppingCart, Plus, Minus, Printer, Shirt } from 'lucide-react';
import { Receipt } from '../components/Receipt';
import { useReactToPrint } from 'react-to-print';
import type { Invoice } from '../context/InvoiceContext';
import api from '../lib/axios';

const Billing = () => {
    const { products, fetchProducts } = useProducts();
    const { cart, addToCart, updateQuantity, clearCart, total } = useCart();
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [discountPercentage, setDiscountPercentage] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
    const [customerName, setCustomerName] = useState('');
    const [customerMobile, setCustomerMobile] = useState('');
    const [customerSuggestions, setCustomerSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [cashReceived, setCashReceived] = useState<number>(0);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            // Auto-focus search box if user starts typing while not in an input
            const isInput = (document.activeElement?.tagName === 'INPUT' ||
                document.activeElement?.tagName === 'TEXTAREA');

            if (searchInputRef.current && !isInput && !e.ctrlKey && !e.altKey && !e.metaKey && e.key.length === 1) {
                searchInputRef.current.focus();
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, []);

    useEffect(() => {
        const searchCustomer = async () => {
            const query = customerName || customerMobile;
            if (query.length < 2) {
                setCustomerSuggestions([]);
                setShowSuggestions(false);
                return;
            }

            try {
                const { data } = await api.get(`/customers/search?q=${query}`);
                setCustomerSuggestions(data);
                setShowSuggestions(data.length > 0);
            } catch (err) {
                console.error('Error searching customers:', err);
            }
        };

        const timer = setTimeout(searchCustomer, 300);
        return () => clearTimeout(timer);
    }, [customerName, customerMobile]);

    const selectCustomer = (customer: any) => {
        setCustomerName(customer.name || '');
        setCustomerMobile(customer.phone || '');
        setCustomerSuggestions([]);
        setShowSuggestions(false);
    };

    const { addInvoice } = useInvoices();

    // Calculate totals
    const discountAmount = (total * discountPercentage) / 100;
    const finalTotal = Math.max(0, total - discountAmount);
    const balance = cashReceived > 0 ? cashReceived - finalTotal : 0;

    const receiptRef = useRef<HTMLDivElement>(null);
    const [printingInvoice, setPrintingInvoice] = useState<Invoice | null>(null);

    const handlePrint = useReactToPrint({
        contentRef: receiptRef,
        pageStyle: `
            @page {
                size: 80mm auto;
                margin: 0;
            }
            @media print {
                body {
                    margin: 0;
                    padding: 0;
                }
            }
        `,
        onAfterPrint: () => {
            clearCart();
            setCustomerName('');
            setCustomerMobile('');
            setDiscountPercentage(0);
            setCashReceived(0);
            setPrintingInvoice(null);
            // Auto-focus search box for next customer
            setTimeout(() => searchInputRef.current?.focus(), 100);
        },
    });

    const handleCheckout = async () => {
        if (cart.length === 0) return;

        const newInvoice = await addInvoice({
            invoiceNo: '', // Backend generates this
            customerName: customerName,
            customerMobile: customerMobile,
            items: [...cart],
            subtotal: total,
            discount: discountAmount,
            total: finalTotal,
            paymentMethod,
            cashierName: user?.name || 'Cashier',
            cashReceived: paymentMethod === 'cash' ? cashReceived : 0,
            balance: paymentMethod === 'cash' ? balance : 0
        });

        if (newInvoice) {
            await fetchProducts(); // Refresh stock levels after successful sale
            setPrintingInvoice(newInvoice);
            // Allow render cycle to complete for hidden receipt
            setTimeout(() => {
                handlePrint();
            }, 100);
        }
    };

    // Filter products
    const categories = ['all', ...new Set(products.map(p => p.category).filter((c): c is string => typeof c === 'string'))];
    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.barcode.includes(searchTerm);
        const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });



    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Note: Top Header is removed as it resides in Layout.tsx now */}

            <div className="flex-1 flex overflow-hidden">
                {/* Left Side: Product Grid */}
                <div className="flex-1 flex flex-col p-6 min-w-0">
                    {/* Search & Filter */}
                    <div className="bg-white p-4 rounded-xl shadow-sm mb-6 space-y-4">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                const product = products.find(p => p.barcode === searchTerm);
                                if (product) {
                                    if (product.stock > 0) {
                                        addToCart(product);
                                        setSearchTerm('');
                                    } else {
                                        alert('Item is out of stock');
                                        setSearchTerm('');
                                    }
                                } else if (searchTerm.trim()) {
                                    alert('Item is missing on the system');
                                    setSearchTerm('');
                                }
                            }}
                            className="relative"
                        >
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Scan barcode or search products..."
                                autoFocus
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none text-lg"
                            />
                        </form>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === cat
                                        ? 'bg-gray-800 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Grid */}
                    <div className="flex-1 overflow-y-auto pr-2">
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredProducts.map(product => (
                                <button
                                    key={product.id}
                                    onClick={() => product.stock > 0 && addToCart(product)}
                                    disabled={product.stock <= 0}
                                    className={`bg-white p-4 rounded-xl shadow-sm transition-all text-left flex flex-col group border border-transparent relative overflow-hidden ${product.stock > 0
                                        ? 'hover:shadow-md hover:border-blue-500'
                                        : 'opacity-75 cursor-not-allowed grayscale-[0.5]'
                                        }`}
                                >
                                    <div className={`absolute top-0 right-0 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg transition-opacity ${product.stock > 0
                                        ? 'bg-blue-500 opacity-0 group-hover:opacity-100'
                                        : 'bg-red-500 opacity-100'
                                        }`}>
                                        {product.stock > 0 ? 'ADD' : 'OUT OF STOCK'}
                                    </div>
                                    <div className="bg-gray-50 w-12 h-12 rounded-lg mb-3 flex items-center justify-center">
                                        <Shirt className={`w-6 h-6 ${product.stock > 0 ? 'text-gray-400' : 'text-red-300'}`} />
                                    </div>
                                    <h3 className={`font-semibold truncate w-full mb-1 ${product.stock > 0 ? 'text-gray-800' : 'text-gray-500'}`}>{product.name}</h3>
                                    <p className="text-xs text-gray-500 mb-2 truncate">{product.barcode}</p>
                                    <div className="mt-auto flex justify-between items-center w-full">
                                        <span className={`font-bold ${product.stock > 0 ? 'text-blue-600' : 'text-gray-400'}`}>Rs. {product.price.toFixed(2)}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {product.stock} left
                                        </span>
                                    </div>
                                </button>
                            ))}
                            {filteredProducts.length === 0 && (
                                <div className="col-span-full text-center py-20 text-gray-400">
                                    <Shirt className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <p>No products found</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Side: Cart */}
                <div className="w-96 bg-white shadow-xl flex flex-col border-l border-gray-100 z-20">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
                            Current Order
                            <span className="bg-blue-100 text-blue-700 text-sm px-2 py-0.5 rounded-full">
                                {cart.reduce((acc, item) => acc + item.quantity, 0)}
                            </span>
                        </h2>
                        <div className="flex gap-3 relative">
                            <input
                                type="text"
                                placeholder="Customer Name"
                                value={customerName}
                                onChange={(e) => {
                                    setCustomerName(e.target.value);
                                    if (e.target.value === '') setCustomerMobile(''); // Logic to clear both if name cleared?
                                }}
                                className="w-0 flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                            <input
                                type="text"
                                placeholder="Mobile"
                                value={customerMobile}
                                onChange={(e) => setCustomerMobile(e.target.value)}
                                className="w-0 flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />

                            {showSuggestions && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                                    {customerSuggestions.map((cust) => (
                                        <button
                                            key={cust.id}
                                            onClick={() => selectCustomer(cust)}
                                            className="w-full px-4 py-2 text-left hover:bg-blue-50 flex flex-col transition-colors border-b border-gray-50 last:border-b-0"
                                        >
                                            <span className="font-semibold text-gray-800">{cust.name || 'No Name'}</span>
                                            <span className="text-xs text-gray-500">{cust.phone || 'No Phone'}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {cart.map(item => (
                            <div key={item.id} className="flex gap-4 p-3 bg-gray-50 rounded-xl group hover:bg-blue-50/50 transition-colors">
                                <div className="flex-1">
                                    <h4 className="font-medium text-gray-800">{item.name}</h4>
                                    <p className="text-sm text-gray-500">Rs. {item.price.toFixed(2)} each</p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm p-1">
                                        <button
                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                            className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600"
                                        >
                                            <Minus className="w-3 h-3" />
                                        </button>
                                        <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                                        <button
                                            onClick={() => addToCart(item)}
                                            className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600"
                                        >
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <span className="font-bold text-gray-800">Rs. {(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            </div>
                        ))}
                        {cart.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                                <ShoppingCart className="w-16 h-16 mb-4" />
                                <p>Cart is empty</p>
                            </div>
                        )}
                    </div>

                    <div className="p-6 bg-gray-50 border-t border-gray-200">
                        <div className="space-y-2 mb-6">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span>Rs. {total.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-gray-600">
                                <span>Discount %</span>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={discountPercentage}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value) || 0;
                                            setDiscountPercentage(Math.min(100, Math.max(0, val)));
                                        }}
                                        className="w-16 px-2 py-1 text-right border border-gray-200 rounded focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                                    />
                                    <span className="text-gray-400">%</span>
                                </div>
                            </div>

                            {discountPercentage > 0 && (
                                <div className="flex justify-between text-red-600 text-sm">
                                    <span>Discount Amount</span>
                                    <span>- Rs. {discountAmount.toFixed(2)}</span>
                                </div>
                            )}

                            <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-200">
                                <span>Total</span>
                                <span>Rs. {finalTotal.toFixed(2)}</span>
                            </div>

                        </div>

                        <div className="flex gap-3 mb-4">
                            <button
                                onClick={() => setPaymentMethod('cash')}
                                className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border transition-all ${paymentMethod === 'cash'
                                    ? 'bg-green-600 text-white border-green-600 shadow-md'
                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                <span className="text-lg">💵</span>
                                Cash
                            </button>
                            <button
                                onClick={() => {
                                    setPaymentMethod('card');
                                    setCashReceived(0);
                                }}
                                className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border transition-all ${paymentMethod === 'card'
                                    ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                <span className="text-lg">💳</span>
                                Card
                            </button>
                        </div>

                        {paymentMethod === 'cash' && (
                            <div className="space-y-2 mb-4 pt-4 border-t border-gray-100">
                                <div className="flex justify-between items-center text-gray-600">
                                    <span>Cash Received</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400">Rs.</span>
                                        <input
                                            type="number"
                                            min="0"
                                            value={cashReceived || ''}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value) || 0;
                                                setCashReceived(val);
                                            }}
                                            className="w-24 px-2 py-1 text-right border border-gray-200 rounded focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Balance</span>
                                    <span className={`font-bold ${balance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        Rs. {balance.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => handleCheckout()}
                            disabled={cart.length === 0}
                            className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            <Printer className="w-5 h-5" />
                            Checkout & Print
                        </button>
                    </div>
                </div>
            </div>

            {/* Hidden Receipt for Printing */}
            <div className="hidden">
                {printingInvoice && (
                    <Receipt
                        ref={receiptRef}
                        cart={printingInvoice.items}
                        total={printingInvoice.subtotal}
                        discount={printingInvoice.discount}
                        paymentMethod={printingInvoice.paymentMethod}
                        customerName={printingInvoice.customerName}
                        customerMobile={printingInvoice.customerMobile}
                        cashierName={printingInvoice.cashierName}
                        date={new Date(printingInvoice.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        invoiceNo={printingInvoice.invoiceNo}
                        cashReceived={printingInvoice.cashReceived}
                        balance={printingInvoice.balance}
                    />
                )}
            </div>
        </div>
    );
};

export default Billing;
