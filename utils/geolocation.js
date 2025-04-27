/**
 * Utility functions for geolocation operations
 */

/**
 * Calculate the distance between two coordinates using the Haversine formula
 * 
 * @param {number} lat1 - Latitude of first point in degrees
 * @param {number} lon1 - Longitude of first point in degrees
 * @param {number} lat2 - Latitude of second point in degrees
 * @param {number} lon2 - Longitude of second point in degrees
 * @returns {number} Distance in kilometers
 */
const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

/**
 * Convert degrees to radians
 * 
 * @param {number} deg - Degrees
 * @returns {number} Radians
 */
const deg2rad = (deg) => {
  return deg * (Math.PI / 180);
};

/**
 * Get an array of nearby locations based on a center point and radius
 * 
 * @param {number} lat - Center latitude
 * @param {number} lng - Center longitude
 * @param {number} radiusKm - Radius in kilometers
 * @param {Array} locations - Array of location objects with lat and lng properties
 * @returns {Array} Filtered array of locations within the radius
 */
const getNearbyLocations = (lat, lng, radiusKm, locations) => {
  return locations.filter(location => {
    const distance = getDistanceFromLatLonInKm(
      lat, lng, 
      location.latitude, location.longitude
    );
    return distance <= radiusKm;
  }).map(location => ({
    ...location,
    distance: getDistanceFromLatLonInKm(
      lat, lng, 
      location.latitude, location.longitude
    )
  }));
};

module.exports = {
  getDistanceFromLatLonInKm,
  getNearbyLocations
};
