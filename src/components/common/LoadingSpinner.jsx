// src/components/common/LoadingSpinner.jsx
import React from 'react';
import { Spinner } from 'react-bootstrap';
import { useLanguage } from '../../context/LanguageContext';

const LoadingSpinner = ({ 
  size = 'md', 
  message = null, 
  fullPage = false,
  className = ''
}) => {
  const { isArabic } = useLanguage();

  const getSpinnerSize = () => {
    switch(size) {
      case 'sm':
        return '1.5rem';
      case 'lg':
        return '4rem';
      default:
        return '2.5rem';
    }
  };

  const defaultMessage = isArabic ? 'جاري التحميل...' : 'Loading...';
  const displayMessage = message || defaultMessage;

  const spinnerContent = (
    <div className={`loading-spinner text-center ${className}`}>
      <Spinner 
        animation="border" 
        variant="primary" 
        role="status"
        style={{ width: getSpinnerSize(), height: getSpinnerSize() }}
      >
        <span className="visually-hidden">{displayMessage}</span>
      </Spinner>
      <p className="mt-3 text-muted">{displayMessage}</p>
    </div>
  );

  if (fullPage) {
    return (
      <div className="loading-spinner-fullpage d-flex align-items-center justify-content-center" 
           style={{ minHeight: '100vh' }}>
        {spinnerContent}
      </div>
    );
  }

  return spinnerContent;
};

export default LoadingSpinner;