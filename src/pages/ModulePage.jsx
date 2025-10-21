
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Container, Button } from 'react-bootstrap';
import SideMenu from '../components/SideMenu';
import '../styles/progress.css';

import gmrcImage from '../Subject_image/GMRC.png';
import languageImage from '../Subject_image/Language.png';
import makabansaImage from '../Subject_image/Makabansa.png';
import mathImage from '../Subject_image/Mathemathics.png';
import environmentImage from '../Subject_image/Physical & Natural Environment.png';

const subjects = [
	{ name: 'Language', image: languageImage, color: '#FFD700', percent: 90 }, // yellow
	{ name: 'GMRC', image: gmrcImage, color: '#A67C52', percent: 95 }, // brown
	{ name: 'Mathematics', image: mathImage, color: '#FFB6C1', percent: 85 }, // pink
	{ name: 'Makabansa', image: makabansaImage, color: '#B39DDB', percent: 92 }, // violet
	{ name: 'Physical & Natural Environment', image: environmentImage, color: '#81C784', percent: 88 }, // green
];

const cardStyle = {
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'center',
	justifyContent: 'space-between',
	borderRadius: '20px',
	boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
	border: '3px solid transparent',
	minHeight: '120px',
	padding: '0',
	marginBottom: '24px',
	transition: 'box-shadow 0.2s',
};

const ModulePage = () => {
	const navigate = useNavigate();
	const [selectedSubject, setSelectedSubject] = useState(subjects[0].name);

	return (
		<div className="d-flex min-vh-100" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)' }}>
			<SideMenu selectedItem="Modules" />
			<div style={{ marginLeft: '220px', width: 'calc(100% - 236px)', height: '100vh', padding: '32px', overflowY: 'auto' }}>
				<Container fluid>
					<h2 className="mb-4" style={{ fontWeight: 'bold', color: '#333' }}>Subjects</h2>
					<Row className="g-4">
						{subjects.map(subject => (
							<Col xs={12} md={6} key={subject.name}>
								<Card
									style={{
										...cardStyle,
										background: subject.color,
										border: '3px solid transparent',
										cursor: 'pointer',
										transition: 'transform 0.2s, box-shadow 0.2s',
									}}
									onClick={() => navigate(`/module/${encodeURIComponent(subject.name)}`)}
									onMouseEnter={e => {
										e.currentTarget.style.transform = 'scale(1.03)';
										e.currentTarget.style.boxShadow = '0 6px 24px rgba(78,205,196,0.15)';
									}}
									onMouseLeave={e => {
										e.currentTarget.style.transform = 'scale(1)';
										e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
									}}
								>
									<div style={{ flex: 1, padding: '32px 24px', minWidth: 0 }}>
										<h4 style={{ fontWeight: '600', color: '#222', marginBottom: '8px' }}>{subject.name}</h4>
									</div>
									<div style={{ flex: '0 0 240px', height: '170px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', borderTopRightRadius: '20px', borderBottomRightRadius: '20px', overflow: 'hidden' }}>
										<img src={subject.image} alt={subject.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }} />
									</div>
								</Card>
							</Col>
						))}
					</Row>
				</Container>
			</div>
		</div>
	);
};
export default ModulePage;
