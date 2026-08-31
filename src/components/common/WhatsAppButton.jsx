import React, { useState } from 'react';
import { FaWhatsapp } from 'react-icons/fa';

const WhatsAppButton = () => {
  // 🔥 IMPORTANT: Use your actual phone number with country code
  // Example: For Morocco +212 6XX-XXXXXX, use '2126XXXXXXXX'
  // For US +1 234-567-8900, use '12345678900'
  const phoneNumber = '+212 0783797850'; // Replace with YOUR number (no + sign)

  // Pre-filled message
  const message = 'السلام عليكم، أرغب في الاستفسار عن مدرسة الفتحي';

  // Alternate English message
  // const message = 'Hello, I would like to inquire about Madrasatul Fathi School';

  const handleWhatsAppClick = () => {
    // Create WhatsApp URL with direct number
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div
      className="whatsapp-button"
      onClick={handleWhatsAppClick}
      style={{
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        zIndex: 1000,
        cursor: 'pointer',
      }}
    >
      {/* Main WhatsApp Icon */}
      <div
        style={{
          backgroundColor: '#25D366',
          borderRadius: '50%',
          width: '60px',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(37, 211, 102, 0.4)',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 6px 30px rgba(37, 211, 102, 0.6)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(37, 211, 102, 0.4)';
        }}
      >
        <FaWhatsapp size={32} color="white" />
      </div>

      {/* Notification Badge */}
      <div
        style={{
          position: 'absolute',
          top: '-5px',
          right: '-5px',
          backgroundColor: '#ff6b6b',
          borderRadius: '50%',
          width: '22px',
          height: '22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          color: 'white',
          fontWeight: 'bold',
          animation: 'pulse 2s infinite',
        }}
      >
        📱
      </div>

      {/* Tooltip */}
      <div
        style={{
          position: 'absolute',
          right: '70px',
          top: '50%',
          transform: 'translateY(-50%)',
          backgroundColor: 'white',
          padding: '10px 18px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          fontSize: '14px',
          fontWeight: '600',
          color: '#1a5f7a',
          whiteSpace: 'nowrap',
          opacity: 0,
          transition: 'all 0.3s ease',
          pointerEvents: 'none',
          border: '2px solid #25D366',
        }}
        className="whatsapp-tooltip"
      >
        <span style={{ color: '#25D366' }}>💬</span> Chat with us
      </div>

      <style>{`
        .whatsapp-button:hover .whatsapp-tooltip {
          opacity: 1;
        }

        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }

        .whatsapp-button {
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }

        @media (max-width: 768px) {
          .whatsapp-button {
            bottom: 20px;
            right: 20px;
          }
          .whatsapp-button > div:first-child {
            width: 50px;
            height: 50px;
          }
          .whatsapp-button > div:first-child svg {
            font-size: 26px;
          }
          .whatsapp-tooltip {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default WhatsAppButton;