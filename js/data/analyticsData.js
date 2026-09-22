/* =============================================================================
   SRMS - Analytics Data  (js/data/analyticsData.js)
   Chart-ready datasets for student, teacher and admin dashboards.
   ========================================================================== */
(function (global) {
  'use strict';

  /* STUDENT -------------------------------------------------------------- */
  const studentPerformance = {
    overall:84,
    breakdown:[
      { label:'Excellent',          value:60, count:72, color:'#22C55E' },
      { label:'Good',               value:20, count:24, color:'#1677E8' },
      { label:'Average',            value:12, count:14, color:'#F59E0B' },
      { label:'Needs Improvement',  value:8,  count:10, color:'#EF4444' }
    ]
  };

  const studentSubjectMarks = {
    labels: ['CS-301','CS-303','CS-207','SE-201','CS-203','MTH-301'],
    marks:  [86, 79, 85, 92, 91, 74],
    classAvg:[78, 74, 76, 81, 80, 70]
  };

  /* TEACHER -------------------------------------------------------------- */
  const teacherPerformance = {
    distribution:[
      { label:'Excellent',          value:58, count:97,  color:'#22C55E' },
      { label:'Good',               value:24, count:40,  color:'#1677E8' },
      { label:'Average',            value:13, count:22,  color:'#F59E0B' },
      { label:'Needs Improvement',  value:5,  count:9,   color:'#EF4444' }
    ],
    trend:{
      labels: ['January','February','March','April','May','June'],
      marks:  [68, 72, 75, 79, 82, 84],
      target: [70, 72, 75, 78, 80, 82]
    },
    courseAttendance:{
      labels: ['CS-301','CS-303','SE-201','CS-203','CS-207','MTH-301'],
      values: [92, 88, 95, 93, 85, 86]
    },
    marks:{
      labels: ['CS-301','CS-303','SE-201','CS-203','CS-207','MTH-301'],
      average:[84, 76, 88, 86, 81, 73],
      highest:[96, 92, 98, 97, 94, 89],
      lowest: [64, 52, 70, 68, 58, 48]
    },
    summary:{ averageMarks:81, highestMarks:98, lowestMarks:48, passPercentage:91, avgAttendance:90, totalStudents:168 }
  };

  /* ADMIN ---------------------------------------------------------------- */
  const adminStats = {
    totalStudents:2450, totalTeachers:145, totalCourses:86, totalDepartments:12,
    activeClasses:64, pendingResults:18, averageAttendance:87, systemUsers:2712,
    newAdmissions:186, graduates:412, activeSemester:'Fall 2026'
  };

  const studentDistribution = [
    { label:'Computer Science',        value:720, color:'#1677E8' },
    { label:'Software Engineering',    value:540, color:'#8B5CF6' },
    { label:'Electrical Engineering',  value:410, color:'#F59E0B' },
    { label:'Civil Engineering',       value:356, color:'#14B8A6' },
    { label:'Business',                value:298, color:'#EC4899' },
    { label:'Other',                   value:126, color:'#94A3B8' }
  ];

  const enrollmentTrend = {
    labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
    students:   [1820,1856,1902,1948,1985,2016,2064,2110,2240,2302,2388,2450],
    teachers:   [ 118, 120, 123, 126, 129, 132, 134, 137, 140, 142, 144, 145],
    enrollments:[ 142, 168, 205, 122, 96,  188, 232, 264, 208, 176, 154, 186],
    graduations:[  0,   0,   0,   0,  318,  0,   0,   0,   0,   0,   0,  412]
  };

  const departmentPerformance = {
    labels: ['Computer Science','Software Engineering','Electrical Engineering','Civil Engineering','Business Administration','Mathematics'],
    avgCgpa:  [3.42, 3.51, 3.24, 3.12, 3.38, 3.29],
    attendance:[89, 91, 85, 82, 87, 84],
    passRate: [92, 94, 88, 85, 91, 87]
  };

  const attendanceAnalytics = {
    labels: ['Week 1','Week 2','Week 3','Week 4','Week 5','Week 6','Week 7','Week 8'],
    present:[92, 90, 88, 91, 87, 89, 86, 90],
    absent: [ 5,  7,  9,  6, 10,  8, 11,  7],
    late:   [ 3,  3,  3,  3,  3,  3,  3,  3]
  };

  const resultDistribution = {
    labels: ['A+','A','B+','B','C+','C','D','F'],
    values: [186, 342, 401, 486, 372, 264, 138, 61]
  };

  const examAnalytics = {
    labels: ['Midterm','Final','Quiz','Assignment','Practical'],
    pass:   [1240, 1188, 1310, 1296, 640],
    fail:   [  96,  148,   42,   36,  22]
  };

  global.SRMS_ANALYTICS = {
    studentPerformance:studentPerformance,
    studentSubjectMarks:studentSubjectMarks,
    teacherPerformance:teacherPerformance,
    adminStats:adminStats,
    studentDistribution:studentDistribution,
    enrollmentTrend:enrollmentTrend,
    departmentPerformance:departmentPerformance,
    attendanceAnalytics:attendanceAnalytics,
    resultDistribution:resultDistribution,
    examAnalytics:examAnalytics
  };
})(window);
