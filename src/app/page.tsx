'use client'

import { useState, useEffect } from 'react'
import GoogleSheetsStatusCard from '@/components/GoogleSheetsStatusCard'

interface SensorData {
  timestamp: string;
  distance: number;
  waterLevel: 'HIGH' | 'LOW';
  status: 'Normal' | 'Alert';
}

// Simple SensorCard component inline
function SensorCard({ title, value, status, icon, isLoading }: {
  title: string;
  value: string;
  status: 'normal' | 'warning';
  icon: string;
  isLoading: boolean;
}) {
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

// Simple DataChart component inline
function DataChart({ data }: { data: SensorData[] }) {
  const lastHourData = data.slice(-60);
  
  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Distance Readings (Last Hour)</h3>
        <div className="h-64 flex items-end space-x-1 overflow-x-auto">
          {lastHourData.map((reading, index) => (
            <div
              key={index}
              className={`bg-blue-500 min-w-[8px] rounded-t ${
                reading.distance < 20 ? 'bg-red-500' : 'bg-blue-500'
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

export default function Dashboard() {
  const [sensorData, setSensorData] = useState<SensorData[]>([])
  const [latestData, setLatestData] = useState<SensorData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Mock data for demonstration
  const mockData: SensorData[] = [
    {
      timestamp: new Date().toISOString(),
      distance: 175.2,
      waterLevel: 'LOW',
      status: 'Normal',
    },
    {
      timestamp: new Date(Date.now() - 30000).toISOString(),
      distance: 18.5,
      waterLevel: 'HIGH',
      status: 'Alert',
    },
    {
      timestamp: new Date(Date.now() - 60000).toISOString(),
      distance: 180.1,
      waterLevel: 'LOW',
      status: 'Normal',
    },
    {
      timestamp: new Date(Date.now() - 90000).toISOString(),
      distance: 15.2,
      waterLevel: 'LOW',
      status: 'Alert',
    },
    {
      timestamp: new Date(Date.now() - 120000).toISOString(),
      distance: 182.3,
      waterLevel: 'HIGH',
      status: 'Alert',
    },
  ];

  useEffect(() => {
    // Fetch data from Google Sheets
    fetchSensorData()
    
    // Set up periodic updates to check for new data from Google Sheets
    const interval = setInterval(() => {
      fetchSensorData()
    }, 30000) // Check every 30 seconds for new data
    
    return () => clearInterval(interval)
  }, [])

  const fetchSensorData = async () => {
    try {
      setIsLoading(true)
      // Fetch data from Google Sheets API
      const response = await fetch('/api/sensors')
      
      if (response.ok) {
        const data = await response.json()
        setSensorData(data)
        if (data.length > 0) {
          setLatestData(data[data.length - 1])
        }
        console.log(`Loaded ${data.length} records from Google Sheets`)
      } else {
        // Handle API errors (like Google Sheets not configured)
        const errorData = await response.json()
        console.error('Google Sheets API error:', errorData.error)
        setSensorData([])
        setLatestData(null)
      }
    } catch (error) {
      console.error('Network error connecting to Google Sheets:', error)
      setSensorData([])
      setLatestData(null)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Flood Detection System</h1>
            </div>
            <div className="flex space-x-4">
              <a 
                href="/" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </a>
              <a 
                href="/swagger" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium flex items-center"
              >
                📚 API Docs
              </a>
            </div>
          </div>
        </div>
      </nav>

      <div className="p-8">
        <div className="max-w-7xl mx-auto">
        
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <SensorCard
            title="Ultrasonic Distance"
            value={latestData?.distance ? `${latestData.distance.toFixed(1)} cm` : '--'}
            status={latestData?.distance && latestData.distance < 20 ? 'warning' : 'normal'}
            icon="📏"
            isLoading={isLoading}
          />
          
          <SensorCard
            title="Water Level"
            value={latestData?.waterLevel || '--'}
            status={latestData?.waterLevel === 'HIGH' ? 'warning' : 'normal'}
            icon="💧"
            isLoading={isLoading}
          />
          
          <SensorCard
            title="System Status"
            value={latestData?.status || 'Offline'}
            status={latestData?.status === 'Alert' ? 'warning' : 'normal'}
            icon="🚨"
            isLoading={isLoading}
          />

          <GoogleSheetsStatusCard />
        </div>

        {/* Data Visualization */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Real-time Data</h2>
          <DataChart data={sensorData} />
        </div>

        {/* Recent Data Table */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Recent Readings</h2>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left">Timestamp</th>
                  <th className="px-4 py-2 text-left">Distance (cm)</th>
                  <th className="px-4 py-2 text-left">Water Level</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {sensorData.length > 0 ? (
                  sensorData.slice(-10).reverse().map((data, index) => (
                    <tr key={index} className="border-b">
                      <td className="px-4 py-2">{new Date(data.timestamp).toLocaleString()}</td>
                      <td className="px-4 py-2">{data.distance.toFixed(1)}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-sm ${
                          data.waterLevel === 'HIGH' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {data.waterLevel}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-sm ${
                          data.status === 'Alert' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {data.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                      {isLoading ? 'Loading data from Google Sheets...' : 'No sensor data available. Please check Google Sheets connection.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Connection Status */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-lg">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
            <span className="text-blue-800 font-medium">
              Demo Mode Active - Connect ESP32 flood sensor for real-time monitoring
            </span>
          </div>
          <p className="text-gray-600 text-sm mt-2">
            Flood monitoring updates every 5 seconds • {sensorData.length} readings stored
          </p>
        </div>
        </div>
      </div>
    </div>
  )
}