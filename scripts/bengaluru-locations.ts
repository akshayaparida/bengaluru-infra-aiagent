/**
 * Accurate Bengaluru Coordinates for Testing GPS System
 * 
 * Use these coordinates to test the app's location system when GPS is poor.
 * These are real, verified coordinates of famous locations in Bengaluru.
 */

export const BENGALURU_LOCATIONS = {
  // Central Bengaluru
  'MG Road Metro Station': {
    lat: 12.975567,
    lng: 77.605629,
    address: 'Mahatma Gandhi Road, Bengaluru'
  },
  
  'Vidhana Soudha': {
    lat: 12.979167,
    lng: 77.590833,
    address: 'Dr Ambedkar Veedhi, Bengaluru'
  },
  
  'Cubbon Park': {
    lat: 12.970874,
    lng: 77.591759,
    address: 'Kasturba Road, Bengaluru'
  },
  
  // IT Hubs
  'Electronic City Phase 1': {
    lat: 12.844891,
    lng: 77.663895,
    address: 'Electronic City Phase 1, Bengaluru'
  },
  
  'Whitefield ITPL': {
    lat: 12.968970,
    lng: 77.749640,
    address: 'ITPL Main Road, Whitefield, Bengaluru'
  },
  
  'Manyata Tech Park': {
    lat: 13.047500,
    lng: 77.620833,
    address: 'Manyata Embassy Business Park, Bengaluru'
  },
  
  // Residential Areas
  'Indiranagar 100ft Road': {
    lat: 12.971899,
    lng: 77.641242,
    address: '100 Feet Road, Indiranagar, Bengaluru'
  },
  
  'Koramangala 5th Block': {
    lat: 12.935162,
    lng: 77.624725,
    address: '5th Block, Koramangala, Bengaluru'
  },
  
  'Jayanagar 4th Block': {
    lat: 12.925052,
    lng: 77.583405,
    address: '4th Block, Jayanagar, Bengaluru'
  },
  
  'HSR Layout Sector 1': {
    lat: 12.915568,
    lng: 77.641211,
    address: 'Sector 1, HSR Layout, Bengaluru'
  },
  
  // Transport Hubs
  'Kempegowda International Airport': {
    lat: 13.198889,
    lng: 77.710556,
    address: 'Devanahalli, Bengaluru'
  },
  
  'Majestic Bus Station': {
    lat: 12.977350,
    lng: 77.571760,
    address: 'Kempegowda Bus Station, Bengaluru'
  },
  
  'Yeshwanthpur Junction': {
    lat: 13.028333,
    lng: 77.537500,
    address: 'Yeshwanthpur Railway Station, Bengaluru'
  },
  
  // Educational Institutions
  'Indian Institute of Science': {
    lat: 13.021944,
    lng: 77.566111,
    address: 'IISc Campus, Bengaluru'
  },
  
  'Bangalore University': {
    lat: 12.971944,
    lng: 77.590278,
    address: 'Jnanabharathi Campus, Bengaluru'
  }
};

// Function to validate if coordinates are within Bengaluru bounds
export function validateBengaluruCoordinates(lat: number, lng: number): boolean {
  const BOUNDS = {
    lat: { min: 12.8, max: 13.2 },
    lng: { min: 77.4, max: 77.8 }
  };
  
  return lat >= BOUNDS.lat.min && 
         lat <= BOUNDS.lat.max && 
         lng >= BOUNDS.lng.min && 
         lng <= BOUNDS.lng.max;
}

// Function to find the nearest known location
export function findNearestLocation(lat: number, lng: number): { name: string; distance: number } | null {
  let nearest: { name: string; distance: number } | null = null;
  
  for (const [name, location] of Object.entries(BENGALURU_LOCATIONS)) {
    // Calculate approximate distance using Haversine formula (simplified)
    const R = 6371; // Earth's radius in km
    const dLat = (location.lat - lat) * Math.PI / 180;
    const dLng = (location.lng - lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat * Math.PI / 180) * Math.cos(location.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c * 1000; // Distance in meters
    
    if (!nearest || distance < nearest.distance) {
      nearest = { name, distance };
    }
  }
  
  return nearest;
}

// Test function to check your current coordinates
export function analyzeCoordinates(lat: number, lng: number, accuracy?: number) {
  console.log('=== Coordinate Analysis ===');
  console.log(`Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
  
  if (accuracy) {
    console.log(`Accuracy: ±${accuracy > 1000 ? `${(accuracy/1000).toFixed(1)}km` : `${accuracy.toFixed(0)}m`}`);
    
    if (accuracy <= 20) {
      console.log('✅ Excellent GPS accuracy');
    } else if (accuracy <= 50) {
      console.log('🟡 Good GPS accuracy');
    } else if (accuracy <= 1000) {
      console.log('⚠️ Fair accuracy - usable but not precise');
    } else {
      console.log('❌ Poor accuracy - likely network-based location');
    }
  }
  
  const isValid = validateBengaluruCoordinates(lat, lng);
  console.log(`Within Bengaluru bounds: ${isValid ? '✅' : '❌'}`);
  
  const nearest = findNearestLocation(lat, lng);
  if (nearest) {
    console.log(`Nearest landmark: ${nearest.name} (${nearest.distance.toFixed(0)}m away)`);
  }
  
  if (accuracy && accuracy > 10000) {
    console.log('\n💡 Recommendations:');
    console.log('- Use a mobile device with GPS for better accuracy');
    console.log('- Move to an outdoor location');
    console.log('- Enable high-accuracy mode in device settings');
    console.log('- Use manual coordinate entry for precise reporting');
  }
  
  return { isValid, nearest, accuracy };
}

// Example usage:
if (typeof window !== 'undefined') {
  // Browser environment
  console.log('🗺️ Bengaluru Location Reference:');
  Object.entries(BENGALURU_LOCATIONS).slice(0, 5).forEach(([name, location]) => {
    console.log(`${name}: ${location.lat}, ${location.lng}`);
  });
}