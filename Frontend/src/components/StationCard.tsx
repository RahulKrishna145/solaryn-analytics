import React from 'react';

interface StationCardProps {
  name: string;
  latitude: number;
  longitude: number;
  distanceKm?: number;
}


import './StationCard.css';

const StationCard: React.FC<StationCardProps> = ({ name, latitude, longitude, distanceKm }) => (
  <div className="station-card">
    <h4>{name}</h4>
    <div>Lat: {latitude.toFixed(4)}, Lon: {longitude.toFixed(4)}</div>
    {distanceKm !== undefined && <div>Distance: {distanceKm.toFixed(2)} km</div>}
  </div>
);

export default StationCard;
