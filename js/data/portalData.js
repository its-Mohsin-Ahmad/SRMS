/* =============================================================================
   SRMS - Portal Data  (js/data/portalData.js)
   Notices, announcements, assignments, downloads, calendar events, library.
   ========================================================================== */
(function (global) {
  'use strict';

  /* ---------------------------------------------------------------- NOTICES */
  const notices = [
    { id:'NTC-01', title:'End Semester Exam Schedule', description:'Final examination schedule for Fall 2026 has been published. Check your exam hall and reporting time.', category:'Examination', audience:'All Students', date:'2026-09-21', expiry:'2026-10-20', pinned:true,  unread:true,  author:'Examination Section', attachment:'exam-schedule-fall-2026.pdf' },
    { id:'NTC-02', title:'Result Declaration Notice',   description:'Mid-semester results for the 5th semester are now available on your dashboard.' , category:'Results',     audience:'5th Semester',   date:'2026-09-19', expiry:'2026-10-05', pinned:true,  unread:true,  author:'Registrar Office', attachment:'' },
    { id:'NTC-03', title:'Project Submission Deadline', description:'Final year project submission deadline is 15 October 2026. Late submissions carry a penalty.' , category:'Academic',    audience:'7th Semester',   date:'2026-09-17', expiry:'2026-10-15', pinned:false, unread:true,  author:'Project Committee', attachment:'fyp-guidelines.pdf' },
    { id:'NTC-04', title:'Holiday Announcement',        description:'The university will remain closed on 30 September 2026 for the announced public holiday.' , category:'General',     audience:'All Students',   date:'2026-09-15', expiry:'2026-10-01', pinned:false, unread:false, author:'Administration', attachment:'' },
    { id:'NTC-05', title:'Scholarship Applications Open',description:'Merit and need-based scholarship applications for Spring 2027 are open until 10 October.' , category:'Scholarship', audience:'All Students',   date:'2026-09-12', expiry:'2026-10-10', pinned:false, unread:false, author:'Financial Aid Office', attachment:'scholarship-form.pdf' },
    { id:'NTC-06', title:'Library Timing Update',       description:'Central library will remain open from 08:00 AM to 10:00 PM during the examination period.' , category:'Library',     audience:'All Students',   date:'2026-09-10', expiry:'2026-10-31', pinned:false, unread:false, author:'Central Library', attachment:'' },
    { id:'NTC-07', title:'Course Registration Reminder',description:'Spring 2027 course registration opens on 1 November. Meet your advisor before selecting courses.' , category:'Academic',    audience:'All Students',   date:'2026-09-08', expiry:'2026-11-15', pinned:false, unread:false, author:'Academic Office', attachment:'' },
    { id:'NTC-08', title:'Sports Gala Registration',    description:'Annual sports gala registrations are open for all departments until 28 September.' , category:'Events',      audience:'All Students',   date:'2026-09-05', expiry:'2026-09-28', pinned:false, unread:false, author:'Sports Society', attachment:'sports-gala.pdf' }
  ];

  /* ------------------------------------------------------- ANNOUNCEMENTS */
  const announcements = [
    { id:'ANN-01', title:'Orientation Week for New Intake', body:'Orientation sessions for the Spring 2027 intake begin 5 October in the main auditorium.' , date:'2026-09-20', by:'Dean of Students', tone:'blue' },
    { id:'ANN-02', title:'Faculty Development Workshop',   body:'A research methodology workshop is scheduled for all faculty members on 27 September.' , date:'2026-09-18', by:'HR Department',    tone:'purple' },
    { id:'ANN-03', title:'Lab Network Maintenance',        body:'Computer labs C-04 and C-12 will be offline on Friday 09:00 AM to 12:00 PM for maintenance.' , date:'2026-09-16', by:'IT Services',       tone:'yellow' },
    { id:'ANN-04', title:'Convocation 2026 Registrations', body:'Graduating students of batch 2021-2025 must register for convocation before 20 October.' , date:'2026-09-14', by:'Registrar Office',  tone:'green' }
  ];

  /* ------------------------------------------------------ ASSIGNMENTS */
  const assignments = [
    { id:'AS-101', title:'ER Diagram for Library System', course:'Database Systems',          code:'CS-301', teacher:'Dr. Ahmad Hassan', assigned:'2026-09-12', due:'2026-09-26', status:'Pending',   submission:'Not submitted',  marks:null, total:20, priority:'High',   description:'Design a complete ER diagram for a university library management system including entities, relationships, cardinalities and participation constraints.' },
    { id:'AS-102', title:'CPU Scheduling Simulation',      course:'Operating Systems',         code:'CS-303', teacher:'Dr. Ahmad Hassan', assigned:'2026-09-14', due:'2026-09-28', status:'Pending',   submission:'Not submitted',  marks:null, total:15, priority:'High',   description:'Implement FCFS, SJF and Round Robin scheduling in C and compare average waiting time.' },
    { id:'AS-103', title:'Subnetting Worksheet',           course:'Computer Networks',         code:'CS-207', teacher:'Ms. Hina Qureshi', assigned:'2026-09-10', due:'2026-09-24', status:'Pending',   submission:'Not submitted',  marks:null, total:10, priority:'Medium', description:'Complete the subnetting worksheet covering VLSM, CIDR notation and route summarisation.' },
    { id:'AS-104', title:'SRS Document Draft',             course:'Software Engineering',      code:'SE-201', teacher:'Dr. Imran Shahid', assigned:'2026-09-05', due:'2026-09-20', status:'Submitted', submission:'2026-09-19',   marks:null, total:25, priority:'High',   description:'Prepare an IEEE-format SRS document for your semester project with functional and non-functional requirements.' },
    { id:'AS-105', title:'Normalization Exercise Set 3',   course:'Advanced Database Systems', code:'CS-203', teacher:'Dr. Ahmad Hassan', assigned:'2026-09-08', due:'2026-09-22', status:'Graded',    submission:'2026-09-21',   marks:18,  total:20, priority:'Medium', description:'Normalise the given relations up to 3NF and BCNF, showing every decomposition step.' },
    { id:'AS-106', title:'Hypothesis Testing Problems',    course:'Probability and Statistics',code:'MTH-301',teacher:'Ms. Rabia Sultan', assigned:'2026-09-03', due:'2026-09-17', status:'Graded',    submission:'2026-09-16',   marks:22,  total:25, priority:'Low',    description:'Solve the assigned hypothesis testing problems using t-test and chi-square methods.' },
    { id:'AS-107', title:'Case Study: Agile Adoption',     course:'Software Engineering',      code:'SE-201', teacher:'Dr. Imran Shahid', assigned:'2026-09-15', due:'2026-10-02', status:'Pending',   submission:'Not submitted',  marks:null, total:20, priority:'Medium', description:'Analyse the provided case study and recommend an agile adoption roadmap for a mid-size firm.' },
    { id:'AS-108', title:'Query Optimisation Report',      course:'Database Systems',          code:'CS-301', teacher:'Dr. Ahmad Hassan', assigned:'2026-08-28', due:'2026-09-12', status:'Completed', submission:'2026-09-11',   marks:19,  total:20, priority:'High',   description:'Benchmark five SQL queries, capture execution plans and propose index-based optimisations.' }
  ];

  /* -------------------------------------------------------- DOWNLOADS */
  const downloads = [
    { id:'DL-01', name:'Semester Result Card',  file:'result-card-sem5.pdf',        size:'412 KB', type:'PDF',  category:'Results',   icon:'fa-file-pdf',      tone:'red',    date:'2026-09-21' },
    { id:'DL-02', name:'Official Transcript',   file:'transcript-2021-2025.pdf',    size:'1.2 MB', type:'PDF',  category:'Results',   icon:'fa-scroll',        tone:'red',    date:'2026-09-20' },
    { id:'DL-03', name:'Fee Voucher Fall 2026', file:'fee-voucher-fall-2026.pdf',   size:'248 KB', type:'PDF',  category:'Finance',   icon:'fa-receipt',       tone:'green',  date:'2026-09-18' },
    { id:'DL-04', name:'Course Materials CS-301',file:'cs301-slides.zip',           size:'18 MB',  type:'ZIP',  category:'Materials', icon:'fa-file-zipper',   tone:'purple', date:'2026-09-16' },
    { id:'DL-05', name:'Exam Schedule Fall 2026',file:'exam-schedule-fall-2026.pdf', size:'320 KB', type:'PDF',  category:'Exams',     icon:'fa-calendar-days', tone:'red',    date:'2026-09-21' },
    { id:'DL-06', name:'Class Timetable',       file:'timetable-sem5.xlsx',         size:'86 KB',  type:'XLSX', category:'Academic',  icon:'fa-file-excel',    tone:'green',  date:'2026-09-15' },
    { id:'DL-07', name:'Merit Certificate',     file:'merit-certificate.pdf',       size:'540 KB', type:'PDF',  category:'Certificates',icon:'fa-award',      tone:'yellow', date:'2026-09-12' },
    { id:'DL-08', name:'Notice Compilation',    file:'notices-september.pdf',       size:'760 KB', type:'PDF',  category:'Notices',   icon:'fa-bullhorn',      tone:'blue',   date:'2026-09-10' },
    { id:'DL-09', name:'Student Handbook',      file:'student-handbook.pdf',        size:'3.4 MB', type:'PDF',  category:'Academic',  icon:'fa-book',          tone:'blue',   date:'2026-09-01' },
    { id:'DL-10', name:'Lab Manual CS-303',     file:'cs303-lab-manual.pdf',        size:'2.1 MB', type:'PDF',  category:'Materials', icon:'fa-flask',         tone:'teal',   date:'2026-08-29' }
  ];

  /* --------------------------------------------------- CALENDAR EVENTS */
  const calendarEvents = [
    { date:'2026-09-24', title:'Assignment 03 Due',        type:'deadline',   detail:'Subnetting Worksheet - CS-207' },
    { date:'2026-09-26', title:'Assignment 01 Due',        type:'deadline',   detail:'ER Diagram Library System - CS-301' },
    { date:'2026-09-28', title:'Assignment 02 Due',        type:'deadline',   detail:'CPU Scheduling Simulation - CS-303' },
    { date:'2026-09-30', title:'Public Holiday',           type:'holiday',    detail:'University closed' },
    { date:'2026-10-02', title:'Case Study Due',           type:'deadline',   detail:'Agile Adoption - SE-201' },
    { date:'2026-10-05', title:'Final Exam: CS-301',       type:'exam',       detail:'Database Systems - Hall A-01, 09:00 AM' },
    { date:'2026-10-07', title:'Final Exam: CS-303',       type:'exam',       detail:'Operating Systems - Hall A-02, 09:00 AM' },
    { date:'2026-10-09', title:'Final Exam: CS-207',       type:'exam',       detail:'Computer Networks - Hall B-01, 11:30 AM' },
    { date:'2026-10-12', title:'Final Exam: SE-201',       type:'exam',       detail:'Software Engineering - Hall B-04, 02:00 PM' },
    { date:'2026-10-15', title:'Final Exam: CS-203',       type:'exam',       detail:'Advanced DB Systems - Hall A-03, 09:00 AM' },
    { date:'2026-10-15', title:'Project Submission',       type:'deadline',   detail:'Final year project deadline' },
    { date:'2026-10-18', title:'Final Exam: MTH-301',      type:'exam',       detail:'Probability and Statistics - Hall C-02' },
    { date:'2026-10-20', title:'Semester Ends',            type:'semester',   detail:'Fall 2026 semester closes' },
    { date:'2026-10-25', title:'Result Announcement',      type:'result',     detail:'Final results published on portal' },
    { date:'2026-11-01', title:'Spring Registration Opens',type:'semester',  detail:'Course registration for Spring 2027' },
    { date:'2026-11-10', title:'Semester Break Begins',    type:'holiday',    detail:'Winter break until 30 November' }
  ];

  /* ------------------------------------------------------------- LIBRARY */
  const books = [
    { id:'BK-1001', title:'Database System Concepts',     author:'Silberschatz, Korth', isbn:'978-0078022159', category:'Database',      publisher:'McGraw-Hill', availability:'Available', copies:6, available:3, shelf:'DB-04', tone:'blue',   rating:4.7 },
    { id:'BK-1002', title:'Operating System Concepts',    author:'Silberschatz, Galvin',isbn:'978-1118063330', category:'Operating Systems',publisher:'Wiley',       availability:'Issued',    copies:8, available:0, shelf:'OS-02', tone:'purple', rating:4.6 },
    { id:'BK-1003', title:'Computer Networking: A Top-Down Approach', author:'Kurose and Ross', isbn:'978-0133594140', category:'Networks', publisher:'Pearson', availability:'Available', copies:5, available:2, shelf:'NW-01', tone:'teal', rating:4.8 },
    { id:'BK-1004', title:'Software Engineering: A Practitioner Approach', author:'Roger S. Pressman', isbn:'978-1259872976', category:'Software Engineering', publisher:'McGraw-Hill', availability:'Available', copies:7, available:4, shelf:'SE-03', tone:'green', rating:4.5 },
    { id:'BK-1005', title:'Introduction to Algorithms',   author:'Cormen, Leiserson',  isbn:'978-0262046305', category:'Algorithms',     publisher:'MIT Press',  availability:'Issued',    copies:4, available:0, shelf:'AL-01', tone:'yellow', rating:4.9 },
    { id:'BK-1006', title:'Clean Code',                   author:'Robert C. Martin',   isbn:'978-0132350884', category:'Programming',    publisher:'Prentice Hall', availability:'Available', copies:6, available:5, shelf:'PR-06', tone:'pink', rating:4.6 },
    { id:'BK-1007', title:'Artificial Intelligence: A Modern Approach', author:'Russell and Norvig', isbn:'978-0134610993', category:'AI and ML', publisher:'Pearson', availability:'Reserved', copies:4, available:1, shelf:'AI-02', tone:'purple', rating:4.8 },
    { id:'BK-1008', title:'Probability and Statistics for Engineers', author:'Jay L. Devore', isbn:'978-1305251809', category:'Mathematics', publisher:'Cengage', availability:'Available', copies:5, available:3, shelf:'MT-05', tone:'red', rating:4.4 },
    { id:'BK-1009', title:'Computer Organization and Design', author:'Patterson and Hennessy', isbn:'978-0128201091', category:'Architecture', publisher:'Morgan Kaufmann', availability:'Available', copies:4, available:2, shelf:'AR-02', tone:'teal', rating:4.7 },
    { id:'BK-1010', title:'Data Communications and Networking', author:'Behrouz A. Forouzan', isbn:'978-0073376226', category:'Networks', publisher:'McGraw-Hill', availability:'Issued', copies:5, available:0, shelf:'NW-03', tone:'blue', rating:4.5 }
  ];

  const issuedBooks = [
    { id:'IS-01', book:'Operating System Concepts',        code:'BK-1002', issued:'2026-09-03', due:'2026-09-24', status:'Due Soon', fine:0 },
    { id:'IS-02', book:'Introduction to Algorithms',       code:'BK-1005', issued:'2026-08-28', due:'2026-09-18', status:'Overdue',  fine:150 },
    { id:'IS-03', book:'Data Communications and Networking',code:'BK-1010',issued:'2026-09-10', due:'2026-10-01', status:'Issued',   fine:0 }
  ];

  global.SRMS_PORTAL = {
    notices:notices, announcements:announcements, assignments:assignments,
    downloads:downloads, calendarEvents:calendarEvents, books:books, issuedBooks:issuedBooks
  };
})(window);
