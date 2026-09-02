import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, ProgressBar, Dropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { 
  FaUsers, FaUserGraduate, FaChalkboardTeacher, FaBuilding, 
  FaCalendarCheck, FaFileAlt, FaBell, FaChartLine, FaTrophy,
  FaSchool, FaChild, FaBook, FaGraduationCap, FaClock,
  FaArrowUp, FaArrowDown, FaPlus, FaEye, FaEdit, FaTrash
} from 'react-icons/fa';


const DirectorDashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 520,
    totalTeachers: 35,
    totalClasses: 18,
    totalParents: 410,
    presentToday: 480,
    absentToday: 40,
    totalAssessments: 1250,
    pendingRegistrations: 15,
    freeSchool: 80,
    nursery: 140,
    primary: 180,
    secondary: 120,
  });

  const [programs] = useState([
    { name: 'Free School', count: 80, color: '#6c757d', icon: <FaSchool /> },
    { name: 'Nursery', count: 140, color: '#1a5f7a', icon: <FaChild /> },
    { name: 'Primary', count: 180, color: '#2d6a4f', icon: <FaBook /> },
    { name: 'Secondary', count: 120, color: '#c49a6c', icon: <FaGraduationCap /> },
  ]);

  const [recentActivities] = useState([
    { id: 1, action: 'New student registered - Ahmad Abdullah', time: '2 hours ago', type: 'registration', icon: 'bi-person-plus' },
    { id: 2, action: 'Assessment uploaded by Ustadhah Fatimah', time: '4 hours ago', type: 'assessment', icon: 'bi-file-text' },
    { id: 3, action: 'New announcement: Sports Day 2026', time: '5 hours ago', type: 'announcement', icon: 'bi-megaphone' },
    { id: 4, action: 'Attendance updated for Primary 5', time: '6 hours ago', type: 'attendance', icon: 'bi-calendar-check' },
    { id: 5, action: 'Parent meeting scheduled with Abdullah family', time: '8 hours ago', type: 'meeting', icon: 'bi-calendar-event' },
    { id: 6, action: 'New teacher hired - Ustadh Khalid', time: '1 day ago', type: 'staff', icon: 'bi-person-workspace' },
  ]);

  const [topStudents] = useState([
    { rank: 1, name: 'Aisha Ibrahim', class: 'Primary 6', average: 96, status: 'Excellent' },
    { rank: 2, name: 'Muhammad Ali', class: 'Secondary 3', average: 94, status: 'Excellent' },
    { rank: 3, name: 'Fatimah Yusuf', class: 'Primary 5', average: 92, status: 'Excellent' },
    { rank: 4, name: 'Omar Hassan', class: 'Secondary 2', average: 90, status: 'Excellent' },
    { rank: 5, name: 'Ahmad Abdullah', class: 'Primary 5', average: 88, status: 'Good' },
  ]);

  const getStatusBadge = (type) => {
    const badges = {
      registration: 'success',
      assessment: 'info',
      announcement: 'warning',
      attendance: 'primary',
      meeting: 'secondary',
      staff: 'dark',
    };
    return badges[type] || 'secondary';
  };

  const getProgramColor = (name) => {
    const colors = {
      'Free School': '#6c757d',
      'Nursery': '#1a5f7a',
      'Primary': '#2d6a4f',
      'Secondary': '#c49a6c',
    };
    return colors[name] || '#1a5f7a';
  };

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-0">Director Dashboard</h4>
          <p className="text-muted">Full oversight of all school operations</p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/dashboard/settings" className="btn btn-primary">
            <FaEdit className="me-2" /> Settings
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <Row className="g-4 mb-4">
        <Col md={3} sm={6}>
          <Card className="shadow-sm border-0 stat-card">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Total Students</h6>
                  <h3 className="fw-bold mb-0">{stats.totalStudents}</h3>
                </div>
                <div className="bg-primary bg-opacity-10 rounded-circle p-3" style={{ color: '#1a5f7a' }}>
                  <FaUsers className="fs-3" />
                </div>
              </div>
              <small className="text-success">
                <FaArrowUp className="me-1" /> 12% from last month
              </small>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} sm={6}>
          <Card className="shadow-sm border-0 stat-card">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Total Teachers</h6>
                  <h3 className="fw-bold mb-0">{stats.totalTeachers}</h3>
                </div>
                <div className="bg-success bg-opacity-10 rounded-circle p-3" style={{ color: '#2d6a4f' }}>
                  <FaChalkboardTeacher className="fs-3" />
                </div>
              </div>
              <small className="text-success">
                <FaArrowUp className="me-1" /> 5% from last month
              </small>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} sm={6}>
          <Card className="shadow-sm border-0 stat-card">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Present Today</h6>
                  <h3 className="fw-bold mb-0">{stats.presentToday}</h3>
                </div>
                <div className="bg-warning bg-opacity-10 rounded-circle p-3" style={{ color: '#d4a373' }}>
                  <FaCalendarCheck className="fs-3" />
                </div>
              </div>
              <div className="mt-2">
                <ProgressBar now={(stats.presentToday / stats.totalStudents) * 100} variant="success" />
                <small className="text-muted">{Math.round((stats.presentToday / stats.totalStudents) * 100)}% attendance</small>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} sm={6}>
          <Card className="shadow-sm border-0 stat-card">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Pending Registrations</h6>
                  <h3 className="fw-bold mb-0 text-danger">{stats.pendingRegistrations}</h3>
                </div>
                <div className="bg-danger bg-opacity-10 rounded-circle p-3" style={{ color: '#dc3545' }}>
                  <FaBell className="fs-3" />
                </div>
              </div>
              <Link to="/dashboard/registrations" className="text-decoration-none small">
                Review now <FaArrowUp className="ms-1" />
              </Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Program Distribution & Quick Actions */}
      <Row className="g-4 mb-4">
        <Col lg={8}>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white border-0">
              <h6 className="fw-bold mb-0">Student Distribution by Program</h6>
            </Card.Header>
            <Card.Body>
              <Row className="g-3">
                {programs.map((program, index) => (
                  <Col key={index} md={3}>
                    <div className="text-center p-3 bg-light rounded-3">
                      <div className="display-6" style={{ color: program.color }}>
                        {program.icon}
                      </div>
                      <h3 className="fw-bold">{program.count}</h3>
                      <small className="text-muted">{program.name}</small>
                      <ProgressBar 
                        now={(program.count / stats.totalStudents) * 100} 
                        variant={program.name === 'Free School' ? 'secondary' : 
                                program.name === 'Nursery' ? 'primary' : 
                                program.name === 'Primary' ? 'success' : 'warning'} 
                        className="mt-2" 
                      />
                    </div>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white border-0">
              <h6 className="fw-bold mb-0">Quick Actions</h6>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Link to="/dashboard/students/add" className="btn btn-outline-primary text-start">
                  <FaPlus className="me-2" /> Add New Student
                </Link>
                <Link to="/dashboard/teachers/add" className="btn btn-outline-success text-start">
                  <FaPlus className="me-2" /> Add New Teacher
                </Link>
                <Link to="/dashboard/announcements/add" className="btn btn-outline-warning text-start">
                  <FaBell className="me-2" /> Post Announcement
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Top Students & Recent Activity */}
      <Row className="g-4">
        <Col lg={7}>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white border-0">
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="fw-bold mb-0">🏆 Top Performing Students</h6>
                <Link to="#" className="text-decoration-none small">View All</Link>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              <Table hover className="mb-0">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Student Name</th>
                    <th>Class</th>
                    <th>Average</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {topStudents.map((student) => (
                    <tr key={student.rank}>
                      <td>
                        <Badge bg={student.rank <= 3 ? 'success' : 'secondary'} className="rounded-circle">
                          {student.rank}
                        </Badge>
                      </td>
                      <td>{student.name}</td>
                      <td>{student.class}</td>
                      <td>{student.average}%</td>
                      <td>
                        <Badge bg={student.status === 'Excellent' ? 'success' : 'info'}>
                          {student.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={5}>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white border-0">
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="fw-bold mb-0">Recent Activity</h6>
                <Link to="#" className="text-decoration-none small">View All</Link>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="list-group list-group-flush">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="list-group-item d-flex align-items-center">
                    <div className={`bg-${getStatusBadge(activity.type)} bg-opacity-10 rounded-circle p-2 me-3`}
                         style={{ color: `var(--bs-${getStatusBadge(activity.type)})` }}>
                      <i className={`bi ${activity.icon}`}></i>
                    </div>
                    <div className="flex-grow-1">
                      <p className="mb-0 small">{activity.action}</p>
                      <small className="text-muted">{activity.time}</small>
                    </div>
                    <Badge bg={getStatusBadge(activity.type)}>
                      {activity.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DirectorDashboard;