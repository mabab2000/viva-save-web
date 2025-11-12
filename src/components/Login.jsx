import { useState } from 'react';
import { APP_BASE_URL } from '../config';
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
  <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-savings-blue to-savings-purple p-5 relative overflow-x-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><pattern id='grid' width='10' height='10' patternUnits='userSpaceOnUse'><path d='M 10 0 L 0 0 0 10' fill='none' stroke='rgba(255,255,255,0.05)' stroke-width='1'/></pattern></defs><rect width='100' height='100' fill='url(%23grid)'/></svg>")`
        }}></div>
      </div>

      {/* Header Section */}
      <div className="text-center mb-8 relative z-10">
        
       
        <p className="text-white text-opacity-90 text-lg font-light">Sign in to Manage all savings (Only Admin) </p>
      </div>

      {/* Login Card */}
      <div className="bg-white bg-opacity-95 backdrop-blur-xl rounded-3xl p-10 w-full max-w-md shadow-2xl border border-white border-opacity-20 relative z-10">
        {apiError && <div className="text-red-500 text-center mb-4 font-semibold">{apiError}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-gray-700 font-semibold mb-2 text-sm">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-3 border-2 rounded-xl text-base transition-all duration-300 bg-white ${
                errors.email 
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-100' 
                  : 'border-gray-300 focus:border-savings-blue focus:ring-blue-100'
              } focus:outline-none focus:ring-4`}
              placeholder="Enter your email"
              autoComplete="email"
            />
            {errors.email && <span className="text-red-500 text-sm mt-1 block font-medium">{errors.email}</span>}
          </div>

          <div>
            <label htmlFor="password" className="block text-gray-700 font-semibold mb-2 text-sm">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-4 py-3 border-2 rounded-xl text-base transition-all duration-300 bg-white ${
                errors.password 
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-100' 
                  : 'border-gray-300 focus:border-savings-blue focus:ring-blue-100'
              } focus:outline-none focus:ring-4`}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
            {errors.password && <span className="text-red-500 text-sm mt-1 block font-medium">{errors.password}</span>}
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center cursor-pointer text-gray-700">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="w-5 h-5 border-2 border-gray-300 rounded mr-3 accent-savings-blue focus:ring-2 focus:ring-savings-blue focus:ring-offset-2"
              />
              Remember me
            </label>
            <Link to="/forgot-password" className="text-savings-blue hover:text-savings-purple font-medium text-sm transition-colors">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-gradient-to-r from-savings-blue to-savings-purple text-white py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center space-x-3 ${
              isLoading 
                ? 'opacity-70 cursor-not-allowed' 
                : 'hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-300'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-opacity-30 border-t-white rounded-full animate-spin"></div>
                <span>Signing in...</span>
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-5 bg-white text-gray-500">Don't have an account?</span>
            </div>
          </div>
        </div>

        {/* <Link 
          to="/signup" 
          className="mt-5 block w-full text-center py-3 px-6 border-2 border-savings-blue text-savings-blue rounded-xl font-semibold transition-all duration-300 hover:bg-savings-blue hover:text-white hover:-translate-y-0.5 hover:shadow-lg"
        >
          Create Account
        </Link> */}
      </div>
    </div>
  );
};

export default Login;