import React, { useMemo } from 'react';
import '../App.css';

// Mock data for Kerala - Thiruvananthapuram
const mockDistricts = [
  { id: 1, name: 'Thiruvananthapuram (Kerala)', solar_flux: 5.5 },
];

const mockStations = [
  { id: 1, name: 'EV Station Central', district_id: 1 },
  { id: 2, name: 'EV Station North', district_id: 1 },
  { id: 3, name: 'EV Station South', district_id: 1 },
];

const mockHouseholds = [
  { id: 1, name: 'Household A', station_id: 1 },
  { id: 2, name: 'Household B', station_id: 1 },
  { id: 3, name: 'Household C', station_id: 2 },
  { id: 4, name: 'Household D', station_id: 2 },
  { id: 5, name: 'Household E', station_id: 2 },
  { id: 6, name: 'Household F', station_id: 3 },
];

// Arbitrary constants for demo
const AREA = 1000; // m^2
const DAYS = 30;
const EFFICIENCY = 0.18; // 18% panel efficiency

export default function AnalyticsPage() {
  // Calculate demo energy data
  const analytics = useMemo(() => {
    return mockDistricts.map(district => {
      const energyGenerated = district.solar_flux * AREA * DAYS * EFFICIENCY; // kWh
      const stations = mockStations.filter(s => s.district_id === district.id);
      const stationData = stations.map(station => {
        // Distribute energy equally among stations
        const stationEnergy = energyGenerated / stations.length;
        const households = mockHouseholds.filter(h => h.station_id === station.id);
        const householdData = households.map(hh => ({
          ...hh,
          energyReceived: stationEnergy / households.length,
        }));
        return {
          ...station,
          energyReceived: stationEnergy,
          households: householdData,
        };
      });
      return {
        ...district,
        energyGenerated,
        stations: stationData,
      };
    });
  }, []);

  // KPIs
  const totalGenerated = analytics.reduce((sum, d) => sum + d.energyGenerated, 0);
  const totalSupplied = analytics.reduce((sum, d) => sum + d.stations.reduce((s, st) => s + st.energyReceived, 0), 0);
  const totalHousehold = analytics.reduce((sum, d) => sum + d.stations.reduce((s, st) => s + st.households.reduce((h, hh) => h + hh.energyReceived, 0), 0), 0);

  return (
    <div className="analytics-page">
      <h2>Analytics Dashboard (Demo)</h2>
      <div className="analytics-kpis">
        <div className="kpi-card">
          <div className="kpi-label">Total Solar Energy Generated</div>
          <div className="kpi-value">{totalGenerated.toFixed(0)} kWh</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Total Supplied to Stations</div>
          <div className="kpi-value">{totalSupplied.toFixed(0)} kWh</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Total Supplied to Households</div>
          <div className="kpi-value">{totalHousehold.toFixed(0)} kWh</div>
        </div>
      </div>
      <div className="analytics-section">
        {analytics.map(district => (
          <div key={district.id} className="analytics-district">
            <h3>{district.name} <span className="analytics-solar-flux">(Solar Flux: {district.solar_flux} kWh/m²/day)</span></h3>
            <div className="analytics-district-kpi">Solar Farm Output: <b>{district.energyGenerated.toFixed(0)} kWh</b></div>
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>EV Station</th>
                  <th>Energy Received</th>
                  <th>Households</th>
                  <th>Energy per Household</th>
                </tr>
              </thead>
              <tbody>
                {district.stations.map(station => (
                  <tr key={station.id}>
                    <td>{station.name}</td>
                    <td>{station.energyReceived.toFixed(0)} kWh</td>
                    <td>{station.households.map(hh => hh.name).join(', ')}</td>
                    <td>{station.households.length > 0 ? (station.energyReceived / station.households.length).toFixed(0) + ' kWh' : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
