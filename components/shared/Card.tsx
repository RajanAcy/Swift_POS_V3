
import React, { ReactNode } from 'react';

interface CardProps {
    title: string;
    children: ReactNode;
    className?: string;
}

const Card: React.FC<CardProps> = ({ title, children, className = '' }) => {
    return (
        <div className={`bg-white rounded-lg p-6 shadow-md ${className}`}>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
            {children}
        </div>
    );
};

export const StatCard: React.FC<{title: string; value: string; icon?: ReactNode; colorClass?: string;}> = ({title, value, icon, colorClass='text-[--primary-color]'}) => (
    <div className="bg-white rounded-lg p-6 shadow-md transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg">
        <div className="flex items-center justify-between">
            <div>
                <h3 className="text-sm font-medium text-gray-500">{title}</h3>
                <p className={`text-3xl font-bold mt-2 ${colorClass}`}>{value}</p>
            </div>
            {icon && <div className={`text-4xl ${colorClass} opacity-20`}>{icon}</div>}
        </div>
    </div>
);


export default Card;
