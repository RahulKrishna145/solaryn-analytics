import React, { useEffect, useState } from 'react';
import { fetchPendingHouseholdApplications, approveHouseholdApplication, fetchStates, fetchDistricts } from '../api';

interface PendingHousehold {
  id: number;
  latitude: number;
  longitude: number;
  district_id: number;
}

const AdminHouseholdApprovals: React.FC = () => {
  const [pending, setPending] = useState<PendingHousehold[]>([]);
  const [states, setStates] = useState<{id: number, name: string}[]>([]);
  const [districts, setDistricts] = useState<{id: number, name: string}[]>([]);
  const [selectedState, setSelectedState] = useState<number | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null);
  const [radius, setRadius] = useState(10);
  const [msg, setMsg] = useState('');

  useEffect(() => { fetchStates().then(setStates); }, []);
  useEffect(() => {
    if (selectedState !== null) fetchDistricts(selectedState).then(setDistricts);
    else setDistricts([]);
  }, [selectedState]);

  useEffect(() => {
    fetchPendingHouseholdApplications().then(setPending);
  }, []);

  const handleApprove = async (id: number) => {
    setMsg('');
    try {
      const res = await approveHouseholdApplication(id, radius);
      if (res.status === 'approved') {
        setMsg('Household approved!');
        setPending(pending.filter(h => h.id !== id));
      } else {
        setMsg(res.detail || 'Approval failed.');
      }
    } catch {
      setMsg('Approval failed.');
    }
  };

  // Optional: filter by state/district
  const filtered = pending.filter(h => {
    if (selectedDistrict) return h.district_id === selectedDistrict;
    if (selectedState && districts.length > 0) return districts.some(d => d.id === h.district_id);
    return true;
  });

  return (
    <div>
      <h2>Pending Household Applications</h2>
      <div style={{display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12}}>
        <label>State:</label>
        <select value={selectedState ?? ''} onChange={e => setSelectedState(Number(e.target.value))}>
          <option value="">All</option>
          {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <label>District:</label>
        <select value={selectedDistrict ?? ''} onChange={e => setSelectedDistrict(Number(e.target.value))} disabled={selectedState === null}>
          <option value="">All</option>
          {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <label>Radius (km):</label>
        <input type="number" value={radius} onChange={e => setRadius(Number(e.target.value))} style={{width: 60}} />
      </div>
      {msg && <div style={{color: msg.includes('failed') ? 'red' : 'green'}}>{msg}</div>}
      <ul style={{listStyle: 'none', padding: 0}}>
        {filtered.length === 0 && <li>No pending applications.</li>}
        {filtered.map(h => (
          <li key={h.id} style={{marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8}}>
            <span>Lat: {h.latitude.toFixed(5)}, Lon: {h.longitude.toFixed(5)}</span>
            <button onClick={() => handleApprove(h.id)}>Approve</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminHouseholdApprovals;
