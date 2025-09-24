import React, { useEffect, useState } from 'react';
import { fetchStates, fetchDistricts, fetchStations } from '../api';
import StationCard from './StationCard';
import './AdminDashboard.css';

interface StateType { id: number; name: string; }
interface DistrictType {
  id: number;
  name: string;
  latitude?: number;
  longitude?: number;
  solar_flux?: number;
}
interface StationType { id: number; name: string; latitude: number; longitude: number; }

const AdminDashboard: React.FC = () => {
  const [states, setStates] = useState<StateType[]>([]);
  const [districts, setDistricts] = useState<DistrictType[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [stations, setStations] = useState<StationType[]>([]);
  const [selectedState, setSelectedState] = useState<number | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null);
  // Add station form state
  const [stationName, setStationName] = useState('');
  const [stationLat, setStationLat] = useState('');
  const [stationLon, setStationLon] = useState('');
  const [formMsg, setFormMsg] = useState('');

  useEffect(() => {
    fetchStates().then(setStates);
  }, []);

  useEffect(() => {
    if (selectedState !== null) {
      setLoadingDistricts(true);
      fetchDistricts(selectedState).then(ds => {
        setDistricts(ds);
        setLoadingDistricts(false);
      });
      setSelectedDistrict(null);
      setStations([]);
    }
  }, [selectedState]);

  // Auto-fill lat/lon when district changes
  useEffect(() => {
    if (selectedDistrict !== null) {
      const d = districts.find(d => d.id === selectedDistrict);
      if (d && d.latitude && d.longitude) {
        setStationLat(d.latitude.toString());
        setStationLon(d.longitude.toString());
      } else {
        setStationLat('');
        setStationLon('');
      }
    }
  }, [selectedDistrict, districts]);

  useEffect(() => {
    if (selectedDistrict !== null) {
      fetchStations(selectedDistrict).then(setStations);
    }
  }, [selectedDistrict]);

  // Add station handler
  const handleAddStation = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg('');
    if (!stationName || !stationLat || !stationLon || !selectedDistrict) {
      setFormMsg('Fill all fields');
      return;
    }
    try {
      await import('../api').then(api => api.addStation({
        name: stationName,
        latitude: parseFloat(stationLat),
        longitude: parseFloat(stationLon),
        district_id: selectedDistrict
      }));
      setFormMsg('Station added!');
      setStationName(''); setStationLat(''); setStationLon('');
      fetchStations(selectedDistrict).then(setStations);
    } catch {
      setFormMsg('Error adding station');
    }
  };

  // Remove station handler
  const handleRemoveStation = async (id: number) => {
    if (!window.confirm('Delete this station?')) return;
    await import('../api').then(api => api.deleteStation(id));
    if (selectedDistrict) fetchStations(selectedDistrict).then(setStations);
  };

  return (
    <div>
      <h2>Admin Dashboard</h2>
      <div className="admin-dashboard-row">
        <label htmlFor="state-select">State:</label>
        <select id="state-select" value={selectedState ?? ''} onChange={e => setSelectedState(Number(e.target.value))}>
          <option value="">Select State</option>
          {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <label htmlFor="district-select">District:</label>
        {loadingDistricts ? (
          <span style={{marginLeft: 8}}>Loading districts...</span>
        ) : (
          <select id="district-select" value={selectedDistrict ?? ''} onChange={e => setSelectedDistrict(Number(e.target.value))} disabled={selectedState === null}>
            <option value="">Select District</option>
            {districts.map(d => (
              <option key={d.id} value={d.id}>
                {d.name}
                {d.solar_flux !== undefined && d.solar_flux !== null ? ` (Solar Flux: ${d.solar_flux} kWh/m²/day)` : ''}
              </option>
            ))}
          </select>
        )}
      </div>
      {/* Map feature removed as requested */}
      {/* Add Station Form */}
      {selectedDistrict && (
        <form onSubmit={handleAddStation} style={{marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center'}}>
          <input type="text" placeholder="Station Name" value={stationName} onChange={e => setStationName(e.target.value)} />
          <input type="number" placeholder="Latitude" value={stationLat} onChange={e => setStationLat(e.target.value)} step="any" />
          <input type="number" placeholder="Longitude" value={stationLon} onChange={e => setStationLon(e.target.value)} step="any" />
          <button type="submit">Add Station</button>
          {formMsg && <span style={{color: formMsg.includes('Error') ? 'red' : 'green'}}>{formMsg}</span>}
        </form>
      )}
      <div>
        {stations.map(station => (
          <div key={station.id} style={{position: 'relative'}}>
            <StationCard {...station} />
            <button style={{position: 'absolute', top: 8, right: 8}} onClick={() => handleRemoveStation(station.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
