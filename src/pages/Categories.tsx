import { useState } from 'react';
import { useCategories } from '../context/CategoryContext';
import { Plus, Trash2, Edit2, Save, X, Tag } from 'lucide-react';

const Categories = () => {
    const { categories, addCategory, updateCategory, deleteCategory } = useCategories();
    const [isAdding, setIsAdding] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (newCategoryName.trim()) {
            addCategory(newCategoryName);
            setNewCategoryName('');
            setIsAdding(false);
        }
    };

    const startEdit = (category: { id: string, name: string }) => {
        setEditingId(category.id);
        setEditName(category.name);
    };

    const handleUpdate = (id: string) => {
        if (editName.trim()) {
            updateCategory(id, editName);
            setEditingId(null);
        }
    };

    return (
        <div className="p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Tag className="w-6 h-6 text-blue-600" />
                    Categories
                </h1>
                <button
                    onClick={() => setIsAdding(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
                >
                    <Plus className="w-5 h-5" />
                    Add Category
                </button>
            </div>

            {isAdding && (
                <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <form onSubmit={handleAdd} className="flex gap-3">
                        <input
                            type="text"
                            placeholder="Enter category name..."
                            autoFocus
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        />
                        <button
                            type="submit"
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium"
                        >
                            Save
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsAdding(false)}
                            className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200 font-medium"
                        >
                            Cancel
                        </button>
                    </form>
                </div>
            )}

            <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col min-h-0 overflow-hidden">
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Category Name</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {categories.map((category) => (
                                <tr key={category.id} className="hover:bg-gray-50/50">
                                    <td className="px-6 py-4">
                                        {editingId === category.id ? (
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    className="px-3 py-1 border border-gray-200 rounded focus:outline-none focus:border-blue-500"
                                                />
                                                <button onClick={() => handleUpdate(category.id)} className="text-green-600 hover:bg-green-50 p-1 rounded">
                                                    <Save className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => setEditingId(null)} className="text-gray-400 hover:bg-gray-100 p-1 rounded">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="font-medium text-gray-900">{category.name}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => startEdit(category)}
                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => deleteCategory(category.id)}
                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {categories.length === 0 && (
                        <div className="p-8 text-center text-gray-400">
                            No categories found. Add one to get started.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Categories;
