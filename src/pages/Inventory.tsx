import { useState } from 'react';
import { useProducts } from '../context/ProductContext';
import type { Product } from '../types';
import ProductList from '../components/ProductList';
import ProductForm from '../components/ProductForm';
import { Plus, Search, Filter } from 'lucide-react';

const ManagerDashboard = () => {
    const { products, addProduct, updateProduct, deleteProduct } = useProducts();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState('');

    const handleAdd = (data: Omit<Product, 'id'>) => {
        addProduct(data);
        setIsFormOpen(false);
    };

    const handleUpdate = (data: Omit<Product, 'id'>) => {
        if (editingProduct) {
            updateProduct(editingProduct.id, data);
            setEditingProduct(undefined);
            setIsFormOpen(false);
        }
    };

    const handleEditClick = (product: Product) => {
        setEditingProduct(product);
        setIsFormOpen(true);
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.barcode.includes(searchTerm)
    );

    return (
        <div className="p-8 h-full flex flex-col"> {/* Increased padding from p-6 to p-8 */}
            <div className="flex justify-between items-center mb-6 pl-2"> {/* Added pl-2 for extra safety */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Inventory Management</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage your products, stock, and prices.</p>
                </div>
                <button
                    onClick={() => {
                        setEditingProduct(undefined);
                        setIsFormOpen(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Add Product
                </button>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex gap-4">
                <div className="relative flex-1">
                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search products...."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                </div>
                <button className="px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Filter
                </button>
            </div>

            <ProductList
                products={filteredProducts}
                onEdit={handleEditClick}
                onDelete={deleteProduct}
            />

            {isFormOpen && (
                <ProductForm
                    initialData={editingProduct}
                    onSubmit={editingProduct ? handleUpdate : handleAdd}
                    onCancel={() => {
                        setIsFormOpen(false);
                        setEditingProduct(undefined);
                    }}
                />
            )}
        </div>
    );
};

export default ManagerDashboard;
