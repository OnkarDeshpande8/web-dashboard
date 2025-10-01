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
    <div className={`bg-white rounded-lg shadow-lg p-4 sm:p-6 ${
      status === 'warning' ? 'border-l-4 border-red-500' : 'border-l-4 border-green-500'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-600 truncate">{title}</p>
          <p className={`text-xl sm:text-2xl font-bold ${
            status === 'warning' ? 'text-red-600' : 'text-gray-900'
          }`}>
            {isLoading ? 'Loading...' : value}
          </p>
        </div>
        <div className="text-2xl sm:text-3xl ml-2">{icon}</div>
      </div>
      
      <div className="mt-3 sm:mt-4">
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
  // Data is already in descending order (newest first), so reverse for chart display (oldest to newest)
  const lastHourData = data.slice(0, 60).reverse();
  
  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
        <h3 className="text-base sm:text-lg font-semibold mb-2">Distance Readings (Last Hour)</h3>
        <div className="h-48 sm:h-64 flex items-end space-x-1 overflow-x-auto">
          {lastHourData.map((reading, index) => (
            <div
              key={index}
              className={`min-w-[6px] sm:min-w-[8px] rounded-t ${
                reading.distance < 20 ? 'bg-red-500' : 'bg-blue-500'
              }`}
              style={{
                height: `${Math.max((reading.distance / 200) * 100, 5)}%`,
              }}
              title={`${reading.distance}cm at ${new Date(reading.timestamp).toLocaleTimeString()}`}
            />
          ))}
        </div>
        <div className="flex justify-between text-xs sm:text-sm text-gray-600 mt-2">
          <span>0cm</span>
          <span className="hidden sm:inline">Distance</span>
          <span>200cm+</span>
        </div>
      </div>
      
      <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
        <h3 className="text-base sm:text-lg font-semibold mb-2">Water Level Status</h3>
        <div className="flex space-x-1 sm:space-x-2 overflow-x-auto">
          {lastHourData.slice(-20).map((reading, index) => (
            <div
              key={index}
              className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0 ${
                reading.waterLevel === 'HIGH' ? 'bg-red-500' : 'bg-green-500'
              }`}
              title={`${reading.waterLevel} at ${new Date(reading.timestamp).toLocaleTimeString()}`}
            />
          ))}
        </div>
        <div className="flex justify-between text-xs sm:text-sm text-gray-600 mt-2">
          <span className="flex items-center">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full mr-1"></div>
            Low
          </span>
          <span className="flex items-center">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full mr-1"></div>
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
  const [currentPage, setCurrentPage] = useState(1)
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(false) // Auto-refresh toggle
  const recordsPerPage = 10

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
    
    // Set up periodic updates to check for new data from Google Sheets only if auto-refresh is enabled
    let interval: NodeJS.Timeout | null = null
    
    if (isAutoRefreshEnabled) {
      interval = setInterval(() => {
        fetchSensorData()
      }, 10000) // Check every 10 seconds for new data
    }
    
    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isAutoRefreshEnabled])

  const fetchSensorData = async () => {
    try {
      setIsLoading(true)
      // Fetch data from Google Sheets API
      const response = await fetch('/api/sensors')
      
      if (response.ok) {
        const data = await response.json()
        setSensorData(data) // Data is already in descending order (newest first)
        if (data.length > 0) {
          setLatestData(data[0]) // First item is the latest/newest data
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

  // Pagination helper functions
  const getTotalPages = () => Math.ceil(sensorData.length / recordsPerPage)
  
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * recordsPerPage
    const endIndex = startIndex + recordsPerPage
    return sensorData.slice(startIndex, endIndex)
  }

  const getPageNumbers = () => {
    const totalPages = getTotalPages()
    const pages: (number | string)[] = []
    
    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Show first page, current page area, and last page with ellipsis
      pages.push(1)
      
      if (currentPage > 3) {
        pages.push('...')
      }
      
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...')
      }
      
      if (totalPages > 1) {
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 space-y-2 sm:space-y-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Flood Detection System</h1>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <a 
                href="/" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium text-center sm:text-left"
              >
                Dashboard
              </a>
              <a 
                href="/documentation" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium flex items-center justify-center sm:justify-start"
              >
                📄 Documentation
              </a>
              <a 
                href="/swagger" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium flex items-center justify-center sm:justify-start"
              >
                📚 API Docs
              </a>
            </div>
          </div>
        </div>
      </nav>

      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
        
        {/* Auto-Refresh Toggle */}
        <div className="mb-6 flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <h2 className="text-lg font-semibold text-gray-900">Sensor System Control</h2>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => setIsAutoRefreshEnabled(!isAutoRefreshEnabled)}
                className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                  isAutoRefreshEnabled
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                }`}
              >
                <div className={`w-3 h-3 rounded-full ${
                  isAutoRefreshEnabled ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span>
                  {isAutoRefreshEnabled ? 'Auto-Refresh ON' : 'Auto-Refresh OFF'}
                </span>
              </button>
              {!isAutoRefreshEnabled && (
                <button
                  onClick={fetchSensorData}
                  disabled={isLoading}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-100 text-blue-800 hover:bg-blue-200 rounded-lg font-medium transition-colors disabled:opacity-50 text-sm"
                >
                  <span>🔄</span>
                  <span>{isLoading ? 'Refreshing...' : 'Manual Refresh'}</span>
                </button>
              )}
            </div>
          </div>
          <div className="text-sm text-gray-500 text-center lg:text-right">
            {isAutoRefreshEnabled ? 'Fetching data every 10 seconds' : 'Manual refresh only'}
          </div>
        </div>
        
        {/* Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
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

          <GoogleSheetsStatusCard 
            isAutoRefreshEnabled={isAutoRefreshEnabled}
            onManualRefresh={fetchSensorData}
          />
        </div>

        {/* Data Visualization */}
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4">Real-time Data</h2>
          <DataChart data={sensorData} />
        </div>

        {/* Recent Data Table */}
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-2 sm:space-y-0">
            <h2 className="text-xl sm:text-2xl font-semibold">Recent Readings</h2>
            {sensorData.length > 0 && (
              <div className="text-sm text-gray-500">
                Total: {sensorData.length} records
              </div>
            )}
          </div>
          
          {/* Mobile Card View */}
          <div className="block sm:hidden space-y-4">
            {sensorData.length > 0 ? (
              getCurrentPageData().map((data, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 border">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{new Date(data.timestamp).toLocaleDateString()}</span>
                      <span className="text-xs text-gray-500">{new Date(data.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <span className="font-mono text-lg font-bold">{data.distance.toFixed(1)}cm</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      data.waterLevel === 'HIGH' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      💧 {data.waterLevel}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      data.status === 'Alert' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      🚨 {data.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                {isLoading ? 'Loading data from Google Sheets...' : 'No sensor data available. Please check Google Sheets connection.'}
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-3 sm:px-4 py-2 text-left text-sm font-medium text-gray-900">Timestamp (Latest First)</th>
                  <th className="px-3 sm:px-4 py-2 text-left text-sm font-medium text-gray-900">Distance (cm)</th>
                  <th className="px-3 sm:px-4 py-2 text-left text-sm font-medium text-gray-900">Water Level</th>
                  <th className="px-3 sm:px-4 py-2 text-left text-sm font-medium text-gray-900">Status</th>
                </tr>
              </thead>
              <tbody>
                {sensorData.length > 0 ? (
                  getCurrentPageData().map((data, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="px-3 sm:px-4 py-2">
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{new Date(data.timestamp).toLocaleDateString()}</span>
                          <span className="text-xs text-gray-500">{new Date(data.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-2">
                        <span className="font-mono text-sm">{data.distance.toFixed(1)}</span>
                      </td>
                      <td className="px-3 sm:px-4 py-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          data.waterLevel === 'HIGH' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {data.waterLevel}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 py-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          data.status === 'Alert' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {data.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-3 sm:px-4 py-8 text-center text-gray-500 text-sm">
                      {isLoading ? 'Loading data from Google Sheets...' : 'No sensor data available. Please check Google Sheets connection.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {sensorData.length > recordsPerPage && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-6 pt-4 border-t border-gray-200 space-y-4 sm:space-y-0">
              <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
                Showing {((currentPage - 1) * recordsPerPage) + 1} to {Math.min(currentPage * recordsPerPage, sensorData.length)} of {sensorData.length} entries
              </div>
              
              <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium ${
                    currentPage === 1 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-blue-500 text-white hover:bg-blue-600 cursor-pointer'
                  }`}
                >
                  <span className="hidden sm:inline">Previous</span>
                  <span className="sm:hidden">‹</span>
                </button>
                
                <div className="flex items-center space-x-1">
                  {getPageNumbers().map((pageNum, index) => (
                    <button
                      key={index}
                      onClick={() => typeof pageNum === 'number' ? setCurrentPage(pageNum) : null}
                      disabled={pageNum === '...'}
                      className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium ${
                        pageNum === currentPage
                          ? 'bg-blue-500 text-white'
                          : pageNum === '...'
                          ? 'text-gray-400 cursor-default'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, getTotalPages()))}
                  disabled={currentPage === getTotalPages()}
                  className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium ${
                    currentPage === getTotalPages()
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600 cursor-pointer'
                  }`}
                >
                  <span className="hidden sm:inline">Next</span>
                  <span className="sm:hidden">›</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Connection Status */}
        <div className="mt-6 sm:mt-8 text-center">
          <div className="inline-flex items-center px-3 sm:px-4 py-2 bg-blue-100 rounded-lg mx-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
            <span className="text-blue-800 font-medium text-sm sm:text-base">
              <span className="hidden sm:inline">Demo Mode Active - Connect ESP32 flood sensor for real-time monitoring</span>
              <span className="sm:hidden">Demo Mode - ESP32 Connected</span>
            </span>
          </div>
          <p className="text-gray-600 text-xs sm:text-sm mt-2 mx-2">
            <span className="hidden sm:inline">Flood monitoring updates every 10 seconds • {sensorData.length} readings stored • Latest: {latestData ? new Date(latestData.timestamp).toLocaleString() : 'No data'}</span>
            <span className="sm:hidden">{sensorData.length} readings • Latest: {latestData ? new Date(latestData.timestamp).toLocaleTimeString() : 'No data'}</span>
          </p>
        </div>
        </div>
      </div>
    </div>
  )
}