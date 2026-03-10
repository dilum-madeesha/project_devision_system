import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import DailyLaborCostReport from '../pages/reports/reportnavigation/DailyLaborCostReport';
import LaborReport from '../pages/reports/reportnavigation/LaborReport';

const DefaultReportsPage = () => {
  const { user } = useAuth();
  
  // For L5 - Job Cost Manager, show Labor Distribution Report by default
  if (user?.privilege === 5) {
    return <LaborReport />;
  }
  
  // For all other users, show Daily Labor Cost Report by default
  return <DailyLaborCostReport />;
};

export default DefaultReportsPage;
