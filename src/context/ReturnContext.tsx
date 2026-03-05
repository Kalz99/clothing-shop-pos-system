import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../lib/axios';

export interface ReturnItem {
    productId: string | null;
    productName: string;
    unitPrice: number;
    qty: number;
    lineTotal: number;
}

export interface Return {
    id: string;
    returnNo: string;
    saleId: string;
    invoiceNo: string;
    customerName: string;
    cashierName: string;
    totalRefund: number;
    date: string;
    items: ReturnItem[];
}

interface CreateReturnPayload {
    saleId: string;
    cashierName: string;
    items: {
        productId: string | null;
        productName: string;
        unitPrice: number;
        qty: number;
    }[];
}

interface ReturnContextType {
    returns: Return[];
    fetchReturns: () => Promise<void>;
    createReturn: (data: CreateReturnPayload) => Promise<{ success: boolean; returnNo?: string; totalRefund?: number; message?: string }>;
    getReturnsBySale: (saleId: string) => Promise<Return[]>;
}

const ReturnContext = createContext<ReturnContextType | undefined>(undefined);

export const ReturnProvider = ({ children }: { children: ReactNode }) => {
    const [returns, setReturns] = useState<Return[]>([]);

    useEffect(() => {
        fetchReturns();
    }, []);

    const fetchReturns = async () => {
        try {
            const res = await api.get('/returns');
            setReturns(res.data);
        } catch (err) {
            console.error('Error fetching returns:', err);
        }
    };

    const createReturn = async (data: CreateReturnPayload) => {
        try {
            const res = await api.post('/returns', data);
            await fetchReturns();
            return { success: true, returnNo: res.data.returnNo, totalRefund: res.data.totalRefund };
        } catch (err: any) {
            console.error('Error creating return:', err);
            const message = err.response?.data?.message || err.message || 'Unknown error';
            return { success: false, message };
        }
    };

    const getReturnsBySale = async (saleId: string): Promise<Return[]> => {
        try {
            const res = await api.get(`/returns/by-sale/${saleId}`);
            return res.data;
        } catch (err) {
            console.error('Error fetching returns by sale:', err);
            return [];
        }
    };

    return (
        <ReturnContext.Provider value={{ returns, fetchReturns, createReturn, getReturnsBySale }}>
            {children}
        </ReturnContext.Provider>
    );
};

export const useReturns = () => {
    const context = useContext(ReturnContext);
    if (context === undefined) {
        throw new Error('useReturns must be used within a ReturnProvider');
    }
    return context;
};
