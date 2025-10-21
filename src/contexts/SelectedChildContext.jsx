import React, { createContext, useState, useEffect } from 'react';

export const SelectedChildContext = createContext({
  selectedChildId: null,
  selectedChildName: null,
  setSelectedChild: () => {}
});

export const SelectedChildProvider = ({ children }) => {
  const [selectedChildId, setSelectedChildId] = useState(() => {
    try {
      return localStorage.getItem('selectedChildId') || null;
    } catch (e) {
      return null;
    }
  });
  const [selectedChildName, setSelectedChildName] = useState(() => {
    try {
      return localStorage.getItem('userName') || null;
    } catch (e) {
      return null;
    }
  });

  // Keep localStorage in sync for cross-tab communication
  useEffect(() => {
    try {
      if (selectedChildId) localStorage.setItem('selectedChildId', String(selectedChildId));
      else localStorage.removeItem('selectedChildId');
    } catch (e) {
      // ignore storage errors
    }
  }, [selectedChildId]);

  useEffect(() => {
    try {
      if (selectedChildName) localStorage.setItem('userName', selectedChildName);
      else localStorage.removeItem('userName');
    } catch (e) {
      // ignore storage errors
    }
  }, [selectedChildName]);

  // Emit a same-tab event for consumers that don't use context directly
  useEffect(() => {
    try {
      const evt = new CustomEvent('selectedChildChanged', { detail: { id: selectedChildId, name: selectedChildName } });
      window.dispatchEvent(evt);
    } catch (e) {
      // ignore
    }
  }, [selectedChildId, selectedChildName]);

  const setSelectedChild = (id, name) => {
    setSelectedChildId(id ? String(id) : null);
    setSelectedChildName(name || null);
  };

  return (
    <SelectedChildContext.Provider value={{ selectedChildId, selectedChildName, setSelectedChild }}>
      {children}
    </SelectedChildContext.Provider>
  );
};
