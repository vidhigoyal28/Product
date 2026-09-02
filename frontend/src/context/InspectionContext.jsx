import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const InspectionContext = createContext(null);

export function InspectionProvider({ children }) {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentInspection, setCurrentInspection] = useState(null);

  const refreshHistory = async (filters = {}) => {
    setLoading(true);
    try {
      const data = await api.history.list(filters);
      setInspections(data);
    } catch (err) {
      console.error('Failed to load inspections', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshHistory();
  }, []);

  const createInspection = async (formData) => {
    const created = await api.inspection.create(formData);
    setCurrentInspection(created);
    await refreshHistory();
    return created;
  };

  const getInspection = async (id) => {
    const item = await api.inspection.getById(id);
    setCurrentInspection(item);
    return item;
  };

  const updateReview = async (id, reviewData) => {
    const updated = await api.inspection.updateReview(id, reviewData);
    setCurrentInspection(updated);
    await refreshHistory();
    return updated;
  };

  return (
    <InspectionContext.Provider
      value={{
        inspections,
        currentInspection,
        loading,
        refreshHistory,
        createInspection,
        getInspection,
        updateReview,
        setCurrentInspection,
      }}
    >
      {children}
    </InspectionContext.Provider>
  );
}

export function useInspection() {
  const context = useContext(InspectionContext);
  if (!context) {
    throw new Error('useInspection must be used within an InspectionProvider');
  }
  return context;
}
