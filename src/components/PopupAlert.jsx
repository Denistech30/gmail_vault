import React, { useState, useEffect } from 'react';
import { CheckCircle, X, AlertCircle, Info } from 'lucide-react';

export default function PopupAlert({ 
  message, 
  type = 'success', 
  isOpen, 
  onClose, 
  autoClose = true, 
  duration = 3000 
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      
      if (autoClose) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);
        
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, autoClose, duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose?.();
    }, 300); // Wait for animation to complete
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      case 'info':
        return <Info className="w-6 h-6 text-blue-500" />;
      default:
        return <CheckCircle className="w-6 h-6 text-green-500" />;
    }
  };


  if (!isOpen) return null;

  const typeStyles = {
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300'
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        onClick={handleClose}
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className={`relative w-full max-w-md transform transition-all duration-300 pointer-events-auto ${
            isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
        >
          {/* Modal Content */}
          <div className={`relative rounded-2xl border p-6 shadow-2xl backdrop-blur-xl ${typeStyles[type] || typeStyles.success}`}>
            {/* Close button */}
            <button
              onClick={handleClose}
              aria-label="Close"
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            {/* Content */}
            <div className="flex items-start gap-4 pr-8">
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {getIcon()}
              </div>
              
              {/* Message */}
              <div className="flex-1">
                <p className="text-sm font-medium leading-relaxed">
                  {message}
                </p>
              </div>
            </div>
            
            {/* Progress bar for auto-close */}
            {autoClose && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10 dark:bg-white/10 rounded-b-2xl overflow-hidden">
                <div 
                  className="h-full bg-current opacity-30 transition-all ease-linear"
                  style={{ 
                    width: isVisible ? '0%' : '100%',
                    transitionDuration: `${duration}ms`
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
