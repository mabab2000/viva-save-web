import { useState, useEffect } from 'react';
import { APP_BASE_URL, GOOGLE_OAUTH_CONFIG } from '../config';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [isGoogleReady, setIsGoogleReady] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  useEffect(() => {
    // Initialize Google OAuth
    const initializeGoogleOAuth = () => {
      if (window.google) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_OAUTH_CONFIG.client_id,
            callback: handleGoogleLogin,
            auto_select: false,
            cancel_on_tap_outside: true
          });
          setIsGoogleReady(true);
          console.log('Google OAuth initialized successfully');
        } catch (error) {
          console.error('Google OAuth initialization error:', error);
          setApiError('Failed to initialize Google Sign-In. Please refresh the page.');
        }
      }
    };

    // Check if Google script is loaded
    const checkGoogleLoaded = () => {
      if (window.google && window.google.accounts) {
        initializeGoogleOAuth();
      } else {
        // Wait for Google script to load
        setTimeout(checkGoogleLoaded, 100);
      }
    };

    checkGoogleLoaded();
  }, []);

  const handleGoogleLogin = async (response) => {
    try {
      setIsLoading(true);
      setApiError('');
      
      console.log('Google login response:', response);
      console.log('Credential length:', response.credential?.length);
      console.log('Sending to:', `${APP_BASE_URL}/login/google`);
      
      if (!response.credential) {
        throw new Error('No credential received from Google');
      }
      
      const requestPayload = {
        token: response.credential,
        fcm_token: "string"  // Optional FCM token for push notifications
      };
      console.log('Request payload:', { ...requestPayload, token: requestPayload.token.substring(0, 50) + '...' });
      
      // Send Google ID token to your backend
      const res = await fetch(`${APP_BASE_URL}/login/google`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestPayload)
      });
      
      console.log('Backend response status:', res.status);
      const data = await res.json();
      console.log('Backend response data:', data);
      
      if (res.ok) {
        // Save token and user info to localStorage - matching API response format
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('user_info', JSON.stringify(data.user_info));
        // Save profileId using the user_info.id from the response
        if (data.user_info && data.user_info.id) {
          localStorage.setItem('profileId', data.user_info.id);
        }
        console.log('Login successful, user info:', data.user_info);
        navigate('/dashboard');
      } else {
        console.error('Backend login error:', data);
        setApiError(data.detail || 'Google login failed. Please try again.');
      }
    } catch (error) {
      console.error('Google login error:', error);
      if (error.message.includes('Failed to fetch')) {
        setApiError('Unable to connect to server. Please check your internet connection.');
      } else if (error.name === 'TypeError') {
        setApiError('Network error. Please ensure you have internet access.');
      } else {
        setApiError(`Google login error: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setApiError('');
    try {
      const response = await fetch(`${APP_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });
      const data = await response.json();
      if (response.ok) {
        // Save token and user info to localStorage
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('user_info', JSON.stringify(data.user_info));
        // Also save profileId so Header/Profile components can fetch profile data
        if (data.user_info && data.user_info.id) {
          localStorage.setItem('profileId', data.user_info.id);
        }
        navigate('/dashboard');
      } else {
        setApiError(data.detail || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      setApiError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-6 w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          {/* <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h1> */}
          <p className="text-gray-600">Sign in to your admin account</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-blue-600 p-8">
          {apiError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm font-medium">{apiError}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-xl text-sm transition-colors ${
                  errors.email 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                    : 'border-blue-300 focus:border-blue-500 focus:ring-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-opacity-20`}
                placeholder="Enter your email address"
                autoComplete="email"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-xl text-sm transition-colors ${
                  errors.password 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                    : 'border-blue-300 focus:border-blue-500 focus:ring-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-opacity-20`}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-blue-300 rounded"
              />
              <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                Remember me
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-medium text-sm transition-colors ${
                isLoading 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Google OAuth Button */}
            <div className="w-full">
              {isGoogleReady ? (
                <div>
                  <div 
                    id="google-signin-button" 
                    className="w-full"
                    ref={(div) => {
                      if (div && window.google && isGoogleReady) {
                        try {
                          window.google.accounts.id.renderButton(div, {
                            theme: 'outline',
                            size: 'large',
                            width: '100%',
                            text: 'signin_with',
                            shape: 'rectangular'
                          });
                        } catch (error) {
                          console.error('Google button render error:', error);
                        }
                      }
                    }}
                  ></div>
                  
                  {/* Debug info - remove in production */}
                  <div className="mt-2 text-xs text-gray-500 text-center">
                    Client ID: {GOOGLE_OAUTH_CONFIG.client_id?.substring(0, 20)}...
                    <br />
                    Current Origin: {window.location.origin}
                  </div>
                </div>
              ) : (
                <button 
                  type="button"
                  disabled
                  className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-500 bg-gray-50"
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Loading Google Sign In...
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Sign up link */}
        <div className="text-center mt-6">
          <p className="text-gray-600 text-sm">
            Don't have an account?{' '}
            <Link 
              to="/signup" 
              className="text-blue-600 hover:text-blue-500 font-medium transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;