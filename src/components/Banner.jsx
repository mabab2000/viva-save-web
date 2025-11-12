import React from 'react';

const Banner = () => {
  return (
    <div className="relative h-screen w-full overflow-hidden mt-16">
      {/* Background Image */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700">
        {/* You can replace this gradient with an actual image */}
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
      </div>
      
      {/* Content Overlay */}
      <div className="relative z-10 flex items-center justify-center h-full px-4">
        <div className="text-center text-white max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Save Smart,
            <span className="block text-yellow-400">Live Better</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-200 max-w-2xl mx-auto">
            Take control of your financial future with our professional savings management system. 
            Set goals, track progress, and achieve your dreams.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-8 py-4 rounded-lg text-lg transition-colors duration-300">
              Start Saving Today
            </button>
            <button className="border-2 border-white text-white hover:bg-white hover:text-gray-900 font-semibold px-8 py-4 rounded-lg text-lg transition-colors duration-300">
              Learn More
            </button>
          </div>
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white animate-bounce">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </div>
  );
};

export default Banner;