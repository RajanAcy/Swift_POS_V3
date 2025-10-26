import React, { useState, useMemo, useEffect } from 'react';
import { DataProvider } from './contexts/DataContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Layout from './components/layout/Layout';
import Dashboard from './components/views/Dashboard';
import Products from './components/views/Products';
import Sales from './components/views/Sales';
import Suppliers from './components/views/Suppliers';
import Expenses from './components/views/Expenses';
import Customers from './components/views/Customers';
import Reports from './components/views/Reports';
import Settings from './components/views/Settings';

export type ViewName = 'dashboard' | 'products' | 'sales' | 'suppliers' | 'expenses' | 'customers' | 'reports' | 'settings';

const App: React.FC = () => {
    const [activeView, setActiveView] = useState<ViewName>('dashboard');

    useEffect(() => {
        if ('serviceWorker' in navigator) {
            const registerServiceWorker = () => {
                const swPath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1) + 'sw.js';
                navigator.serviceWorker.register(swPath)
                    .then(registration => {
                        console.log('ServiceWorker registration successful with scope: ', registration.scope);
                    })
                    .catch(err => {
                        console.error('Service worker registration failed:', err);
                    });
            };

            if (document.readyState === 'complete') {
                registerServiceWorker();
            } else {
                window.addEventListener('load', registerServiceWorker);
                return () => window.removeEventListener('load', registerServiceWorker);
            }
        }
    }, []);

    const viewComponent = useMemo(() => {
        switch (activeView) {
            case 'dashboard': return <Dashboard />;
            case 'products': return <Products />;
            case 'sales': return <Sales />;
            case 'suppliers': return <Suppliers />;
            case 'expenses': return <Expenses />;
            case 'customers': return <Customers />;
            case 'reports': return <Reports />;
            case 'settings': return <Settings />;
            default: return <Dashboard />;
        }
    }, [activeView]);

    return (
        <LanguageProvider>
            <DataProvider>
                <Layout activeView={activeView} setActiveView={setActiveView}>
                    {viewComponent}
                </Layout>
            </DataProvider>
        </LanguageProvider>
    );
};

export default App;