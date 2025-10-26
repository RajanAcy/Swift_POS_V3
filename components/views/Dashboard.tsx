import React, { useMemo, useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { StatCard } from '../shared/Card';

const Dashboard: React.FC = () => {
    const { sales, products, expenses, suppliers, systemSettings } = useData();
    const { t } = useLanguage();
    const { currency } = systemSettings;

    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() - 29); // Default to last 30 days
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'MMK',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
    
    const { filteredSales, filteredExpenses } = useMemo(() => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        start.setHours(0, 0, 0, 0);

        const fs = sales.filter(s => {
            const saleDate = new Date(s.date);
            return saleDate >= start && saleDate <= end;
        });

        const fe = expenses.filter(e => {
            const expenseDate = new Date(e.date);
            return expenseDate >= start && expenseDate <= end;
        });

        return { filteredSales: fs, filteredExpenses: fe };
    }, [sales, expenses, startDate, endDate]);


    const stats = useMemo(() => {
        const totalSales = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
        const totalProfit = filteredSales.reduce((sum, sale) => sum + sale.profit, 0);
        const totalProducts = products.length; // This is independent of date
        const totalCreditPayments = filteredExpenses
            .filter(e => e.category === 'Supplier Payment' || e.supplierId)
            .reduce((sum, e) => sum + e.amount, 0);
        return { totalSales, totalProfit, totalProducts, totalCreditPayments };
    }, [filteredSales, filteredExpenses, products.length]);
    
    const chartData = useMemo(() => {
        // Sales trends
        const salesByDate = new Map<string, number>();
        filteredSales.forEach(sale => {
            salesByDate.set(sale.date, (salesByDate.get(sale.date) || 0) + sale.total);
        });
        const salesTrendData = Array.from(salesByDate.entries())
            .sort((a,b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
            .map(([date, total]) => ({
                name: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                sales: total,
            }));

        // Profit trends
        const profitByDate = new Map<string, number>();
        filteredSales.forEach(sale => {
            profitByDate.set(sale.date, (profitByDate.get(sale.date) || 0) + sale.profit);
        });
        const profitTrendData = Array.from(profitByDate.entries())
            .sort((a,b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
            .map(([date, totalProfit]) => ({
                name: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                profit: totalProfit,
            }));

        // Best selling products
        const productSales: { [key: string]: number } = {};
        filteredSales.forEach(sale => sale.items.forEach(item => {
            productSales[item.name] = (productSales[item.name] || 0) + item.quantity;
        }));

        const topProducts = Object.entries(productSales)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, quantity]) => ({ name, quantity }));

        // Sales by category
        const categorySales: { [key: string]: number } = {};
        filteredSales.forEach(sale => sale.items.forEach(item => {
            const product = products.find(p => p.id === item.productId);
            if (product) {
                categorySales[product.category] = (categorySales[product.category] || 0) + item.total;
            }
        }));
        
        const salesByCategory = Object.entries(categorySales).map(([name, value]) => ({ name, value }));
        
        // Expenses by Category
        const expensesByCategoryData: { [key: string]: number } = {};
        filteredExpenses.forEach(expense => {
            expensesByCategoryData[expense.category] = (expensesByCategoryData[expense.category] || 0) + expense.amount;
        });
        const expensesByCategory = Object.entries(expensesByCategoryData).map(([name, value]) => ({ name, value }));

        // Recent Supplier Payments
        const recentSupplierPayments = filteredExpenses
            .filter(e => e.category === 'Supplier Payment' && e.supplierId)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5)
            .map(e => ({
                ...e,
                supplierName: suppliers.find(s => s.id === e.supplierId)?.name || 'N/A'
            }));

        return { salesTrendData, profitTrendData, topProducts, salesByCategory, expensesByCategory, recentSupplierPayments };
    }, [filteredSales, filteredExpenses, products, suppliers]);
    
    const lowStockProducts = useMemo(() => {
        return products
            .filter(p => p.stock < systemSettings.lowStockThreshold)
            .sort((a,b) => a.stock - b.stock);
    }, [products, systemSettings.lowStockThreshold]);

    const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1943'];
    
    return (
        <div>
            <div className="flex flex-wrap items-center gap-4 mb-6 bg-white p-4 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-gray-800">{t('date_range')}</h3>
                <div className="flex items-center gap-2">
                    <label htmlFor="startDate" className="text-sm font-medium">{t('start_date')}</label>
                    <input id="startDate" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 border rounded-lg" />
                </div>
                <div className="flex items-center gap-2">
                    <label htmlFor="endDate" className="text-sm font-medium">{t('end_date')}</label>
                    <input id="endDate" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 border rounded-lg" />
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <StatCard title={t('total_sales')} value={formatCurrency(stats.totalSales)} />
                <StatCard title={t('total_profit')} value={formatCurrency(stats.totalProfit)} colorClass="text-green-500" />
                <StatCard title={t('total_products')} value={stats.totalProducts.toString()} colorClass="text-blue-500" />
                <StatCard title={t('credit_payments')} value={formatCurrency(stats.totalCreditPayments)} colorClass="text-red-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="font-semibold mb-4">{t('sales_trends')}</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData.salesTrendData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="sales" stroke="#8884d8" activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="font-semibold mb-4">{t('profit_trends')}</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData.profitTrendData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="profit" fill="#82ca9d" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                 <div className="bg-white p-6 rounded-lg shadow lg:col-span-1">
                    <h3 className="font-semibold mb-4">{t('top_5_best_selling')}</h3>
                     <ul>
                        {chartData.topProducts.map((p, i) => (
                            <li key={p.name} className="flex justify-between py-2 border-b">
                                <span>{i+1}. {p.name}</span>
                                <span className="font-semibold">{p.quantity}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
                    <h3 className="font-semibold mb-4">{t('sales_by_category')}</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={chartData.salesByCategory} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                {chartData.salesByCategory.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                            </Pie>
                             <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="font-semibold mb-4">{t('expenses_by_category')}</h3>
                     <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={chartData.expensesByCategory} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                {chartData.expensesByCategory.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                            </Pie>
                             <Tooltip />
                             <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="font-semibold mb-4">{t('recent_supplier_payments')}</h3>
                     <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium">{t('supplier')}</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium">{t('amount_mmk')}</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium">{t('date')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {chartData.recentSupplierPayments.map(p => (
                                    <tr key={p.id} className="border-b">
                                        <td className="px-4 py-2">{p.supplierName}</td>
                                        <td className="px-4 py-2">{formatCurrency(p.amount)}</td>
                                        <td className="px-4 py-2">{p.date}</td>
                                    </tr>
                                ))}
                                {chartData.recentSupplierPayments.length === 0 && (
                                    <tr><td colSpan={3} className="text-center py-4 text-gray-500">{t('No payments found.')}</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow mt-6">
                <h3 className="font-semibold mb-4">{t('purchase_suggestions')} ({t('stock')} &lt; {systemSettings.lowStockThreshold})</h3>
                <div className="overflow-x-auto max-h-72">
                    <table className="min-w-full">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium uppercase">{t('product_name')}</th>
                                <th className="px-4 py-2 text-left text-xs font-medium uppercase">{t('current_stock')}</th>
                                <th className="px-4 py-2 text-left text-xs font-medium uppercase">{t('supplier')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {lowStockProducts.map(p => (
                                <tr key={p.id}>
                                    <td className="px-4 py-2 whitespace-nowrap">{p.name}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-red-600 font-bold">{p.stock}</td>
                                    <td className="px-4 py-2 whitespace-nowrap">{suppliers.find(s => s.id === p.supplierId)?.name || 'N/A'}</td>
                                </tr>
                            ))}
                            {lowStockProducts.length === 0 && (
                                <tr><td colSpan={3} className="text-center py-4 text-gray-500">{t('No low stock products.')}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
