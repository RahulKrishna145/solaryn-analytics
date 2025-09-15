import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import './App.css';

import AdminDashboardPage from './pages/AdminDashboardPage';
import HouseholdPortalPage from './pages/HouseholdPortalPage';
import HouseholdApplicationPage from './pages/HouseholdApplicationPage';
import AdminHouseholdApprovalsPage from './pages/AdminHouseholdApprovalsPage';
import AnalyticsPage from './pages/AnalyticsPage';

const navLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/households', label: 'Household Portal' },
  { to: '/apply', label: 'Household Application' },
  { to: '/approvals', label: 'Approvals' },
  { to: '/analytics', label: 'Analytics' },
];

const App: React.FC = () => {
  return (
    <Router>
      <div>
        <nav className="app-navbar">
          <NavLink to="/" className="app-logo">SolarYN</NavLink>
          <div className="app-nav-links">
            {navLinks.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  'app-nav-link' + (isActive ? ' active' : '')
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </nav>
        <div className="app-content">
          <Routes>
            <Route path="/" element={
              <div className="landing-container">
                <h1>SolarYN Analytics</h1>
                <p className="landing-sub">A unified platform for managing EV charging stations and solar energy integration across districts and households.</p>
                <div className="landing-desc">
                  <b>Features:</b>
                  <ul>
                    <li>Admin dashboard for managing charging stations and districts</li>
                    <li>Household portal for adding and viewing household energy data</li>
                    <li>Application and approval workflow for new households</li>
                    <li>Analytics dashboard for system-wide and per-entity insights</li>
                  </ul>
                  <p className="landing-note">Use the navigation bar above to access each section.</p>
                </div>
              </div>
            } />
            <Route path="/dashboard" element={<AdminDashboardPage />} />
            <Route path="/households" element={<HouseholdPortalPage />} />
            <Route path="/apply" element={<HouseholdApplicationPage />} />
            <Route path="/approvals" element={<AdminHouseholdApprovalsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
