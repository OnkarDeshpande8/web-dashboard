export interface SensorData {
  timestamp: string;
  distance: number;
  waterLevel: 'HIGH' | 'LOW';
  status: 'Normal' | 'Alert';
}