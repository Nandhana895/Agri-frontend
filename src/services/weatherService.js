import axios from 'axios';

const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

async function fetchOpenWeather(lat, lon, apiKey) {
  const url = `${OPENWEATHER_BASE_URL}/weather`;
  const params = { lat, lon, appid: apiKey, units: 'metric' };
  const { data } = await axios.get(url, { params });
  return {
    temperatureC: data.main?.temp,
    feelsLikeC: data.main?.feels_like,
    humidityPercent: data.main?.humidity,
    pressureHpa: data.main?.pressure,
    windSpeedMs: data.wind?.speed,
    windDeg: data.wind?.deg,
    description: data.weather?.[0]?.description,
    icon: data.weather?.[0]?.icon,
    locationName: data.name,
    coordinates: { lat: data.coord?.lat, lon: data.coord?.lon },
    provider: 'openweather',
  };
}

async function fetchOpenMeteo(lat, lon) {
  const url = 'https://api.open-meteo.com/v1/forecast';
  const params = {
    latitude: lat,
    longitude: lon,
    current: ['temperature_2m', 'relative_humidity_2m', 'pressure_msl', 'wind_speed_10m', 'wind_direction_10m', 'weather_code'].join(','),
    wind_speed_unit: 'ms',
  };
  const { data } = await axios.get(url, { params });
  const c = data.current || {};
  return {
    temperatureC: c.temperature_2m,
    feelsLikeC: undefined,
    humidityPercent: c.relative_humidity_2m,
    pressureHpa: c.pressure_msl,
    windSpeedMs: c.wind_speed_10m,
    windDeg: c.wind_direction_10m,
    description: mapOpenMeteoCodeToText(c.weather_code),
    icon: undefined,
    locationName: undefined,
    coordinates: { lat, lon },
    provider: 'open-meteo',
  };
}

function mapOpenMeteoCodeToText(code) {
  const mapping = {
    0: 'Clear sky',
    1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Fog', 48: 'Depositing rime fog',
    51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
    56: 'Light freezing drizzle', 57: 'Dense freezing drizzle',
    61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
    66: 'Light freezing rain', 67: 'Heavy freezing rain',
    71: 'Slight snow fall', 73: 'Moderate snow fall', 75: 'Heavy snow fall',
    77: 'Snow grains',
    80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
    85: 'Slight snow showers', 86: 'Heavy snow showers',
    95: 'Thunderstorm', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail',
  };
  return mapping[code] || 'Unknown';
}

export async function fetchCurrentWeatherByCoords(lat, lon, apiKey) {
  if (apiKey) {
    try {
      return await fetchOpenWeather(lat, lon, apiKey);
    } catch (e) {
      // Fallback if OpenWeather fails
    }
  }
  return await fetchOpenMeteo(lat, lon);
}

export default {
  fetchCurrentWeatherByCoords,
};


