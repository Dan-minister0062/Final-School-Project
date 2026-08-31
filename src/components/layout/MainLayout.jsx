import React from 'react';
import { Outlet } from 'react-router-dom';
import NavbarComponent from '../common/Navbar';
import Footer from '../common/Footer';
import { useLanguage } from '../../context/LanguageContext';
import { getTranslation } from '../../utils/translations';

const MainLayout = () => {
  return (
    <div className="d-flex flex-column min-vh-100">
      <NavbarComponent />
      <main className="flex-grow-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;