import React, { useEffect, useState } from 'react';
import { Toast } from 'react-bootstrap';

export default function AutoLogoutToast() {
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState('You have been logged out due to inactivity');

  useEffect(() => {
    const handler = (e) => {
      const detail = e?.detail || {};
      setMessage(detail.message || 'You have been logged out due to inactivity');
      setShow(true);
    };

    window.addEventListener('app:auto-logout', handler);
    return () => window.removeEventListener('app:auto-logout', handler);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1060,
        width: 'min(640px, 92%)',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <Toast
        onClose={() => setShow(false)}
        show={show}
        delay={5000}
        autohide
        style={{ width: '100%' }}
      >
        <Toast.Header>
          <strong className="me-auto">Session</strong>
        </Toast.Header>
        <Toast.Body>{message}</Toast.Body>
      </Toast>
    </div>
  );
}
