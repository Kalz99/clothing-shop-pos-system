import { useState, useEffect } from 'react';
import { Users, Search, Phone } from 'lucide-react';
import api from '../lib/axios';

interface Customer {
    id: number;
    name: string;
    phone: string;
    email?: string;
    created_at?: string;
}

const Customers = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const fetchCustomers = async () => {
        try {
            setIsLoading(true);
            const { data } = await api.get('/customers');
            setCustomers(data);
        } catch (err) {
            console.error('Error fetching customers:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const filteredCustomers = customers.filter(c =>
    (c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm))
    );

    return (
        <div className="p-6 h-full flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Users className="w-6 h-6 text-blue-600" />
                    Customers
                </h1>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm mb-6 border border-gray-100 flex items-center gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search customers by name or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    />
                </div>
                <div className="text-sm text-gray-500 font-medium px-2">
                    {filteredCustomers.length} Customers found
                </div>
            </div>

            <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col min-h-0 overflow-hidden">
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Customer Name</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm text-center">Phone Number</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={2} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                            <p className="text-gray-500 animate-pulse">Loading customers...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredCustomers.map((customer) => (
                                <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold border border-blue-100">
                                                {customer.name?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900">{customer.name || 'Walk-in Customer'}</div>

                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2 text-gray-600 font-medium">
                                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                                            {customer.phone || 'N/A'}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {!isLoading && filteredCustomers.length === 0 && (
                        <div className="p-20 text-center">
                            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-gray-200">
                                <Users className="w-10 h-10 text-gray-300" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800">No customers found</h3>
                            <p className="text-gray-500 mt-1 max-w-xs mx-auto">We couldn't find any customers matching your search criteria.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Customers;
