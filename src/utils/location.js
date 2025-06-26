export const libraries = ['places'];

export const CITY_COORDINATES = {
  'Cluj-Napoca': { lat: 46.7712, lng: 23.6236 },
  'București': { lat: 44.4268, lng: 26.1025 },
  'Timișoara': { lat: 45.7489, lng: 21.2087 }
};

export const ROMANIA_CENTER = { lat: 45.9443, lng: 25.0094 };

export function geocodeLocation(query) {
  return new Promise((resolve, reject) => {
    if (!window.google || !window.google.maps) {
      return reject(new Error('Google Maps API not loaded'));
    }
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: query }, (results, status) => {
      if (status === 'OK' && results[0]) {
        resolve({
          formattedAddress: results[0].formatted_address,
          location: {
            lat: results[0].geometry.location.lat(),
            lng: results[0].geometry.location.lng()
          }
        });
      } else {
        reject(new Error(status));
      }
    });
  });
}

export function reverseGeocode(lat, lng) {
  return new Promise((resolve, reject) => {
    if (!window.google || !window.google.maps) {
      return reject(new Error('Google Maps API not loaded'));
    }
    const geocoder = new window.google.maps.Geocoder();
    const latlng = { lat, lng };
    
    geocoder.geocode({ location: latlng }, (results, status) => {
      if (status === 'OK' && results[0]) {
        resolve({
          formattedAddress: results[0].formatted_address,
          location: { lat, lng }
        });
      } else {
        reject(new Error(status));
      }
    });
  });
}