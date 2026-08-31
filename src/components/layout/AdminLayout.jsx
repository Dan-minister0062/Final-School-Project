import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminNavbar from '../components/dashboard/admin/AdminNavbar';
import { Container } from 'react-bootstrap';

const AdminLayout = () => {
  return (
    <div className="admin-layout">
      <AdminNavbar />
      <Container fluid className="admin-content py-4">
        <Outlet />
      </Container>
    </div>
  );
};

export default AdminLayout;