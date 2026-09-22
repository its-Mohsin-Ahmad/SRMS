/* =============================================================================
   SRMS - Admin Reports  (js/pages/admin/reports.js)
   Report catalogue with PDF, Excel and print exports plus supporting charts.
   ========================================================================== */
(function (global) {
  'use strict';
  var U = global.SRMS_UTIL;
  var UI = global.SRMS_UI;
  var R = global.SRMS_ROUTES;
  var C = global.SRMS_CHARTS;

  var REPORTS = [
    { id:'RPT-01', name:'Student Performance Report', desc:'GPA distribution, pass rates and top performers across departments.', icon:'fa-user-graduate', tone:'blue', rows:2450, freq:'Weekly' },
    { id:'RPT-02', name:'Attendance Report', desc:'Attendance percentage per course, section and student cohort.', icon:'fa-user-check', tone:'green', rows:1840, freq:'Daily' },
    { id:'RPT-03', name:'Teacher Performance', desc:'Faculty effectiveness, student ratings and result statistics.', icon:'fa-chalkboard-user', tone:'purple', rows:145, freq:'Monthly' },
    { id:'RPT-04', name:'Course Performance', desc:'Average marks, fail rates and syllabus coverage per course.', icon:'fa-book-open', tone:'teal', rows:86, freq:'Per Semester' },
    { id:'RPT-05', name:'Department Performance', desc:'Cross-department CGPA, attendance and graduation metrics.', icon:'fa-building-columns', tone:'yellow', rows:12, freq:'Per Semester' },
    { id:'RPT-06', name:'Exam Results Report', desc:'Grade distribution and pass/fail analysis for every exam.', icon:'fa-file-pen', tone:'red', rows:1320, freq:'Per Exam' },
    { id:'RPT-07', name:'Enrollment Report', desc:'Admissions, graduations and retention across the academic year.', icon:'fa-chart-line', tone:'blue', rows:2450, freq:'Monthly' }
  ];

  function reportsPage(host, ctx) {
    var D = global.SRMS_DATA;
    var A = D.analytics || {};

    host.innerHTML =
      UI.pageHead({ title:'Reports', subtitle:'Generate, export and print institutional reports for every module.',
        actions:'<button class="btn btn-outline" id="rp-all-pdf"><i class="fas fa-file-pdf"></i> Export All (PDF)</button>' +
                '<button class="btn btn-outline" id="rp-all-xls"><i class="fas fa-file-excel"></i> Export All (Excel)</button>' +
                '<button class="btn btn-primary" id="rp-print"><i class="fas fa-print"></i> Print Dashboard</button>' }) +

      '<div class="grid grid-4 mb-16">' +
        UI.statCard({ title:'Reports Available', value:REPORTS.length, suffix:'reports', icon:'fa-chart-pie', tone:'blue', note:'Ready for generation' }) +
        UI.statCard({ title:'Generated This Month', value:428, icon:'fa-file-circle-check', tone:'green', note:'Across all departments' }) +
        UI.statCard({ title:'Scheduled Exports', value:12, suffix:'automated', icon:'fa-clock', tone:'purple', note:'Daily and weekly jobs' }) +
        UI.statCard({ title:'Data Freshness', value:'Real-time', icon:'fa-database', tone:'teal', note:'Last sync 4 minutes ago' }) +
      '</div>' +

      UI.card({ title:'Report Catalogue', icon:'fa-folder-open', subtitle:'Choose a report and export format', className:'mb-16',
        body:'<div class="grid grid-2">' + REPORTS.map(function (r) {
          return '<div class="card card-hover" style="box-shadow:none"><div class="flex-between mb-12">' +
            '<span class="resource-ico badge-' + r.tone + '" style="width:44px;height:44px;font-size:17px;border-radius:13px"><i class="fas ' + r.icon + '"></i></span>' +
            UI.badge(r.freq, 'gray') + '</div>' +
            '<h3 style="font-size:14.4px">' + U.esc(r.name) + '</h3>' +
            '<p class="text-soft text-sm mt-8" style="line-height:1.6">' + U.esc(r.desc) + '</p>' +
            '<p class="text-mute text-xs mt-8"><i class="fas fa-database"></i> ' + U.fmtNum(r.rows) + ' data rows \u00b7 ' + U.esc(r.id) + '</p>' +
            '<div class="resource-foot">' +
              '<button class="btn btn-outline btn-sm" data-rp-pdf="' + U.esc(r.id) + '"><i class="fas fa-file-pdf"></i> PDF</button>' +
              '<button class="btn btn-outline btn-sm" data-rp-xls="' + U.esc(r.id) + '"><i class="fas fa-file-excel"></i> Excel</button>' +
              '<button class="btn btn-ghost btn-sm" data-rp-print="' + U.esc(r.id) + '"><i class="fas fa-print"></i> Print</button>' +
            '</div></div>';
        }).join('') + '</div>' }) +

      '<div class="grid grid-2">' +
        UI.card({ title:'Department Comparison', icon:'fa-chart-column', subtitle:'Average CGPA across departments',
          body:'<div class="chart-box chart-h-300"><canvas id="rp-chart1"></canvas></div>' }) +
        UI.card({ title:'Result Distribution', icon:'fa-chart-pie', subtitle:'Grades awarded university-wide',
          body:'<div class="chart-box chart-h-300"><canvas id="rp-chart2"></canvas></div>' }) +
      '</div>';

    function exportReport(id, format) {
      var r = REPORTS.filter(function (x) { return x.id === id; })[0] || REPORTS[0];
      if (format === 'print') {
        UI.toast('info', 'Preparing print view', r.name + ' is being prepared for printing.');
        setTimeout(function () { window.print(); }, 450);
        return;
      }
      setTimeout(function () {
        var deptRows = (D.departments || []).map(function (d) { return { Code:d.code, Name:d.name, Students:d.students, Faculty:d.teachers, AvgCGPA:U.fmtGpa(d.avgCgpa), Attendance:d.attendance + '%', PassRate:d.passRate + '%' }; });
        var filename = 'srms-report-' + U.slug(r.name) + '.' + (format === 'xls' ? 'csv' : 'txt');
        if (format === 'xls') U.download(filename, U.toCSV(deptRows, ['Code','Name','Students','Faculty','AvgCGPA','Attendance','PassRate']), 'text/csv');
        else U.download(filename, 'SRMS REPORT EXPORT\r\n==========================\r\nReport: ' + r.name + '\r\nGenerated: ' + U.fmtDateTime(new Date()) + '\r\n\r\n' + deptRows.map(function (d) { return d.Code + ' | ' + d.Name + ' | ' + d.Students + ' students | ' + d.AvgCGPA; }).join('\r\n'));
        UI.toast('success', 'Report ready', r.name + ' exported as ' + filename + '.');
      }, 600);
    }

    host.addEventListener('click', function (e) {
      var pdf = e.target.closest('[data-rp-pdf]');
      if (pdf) { exportReport(pdf.getAttribute('data-rp-pdf'), 'pdf'); return; }
      var xls = e.target.closest('[data-rp-xls]');
      if (xls) { exportReport(xls.getAttribute('data-rp-xls'), 'xls'); return; }
      var pr = e.target.closest('[data-rp-print]');
      if (pr) { exportReport(pr.getAttribute('data-rp-print'), 'print'); }
    });

    document.getElementById('rp-all-pdf').addEventListener('click', function () {
      UI.confirm({ title:'Export all reports?', message:'All ' + REPORTS.length + ' reports will be generated as text exports. This may take a few seconds.', tone:'info', confirmText:'Export All',
        onConfirm:function () {
          REPORTS.forEach(function (r, i) { setTimeout(function () { exportReport(r.id, 'pdf'); }, i * 350); });
        } });
    });
    document.getElementById('rp-all-xls').addEventListener('click', function () {
      exportReport('RPT-01', 'xls');
    });
    document.getElementById('rp-print').addEventListener('click', function () {
      setTimeout(function () { window.print(); }, 380);
    });
  }

  function afterReports() {
    var A = (global.SRMS_DATA.analytics || {});
    var dp = A.departmentPerformance || { labels:[], avgCgpa:[] };
    C.bar('rp-chart1', {
      labels:dp.labels.map(function (l) { return l.split(' ').slice(0, 2).join(' '); }),
      legend:false, max:4, datasets:[{ label:'Avg CGPA', data:dp.avgCgpa, color:'#1677E8' }]
    });
    var grades = A.resultDistribution || { labels:[], values:[] };
    var gColors = ['#22C55E','#16A34A','#1677E8','#3B82F6','#F59E0B','#D97706','#8B5CF6','#EF4444'];
    C.bar('rp-chart2', { labels:grades.labels, legend:false, unit:' results',
      datasets:[{ label:'Results', data:grades.values, colors:gColors }] });
  }

  R.add('reports', 'admin', { title:'Reports', crumbs:['System','Reports'], render:reportsPage, afterRender:afterReports });
})(window);
