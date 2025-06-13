import React, { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';

interface WelcomeToastProps {
  onDismiss: () => void;
}

export const WelcomeToast: React.FC<WelcomeToastProps> = ({ onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show toast after a brief delay for smooth entrance
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300); // Wait for animation to complete
  };

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    const timer = setTimeout(handleDismiss, 8000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}
    >
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-lg shadow-2xl max-w-sm border border-white/20 backdrop-blur-sm">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <Sparkles className="h-6 w-6 text-yellow-300 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold mb-1">
              🎉 Welcome to Smart Notes!
            </h4>
            <p className="text-xs text-blue-100 leading-relaxed">
              Your AI-powered note-taking journey starts now! Check out the welcome note to discover all the amazing features.
            </p>
          </div>
          <button 
            onClick={handleDismiss}
            className="flex-shrink-0 ml-2 text-white/80 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 flex space-x-2">
          <div className="h-1 bg-white/30 rounded-full flex-1">
            <div className="h-1 bg-yellow-300 rounded-full animate-pulse w-3/4"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
