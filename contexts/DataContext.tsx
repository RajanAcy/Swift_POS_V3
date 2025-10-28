import React, { createContext, useContext, ReactNode, useState, useCallback, useEffect } from 'react';
import { Product, Sale, Supplier, Expense, Customer, CompanyInfo, SystemSettings, Category, Purchase, CustomerPayment } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { DEFAULT_CATEGORIES } from '../constants';
import { useLanguage } from './LanguageContext';
import { get, set } from 'idb-keyval';

// --- Helper Functions ---
const generateId = (): string => Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

// --- Context Definition ---
interface DataContextType {
    // State
    products: Product[];
    sales: Sale[];
    suppliers: Supplier[];
    expenses: Expense[];
    customers: Customer[];
    purchases: Purchase[];
    customerPayments: CustomerPayment[];
    companyInfo: CompanyInfo;
    systemSettings: SystemSettings;
    categories: Category[];
    isInIframe: boolean;
    isFileSystemApiSupported: boolean;

    // Mutators
    addProduct: (product: Omit<Product, 'id'>) => void;
    updateProduct: (product: Product) => void;
    deleteProduct: (productId: string) => void;
    
    addSale: (sale: Omit<Sale, 'id'>) => void;
    deleteSale: (saleId: string) => void;

    addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
    updateSupplier: (supplier: Supplier) => void;
    deleteSupplier: (supplierId: string) => void;

    addExpense: (expense: Omit<Expense, 'id'>) => void;
    updateExpense: (expense: Expense) => void;
    deleteExpense: (expenseId: string) => void;

    addCustomer: (customer: Omit<Customer, 'id'>) => void;
    updateCustomer: (customer: Customer) => void;
    deleteCustomer: (customerId: string) => void;
    
    addCustomerPayment: (payment: Omit<CustomerPayment, 'id'>) => void;

    saveCompanyInfo: (info: CompanyInfo) => void;
    saveSystemSettings: (settings: SystemSettings) => void;

    addCategory: (name: string) => boolean;
    updateCategory: (oldName: string, newName: string) => boolean;
    deleteCategory: (name: string) => void;
    
    showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
    
    resetAllData: () => void;
    importData: (data: any) => void;

    directoryHandle: any | null;
    selectDirectory: () => Promise<string | null>;
    exportBackup: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// --- Toast Component ---
interface ToastMessage {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
}

const ToastContainer: React.FC<{ toasts: ToastMessage[]; removeToast: (id: number) => void; }> = ({ toasts, removeToast }) => {
    return (
        <div className="fixed top-4 right-4 z-[100] space-y-2">
            {toasts.map((toast) => (
                <div key={toast.id} className={`p-4 rounded-lg shadow-lg text-white text-sm animate-fade-in-right ${
                    toast.type === 'success' ? 'bg-green-500' :
                    toast.type === 'error' ? 'bg-red-500' :
                    toast.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                }`}
                onClick={() => removeToast(toast.id)}>
                    {toast.message}
                </div>
            ))}
        </div>
    );
};

// --- Provider Component ---
export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { t } = useLanguage();
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [directoryHandle, setDirectoryHandle] = useState<any | null>(null);
    const [isInIframe, setIsInIframe] = useState(false);
    const [isFileSystemApiSupported, setIsFileSystemApiSupported] = useState(false);

    useEffect(() => {
        setIsFileSystemApiSupported('showDirectoryPicker' in window);
    }, []);

     useEffect(() => {
        get('directoryHandle').then(handle => {
            if (handle) {
                setDirectoryHandle(handle);
            }
        });
    }, []);

    const [systemSettings, setSystemSettings] = useLocalStorage<SystemSettings>('systemSettings', {
        businessType: 'clothing',
        currency: 'MMK',
        taxRate: 0,
        enableNotifications: true,
        enableSound: true,
        lowStockThreshold: 10,
        receiptSize: 'standard',
        receiptFooter: 'Thank you for your purchase!',
        storagePreference: 'local',
        storagePath: '',
    });
    
