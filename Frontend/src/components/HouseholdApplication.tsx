import React, { useState, useEffect } from 'react';
import { fetchStates, fetchDistricts } from '../api';

interface StateType { id: number; name: string; }
interface DistrictType { id: number; name: string; }

const HouseholdApplication: React.FC = () => {
  const [states, setStates] = useState<StateType[]>([]);
  const [districts, setDistricts] = useState<DistrictType[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [selectedState, setSelectedState] = useState<number | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null);
  const [formMsg, setFormMsg] = useState('');
  const [result, setResult] = useState<any>(null);

  useEffect(() => { fetchStates().then(setStates); }, []);
  useEffect(() => {
    if (selectedState !== null) {
      setLoadingDistricts(true);
      fetchDistricts(selectedState).then(ds => {
        setDistricts(ds);
        setLoadingDistricts(false);
      });
    } else {
      setDistricts([]);
    }
  }, [selectedState]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg('');
    setResult(null);
    if (!selectedDistrict) {
      setFormMsg('Please select a district.');
      return;
    }
    try {
      const res = await fetch('http://localhost:8000/household-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ district_id: selectedDistrict })
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        setFormMsg('Application submitted! Awaiting admin approval.');
      } else {
        setFormMsg(data.detail || 'Error submitting application.');
      }
    } catch {
      setFormMsg('Error submitting application.');
    }
  };

  return (
    <div>
      <h2>Apply as a Household</h2>
      <form onSubmit={handleApply} className="household-form-row">
        <label>State:</label>
        <select value={selectedState ?? ''} onChange={e => setSelectedState(Number(e.target.value))}>
          <option value="">Select State</option>
          {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <label>District:</label>
        {loadingDistricts ? (
          <span style={{marginLeft: 8}}>Loading districts...</span>
        ) : (
          <select value={selectedDistrict ?? ''} onChange={e => setSelectedDistrict(Number(e.target.value))} disabled={selectedState === null}>
            <option value="">Select District</option>
            {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        )}
        <button type="submit">Apply</button>
        {formMsg && <span style={{marginLeft: 8, color: formMsg.includes('Error') ? 'red' : 'green'}}>{formMsg}</span>}
      </form>
      {result && (
        <div style={{marginTop: 16}}>
          <b>Application Details:</b>
          <div>Latitude: {result.latitude.toFixed(5)}, Longitude: {result.longitude.toFixed(5)}</div>
          <div>Status: {result.status}</div>
        </div>
      )}
    </div>
  );
};

export default HouseholdApplication;
