/* =============================================================================
   SRMS - Admin Dashboard  (js/pages/admin/dashboard.js)
   Institution-wide statistics, student distribution donut, enrollment trend
   line chart, department performance bars and operational summaries.
   ========================================================================== */
(function (global) {
  'use strict';
  var U = global.SRMS_UTIL;
  var UI = global.SRMS_UI;
  var R = global.SRMS_ROUTES;
  var C = global.SRMS_CHARTS;

  function adminDashboard(host, ctx) {
    var D = global.SRMS_DATA;
    var A = D.analytics || {};
    var st = A.adminStats || {};
    var logs = (D.auditLogs || []).slice(0, 6);

    host.innerHTML =
      '<section class="card-hero mb-16">' +
        '<div class="hero-inner">' +
          '<div class="hero-text">' +
            '<h2 class="hero-greet">' + U.greeting() + ', ' + U.esc(D.admins[0].name) + ' <span class="wave">\ud83d\udc4b</span></h2>' +
            '<p class="hero-sub">Institution-wide overview for ' + U.esc(st.activeSemester || 'Fall 2026') + '. Monitor enrolment, faculty performance and system activity at a glance.</p>' +
            '<div class="hero-meta">' +
              '<span class="hero-chip"><i class="fas fa-building-columns"></i> ' + (D.departments || []).length + ' Departments</span>' +
              '<span class="hero-chip"><i class="fas fa-calendar-check"></i> ' + U.esc(st.activeSemester || 'Fall 2026') + '</span>' +
              '<span class="hero-chip"><i class="fas fa-user-shield"></i> Super Administrator</span>' +
            '</div>' +
            '<div class="hero-actions">' +
              '<button class="btn btn-primary" data-go="reports"><i class="fas fa-chart-pie"></i> Open Reports</button>' +
              '<button class="btn btn-outline" data-go="students"><i class="fas fa-user-graduate"></i> Manage Students</button>' +
              '<button class="btn btn-outline" data-go="notices"><i class="fas fa-bullhorn"></i> Publish Notice</button>' +
            '</div>' +
          '</div>' +
          '<div class="hero-art" aria-hidden="true"><i class="fas fa-user-shield"></i></div>' +
        '</div>' +
      '</section>' +

      '<div class="grid grid-stats mb-16">' +
        UI.statCard({ title:'Total Students', value:U.fmtNum(st.totalStudents || 2450), icon:'fa-user-graduate', tone:'blue',
          note:'+' + (st.newAdmissions || 186) + ' admitted this year', trend:{ dir:'up', value:'+7.6%' }, onClick:'ad-students' }) +
        UI.statCard({ title:'Total Teachers', value:st.totalTeachers || 145, icon:'fa-chalkboard-user', tone:'purple',
          note:(D.teachers || []).filter(function (t) { return t.status === 'Active'; }).length + ' active faculty', trend:{ dir:'up', value:'+3' } }) +
        UI.statCard({ title:'Total Courses', value:st.totalCourses || 86, icon:'fa-book-open', tone:'teal',
          note:'Across all departments', trend:{ dir:'up', value:'+5' } }) +
        UI.statCard({ title:'Departments', value:st.totalDepartments || 12, icon:'fa-building-columns', tone:'green',
          note:'6 faculties in operation' }) +
        UI.statCard({ title:'Active Classes', value:st.activeClasses || 64, icon:'fa-chalkboard', tone:'yellow',
          note:'Running in the current semester' }) +
        UI.statCard({ title:'Pending Results', value:st.pendingResults || 18, icon:'fa-hourglass-half', tone:'red',
          note:'Awaiting publication approval', trend:{ dir:'down', value:'-4' } }) +
        UI.statCard({ title:'Average Attendance', value:U.fmtPct(st.averageAttendance || 87), icon:'fa-user-check', tone:'blue',
          note:'University-wide attendance rate' }) +
        UI.statCard({ title:'System Users', value:U.fmtNum(st.systemUsers || 2712), icon:'fa-users-gear', tone:'purple',
          note:'Students, faculty and admins', trend:{ dir:'up', value:'+42' } }) +
      '</div>' +

      '<div class="grid grid-main-side mb-16">' +
        UI.card({ title:'Student Enrollment Trend', icon:'fa-chart-line', subtitle:'Enrolment, faculty and graduation movement across the year',
          actions:'<div class="chart-toggle" id="ad-trend-toggle">' +
            '<button class="active" data-series="students">Students</button>' +
            '<button data-series="teachers">Teachers</button>' +
            '<button data-series="enrollments">Enrollments</button>' +
            '<button data-series="graduations">Graduations</button></div>',
          body:'<div class="chart-box chart-h-340"><canvas id="ad-trend"></canvas></div>' +
            UI.kpiStrip([
              { label:'Current Students', value:U.fmtNum(st.totalStudents || 2450) },
              { label:'New Admissions', value:st.newAdmissions || 186, color:'#22C55E' },
              { label:'Graduates', value:st.graduates || 412, color:'#8B5CF6' },
              { label:'Retention', value:'94.2%', color:'#1557B0' }
            ]) }) +
        UI.card({ title:'Student Distribution', icon:'fa-chart-pie', subtitle:'Students by department',
          body:'<div class="donut-wrap"><canvas id="ad-donut" class="chart-h-280" style="height:280px"></canvas>' +
            '<div class="donut-center"><strong>' + U.fmtNum(st.totalStudents || 2450) + '</strong><span>Students</span></div></div>' +
            '<div id="ad-donut-legend"></div>' }) +
      '</div>' +

      '<div class="grid grid-main-side mb-16">' +
        UI.card({ title:'Department Performance', icon:'fa-chart-column', subtitle:'Average CGPA, attendance and pass rate by department',
          actions:'<div class="chart-toggle" id="ad-perf-toggle">' +
            '<button class="active" data-metric="avgCgpa">Avg CGPA</button>' +
            '<button data-metric="attendance">Attendance</button>' +
            '<button data-metric="passRate">Pass %</button></div>',
          body:'<div class="chart-box chart-h-340"><canvas id="ad-depts"></canvas></div>' }) +
        UI.card({ title:'Recent System Activity', icon:'fa-shield-halved', subtitle:'Latest actions captured in the audit log',
          actions:'<button class="btn btn-ghost btn-sm" data-go="audit">View All</button>',
          body:'<div class="list-simple">' + logs.map(function (l) {
            return '<div class="list-row"><span class="resource-ico badge-' + (l.status === 'Success' ? 'green' : 'red') + '" style="width:36px;height:36px;font-size:13px;border-radius:10px"><i class="fas ' +
              (l.status === 'Success' ? 'fa-check' : 'fa-xmark') + '"></i></span>' +
              '<div class="list-row-main"><strong>' + U.esc(l.action) + '</strong><span>' + U.esc(l.user) + ' \u00b7 ' + U.esc(l.module) + ' \u00b7 ' + U.esc(l.date) + ' ' + U.esc(l.time) + '</span></div>' +
              UI.badge(l.status, l.status === 'Success' ? 'green' : 'red') + '</div>';
          }).join('') + '</div>' }) +
      '</div>' +

      '<div class="grid grid-3 mb-16">' +
        UI.card({ title:'Result Distribution', icon:'fa-square-poll-vertical', subtitle:'Grades awarded university-wide',
          body:'<div class="chart-box chart-h-260"><canvas id="ad-grades"></canvas></div>' }) +
        UI.card({ title:'Exam Outcomes', icon:'fa-file-pen', subtitle:'Pass and fail counts by assessment type',
          body:'<div class="chart-box chart-h-260"><canvas id="ad-exams"></canvas></div>' }) +
        UI.card({ title:'Attendance Analytics', icon:'fa-user-check', subtitle:'Weekly attendance across the institution',
          body:'<div class="chart-box chart-h-260"><canvas id="ad-attendance"></canvas></div>' }) +
      '</div>' +

      '<div class="grid grid-2">' +
        UI.card({ title:'Department Summary', icon:'fa-building-columns', subtitle:'Live department statistics',
          actions:'<button class="btn btn-ghost btn-sm" data-go="departments">Manage</button>',
          body:UI.table({ compact:true, columns:[
            { key:'name', label:'Department', render:function (d) { return '<span class="flex gap-8"><span class="legend-swatch" style="background:' + d.color + '"></span><span class="cell-strong">' + U.esc(d.name) + '</span></span>'; } },
            { key:'students', label:'Students', className:'num', render:function (d) { return U.fmtNum(d.students); } },
            { key:'teachers', label:'Faculty', className:'num' },
            { key:'avgCgpa', label:'Avg CGPA', className:'num', render:function (d) { return '<strong>' + U.fmtGpa(d.avgCgpa) + '</strong>'; } },
            { key:'passRate', label:'Pass %', className:'num', render:function (d) { return UI.progressRow(d.passRate, d.passRate >= 90 ? 'green' : d.passRate >= 85 ? '' : 'yellow'); } }
          ], rows:(D.departments || []) }) +
          UI.dataCards(D.departments || [], function (d) {
            return '<div class="data-card"><div class="data-card-head"><strong>' + U.esc(d.name) + '</strong>' + UI.badge(d.code, 'blue') + '</div>' +
              '<div class="data-card-grid"><div><div class="dc-label">Students</div><div class="dc-value">' + U.fmtNum(d.students) + '</div></div>' +
              '<div><div class="dc-label">Faculty</div><div class="dc-value">' + d.teachers + '</div></div>' +
              '<div><div class="dc-label">Avg CGPA</div><div class="dc-value">' + U.fmtGpa(d.avgCgpa) + '</div></div>' +
              '<div><div class="dc-label">Pass Rate</div><div class="dc-value">' + d.passRate + '%</div></div></div></div>';
          }) }) +
        UI.card({ title:'Quick Administration', icon:'fa-bolt', subtitle:'Common administrative shortcuts',
          body:'<div class="quick-grid">' + [
            ['Students','fa-user-graduate','blue','students'],
            ['Teachers','fa-chalkboard-user','purple','teachers'],
            ['Courses','fa-book-open','teal','courses'],
            ['Departments','fa-building-columns','green','departments'],
            ['Exams','fa-file-pen','red','exams'],
            ['Notices','fa-bullhorn','yellow','notices'],
            ['Reports','fa-chart-pie','purple','reports'],
            ['Audit Logs','fa-shield-halved','blue','audit']
          ].map(function (q) {
            return '<button class="quick-item" data-go="' + q[3] + '"><span class="quick-ico badge-' + q[2] + '" style="border-radius:14px"><i class="fas ' + q[1] + '"></i></span>' +
              '<span class="quick-label">' + q[0] + '</span><small>Open</small></button>';
          }).join('') + '</div>' })
      + '</div>';

    /* -------------------------------------------------- TREND TOGGLING */
    var trendChart = null;
    function drawTrend(series) {
      var ET = A.enrollmentTrend || { labels:[], students:[], teachers:[], enrollments:[], graduations:[] };
      var cfg = {
        students:   { label:'Students',    data:ET.students,    color:'#1677E8' },
        teachers:   { label:'Teachers',    data:ET.teachers,    color:'#8B5CF6' },
        enrollments:{ label:'Enrollments', data:ET.enrollments, color:'#22C55E' },
        graduations:{ label:'Graduations', data:ET.graduations, color:'#F59E0B' }
      }[series] || { label:'Students', data:ET.students, color:'#1677E8' };

      if (trendChart) { try { trendChart.destroy(); } catch (e) {} trendChart = null; }
      trendChart = C.line('ad-trend', { labels:ET.labels, min:0, legend:true, datasets:[cfg] });
    }

    document.getElementById('ad-trend-toggle').addEventListener('click', function (e) {
      var b = e.target.closest('[data-series]');
      if (!b) return;
      U.qsa('#ad-trend-toggle button').forEach(function (x) { x.classList.toggle('active', x === b); });
      drawTrend(b.getAttribute('data-series'));
    });

    var metric = 'avgCgpa';
    function drawDept() {
      var dp = A.departmentPerformance || { labels:[], avgCgpa:[], attendance:[], passRate:[] };
      var colors = ['#1677E8','#8B5CF6','#F59E0B','#14B8A6','#EC4899','#EF4444'];
      C.bar('ad-depts', {
        labels:dp.labels.map(function (l) { return l.length > 18 ? l.split(' ').slice(0, 2).join(' ') : l; }),
        legend:false, max: metric === 'avgCgpa' ? 4 : 100,
        unit: metric === 'avgCgpa' ? '' : '%',
        datasets:[{ label:metric, data:dp[metric] || [], colors:colors }]
      });
    }
    document.getElementById('ad-perf-toggle').addEventListener('click', function (e) {
      var b = e.target.closest('[data-metric]');
      if (!b) return;
      metric = b.getAttribute('data-metric');
      U.qsa('#ad-perf-toggle button').forEach(function (x) { x.classList.toggle('active', x === b); });
      drawDept();
    });

    host.addEventListener('click', function (e) {
      var g = e.target.closest('[data-go]');
      if (g && ctx.go) ctx.go(g.getAttribute('data-go'));
    });

    /* Store chart handles for later redraw */
    window.__srmsAdminTrend = drawTrend;
    window.__srmsAdminDept = drawDept;
  }

  function afterAdminDashboard() {
    var D = global.SRMS_DATA;
    var A = D.analytics || {};

    var dist = A.studentDistribution || [];
    C.donut('ad-donut', { cutout:'72%', legend:false, unit:' students', data:dist.map(function (d) { return { label:d.label, value:d.value, color:d.color }; }) });
    document.getElementById('ad-donut-legend').innerHTML = UI.legendRows(dist);

    if (window.__srmsAdminTrend) window.__srmsAdminTrend('students');
    if (window.__srmsAdminDept) window.__srmsAdminDept();

    var grades = A.resultDistribution || { labels:[], values:[] };
    var gColors = ['#22C55E','#16A34A','#1677E8','#3B82F6','#F59E0B','#D97706','#8B5CF6','#EF4444'];
    C.bar('ad-grades', { labels:grades.labels, legend:false, unit:' results',
      datasets:[{ label:'Results', data:grades.values, colors:gColors }] });

    var ex = A.examAnalytics || { labels:[], pass:[], fail:[] };
    C.bar('ad-exams', { labels:ex.labels, legend:true, unit:' students',
      datasets:[
        { label:'Passed', data:ex.pass, color:'#22C55E' },
        { label:'Failed', data:ex.fail,  color:'#EF4444' }
      ] });

    var att = A.attendanceAnalytics || { labels:[], present:[] };
    C.line('ad-attendance', { labels:att.labels, min:70, max:100, unit:'%', legend:false,
      datasets:[{ label:'Attendance', data:att.present, color:'#14B8A6' }] });
  }

  R.add('dashboard', 'admin', { title:'Admin Dashboard', crumbs:['Main','Dashboard'], render:adminDashboard, afterRender:afterAdminDashboard });
})(window);
