// Admin: fetch pending household applications
export async function fetchPendingHouseholdApplications() {
  const res = await fetch(`${API_BASE}/household-applications/pending`);
  return res.json();
}

// Admin: approve a household application
export async function approveHouseholdApplication(householdId: number, radius = 10) {
  const res = await fetch(`${API_BASE}/household-applications/${householdId}/approve?radius=${radius}`, {
    method: 'POST'
  });
  return res.json();
}
// List households by district
export async function fetchHouseholdsByDistrict(districtId: number) {
  const res = await fetch(`${API_BASE}/districts/${districtId}/households`);
  return res.json();
}
// Central API utility for backend requests
const API_BASE = 'http://localhost:8000';

export async function fetchStates() {
  const res = await fetch(`${API_BASE}/states`);
  return res.json();
}

export async function fetchDistricts(stateId: number) {
  const res = await fetch(`${API_BASE}/states/${stateId}/districts`);
  return res.json();
}

export async function fetchStations(districtId: number) {
  const res = await fetch(`${API_BASE}/districts/${districtId}/stations`);
  return res.json();
}


export async function fetchNearestStation(householdId: number, radius = 10) {
  const res = await fetch(`${API_BASE}/households/${householdId}/nearest-station?radius=${radius}`);
  return res.json();
}

// --- Households CRUD ---
export async function addHousehold(data: { latitude: number; longitude: number; district_id: number }) {
  const res = await fetch(`${API_BASE}/households`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteHousehold(id: number) {
  const res = await fetch(`${API_BASE}/households/${id}`, { method: 'DELETE' });
  return res.json();
}

// --- Stations CRUD ---
export async function addStation(data: { name: string; latitude: number; longitude: number; district_id: number }) {
  const res = await fetch(`${API_BASE}/stations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteStation(id: number) {
  const res = await fetch(`${API_BASE}/stations/${id}`, { method: 'DELETE' });
  return res.json();
}
