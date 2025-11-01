import { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import DashboardOverview from './DashboardOverview';

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return <DashboardOverview />;
      case 'goals':
        return <div className="p-6"><h2 className="text-2xl font-bold text-gray-800">Savings Goals</h2><p className="text-gray-600 mt-2">Manage your savings goals here.</p></div>;
      case 'transactions':
        return <div className="p-6"><h2 className="text-2xl font-bold text-gray-800">Transactions</h2><p className="text-gray-600 mt-2">View your transaction history.</p></div>;
      case 'analytics':
        return <div className="p-6"><h2 className="text-2xl font-bold text-gray-800">Analytics</h2><p className="text-gray-600 mt-2">View your savings analytics and reports.</p></div>;
      case 'settings':
        return <div className="p-6"><h2 className="text-2xl font-bold text-gray-800">Settings</h2><p className="text-gray-600 mt-2">Manage your account settings.</p></div>;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        isOpen={sidebarOpen} 
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <Header 
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;