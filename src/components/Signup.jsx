import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreedToTerms: false
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

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

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.agreedToTerms) {
      newErrors.agreedToTerms = 'You must agree to the terms and conditions';
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
    
    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Signup submitted:', formData);
      
      // Redirect to dashboard on successful signup
      navigate('/dashboard');
    } catch (error) {
      console.error('Signup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-savings-blue to-savings-purple p-5 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><pattern id='grid' width='10' height='10' patternUnits='userSpaceOnUse'><path d='M 10 0 L 0 0 0 10' fill='none' stroke='rgba(255,255,255,0.05)' stroke-width='1'/></pattern></defs><rect width='100' height='100' fill='url(%23grid)'/></svg>")`
        }}></div>
      </div>

      {/* Header Section */}
      <div className="text-center mb-8 relative z-10">
        <div className="w-20 h-20 mx-auto mb-5 bg-white bg-opacity-10 rounded-full flex items-center justify-center backdrop-blur-md border border-white border-opacity-20 animate-float">
          <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,2C13.1,2 14,2.9 14,4C14,5.1 13.1,6 12,6C10.9,6 10,5.1 10,4C10,2.9 10.9,2 12,2M21,9V7L15,1H5C3.89,1 3,1.89 3,3V21A2,2 0 0,0 5,23H19A2,2 0 0,0 21,21V9M19,9H14V4H19V9Z"/>
          </svg>
        </div>
        <h1 className="text-white text-4xl font-bold mb-3 drop-shadow-lg">Start Saving Today</h1>
        <p className="text-white text-opacity-90 text-lg font-light">Create your Savings Management Account</p>
      </div>

      {/* Signup Card */}
      <div className="bg-white bg-opacity-95 backdrop-blur-xl rounded-3xl p-10 w-full max-w-lg shadow-2xl border border-white border-opacity-20 relative z-10">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-gray-700 font-semibold mb-2 text-sm">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={`w-full px-4 py-3 border-2 rounded-xl text-base transition-all duration-300 bg-white ${
                  errors.firstName 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-100' 
                    : 'border-gray-300 focus:border-savings-blue focus:ring-blue-100'
                } focus:outline-none focus:ring-4`}
                placeholder="First name"
                autoComplete="given-name"
              />
              {errors.firstName && <span className="text-red-500 text-sm mt-1 block font-medium">{errors.firstName}</span>}
            </div>

            <div>
              <label htmlFor="lastName" className="block text-gray-700 font-semibold mb-2 text-sm">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={`w-full px-4 py-3 border-2 rounded-xl text-base transition-all duration-300 bg-white ${
                  errors.lastName 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-100' 
                    : 'border-gray-300 focus:border-savings-blue focus:ring-blue-100'
                } focus:outline-none focus:ring-4`}
                placeholder="Last name"
                autoComplete="family-name"
              />
              {errors.lastName && <span className="text-red-500 text-sm mt-1 block font-medium">{errors.lastName}</span>}
            </div>
          </div>

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
              placeholder="Create a password"
              autoComplete="new-password"
            />
            {errors.password && <span className="text-red-500 text-sm mt-1 block font-medium">{errors.password}</span>}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-gray-700 font-semibold mb-2 text-sm">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full px-4 py-3 border-2 rounded-xl text-base transition-all duration-300 bg-white ${
                errors.confirmPassword 
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-100' 
                  : 'border-gray-300 focus:border-savings-blue focus:ring-blue-100'
              } focus:outline-none focus:ring-4`}
              placeholder="Confirm your password"
              autoComplete="new-password"
            />
            {errors.confirmPassword && <span className="text-red-500 text-sm mt-1 block font-medium">{errors.confirmPassword}</span>}
          </div>

          <div>
            <label className="flex items-start cursor-pointer text-gray-700">
              <input
                type="checkbox"
                name="agreedToTerms"
                checked={formData.agreedToTerms}
                onChange={handleChange}
                className="w-5 h-5 border-2 border-gray-300 rounded mr-3 mt-0.5 accent-savings-blue focus:ring-2 focus:ring-savings-blue focus:ring-offset-2"
              />
              <span className="text-sm">
                I agree to the <Link to="/terms" className="text-savings-blue hover:text-savings-purple font-medium">Terms of Service</Link> and <Link to="/privacy" className="text-savings-blue hover:text-savings-purple font-medium">Privacy Policy</Link>
              </span>
            </label>
            {errors.agreedToTerms && <span className="text-red-500 text-sm mt-1 block font-medium">{errors.agreedToTerms}</span>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-gradient-to-r from-savings-blue to-savings-purple text-white py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center space-x-3 mt-6 ${
              isLoading 
                ? 'opacity-70 cursor-not-allowed' 
                : 'hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-300'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-opacity-30 border-t-white rounded-full animate-spin"></div>
                <span>Creating Account...</span>
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-5 bg-white text-gray-500">Already have an account?</span>
            </div>
          </div>
        </div>

        <Link 
          to="/login" 
          className="mt-5 block w-full text-center py-3 px-6 border-2 border-savings-blue text-savings-blue rounded-xl font-semibold transition-all duration-300 hover:bg-savings-blue hover:text-white hover:-translate-y-0.5 hover:shadow-lg"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
};

export default Signup;