    const [products, setProducts] = useLocalStorage<Product[]>('products', []);
    const [sales, setSales] = useLocalStorage<Sale[]>('sales', []);
    const [suppliers, setSuppliers] = useLocalStorage<Supplier[]>('suppliers', []);
    const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', []);
    const [customers, setCustomers] = useLocalStorage<Customer[]>('customers', []);
    const [purchases, setPurchases] = useLocalStorage<Purchase[]>('purchases', []);
    const [customerPayments, setCustomerPayments] = useLocalStorage<CustomerPayment[]>('customerPayments', []);
    const [companyInfo, setCompanyInfo] = useLocalStorage<CompanyInfo>('companyInfo', { name: 'Swift POS' });
    const [categories, setCategories] = useLocalStorage<Category[]>('categories', DEFAULT_CATEGORIES[systemSettings.businessType]);

    useEffect(() => {
        try {
            setIsInIframe(window.self !== window.top);
        } catch (e) {
            console.warn("Could not determine iframe status due to security restrictions, assuming it is sandboxed.", e);
            setIsInIframe(true);
        }
    }, []);

    // This effect ensures that when the business type is changed in settings,
    // the default categories for that business type are loaded IF the user has not customized them.
    useEffect(() => {
        // A simple check to see if the categories are still the default for a *different* business type.
        const allDefaultCategories = Object.values(DEFAULT_CATEGORIES).flat();
        const isDefaultOrEmpty = categories.length === 0 || categories.every(c => allDefaultCategories.includes(c));
        
        if (isDefaultOrEmpty) {
            setCategories(DEFAULT_CATEGORIES[systemSettings.businessType]);
        }
    }, [systemSettings.businessType, setCategories]);


