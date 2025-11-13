import { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import DashboardOverview from './DashboardOverview';
import Users from './Users';
import Loans from './Loans';
import Payment from './Payment';
import Penalties from './Penalties';
import Savings from './Savings';
import { Routes, Route, useLocation } from 'react-router-dom';

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  // Determine active section from location
  const activeSection = (() => {
    if (location.pathname.startsWith('/dashboard/users')) return 'users';
    if (location.pathname.startsWith('/dashboard/savings')) return 'savings';
    if (location.pathname.startsWith('/dashboard/loans')) return 'loans';
    if (location.pathname.startsWith('/dashboard/penalties')) return 'penalties';
    return 'overview';
  })();

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        isOpen={sidebarOpen} 
        activeSection={activeSection}
        onSectionChange={() => setSidebarOpen(false)}
      />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-0 sm:ml-64' : 'ml-0 sm:ml-16'}`}>
        <Header 
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <Routes>
            <Route path="/" element={<DashboardOverview />} />
            <Route path="/users" element={<Users />} />
            <Route path="/savings" element={<Savings />} />
            <Route path="/loans" element={<Loans />} />
            <Route path="/payment/:id" element={<Payment />} />
            <Route path="/penalties" element={<Penalties />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;