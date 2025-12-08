import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Default profile id - can be overridden by storing a real id in localStorage
const DEFAULT_PROFILE_ID = '1f7ac917-c48e-4bf8-9c9a-0f5ab96def75';

const Header = ({ sidebarOpen, onToggleSidebar }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    Header.fetchProfile(setProfile);
  }, []);

  const notifications = [
    { id: 1, message: "You've reached 80% of your Emergency Fund goal!", type: "success", time: "2 hours ago" },
    { id: 2, message: "Monthly savings report is ready", type: "info", time: "1 day ago" },
    { id: 3, message: "Reminder: Update your vacation savings goal", type: "warning", time: "3 days ago" }
  ];

  return (
    <header className="bg-white shadow-sm border-b py-4">
      <div className="flex items-center justify-between flex-nowrap">
        {/* Left Section - Toggle & Search */}
        <div className="flex items-center space-x-4 flex-nowrap">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
         
        </div>

        {/* Right Section - Notifications & Profile */}
        <div className="flex items-center space-x-4 flex-nowrap">
          {/* Quick Actions */}
          

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors relative"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
                {notifications.length}
              </span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="p-4 border-b border-gray-100 hover:bg-gray-50">
                      <div className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          notification.type === 'success' ? 'bg-green-500' :
                          notification.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`}></div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-800">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4">
                  <button className="w-full text-center text-savings-blue hover:text-savings-purple font-medium text-sm">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 transition-colors whitespace-nowrap"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                {profile?.profile_image_url ? (
                  <img 
                    src={profile.profile_image_url} 
                    alt="avatar" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className={`bg-gradient-to-r from-blue-600 to-purple-600 w-full h-full flex items-center justify-center text-white font-medium text-sm ${profile?.profile_image_url ? 'hidden' : 'flex'}`}>
                  {profile?.username ? profile.username.charAt(0).toUpperCase() : 'U'}
                </div>
              </div>
              <div className="text-left max-w-xs">
                <p className="text-sm font-medium text-gray-800 truncate">{profile?.username || 'User'}</p>
                <p className="text-xs text-gray-500 truncate">{profile?.phone_number || 'No phone'}</p>
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="py-2">
                  <Link to="/dashboard/profile" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 block">Profile</Link>
               
                  <hr className="my-2" />
                  <Link to="/login" className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 block">Sign Out</Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

// Fetch profile info for header display
Header.fetchProfile = async function setHeaderProfile(setProfile) {
  try {
    const profileId = window.localStorage.getItem('profileId') || DEFAULT_PROFILE_ID;
    const res = await fetch(`https://saving-api.mababa.app/api/profile/${profileId}`);
    if (!res.ok) return;
    const data = await res.json();
    setProfile(data);
  } catch (e) {
    // ignore header profile fetch errors
    console.warn('Header profile fetch failed', e);
  }
};

export default Header;