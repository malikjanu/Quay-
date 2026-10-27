export type Place = {
  id: string;
  name: string;
  region: string;
  lat: number;
  lon: number;
  note: string;
};

export const PLACES: Place[] = [
  {
    id: "reykjavik",
    name: "Reykjavík",
    region: "Iceland",
    lat: 64.1466,
    lon: -21.9426,
    note: "Where the Mid-Atlantic Ridge comes ashore.",
  },
  {
    id: "london",
    name: "London",
    region: "United Kingdom",
    lat: 51.5074,
    lon: -0.1278,
    note: "A river city on the prime meridian.",
  },
  {
    id: "paris",
    name: "Paris",
    region: "France",
    lat: 48.8566,
    lon: 2.3522,
    note: "The Seine bends through the Paris basin.",
  },
  {
    id: "istanbul",
    name: "Istanbul",
    region: "Türkiye",
    lat: 41.0082,
    lon: 28.9784,
    note: "The strait between two continents.",
  },
  {
    id: "cairo",
    name: "Cairo",
    region: "Egypt",
    lat: 30.0444,
    lon: 31.2357,
    note: "The Nile’s last city before the delta.",
  },
  {
    id: "nairobi",
    name: "Nairobi",
    region: "Kenya",
    lat: -1.2921,
    lon: 36.8219,
    note: "A highland city just south of the equator.",
  },
  {
    id: "cape-town",
    name: "Cape Town",
    region: "South Africa",
    lat: -33.9249,
    lon: 18.4241,
    note: "A harbor where two oceans meet.",
  },
  {
    id: "dubai",
    name: "Dubai",
    region: "United Arab Emirates",
    lat: 25.2048,
    lon: 55.2708,
    note: "A gulf port on the edge of the desert.",
  },
  {
    id: "mumbai",
    name: "Mumbai",
    region: "India",
    lat: 19.076,
    lon: 72.8777,
    note: "A deep harbor on the Arabian Sea.",
  },
  {
    id: "singapore",
    name: "Singapore",
    region: "Singapore",
    lat: 1.3521,
    lon: 103.8198,
    note: "An island passage on the equator.",
  },
  {
    id: "tokyo",
    name: "Tokyo",
    region: "Japan",
    lat: 35.6762,
    lon: 139.6503,
    note: "A bay city on the Pacific rim.",
  },
  {
    id: "sydney",
    name: "Sydney",
    region: "Australia",
    lat: -33.8688,
    lon: 151.2093,
    note: "A drowned valley opening to the Tasman.",
  },
  {
    id: "honolulu",
    name: "Honolulu",
    region: "Hawaiʻi",
    lat: 21.3069,
    lon: -157.8583,
    note: "An island harbor in the mid-Pacific.",
  },
  {
    id: "san-francisco",
    name: "San Francisco",
    region: "United States",
    lat: 37.7749,
    lon: -122.4194,
    note: "A gate between the bay and the Pacific.",
  },
  {
    id: "mexico-city",
    name: "Mexico City",
    region: "Mexico",
    lat: 19.4326,
    lon: -99.1332,
    note: "A high basin in the central plateau.",
  },
  {
    id: "new-york",
    name: "New York",
    region: "United States",
    lat: 40.7128,
    lon: -74.006,
    note: "A harbor at the mouth of the Hudson.",
  },
  {
    id: "rio",
    name: "Rio de Janeiro",
    region: "Brazil",
    lat: -22.9068,
    lon: -43.1729,
    note: "Granite peaks around a wide bay.",
  },
];

export function formatCoord(lat: number, lon: number) {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lon >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(2)}° ${ns}  ·  ${Math.abs(lon).toFixed(2)}° ${ew}`;
}
