
import React from 'react';
import { ViewName } from '../../App';
import { useLanguage } from '../../contexts/LanguageContext';
import { DashboardIcon, ProductsIcon, SalesIcon, SuppliersIcon, ExpensesIcon, CustomersIcon, ReportsIcon, SettingsIcon } from '../shared/Icons';

interface HeaderProps {
    toggleSidebar: () => void;
    activeView: ViewName;
    setView: (view: ViewName) => void;
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

const Header: React.FC<HeaderProps> = ({ toggleSidebar, activeView, setView }) => {
    const { t } = useLanguage();

    const NavButton: React.FC<{ view: ViewName; icon: React.FC<any> }> = ({ view, icon: Icon }) => (
        <button
            onClick={() => setView(view)}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md hover:bg-gray-100 transition-colors duration-200 ${activeView === view ? 'active-tab' : 'text-gray-600'}`}
        >
            <Icon className="w-5 h-5 mr-2" />
            {t(view)}
        </button>
    );

    return (
        <header className="w-full bg-white shadow-md z-10">
            <div className="mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <button onClick={toggleSidebar} className="md:hidden p-2 rounded-md text-gray-600 hover:text-white hover:bg-[--primary-color]">
                            <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <h1 className="text-xl font-bold text-[--primary-color] ml-4 md:ml-0">Swift POS</h1>
                    </div>

                    <nav className="hidden md:flex justify-center space-x-1" aria-label="Main navigation">
                        {navItems.map(item => <NavButton key={item.view} {...item} />)}
                    </nav>

                    <div className="md:hidden">
                        <select
                            value={activeView}
                            onChange={(e) => setView(e.target.value as ViewName)}
                            className="w-full p-2 text-sm font-medium border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--primary-color]"
                        >
                            {navItems.map(item => <option key={item.view} value={item.view}>{t(item.view)}</option>)}
                        </select>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
