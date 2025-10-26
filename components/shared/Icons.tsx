
import React from 'react';

const createIcon = (path: React.ReactNode): React.FC<{ className?: string }> => ({ className = 'w-6 h-6' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}>
        {path}
    </svg>
);

export const DashboardIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12A2.25 2.25 0 0020.25 14.25V3m-15.75 0h15.75M3.75 0v.01M3.75 21v.01M20.25 21v.01" />);
export const ProductsIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h15.75" />);
export const SalesIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 21z" />);
export const SuppliersIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125V14.25m-17.25 4.5v-1.875a3.375 3.375 0 003.375-3.375h9.75a3.375 3.375 0 003.375 3.375v1.875" />);
export const ExpensesIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.75A.75.75 0 013 4.5h.75m0 0H21m-9 12.75h9m-9 3.75h9M3.75 6.75h16.5M3.75 9.75h16.5m0 0A2.25 2.25 0 0121 12v3.75a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 15.75V12A2.25 2.25 0 013.75 9.75z" />);
export const CustomersIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-4.663l.005-.004c.85.85 1.844 1.464 2.943 1.765" />);
export const ReportsIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h15.75c.621 0 1.125.504 1.125 1.125v6.75c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 013 19.875v-6.75zM3 8.625c0-.621.504-1.125 1.125-1.125h15.75c.621 0 1.125.504 1.125 1.125v.375c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 013 9V8.625zM3 4.125c0-.621.504-1.125 1.125-1.125h15.75C20.496 3 21 3.504 21 4.125v.375c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 013 4.5V4.125z" />);
export const SettingsIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-1.004 1.11-.962a8.25 8.25 0 015.56 5.56c.041.55-.422 1.02-1.022.962-.596-.06-1.04-.54-1.11-1.042A6.252 6.252 0 009.594 3.94zM4.5 13.5a8.25 8.25 0 018.25-8.25H15a8.25 8.25 0 01-8.25 8.25V13.5z" />);
