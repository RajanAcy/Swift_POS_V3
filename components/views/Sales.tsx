import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { CartItem, Sale } from '../../types';
import BarcodeScanner from '../shared/BarcodeScanner';

const Sales: React.FC = () => {
    const { products, customers, sales, categories, addSale, deleteSale, showToast, systemSettings, companyInfo } = useData();
    const { t } = useLanguage();
    
    const [cart, setCart] = useState<CartItem[]>([]);
    const [customer, setCustomer] = useState('walk-in');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [amountPaid, setAmountPaid] = useState(0);
    const [orderDiscount, setOrderDiscount] = useState(0);
    const [notes, setNotes] = useState('');
    const [isScannerOpen, setScannerOpen] = useState(false);
    const [salesStartDate, setSalesStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [salesEndDate, setSalesEndDate] = useState(new Date().toISOString().split('T')[0]);
    
    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: systemSettings.currency || 'MMK',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);

    const filteredProducts = useMemo(() => {
        return products.filter(p =>
            (p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             (p.barcode || '').toLowerCase().includes(searchTerm.toLowerCase())) &&
            (selectedCategories.length === 0 || selectedCategories.includes(p.category))
        );
    }, [products, searchTerm, selectedCategories]);

    const cartTotal = useMemo(() => {
        const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
        return subtotal * (1 - orderDiscount / 100);
    }, [cart, orderDiscount]);

    const isCreditSale = paymentMethod === 'credit';
    
    const change = useMemo(() => {
        if (isCreditSale) return 0;
        return Math.max(0, amountPaid - cartTotal);
    }, [amountPaid, cartTotal, isCreditSale]);

    useEffect(() => {
        if (isCreditSale) {
            setAmountPaid(0);
        } else {
            setAmountPaid(cartTotal);
        }
    }, [cartTotal, isCreditSale]);

    const addToCart = (productId: string) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;
        if (product.stock <= 0) {
            showToast(t('Product is out of stock'), 'warning');
            return;
        }

        const existingItem = cart.find(item => item.productId === productId);
        if (existingItem) {
            if (existingItem.quantity >= product.stock) {
                showToast(t('No more stock available'), 'warning');
                return;
            }
            setCart(cart.map(item => item.productId === productId ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price * (1 - item.discount / 100) } : item));
        } else {
            const newItem: CartItem = {
                id: Date.now().toString(),
                productId: product.id,
                name: product.name,
                price: product.sellingPrice,
                quantity: 1,
                discount: 0, // Item-specific discount can be added later
                total: product.sellingPrice,
            };
            setCart([...cart, newItem]);
        }
    };
    
    const removeFromCart = (itemId: string) => {
        setCart(cart.filter(item => item.id !== itemId));
    };

    const updateCartItem = (itemId: string, newQuantity: number) => {
        const itemToUpdate = cart.find(item => item.id === itemId);
        const product = products.find(p => p.id === itemToUpdate?.productId);
        if (!itemToUpdate || !product) return;

        if (newQuantity > product.stock) {
            showToast(`${t('Only')} ${product.stock} ${t('in stock')}`, 'warning');
            return;
        }

        if (newQuantity <= 0) {
            removeFromCart(itemId);
        } else {
            setCart(cart.map(item => item.id === itemId ? {...item, quantity: newQuantity, total: newQuantity * item.price * (1 - item.discount / 100)} : item));
        }
    };
    
    const handleCategoryToggle = (category: string) => {
        setSelectedCategories(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]);
    };

    const handleCompleteSale = () => {
        if (cart.length === 0) {
            showToast(t('Cart is empty'), 'error');
            return;
        }

        if (isCreditSale && (customer === 'walk-in' || customer === 'online')) {
            showToast(t('credit_sale_customer_required'), 'error');
            return;
        }

        if (!isCreditSale && amountPaid < cartTotal) {
            showToast(t('Amount paid is less than total'), 'error');
            return;
        }
        
        const saleProfit = cart.reduce((sum, item) => {
            const product = products.find(p => p.id === item.productId);
            if(product) {
                return sum + (item.total - (product.buyingPrice * item.quantity));
            }
            return sum;
        }, 0);

        addSale({
            date: new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString('en-US', { hour12: false }),
            customerType: customer,
            paymentMethod,
            items: cart,
            total: cartTotal,
            profit: saleProfit,
            amountPaid: isCreditSale ? 0 : amountPaid,
            orderDiscount,
            change,
            notes,
        });

        showToast(t('Sale completed successfully'), 'success');
        // Reset state
        setCart([]);
        setOrderDiscount(0);
        setAmountPaid(0);
        setNotes('');
        setPaymentMethod('cash');
        setCustomer('walk-in');
    };

    const printReceipt = () => {
        window.print();
    };

    const onBarcodeDetected = (code: string) => {
        showToast(`Barcode detected: ${code}`, 'success');
        setScannerOpen(false);
        const product = products.find(p => p.barcode === code);
        if (product) {
            addToCart(product.id);
        } else {
            setSearchTerm(code);
            showToast(`Product with barcode ${code} not found.`, 'warning');
        }
    };

    const filteredSales = sales
        .filter(s => {
            const saleDate = new Date(s.date);
            const start = new Date(salesStartDate);
            const end = new Date(salesEndDate);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            return saleDate >= start && saleDate <= end;
        })
        .sort((a, b) => b.time.localeCompare(a.time));

    const handleVoidSale = (saleId: string) => {
        if (window.confirm(t('are_you_sure_void_sale'))) {
          deleteSale(saleId);
          showToast(t('sale_voided_successfully'), 'success');
        }
    };

    const handleEditSale = (saleToEdit: Sale) => {
        if (window.confirm(t('load_to_cart_for_edit'))) {
          // Deep copy items to avoid reference issues
          const itemsToLoad = JSON.parse(JSON.stringify(saleToEdit.items));
          setCart(itemsToLoad);
          setCustomer(saleToEdit.customerId || saleToEdit.customerType);
          setOrderDiscount(saleToEdit.orderDiscount);
          setNotes(saleToEdit.notes || '');
          setPaymentMethod(saleToEdit.paymentMethod);
          setAmountPaid(saleToEdit.amountPaid);
          
          deleteSale(saleToEdit.id);
          showToast(t('sale_loaded_for_edit'), 'info');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const getCustomerName = (sale: Sale) => {
        if (sale.customerId) {
            return customers.find(c => c.id === sale.customerId)?.name || t('customer');
        }
        return t(sale.customerType.replace('-', '_'));
    }

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">{t('sales')}</h2>
            <BarcodeScanner isOpen={isScannerOpen} onClose={() => setScannerOpen(false)} onDetected={onBarcodeDetected} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Controls */}
                    <div className="bg-white rounded-lg p-4 shadow-md">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" placeholder={t('search_products')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="p-2 border rounded-lg w-full"/>
                            <select value={customer} onChange={e => setCustomer(e.target.value)} className="p-2 border rounded-lg w-full">
                                <option value="walk-in">{t('walk_in_customer')}</option>
                                <option value="online">{t('online_customer')}</option>
                                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-4">
                            {categories.map(c => (
                                <button key={c} onClick={() => handleCategoryToggle(c)} className={`px-3 py-1 text-sm rounded-full border ${selectedCategories.includes(c) ? 'bg-[--primary-color] text-white' : 'bg-gray-100'}`}>{c}</button>
                            ))}
                        </div>
                         <button onClick={() => setScannerOpen(true)} className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">{t('btn_scan_barcode')}</button>
                    </div>

                    {/* Product Grid */}
                    <div className="bg-white rounded-lg p-4 shadow-md">
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 h-[50vh] overflow-y-auto">
                            {filteredProducts.map(p => (
                                <button key={p.id} onClick={() => addToCart(p.id)} className="border rounded-lg p-3 text-left hover:shadow-lg focus:outline-none focus:ring-2 ring-[--primary-color]">
                                    {p.image ? <img src={p.image} alt={p.name} className="w-full h-24 object-cover rounded mb-2"/> : <div className="w-full h-24 bg-gray-200 rounded mb-2 flex items-center justify-center text-gray-400">No Image</div>}
                                    <p className="font-semibold truncate">{p.name}</p>
                                    <p className="text-sm text-gray-600">{formatCurrency(p.sellingPrice)}</p>
                                    <p className={`text-xs ${p.stock < systemSettings.lowStockThreshold ? 'text-red-500' : 'text-gray-500'}`}>{t('stock')}: {p.stock}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Cart & Payment */}
                <div className="space-y-6">
                    <div className="bg-white rounded-lg p-4 shadow-md">
                        <h3 className="text-xl font-bold mb-4">{t('current_sale')}</h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                           {cart.map(item => (
                               <div key={item.id} className="flex items-center justify-between">
                                   <div>
                                       <p className="font-medium">{item.name}</p>
                                       <p className="text-sm text-gray-500">{formatCurrency(item.price)}</p>
                                   </div>
                                   <div className="flex items-center gap-2">
                                       <input type="number" value={item.quantity} onChange={(e) => updateCartItem(item.id, parseInt(e.target.value))} className="w-16 p-1 border rounded"/>
                                       <p className="w-20 text-right">{formatCurrency(item.total)}</p>
                                       <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700">X</button>
                                   </div>
                               </div>
                           ))}
                           {cart.length === 0 && <p className="text-gray-500 text-center">{t('Cart is empty')}</p>}
                        </div>
                        <div className="border-t mt-4 pt-4 space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="font-medium">{t('order_discount')}</label>
                                <input type="number" value={orderDiscount} onChange={e => setOrderDiscount(Number(e.target.value))} className="w-24 p-1 border rounded text-right"/>
                            </div>
                            <div className="flex justify-between font-bold text-xl">
                                <span>{t('cart_total')}</span>
                                <span>{formatCurrency(cartTotal)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 shadow-md">
                        <h3 className="text-xl font-bold mb-4">{t('payment')}</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium">{t('payment_method')}</label>
                                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full p-2 border rounded-lg mt-1">
                                    <option value="cash">{t('cash')}</option>
                                    <option value="credit">{t('credit')}</option>
                                    <option value="bank_transfer">{t('bank_transfer')}</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium">{t('amount_paid')}</label>
                                <input 
                                    type="number" 
                                    value={amountPaid} 
                                    onChange={e => setAmountPaid(Number(e.target.value))} 
                                    readOnly={isCreditSale}
                                    className={`w-full p-2 border rounded-lg mt-1 ${isCreditSale ? 'bg-gray-100' : ''}`}
                                />
                            </div>
                             <div>
                                <label className="text-sm font-medium">{t('change')}</label>
                                <input type="text" value={formatCurrency(change)} readOnly className="w-full p-2 border rounded-lg mt-1 bg-gray-100"/>
                            </div>
                            <div>
                                <label className="text-sm font-medium">{t('notes')}</label>
                                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full p-2 border rounded-lg mt-1"></textarea>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleCompleteSale} className="flex-1 bg-green-500 text-white font-bold py-3 rounded-lg">{t('complete_sale')}</button>
                                <button onClick={printReceipt} disabled={cart.length === 0} className="flex-1 bg-blue-500 text-white font-bold py-3 rounded-lg disabled:bg-gray-400">{t('print_receipt')}</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md mt-6">
                <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                    <h3 className="text-xl font-semibold">{t('sales_history')}</h3>
                    <div className="flex items-center gap-4">
                        <div>
                            <label htmlFor="salesStartDate" className="text-sm font-medium mr-2">{t('start_date')}</label>
                            <input id="salesStartDate" type="date" value={salesStartDate} onChange={e => setSalesStartDate(e.target.value)} className="p-2 border rounded-lg" />
                        </div>
                        <div>
                            <label htmlFor="salesEndDate" className="text-sm font-medium mr-2">{t('end_date')}</label>
                            <input id="salesEndDate" type="date" value={salesEndDate} onChange={e => setSalesEndDate(e.target.value)} className="p-2 border rounded-lg" />
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto max-h-96">
                    <table className="min-w-full divide-y">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium uppercase">{t('time')}</th>
                                <th className="px-4 py-2 text-left text-xs font-medium uppercase">{t('customer')}</th>
                                <th className="px-4 py-2 text-left text-xs font-medium uppercase">{t('items')}</th>
                                <th className="px-4 py-2 text-left text-xs font-medium uppercase">{t('total')}</th>
                                <th className="px-4 py-2 text-left text-xs font-medium uppercase">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y">
                            {filteredSales.map(s => (
                                <tr key={s.id}>
                                    <td className="px-4 py-2 whitespace-nowrap">{s.time}</td>
                                    <td className="px-4 py-2 whitespace-nowrap">{getCustomerName(s)}</td>
                                    <td className="px-4 py-2 whitespace-nowrap">{s.items.length}</td>
                                    <td className="px-4 py-2 whitespace-nowrap">{formatCurrency(s.total)}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                                        <button onClick={() => handleEditSale(s)} className="text-indigo-600 hover:text-indigo-900 mr-3 font-medium">{t('Edit')}</button>
                                        <button onClick={() => handleVoidSale(s.id)} className="text-red-600 hover:text-red-900 font-medium">{t('void_sale')}</button>
                                    </td>
                                </tr>
                            ))}
                             {filteredSales.length === 0 && (
                                <tr><td colSpan={5} className="text-center py-4 text-gray-500">{t('no_sales_found_for_period')}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

             {/* Hidden div for printing receipt */}
             <div id="receipt-content" className="hidden">
                <div className={`receipt-print-area receipt-${systemSettings.receiptSize}`}>
                    <div className="text-center space-y-1">
                        {companyInfo.logo && <img src={companyInfo.logo} alt="logo" className="mx-auto h-16 w-auto object-contain" />}
                        <h3 className="text-lg font-bold">{companyInfo.name}</h3>
                        <p className="text-xs">{companyInfo.address}</p>
                        <p className="text-xs">{companyInfo.phone}</p>
                        <p className="text-xs">{t('date')}: {new Date().toLocaleString()}</p>
                    </div>
                    <hr className="my-2 border-dashed" />
                    <table className="w-full text-xs">
                        <thead>
                            <tr>
                                <th className="text-left py-1">Item</th>
                                <th className="text-center py-1">Qty</th>
                                <th className="text-right py-1">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cart.map(item => (
                                <tr key={item.id}>
                                    <td className="py-0.5">{item.name}</td>
                                    <td className="text-center py-0.5">{item.quantity}</td>
                                    <td className="text-right py-0.5">{formatCurrency(item.total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <hr className="my-2 border-dashed" />
                    <div className="text-xs space-y-1">
                        <div className="flex justify-between"><span>Subtotal:</span><span>{formatCurrency(cart.reduce((s,i)=> s + i.total, 0))}</span></div>
                        {orderDiscount > 0 && <div className="flex justify-between"><span>Discount ({orderDiscount}%):</span><span>-{formatCurrency(cart.reduce((s,i)=> s + i.total, 0) * orderDiscount/100)}</span></div>}
                        <div className="flex justify-between font-bold text-sm"><span>Total:</span><span>{formatCurrency(cartTotal)}</span></div>
                        <div className="flex justify-between"><span>{t(paymentMethod)}:</span><span>{formatCurrency(amountPaid)}</span></div>
                        <div className="flex justify-between"><span>Change:</span><span>{formatCurrency(change)}</span></div>
                    </div>
                    <hr className="my-2 border-dashed" />
                    <div className="text-center text-xs whitespace-pre-wrap">{systemSettings.receiptFooter}</div>
                </div>
             </div>
        </div>
    );
};

export default Sales;
