
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

interface DataPoint {
  name: string;
  [key: string]: string | number;
}

interface ChartProps {
  data: DataPoint[];
  title: string;
  dataKeys: Array<{
    key: string;
    color: string;
    name: string;
  }>;
  height?: number;
}

const Chart: React.FC<ChartProps> = ({ data, title, dataKeys, height = 300 }) => {
  return (
    <div className="bg-seguranca-graphite p-4 rounded-lg">
      <h3 className="font-medium mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#555" />
          <XAxis dataKey="name" stroke="#999" />
          <YAxis stroke="#999" />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#333', 
              border: '1px solid #555',
              borderRadius: '4px',
              color: '#ccc'
            }} 
          />
          <Legend />
          {dataKeys.map((dk) => (
            <Bar key={dk.key} dataKey={dk.key} name={dk.name} fill={dk.color} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Chart;
