import React from 'react';
import type { CartItem } from '../types';
import logo from '../assets/logo.png';

interface ReceiptProps {
    cart: CartItem[];
    total: number;
    discount?: number;
    cashierName: string;
    date: string;
    paymentMethod: 'cash' | 'card';
    customerName?: string;
    customerMobile?: string;
    invoiceNo?: string;
    cashReceived?: number;
    balance?: number;
}

export const Receipt = React.forwardRef<HTMLDivElement, ReceiptProps>(({ cart, total, discount = 0, date, paymentMethod, customerName, customerMobile, invoiceNo, cashReceived, balance }, ref) => {
    return (
        <div className="hidden print:block text-sm p-4 w-full" ref={ref}>
            {/* Header Section */}
            <div className="text-center pb-2 mb-2 border-b border-black border-dotted flex flex-col items-center gap-1">
                <img src={logo} alt="Logo" className="w-40 h-auto mb-2" />
                <p className="text-xs font-medium text-black">No. 16, ST. Thomas Road,</p>
                <p className="text-xs font-medium text-black">Matara.</p>
                <p className="font-bold text-black mt-1">070 325 3507</p>
                {invoiceNo && <p className="font-semibold mt-1">INVOICE: {invoiceNo}</p>}
            </div>

            {/* Details Section */}
            <div className="mb-2 text-xs space-y-0.5">
                <div className="flex justify-between">
                    <span className="font-medium text-black">Date: {date}</span>
                </div>
                <div className="flex justify-between">
                    <span className="font-medium text-black">Customer: {(!customerName || customerName === 'Walk-in') ? 'Walk-in Customer' : customerName}</span>
                </div>
                {customerMobile && (
                    <div className="flex justify-between">
                        <span className="font-medium text-black">Mobile: {customerMobile}</span>
                    </div>
                )}
                <div className="flex justify-between">
                    <span className="font-medium text-black">Payment Mode: {paymentMethod === 'cash' ? 'CASH' : 'CARD'}</span>
                </div>
            </div>

            {/* Items Table Section */}
            <div className="mb-2 border-b border-black border-dotted">
                <table className="w-full text-left">
                    <thead className="border-t border-b border-black border-dotted">
                        <tr>
                            <th className="py-2 font-semibold text-black">Item</th>
                            <th className="py-2 text-right font-semibold text-black w-[10mm]">Qty</th>
                            <th className="py-2 text-right font-semibold text-black w-[20mm]">Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cart.map((item, index) => (
                            <tr key={item.id}>
                                <td className={`pt-2 ${index === cart.length - 1 ? 'pb-2' : 'pb-0'} pr-4 font-medium text-black break-words`}>
                                    {item.name}
                                </td>
                                <td className={`pt-2 ${index === cart.length - 1 ? 'pb-2' : 'pb-0'} text-right align-top font-medium text-black w-[10mm]`}>
                                    {item.quantity}
                                </td>
                                <td className={`pt-2 ${index === cart.length - 1 ? 'pb-2' : 'pb-0'} text-right align-top font-medium text-black w-[20mm]`}>
                                    {(item.price * item.quantity).toFixed(2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Totals Section */}
            <div className="space-y-1 mb-2">
                <div className="flex justify-between font-medium text-black">
                    <span>Subtotal:</span>
                    <span>Rs. {total.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                    <div className="flex justify-between font-medium text-black text-xs">
                        <span>Discount ({((discount / total) * 100).toFixed(0)}%):</span>
                        <span>- Rs. {discount.toFixed(2)}</span>
                    </div>
                )}
            </div>

            {/* NET TOTAL - Isolated and Balanced Center */}
            <div className="py-2 border-t border-b border-black border-dotted flex justify-between font-bold text-lg text-black">
                <span>NET TOTAL:</span>
                <span>Rs. {Math.max(0, total - discount).toFixed(2)}</span>
            </div>

            {/* Payment Details (Cash Only) */}
            {paymentMethod === 'cash' && (
                <div className="py-2 mb-3 border-b border-black border-dotted space-y-1 text-xs">
                    <div className="flex justify-between font-medium text-black">
                        <span>Cash Received:</span>
                        <span>Rs. {(cashReceived || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-black">
                        <span>Balance:</span>
                        <span>Rs. {(balance || 0).toFixed(2)}</span>
                    </div>
                </div>
            )}
            {paymentMethod === 'card' && <div className="mb-3"></div>}

            {/* Footer Section */}
            <div className="text-center text-xs space-y-3 pt-1">
                <p className="leading-tight px-4 font-medium text-black">Exchanges accepted within 4 days with receipt. Items must be unused with tags attached.</p>
                <div className="space-y-1">
                    <p className="font-bold uppercase text-[10px] text-black">Thank you for shopping with us!</p>
                    <p className="text-[10px] font-bold uppercase text-black mt-4">POS System By LUXN IT - 074 169 1008</p>
                </div>
            </div>
        </div>
    );
});

Receipt.displayName = 'Receipt';
