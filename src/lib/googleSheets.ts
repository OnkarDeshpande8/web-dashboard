import { google } from 'googleapis';
import { SensorData } from '@/types/sensor';

// Google Sheets configuration
const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

// Initialize Google Sheets API with explicit authentication
let auth: any;
let sheets: any;

if (GOOGLE_CLIENT_EMAIL && GOOGLE_PRIVATE_KEY) {
  try {
    // Create JWT auth with proper configuration
    auth = new google.auth.JWT({
      email: GOOGLE_CLIENT_EMAIL,
      key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Ensure proper line breaks
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file'
      ]
    });
    
    // Set auth to auto-refresh tokens
    auth.authorize();
    
    sheets = google.sheets({ version: 'v4', auth });
    
    console.log('Google Sheets authentication initialized successfully');
  } catch (error) {
    console.error('Error initializing Google Sheets auth:', error);
  }
}

export class GoogleSheetsService {
  private static instance: GoogleSheetsService;
  private isConfigured: boolean;

  constructor() {
    this.isConfigured = !!(SHEET_ID && GOOGLE_CLIENT_EMAIL && GOOGLE_PRIVATE_KEY);
    if (!this.isConfigured) {
      console.warn('Google Sheets not configured. Missing environment variables.');
      console.warn('Required: GOOGLE_SHEET_ID, GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY');
      console.warn('Has Sheet ID:', !!SHEET_ID);
      console.warn('Has Client Email:', !!GOOGLE_CLIENT_EMAIL);
      console.warn('Has Private Key:', !!GOOGLE_PRIVATE_KEY);
    } else {
      console.log('Google Sheets configured with Sheet ID:', SHEET_ID?.substring(0, 10) + '...');
      console.log('Service Account:', GOOGLE_CLIENT_EMAIL);
      console.log('Private Key Length:', GOOGLE_PRIVATE_KEY?.length || 0);
    }
  }

  static getInstance(): GoogleSheetsService {
    if (!GoogleSheetsService.instance) {
      GoogleSheetsService.instance = new GoogleSheetsService();
    }
    return GoogleSheetsService.instance;
  }

  isReady(): boolean {
    return this.isConfigured;
  }

  /**
   * Initialize the Google Sheet with headers if it doesn't exist
   */
  async initializeSheet(): Promise<void> {
    if (!this.isConfigured) {
      throw new Error('Google Sheets not configured');
    }

    try {
      // Ensure authentication before making request
      await auth.authorize();
      
      // Check if sheet exists and has headers
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: 'Sheet1!A1:D1',
      });

