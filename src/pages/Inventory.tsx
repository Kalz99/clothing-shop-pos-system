import { useState } from 'react';
import toast from 'react-hot-toast';
import { useProducts } from '../context/ProductContext';
import type { Product } from '../types';
import ProductList from '../components/ProductList';
import ProductForm from '../components/ProductForm';
import { Plus, Search, Filter } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

const ManagerDashboard = () => {
    const { products, addProduct, updateProduct, deleteProduct } = useProducts();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const handleAdd = async (data: Omit<Product, 'id'>) => {
        try {
            await addProduct(data);
            toast.success(`Product "${data.name}" added successfully`);
            setIsFormOpen(false);
        } catch (err: any) {
            const message = err.response?.data?.message || 'Failed to add product';
            toast.error(message);
        }
    };

    const handleUpdate = async (data: Omit<Product, 'id'>) => {
        if (editingProduct) {
            try {
                await updateProduct(editingProduct.id, data);
                toast.success(`Product "${data.name}" updated successfully`);
                setEditingProduct(undefined);
                setIsFormOpen(false);
            } catch (err: any) {
                const message = err.response?.data?.message || 'Failed to update product';
                toast.error(message);
            }
        }
    };

    const handleEditClick = (product: Product) => {
        setEditingProduct(product);
        setIsFormOpen(true);
    };

    const handleDeleteRequest = (product: Product) => {
        setProductToDelete(product);
        setIsConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (productToDelete) {
            await deleteProduct(productToDelete.id);
            toast.success(`Product "${productToDelete.name}" removed`);
            setIsConfirmOpen(false);
            setProductToDelete(null);
        }
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
                onDelete={handleDeleteRequest}
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

            <ConfirmModal
                isOpen={isConfirmOpen}
                title="Delete Product"
                message={`Are you sure you want to delete "${productToDelete?.name}"? \n\nThis will remove it from the inventory while keeping historical records.`}
                confirmText="Delete Product"
                cancelText="Keep Product"
                onConfirm={handleConfirmDelete}
                onCancel={() => setIsConfirmOpen(false)}
                type="danger"
            />
        </div>
    );
};

export default ManagerDashboard;
