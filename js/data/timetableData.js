/* =============================================================================
   SRMS - Timetable Data  (js/data/timetableData.js)
   ========================================================================== */
(function (global) {
  'use strict';

  const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  const timetable = {
    Monday: [
      { time:'09:00 - 10:30', course:'Database Systems',          code:'CS-301', teacher:'Dr. Ahmad Hassan', room:'Lab C-12', tone:'main' },
      { time:'11:00 - 12:30', course:'Data Structures',           code:'CS-201', teacher:'Prof. Sana Malik', room:'Room A-11', tone:'teal' },
      { time:'14:00 - 15:30', course:'Advanced Database Systems', code:'CS-203', teacher:'Dr. Ahmad Hassan', room:'Lab C-12', tone:'lab' }
    ],
    Tuesday: [
      { time:'09:00 - 10:30', course:'Computer Networks',          code:'CS-207', teacher:'Ms. Hina Qureshi', room:'Room B-02', tone:'main' },
      { time:'11:00 - 12:30', course:'Operating Systems',          code:'CS-303', teacher:'Dr. Ahmad Hassan', room:'Room B-07', tone:'teal' },
      { time:'13:00 - 14:30', course:'Probability and Statistics', code:'MTH-301',teacher:'Ms. Rabia Sultan', room:'Room M-03', tone:'lab' }
    ],
    Wednesday: [
      { time:'09:00 - 10:30', course:'Database Systems',   code:'CS-301', teacher:'Dr. Ahmad Hassan', room:'Lab C-12', tone:'main' },
      { time:'11:00 - 12:30', course:'Data Structures',    code:'CS-201', teacher:'Prof. Sana Malik', room:'Room A-11', tone:'teal' },
      { time:'12:30 - 14:00', course:'Lunch and Prayer Break', code:'BREAK', teacher:'--',             room:'Cafeteria',tone:'break' },
      { time:'14:00 - 15:30', course:'Software Engineering',code:'SE-201', teacher:'Dr. Imran Shahid',  room:'Room A-05', tone:'main' }
    ],
    Thursday: [
      { time:'09:00 - 10:30', course:'Computer Networks',         code:'CS-207', teacher:'Ms. Hina Qureshi', room:'Room B-02', tone:'main' },
      { time:'11:00 - 12:30', course:'Operating Systems',         code:'CS-303', teacher:'Dr. Ahmad Hassan', room:'Room B-07', tone:'teal' },
      { time:'14:00 - 15:30', course:'Advanced Database Systems', code:'CS-203', teacher:'Dr. Ahmad Hassan', room:'Lab C-12', tone:'lab' }
    ],
    Friday: [
      { time:'09:00 - 12:00', course:'Operating Systems Lab', code:'CS-205', teacher:'Prof. Sana Malik', room:'Lab C-04', tone:'lab' },
      { time:'14:00 - 15:30', course:'Software Engineering',  code:'SE-201', teacher:'Dr. Imran Shahid', room:'Room A-05', tone:'main' }
    ],
    Saturday: [
      { time:'10:00 - 11:30', course:'Seminar and Mentoring Session', code:'SEM-01', teacher:'Department Faculty', room:'Auditorium', tone:'teal' }
    ]
  };

  global.SRMS_TIMETABLE = { days:days, timetable:timetable };
})(window);
