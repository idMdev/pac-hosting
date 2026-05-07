
import React from 'react';
import Breadcrumb from '@/components/Breadcrumb';

const Dashboard: React.FC = () => {
  const breadcrumbItems = [
    { label: 'Home' }
  ];

  return (
    <div className="p-6">
      <Breadcrumb items={breadcrumbItems} />
      
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Welcome to the Microsoft Entra admin center dashboard.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Quick Actions</h3>
          <p className="text-gray-600">Access your most common administrative tasks.</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Recent Activity</h3>
          <p className="text-gray-600">View your recent administrative activities.</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-2">System Health</h3>
          <p className="text-gray-600">Monitor the health of your services.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
