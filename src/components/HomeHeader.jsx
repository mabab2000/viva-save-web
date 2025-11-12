import { useState } from 'react';
import { Link } from 'react-router-dom';

const HomeHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <img 
                src="/logo.png" 
                alt="SaveTracker" 
                className="h-8 w-8"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div 
                className="hidden w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center"
                style={{display: 'none'}}
              >
                <span className="text-white font-bold text-sm">ST</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Saving</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">Features</a>
              <a href="#team" className="text-gray-600 hover:text-blue-600 transition-colors">Team</a>
              <a href="#contact" className="text-gray-600 hover:text-blue-600 transition-colors">Contact</a>
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Link 
              to="/login" 
              className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
            >
              Sign In
            </Link>
           
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-gray-900 focus:outline-none focus:text-gray-900"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
              <a href="#features" className="block px-3 py-2 text-gray-600 hover:text-blue-600 transition-colors">Features</a>
              <a href="#team" className="block px-3 py-2 text-gray-600 hover:text-blue-600 transition-colors">Team</a>
              <a href="#contact" className="block px-3 py-2 text-gray-600 hover:text-blue-600 transition-colors">Contact</a>
              <div className="border-t border-gray-200 pt-4">
                <Link 
                  to="/login" 
                  className="block px-3 py-2 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link 
                  to="/signup" 
                  className="block mx-3 my-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-center transition-colors"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default HomeHeader;