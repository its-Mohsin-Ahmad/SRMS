/* =============================================================================
   SRMS - Data Aggregator  (js/data/index.js)
   Merges every dataset module into one namespace: window.SRMS_DATA
   Replace each module with an API call to move to a real backend.
   ========================================================================== */
(function (global) {
  'use strict';
  var D = global.SRMS_DATA || {};
  var A = global.SRMS_ACADEMIC || {};
  var R = global.SRMS_RESULTS || {};
  var O = global.SRMS_OPS || {};
  var T = global.SRMS_TIMETABLE || {};
  var P = global.SRMS_PORTAL || {};
  var C = global.SRMS_COMMS || {};
  var N = global.SRMS_ANALYTICS || {};

  D.courses          = A.courses || [];
  D.recentResults    = R.recentResults || [];
  D.semesterResults  = R.semesterResults || [];
  D.cgpaTrend        = R.cgpaTrend || { labels:[], gpa:[], cgpa:[] };

  D.attendanceSummary = O.attendanceSummary || {};
  D.subjectAttendance = O.subjectAttendance || [];
  D.attendanceLog     = O.attendanceLog || [];
  D.exams             = O.exams || [];

  D.days      = T.days || [];
  D.timetable = T.timetable || {};

  D.notices        = P.notices || [];
  D.announcements  = P.announcements || [];
  D.assignments    = P.assignments || [];
  D.downloads      = P.downloads || [];
  D.calendarEvents = P.calendarEvents || [];
  D.books          = P.books || [];
  D.issuedBooks    = P.issuedBooks || [];

  D.threads       = C.threads || [];
  D.messages      = C.messages || [];
  D.notifications = C.notifications || [];
  D.auditLogs     = C.auditLogs || [];
  D.feedbackRecords = C.feedbackRecords || [];

  D.analytics = N;

  global.SRMS_DATA = D;
})(window);
