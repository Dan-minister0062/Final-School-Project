// src/components/dashboard/teacher/TeacherDebug.jsx
import React, { useEffect, useState } from 'react';
import { Card, Table, Alert } from 'react-bootstrap';
import { teacherService } from '../../../services/teacherService';

const TeacherDebug = () => {
  const [data, setData] = useState({});

  useEffect(() => {
    const teacher = teacherService.getCurrentTeacher();
    const classes = teacherService.getAssignedClasses();
    const students = teacherService.getAssignedStudents();
    const subjects = teacherService.getAssignedSubjects();
    const assessments = teacherService.getTeacherAssessments();
    const notifications = teacherService.getTeacherNotifications();
    const stats = teacherService.getDashboardStats();

    setData({
      teacher,
      classes,
      students,
      subjects,
      assessments,
      notifications,
      stats,
      localStorage: {
        users: JSON.parse(localStorage.getItem('school_users') || '[]'),
        classes: JSON.parse(localStorage.getItem('school_classes') || '[]'),
        students: JSON.parse(localStorage.getItem('school_students') || '[]'),
        user: JSON.parse(localStorage.getItem('user') || '{}'),
        userId: localStorage.getItem('userId'),
        role: localStorage.getItem('role'),
      }
    });
  }, []);

  return (
    <div className="p-4">
      <h2>Teacher Debug Information</h2>
      <Alert variant="info">
        <strong>Current Teacher ID:</strong> {data.teacher?.id || 'Not found'}
        <br />
        <strong>Current Teacher Name:</strong> {data.teacher?.name || 'Not found'}
        <br />
        <strong>Role:</strong> {localStorage.getItem('role') || 'Not set'}
      </Alert>
      
      <Card className="mb-3">
        <Card.Header>Assigned Classes ({data.classes?.length || 0})</Card.Header>
        <Card.Body>
          <pre>{JSON.stringify(data.classes, null, 2)}</pre>
        </Card.Body>
      </Card>
      
      <Card className="mb-3">
        <Card.Header>Assigned Students ({data.students?.length || 0})</Card.Header>
        <Card.Body>
          <pre>{JSON.stringify(data.students, null, 2)}</pre>
        </Card.Body>
      </Card>
      
      <Card className="mb-3">
        <Card.Header>Dashboard Stats</Card.Header>
        <Card.Body>
          <pre>{JSON.stringify(data.stats, null, 2)}</pre>
        </Card.Body>
      </Card>
    </div>
  );
};

export default TeacherDebug;