      const headers = response.data.values?.[0];
      if (!headers || headers.length === 0) {
        // Add headers if they don't exist
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: 'Sheet1!A1:D1',
          valueInputOption: 'RAW',
          requestBody: {
            values: [['Timestamp', 'Distance (cm)', 'Water Level', 'Status']],
          },
        });
        console.log('Google Sheet initialized with headers');
      }
    } catch (error) {
      console.error('Error initializing Google Sheet:', error);
      throw new Error('Failed to initialize Google Sheet');
    }
  }

  /**
   * Save sensor data to Google Sheets
   */
  async saveSensorData(data: Omit<SensorData, 'timestamp'> & { timestamp?: string }): Promise<void> {
    if (!this.isConfigured) {
      throw new Error('Google Sheets not configured');
    }

    try {
      // Ensure authentication before making request
      await auth.authorize();
      
      const timestamp = data.timestamp || new Date().toISOString();
      // Format timestamp for Google Sheets
      const formattedTimestamp = new Date(timestamp).toLocaleString('en-US', {
        timeZone: process.env.TIMEZONE || 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true, // Use 12-hour format with AM/PM
      });

      const values = [
        [
          formattedTimestamp,
          data.distance,
          data.waterLevel,
          data.status,
        ],
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: 'Sheet1!A:D',
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values,
        },
      });

      console.log('Sensor data saved to Google Sheets:', data);
    } catch (error) {
      console.error('Error saving to Google Sheets:', error);
      throw new Error('Failed to save sensor data to Google Sheets');
    }
  }

  /**
   * Retrieve sensor data from Google Sheets
   */
  async getSensorData(limit: number = 100): Promise<SensorData[]> {
    if (!this.isConfigured) {
      throw new Error('Google Sheets not configured');
    }

    try {
      // Ensure authentication before making request
      await auth.authorize();
      
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: 'Sheet1!A:D',
      });

      const rows = response.data.values;
      if (!rows || rows.length <= 1) {
        return []; // No data or only headers
      }

      // Skip header row and convert to SensorData objects
      const sensorData: SensorData[] = rows
        .slice(1) // Skip header
        .slice(-limit) // Get latest entries
        .map((row) => {
          const [timestampStr, distanceStr, waterLevel, status] = row;
          
          return {
            timestamp: timestampStr,
            distance: parseFloat(distanceStr) || 0,
            waterLevel: (waterLevel as 'HIGH' | 'LOW') || 'LOW',
            status: (status as 'Normal' | 'Alert') || 'Normal',
          };
        })
        .filter((data) => !isNaN(data.distance)); // Filter out invalid entries

      return sensorData.reverse(); // Most recent first
    } catch (error: any) {
      console.error('Error fetching from Google Sheets:', error);
      
      if (error.code === 403) {
        throw new Error('Google Sheets access denied. Please check: 1) Sheet is shared with service account email, 2) Service account has Editor permissions, 3) Google Sheets API is enabled');
      } else if (error.code === 404) {
        throw new Error('Google Sheet not found. Please check the GOOGLE_SHEET_ID environment variable');
      } else if (error.message?.includes('PERMISSION_DENIED')) {
        throw new Error('Permission denied. Please share the Google Sheet with the service account email and grant Editor access');
      }
      
      throw new Error(`Failed to fetch sensor data from Google Sheets: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Get the latest sensor reading from Google Sheets
   */
  async getLatestSensorData(): Promise<SensorData | null> {
    const data = await this.getSensorData(1);
    return data.length > 0 ? data[0] : null;
  }

  /**
   * Clear all sensor data from Google Sheets (keep headers)
   */
  async clearSensorData(): Promise<void> {
    if (!this.isConfigured) {
      throw new Error('Google Sheets not configured');
    }

    try {
      await sheets.spreadsheets.values.clear({
        spreadsheetId: SHEET_ID,
        range: 'Sheet1!A2:D',
      });

      console.log('Sensor data cleared from Google Sheets');
    } catch (error) {
      console.error('Error clearing Google Sheets:', error);
      throw new Error('Failed to clear sensor data from Google Sheets');
    }
  }

  /**
   * Test authentication explicitly
   */
  async testAuthentication(): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured) {
      return {
        success: false,
        error: 'Google Sheets not configured. Missing environment variables.',
      };
    }

    try {
      // First, try to authenticate
      await auth.authorize();
      console.log('Authentication successful');
      return { success: true };
    } catch (error: any) {
      console.error('Authentication failed:', error);
      return {
        success: false,
        error: `Authentication failed: ${error.message || 'Unknown error'}`,
      };
    }
  }

  /**
   * Get Google Sheets connection status
   */
  async getConnectionStatus(): Promise<{ connected: boolean; sheetId?: string; error?: string }> {
    if (!this.isConfigured) {
      return {
        connected: false,
        error: 'Google Sheets not configured. Missing environment variables.',
      };
    }

    try {
      // First test authentication
      const authTest = await this.testAuthentication();
      if (!authTest.success) {
        return {
          connected: false,
          sheetId: SHEET_ID,
          error: authTest.error,
        };
      }

      // Test connection by getting sheet metadata
      const response = await sheets.spreadsheets.get({
        spreadsheetId: SHEET_ID,
      });

      return {
        connected: true,
        sheetId: SHEET_ID,
      };
    } catch (error: any) {
      let errorMessage = 'Unknown error';
      
      if (error.code === 403) {
        errorMessage = 'Access denied. Please share the sheet with the service account email and grant Editor permissions.';
      } else if (error.code === 404) {
        errorMessage = 'Sheet not found. Please check the GOOGLE_SHEET_ID.';
      } else if (error.message?.includes('PERMISSION_DENIED')) {
        errorMessage = 'Permission denied. Sheet not shared with service account.';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      return {
        connected: false,
        sheetId: SHEET_ID,
        error: errorMessage,
      };
    }
  }

  /**
   * Clear all data from Google Sheets (keeping headers)
   */
  async clearData(): Promise<void> {
    if (!this.isConfigured) {
      throw new Error('Google Sheets not configured');
    }

    try {
      // Ensure authentication before making request
      await auth.authorize();
      
      // Clear all data except headers (row 1)
      await sheets.spreadsheets.values.clear({
        spreadsheetId: SHEET_ID,
        range: 'Sheet1!A2:Z1000', // Clear from row 2 onwards
      });

      console.log('Google Sheets data cleared (headers preserved)');
    } catch (error) {
      console.error('Error clearing Google Sheets data:', error);
      throw new Error('Failed to clear Google Sheets data');
    }
  }
}

// Export singleton instance
export const googleSheetsService = GoogleSheetsService.getInstance();