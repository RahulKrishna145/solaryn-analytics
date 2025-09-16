import React, { useEffect, useState } from 'react';
import { fetchPendingHouseholdApplications, approveHouseholdApplication } from '../api';

const AdminHouseholdApprovals: React.FC = () => {
	const [pending, setPending] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [msg, setMsg] = useState('');

	useEffect(() => {
		setLoading(true);
		fetchPendingHouseholdApplications().then(data => {
			setPending(data);
			setLoading(false);
		});
	}, []);

	const handleApprove = async (id: number) => {
		setMsg('');
		setLoading(true);
		try {
			await approveHouseholdApplication(id);
			setMsg('Household approved!');
			// Refresh list
			fetchPendingHouseholdApplications().then(data => {
				setPending(data);
				setLoading(false);
			});
		} catch {
			setMsg('Error approving household');
			setLoading(false);
		}
	};

	return (
		<div>
			<h2>Pending Household Applications</h2>
			{msg && <div style={{color: msg.includes('Error') ? 'red' : 'green'}}>{msg}</div>}
			{loading ? <div>Loading...</div> : (
				<table style={{width: '100%', borderCollapse: 'collapse'}}>
					<thead>
						<tr>
							<th>ID</th>
							<th>Latitude</th>
							<th>Longitude</th>
							<th>District</th>
							<th>Action</th>
						</tr>
					</thead>
					<tbody>
						{pending.length === 0 ? (
							<tr><td colSpan={5} style={{textAlign: 'center'}}>No pending applications.</td></tr>
						) : pending.map(h => (
							<tr key={h.id}>
								<td>{h.id}</td>
								<td>{h.latitude}</td>
								<td>{h.longitude}</td>
								<td>{h.district_id}</td>
								<td>
									<button onClick={() => handleApprove(h.id)}>Approve</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}
		</div>
	);
};

export default AdminHouseholdApprovals;
