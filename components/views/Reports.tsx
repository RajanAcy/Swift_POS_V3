
import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { useLanguage } from '../../contexts/LanguageContext';
import Modal from '../shared/Modal';
import { Expense } from '../../types';

type ReportType = 'sales' | 'inventory' | 'profit' | 'expenses';

interface ReportData {
    title: string;
    columns: { Header: string, accessor: string }[];
    data: any[];
}

const Reports: React.FC = () => {
    const { sales, products, expenses, suppliers, deleteSale, deleteExpense, updateExpense, showToast } = useData();
    const { t } = useLanguage();
    const { currency } = useData().systemSettings;
    
    const [reportType, setReportType] = useState<ReportType>('sales');
    const [startDate, setStartDate] = useState(new Date(new Date().setDate(1)).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [reportData, setReportData] = useState<ReportData | null>(null);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);

    useEffect(() => {
        if (!isEditModalOpen) {
            setExpenseToEdit(null);
        }
    }, [isEditModalOpen]);

    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'MMK',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);

    const generateReport = () => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const filteredSales = sales.filter(s => {
            const saleDate = new Date(s.date);
            return saleDate >= start && saleDate <= end;
        });

        const filteredExpenses = expenses.filter(e => {
            const expenseDate = new Date(e.date);
            return expenseDate >= start && expenseDate <= end;
        });

        let generated: ReportData | null = null;
        const dateRange = `${startDate} ${t('to')} ${endDate}`;

        switch (reportType) {
            case 'sales':
                generated = {
                    title: `${t('sales_report')} (${dateRange})`,
                    columns: [
                        { Header: t('date'), accessor: 'date' },
                        { Header: t('time'), accessor: 'time' },
                        { Header: t('items'), accessor: 'items' },
                        { Header: t('total'), accessor: 'total' },
                        { Header: t('profit'), accessor: 'profit' },
                        { Header: t('actions'), accessor: 'actions' },
                    ],
                    data: filteredSales.map(s => ({...s, items: s.items.length }))
                };
                break;
            case 'inventory':
                generated = {
                    title: `${t('inventory_report')} (${new Date().toLocaleDateString()})`,
                    columns: [
                        { Header: t('product_name'), accessor: 'name' },
                        { Header: t('category'), accessor: 'category' },
                        { Header: t('stock'), accessor: 'stock' },
                        { Header: t('buying_price'), accessor: 'buyingPrice' },
                        { Header: t('Inventory Value'), accessor: 'inventoryValue' },
                    ],
                    data: products.map(p => ({ ...p, inventoryValue: p.stock * p.buyingPrice }))
                };
                break;
            case 'profit':
                const totalSales = filteredSales.reduce((sum, s) => sum + s.total, 0);
                const totalProfit = filteredSales.reduce((sum, s) => sum + s.profit, 0);
                const totalCogs = totalSales - totalProfit;
                const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
                const netProfit = totalProfit - totalExpenses;
                generated = {
                    title: `${t('profit_report')} (${dateRange})`,
                    columns: [{ Header: t('Metric'), accessor: 'metric' }, { Header: t('Amount'), accessor: 'amount' }],
                    data: [
                        { metric: t('total_sales'), amount: totalSales },
                        { metric: t('Total COGS'), amount: totalCogs },
                        { metric: t('Gross Profit'), amount: totalProfit },
                        { metric: t('Total Expenses'), amount: totalExpenses },
                        { metric: t('Net Profit'), amount: netProfit },
                    ]
                };
                break;
            case 'expenses':
                generated = {
                    title: `${t('expenses_report')} (${dateRange})`,
                    columns: [
                        { Header: t('date'), accessor: 'date' },
                        { Header: t('category'), accessor: 'category' },
                        { Header: t('supplier'), accessor: 'supplier' },
                        { Header: t('amount_mmk'), accessor: 'amount' },
                        { Header: t('description'), accessor: 'description' },
                        { Header: t('actions'), accessor: 'actions' },
                    ],
                    data: filteredExpenses.map(e => ({ ...e, supplier: e.supplierId ? (suppliers.find(s => s.id === e.supplierId)?.name || 'N/A') : '-' }))
                };
                break;
        }
        setReportData(generated);
    };

    const handleReportAction = (action: 'delete-sale' | 'edit-expense' | 'delete-expense', payload: any) => {
        switch (action) {
            case 'delete-sale':
                if (window.confirm(t('are_you_sure_void_sale'))) {
                    deleteSale(payload);
                    showToast(t('sale_voided_successfully'), 'success');
                    generateReport(); // Refresh report data
                }
                break;
            case 'delete-expense':
                if (window.confirm(t('confirm_delete_expense'))) {
                    deleteExpense(payload);
                    showToast('Expense deleted successfully', 'success');
                    generateReport();
                }
                break;
            case 'edit-expense':
                setExpenseToEdit(payload);
                setIsEditModalOpen(true);
                break;
        }
    };
    
    const handleSaveExpenseUpdate = (updated: Expense) => {
        updateExpense(updated);
        showToast('Expense updated successfully', 'success');
        setIsEditModalOpen(false);
        generateReport();
    };

    const exportToExcel = () => {
        if (!reportData) return;
        const columnsToExport = reportData.columns.filter(c => c.accessor !== 'actions');
        const header = columnsToExport.map(c => c.Header);
        const body = reportData.data.map(row => 
            columnsToExport.map(c => row[c.accessor])
        );
    
        const finalData = [
            [reportData.title],
            [],
            header,
            ...body
        ];
    
        const worksheet = (window as any).XLSX.utils.aoa_to_sheet(finalData);
        
        const columnWidths = header.map((h, i) => ({
            wch: Math.max(
                h.length,
                ...finalData.map(row => row[i]?.toString().length ?? 0)
            ) + 2
        }));
        worksheet['!cols'] = columnWidths;
    
        if (header.length > 1) {
            worksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: header.length - 1 } }];
        }
    
        const workbook = (window as any).XLSX.utils.book_new();
        (window as any).XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
        (window as any).XLSX.writeFile(workbook, `${reportData.title.replace(/[\(\)]/g, '').replace(/ /g, '_')}.xlsx`);
    };
    
    return (
        <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">{t('reports_management')}</h2>
            <div className="bg-white rounded-lg p-6 shadow-md mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div className="flex flex-col">
                        <label className="text-sm font-medium mb-1">{t('report_type')}</label>
                        <select value={reportType} onChange={e => { setReportType(e.target.value as ReportType); setReportData(null); }} className="p-2 border rounded-lg">
                            <option value="sales">{t('sales_report')}</option>
                            <option value="inventory">{t('inventory_report')}</option>
                            <option value="profit">{t('profit_report')}</option>
                            <option value="expenses">{t('expenses_report')}</option>
                        </select>
                    </div>
                     <div className="flex flex-col">
                        <label className="text-sm font-medium mb-1">{t('start_date')}</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 border rounded-lg" />
                    </div>
                     <div className="flex flex-col">
                        <label className="text-sm font-medium mb-1">{t('end_date')}</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 border rounded-lg" />
                    </div>
                    <button onClick={generateReport} className="bg-[--primary-color] text-white font-semibold py-2 px-6 rounded-lg h-10">{t('generate_report')}</button>
                </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
                {reportData ? (
                    <>
                        <div className="flex justify-between items-center mb-4">
                             <h3 className="text-xl font-semibold">{reportData.title}</h3>
                             <button onClick={exportToExcel} className="bg-green-600 text-white font-semibold py-2 px-4 rounded-lg">{t('export_to_excel')}</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y">
                                <thead className="bg-gray-50">
                                    <tr>{reportData.columns.map(col => <th key={col.accessor} className="px-6 py-3 text-left text-xs font-medium uppercase">{col.Header}</th>)}</tr>
                                </thead>
                                <tbody className="bg-white divide-y">
                                    {reportData.data.map((row, i) => (
                                        <tr key={row.id || i}>
                                            {reportData.columns.map(col => (
                                                <td key={col.accessor} className="px-6 py-4 whitespace-nowrap">
                                                    {col.accessor === 'actions' ? (
                                                        <div className="flex items-center gap-2">
                                                            {reportType === 'sales' && (
                                                                <button onClick={() => handleReportAction('delete-sale', row.id)} className="text-red-600 hover:text-red-900">{t('void_sale')}</button>
                                                            )}
                                                            {reportType === 'expenses' && (
                                                                <>
                                                                    <button onClick={() => handleReportAction('edit-expense', row)} className="text-indigo-600 hover:text-indigo-900">{t('Edit')}</button>
                                                                    <button onClick={() => handleReportAction('delete-expense', row.id)} className="text-red-600 hover:text-red-900">{t('Delete')}</button>
                                                                </>
                                                            )}
                                                        </div>
                                                    ) : ['total', 'profit', 'amount', 'inventoryValue', 'buyingPrice'].includes(col.accessor) && typeof row[col.accessor] === 'number'
                                                        ? formatCurrency(row[col.accessor])
                                                        : row[col.accessor]}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : (
                    <p className="text-center text-gray-500">{t('generate_report_to_see_results')}</p>
                )}
            </div>

            {expenseToEdit && (
                <ExpenseEditModal 
                    isOpen={isEditModalOpen} 
                    onClose={() => setIsEditModalOpen(false)} 
                    expense={expenseToEdit} 
                    onSave={handleSaveExpenseUpdate}
                />
            )}
        </div>
    );
};

// --- Expense Edit Modal Component ---
const ExpenseEditModal: React.FC<{isOpen: boolean, onClose: () => void, expense: Expense, onSave: (expense: Expense) => void}> = ({isOpen, onClose, expense, onSave}) => {
    const { suppliers } = useData();
    const { t } = useLanguage();
    const [formData, setFormData] = useState<Expense>(expense);

    useEffect(() => {
        setFormData(expense);
    }, [expense]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({...formData, amount: Number(formData.amount)});
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('edit_expense')}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="text-sm font-medium">{t('date')}</label>
                    <input type="date" name="date" value={formData.date} onChange={handleInputChange} className="w-full p-2 border rounded-lg mt-1" />
                </div>
                 <div>
                    <label className="text-sm font-medium">{t('amount_mmk')}</label>
                    <input type="number" name="amount" value={formData.amount} onChange={handleInputChange} className="w-full p-2 border rounded-lg mt-1" />
                </div>
                <div>
                    <label className="text-sm font-medium">{t('description')}</label>
                    <textarea name="description" value={formData.description || ''} onChange={handleInputChange} rows={3} className="w-full p-2 border rounded-lg mt-1" />
                </div>
                 <div className="flex justify-end gap-2 mt-4">
                    <button type="button" onClick={onClose} className="bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg">{t('Cancel')}</button>
                    <button type="submit" className="bg-[--primary-color] text-white font-semibold py-2 px-4 rounded-lg">{t('Save')}</button>
                </div>
            </form>
        </Modal>
    );
};


export default Reports;