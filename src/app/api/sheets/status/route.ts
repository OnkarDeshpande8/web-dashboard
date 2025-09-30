import { NextResponse } from 'next/server';
import { googleSheetsService } from '@/lib/googleSheets';

/**
 * @swagger
 * /api/sheets/status:
 *   get:
 *     summary: Get Google Sheets connection status
 *     description: Check the connection status and configuration of Google Sheets integration
 *     tags:
 *       - Google Sheets
 *     responses:
 *       200:
 *         description: Google Sheets connection status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - connected
 *               properties:
 *                 connected:
 *                   type: boolean
 *                   description: Whether Google Sheets is connected and accessible
 *                   example: true
 *                 sheetId:
 *                   type: string
 *                   description: The Google Sheet ID being used (if configured)
 *                   example: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
 *                 error:
 *                   type: string
 *                   description: Error message if connection failed
 *                   example: "Google Sheets not configured"
 *                 configStatus:
 *                   type: object
 *                   properties:
 *                     hasSheetId:
 *                       type: boolean
 *                       description: Whether GOOGLE_SHEET_ID is configured
 *                     hasClientEmail:
 *                       type: boolean
 *                       description: Whether GOOGLE_CLIENT_EMAIL is configured
 *                     hasPrivateKey:
 *                       type: boolean
 *                       description: Whether GOOGLE_PRIVATE_KEY is configured
 */
export async function GET() {
  try {
    const status = await googleSheetsService.getConnectionStatus();
    
    // Add configuration status details
    const configStatus = {
      hasSheetId: !!process.env.GOOGLE_SHEET_ID,
      hasClientEmail: !!process.env.GOOGLE_CLIENT_EMAIL,
      hasPrivateKey: !!process.env.GOOGLE_PRIVATE_KEY,
    };

    return NextResponse.json({
      ...status,
      configStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error checking Google Sheets status:', error);
    return NextResponse.json(
      { 
        connected: false,
        error: 'Failed to check Google Sheets status',
        configStatus: {
          hasSheetId: !!process.env.GOOGLE_SHEET_ID,
          hasClientEmail: !!process.env.GOOGLE_CLIENT_EMAIL,
          hasPrivateKey: !!process.env.GOOGLE_PRIVATE_KEY,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}