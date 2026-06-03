import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './Toast';

const Profile = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Default profile id - replaceable by storing/reading from auth or localStorage
  const defaultProfileId = '1f7ac917-c48e-4bf8-9c9a-0f5ab96def75';
  const profileId = window.localStorage.getItem('profileId') || defaultProfileId;

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`https://viva-api-366k.onrender.com/api/profile/${profileId}`);
      if (!res.ok) throw new Error(`Failed to fetch profile: ${res.status}`);
      const data = await res.json();
      setProfile(data);
    } catch (err) {
      setError(err.message);
      toast.addToast(err.message, { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.addToast('New passwords do not match', { type: 'error' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.addToast('Password must be at least 6 characters long', { type: 'error' });
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch(`https://viva-api-366k.onrender.com/api/profile/${profileId}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          old_password: passwordData.oldPassword,
          new_password: passwordData.newPassword
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to change password');
      }

      toast.addToast('Password changed successfully!', { type: 'success' });
      setShowPasswordModal(false);
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.addToast(err.message, { type: 'error' });
    } finally {
      setPasswordLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [profileId, toast]);

  if (loading) return (
    <div className="p-6">
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" aria-hidden="true"></div>
          <div className="mt-3 text-gray-600">Loading profile...</div>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="p-6">
      <button onClick={() => navigate('/dashboard')} className="text-blue-600 hover:text-blue-800 mb-4">← Back</button>
      <div className="text-red-600">{error}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Dashboard</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border p-8 h-[85vh] overflow-hidden">
              <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
                {/* Profile Image */}
                <div className="relative">
                  <div className="w-64 h-64 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center shadow-lg">
                    {profile.profile_image_url ? (
                      <img
                        src={profile.profile_image_url}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : (
                      <div className="text-6xl font-bold text-blue-600">
                        {(profile.username || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-4 right-4 w-16 h-16 bg-green-500 rounded-full border-4 border-white"></div>
                </div>

                {/* Profile Info */}
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{profile.username}</h1>
                  <p className="text-lg text-gray-600 mb-1">{profile.email}</p>
                  <p className="text-md text-gray-500 mb-4">{profile.phone_number}</p>

                  <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
                    <div className="bg-green-50 px-6 py-3 rounded-lg border border-green-200">
                      <div className="text-sm text-green-600 font-medium">Total Savings</div>
                      <div className="text-2xl font-bold text-green-700">
                        {new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(profile.total_saving)}
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium">
                        Edit Profile
                      </button>
                      <button
                        onClick={() => setShowPasswordModal(true)}
                        className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
                      >
                        Change Password
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Details moved here */}
              <div className="mt-6 bg-gray-50 rounded-lg p-4 border">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Account Details
                </h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <div>
                    <div className="text-sm text-gray-500">User ID</div>
                    <div className="text-sm font-mono text-gray-800 break-all">{profile.id}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Email Address</div>
                    <div className="text-sm text-gray-800">{profile.email}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Phone Number</div>
                    <div className="text-sm text-gray-800">{profile.phone_number}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Total Savings</div>
                    <div className="text-lg font-bold text-green-600">
                      {new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(profile.total_saving)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Password Change Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordData.oldPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter current password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter new password (min 6 characters)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Confirm new password"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={passwordLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center"
                  >
                    {passwordLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      'Change Password'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
