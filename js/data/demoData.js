/* =============================================================================
   SRMS - Demo Data Layer  (js/data/demoData.js)
   -----------------------------------------------------------------------------
   Single source of truth for seeded demo content, shaped like a DB schema so it
   can be swapped for real API calls without touching UI code.

   ENTITIES: Users, Students, Teachers, Admins, Departments, Courses, Subjects,
             Enrollments, Attendance, Exams, Results, Assignments, Notices,
             Messages, Timetable, Books, Feedback, Notifications, AuditLogs
   ========================================================================== */
(function (global) {
  'use strict';

  /* ---------------------------------------------------------------- USERS */
  const users = [
    { id:'U-1001', role:'student', identifier:'STU-2021-0012', name:'Ahmed Raza Khan',
      email:'student@university.edu', password:'demo123', status:'active',
      lastLogin:'2026-09-22T09:14:00' },
    { id:'U-2001', role:'teacher', identifier:'TCH-1001', name:'Dr. Ahmad Hassan',
      email:'teacher@university.edu', password:'demo123', status:'active',
      lastLogin:'2026-09-22T08:02:00' },
    { id:'U-3001', role:'admin', identifier:'ADM-0001', name:'Sara Ibrahim',
      email:'admin@university.edu', password:'demo123', status:'active',
      lastLogin:'2026-09-22T07:41:00' }
  ];

  /* ----------------------------------------------------------- DEPARTMENTS */
  const departments = [
    { id:'DEP-01', code:'CS',  name:'Computer Science',        students:720, teachers:34, courses:26, avgCgpa:3.42, attendance:89, passRate:92, color:'#1677E8' },
    { id:'DEP-02', code:'SE',  name:'Software Engineering',    students:540, teachers:26, courses:22, avgCgpa:3.51, attendance:91, passRate:94, color:'#8B5CF6' },
    { id:'DEP-03', code:'EE',  name:'Electrical Engineering',  students:410, teachers:23, courses:19, avgCgpa:3.24, attendance:85, passRate:88, color:'#F59E0B' },
    { id:'DEP-04', code:'CE',  name:'Civil Engineering',       students:356, teachers:19, courses:17, avgCgpa:3.12, attendance:82, passRate:85, color:'#14B8A6' },
    { id:'DEP-05', code:'BBA', name:'Business Administration', students:298, teachers:17, courses:15, avgCgpa:3.38, attendance:87, passRate:91, color:'#EC4899' },
    { id:'DEP-06', code:'MTH', name:'Mathematics',             students:126, teachers:12, courses:11, avgCgpa:3.29, attendance:84, passRate:87, color:'#EF4444' }
  ];

  /* ------------------------------------------------------------- MY PROFILE */
  const studentProfile = {
    id:'STU-2021-0012', userId:'U-1001', rollNo:'CS-21-012',
    fullName:'Ahmed Raza Khan', fatherName:'Muhammad Raza Khan',
    dob:'2003-04-18', gender:'Male',
    email:'student@university.edu', phone:'+92 321 4456 789',
    address:'House 24-B, Block C, Gulshan-e-Iqbal, Karachi, Pakistan',
    city:'Karachi', country:'Pakistan', bloodGroup:'B+', cnic:'42101-1234567-8',
    departmentId:'DEP-01', department:'Computer Science',
    program:'BS Computer Science', degree:'Bachelor of Science',
    semester:5, semesterLabel:'5th Semester', section:'A', batch:'2021-2025',
    cgpa:3.38, cgpaPercent:84.5, creditsCompleted:84, totalCredits:132,
    advisor:'Dr. Ahmad Hassan', advisorEmail:'teacher@university.edu',
    enrollmentDate:'2021-09-06', expectedGraduation:'2025-06-30',
    status:'Active', scholar:'Merit Scholarship', feeStatus:'Paid',
    attendanceOverall:87, rank:12, totalStudentsInBatch:120
  };

  /* ------------------------------------------- STUDENT ROSTER (24 records) */
  const RC = ['id','name','email','dept','sem','section','attendance','cgpa','status'];
  const RR = [
    ['STU-2021-0001','Ayesha Siddiqui','ayesha.s@university.edu','Computer Science',5,'A',94,3.82,'Active'],
    ['STU-2021-0002','Bilal Ahmed','bilal.a@university.edu','Computer Science',5,'A',88,3.41,'Active'],
    ['STU-2021-0003','Fatima Noor','fatima.n@university.edu','Software Engineering',5,'B',96,3.91,'Active'],
    ['STU-2021-0004','Hassan Ali','hassan.a@university.edu','Computer Science',5,'A',79,2.94,'Active'],
    ['STU-2021-0005','Iqra Javed','iqra.j@university.edu','Electrical Engineering',3,'A',91,3.55,'Active'],
    ['STU-2021-0006','Junaid Farooq','junaid.f@university.edu','Civil Engineering',7,'A',68,2.41,'Warning'],
    ['STU-2021-0007','Kiran Shah','kiran.s@university.edu','Business Administration',3,'C',87,3.33,'Active'],
    ['STU-2021-0008','Muneeb Ur Rehman','muneeb.r@university.edu','Software Engineering',5,'B',93,3.68,'Active'],
    ['STU-2021-0009','Nida Anwar','nida.a@university.edu','Computer Science',5,'A',84,3.22,'Active'],
    ['STU-2021-0010','Omer Sattar','omer.s@university.edu','Mathematics',7,'A',76,2.87,'Active'],
    ['STU-2021-0011','Priya Menon','priya.m@university.edu','Software Engineering',5,'B',90,3.47,'Active'],
    ['STU-2021-0012','Ahmed Raza Khan','student@university.edu','Computer Science',5,'A',87,3.38,'Active'],
    ['STU-2021-0013','Rabia Tariq','rabia.t@university.edu','Business Administration',3,'C',92,3.61,'Active'],
    ['STU-2021-0014','Saad Mehmood','saad.m@university.edu','Electrical Engineering',3,'A',81,3.05,'Active'],
    ['STU-2021-0015','Tania Hameed','tania.h@university.edu','Computer Science',5,'A',95,3.76,'Active'],
    ['STU-2021-0016','Usman Ghani','usman.g@university.edu','Civil Engineering',7,'A',72,2.65,'Probation'],
    ['STU-2021-0017','Verda Kamal','verda.k@university.edu','Mathematics',7,'A',89,3.44,'Active'],
    ['STU-2021-0018','Waleed Anjum','waleed.a@university.edu','Computer Science',5,'A',83,3.14,'Active'],
    ['STU-2021-0019','Yusra Baig','yusra.b@university.edu','Software Engineering',5,'B',97,3.95,'Active'],
    ['STU-2021-0020','Zain ul Abideen','zain.u@university.edu','Electrical Engineering',3,'A',65,2.28,'Warning'],
    ['STU-2021-0021','Areeba Faisal','areeba.f@university.edu','Business Administration',3,'C',86,3.29,'Active'],
    ['STU-2021-0022','Danish Iqbal','danish.i@university.edu','Computer Science',5,'A',78,2.98,'Active'],
    ['STU-2021-0023','Eman Zafar','eman.z@university.edu','Mathematics',7,'A',93,3.70,'Active'],
    ['STU-2021-0024','Faizan Sheikh','faizan.s@university.edu','Civil Engineering',7,'A',80,3.02,'Active']
  ];
  const studentRoster = RR.map(function (r) {
    const o = {};
    RC.forEach(function (c, i) { o[c] = r[i]; });
    o.advisor = 'Dr. Ahmad Hassan';
    o.batch = '2021-2025';
    o.program = 'BS ' + r[3];
    o.phone = '+92 30' + (0 + (r[7] * 7 % 9)) + ' ' + (1000000 + Math.round(r[7] * 100000));
    return o;
  });


  /* -------------------------------------------------------------- TEACHERS */
  const teachers = [
    { id:'TCH-1001', name:'Dr. Ahmad Hassan',  email:'teacher@university.edu',      dept:'Computer Science',        designation:'Professor',           courses:['CS-301','CS-303'], phone:'+92 300 1234567', students:168, status:'Active',   experience:14, rating:4.8 },
    { id:'TCH-1002', name:'Prof. Sana Malik',  email:'sana.malik@university.edu',   dept:'Computer Science',        designation:'Associate Professor', courses:['CS-201','CS-205'], phone:'+92 301 2345678', students:142, status:'Active',   experience:11, rating:4.6 },
    { id:'TCH-1003', name:'Dr. Imran Shahid',  email:'imran.shahid@university.edu', dept:'Software Engineering',    designation:'Professor',           courses:['SE-201','SE-301'], phone:'+92 302 3456789', students:154, status:'Active',   experience:16, rating:4.7 },
    { id:'TCH-1004', name:'Ms. Hina Qureshi',  email:'hina.q@university.edu',       dept:'Computer Science',        designation:'Lecturer',            courses:['CS-207'],          phone:'+92 303 4567890', students:96,  status:'Active',   experience:6,  rating:4.4 },
    { id:'TCH-1005', name:'Dr. Kamran Yousuf', email:'kamran.y@university.edu',     dept:'Electrical Engineering',  designation:'Associate Professor', courses:['EE-201','EE-305'], phone:'+92 304 5678901', students:128, status:'Active',   experience:12, rating:4.5 },
    { id:'TCH-1006', name:'Prof. Nighat Ara',  email:'nighat.a@university.edu',     dept:'Mathematics',             designation:'Professor',           courses:['MTH-101','MTH-202'], phone:'+92 305 6789012', students:112, status:'Active', experience:18, rating:4.9 },
    { id:'TCH-1007', name:'Mr. Adeel Rauf',    email:'adeel.r@university.edu',      dept:'Civil Engineering',       designation:'Assistant Professor', courses:['CE-201'],          phone:'+92 306 7890123', students:88,  status:'Active',   experience:8,  rating:4.3 },
    { id:'TCH-1008', name:'Ms. Lubna Zia',     email:'lubna.z@university.edu',      dept:'Business Administration', designation:'Lecturer',            courses:['BBA-101','BBA-204'], phone:'+92 307 8901234', students:134, status:'On Leave', experience:7, rating:4.2 },
    { id:'TCH-1009', name:'Dr. Shahid Nawaz',  email:'shahid.n@university.edu',     dept:'Computer Science',        designation:'Professor',           courses:['CS-401'],          phone:'+92 308 9012345', students:74,  status:'Active',   experience:20, rating:4.8 },
    { id:'TCH-1010', name:'Mr. Talha Bin Omar',email:'talha.o@university.edu',      dept:'Software Engineering',    designation:'Assistant Professor', courses:['SE-401'],          phone:'+92 309 0123456', students:92,  status:'Active',   experience:9,  rating:4.4 },
    { id:'TCH-1011', name:'Ms. Rabia Sultan',  email:'rabia.s@university.edu',      dept:'Mathematics',             designation:'Lecturer',            courses:['MTH-303'],         phone:'+92 310 1234567', students:68,  status:'Active',   experience:5,  rating:4.1 },
    { id:'TCH-1012', name:'Dr. Faisal Mehmood',email:'faisal.m@university.edu',     dept:'Electrical Engineering',  designation:'Professor',           courses:['EE-401'],          phone:'+92 311 2345678', students:64,  status:'Inactive', experience:15, rating:4.6 }
  ];

  /* ---------------------------------------------------------------- ADMINS */
  const admins = [
    { id:'ADM-0001', name:'Sara Ibrahim',  email:'admin@university.edu',    role:'Super Admin',         dept:'Administration',   lastActive:'2026-09-22T07:41:00', status:'Active' },
    { id:'ADM-0002', name:'Naveed Akhtar', email:'naveed.a@university.edu', role:'Academic Admin',      dept:'Academics',        lastActive:'2026-09-22T06:20:00', status:'Active' },
    { id:'ADM-0003', name:'Shazia Rehman', email:'shazia.r@university.edu', role:'Registrar',           dept:'Registrar Office', lastActive:'2026-09-21T18:05:00', status:'Active' },
    { id:'ADM-0004', name:'Tariq Jameel',  email:'tariq.j@university.edu',  role:'Examination Officer', dept:'Exams Section',    lastActive:'2026-09-22T05:48:00', status:'Active' },
    { id:'ADM-0005', name:'Maria Khan',    email:'maria.k@university.edu',  role:'Finance Admin',       dept:'Finance',          lastActive:'2026-09-20T14:12:00', status:'Suspended' }
  ];

  /* ----------------------------------------------------- ACADEMIC DEFAULTS */
  /* These are merged/extended by the sibling data modules then re-exported
     through js/data/index.js into the single window.SRMS_DATA namespace. */
  const academicDefaults = {
    courses: [],
    exams: [],
    results: [],
    attendance: [],
    assignments: [],
    notices: [],
    timetable: {},
    books: []
  };

  global.SRMS_DATA = {
    users: users,
    departments: departments,
    studentProfile: studentProfile,
    studentRoster: studentRoster,
    teachers: teachers,
    admins: admins
  };
  global.SRMS_DATA.defaults = academicDefaults;
})(window);