    const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);
    
    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    // --- CRUD Functions ---
    const addProduct = (product: Omit<Product, 'id'>) => {
        const newProduct = { ...product, id: generateId() };
        setProducts(prev => [...prev, newProduct]);
        if (newProduct.supplierId && newProduct.stock > 0 && newProduct.buyingPrice > 0) {
            const newPurchase: Omit<Purchase, 'id'> = {
                date: new Date().toISOString().split('T')[0],
                supplierId: newProduct.supplierId,
                productId: newProduct.id,
                quantity: newProduct.stock,
                unitCost: newProduct.buyingPrice,
                totalCost: newProduct.stock * newProduct.buyingPrice
            };
            setPurchases(prev => [...prev, { ...newPurchase, id: generateId() }]);
        }
    };
    
    const updateProduct = (updatedProduct: Product) => {
        const oldProduct = products.find(p => p.id === updatedProduct.id);
        const oldStock = oldProduct ? oldProduct.stock : 0;

        setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));

        const stockIncrease = updatedProduct.stock - oldStock;
        if (updatedProduct.supplierId && stockIncrease > 0 && updatedProduct.buyingPrice > 0) {
            const newPurchase: Omit<Purchase, 'id'> = {
                date: new Date().toISOString().split('T')[0],
                supplierId: updatedProduct.supplierId,
                productId: updatedProduct.id,
                quantity: stockIncrease,
                unitCost: updatedProduct.buyingPrice,
                totalCost: stockIncrease * updatedProduct.buyingPrice
            };
            setPurchases(prev => [...prev, { ...newPurchase, id: generateId() }]);
        }
    };

    const deleteProduct = (productId: string) => setProducts(prev => prev.filter(p => p.id !== productId));
    
    const addSale = (sale: Omit<Sale, 'id'>) => {
        const newSale: Sale = { ...sale, id: generateId() };
        // Add customerId if a registered customer is selected
        if (sale.customerType !== 'walk-in' && sale.customerType !== 'online') {
            newSale.customerId = sale.customerType;
        }

        // Update stock
        const newProducts = [...products];
        newSale.items.forEach(item => {
            const productIndex = newProducts.findIndex(p => p.id === item.productId);
            if (productIndex !== -1) {
                newProducts[productIndex].stock -= item.quantity;
            }
        });
        setProducts(newProducts);
        setSales(prev => [...prev, newSale]);
    };

    const deleteSale = (saleId: string) => {
        const saleToDelete = sales.find(s => s.id === saleId);
        if (!saleToDelete) return;

        // Restore stock
        const newProducts = [...products];
        saleToDelete.items.forEach(item => {
            const productIndex = newProducts.findIndex(p => p.id === item.productId);
            if (productIndex !== -1) {
                newProducts[productIndex].stock += item.quantity;
            }
        });
        setProducts(newProducts);

        // Remove sale
        setSales(prev => prev.filter(s => s.id !== saleId));
    };

    const addSupplier = (supplier: Omit<Supplier, 'id'>) => setSuppliers(prev => [...prev, { ...supplier, id: generateId() }]);
    const updateSupplier = (updatedSupplier: Supplier) => setSuppliers(prev => prev.map(s => s.id === updatedSupplier.id ? updatedSupplier : s));
    const deleteSupplier = (supplierId: string) => setSuppliers(prev => prev.filter(s => s.id !== supplierId));

    const addExpense = (expense: Omit<Expense, 'id'>) => setExpenses(prev => [...prev, { ...expense, id: generateId() }]);
    const updateExpense = (updatedExpense: Expense) => setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));
    const deleteExpense = (expenseId: string) => setExpenses(prev => prev.filter(e => e.id !== expenseId));

    const addCustomer = (customer: Omit<Customer, 'id'>) => setCustomers(prev => [...prev, { ...customer, id: generateId() }]);
    const updateCustomer = (updatedCustomer: Customer) => setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
    const deleteCustomer = (customerId: string) => setCustomers(prev => prev.filter(c => c.id !== customerId));
    
    const addCustomerPayment = (payment: Omit<CustomerPayment, 'id'>) => {
        setCustomerPayments(prev => [...prev, { ...payment, id: generateId() }]);
    };

    const addCategory = (name: string): boolean => {
        const trimmedName = name.trim();
        if (categories.map(c => c.toLowerCase()).includes(trimmedName.toLowerCase())) {
            showToast(`Category "${trimmedName}" already exists.`, 'warning');
            return false;
        }
        setCategories(prev => [...prev, trimmedName]);
        showToast(`Category "${trimmedName}" added.`, 'success');
        return true;
    };

    const updateCategory = (oldName: string, newName: string): boolean => {
        const trimmedNewName = newName.trim();
        if (trimmedNewName === '') {
            showToast('Category name cannot be empty.', 'error');
            return false;
        }
        if (oldName.toLowerCase() !== trimmedNewName.toLowerCase() && categories.map(c => c.toLowerCase()).includes(trimmedNewName.toLowerCase())) {
            showToast(`Category "${trimmedNewName}" already exists.`, 'warning');
            return false;
        }
        
        // Update products that use the old category name
        const newProducts = products.map(p => {
            if (p.category === oldName) {
                return { ...p, category: trimmedNewName };
            }
            return p;
        });
        setProducts(newProducts);
    
        setCategories(prev => prev.map(c => c === oldName ? trimmedNewName : c));
        showToast('Category updated successfully!', 'success');
        return true;
    };


    const deleteCategory = (name: string) => {
        const productsUsingCategory = products.filter(p => p.category === name).length;
        if(productsUsingCategory > 0) {
            showToast(`Cannot delete category "${name}" as it is being used by ${productsUsingCategory} product(s).`, 'error');
            return;
        }
        if (window.confirm(`Are you sure you want to delete the category "${name}"? This cannot be undone.`)) {
            setCategories(prev => prev.filter(c => c !== name));
            showToast(`Category "${name}" deleted.`, 'success');
        }
    };
    
    const resetAllData = () => {
        if(window.confirm('This will delete all data and cannot be undone. Are you sure?')) {
            setProducts([]);
            setSales([]);
            setSuppliers([]);
            setExpenses([]);
            setCustomers([]);
            setPurchases([]);
            setCustomerPayments([]);
            setCompanyInfo({ name: 'Swift POS' });
            const defaultSettings = {
                businessType: 'clothing',
                currency: 'MMK',
                taxRate: 0,
                enableNotifications: true,
                enableSound: true,
                lowStockThreshold: 10,
                receiptSize: 'standard',
                receiptFooter: 'Thank you for your purchase!',
                storagePreference: 'local',
                storagePath: '',
            } as SystemSettings;
            setSystemSettings(defaultSettings);
            setCategories(DEFAULT_CATEGORIES[defaultSettings.businessType]);
            showToast('All data has been reset.', 'success');
        }
    };
    
    const importData = (data: any) => {
        if(window.confirm('This will replace all current data. Are you sure?')) {
            try {
                if (data.products) setProducts(data.products);
                if (data.sales) setSales(data.sales);
                if (data.suppliers) setSuppliers(data.suppliers);
                if (data.expenses) setExpenses(data.expenses);
                if (data.customers) setCustomers(data.customers);
                if (data.purchases) setPurchases(data.purchases);
                if (data.customerPayments) setCustomerPayments(data.customerPayments);
                if (data.companyInfo) setCompanyInfo(data.companyInfo);
                if (data.systemSettings) setSystemSettings(data.systemSettings);
                if (data.categories) setCategories(data.categories);
                showToast('Data imported successfully!', 'success');
            } catch (e) {
                showToast('Invalid data file.', 'error');
                console.error("Import error:", e);
            }
        }
    };

    const selectDirectory = async (): Promise<string | null> => {
        try {
            if (!('showDirectoryPicker' in window)) {
                showToast('Your browser does not support this feature.', 'warning');
                return null;
            }
            const handle = await (window as any).showDirectoryPicker();
            await set('directoryHandle', handle);
            setDirectoryHandle(handle);
            showToast(`Folder "${handle.name}" selected.`, 'success');
            return handle.name;
        } catch (err: any) {
            if (err.name !== 'AbortError') { // User clicked cancel
                console.error('Error selecting directory:', err);
                if (err.message && err.message.toLowerCase().includes("cross origin")) {
                    showToast(t('folder_selection_disabled_in_environment'), 'warning');
                } else {
                    showToast('Could not select folder.', 'error');
                }
            }
            return null;
        }
    };

    const downloadBackup = (blob: Blob, fileName: string) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Backup file is downloading.', 'info');
    };

    const exportBackup = async () => {
        const data = { products, sales, suppliers, expenses, customers, companyInfo, systemSettings, categories, purchases, customerPayments };
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const fileName = `swift-pos-backup-${new Date().toISOString().split('T')[0]}.json`;

        if (directoryHandle) {
            try {
                // Verify permission, and if it's not granted, request it.
                // This is crucial for persistent access after the first selection.
                const permission = await directoryHandle.queryPermission({ mode: 'readwrite' });
                if (permission !== 'granted') {
                    if (await directoryHandle.requestPermission({ mode: 'readwrite' }) !== 'granted') {
                        showToast('Permission to write to folder was denied.', 'error');
                        // Fallback to standard download if permission is denied.
                        downloadBackup(blob, fileName);
                        return;
                    }
                }

                // Now that we have permission, create or overwrite the backup file.
                const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
                const writable = await fileHandle.createWritable();
                await writable.write(blob);
                await writable.close();
                showToast(`Backup saved to your selected folder: ${fileName}`, 'success');

            } catch (err) {
                console.error('Error saving to directory:', err);
                showToast('Failed to save to folder. Downloading instead.', 'error');
                downloadBackup(blob, fileName);
            }
        } else {
            // Standard download if no directory is selected.
            downloadBackup(blob, fileName);
        }
    };

    const value = {
        products, sales, suppliers, expenses, customers, companyInfo, systemSettings, categories, purchases, customerPayments,
        isInIframe,
        isFileSystemApiSupported,
        addProduct, updateProduct, deleteProduct,
        addSale, deleteSale,
        addSupplier, updateSupplier, deleteSupplier,
        addExpense, updateExpense, deleteExpense,
        addCustomer, updateCustomer, deleteCustomer,
        addCustomerPayment,
        saveCompanyInfo: setCompanyInfo,
        saveSystemSettings: setSystemSettings,
        addCategory, deleteCategory, updateCategory,
        showToast,
        resetAllData,
        importData,
        directoryHandle,
        selectDirectory,
        exportBackup,
    };

    return (
        <DataContext.Provider value={value}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </DataContext.Provider>
    );
};

// --- Custom Hook ---
export const useData = (): DataContextType => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};