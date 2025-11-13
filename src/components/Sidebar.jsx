import { Link } from 'react-router-dom';

const Sidebar = ({ isOpen, activeSection, onSectionChange }) => {
  const menuItems = [
    {
      id: 'overview',
      name: 'Overview',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v0M8 5v2a2 2 0 002 2h4a2 2 0 002-2V5" />
        </svg>
      )
    },
    {
      id: 'users',
      name: 'Users',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a4 4 0 00-3-3.87" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20H4v-2a4 4 0 013-3.87" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 12a4 4 0 100-8 4 4 0 000 8z" />
        </svg>
      )
    },
    {
      id: 'savings',
      name: 'Savings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      )
    },
    {
      id: 'loans',
      name: 'Loans',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a5 5 0 00-10 0v2" />
          <rect width="20" height="8" x="2" y="9" rx="2" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 17v2a2 2 0 002 2h8a2 2 0 002-2v-2" />
        </svg>
      )
    },
    {
      id: 'penalties',
      name: 'Penalties',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-1.414 1.414A9 9 0 105.636 18.364l1.414-1.414A7 7 0 1116.95 7.05z" />
        </svg>
      )
    }
  ];

  // compute classes so we can vary behavior on small screens
  const base = 'fixed left-0 top-0 h-full bg-white shadow-lg border-r border-gray-200 z-40 transition-all duration-300 transform';
  const mobileTransform = isOpen ? 'translate-x-0' : '-translate-x-full';
  const smWidth = isOpen ? 'sm:w-64' : 'sm:w-16';

  return (
    <>
      {/* backdrop for small screens when sidebar is open */}
      <div className={`${isOpen ? 'fixed' : 'hidden'} inset-0 bg-black bg-opacity-40 z-30 sm:hidden`} onClick={() => onSectionChange && onSectionChange('')}></div>
      <div className={`${base} ${mobileTransform} w-64 sm:translate-x-0 ${smWidth}`}> 
      {/* Logo Section */}
      <div className="flex items-center p-4 border-b border-gray-200">
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-white flex items-center justify-center">
          <img src="/logo.png" alt="SaveTracker" className="w-full h-full object-cover" onError={(e)=>{e.target.style.display='none'}} />
        </div>
        {isOpen && (
          <div className="ml-3">
            <h2 className="text-xl font-bold text-gray-800">Alphonse</h2>
            <p className="text-xs text-gray-500">Savings Management</p>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="mt-6">
        <div className="space-y-1 px-3">
          <Link to="/dashboard" className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${activeSection === 'overview' ? 'bg-savings-blue text-white' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}`}> <span className="flex-shrink-0">{menuItems[0].icon}</span> {isOpen && <span className="ml-3">Overview</span>} </Link>
          <Link to="/dashboard/users" className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${activeSection === 'users' ? 'bg-savings-blue text-white' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}`}> <span className="flex-shrink-0">{menuItems[1].icon}</span> {isOpen && <span className="ml-3">Users</span>} </Link>
          <Link to="/dashboard/savings" className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${activeSection === 'savings' ? 'bg-savings-blue text-white' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}`}> <span className="flex-shrink-0">{menuItems[2].icon}</span> {isOpen && <span className="ml-3">Savings</span>} </Link>
          <Link to="/dashboard/loans" className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${activeSection === 'loans' ? 'bg-savings-blue text-white' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}`}> <span className="flex-shrink-0">{menuItems[3].icon}</span> {isOpen && <span className="ml-3">Loans</span>} </Link>
          <Link to="/dashboard/penalties" className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${activeSection === 'penalties' ? 'bg-savings-blue text-white' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}`}> <span className="flex-shrink-0">{menuItems[4].icon}</span> {isOpen && <span className="ml-3">Penalties</span>} </Link>
        </div>
      </nav>

    </div>
    </>
  );
};

export default Sidebar;