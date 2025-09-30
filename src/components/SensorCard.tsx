import React from 'react';

interface SensorCardProps {
  title: string;
  value: string;
  status: 'normal' | 'warning';
  icon: string;
  isLoading: boolean;
}

export default function SensorCard({ title, value, status, icon, isLoading }: SensorCardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${
      status === 'warning' ? 'border-l-4 border-red-500' : 'border-l-4 border-green-500'
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold ${
            status === 'warning' ? 'text-red-600' : 'text-gray-900'
          }`}>
            {isLoading ? 'Loading...' : value}
          </p>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
      
      <div className="mt-4">
        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          status === 'warning' 
            ? 'bg-red-100 text-red-800' 
            : 'bg-green-100 text-green-800'
        }`}>
          {status === 'warning' ? 'Alert' : 'Normal'}
        </div>
      </div>
    </div>
  );
}