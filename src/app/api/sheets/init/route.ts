import { NextResponse } from 'next/server';
import { googleSheetsService } from '@/lib/googleSheets';

/**
 * @swagger
 * /api/sheets/init:
 *   post:
 *     summary: Initialize Google Sheet for flood detection
 *     description: Initialize the Google Sheet with proper headers for storing flood sensor data
 *     tags:
 *       - Google Sheets
 *     responses:
 *       200:
 *         description: Google Sheet initialized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - success
 *                 - message
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Whether initialization was successful
 *                   example: true
 *                 message:
 *                   type: string
 *                   description: Success message
 *                   example: "Google Sheet initialized successfully"
 *       400:
 *         description: Google Sheets not configured
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
export async function POST() {
  try {
    if (!googleSheetsService.isReady()) {
      return NextResponse.json(
        { error: 'Google Sheets not configured. Please check environment variables.' },
        { status: 400 }
      );
    }

    await googleSheetsService.initializeSheet();
    
    return NextResponse.json({
      success: true,
      message: 'Google Sheet initialized successfully with headers for flood detection data',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error initializing Google Sheet:', error);
    return NextResponse.json(
      { error: 'Failed to initialize Google Sheet' },
      { status: 500 }
    );
  }
}