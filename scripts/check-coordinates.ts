import { PrismaClient } from '@prisma/client';

/**
 * Script to check all reports in the database for invalid coordinates
 * 
 * This script identifies reports with coordinates that are:
 * 1. Outside Bengaluru boundaries
 * 2. Swapped (lat/lng reversed)
 * 3. Invalid (NaN, null, etc.)
 */

const prisma = new PrismaClient();

// Bengaluru city boundaries (approximate)
const BENGALURU_BOUNDS = {
  lat: { min: 12.8, max: 13.2 },
  lng: { min: 77.4, max: 77.8 }
};

interface ValidationResult {
  reportId: string;
  description: string;
  lat: number;
  lng: number;
  issues: string[];
}

async function checkCoordinates() {
  console.log('Checking all reports for coordinate issues...\n');
  
  try {
    const reports = await prisma.report.findMany({
      select: {
        id: true,
        description: true,
        lat: true,
        lng: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (reports.length === 0) {
      console.log('No reports found in database.');
      return;
    }

    console.log(`Found ${reports.length} report(s) in database.\n`);

    const invalidReports: ValidationResult[] = [];
    let validCount = 0;

    for (const report of reports) {
      const issues: string[] = [];

      // Check for NaN or invalid numbers
      if (isNaN(report.lat) || isNaN(report.lng)) {
        issues.push('Coordinates are NaN');
      }

      // Check if coordinates are within Bengaluru bounds
      if (report.lat < BENGALURU_BOUNDS.lat.min || report.lat > BENGALURU_BOUNDS.lat.max) {
        issues.push(`Latitude ${report.lat} is outside Bengaluru range (${BENGALURU_BOUNDS.lat.min} to ${BENGALURU_BOUNDS.lat.max})`);
      }

      if (report.lng < BENGALURU_BOUNDS.lng.min || report.lng > BENGALURU_BOUNDS.lng.max) {
        issues.push(`Longitude ${report.lng} is outside Bengaluru range (${BENGALURU_BOUNDS.lng.min} to ${BENGALURU_BOUNDS.lng.max})`);
      }

      // Check if coordinates are swapped (lat > lng for Bengaluru would be wrong)
      if (report.lat > report.lng) {
        issues.push('Coordinates may be swapped (lat > lng is unusual for Bengaluru)');
      }

      // Check for suspiciously similar values
      if (Math.abs(report.lat - report.lng) < 0.1) {
        issues.push('Latitude and longitude are suspiciously similar');
      }

      if (issues.length > 0) {
        invalidReports.push({
          reportId: report.id,
          description: report.description,
          lat: report.lat,
          lng: report.lng,
          issues
        });
      } else {
        validCount++;
      }
    }

    // Print results
    if (invalidReports.length > 0) {
      console.log(`\n❌ Found ${invalidReports.length} report(s) with coordinate issues:\n`);
      
      for (const report of invalidReports) {
        console.log(`Report ID: ${report.reportId}`);
        console.log(`Description: ${report.description.substring(0, 60)}...`);
        console.log(`Coordinates: lat=${report.lat}, lng=${report.lng}`);
        console.log(`Issues:`);
        report.issues.forEach(issue => console.log(`  - ${issue}`));
        console.log('');
      }

      console.log('\nSuggested fixes:');
      console.log('1. If coordinates are swapped, swap lat and lng values');
      console.log('2. If coordinates are outside Bengaluru, verify the location or use default Bengaluru center (12.9716, 77.5946)');
      console.log('3. If coordinates are invalid (NaN), replace with default values\n');
    } else {
      console.log(`✓ All ${validCount} report(s) have valid Bengaluru coordinates!\n`);
    }

    // Summary
    console.log('Summary:');
    console.log(`  Total reports: ${reports.length}`);
    console.log(`  Valid coordinates: ${validCount}`);
    console.log(`  Invalid coordinates: ${invalidReports.length}`);

  } catch (error) {
    console.error('Error checking coordinates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCoordinates();
