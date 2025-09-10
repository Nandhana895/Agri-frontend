import React, { useCallback, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { fetchCurrentWeatherByCoords } from '../services/weatherService';

const defaultPosition = [20.5937, 78.9629]; // Center on India by default
const INDIA_BOUNDS = [
  [6.5546, 68.1114],   // Southwest (lat, lon)
  [35.6745, 97.3956],  // Northeast (lat, lon)
];

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function ClickHandler({ onClick }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng);
    },
  });
  return null;
}

export default function MapWithWeather() {
  const [selected, setSelected] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;

  const handleMapClick = useCallback(async (latlng) => {
    setSelected(latlng);
    setWeather(null);
    setError(null);
    setLoading(true);
    try {
      const result = await fetchCurrentWeatherByCoords(latlng.lat, latlng.lng, apiKey);
      setWeather(result);
    } catch (err) {
      setError(err?.message || 'Failed to load weather');
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  const position = useMemo(() => selected ? [selected.lat, selected.lng] : defaultPosition, [selected]);

  return (
    <div className="space-y-3">
      <div className="h-80 w-full overflow-hidden rounded-lg border border-[var(--ag-border)]">
        <MapContainer
          center={position}
          zoom={5}
          minZoom={4}
          maxZoom={14}
          maxBounds={INDIA_BOUNDS}
          maxBoundsViscosity={1.0}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onClick={handleMapClick} />
          {selected && (
            <Marker position={position} icon={markerIcon}>
              <Popup>
                Selected: {selected.lat.toFixed(4)}, {selected.lng.toFixed(4)}
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      <div className="ag-card p-4">
        {!selected && (
          <p className="text-sm text-gray-600">Click on the map to view climate for that location.</p>
        )}
        {loading && (
          <p className="text-sm text-gray-600">Loading weather…</p>
        )}
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        {weather && (
          <div className="flex items-center gap-4">
            {weather.icon ? (
              <div className="w-12 h-12 rounded-full ag-cta-gradient text-white flex items-center justify-center">
                <img
                  src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                  alt={weather.description}
                  className="w-10 h-10"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full ag-cta-gradient text-white flex items-center justify-center">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364 6.364l-1.414-1.414M7.05 7.05L5.636 5.636m12.728 0l-1.414 1.414M7.05 16.95l-1.414 1.414"/></svg>
              </div>
            )}
            <div>
              <p className="text-xl font-semibold text-gray-900">{Math.round(weather.temperatureC)}°C • {weather.description}</p>
              <p className="text-sm text-gray-600">
                Humidity {weather.humidityPercent}% • Wind {Math.round(weather.windSpeedMs)} m/s • Pressure {weather.pressureHpa} hPa
              </p>
              <p className="text-xs text-gray-500">
                {(weather.locationName || 'Lat/Lon')} — {weather.coordinates.lat.toFixed(4)}, {weather.coordinates.lon.toFixed(4)} {weather.provider ? `• ${weather.provider}` : ''}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


