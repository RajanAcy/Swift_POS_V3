import React, { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Expense } from '../../types';

const Expenses: React.FC = () => {
    const { expenses, suppliers, addExpense, updateExpense, deleteExpense, showToast } = useData();
    const { t } = useLanguage();

    const getToday = () => new Date().toISOString().split('T')[0];
    const emptyExpense: Omit<Expense, 'id'> = { category: '', amount: 0, date: getToday(), description: '', supplierId: '' };
    
    const [formData, setFormData] = useState(emptyExpense);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(firstDayOfMonth);
    const [endDate, setEndDate] = useState(today);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.category || !formData.date || Number(formData.amount) <= 0) {
            showToast(t('Please fill all required fields correctly'), 'error');
            return;
        }
        if (formData.category === 'Supplier Payment' && !formData.supplierId) {
            showToast(t('Please select a supplier for this payment'), 'error');
            return;
        }

        const expenseData = { ...formData, amount: Number(formData.amount) };

        if (editingId) {
            updateExpense({ ...expenseData, id: editingId });
            showToast(t('Expense updated successfully'), 'success');
        } else {
            addExpense(expenseData);
            showToast(t('Expense added successfully'), 'success');
        }
        setEditingId(null);
        setFormData(emptyExpense);
    };
    
    const handleEdit = (expense: Expense) => {
        setEditingId(expense.id);
        setFormData(expense);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = (id: string) => {
        if (window.confirm(t('Are you sure you want to delete this expense?'))) {
            deleteExpense(id);
            showToast(t('Expense deleted successfully'), 'success');
        }
    };
    
    const filteredExpenses = useMemo(() => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
    
        return expenses.filter(e => {
            const searchMatch = e.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                e.description?.toLowerCase().includes(searchTerm.toLowerCase());
            
            const expenseDate = new Date(e.date);
            const dateMatch = expenseDate >= start && expenseDate <= end;
    
            return searchMatch && dateMatch;
        });
    }, [expenses, searchTerm, startDate, endDate]);
        
    const getSupplierName = (supplierId?: string) => {
        if (!supplierId) return '-';
        return suppliers.find(s => s.id === supplierId)?.name || 'Unknown';
    };

    return (
        <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">{t('expense_management')}</h2>

            <div className="bg-white rounded-lg p-6 shadow-md mb-6">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col">
                        <label className="text-sm font-medium mb-1">{t('expense_category')}</label>
                        <select name="category" value={formData.category} onChange={handleInputChange} required className="p-2 border rounded-lg">
                            <option value="">{t('Select Category')}</option>
                            <option value="Supplier Payment">{t('Supplier Payment')}</option>
                            <option value="Rent">{t('Rent')}</option>
                            <option value="Utilities">{t('Utilities')}</option>
                            <option value="Salaries">{t('Salaries')}</option>
                            <option value="Marketing">{t('Marketing')}</option>
                            <option value="Supplies">{t('Supplies')}</option>
                            <option value="Maintenance">{t('Maintenance')}</option>
                            <option value="Other">{t('Other')}</option>
                        </select>
                    </div>
                    {formData.category === 'Supplier Payment' && (
                         <div className="flex flex-col">
                            <label className="text-sm font-medium mb-1">{t('Select Supplier')}</label>
                            <select name="supplierId" value={formData.supplierId} onChange={handleInputChange} required className="p-2 border rounded-lg">
                                <option value="">{t('Select Supplier')}</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    )}
                    <div className="flex flex-col">
                        <label className="text-sm font-medium mb-1">{t('amount_mmk')}</label>
                        <input type="number" name="amount" value={formData.amount} onChange={handleInputChange} required className="p-2 border rounded-lg" />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-sm font-medium mb-1">{t('date')}</label>
                        <input type="date" name="date" value={formData.date} onChange={handleInputChange} required className="p-2 border rounded-lg" />
                    </div>
                     <div className="md:col-span-2 flex flex-col">
                        <label className="text-sm font-medium mb-1">{t('description')}</label>
                        <textarea name="description" value={formData.description || ''} onChange={handleInputChange} rows={3} className="p-2 border rounded-lg" />
                    </div>
                    <div className="flex items-end col-span-1 md:col-span-2 space-x-4">
                        <button type="submit" className="bg-[--primary-color] text-white font-semibold py-2 px-6 rounded-lg">{editingId ? t('Update Expense') : t('save_expense')}</button>
                        <button type="button" onClick={() => { setEditingId(null); setFormData(emptyExpense); }} className="bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-lg">{t('clear_form')}</button>
                    </div>
                </form>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-md">
                 <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                    <h3 className="text-xl font-semibold">{t('expense_list')}</h3>
                    <div className="flex items-center gap-4">
                        <div>
                            <label className="text-sm font-medium mr-2">{t('start_date')}</label>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 border rounded-lg" />
                        </div>
                        <div>
                            <label className="text-sm font-medium mr-2">{t('end_date')}</label>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 border rounded-lg" />
                        </div>
                        <input type="text" placeholder={t('search_expenses')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="p-2 border rounded-lg" />
                    </div>
                </div>
                 <div className="overflow-x-auto">
                    <table className="min-w-full divide-y">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">{t('date')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">{t('category')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">{t('amount_mmk')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">{t('supplier')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">{t('description')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y">
                            {filteredExpenses.map(e => (
                                <tr key={e.id}>
                                    <td className="px-6 py-4">{e.date}</td>
                                    <td className="px-6 py-4">{e.category}</td>
                                    <td className="px-6 py-4">{e.amount}</td>
                                    <td className="px-6 py-4">{getSupplierName(e.supplierId)}</td>
                                    <td className="px-6 py-4">{e.description}</td>
                                    <td className="px-6 py-4">
                                        <button onClick={() => handleEdit(e)} className="text-indigo-600 hover:text-indigo-900 mr-3">{t('Edit')}</button>
                                        <button onClick={() => handleDelete(e.id)} className="text-red-600 hover:text-red-900">{t('Delete')}</button>
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

export default Expenses;
