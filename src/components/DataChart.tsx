import React from 'react';
import { SensorData } from '../types/sensor';

interface DataChartProps {
  data: SensorData[];
  floodThreshold?: number;
}

export default function DataChart({ data, floodThreshold = 12 }: DataChartProps) {
  // For now, we'll create a simple text-based chart
  // Later you can integrate with libraries like Recharts
  
  const lastHourData = data.slice(-60); // Last 60 readings (approx 30 minutes)
  
  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Distance Readings (Last Hour)</h3>
        <div className="h-64 flex items-end space-x-1 overflow-x-auto">
          {lastHourData.map((reading, index) => (
            <div
              key={index}
              className={`bg-blue-500 min-w-[8px] rounded-t ${
                reading.distance < floodThreshold ? 'bg-red-500' : 'bg-blue-500'
              }`}
              style={{
                height: `${Math.max((reading.distance / 200) * 100, 5)}%`,
              }}
              title={`${reading.distance}cm at ${new Date(reading.timestamp).toLocaleTimeString()}`}
            />
          ))}
        </div>
        <div className="flex justify-between text-sm text-gray-600 mt-2">
          <span>0cm</span>
          <span>Distance</span>
          <span>200cm+</span>
        </div>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Water Level Status</h3>
        <div className="flex space-x-2">
          {lastHourData.slice(-20).map((reading, index) => (
            <div
              key={index}
              className={`w-4 h-4 rounded-full ${
                reading.waterLevel === 'HIGH' ? 'bg-red-500' : 'bg-green-500'
              }`}
              title={`${reading.waterLevel} at ${new Date(reading.timestamp).toLocaleTimeString()}`}
            />
          ))}
        </div>
        <div className="flex justify-between text-sm text-gray-600 mt-2">
          <span className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
            Low
          </span>
          <span className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
            High
          </span>
        </div>
      </div>
    </div>
  );
}