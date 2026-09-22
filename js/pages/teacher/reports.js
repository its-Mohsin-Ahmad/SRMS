/* =============================================================================
   SRMS - Teacher Reports  (js/pages/teacher/reports.js)
   Class analytics with radar performance profile, marks charts and exportable
   report generator.
   ========================================================================== */
(function (global) {
  'use strict';
  var U = global.SRMS_UTIL;
  var UI = global.SRMS_UI;
  var R = global.SRMS_ROUTES;
  var C = global.SRMS_CHARTS;

  function reportsPage(host, ctx) {
    var D = global.SRMS_DATA;
    var TP = (D.analytics || {}).teacherPerformance || { marks:{}, summary:{} };
    var m = TP.marks || { labels:[], average:[], highest:[], lowest:[] };
    var s = TP.summary || {};
    var students = D.studentRoster || [];

    host.innerHTML =
      UI.pageHead({ title:'Class Reports', subtitle:'Detailed analytics for your courses with exportable reports.',
        actions:'<button class="btn btn-outline" id="trp-pdf"><i class="fas fa-file-pdf"></i> PDF Report</button>' +
                '<button class="btn btn-outline" id="trp-xls"><i class="fas fa-file-excel"></i> Excel Export</button>' +
                '<button class="btn btn-primary" id="trp-print"><i class="fas fa-print"></i> Print Report</button>' }) +

      '<div class="grid grid-4 mb-16">' +
        UI.statCard({ title:'Average Marks', value:(s.averageMarks || 81) + '%', icon:'fa-chart-simple', tone:'blue', note:'Across all assessments', trend:{ dir:'up', value:'+3%' } }) +
        UI.statCard({ title:'Highest Marks', value:(s.highestMarks || 98) + '%', icon:'fa-trophy', tone:'green', note:'Best student performance' }) +
        UI.statCard({ title:'Lowest Marks', value:(s.lowestMarks || 48) + '%', icon:'fa-arrow-trend-down', tone:'red', note:'Requires remedial support' }) +
        UI.statCard({ title:'Pass Percentage', value:(s.passPercentage || 91) + '%', icon:'fa-arrow-up-right-dots', tone:'purple', note:'Students scoring 50% or above' }) +
      '</div>' +

      '<div class="grid grid-2 mb-16">' +
        UI.card({ title:'Performance Radar', icon:'fa-bullseye', subtitle:'Class average against top and bottom performers',
          body:'<div class="chart-box chart-h-340"><canvas id="trp-radar"></canvas></div>' }) +
        UI.card({ title:'Marks Distribution', icon:'fa-chart-column', subtitle:'Average, highest and lowest marks per course',
          body:'<div class="chart-box chart-h-340"><canvas id="trp-marks"></canvas></div>' }) +
      '</div>' +

      UI.card({ title:'Grade Distribution', icon:'fa-chart-pie', subtitle:'How the class performed across grade bands', className:'mb-16',
        body:'<div class="grid grid-2" style="align-items:center"><div class="donut-wrap"><canvas id="trp-donut" class="chart-h-300"></canvas>' +
          '<div class="donut-center"><strong>' + (s.passPercentage || 91) + '%</strong><span>Pass Rate</span></div></div>' +
          '<div>' + UI.legendRows((TP.distribution || []).map(function (d) { return { label:d.label, value:d.value, color:d.color, count:d.count }; })) + '</div></div>' }) +

      UI.card({ title:'Class Roster Performance', icon:'fa-table-list', subtitle:'Complete performance summary for your students',
        body:UI.table({
          columns:[
            { key:'id', label:'Student ID', render:function (s2) { return '<span class="badge badge-blue">' + U.esc(s2.id) + '</span>'; } },
            { key:'name', label:'Name', render:function (s2) { return '<span class="cell-strong">' + U.esc(s2.name) + '</span>'; } },
            { key:'attendance', label:'Attendance', render:function (s2) { return UI.progressRow(s2.attendance, s2.attendance >= 90 ? 'green' : s2.attendance >= 80 ? '' : s2.attendance >= 75 ? 'yellow' : 'red'); } },
            { key:'cgpa', label:'CGPA', className:'num', render:function (s2) { return U.fmtGpa(s2.cgpa); } },
            { key:'standing', label:'Standing', render:function (s2) {
                var st = s2.cgpa >= 3.5 ? 'Excellent' : s2.cgpa >= 3.0 ? 'Good' : s2.cgpa >= 2.5 ? 'Satisfactory' : 'Needs Improvement';
                return UI.badge(st, s2.cgpa >= 3.5 ? 'green' : s2.cgpa >= 3.0 ? 'blue' : s2.cgpa >= 2.5 ? 'yellow' : 'red');
              } }
          ],
          rows:U.sortBy(students, 'cgpa', 'desc').slice(0, 12)
        }) + UI.dataCards(U.sortBy(students, 'cgpa', 'desc').slice(0, 12), function (s2) {
          return '<div class="data-card"><div class="data-card-head"><strong>' + U.esc(s2.name) + '</strong>' + UI.badge(U.fmtGpa(s2.cgpa), 'green') + '</div>' +
            '<div class="data-card-grid"><div><div class="dc-label">ID</div><div class="dc-value">' + U.esc(s2.id) + '</div></div>' +
            '<div><div class="dc-label">Attendance</div><div class="dc-value">' + s2.attendance + '%</div></div>' +
            '<div><div class="dc-label">Department</div><div class="dc-value">' + U.esc(s2.dept) + '</div></div>' +
            '<div><div class="dc-label">Semester</div><div class="dc-value">' + s2.sem + 'th</div></div></div></div>';
        }) });

    document.getElementById('trp-pdf').addEventListener('click', function () {
      UI.toast('info', 'Generating PDF', 'Your class performance report is being prepared.');
      setTimeout(function () {
        var rows = students.map(function (s2) { return { ID:s2.id, Name:s2.name, Attendance:s2.attendance + '%', CGPA:U.fmtGpa(s2.cgpa) }; });
        U.download('srms-class-report.txt', 'SRMS CLASS PERFORMANCE REPORT\r\n===========================\r\nGenerated: ' + U.fmtDateTime(new Date()) + '\r\n\r\n' +
          rows.map(function (r) { return r.ID + ' | ' + r.Name + ' | ' + r.Attendance + ' | ' + r.CGPA; }).join('\r\n'));
        UI.toast('success', 'Report ready', 'srms-class-report.txt has been downloaded.');
      }, 700);
    });

    document.getElementById('trp-xls').addEventListener('click', function () {
      var rows = students.map(function (s2) { return { ID:s2.id, Name:s2.name, Department:s2.dept, Semester:s2.sem, Attendance:s2.attendance, CGPA:s2.cgpa, Status:s2.status }; });
      U.download('srms-class-report.csv', U.toCSV(rows, ['ID','Name','Department','Semester','Attendance','CGPA','Status']), 'text/csv');
      UI.toast('success', 'Excel export ready', 'srms-class-report.csv saved successfully.');
    });

    document.getElementById('trp-print').addEventListener('click', function () {
      UI.toast('info', 'Preparing print view', 'The print dialog will open shortly.');
      setTimeout(function () { window.print(); }, 400);
    });
  }

  function afterTeacherReports() {
    var D = global.SRMS_DATA;
    var TP = (D.analytics || {}).teacherPerformance || { marks:{}, distribution:[] };
    var m = TP.marks || { labels:[], average:[], highest:[], lowest:[] };

    C.radar('trp-radar', {
      labels:['Attendance','Assignments','Quizzes','Midterm','Final','Participation'],
      max:100,
      datasets:[
        { label:'Class Average', data:[90, 78, 82, 76, 80, 85], color:'#1677E8' },
        { label:'Top Performers', data:[97, 95, 93, 92, 96, 94], color:'#22C55E' },
        { label:'At-Risk Students', data:[72, 48, 55, 42, 50, 60], color:'#EF4444' }
      ]
    });

    C.bar('trp-marks', {
      labels:m.labels, legend:true, max:100, unit:'%',
      datasets:[
        { label:'Average', data:m.average, color:'#1677E8' },
        { label:'Highest', data:m.highest, color:'#22C55E' },
        { label:'Lowest',  data:m.lowest,  color:'#EF4444' }
      ]
    });

    C.donut('trp-donut', { data:TP.distribution || [], cutout:'70%', legend:false });
  }

  R.add('reports', 'teacher', { title:'Class Reports', crumbs:['Exams & Results','Reports'], render:reportsPage, afterRender:afterTeacherReports });
})(window);
