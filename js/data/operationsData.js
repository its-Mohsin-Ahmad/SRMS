/* =============================================================================
   SRMS - Attendance / Exams / Timetable  (js/data/operationsData.js)
   ========================================================================== */
(function (global) {
  'use strict';

  /* ------------------------------------------------------------ ATTENDANCE */
  const attendanceSummary = { present:392, absent:44, late:18, excused:11, total:465, percentage:87, required:75 };

  const subjectAttendance = [
    { code:'CS-301', name:'Database Systems',           held:48, present:44, absent:4, late:0,  excused:0, percentage:92, status:'Good' },
    { code:'CS-303', name:'Operating Systems',          held:42, present:37, absent:3, late:2,  excused:0, percentage:88, status:'Good' },
    { code:'CS-207', name:'Computer Networks',          held:40, present:34, absent:4, late:1,  excused:1, percentage:85, status:'Good' },
    { code:'SE-201', name:'Software Engineering',       held:38, present:36, absent:1, late:0,  excused:1, percentage:95, status:'Excellent' },
    { code:'CS-203', name:'Advanced Database Systems',  held:44, present:41, absent:2, late:1,  excused:0, percentage:93, status:'Excellent' },
    { code:'MTH-301',name:'Probability and Statistics', held:36, present:31, absent:3, late:2,  excused:0, percentage:86, status:'Good' },
    { code:'CS-205', name:'Operating Systems Lab',      held:26, present:22, absent:4, late:0,  excused:0, percentage:85, status:'Satisfactory' },
    { code:'CS-201', name:'Data Structures',            held:46, present:39, absent:5, late:1,  excused:1, percentage:83, status:'Satisfactory' }
  ];

  const attendanceLog = [
    { date:'2026-09-21', code:'CS-301', course:'Database Systems',          slot:'09:00 - 10:30', status:'Present' },
    { date:'2026-09-21', code:'CS-303', course:'Operating Systems',         slot:'11:00 - 12:30', status:'Present' },
    { date:'2026-09-20', code:'CS-207', course:'Computer Networks',         slot:'09:00 - 10:30', status:'Late' },
    { date:'2026-09-20', code:'SE-201', course:'Software Engineering',      slot:'14:00 - 15:30', status:'Present' },
    { date:'2026-09-19', code:'CS-203', course:'Advanced Database Systems', slot:'14:00 - 15:30', status:'Present' },
    { date:'2026-09-18', code:'MTH-301',course:'Probability and Statistics',slot:'13:00 - 14:30', status:'Absent' },
    { date:'2026-09-18', code:'CS-205', course:'Operating Systems Lab',     slot:'09:00 - 12:00', status:'Present' },
    { date:'2026-09-17', code:'CS-301', course:'Database Systems',          slot:'09:00 - 10:30', status:'Present' },
    { date:'2026-09-16', code:'CS-303', course:'Operating Systems',         slot:'11:00 - 12:30', status:'Excused' },
    { date:'2026-09-16', code:'CS-201', course:'Data Structures',           slot:'11:00 - 12:30', status:'Present' }
  ];

  /* ------------------------------------------------------------------ EXAMS */
  const exams = [
    { id:'EX-501', course:'Database Systems',           code:'CS-301', type:'Final', date:'2026-10-05', time:'09:00 AM', room:'Hall A-01', semester:5, section:'A', teacher:'Dr. Ahmad Hassan',  status:'Upcoming' },
    { id:'EX-502', course:'Operating Systems',          code:'CS-303', type:'Final', date:'2026-10-07', time:'09:00 AM', room:'Hall A-02', semester:5, section:'A', teacher:'Dr. Ahmad Hassan',  status:'Upcoming' },
    { id:'EX-503', course:'Computer Networks',          code:'CS-207', type:'Final', date:'2026-10-09', time:'11:30 AM', room:'Hall B-01', semester:5, section:'A', teacher:'Ms. Hina Qureshi',  status:'Upcoming' },
    { id:'EX-504', course:'Software Engineering',       code:'SE-201', type:'Final', date:'2026-10-12', time:'02:00 PM', room:'Hall B-04', semester:5, section:'A', teacher:'Dr. Imran Shahid',  status:'Upcoming' },
    { id:'EX-505', course:'Advanced Database Systems',  code:'CS-203', type:'Final', date:'2026-10-15', time:'09:00 AM', room:'Hall A-03', semester:5, section:'A', teacher:'Dr. Ahmad Hassan',  status:'Upcoming' },
    { id:'EX-506', course:'Probability and Statistics', code:'MTH-301',type:'Final', date:'2026-10-18', time:'11:30 AM', room:'Hall C-02', semester:5, section:'A', teacher:'Ms. Rabia Sultan',  status:'Upcoming' },
    { id:'EX-401', course:'Database Systems',           code:'CS-301', type:'Midterm',date:'2026-05-12', time:'09:00 AM', room:'Hall A-01', semester:5, section:'A', teacher:'Dr. Ahmad Hassan',  status:'Completed', marks:86, total:100, grade:'A' },
    { id:'EX-402', course:'Advanced Database Systems',  code:'CS-203', type:'Midterm',date:'2026-05-10', time:'09:00 AM', room:'Hall A-03', semester:5, section:'A', teacher:'Dr. Ahmad Hassan',  status:'Completed', marks:91, total:100, grade:'A+' },
    { id:'EX-403', course:'Operating Systems',          code:'CS-303', type:'Midterm',date:'2026-05-08', time:'11:30 AM', room:'Hall A-02', semester:5, section:'A', teacher:'Dr. Ahmad Hassan',  status:'Completed', marks:79, total:100, grade:'B+' },
    { id:'EX-404', course:'Computer Networks',          code:'CS-207', type:'Midterm',date:'2026-05-06', time:'11:30 AM', room:'Hall B-01', semester:5, section:'A', teacher:'Ms. Hina Qureshi',  status:'Completed', marks:85, total:100, grade:'A' },
    { id:'EX-405', course:'Software Engineering',       code:'SE-201', type:'Midterm',date:'2026-05-04', time:'02:00 PM', room:'Hall B-04', semester:5, section:'A', teacher:'Dr. Imran Shahid',  status:'Completed', marks:92, total:100, grade:'A+' },
    { id:'EX-406', course:'Probability and Statistics', code:'MTH-301',type:'Quiz 02',date:'2026-05-02', time:'01:00 PM', room:'Hall C-02', semester:5, section:'A', teacher:'Ms. Rabia Sultan',  status:'Completed', marks:74, total:100, grade:'B' }
  ];

  global.SRMS_OPS = {
    attendanceSummary:attendanceSummary,
    subjectAttendance:subjectAttendance,
    attendanceLog:attendanceLog,
    exams:exams
  };
})(window);

