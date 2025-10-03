import { NextRequest, NextResponse } from 'next/server';
import { googleSheetsService } from '@/lib/googleSheets';
import { SensorData } from '@/types/sensor';

// Mock data for testing - used as fallback when Google Sheets is not available
const mockData: SensorData[] = [
  {
    timestamp: new Date().toISOString(),
    distance: 175.2,
    waterLevel: 'LOW' as const,
    status: 'Normal' as const,
  },
  {
    timestamp: new Date(Date.now() - 30000).toISOString(),
    distance: 8.5, // < 12cm threshold - flood detected
    waterLevel: 'HIGH' as const,
    status: 'Alert' as const,
  },
  {
    timestamp: new Date(Date.now() - 60000).toISOString(),
    distance: 25.1, // > 12cm threshold - normal level
    waterLevel: 'LOW' as const,
    status: 'Normal' as const,
  },
];

// Helper function to calculate water level and status based on distance
function calculateWaterLevelAndStatus(distance: number): { waterLevel: 'HIGH' | 'LOW'; status: 'Normal' | 'Alert' } {
  // Configurable threshold - distances less than 12cm indicate high water level (flood detected)
  const FLOOD_THRESHOLD = 12; // cm - matches ESP32 sensor configuration
  
  if (distance < FLOOD_THRESHOLD) {
    return { waterLevel: 'HIGH', status: 'Alert' };
  } else {
    return { waterLevel: 'LOW', status: 'Normal' };
  }
}

/**
 * @swagger
 * /api/sensors:
 *   get:
 *     summary: Get flood sensor data
 *     description: Retrieve all flood sensor readings including ultrasonic distance measurements, water levels, and flood detection status
 *     tags:
 *       - Flood Sensors
 *     responses:
 *       200:
 *         description: Successfully retrieved sensor data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SensorData'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(request: NextRequest) {
  try {
    // Check if Google Sheets is configured and available
    if (googleSheetsService.isReady()) {
      try {
        // Fetch from Google Sheets only
        const sheetsData = await googleSheetsService.getSensorData(100);
        console.log(`Fetched ${sheetsData.length} records from Google Sheets`);
        return NextResponse.json(sheetsData);
      } catch (sheetsError) {
        console.error('Error fetching from Google Sheets:', sheetsError);
        return NextResponse.json(
          { error: 'Failed to fetch sensor data from Google Sheets. Please check the connection.' },
          { status: 500 }
        );
      }
    } else {
      console.log('Google Sheets not configured');
      return NextResponse.json(
        { error: 'Google Sheets not configured. Please check environment variables.' },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('Error fetching sensor data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sensor data' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/sensors:
 *   post:
 *     summary: Submit new flood sensor data
 *     description: Submit new flood sensor readings from ESP32 ultrasonic sensor. The system will automatically calculate water level and flood alert status based on distance threshold if not provided.
 *     tags:
 *       - Flood Sensors
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SensorDataInput'
 *           examples:
 *             normal_reading:
 *               summary: Normal water level - no flood risk
 *               value:
 *                 distance: 175.2
 *             flood_alert:
 *               summary: Flood alert - high water level detected
 *               value:
 *                 distance: 18.5
 *                 waterLevel: "HIGH"
 *                 status: "Alert"
 *     responses:
 *       200:
 *         description: Successfully saved sensor data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function POST(request: NextRequest) {
  try {
    // Check if request has a body
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 400 }
      );
    }

    // Parse JSON with error handling
    let rawData;
    try {
      rawData = await request.json();
    } catch (error) {
      console.error('JSON parsing error:', error);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    // Validate required field
    if (typeof rawData.distance !== 'number') {
      return NextResponse.json(
        { error: 'Distance is required and must be a number' },
        { status: 400 }
      );
    }

    // Calculate water level and status if not provided
    const calculated = calculateWaterLevelAndStatus(rawData.distance);
    
    // Handle timestamp validation and conversion
    let timestamp: string;
    if (rawData.timestamp) {
      try {
        // If timestamp is a number (like Unix timestamp in milliseconds or seconds)
        if (typeof rawData.timestamp === 'number') {
          // Handle both seconds and milliseconds timestamps
          let ts: number;
          if (rawData.timestamp < 10000000000) {
            // Seems like seconds timestamp
            ts = rawData.timestamp * 1000;
          } else {
            // Seems like milliseconds timestamp
            ts = rawData.timestamp;
          }
          
          const testDate = new Date(ts);
          // Check if the resulting date is reasonable (after year 2020)
          if (testDate.getFullYear() < 2020) {
            console.warn('Timestamp too old (before 2020):', rawData.timestamp, 'converted to:', testDate.toISOString(), 'using current time instead');
            timestamp = new Date().toISOString();
          } else {
            timestamp = testDate.toISOString();
          }
        } else {
          // Try to parse as date string
          const parsedDate = new Date(rawData.timestamp);
          if (isNaN(parsedDate.getTime()) || parsedDate.getFullYear() < 2020) {
            // Invalid date, use current time
            console.warn('Invalid timestamp received:', rawData.timestamp, 'using current time');
            timestamp = new Date().toISOString();
          } else {
            timestamp = parsedDate.toISOString();
          }
        }
      } catch (error) {
        console.error('Error parsing timestamp:', rawData.timestamp, error);
        timestamp = new Date().toISOString();
      }
    } else {
      timestamp = new Date().toISOString();
    }
    
    const sensorData: SensorData = {
      timestamp,
      distance: rawData.distance,
      waterLevel: rawData.waterLevel || calculated.waterLevel,
      status: rawData.status || calculated.status,
    };
    
    console.log('Received flood sensor data:', sensorData);

    // Try to save to Google Sheets if configured
    if (googleSheetsService.isReady()) {
      try {
        await googleSheetsService.saveSensorData(sensorData);
        console.log('Sensor data saved to Google Sheets successfully');
        
        return NextResponse.json({ 
          success: true, 
          message: 'Sensor data saved to Google Sheets',
          data: sensorData 
        });
      } catch (sheetsError) {
        console.error('Error saving to Google Sheets:', sheetsError);
        
        // Return success but indicate Google Sheets issue
        return NextResponse.json({ 
          success: true, 
          message: 'Sensor data received but not saved to Google Sheets',
          data: sensorData,
          warning: 'Google Sheets integration failed' 
        });
      }
    } else {
      console.log('Google Sheets not configured - sensor data received but not persisted');
      
      return NextResponse.json({ 
        success: true, 
        message: 'Sensor data received (Google Sheets not configured)',
        data: sensorData 
      });
    }
    
  } catch (error) {
    console.error('Error processing sensor data:', error);
    return NextResponse.json(
      { error: 'Failed to process sensor data' },
      { status: 500 }
    );
  }
}