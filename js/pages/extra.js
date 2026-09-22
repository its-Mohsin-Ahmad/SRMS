/* =============================================================================
   SRMS - Supplementary Pages  (js/pages/extra.js)
   Fills remaining route gaps: teacher My Courses, admin Results overview and
   admin Attendance overview.
   ========================================================================== */
(function (global) {
  'use strict';
  var U = global.SRMS_UTIL;
  var UI = global.SRMS_UI;
  var R = global.SRMS_ROUTES;
  var C = global.SRMS_CHARTS;

  /* ------------------------------------------------- TEACHER: MY COURSES */
  function teacherCourses(host, ctx) {
    var D = global.SRMS_DATA;
    var me = D.teachers[0];
    var mine = (D.courses || []).filter(function (c) { return c.teacher === me.name; });

    host.innerHTML =
      UI.pageHead({ title:'My Courses', subtitle:'Courses assigned to you this semester with live class statistics.',
        actions:'<button class="btn btn-outline" id="tc-export"><i class="fas fa-file-export"></i> Export</button>' +
                '<button class="btn btn-primary" data-go="results"><i class="fas fa-square-poll-vertical"></i> Enter Results</button>' }) +

      '<div class="grid grid-4 mb-16">' +
        UI.statCard({ title:'Assigned Courses', value:mine.length, suffix:'courses', icon:'fa-book-open', tone:'blue', note:U.sum(mine, 'credits') + ' credit hours' }) +
        UI.statCard({ title:'Total Students', value:me.students, icon:'fa-users', tone:'purple', note:'Across all sections' }) +
        UI.statCard({ title:'Avg Attendance', value:U.fmtPct(U.avg(mine, 'attendance')), icon:'fa-user-check', tone:'green', note:'Across your courses' }) +
        UI.statCard({ title:'Avg Coverage', value:U.fmtPct(U.avg(mine, 'progress')), icon:'fa-list-check', tone:'teal', note:'Syllabus completion' }) +
      '</div>' +

      (mine.length ? '<div class="grid grid-2">' + mine.map(function (c) {
        return '<article class="card card-hover" data-code="' + U.esc(c.code) + '" style="cursor:pointer">' +
          '<div class="flex-between mb-12"><span class="badge badge-blue">' + U.esc(c.code) + '</span>' + UI.statusBadge(c.status) + '</div>' +
          '<h3 style="font-size:15px">' + U.esc(c.name) + '</h3>' +
          '<p class="text-mute text-xs mt-4">' + c.enrolled + ' students \u00b7 ' + c.credits + ' credits \u00b7 Semester ' + c.semester + ' \u00b7 ' + U.esc(c.room) + '</p>' +
          '<p class="text-soft text-sm mt-8" style="line-height:1.6">' + U.esc(c.description) + '</p>' +
          '<div class="meter mt-12"><div class="meter-top"><strong>Attendance</strong><span>' + c.attendance + '%</span></div>' + UI.progress(c.attendance, 'green') + '</div>' +
          '<div class="meter mt-8"><div class="meter-top"><strong>Syllabus coverage</strong><span>' + c.progress + '%</span></div>' + UI.progress(c.progress, 'purple') + '</div>' +
          '<div class="resource-foot"><button class="btn btn-outline btn-sm" data-go="attendance"><i class="fas fa-user-check"></i> Attendance</button>' +
          '<button class="btn btn-ghost btn-sm" data-go="assignments"><i class="fas fa-clipboard-check"></i> Assignments</button>' +
          '<button class="btn btn-primary btn-sm" data-go="results"><i class="fas fa-pen"></i> Results</button></div></article>';
      }).join('') + '</div>' : UI.emptyState({ icon:'fa-book', title:'No courses assigned', message:'Contact the administration to have courses assigned to you.' }));

    host.addEventListener('click', function (e) {
      var g = e.target.closest('[data-go]');
      if (g && ctx.go) { ctx.go(g.getAttribute('data-go')); return; }
      var c = e.target.closest('[data-code]');
      if (c && !e.target.closest('[data-go]')) UI.toast('info', c.getAttribute('data-code'), 'Course detail view.');
    });

    document.getElementById('tc-export').addEventListener('click', function () {
      U.download('srms-my-courses.csv', U.toCSV(mine.map(function (c) {
        return { Code:c.code, Name:c.name, Credits:c.credits, Semester:c.semester, Students:c.enrolled, Attendance:c.attendance + '%', Progress:c.progress + '%', Status:c.status };
      }), ['Code','Name','Credits','Semester','Students','Attendance','Progress','Status']), 'text/csv');
      UI.toast('success', 'Export complete', mine.length + ' courses exported.');
    });
  }

  /* --------------------------------------------------- ADMIN: RESULTS */
  function adminResults(host, ctx) {
    var D = global.SRMS_DATA;
    var A = D.analytics || {};
    var sems = D.semesterResults || [];
    var latest = sems[0] || { courses:[], label:'--', gpa:0, status:'' };
    var dist = A.resultDistribution || { labels:[], values:[] };
    var pending = (D.analytics || {}).adminStats ? (D.analytics.adminStats.pendingResults || 18) : 18;

    host.innerHTML =
      UI.pageHead({ title:'Results Management', subtitle:'Institution-wide result publication, approval and distribution control.',
        actions:'<button class="btn btn-outline" id="ar-export"><i class="fas fa-file-export"></i> Export Results</button>' +
                '<button class="btn btn-primary" id="ar-publish"><i class="fas fa-cloud-arrow-up"></i> Approve Pending</button>' }) +

      '<div class="grid grid-4 mb-16">' +
        UI.statCard({ title:'Pending Approval', value:pending, suffix:'submissions', icon:'fa-hourglass-half', tone:'red', note:'Awaiting registrar sign-off' }) +
        UI.statCard({ title:'Published This Semester', value:latest.courses.length, suffix:'courses', icon:'fa-circle-check', tone:'green', note:U.esc(latest.label) }) +
        UI.statCard({ title:'University CGPA', value:U.fmtGpa(U.avg(D.departments || [], 'avgCgpa')), suffix:'/ 4.00', icon:'fa-award', tone:'blue', note:'Weighted departmental average' }) +
        UI.statCard({ title:'Grades Awarded', value:U.sum(dist.values || []), suffix:'results', icon:'fa-square-poll-vertical', tone:'purple', note:'Across all courses' }) +
      '</div>' +

      '<div class="grid grid-main-side mb-16">' +
        UI.card({ title:'Grade Distribution', icon:'fa-chart-column', subtitle:'Grades awarded across the university',
          body:'<div class="chart-box chart-h-340"><canvas id="ar-grades"></canvas></div>' }) +
        UI.card({ title:'Department Averages', icon:'fa-chart-pie', subtitle:'Mean CGPA per department',
          body:'<div class="donut-wrap"><canvas id="ar-depts" class="chart-h-280" style="height:280px"></canvas>' +
            '<div class="donut-center"><strong>' + U.fmtGpa(U.avg(D.departments || [], 'avgCgpa')) + '</strong><span>Avg CGPA</span></div></div>' +
            '<div id="ar-legend"></div>' }) +
      '</div>' +

      UI.card({ title:'Latest Semester Results', icon:'fa-table-list', subtitle:'Published marks for the most recent semester',
        body:UI.table({
          columns:[
            { key:'code', label:'Course Code', render:function (c) { return '<span class="badge badge-blue">' + U.esc(c.code) + '</span>'; } },
            { key:'name', label:'Course', render:function (c) { return '<span class="cell-strong">' + U.esc(c.name) + '</span>'; } },
            { key:'credits', label:'Credits', className:'center' },
            { key:'marks', label:'Class Average', className:'num', render:function (c) { return c.marks + '%'; } },
            { key:'grade', label:'Reference Grade', className:'center', render:function (c) { return UI.gradePill(c.grade); } },
            { key:'gp', label:'Grade Point', className:'num', render:function (c) { return c.gp.toFixed(2); } },
            { key:'status', label:'Status', render:function (c) { return UI.statusBadge(c.status); } }
          ],
          rows:latest.courses
        }) + UI.dataCards(latest.courses, function (c) {
          return '<div class="data-card"><div class="data-card-head"><strong>' + U.esc(c.name) + '</strong>' + UI.gradePill(c.grade) + '</div>' +
            '<div class="data-card-grid"><div><div class="dc-label">Code</div><div class="dc-value">' + U.esc(c.code) + '</div></div>' +
            '<div><div class="dc-label">Credits</div><div class="dc-value">' + c.credits + '</div></div>' +
            '<div><div class="dc-label">Average</div><div class="dc-value">' + c.marks + '%</div></div>' +
            '<div><div class="dc-label">Grade Point</div><div class="dc-value">' + c.gp.toFixed(2) + '</div></div></div></div>';
        }) });

    var colors = ['#22C55E','#16A34A','#1677E8','#3B82F6','#F59E0B','#D97706','#8B5CF6','#EF4444'];
    C.bar('ar-grades', { labels:dist.labels || [], legend:false, unit:' results',
      datasets:[{ label:'Results', data:dist.values || [], colors:colors }] });

    var depts = (D.departments || []).map(function (d) { return { label:d.code, value:Number(U.fmtGpa(d.avgCgpa)), color:d.color }; });
    C.donut('ar-depts', { cutout:'72%', legend:false, data:depts });
    document.getElementById('ar-legend').innerHTML = UI.legendRows((D.departments || []).map(function (d) { return { label:d.name, value:d.students, color:d.color }; }));

    document.getElementById('ar-export').addEventListener('click', function () {
      U.download('srms-results-admin.csv', U.toCSV(latest.courses.map(function (c) {
        return { Code:c.code, Course:c.name, Credits:c.credits, Average:c.marks + '%', Grade:c.grade, GradePoint:c.gp.toFixed(2), Status:c.status };
      }), ['Code','Course','Credits','Average','Grade','GradePoint','Status']), 'text/csv');
      UI.toast('success', 'Export complete', latest.courses.length + ' result rows exported.');
    });

    document.getElementById('ar-publish').addEventListener('click', function () {
      UI.confirm({ title:'Approve all pending results?', message:pending + ' result submissions will be published and visible to students immediately. This action is recorded in the audit log.', tone:'warning', confirmText:'Approve & Publish',
        onConfirm:function () {
          if ((D.analytics || {}).adminStats) D.analytics.adminStats.pendingResults = 0;
          UI.toast('success', 'Results published', pending + ' submissions approved and published to students.');
          R.reRender({ role:ctx.role, user:ctx.user, go:ctx.go });
        } });
    });
  }

  /* ------------------------------------------------ ADMIN: ATTENDANCE */
  function adminAttendance(host, ctx) {
    var D = global.SRMS_DATA;
    var A = D.analytics || {};
    var aa = A.attendanceAnalytics || { labels:[], present:[], absent:[], late:[] };
    var risky = (D.studentRoster || []).filter(function (s) { return s.attendance < 75; });
    var sum = D.attendanceSummary || { percentage:87, present:392, absent:44, late:18, excused:11, total:465, required:75 };

    host.innerHTML =
      UI.pageHead({ title:'Attendance Management', subtitle:'Institution-wide attendance monitoring and compliance enforcement.',
        actions:'<button class="btn btn-outline" id="aa-export"><i class="fas fa-file-export"></i> Export Report</button>' +
                '<button class="btn btn-primary" id="aa-notify"><i class="fas fa-bell"></i> Notify At-Risk Students</button>' }) +

      '<div class="grid grid-4 mb-16">' +
        UI.statCard({ title:'Average Attendance', value:U.fmtPct(sum.percentage), icon:'fa-user-check', tone:'blue', note:sum.present + ' of ' + sum.total + ' class sessions', trend:{ dir:'up', value:'+1.2%' } }) +
        UI.statCard({ title:'Below Requirement', value:risky.length, suffix:'students', icon:'fa-triangle-exclamation', tone:'red', note:'Under the ' + sum.required + '% threshold' }) +
        UI.statCard({ title:'Excused Absences', value:sum.excused, suffix:'approved', icon:'fa-file-shield', tone:'purple', note:'Medical and official leave' }) +
        UI.statCard({ title:'Late Arrivals', value:sum.late, suffix:'sessions', icon:'fa-clock', tone:'yellow', note:'Across all departments' }) +
      '</div>' +

      '<div class="grid grid-main-side mb-16">' +
        UI.card({ title:'Weekly Attendance Trend', icon:'fa-chart-area', subtitle:'Present, absent and late percentages',
          body:'<div class="chart-box chart-h-340"><canvas id="aa-trend"></canvas></div>' }) +
        UI.card({ title:'Department Attendance', icon:'fa-building-columns', subtitle:'Average attendance rate per department',
          body:'<div class="meter-list">' + (D.departments || []).map(function (d) {
            return '<div class="meter"><div class="meter-top"><strong>' + U.esc(d.name) + '</strong><span>' + d.attendance + '%</span></div>' +
              UI.progress(d.attendance, d.attendance >= 88 ? 'green' : d.attendance >= 84 ? '' : 'yellow') + '</div>';
          }).join('') + '</div>' }) +
      '</div>' +

      UI.card({ title:'Students Below Requirement', icon:'fa-user-clock', subtitle:'Students requiring attendance intervention',
        body: risky.length ? UI.table({
          columns:[
            { key:'id', label:'Student ID', render:function (s) { return '<span class="badge badge-blue">' + U.esc(s.id) + '</span>'; } },
            { key:'name', label:'Name', render:function (s) { return '<div class="flex gap-8">' + UI.avatar(s.name, 'xs') + '<span class="cell-strong">' + U.esc(s.name) + '</span></div>'; } },
            { key:'dept', label:'Department' },
            { key:'sem', label:'Semester', className:'center', render:function (s) { return s.sem + 'th'; } },
            { key:'attendance', label:'Attendance', render:function (s) { return UI.progressRow(s.attendance, 'red'); } },
            { key:'status', label:'Status', render:function (s) { return UI.statusBadge(s.status); } }
          ],
          rows:risky
        }) + UI.dataCards(risky, function (s) {
          return '<div class="data-card"><div class="data-card-head"><strong>' + U.esc(s.name) + '</strong>' + UI.badge(s.attendance + '%', 'red') + '</div>' +
            '<div class="data-card-grid"><div><div class="dc-label">ID</div><div class="dc-value">' + U.esc(s.id) + '</div></div>' +
            '<div><div class="dc-label">Department</div><div class="dc-value">' + U.esc(s.dept) + '</div></div>' +
            '<div><div class="dc-label">Semester</div><div class="dc-value">' + s.sem + 'th</div></div>' +
            '<div><div class="dc-label">Status</div><div class="dc-value">' + U.esc(s.status) + '</div></div></div></div>';
        }) : UI.emptyState({ icon:'fa-circle-check', title:'All students compliant', message:'Every student meets the minimum attendance requirement.' }) }) ;

    C.line('aa-trend', {
      labels:aa.labels || [], min:0, max:100, unit:'%', legend:true,
      datasets:[
        { label:'Present', data:aa.present || [], color:'#22C55E' },
        { label:'Absent',  data:aa.absent  || [], color:'#EF4444' },
        { label:'Late',    data:aa.late    || [], color:'#F59E0B' }
      ]
    });

    document.getElementById('aa-export').addEventListener('click', function () {
      U.download('srms-attendance-compliance.csv', U.toCSV((D.studentRoster || []).map(function (s) {
        return { ID:s.id, Name:s.name, Department:s.dept, Semester:s.sem, Attendance:s.attendance + '%', Status:s.status, Compliant: s.attendance >= 75 ? 'Yes' : 'No' };
      }), ['ID','Name','Department','Semester','Attendance','Status','Compliant']), 'text/csv');
      UI.toast('success', 'Export complete', 'Attendance compliance report exported.');
    });

    document.getElementById('aa-notify').addEventListener('click', function () {
      UI.confirm({ title:'Notify at-risk students?', message:risky.length + ' students and their advisors will receive attendance warning notifications.', tone:'warning', confirmText:'Send Notifications',
        onConfirm:function () { UI.toast('success', 'Notifications sent', risky.length + ' attendance warnings dispatched successfully.'); } });
    });
  }

  R.add('courses', 'teacher', { title:'My Courses', crumbs:['Teaching','My Courses'], render:teacherCourses });
  R.add('results', 'admin', { title:'Results Management', crumbs:['Academic','Results'], render:adminResults });
  R.add('attendance', 'admin', { title:'Attendance Management', crumbs:['Academic','Attendance'], render:adminAttendance });
})(window);
