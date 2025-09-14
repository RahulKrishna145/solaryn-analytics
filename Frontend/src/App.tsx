import React, { useState } from 'react';

import AdminDashboard from './components/AdminDashboard';
import HouseholdPortal from './components/HouseholdPortal';
import HouseholdApplication from './components/HouseholdApplication';
import AdminHouseholdApprovals from './components/AdminHouseholdApprovals';
import './App.css';


type Tab = 'admin' | 'household' | 'apply' | 'approvals';
const App: React.FC = () => {
  const [tab, setTab] = useState<Tab>('admin');
  return (
    <div>
      <h1>EV Charging Stations with Solar Integration</h1>
      <div className="app-tab-row">
        <button onClick={() => setTab('admin')}>Admin Dashboard</button>
        <button onClick={() => setTab('approvals')}>Admin Household Approvals</button>
        <button onClick={() => setTab('household')}>Household Portal</button>
        <button onClick={() => setTab('apply')}>Apply as Household</button>
      </div>
      {tab === 'admin' && <AdminDashboard />}
      {tab === 'approvals' && <AdminHouseholdApprovals />}
      {tab === 'household' && <HouseholdPortal />}
      {tab === 'apply' && <HouseholdApplication />}
    </div>
  );
};

export default App;
