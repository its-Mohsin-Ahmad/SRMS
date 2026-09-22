/* =============================================================================
   SRMS - Academic Data  (js/data/academicData.js)
   Courses, Subjects, Enrollment, Attendance, Exams, Results, Timetable.
   ========================================================================== */
(function (global) {
  'use strict';

  /* --------------------------------------------------------------- COURSES */
  const courses = [
    { code:'CS-301', name:'Database Systems', dept:'Computer Science', teacher:'Dr. Ahmad Hassan', credits:3, semester:5, section:'A', attendance:92, progress:78, status:'Active', enrolled:42, room:'Lab C-12', schedule:'Mon, Wed 09:00 - 10:30',
      description:'Relational model, normalization, SQL, transactions, indexing and query optimization with hands-on PostgreSQL labs.',
      syllabus:['DB Architecture','ER Modelling','Relational Algebra','SQL and PL/SQL','Normalization','Transactions','Indexing and Tuning','NoSQL Overview'] },
    { code:'CS-303', name:'Operating Systems', dept:'Computer Science', teacher:'Dr. Ahmad Hassan', credits:3, semester:5, section:'A', attendance:88, progress:71, status:'Active', enrolled:42, room:'Room B-07', schedule:'Tue, Thu 11:00 - 12:30',
      description:'Processes, threads, CPU scheduling, synchronization, deadlocks, memory management and file systems.',
      syllabus:['OS Structures','Process Management','CPU Scheduling','Synchronization','Deadlock','Memory Management','Virtual Memory','File Systems'] },
    { code:'CS-201', name:'Data Structures', dept:'Computer Science', teacher:'Prof. Sana Malik', credits:3, semester:3, section:'A', attendance:90, progress:100, status:'Completed', enrolled:48, room:'Room A-11', schedule:'Mon, Wed 11:00 - 12:30',
      description:'Arrays, linked lists, stacks, queues, trees, graphs and hashing with complexity analysis in C++.' ,
      syllabus:['Complexity Analysis','Arrays and Strings','Linked Lists','Stacks and Queues','Trees and BST','Heaps','Graphs','Hashing'] },
    { code:'CS-205', name:'Operating Systems Lab', dept:'Computer Science', teacher:'Prof. Sana Malik', credits:1, semester:3, section:'A', attendance:88, progress:100, status:'Completed', enrolled:48, room:'Lab C-04', schedule:'Fri 09:00 - 12:00',
      description:'Practical implementation of scheduling, IPC, threading and memory management in Linux.',
      syllabus:['Shell Scripting','System Calls','Process Creation','IPC and Pipes','Threading','Scheduling Algorithms','Memory Allocation','Mini Project'] },
    { code:'CS-207', name:'Computer Networks', dept:'Computer Science', teacher:'Ms. Hina Qureshi', credits:3, semester:5, section:'A', attendance:85, progress:74, status:'Active', enrolled:42, room:'Room B-02', schedule:'Tue, Thu 09:00 - 10:30',
      description:'OSI and TCP/IP models, routing, switching, transport protocols and network security fundamentals.',
      syllabus:['Network Models','Physical Layer','Data Link Layer','MAC and Ethernet','IP Addressing','Routing Algorithms','Transport Layer','Application Layer'] },
    { code:'SE-201', name:'Software Engineering', dept:'Software Engineering', teacher:'Dr. Imran Shahid', credits:2, semester:5, section:'A', attendance:95, progress:82, status:'Active', enrolled:42, room:'Room A-05', schedule:'Wed, Fri 14:00 - 15:30',
      description:'SDLC, agile methods, requirements engineering, UML design, testing strategies and project management.',
      syllabus:['SDLC Models','Agile and Scrum','Requirements Engineering','UML Modelling','Design Principles','Testing Strategies','Version Control','Project Management'] },
    { code:'CS-203', name:'Advanced Database Systems', dept:'Computer Science', teacher:'Dr. Ahmad Hassan', credits:3, semester:5, section:'A', attendance:93, progress:80, status:'Active', enrolled:42, room:'Lab C-12', schedule:'Mon, Thu 14:00 - 15:30',
      description:'Distributed databases, data warehousing, OLAP, NoSQL engines and big data storage.' ,
      syllabus:['Distributed DB','Replication','Data Warehousing','OLAP Cubes','Column Stores','NoSQL Models','CAP Theorem','Big Data Stores'] },
    { code:'MTH-301', name:'Probability and Statistics', dept:'Mathematics', teacher:'Ms. Rabia Sultan', credits:3, semester:5, section:'A', attendance:86, progress:68, status:'Active', enrolled:42, room:'Room M-03', schedule:'Tue 13:00 - 14:30',
      description:'Probability distributions, random variables, estimation, hypothesis testing and regression.',
      syllabus:['Descriptive Statistics','Probability Rules','Random Variables','Distributions','Sampling','Estimation','Hypothesis Testing','Regression'] }
  ];

  global.SRMS_ACADEMIC = { courses: courses };
})(window);
