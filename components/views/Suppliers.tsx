
import React, { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Supplier } from '../../types';
import Modal from '../shared/Modal';

const Suppliers: React.FC = () => {
    const { suppliers, expenses, purchases, addSupplier, updateSupplier, deleteSupplier, showToast, addExpense } = useData();
    const { t } = useLanguage();
    const { currency } = useData().systemSettings;

    const getToday = () => new Date().toISOString().split('T')[0];
    
    const emptySupplier: Omit<Supplier, 'id'> = { name: '', phone: '', email: '', address: '' };
    const [formData, setFormData] = useState(emptySupplier);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isPaymentHistoryOpen, setPaymentHistoryOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

    const emptyPayment = { supplierId: '', amount: '', date: getToday(), description: ''};
    const [paymentForm, setPaymentForm] = useState(emptyPayment);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePaymentFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setPaymentForm({ ...paymentForm, [e.target.name]: e.target.value });
    };

    const handlePaymentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!paymentForm.supplierId || !paymentForm.amount || Number(paymentForm.amount) <= 0) {
            showToast(t('Please select a supplier and enter a valid amount'), 'error');
            return;
        }
        addExpense({
            category: 'Supplier Payment',
            supplierId: paymentForm.supplierId,
            amount: Number(paymentForm.amount),
            date: paymentForm.date,
            description: paymentForm.description
        });
        showToast(t('Payment recorded successfully'), 'success');
        setPaymentForm(emptyPayment);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) {
            showToast(t('Supplier name is required'), 'error');
            return;
        }

        if (editingId) {
            updateSupplier({ ...formData, id: editingId });
            showToast(t('Supplier updated successfully'), 'success');
        } else {
            addSupplier(formData);
            showToast(t('Supplier added successfully'), 'success');
        }
        setEditingId(null);
        setFormData(emptySupplier);
    };

    const handleEdit = (supplier: Supplier) => {
        setEditingId(supplier.id);
        setFormData(supplier);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = (id: string) => {
        if (window.confirm(t('Are you sure you want to delete this supplier?'))) {
            deleteSupplier(id);
            showToast(t('Supplier deleted successfully'), 'success');
        }
    };
    
    const handleViewPayments = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setPaymentHistoryOpen(true);
    }
    
    const filteredSuppliers = useMemo(() =>
        suppliers.filter(s =>
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.email?.toLowerCase().includes(searchTerm.toLowerCase())
        ), [suppliers, searchTerm]);

    const supplierPayments = useMemo(() => {
        if (!selectedSupplier) return [];
        return expenses
            .filter(e => e.supplierId === selectedSupplier.id)
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [expenses, selectedSupplier]);
    
    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'MMK',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);

    const supplierBalances = useMemo(() => {
        const balances: { [key: string]: { billed: number, paid: number, balance: number } } = {};
        suppliers.forEach(s => {
            const totalBilled = purchases
                .filter(p => p.supplierId === s.id)
                .reduce((sum, p) => sum + p.totalCost, 0);

            const totalPaid = expenses
                .filter(e => e.supplierId === s.id)
                .reduce((sum, e) => sum + e.amount, 0);

            balances[s.id] = {
                billed: totalBilled,
                paid: totalPaid,
                balance: totalBilled - totalPaid,
            };
        });
        return balances;
    }, [suppliers, purchases, expenses]);


    return (
        <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">{t('supplier_management')}</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-lg p-6 shadow-md">
                    <h3 className="text-xl font-semibold mb-4">{editingId ? t('Edit Supplier') : t('Add Supplier')}</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col">
                            <label className="text-sm font-medium mb-1">{t('supplier_name')}</label>
                            <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="p-2 border rounded-lg" />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-medium mb-1">{t('phone_number')}</label>
                            <input type="tel" name="phone" value={formData.phone || ''} onChange={handleInputChange} className="p-2 border rounded-lg" />
                        </div>
                        <div className="flex flex-col md:col-span-2">
                            <label className="text-sm font-medium mb-1">{t('email')}</label>
                            <input type="email" name="email" value={formData.email || ''} onChange={handleInputChange} className="p-2 border rounded-lg" />
                        </div>
                        <div className="flex flex-col md:col-span-2">
                            <label className="text-sm font-medium mb-1">{t('address')}</label>
                            <textarea name="address" value={formData.address || ''} onChange={handleInputChange} rows={2} className="p-2 border rounded-lg" />
                        </div>
                        <div className="flex items-end col-span-1 md:col-span-2 space-x-4">
                            <button type="submit" className="bg-[--primary-color] text-white font-semibold py-2 px-6 rounded-lg">{editingId ? t('Update Supplier') : t('save_supplier')}</button>
                            <button type="button" onClick={() => { setEditingId(null); setFormData(emptySupplier); }} className="bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-lg">{t('clear_form')}</button>
                        </div>
                    </form>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-md">
                    <h3 className="text-xl font-semibold mb-4">{t('supplier_payment_form')}</h3>
                    <form onSubmit={handlePaymentSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="flex flex-col md:col-span-2">
                            <label className="text-sm font-medium mb-1">{t('payment_to')}</label>
                             <select name="supplierId" value={paymentForm.supplierId} onChange={handlePaymentFormChange} required className="p-2 border rounded-lg">
                                 <option value="">{t('Select Supplier')}</option>
                                 {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                             </select>
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-medium mb-1">{t('amount_mmk')}</label>
                            <input type="number" name="amount" value={paymentForm.amount} onChange={handlePaymentFormChange} required className="p-2 border rounded-lg" min="0" />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-medium mb-1">{t('date')}</label>
                            <input type="date" name="date" value={paymentForm.date} onChange={handlePaymentFormChange} required className="p-2 border rounded-lg" />
                        </div>
                        <div className="flex flex-col md:col-span-2">
                            <label className="text-sm font-medium mb-1">{t('notes')}</label>
                            <textarea name="description" value={paymentForm.description} onChange={handlePaymentFormChange} rows={2} className="p-2 border rounded-lg" />
                        </div>
                        <div className="flex items-end md:col-span-2">
                            <button type="submit" className="bg-green-600 text-white font-semibold py-2 px-6 rounded-lg">{t('record_payment')}</button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">{t('supplier_list')}</h3>
                    <input type="text" placeholder={t('search_suppliers')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="p-2 border rounded-lg w-1/2 md:w-1/3" />
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">{t('supplier_name')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">{t('phone_number')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">{t('Total Billed')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">{t('Total Paid')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">{t('Balance')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y">
                            {filteredSuppliers.map(s => (
                                <tr key={s.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">{s.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{s.phone}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(supplierBalances[s.id]?.billed || 0)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(supplierBalances[s.id]?.paid || 0)}</td>
                                    <td className={`px-6 py-4 whitespace-nowrap font-bold ${(supplierBalances[s.id]?.balance || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {formatCurrency(supplierBalances[s.id]?.balance || 0)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button onClick={() => handleViewPayments(s)} className="text-green-600 hover:text-green-900 mr-3">{t('View Payments')}</button>
                                        <button onClick={() => handleEdit(s)} className="text-indigo-600 hover:text-indigo-900 mr-3">{t('Edit')}</button>
                                        <button onClick={() => handleDelete(s.id)} className="text-red-600 hover:text-red-900">{t('Delete')}</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isPaymentHistoryOpen} onClose={() => setPaymentHistoryOpen(false)} title={`${t('Payment History for')} ${selectedSupplier?.name}`}>
                <div className="max-h-96 overflow-y-auto">
                    {supplierPayments.length > 0 ? (
                        <table className="min-w-full divide-y">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium">{t('date')}</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium">{t('amount_mmk')}</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium">{t('description')}</th>
                                </tr>
                            </thead>
                             <tbody className="bg-white divide-y">
                                {supplierPayments.map(p => (
                                    <tr key={p.id}>
                                        <td className="px-4 py-2">{p.date}</td>
                                        <td className="px-4 py-2">{formatCurrency(p.amount)}</td>
                                        <td className="px-4 py-2">{p.description}</td>
                                    </tr>
                                ))}
                             </tbody>
                        </table>
                    ) : (
                        <p className="text-center text-gray-500 py-4">{t('No payments found.')}</p>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default Suppliers;