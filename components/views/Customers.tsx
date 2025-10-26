import React, { useState, useMemo, useRef } from 'react';
import { useData } from '../../contexts/DataContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Customer } from '../../types';

const Customers: React.FC = () => {
    const { customers, categories, sales, customerPayments, addCustomer, updateCustomer, deleteCustomer, showToast, addCustomerPayment, systemSettings } = useData();
    const { t } = useLanguage();

    const emptyCustomer: Omit<Customer, 'id'> = { name: '', phone: '', email: '', address: '', activationDate: '', interestCategories: [] };
    const getToday = () => new Date().toISOString().split('T')[0];

    const [formData, setFormData] = useState(emptyCustomer);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const emptyPayment = { customerId: '', amount: '', date: getToday(), notes: '' };
    const [paymentForm, setPaymentForm] = useState(emptyPayment);
    const paymentFormRef = useRef<HTMLDivElement>(null);

    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: systemSettings.currency || 'MMK',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = e.target;
        setFormData(prev => {
            const interests = prev.interestCategories || [];
            if (checked) {
                return { ...prev, interestCategories: [...interests, value] };
            } else {
                return { ...prev, interestCategories: interests.filter(c => c !== value) };
            }
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) {
            showToast(t('Customer name is required'), 'error');
            return;
        }

        if (editingId) {
            updateCustomer({ ...formData, id: editingId });
            showToast(t('Customer updated successfully'), 'success');
        } else {
            addCustomer(formData);
            showToast(t('Customer added successfully'), 'success');
        }
        setEditingId(null);
        setFormData(emptyCustomer);
    };

    const handleEdit = (customer: Customer) => {
        setEditingId(customer.id);
        setFormData(customer);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = (id: string) => {
        if (window.confirm(t('Are you sure you want to delete this customer?'))) {
            deleteCustomer(id);
            showToast(t('Customer deleted successfully'), 'success');
        }
    };
    
    const handleRecordPaymentClick = (customer: Customer) => {
        setPaymentForm({ ...emptyPayment, customerId: customer.id });
        paymentFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const handlePaymentFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setPaymentForm({ ...paymentForm, [e.target.name]: e.target.value });
    };

    const handlePaymentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!paymentForm.customerId || !paymentForm.amount || Number(paymentForm.amount) <= 0) {
            showToast(t('Please select a customer and enter a valid amount'), 'error');
            return;
        }
        addCustomerPayment({
            customerId: paymentForm.customerId,
            amount: Number(paymentForm.amount),
            date: paymentForm.date,
            notes: paymentForm.notes
        });
        showToast(t('Payment recorded successfully'), 'success');
        setPaymentForm(emptyPayment);
    };
    
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

    const filteredCustomers = useMemo(() =>
        customers.filter(c =>
            fuzzyMatch(searchTerm, c.name) ||
            c.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.email?.toLowerCase().includes(searchTerm.toLowerCase())
        ), [customers, searchTerm]);
    
    const customerBalances = useMemo(() => {
        const balances: { [key: string]: { credit: number, paid: number, balance: number } } = {};
        customers.forEach(c => {
            const totalCredit = sales
                .filter(s => s.customerId === c.id && s.paymentMethod === 'credit')
                .reduce((sum, s) => sum + s.total, 0);
            const totalPaid = customerPayments
                .filter(p => p.customerId === c.id)
                .reduce((sum, p) => sum + p.amount, 0);
            balances[c.id] = {
                credit: totalCredit,
                paid: totalPaid,
                balance: totalCredit - totalPaid,
            };
        });
        return balances;
    }, [customers, sales, customerPayments]);

    return (
        <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">{t('customer_management')}</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                 <div className="bg-white rounded-lg p-6 shadow-md">
                    <h3 className="text-xl font-semibold mb-4">{editingId ? t('Edit Customer') : t('Add Customer')}</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium mb-1 block">{t('customer_name')}</label>
                                <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="p-2 border rounded-lg w-full" />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">{t('phone_number')}</label>
                                <input type="tel" name="phone" value={formData.phone || ''} onChange={handleInputChange} className="p-2 border rounded-lg w-full" />
                            </div>
                             <div>
                                <label className="text-sm font-medium mb-1 block">{t('email')}</label>
                                <input type="email" name="email" value={formData.email || ''} onChange={handleInputChange} className="p-2 border rounded-lg w-full" />
                            </div>
                             <div>
                                <label className="text-sm font-medium mb-1 block">{t('date')}</label>
                                <input type="date" name="activationDate" value={formData.activationDate || ''} onChange={handleInputChange} className="p-2 border rounded-lg w-full" />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">{t('address')}</label>
                            <textarea name="address" value={formData.address || ''} onChange={handleInputChange} rows={2} className="p-2 border rounded-lg w-full" />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">{t('Interest Categories')}</label>
                            <div className="p-2 border rounded-lg h-24 overflow-y-auto grid grid-cols-2">
                                {categories.map(c => (
                                    <label key={c} className="flex items-center space-x-2">
                                        <input type="checkbox" value={c} checked={formData.interestCategories?.includes(c)} onChange={handleCategoryChange}/>
                                        <span>{c}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-end space-x-4">
                            <button type="submit" className="bg-[--primary-color] text-white font-semibold py-2 px-6 rounded-lg">{editingId ? t('Update Customer') : t('save_customer')}</button>
                            <button type="button" onClick={() => { setEditingId(null); setFormData(emptyCustomer); }} className="bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-lg">{t('clear_form')}</button>
                        </div>
                    </form>
                </div>
                <div ref={paymentFormRef} className="bg-white rounded-lg p-6 shadow-md">
                    <h3 className="text-xl font-semibold mb-4">{t('record_customer_payment')}</h3>
                    <form onSubmit={handlePaymentSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium mb-1 block">{t('customer')}</label>
                            <select name="customerId" value={paymentForm.customerId} onChange={handlePaymentFormChange} required className="p-2 border rounded-lg w-full">
                                <option value="">{t('Select Customer')}</option>
                                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">{t('amount_mmk')}</label>
                            <input 
                                type="number" 
                                name="amount"
                                value={paymentForm.amount}
                                onChange={handlePaymentFormChange}
                                required 
                                className="p-2 border rounded-lg w-full" 
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">{t('date')}</label>
                            <input 
                                type="date"
                                name="date"
                                value={paymentForm.date}
                                onChange={handlePaymentFormChange}
                                required
                                className="p-2 border rounded-lg w-full"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">{t('notes')}</label>
                            <textarea 
                                name="notes"
                                value={paymentForm.notes}
                                onChange={handlePaymentFormChange}
                                rows={3}
                                className="p-2 border rounded-lg w-full"
                            />
                        </div>
                        <div className="flex justify-end gap-4">
                            <button type="submit" className="bg-green-600 text-white font-semibold py-2 px-4 rounded-lg">{t('add_payment')}</button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">{t('customer_list')}</h3>
                    <input type="text" placeholder={t('search_customers')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="p-2 border rounded-lg w-1/2 md:w-1/3" />
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">{t('customer_name')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">{t('phone_number')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">{t('total_credit')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">{t('total_paid')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">{t('balance')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y">
                            {filteredCustomers.map(c => {
                                const balanceInfo = customerBalances[c.id] || { credit: 0, paid: 0, balance: 0 };
                                return (
                                <tr key={c.id}>
                                    <td className="px-6 py-4">{c.name}</td>
                                    <td className="px-6 py-4">{c.phone}</td>
                                    <td className="px-6 py-4">{formatCurrency(balanceInfo.credit)}</td>
                                    <td className="px-6 py-4">{formatCurrency(balanceInfo.paid)}</td>
                                    <td className={`px-6 py-4 font-bold ${balanceInfo.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(balanceInfo.balance)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button onClick={() => handleRecordPaymentClick(c)} className="text-green-600 hover:text-green-900 mr-3">{t('record_payment')}</button>
                                        <button onClick={() => handleEdit(c)} className="text-indigo-600 hover:text-indigo-900 mr-3">{t('Edit')}</button>
                                        <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:text-red-900">{t('Delete')}</button>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Customers;
