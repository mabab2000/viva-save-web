import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './Toast';

const Profile = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Default profile id - replaceable by storing/reading from auth or localStorage
  const defaultProfileId = '1f7ac917-c48e-4bf8-9c9a-0f5ab96def75';
  const profileId = window.localStorage.getItem('profileId') || defaultProfileId;

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://saving-api.mababa.app/api/profile/${profileId}`);
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

    fetchProfile();
  }, [profileId, toast]);

  if (loading) return (
    <div className="p-6">
      <div className="flex items-center space-x-2">
        <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        <span>Loading profile...</span>
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
    <div className="p-6">
      <div className="mb-4">
        <button onClick={() => navigate('/dashboard')} className="text-blue-600 hover:text-blue-800">← Back to Dashboard</button>
      </div>

      <div className="bg-white rounded-lg shadow p-6 max-w-3xl mx-auto">
        <div className="flex items-center space-x-6">
          <div className="w-28 h-28 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
            {profile.profile_image_url ? (
              // eslint-disable-next-line jsx-a11y/img-redundant-alt
              <img src={profile.profile_image_url} alt="profile image" className="w-full h-full object-cover" />
            ) : (
              <div className="text-3xl font-bold text-gray-600">{(profile.username || 'U').charAt(0)}</div>
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-gray-800">{profile.username}</h1>
            <p className="text-sm text-gray-500 mt-1">{profile.email}</p>
            <p className="text-sm text-gray-500">{profile.phone_number}</p>

            <div className="mt-4 flex items-center space-x-4">
              <div>
                <div className="text-xs text-gray-500">Total Saving</div>
                <div className="text-xl font-bold text-green-600">{new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(profile.total_saving)}</div>
              </div>

              <div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">Edit Profile</button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-sm text-gray-700">
          <h3 className="font-medium mb-2">Account Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><strong>ID:</strong> {profile.id}</div>
            <div><strong>Email:</strong> {profile.email}</div>
            <div><strong>Phone:</strong> {profile.phone_number}</div>
            <div><strong>Total Saving:</strong> {new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(profile.total_saving)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
