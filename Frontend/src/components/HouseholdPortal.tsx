
import React, { useState, useEffect } from 'react';
import StationCard from './StationCard';
import { fetchNearestStation, fetchStates, fetchDistricts, addHousehold, fetchHouseholdsByDistrict, deleteHousehold } from '../api';
import './HouseholdPortal.css';

const HouseholdPortal: React.FC = () => {
  const [states, setStates] = useState<{id: number, name: string}[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [selectedState, setSelectedState] = useState<number | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null);
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [households, setHouseholds] = useState<any[]>([]);
  const [radius, setRadius] = useState(10);
  const [nearest, setNearest] = useState<any>(null);
  // const [error, setError] = useState('');
  const [formMsg, setFormMsg] = useState('');

  useEffect(() => { fetchStates().then(setStates); }, []);
  useEffect(() => {
    if (selectedState !== null) {
      setLoadingDistricts(true);
      fetchDistricts(selectedState).then(ds => {
        setDistricts(ds);
        setLoadingDistricts(false);
      });
    }
  }, [selectedState]);
  useEffect(() => {
    if (selectedDistrict !== null) {
      const d = districts.find(d => d.id === selectedDistrict);
      if (d && d.latitude && d.longitude) {
        setLat(d.latitude.toString());
        setLon(d.longitude.toString());
      } else {
        setLat(''); setLon('');
      }
      // Fetch households for this district
      fetchHouseholdsByDistrict(selectedDistrict).then(setHouseholds);
    } else {
      setHouseholds([]);
    }
  }, [selectedDistrict, districts]);

  const handleAddHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg('');
    setNearest(null);
    if (!lat || !lon || !selectedDistrict) {
      setFormMsg('Fill all fields');
      return;
    }
    try {
      const res = await addHousehold({
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
        district_id: selectedDistrict
      });
      setFormMsg('Household added!');
      // Refresh household list
      fetchHouseholdsByDistrict(selectedDistrict).then(setHouseholds);
      // Fetch nearest station(s)
      const nearestRes = await fetchNearestStation(res.id, radius);
      setNearest(nearestRes);
    } catch {
      setFormMsg('Error adding household');
    }
  };

  const handleDeleteHousehold = async (id: number) => {
    if (!window.confirm('Delete this household?')) return;
    await deleteHousehold(id);
    if (selectedDistrict !== null) fetchHouseholdsByDistrict(selectedDistrict).then(setHouseholds);
  };

  return (
    <div>
      <h2>Household Portal</h2>
      <form onSubmit={handleAddHousehold} className="household-form-row">
        <label>State:</label>
        <select title="State" value={selectedState ?? ''} onChange={e => setSelectedState(Number(e.target.value))}>
          <option value="">Select State</option>
          {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <label>District:</label>
        {loadingDistricts ? (
          <span style={{marginLeft: 8}}>Loading districts...</span>
        ) : (
          <select title="District" value={selectedDistrict ?? ''} onChange={e => setSelectedDistrict(Number(e.target.value))} disabled={selectedState === null}>
            <option value="">Select District</option>
            {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        )}
        <input type="number" placeholder="Latitude" value={lat} onChange={e => setLat(e.target.value)} step="any" />
        <input type="number" placeholder="Longitude" value={lon} onChange={e => setLon(e.target.value)} step="any" />
        <label>Radius (km):</label>
        <input type="number" placeholder="Radius (km)" value={radius} onChange={e => setRadius(Number(e.target.value))} />
        <button type="submit">Add Household & Find Nearest</button>
        {formMsg && <span className={formMsg.includes('Error') ? 'household-error' : ''}>{formMsg}</span>}
      </form>
      {/* Household list for selected district */}
      {selectedDistrict && households.length > 0 && (
        <div style={{marginTop: 24}}>
          <h4>Households in District</h4>
          <ul style={{listStyle: 'none', padding: 0}}>
            {households.map(h => (
              <li key={h.id} style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4}}>
                <span>Lat: {h.latitude}, Lon: {h.longitude}</span>
                {h.associated_station ? (
                  <span style={{marginLeft: 8, color: '#4caf50'}}>
                    | Associated Station: <b>{h.associated_station.name}</b>
                    (Lat: {h.associated_station.latitude.toFixed(4)}, Lon: {h.associated_station.longitude.toFixed(4)})
                  </span>
                ) : (
                  <span style={{marginLeft: 8, color: '#888'}}>| No associated station</span>
                )}
                <button onClick={() => handleDeleteHousehold(h.id)} style={{color: 'red'}}>Delete</button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {selectedDistrict && households.length === 0 && (
        <div style={{marginTop: 24, color: '#888'}}>No households in this district.</div>
      )}
      {/* error display removed, handled by formMsg */}
      {nearest && nearest.station && (
        <div>
          <h4>Nearest Station (for subsidy):</h4>
          <StationCard {...nearest.station} distanceKm={nearest.distance_km} />
        </div>
      )}
      {nearest && !nearest.station && (
        <div>No station found within radius.</div>
      )}
    </div>
  );
};

export default HouseholdPortal;
