import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge, Table, ProgressBar } from 'react-bootstrap';
import { FaFilePdf, FaFileExcel, FaFileCsv, FaDownload, FaChartBar, FaUsers, FaChalkboardTeacher, FaCalendarCheck, FaAward, FaPrint } from 'react-icons/fa';
import { useLanguage } from '../../../context/LanguageContext';
import { getTranslation } from '../../../utils/translations';
import { useNotification } from '../../../hooks/useNotification';

const AdminReports = () => {
  const { language, isArabic } = useLanguage();
  const t = (key) => getTranslation(key, language);
  const { notify } = useNotification();
  
  const [reportType, setReportType] = useState('students');
  const [dateRange, setDateRange] = useState('this-month');
  const [generating, setGenerating] = useState(false);

  const reportTypes = [
    { value: 'students', label: isArabic ? 'تقرير الطلاب' : 'Students Report', icon: <FaUsers /> },
    { value: 'teachers', label: isArabic ? 'تقرير المعلمين' : 'Teachers Report', icon: <FaChalkboardTeacher /> },
    { value: 'attendance', label: isArabic ? 'تقرير الحضور' : 'Attendance Report', icon: <FaCalendarCheck /> },
    { value: 'academic', label: isArabic ? 'تقرير الأداء الأكاديمي' : 'Academic Performance', icon: <FaAward /> },
  ];

  const stats = [
    { label: isArabic ? 'إجمالي الطلاب' : 'Total Students', value: 520, change: '+12%', color: '#1a5f7a' },
    { label: isArabic ? 'معدل الحضور' : 'Attendance Rate', value: 92, change: '+3%', color: '#2d6a4f' },
    { label: isArabic ? 'التميز الأكاديمي' : 'Academic Excellence', value: 88, change: '+5%', color: '#c49a6c' },
    { label: isArabic ? 'رضا أولياء الأمور' : 'Parent Satisfaction', value: 98, change: '+2%', color: '#d4a373' },
  ];

  const recentReports = [
    { id: 1, name: isArabic ? 'تقرير الطلاب - الفصل الأول' : 'Students Report - Term 1', date: '2026-06-15', type: 'PDF', size: '2.4 MB' },
    { id: 2, name: isArabic ? 'تقرير الحضور - مايو' : 'Attendance Report - May', date: '2026-06-10', type: 'Excel', size: '1.8 MB' },
    { id: 3, name: isArabic ? 'تقرير الأداء الأكاديمي' : 'Academic Performance Report', date: '2026-06-05', type: 'PDF', size: '3.2 MB' },
  ];

  const handleGenerateReport = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      notify(isArabic ? 'تم إنشاء التقرير بنجاح!' : 'Report generated successfully!', 'success');
    }, 2000);
  };

  const arabicFontStyle = {
    fontFamily: isArabic ? 'Traditional Arabic, "Arabic Typesetting", serif' : 'inherit',
    lineHeight: isArabic ? '1.4' : '1.6',
  };

  return (
    <div className="admin-reports" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ ...arabicFontStyle, color: '#1a5f7a' }}>
            <FaFilePdf className="me-2" />
            {isArabic ? 'التقارير' : 'Reports'}
          </h4>
          <p className="text-muted mb-0" style={arabicFontStyle}>
            {isArabic ? 'إنشاء وإدارة التقارير المدرسية' : 'Generate and manage school reports'}
          </p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" size="sm">
            <FaPrint className="me-1" /> {isArabic ? 'طباعة' : 'Print'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <Row className="g-3 mb-4">
        {stats.map((stat, index) => (
          <Col key={index} md={3} sm={6}>
            <Card className="shadow-sm border-0 stat-card">
              <Card.Body className="p-3">
                <h6 className="text-muted mb-1" style={{ fontSize: '0.6rem', textTransform: 'uppercase' }}>{stat.label}</h6>
                <h3 className="fw-bold mb-0">{stat.value}%</h3>
                <small className="text-success">{stat.change}</small>
                <ProgressBar now={stat.value} variant="primary" style={{ height: '4px', marginTop: '8px' }} />
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Report Generator */}
      <Row className="g-4">
        <Col lg={4}>
          <Card className="shadow-sm border-0 modern-card">
            <Card.Header className="bg-white border-0">
              <h6 className="fw-bold mb-0" style={{ ...arabicFontStyle, color: '#1a5f7a' }}>
                <FaChartBar className="me-2" />
                {isArabic ? 'إنشاء تقرير جديد' : 'Generate New Report'}
              </h6>
            </Card.Header>
            <Card.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label style={arabicFontStyle}>{isArabic ? 'نوع التقرير' : 'Report Type'}</Form.Label>
                  <Form.Select value={reportType} onChange={(e) => setReportType(e.target.value)}>
                    {reportTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label style={arabicFontStyle}>{isArabic ? 'النطاق الزمني' : 'Date Range'}</Form.Label>
                  <Form.Select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
                    <option value="this-month">{isArabic ? 'هذا الشهر' : 'This Month'}</option>
                    <option value="last-month">{isArabic ? 'الشهر الماضي' : 'Last Month'}</option>
                    <option value="this-term">{isArabic ? 'هذا الفصل' : 'This Term'}</option>
                    <option value="custom">{isArabic ? 'مخصص' : 'Custom'}</option>
                  </Form.Select>
                </Form.Group>

                {dateRange === 'custom' && (
                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Label style={arabicFontStyle}>{isArabic ? 'من' : 'From'}</Form.Label>
                      <Form.Control type="date" />
                    </Col>
                    <Col md={6}>
                      <Form.Label style={arabicFontStyle}>{isArabic ? 'إلى' : 'To'}</Form.Label>
                      <Form.Control type="date" />
                    </Col>
                  </Row>
                )}

                <Form.Group className="mb-3">
                  <Form.Label style={arabicFontStyle}>{isArabic ? 'التنسيق' : 'Format'}</Form.Label>
                  <div className="d-flex gap-2">
                    <Button variant="outline-primary" className="flex-fill d-flex align-items-center justify-content-center gap-2">
                      <FaFilePdf /> PDF
                    </Button>
                    <Button variant="outline-success" className="flex-fill d-flex align-items-center justify-content-center gap-2">
                      <FaFileExcel /> Excel
                    </Button>
                    <Button variant="outline-info" className="flex-fill d-flex align-items-center justify-content-center gap-2">
                      <FaFileCsv /> CSV
                    </Button>
                  </div>
                </Form.Group>

                <Button 
                  variant="primary" 
                  className="w-100 py-2"
                  onClick={handleGenerateReport}
                  disabled={generating}
                >
                  {generating ? (
                    <>{isArabic ? 'جاري الإنشاء...' : 'Generating...'}</>
                  ) : (
                    <><FaDownload className="me-2" /> {isArabic ? 'إنشاء وتحميل' : 'Generate & Download'}</>
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8}>
          <Card className="shadow-sm border-0 modern-card">
            <Card.Header className="bg-white border-0 d-flex justify-content-between align-items-center">
              <h6 className="fw-bold mb-0" style={{ ...arabicFontStyle, color: '#1a5f7a' }}>
                {isArabic ? 'التقارير السابقة' : 'Recent Reports'}
              </h6>
              <small className="text-muted">{isArabic ? 'آخر ٣ تقارير' : 'Last 3 reports'}</small>
            </Card.Header>
            <Card.Body className="p-0">
              <Table hover className="mb-0">
                <thead>
                  <tr>
                    <th>{isArabic ? 'اسم التقرير' : 'Report Name'}</th>
                    <th>{isArabic ? 'التاريخ' : 'Date'}</th>
                    <th>{isArabic ? 'النوع' : 'Type'}</th>
                    <th>{isArabic ? 'الحجم' : 'Size'}</th>
                    <th>{isArabic ? 'تحميل' : 'Download'}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentReports.map((report) => (
                    <tr key={report.id}>
                      <td>{report.name}</td>
                      <td>{report.date}</td>
                      <td>
                        <Badge bg={report.type === 'PDF' ? 'danger' : 'success'}>
                          {report.type}
                        </Badge>
                      </td>
                      <td>{report.size}</td>
                      <td>
                        <Button variant="link" className="p-0 text-decoration-none">
                          <FaDownload className="text-primary" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <style>{`
        .stat-card {
          border-radius: 12px !important;
          transition: all 0.3s ease;
        }
        .stat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.08) !important;
        }
        .modern-card {
          border-radius: 16px !important;
          transition: all 0.3s ease;
          overflow: hidden;
        }
        .modern-card:hover {
          box-shadow: 0 8px 30px rgba(0,0,0,0.06) !important;
        }
        .table th {
          font-weight: 600;
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #6c757d;
          border-bottom: 2px solid #e9ecef;
        }
        .table td {
          vertical-align: middle;
          font-size: 0.82rem;
        }
      `}</style>
    </div>
  );
};

export default AdminReports;