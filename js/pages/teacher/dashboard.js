/* =============================================================================
   SRMS - Teacher Dashboard  (js/pages/teacher/dashboard.js)
   Teaching load, class performance analytics, attendance insights, pending
   grading tasks and upcoming examination schedule.
   ========================================================================== */
(function (global) {
  'use strict';
  var U = global.SRMS_UTIL;
  var UI = global.SRMS_UI;
  var R = global.SRMS_ROUTES;
  var C = global.SRMS_CHARTS;

  function teacherDashboard(host, ctx) {
    var D = global.SRMS_DATA;
    var t = D.teachers[0];
    var A = D.analytics || {};
    var TP = A.teacherPerformance || { distribution:[], trend:{}, courseAttendance:{}, marks:{}, summary:{} };
    var s = TP.summary || {};

    var myCourses = (D.courses || []).filter(function (c) { return c.teacher === t.name; });
    var myStudents = (D.studentRoster || []).filter(function (st) { return st.sem === 5 && st.section === 'A'; });
    var pendingResults = (D.assignments || []).filter(function (a) { return a.status === 'Submitted'; }).length;
    var upcoming = (D.exams || []).filter(function (e) { return e.status === 'Upcoming'; }).slice(0, 4);

    host.innerHTML =
      '<section class="card-hero mb-16">' +
        '<div class="hero-inner">' +
          '<div class="hero-text">' +
            '<h2 class="hero-greet">' + U.greeting() + ', ' + U.esc(t.name) + ' <span class="wave">\ud83d\udc4b</span></h2>' +
            '<p class="hero-sub">Your teaching overview for the current semester. Review class performance, pending grading and upcoming examinations.</p>' +
            '<div class="hero-meta">' +
              '<span class="hero-chip"><i class="fas fa-id-badge"></i> ' + U.esc(t.id) + '</span>' +
              '<span class="hero-chip"><i class="fas fa-building-columns"></i> ' + U.esc(t.dept) + '</span>' +
              '<span class="hero-chip"><i class="fas fa-award"></i> ' + U.esc(t.designation) + '</span>' +
              '<span class="hero-chip"><i class="fas fa-star"></i> Rating ' + t.rating + ' / 5.00</span>' +
            '</div>' +
            '<div class="hero-actions">' +
              '<button class="btn btn-primary" data-go="results"><i class="fas fa-square-poll-vertical"></i> Enter Results</button>' +
              '<button class="btn btn-outline" data-go="attendance"><i class="fas fa-user-check"></i> Mark Attendance</button>' +
              '<button class="btn btn-outline" data-go="assignments"><i class="fas fa-clipboard-check"></i> Grade Assignments</button>' +
            '</div>' +
          '</div>' +
          '<div class="hero-art" aria-hidden="true"><i class="fas fa-chalkboard-user"></i></div>' +
        '</div>' +
      '</section>' +

      '<div class="grid grid-stats mb-16">' +
        UI.statCard({ title:'Total Students', value:t.students, suffix:'students', icon:'fa-users', tone:'blue', note:'Across ' + myCourses.length + ' courses', trend:{ dir:'up', value:'+8' } }) +
        UI.statCard({ title:'Courses Teaching', value:myCourses.length, suffix:'courses', icon:'fa-book-open', tone:'purple', note:U.sum(myCourses, 'credits') + ' credit hours' }) +
        UI.statCard({ title:'Pending Results', value:pendingResults, suffix:'to grade', icon:'fa-hourglass-half', tone:'yellow', note:'Submissions awaiting evaluation', trend:{ dir: pendingResults ? 'down' : 'flat', value: pendingResults ? 'Action needed' : 'Clear' } }) +
        UI.statCard({ title:'Average Attendance', value:U.fmtPct(s.avgAttendance || 90), icon:'fa-user-check', tone:'green', note:'Across all teaching sections' }) +
        UI.statCard({ title:'Upcoming Exams', value:(D.exams || []).filter(function (e) { return e.status === 'Upcoming'; }).length, suffix:'scheduled', icon:'fa-file-pen', tone:'red', note:'Final examinations this semester' }) +
        UI.statCard({ title:'Average Marks', value:(s.averageMarks || 81) + '%', icon:'fa-chart-simple', tone:'teal', note:'Class average across assessments', trend:{ dir:'up', value:'+3%' } }) +
      '</div>' +

      '<div class="grid grid-2 mb-16">' +
        UI.card({ title:'Student Performance Distribution', icon:'fa-chart-pie', subtitle:'Grade bands across all your students',
          body:'<div class="grid grid-2" style="align-items:center"><div class="donut-wrap"><canvas id="td-donut" class="chart-h-260"></canvas>' +
            '<div class="donut-center"><strong>' + (s.passPercentage || 91) + '%</strong><span>Pass Rate</span></div></div>' +
            '<div>' + UI.legendRows(TP.distribution || []) + '</div></div>' }) +
        UI.card({ title:'Student Performance Trend', icon:'fa-arrow-trend-up', subtitle:'Average marks progression across the semester',
          body:'<div class="chart-box chart-h-300"><canvas id="td-trend"></canvas></div>' }) +
      '</div>' +

      '<div class="grid grid-main-side mb-16">' +
        UI.card({ title:'Attendance by Course', icon:'fa-chart-column', subtitle:'Average attendance percentage per course you teach',
          body:'<div class="chart-box chart-h-300"><canvas id="td-attendance"></canvas></div>' }) +
        UI.card({ title:'Marks Summary', icon:'fa-chart-simple',
          body:UI.kpiStrip([
            { label:'Average', value:(s.averageMarks || 81) + '%', color:'#1677E8' },
            { label:'Highest', value:(s.highestMarks || 98) + '%', color:'#22C55E' },
            { label:'Lowest',  value:(s.lowestMarks || 48) + '%', color:'#EF4444' },
            { label:'Pass %',  value:(s.passPercentage || 91) + '%', color:'#8B5CF6' }
          ]) +
          '<div class="divider"></div>' +
          UI.meterList([
            { label:'Excellent (85%+)',        value:TP.distribution && TP.distribution[0] ? TP.distribution[0].value + '%' : '58%', percent:TP.distribution && TP.distribution[0] ? TP.distribution[0].value : 58, tone:'green' },
            { label:'Good (70-84%)',           value:TP.distribution && TP.distribution[1] ? TP.distribution[1].value + '%' : '24%', percent:TP.distribution && TP.distribution[1] ? TP.distribution[1].value : 24, tone:'' },
            { label:'Average (55-69%)',        value:TP.distribution && TP.distribution[2] ? TP.distribution[2].value + '%' : '13%', percent:TP.distribution && TP.distribution[2] ? TP.distribution[2].value : 13, tone:'yellow' },
            { label:'Needs Improvement (<55%)',value:TP.distribution && TP.distribution[3] ? TP.distribution[3].value + '%' : '5%',  percent:TP.distribution && TP.distribution[3] ? TP.distribution[3].value : 5,  tone:'red' }
          ]) }) +
      '</div>' +

      '<div class="grid grid-main-side mb-16">' +
        UI.card({ title:'My Courses', icon:'fa-book-open', subtitle:'Courses assigned to you this semester',
          actions:'<button class="btn btn-ghost btn-sm" data-go="courses">View All</button>',
          body: myCourses.length ? '<div class="grid grid-2">' + myCourses.map(function (c) {
            return '<div class="card card-hover" data-course="' + U.esc(c.code) + '" style="cursor:pointer"><div class="flex-between mb-12">' +
              '<span class="badge badge-blue">' + U.esc(c.code) + '</span>' + UI.statusBadge(c.status) + '</div>' +
              '<h3 style="font-size:14px;line-height:1.4">' + U.esc(c.name) + '</h3>' +
              '<p class="text-mute text-xs mt-4">' + c.enrolled + ' students \u00b7 ' + c.credits + ' credits \u00b7 ' + U.esc(c.room) + '</p>' +
              '<div class="meter mt-12"><div class="meter-top"><strong>Syllabus coverage</strong><span>' + c.progress + '%</span></div>' + UI.progress(c.progress, 'purple') + '</div>' +
              '<div class="meter mt-8"><div class="meter-top"><strong>Attendance</strong><span>' + c.attendance + '%</span></div>' + UI.progress(c.attendance, 'green') + '</div></div>';
          }).join('') + '</div>' : UI.emptyState({ small:true, icon:'fa-book', title:'No courses assigned', message:'Contact the administration to assign courses.' }) }) +
        UI.card({ title:'Top Performing Students', icon:'fa-trophy', subtitle:'Highest CGPA in your sections',
          body:'<div class="list-simple">' + U.sortBy(myStudents, 'cgpa', 'desc').slice(0, 5).map(function (st, i) {
            return '<div class="list-row"><span class="resource-ico badge-' + (i === 0 ? 'yellow' : i === 1 ? 'gray' : i === 2 ? 'yellow' : 'blue') + '" style="width:36px;height:36px;font-size:13px;border-radius:10px"><strong>' + (i + 1) + '</strong></span>' +
              '<div class="list-row-main"><strong>' + U.esc(st.name) + '</strong><span>' + U.esc(st.id) + ' \u00b7 ' + st.attendance + '% attendance</span></div>' +
              '<span class="badge badge-green">' + U.fmtGpa(st.cgpa) + '</span></div>';
          }).join('') + '</div>' }) +
      '</div>' +

      '<div class="grid grid-2">' +
        UI.card({ title:'Pending Grading Tasks', icon:'fa-clipboard-check', subtitle:'Submissions waiting for your evaluation',
          actions:'<button class="btn btn-ghost btn-sm" data-go="assignments">Open</button>',
          body:'<div id="td-pending"></div>' }) +
        UI.card({ title:'Upcoming Examinations', icon:'fa-file-pen', subtitle:'Your invigilation and exam schedule',
          body: upcoming.length ? '<div class="list-simple">' + upcoming.map(function (e) {
            var cd = U.countdown(e.date);
            return '<div class="list-row"><span class="resource-ico badge-red" style="width:40px;height:40px;font-size:15px;border-radius:12px"><i class="fas fa-file-pen"></i></span>' +
              '<div class="list-row-main"><strong>' + U.esc(e.course) + '</strong><span>' + U.fmtDate(e.date) + ' \u00b7 ' + U.esc(e.time) + ' \u00b7 ' + U.esc(e.room) + '</span></div>' +
              '<span class="badge badge-' + (cd.days <= 7 ? 'red' : 'yellow') + '">' + U.esc(cd.text) + '</span></div>';
          }).join('') + '</div>' : UI.emptyState({ small:true, icon:'fa-mug-hot', title:'No exams scheduled', message:'Examination duties will appear here.' }) })
      + '</div>';

    /* ------------------------------------------------ PENDING GRADING */
    var pending = (D.assignments || []).filter(function (a) { return a.status === 'Submitted' || (a.status === 'Pending' && U.daysBetween(U.todayISO(), a.due) < 0); });
    document.getElementById('td-pending').innerHTML = pending.length ? '<div class="list-simple">' + pending.slice(0, 5).map(function (a) {
      return '<div class="list-row"><span class="resource-ico badge-yellow" style="width:40px;height:40px;font-size:15px;border-radius:12px"><i class="fas fa-pen"></i></span>' +
        '<div class="list-row-main"><strong>' + U.esc(a.title) + '</strong><span>' + U.esc(a.code) + ' \u00b7 ' + U.esc(a.course) + ' \u00b7 ' + a.total + ' marks</span></div>' +
        '<button class="btn btn-primary btn-xs" data-go="assignments"><i class="fas fa-pen"></i> Grade</button></div>';
    }).join('') + '</div>' : UI.emptyState({ small:true, icon:'fa-circle-check', title:'All graded', message:'No submissions are waiting for evaluation.' });

    host.addEventListener('click', function (e) {
      var g = e.target.closest('[data-go]');
      if (g && ctx.go) ctx.go(g.getAttribute('data-go'));
    });
  }

  function afterTeacherDashboard() {
    var D = global.SRMS_DATA;
    var TP = (D.analytics || {}).teacherPerformance || {};
    C.donut('td-donut', { data:TP.distribution || [], cutout:'70%', legend:false });

    var tr = TP.trend || { labels:[], marks:[], target:[] };
    C.line('td-trend', {
      labels:tr.labels, min:50, max:100, unit:'%', legend:true,
      datasets:[
        { label:'Class Average', data:tr.marks,  color:'#1677E8' },
        { label:'Target',        data:tr.target, color:'#22C55E', fill:false, points:false }
      ]
    });

    var ca = TP.courseAttendance || { labels:[], values:[] };
    C.bar('td-attendance', {
      labels:ca.labels, legend:false, max:100, unit:'%',
      datasets:[{ label:'Attendance', data:ca.values,
        colors: (ca.values || []).map(function (v) { return v >= 90 ? '#22C55E' : v >= 80 ? '#1677E8' : v >= 75 ? '#F59E0B' : '#EF4444'; }) }]
    });
  }

  R.add('dashboard', 'teacher', { title:'Teacher Dashboard', crumbs:['Main','Dashboard'], render:teacherDashboard, afterRender:afterTeacherDashboard });
})(window);
