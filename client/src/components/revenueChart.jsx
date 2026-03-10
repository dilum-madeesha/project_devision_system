import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const RevenueChart = () => {
  const data = [
    { project: 'P1', revenue: 4000, expenses: 2400 },
    { project: 'P2', revenue: 3500, expenses: 2200 },
    { project: 'P3', revenue: 4500, expenses: 2800 },
    { project: 'P4', revenue: 5200, expenses: 3100 },
    { project: 'P5', revenue: 5800, expenses: 3400 },
    { project: 'P6', revenue: 6200, expenses: 3800 },
    { project: 'P7', revenue: 6800, expenses: 4200 },
    { project: 'P8', revenue: 6500, expenses: 4000 },
    { project: 'P9', revenue: 7200, expenses: 4500 },
    { project: 'P10', revenue: 7800, expenses: 4800 },
    { project: 'P11', revenue: 8200, expenses: 5100 },
    { project: 'P12', revenue: 8800, expenses: 5500 },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="project" stroke="#6b7280" />
        <YAxis stroke="#6b7280" />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#fff', 
            border: '1px solid #e5e7eb',
            borderRadius: '8px'
          }}
        />
        <Legend />
        <Bar dataKey="expenses" fill="#9ca3af" radius={[8, 8, 0, 0]} />
        <Bar dataKey="revenue" fill="#3b82f6" radius={[8, 8, 0, 0]} />

      </BarChart>
    </ResponsiveContainer>
  );
};

export default RevenueChart;