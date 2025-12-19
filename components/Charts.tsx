import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface Props {
  probability: number;
}

export const DelayGauge: React.FC<Props> = ({ probability }) => {
  const data = [
    { name: 'Delay Chance', value: probability },
    { name: 'On Time Chance', value: 100 - probability },
  ];

  const getColor = (prob: number) => {
    if (prob < 30) return '#10b981'; // Green
    if (prob < 70) return '#f59e0b'; // Orange
    return '#ef4444'; // Red
  };

  const COLORS = [getColor(probability), '#e2e8f0'];

  return (
    <div className="h-48 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
            <Pie
                data={data}
                cx="50%"
                cy="70%"
                startAngle={180}
                endAngle={0}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={0}
                dataKey="value"
                stroke="none"
            >
                {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
            </Pie>
            <Tooltip />
            </PieChart>
        </ResponsiveContainer>
        <div className="absolute top-[65%] left-1/2 transform -translate-x-1/2 text-center">
            <span className="text-3xl font-bold text-slate-800">{probability}%</span>
            <p className="text-xs text-slate-500 uppercase font-semibold">Risk Level</p>
        </div>
    </div>
  );
};