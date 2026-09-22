/* =============================================================================
   SRMS - Results Data  (js/data/resultsData.js)
   ========================================================================== */
(function (global) {
  'use strict';

  /* Recent results table on the student dashboard ------------------------- */
  const recentResults = [
    { subject:'Data Structures',                code:'CS-201', examType:'Mid Semester', grade:'A',  marks:86, total:100, percentage:86, date:'2026-05-12', status:'Pass' },
    { subject:'Database Management Systems',     code:'CS-203', examType:'Mid Semester', grade:'A+', marks:91, total:100, percentage:91, date:'2026-05-10', status:'Pass' },
    { subject:'Operating Systems',               code:'CS-205', examType:'Mid Semester', grade:'B+', marks:79, total:100, percentage:79, date:'2026-05-08', status:'Pass' },
    { subject:'Computer Networks',               code:'CS-207', examType:'Mid Semester', grade:'A',  marks:85, total:100, percentage:85, date:'2026-05-06', status:'Pass' },
    { subject:'Software Engineering',            code:'SE-201', examType:'Mid Semester', grade:'A+', marks:92, total:100, percentage:92, date:'2026-05-04', status:'Pass' },
    { subject:'Probability and Statistics',      code:'MTH-301',examType:'Quiz 02',      grade:'B',  marks:74, total:100, percentage:74, date:'2026-05-02', status:'Pass' },
    { subject:'Advanced Database Systems',       code:'CS-203', examType:'Assignment 02',grade:'A',  marks:88, total:100, percentage:88, date:'2026-04-28', status:'Pass' }
  ];

  /* Semester-wise results ------------------------------------------------- */
  const semesterResults = [
    { semester:5, label:'5th Semester', status:'In Progress', gpa:3.41, credits:18, courses:[
      { code:'CS-301', name:'Database Systems',           credits:3, marks:86, total:100, grade:'A',  gp:4.00, status:'Pass' },
      { code:'CS-303', name:'Operating Systems',          credits:3, marks:79, total:100, grade:'B+', gp:3.33, status:'Pass' },
      { code:'CS-207', name:'Computer Networks',          credits:3, marks:85, total:100, grade:'A',  gp:4.00, status:'Pass' },
      { code:'SE-201', name:'Software Engineering',       credits:2, marks:92, total:100, grade:'A+', gp:4.00, status:'Pass' },
      { code:'CS-203', name:'Advanced Database Systems',  credits:3, marks:91, total:100, grade:'A+', gp:4.00, status:'Pass' },
      { code:'MTH-301',name:'Probability and Statistics', credits:3, marks:74, total:100, grade:'B',  gp:3.00, status:'Pass' }
    ]},
    { semester:4, label:'4th Semester', status:'Completed', gpa:3.36, credits:18, courses:[
      { code:'CS-202', name:'Object Oriented Programming',credits:3, marks:88, total:100, grade:'A',  gp:4.00, status:'Pass' },
      { code:'CS-204', name:'Digital Logic Design',       credits:3, marks:81, total:100, grade:'A',  gp:4.00, status:'Pass' },
      { code:'CS-206', name:'Discrete Mathematics',       credits:3, marks:72, total:100, grade:'B',  gp:3.00, status:'Pass' },
      { code:'SE-202', name:'Web Technologies',           credits:3, marks:90, total:100, grade:'A+', gp:4.00, status:'Pass' },
      { code:'ENG-201',name:'Technical Writing',          credits:3, marks:76, total:100, grade:'B+', gp:3.33, status:'Pass' },
      { code:'MTH-204',name:'Linear Algebra',             credits:3, marks:68, total:100, grade:'B-', gp:2.67, status:'Pass' }
    ]},
    { semester:3, label:'3rd Semester', status:'Completed', gpa:3.28, credits:18, courses:[
      { code:'CS-201', name:'Data Structures',       credits:3, marks:84, total:100, grade:'A',  gp:4.00, status:'Pass' },
      { code:'CS-205', name:'Operating Systems Lab', credits:1, marks:91, total:100, grade:'A+', gp:4.00, status:'Pass' },
      { code:'CS-210', name:'Computer Organization', credits:3, marks:70, total:100, grade:'B',  gp:3.00, status:'Pass' },
      { code:'CS-212', name:'OOP Lab',               credits:1, marks:93, total:100, grade:'A+', gp:4.00, status:'Pass' },
      { code:'MTH-201',name:'Calculus and Analytics',credits:3, marks:65, total:100, grade:'C+', gp:2.33, status:'Pass' },
      { code:'PHY-201',name:'Applied Physics',       credits:3, marks:73, total:100, grade:'B',  gp:3.00, status:'Pass' },
      { code:'ENG-101',name:'Communication Skills',  credits:2, marks:88, total:100, grade:'A',  gp:4.00, status:'Pass' },
      { code:'ISL-101',name:'Islamic Studies',       credits:2, marks:82, total:100, grade:'A',  gp:4.00, status:'Pass' }
    ]},
    { semester:2, label:'2nd Semester', status:'Completed', gpa:3.19, credits:17, courses:[
      { code:'CS-102', name:'Programming Fundamentals',credits:3, marks:86, total:100, grade:'A',  gp:4.00, status:'Pass' },
      { code:'CS-104', name:'Programming Lab',         credits:1, marks:90, total:100, grade:'A+', gp:4.00, status:'Pass' },
      { code:'MTH-102',name:'Calculus II',             credits:3, marks:62, total:100, grade:'C',  gp:2.00, status:'Pass' },
      { code:'PHY-102',name:'Physics II',              credits:3, marks:71, total:100, grade:'B',  gp:3.00, status:'Pass' },
      { code:'ENG-102',name:'English Composition',     credits:3, marks:79, total:100, grade:'B+', gp:3.33, status:'Pass' },
      { code:'PST-101',name:'Pakistan Studies',        credits:2, marks:85, total:100, grade:'A',  gp:4.00, status:'Pass' },
      { code:'CS-106', name:'IT Essentials',           credits:2, marks:88, total:100, grade:'A',  gp:4.00, status:'Pass' }
    ]},
    { semester:1, label:'1st Semester', status:'Completed', gpa:3.11, credits:16, courses:[
      { code:'CS-101', name:'Introduction to Computing',credits:3, marks:80, total:100, grade:'A',  gp:4.00, status:'Pass' },
      { code:'MTH-101',name:'Calculus I',              credits:3, marks:58, total:100, grade:'C',  gp:2.00, status:'Pass' },
      { code:'PHY-101',name:'Physics I',               credits:3, marks:67, total:100, grade:'B-', gp:2.67, status:'Pass' },
      { code:'ENG-101',name:'English I',               credits:3, marks:74, total:100, grade:'B',  gp:3.00, status:'Pass' },
      { code:'CS-103', name:'Computing Lab',           credits:1, marks:90, total:100, grade:'A+', gp:4.00, status:'Pass' },
      { code:'ISL-102',name:'Islamic History',         credits:3, marks:81, total:100, grade:'A',  gp:4.00, status:'Pass' }
    ]}
  ];

  /* CGPA progression across semesters ----------------------------------- */
  const cgpaTrend = {
    labels: ['1st','2nd','3rd','4th','5th'],
    gpa:    [3.11, 3.19, 3.28, 3.36, 3.41],
    cgpa:   [3.11, 3.15, 3.19, 3.23, 3.38]
  };

  global.SRMS_RESULTS = { recentResults:recentResults, semesterResults:semesterResults, cgpaTrend:cgpaTrend };
})(window);
