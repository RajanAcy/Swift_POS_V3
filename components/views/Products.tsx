import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Product } from '../../types';
import BarcodeScanner from '../shared/BarcodeScanner';

const Products: React.FC = () => {
    const { products, suppliers, categories, addProduct, updateProduct, deleteProduct, showToast, systemSettings } = useData();
    const { t } = useLanguage();

    const emptyProduct: Omit<Product, 'id'> = {
        name: '', category: '', stock: 0, buyingPrice: 0, sellingPrice: 0,
        image: null, size: '', color: '', supplierId: '', barcode: ''
    };

    const [formData, setFormData] = useState(emptyProduct);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [isScannerOpen, setScannerOpen] = useState(false);

    useEffect(() => {
        if (!editingId) {
            setFormData(emptyProduct);
        }
    }, [editingId]);
    
    const fuzzyMatch = (pattern: string, text: string): boolean => {
        if (!pattern) return true;
        if (!text) return false;
        
        const p = pattern.toLowerCase();
        const t = text.toLowerCase();
        let pIdx = 0;
        let tIdx = 0;

        while (pIdx < p.length && tIdx < t.length) {
            if (p[pIdx] === t[tIdx]) {
                pIdx++;
            }
            tIdx++;
        }

        return pIdx === p.length;
    };

    const handleCategoryToggle = (category: string) => {
        setSelectedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, image: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.category) {
            showToast(t('Please fill in name and category'), 'error');
            return;
        }
        if (Number(formData.sellingPrice) <= Number(formData.buyingPrice)) {
            showToast(t('Selling price must be greater than buying price'), 'error');
            return;
        }
        
        const productData = {
            ...formData,
            stock: Number(formData.stock),
            buyingPrice: Number(formData.buyingPrice),
            sellingPrice: Number(formData.sellingPrice)
        };

        if (editingId) {
            updateProduct({ ...productData, id: editingId });
            showToast(t('Product updated successfully'), 'success');
        } else {
            addProduct(productData);
            showToast(t('Product added successfully'), 'success');
        }
        setEditingId(null);
        setFormData(emptyProduct);
    };

    const handleEdit = (product: Product) => {
        setEditingId(product.id);
        setFormData(product);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = (id: string) => {
        if (window.confirm(t('Are you sure you want to delete this product?'))) {
            deleteProduct(id);
            showToast(t('Product deleted successfully'), 'success');
        }
    };

    const handleClear = () => {
        setEditingId(null);
        setFormData(emptyProduct);
    };

    const onBarcodeDetected = (code: string) => {
        showToast(`${t('barcode_detected')}: ${code}`, 'success');
        setScannerOpen(false);
        setFormData(prev => ({ ...prev, barcode: code }));
        setSearchTerm(code);
        const product = products.find(p => p.barcode === code);
        if (product) {
            handleEdit(product);
            showToast(t('product_found_and_loaded'), 'info');
        }
    };

    const filteredProducts = products.filter(p => {
        const searchMatch = fuzzyMatch(searchTerm, p.name) ||
            p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.barcode?.toLowerCase().includes(searchTerm.toLowerCase());
        const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(p.category);
        return searchMatch && categoryMatch;
    });

    return (
        <div>
            <BarcodeScanner
                isOpen={isScannerOpen}
                onClose={() => setScannerOpen(false)}
                onDetected={onBarcodeDetected}
            />
            <h2 className="text-3xl font-bold text-gray-900 mb-6">{t('product_management')}</h2>

            <div className="bg-white rounded-lg p-6 shadow-md mb-6">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="flex flex-col">
                        <label className="text-sm font-medium mb-1">{t('product_name')}</label>
                        <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="p-2 border rounded-lg" />
                    </div>
                     <div className="flex flex-col">
                        <label className="text-sm font-medium mb-1">{t('product_image')}</label>
                        <input type="file" accept="image/*" onChange={handleFileChange} className="p-1 border rounded-lg" />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-sm font-medium mb-1">{t('category')}</label>
                        <select name="category" value={formData.category} onChange={handleInputChange} required className="p-2 border rounded-lg">
                            <option value="">{t('Select Category')}</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        {categories.length === 0 && <p className="text-xs text-gray-500 mt-1">{t('Go to Settings to add categories.')}</p>}
                    </div>
                    <div className="flex flex-col">
                        <label className="text-sm font-medium mb-1">{t('stock')}</label>
                        <input type="number" name="stock" min="0" value={formData.stock} onChange={handleInputChange} required className="p-2 border rounded-lg" />
                    </div>
                     <div className="flex flex-col">
                        <label className="text-sm font-medium mb-1">{t('buying_price')} ({systemSettings.currency})</label>
                        <input type="number" name="buyingPrice" min="0" value={formData.buyingPrice} onChange={handleInputChange} required className="p-2 border rounded-lg" />
                    </div>
                     <div className="flex flex-col">
                        <label className="text-sm font-medium mb-1">{t('selling_price')} ({systemSettings.currency})</label>
                        <input type="number" name="sellingPrice" min="0" value={formData.sellingPrice} onChange={handleInputChange} required className="p-2 border rounded-lg" />
                    </div>
                     <div className="flex flex-col">
                        <label className="text-sm font-medium mb-1">{t('size')}</label>
                        <input type="text" name="size" value={formData.size || ''} onChange={handleInputChange} className="p-2 border rounded-lg" />
                    </div>
                     <div className="flex flex-col">
                        <label className="text-sm font-medium mb-1">{t('color')}</label>
                        <input type="text" name="color" value={formData.color || ''} onChange={handleInputChange} className="p-2 border rounded-lg" />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-sm font-medium mb-1">{t('supplier')}</label>
                        <select name="supplierId" value={formData.supplierId || ''} onChange={handleInputChange} className="p-2 border rounded-lg">
                            <option value="">{t('Select Supplier')}</option>
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                     <div className="flex flex-col">
                        <label className="text-sm font-medium mb-1">{t('barcode')}</label>
                        <div className="flex items-center space-x-2">
                            <input type="text" name="barcode" value={formData.barcode || ''} onChange={handleInputChange} className="p-2 border rounded-lg flex-grow" />
                            <button type="button" onClick={() => setScannerOpen(true)} className="bg-blue-500 text-white p-2.5 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" aria-label={t('scan_barcode_title')}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 14a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 14a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="flex items-end col-span-1 md:col-span-2 lg:col-span-3 space-x-4">
                        <button type="submit" className="bg-[--primary-color] text-white font-semibold py-2 px-6 rounded-lg">{editingId ? t('Update Product') : t('save_product')}</button>
                        <button type="button" onClick={handleClear} className="bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-lg">{t('clear_form')}</button>
                    </div>
                </form>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">{t('product_list')}</h3>
                    <input type="text" placeholder={t('search_products')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="p-2 border rounded-lg w-1/2 md:w-1/3" />
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                    <button onClick={() => setSelectedCategories([])} className={`px-3 py-1 text-sm rounded-full border ${selectedCategories.length === 0 ? 'bg-[--primary-color] text-white' : 'bg-gray-100'}`}>{t('all_categories')}</button>
                    {categories.map(c => (
                        <button key={c} onClick={() => handleCategoryToggle(c)} className={`px-3 py-1 text-sm rounded-full border ${selectedCategories.includes(c) ? 'bg-[--primary-color] text-white' : 'bg-gray-100'}`}>{c}</button>
                    ))}
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">{t('product')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">{t('category')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">{t('stock')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">{t('buying_price')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">{t('selling_price')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y">
                            {filteredProducts.map(p => (
                                <tr key={p.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            {p.image && <img src={p.image} alt={p.name} className="h-10 w-10 rounded-full object-cover mr-3"/>}
                                            <div>
                                                <div className="font-medium">{p.name}</div>
                                                <div className="text-sm text-gray-500">{p.barcode}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">{p.category}</td>
                                    <td className={`px-6 py-4 ${p.stock < 10 ? 'text-red-600 font-bold' : ''}`}>{p.stock}</td>
                                    <td className="px-6 py-4">{p.buyingPrice}</td>
                                    <td className="px-6 py-4">{p.sellingPrice}</td>
                                    <td className="px-6 py-4">
                                        <button onClick={() => handleEdit(p)} className="text-indigo-600 hover:text-indigo-900 mr-3">{t('Edit')}</button>
                                        <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-900">{t('Delete')}</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Products;
