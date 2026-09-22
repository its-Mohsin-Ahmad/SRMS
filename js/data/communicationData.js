/* =============================================================================
   SRMS - Communication Data  (js/data/communicationData.js)
   Messages, threads, notifications, audit logs, feedback records.
   ========================================================================== */
(function (global) {
  'use strict';

  /* --------------------------------------------------------------- THREADS */
  const threads = [
    { id:'TH-01', with:'Dr. Ahmad Hassan', role:'Course Instructor - CS-301', avatarTone:'blue',   unread:2, subject:'Query regarding normalization assignment',
      messages:[
        { from:'them', text:'Assalam o Alaikum Ahmed. I reviewed your normalization exercise. Your 2NF decomposition is correct but the 3NF step needs revision.', time:'2026-09-21T10:12:00' },
        { from:'me',   text:'Walaikum Assalam Sir. Thank you for the feedback. Should I redo the entire question or only the transitive dependency part?', time:'2026-09-21T10:30:00' },
        { from:'them', text:'Only the transitive dependency part. Also mention the candidate keys clearly before each step. Submit the revised version by 26 September.', time:'2026-09-21T10:41:00' },
        { from:'them', text:'Please also attend the doubt session on Thursday at 02:00 PM in Lab C-12.', time:'2026-09-21T10:42:00' }
      ] },
    { id:'TH-02', with:'Ms. Hina Qureshi', role:'Course Instructor - CS-207', avatarTone:'teal', unread:1, subject:'Subnetting worksheet clarification',
      messages:[
        { from:'them', text:'Your subnetting worksheet was submitted with question 4 missing. Kindly complete and resubmit before the deadline.', time:'2026-09-20T15:02:00' },
        { from:'me',   text:'Noted Ma am. I will resubmit the complete worksheet by tomorrow evening.', time:'2026-09-20T15:20:00' },
        { from:'them', text:'Good. Also revise VLSM before the quiz, it carries significant weight.' , time:'2026-09-20T15:26:00' }
      ] },
    { id:'TH-03', with:'Academic Advisor Office', role:'Advisor - Dr. Ahmad Hassan', avatarTone:'purple', unread:0, subject:'Semester 6 course selection guidance',
      messages:[
        { from:'them', text:'Dear student, your advisor has approved your proposed course plan for the next semester. Please review it on the portal.', time:'2026-09-18T09:15:00' },
        { from:'me',   text:'Thank you. I have reviewed the plan and it works well with my elective choices.', time:'2026-09-18T09:48:00' },
        { from:'them', text:'Perfect. Registration will open on 1 November. Do not delay the fee submission.', time:'2026-09-18T09:55:00' }
      ] },
    { id:'TH-04', with:'Examination Section', role:'Administration', avatarTone:'yellow', unread:0, subject:'Exam admit card collection',
      messages:[
        { from:'them', text:'Your admit card for the Fall 2026 final examinations is ready. Collect it from the examination office after clearing dues.', time:'2026-09-19T11:04:00' },
        { from:'me',   text:'Thank you. My dues are already cleared, I will collect it this week.', time:'2026-09-19T12:12:00' }
      ] },
    { id:'TH-05', with:'Dr. Imran Shahid', role:'Course Instructor - SE-201', avatarTone:'green', unread:0, subject:'SRS document grade and improvement' ,
      messages:[
        { from:'them', text:'Your SRS draft was well structured. Focus on the non-functional requirements section for the final submission.', time:'2026-09-19T16:40:00' },
        { from:'me',   text:'Thank you Sir. I will expand the performance and security requirements section.', time:'2026-09-19T17:05:00' }
      ] }
  ];

  /* ---------------------------------------------------- MESSAGES (flat list) */
  const messages = threads.map(function (t) {
    const last = t.messages[t.messages.length - 1];
    return { id:t.id, from:t.with, role:t.role, subject:t.subject, preview:last.text, time:last.time, unread:t.unread, tone:t.avatarTone };
  });

  /* --------------------------------------------------------- NOTIFICATIONS */
  const notifications = [
    { id:'NT-01', category:'Results',    title:'New result published',      text:'Mid-semester result for CS-203 (Advanced Database Systems) has been published.', time:'10 minutes ago', unread:true,  tone:'green',  icon:'fa-chart-line' },
    { id:'NT-02', category:'Exams',      title:'Exam reminder',             text:'Final examination for CS-301 is scheduled on 05 October 2026 at 09:00 AM.', time:'1 hour ago', unread:true,  tone:'red',    icon:'fa-file-pen' },
    { id:'NT-03', category:'Attendance', title:'Attendance warning',        text:'Your attendance in CS-201 has dropped to 83 percent. Minimum requirement is 75 percent.', time:'3 hours ago', unread:true,  tone:'yellow', icon:'fa-user-clock' },
    { id:'NT-04', category:'Notices',    title:'New notice from registrar', text:'End semester exam schedule has been published. Please review your hall allocation.', time:'6 hours ago', unread:false, tone:'blue',   icon:'fa-bullhorn' },
    { id:'NT-05', category:'Assignments',title:'Assignment deadline',        text:'ER Diagram for Library System (CS-301) is due on 26 September 2026.', time:'Yesterday', unread:false, tone:'purple', icon:'fa-clipboard-check' },
    { id:'NT-06', category:'Messages',   title:'New message',                text:'Dr. Ahmad Hassan replied to your query about the normalization assignment.', time:'Yesterday', unread:false, tone:'teal',   icon:'fa-comment-dots' },
    { id:'NT-07', category:'Results',    title:'CGPA updated',              text:'Your cumulative GPA has been updated to 3.38 after the latest result publication.', time:'2 days ago', unread:false, tone:'green',  icon:'fa-graduation-cap' },
    { id:'NT-08', category:'Attendance', title:'Attendance marked',         text:'You were marked present in Operating Systems (CS-303) on 21 September.', time:'2 days ago', unread:false, tone:'blue',   icon:'fa-check' },
    { id:'NT-09', category:'Notices',    title:'Library timing updated',    text:'Central library will remain open until 10:00 PM during the examination period.', time:'3 days ago', unread:false, tone:'yellow', icon:'fa-book' },
    { id:'NT-10', category:'System',     title:'Password changed',          text:'Your account password was successfully changed from the profile settings page.', time:'5 days ago', unread:false, tone:'purple', icon:'fa-shield-halved' }
  ];

  /* ------------------------------------------------------------ AUDIT LOGS */
  const auditLogs = [
    { id:'LOG-1001', user:'Sara Ibrahim',  role:'Super Admin',       action:'Published Results',        module:'Results Management', date:'2026-09-22', time:'10:32 AM', ip:'192.168.1.24',  device:'Windows 11 - Chrome',   status:'Success' },
    { id:'LOG-1002', user:'Sara Ibrahim',  role:'Super Admin',       action:'Created Notice',           module:'Notice Board',       date:'2026-09-22', time:'10:05 AM', ip:'192.168.1.24',  device:'Windows 11 - Chrome',   status:'Success' },
    { id:'LOG-1003', user:'Tariq Jameel',  role:'Examination Officer',action:'Scheduled Exam',          module:'Exam Management',    date:'2026-09-22', time:'09:48 AM', ip:'192.168.1.41',  device:'Windows 10 - Edge',     status:'Success' },
    { id:'LOG-1004', user:'Dr. Ahmad Hassan',role:'Teacher',          action:'Updated Attendance',       module:'Attendance',         date:'2026-09-22', time:'09:22 AM', ip:'192.168.1.88',  device:'macOS - Safari',        status:'Success' },
    { id:'LOG-1005', user:'Maria Khan',    role:'Finance Admin',      action:'Login Attempt',            module:'Authentication',     date:'2026-09-22', time:'08:55 AM', ip:'203.81.44.10',  device:'Windows 10 - Chrome',   status:'Failed' },
    { id:'LOG-1006', user:'Naveed Akhtar', role:'Academic Admin',     action:'Enrolled Student',         module:'Student Management', date:'2026-09-22', time:'08:31 AM', ip:'192.168.1.37',  device:'Windows 11 - Chrome',   status:'Success' },
    { id:'LOG-1007', user:'Shazia Rehman', role:'Registrar',          action:'Generated Transcript',     module:'Reports',            date:'2026-09-21', time:'06:12 PM', ip:'192.168.1.29',  device:'Windows 11 - Firefox',  status:'Success' },
    { id:'LOG-1008', user:'Sara Ibrahim',  role:'Super Admin',        action:'Deleted Course',           module:'Course Management',  date:'2026-09-21', time:'04:47 PM', ip:'192.168.1.24',  device:'Windows 11 - Chrome',   status:'Success' },
    { id:'LOG-1009', user:'Prof. Sana Malik',role:'Teacher',          action:'Uploaded Assignment',      module:'Assignments',        date:'2026-09-21', time:'03:19 PM', ip:'192.168.1.52',  device:'Windows 11 - Edge',     status:'Success' },
    { id:'LOG-1010', user:'Tariq Jameel',  role:'Examination Officer',action:'Exported Results',         module:'Reports',            date:'2026-09-21', time:'02:03 PM', ip:'192.168.1.41',  device:'Windows 10 - Edge',     status:'Success' },
    { id:'LOG-1011', user:'Unknown User',  role:'--',                 action:'Login Attempt',            module:'Authentication',     date:'2026-09-21', time:'01:26 PM', ip:'45.118.22.71',  device:'Android - Chrome',      status:'Blocked' },
    { id:'LOG-1012', user:'Naveed Akhtar', role:'Academic Admin',     action:'Updated Timetable',        module:'Timetable',          date:'2026-09-21', time:'11:40 AM', ip:'192.168.1.37',  device:'Windows 11 - Chrome',   status:'Success' }
  ];

  /* ------------------------------------------------------ FEEDBACK RECORDS */
  const feedbackRecords = [
    { id:'FB-01', type:'Teacher Feedback', target:'Dr. Ahmad Hassan', rating:5, comment:'Extremely clear explanations and always available for doubt sessions.', date:'2026-09-15', status:'Reviewed' },
    { id:'FB-02', type:'Course Feedback',  target:'CS-207 Networks',  rating:4, comment:'Course content is strong. More lab time on packet analysis would help.', date:'2026-09-12', status:'Submitted' },
    { id:'FB-03', type:'System Feedback',  target:'SRMS Portal',      rating:5, comment:'Result section and attendance tracking are very convenient to use.', date:'2026-09-08', status:'Reviewed' }
  ];

  global.SRMS_COMMS = {
    threads:threads, messages:messages, notifications:notifications,
    auditLogs:auditLogs, feedbackRecords:feedbackRecords
  };
})(window);
