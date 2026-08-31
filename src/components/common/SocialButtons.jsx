import React from 'react';
import { FaFacebook, FaWhatsapp } from 'react-icons/fa';

const SocialButtons = () => {
  // WhatsApp Configuration
  const phoneNumber = '+212 0668788829';
  const whatsappMessage = 'السلام عليكم، أرغب في الاستفسار عن مدرسة الفتح الخاصة';

  // Facebook Configuration
  const facebookPage = 'https://www.facebook.com/madrassatalfath';

  const handleWhatsAppClick = () => {
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(url, '_blank');
  };

  const handleFacebookClick = () => {
    window.open(facebookPage, '_blank');
  };

  return (
    <>
      {/* WhatsApp Button - Moved DOWN */}
      <div
        className="social-button whatsapp-btn"
        onClick={handleWhatsAppClick}
        style={{
          position: 'fixed',
          bottom: '90px',
          right: '14px',
          zIndex: 1000,
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            backgroundColor: '#25D366',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
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
          <FaWhatsapp size={26} color="white" />
        </div>
      </div>

      {/* Facebook Button - Moved DOWN */}
      <div
        className="social-button facebook-btn"
        onClick={handleFacebookClick}
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '14px',
          zIndex: 1100,
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            backgroundColor: '#1877f2',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(24, 119, 242, 0.4)',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 6px 30px rgba(24, 119, 242, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(24, 119, 242, 0.4)';
          }}
        >
          <FaFacebook size={28} color="white" />
        </div>
      </div>

      <style>{`
        .social-button {
          animation: float 3s ease-in-out infinite;
        }
        .whatsapp-btn {
          animation-delay: 0s;
        }
        .facebook-btn {
          animation-delay: 1s;
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        @media (max-width: 768px) {
          .social-button {
            right: 15px !important;
          }
          .whatsapp-btn {
            bottom: 100px !important;
          }
          .facebook-btn {
            bottom: 160px !important;
          }
          .social-button > div {
            width: 40px !important;
            height: 40px !important;
          }
          .social-button > div svg {
            font-size: 20px !important;
          }
        }
      `}</style>
    </>
  );
};

export default SocialButtons;