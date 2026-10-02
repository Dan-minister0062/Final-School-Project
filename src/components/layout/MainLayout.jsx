import React from 'react';
import { Outlet } from 'react-router-dom';
import NavbarComponent from '../common/Navbar';
import Footer from '../common/Footer';

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