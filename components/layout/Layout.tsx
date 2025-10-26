
import React, { useState, useEffect, ReactNode } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { ViewName } from '../../App';
import { useData } from '../../contexts/DataContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface LayoutProps {
    children: ReactNode;
    activeView: ViewName;
    setActiveView: (view: ViewName) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, setActiveView }) => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const { showToast } = useData();
    const { t } = useLanguage();

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            showToast('Connection restored', 'success');
        };
        const handleOffline = () => {
            setIsOnline(false);
            showToast('You are currently offline', 'warning');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [showToast]);

    const handleSetView = (view: ViewName) => {
        setActiveView(view);
        setSidebarOpen(false);
    }

    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar isOpen={isSidebarOpen} setView={handleSetView} closeSidebar={() => setSidebarOpen(false)} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header toggleSidebar={() => setSidebarOpen(p => !p)} activeView={activeView} setView={handleSetView} />
                
                {!isOnline && (
                    <div className="w-full bg-yellow-400 text-yellow-900 py-2 px-4 text-center text-sm font-semibold">
                        {t('You are currently offline. Changes are saved locally.')}
                    </div>
                )}

                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 p-4 sm:p-6">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
