import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Script to seed the database with sample reports at different Bengaluru locations
 * This helps test the map display and coordinate accuracy
 */

const prisma = new PrismaClient();

// Sample locations across Bengaluru with accurate coordinates
const SAMPLE_REPORTS = [
  {
    description: 'Pothole on MG Road near Trinity Metro Station',
    lat: 12.9716,
    lng: 77.5946,
    location: 'MG Road'
  },
  {
    description: 'Broken streetlight in Indiranagar 100ft Road',
    lat: 12.9719,
    lng: 77.6412,
    location: 'Indiranagar'
  },
  {
    description: 'Garbage accumulation in Koramangala 5th Block',
    lat: 12.9352,
    lng: 77.6245,
    location: 'Koramangala'
  },
  {
    description: 'Water leakage near Whitefield ITPL Main Road',
    lat: 12.9698,
    lng: 77.7500,
    location: 'Whitefield'
  },
  {
    description: 'Road damage near Electronic City Phase 1',
    lat: 12.8456,
    lng: 77.6603,
    location: 'Electronic City'
  },
  {
    description: 'Damaged footpath near Yeshwanthpur Metro Station',
    lat: 13.0287,
    lng: 77.5374,
    location: 'Yeshwanthpur'
  },
  {
    description: 'Waterlogging issue in Jayanagar 4th Block',
    lat: 12.9250,
    lng: 77.5833,
    location: 'Jayanagar'
  },
  {
    description: 'Broken traffic signal at Silk Board Junction',
    lat: 12.9177,
    lng: 77.6233,
    location: 'Silk Board'
  }
];

async function seedReports() {
  console.log('Seeding database with sample Bengaluru reports...\n');

  try {
    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), '.data', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Create a dummy image file (1x1 pixel JPEG)
    const dummyImagePath = path.join(uploadDir, 'sample-photo.jpg');
    const dummyImageBuffer = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
      0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
      0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
      0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
      0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
      0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
      0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
      0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0xFF, 0xC4, 0x00, 0x14, 0x10, 0x01, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00,
      0x7F, 0xFF, 0xD9
    ]);
    
    if (!fs.existsSync(dummyImagePath)) {
      fs.writeFileSync(dummyImagePath, dummyImageBuffer);
    }

    let createdCount = 0;

    for (const report of SAMPLE_REPORTS) {
      // Create unique photo for each report
      const photoFilename = `sample-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      const photoPath = path.join(uploadDir, photoFilename);
      fs.copyFileSync(dummyImagePath, photoPath);

      await prisma.report.create({
        data: {
          description: report.description,
          lat: report.lat,
          lng: report.lng,
          photoPath: photoFilename,
          status: 'NEW'
        }
      });

      console.log(`✓ Created: ${report.description}`);
      console.log(`  Location: ${report.location}`);
      console.log(`  Coordinates: ${report.lat}, ${report.lng}\n`);
      
      createdCount++;
    }

    console.log(`\nSuccessfully seeded ${createdCount} sample reports!`);
    console.log('\nYou can now:');
    console.log('1. View them on the dashboard at http://localhost:3000/dashboard');
    console.log('2. Verify coordinates are displayed correctly on the map');
    console.log('3. Run the check script: npx tsx scripts/check-coordinates.ts\n');

  } catch (error) {
    console.error('Error seeding reports:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedReports();
