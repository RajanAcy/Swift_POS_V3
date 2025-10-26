
import React from 'react';
import { ViewName } from '../../App';
import { useLanguage } from '../../contexts/LanguageContext';
import { DashboardIcon, ProductsIcon, SalesIcon, SuppliersIcon, ExpensesIcon, CustomersIcon, ReportsIcon, SettingsIcon } from '../shared/Icons';

interface SidebarProps {
    isOpen: boolean;
    setView: (view: ViewName) => void;
    closeSidebar: () => void;
}

const navItems: { view: ViewName; icon: React.FC<any>; }[] = [
    { view: 'dashboard', icon: DashboardIcon },
    { view: 'products', icon: ProductsIcon },
    { view: 'sales', icon: SalesIcon },
    { view: 'suppliers', icon: SuppliersIcon },
    { view: 'expenses', icon: ExpensesIcon },
    { view: 'customers', icon: CustomersIcon },
    { view: 'reports', icon: ReportsIcon },
    { view: 'settings', icon: SettingsIcon },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setView, closeSidebar }) => {
    const { t } = useLanguage();

    return (
        <>
            <div className={`fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={closeSidebar}></div>
            <div className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-40 transform transition-transform md:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-[--primary-color]">Menu</h2>
                    <button onClick={closeSidebar} aria-label="Close menu">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <nav className="p-4">
                    {navItems.map(({ view, icon: Icon }) => (
                        <button
                            key={view}
                            onClick={() => setView(view)}
                            className="w-full text-left py-2.5 px-4 rounded-lg mb-2 flex items-center text-gray-700 hover:bg-gray-100 hover:text-[--primary-color] transition-colors"
                        >
                            <Icon className="w-5 h-5 mr-3" />
                            {t(view)}
                        </button>
                    ))}
                </nav>
            </div>
        </>
    );
};

export default Sidebar;
