
import React from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import ExplicitForwardProxy from './ExplicitForwardProxy';

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/global-secure-access/connectors/explicit-forward-proxy" element={<ExplicitForwardProxy />} />
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default Index;
