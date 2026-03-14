import React from 'react';
import AnalystDashboard from '../components/AnalystDashboard/AnalystDashboard';
import ErrorBoundary from '../components/ErrorBoundary';

const AnalystDashboardPage = () => {
  return (
    <ErrorBoundary>
      <AnalystDashboard />
    </ErrorBoundary>
  );
};

export default AnalystDashboardPage;
