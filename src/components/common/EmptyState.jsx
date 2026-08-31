// src/components/common/EmptyState.jsx
import React from 'react';
import { Card } from 'react-bootstrap';
import { useLanguage } from '../../context/LanguageContext';

const EmptyState = ({ 
  title, 
  message, 
  icon = '📭', 
  size = 'normal',
  actionButton = null,
  className = ''
}) => {
  const { isArabic } = useLanguage();

  const getIconSize = () => {
    switch(size) {
      case 'small':
        return '3rem';
      case 'large':
        return '6rem';
      default:
        return '4rem';
    }
  };

  const getPadding = () => {
    switch(size) {
      case 'small':
        return 'p-4';
      case 'large':
        return 'p-5';
      default:
        return 'p-4';
    }
  };

  return (
    <Card className={`empty-state border-0 shadow-sm ${className} ${getPadding()}`}>
      <Card.Body className="text-center">
        <div className="empty-state-icon mb-3" style={{ fontSize: getIconSize() }}>
          {icon}
        </div>
        <h5 className="empty-state-title fw-bold mb-2">{title}</h5>
        <p className="empty-state-message text-muted mb-3">{message}</p>
        {actionButton && (
          <div className="empty-state-action">
            {actionButton}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default EmptyState;