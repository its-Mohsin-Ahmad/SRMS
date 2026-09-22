/* =============================================================================
   SRMS - Courses Page  (js/pages/student/courses.js)
   Search, filter, sort, grid/table views and a full course detail modal with
   overview, syllabus, assignments, resources, attendance and results tabs.
   ========================================================================== */
(function (global) {
  'use strict';
  var U = global.SRMS_UTIL;
  var UI = global.SRMS_UI;
  var R = global.SRMS_ROUTES;
  var C = global.SRMS_CHARTS;

  var view = { q:'', dept:'All', semester:'All', status:'All', sort:'code', dir:'asc', mode:'grid', page:1, per:9 };

  function filtered() {
    var D = global.SRMS_DATA;
    var list = (D.courses || []).slice();
    if (view.q) {
      var q = view.q.toLowerCase();
      list = list.filter(function (c) {
        return (c.name + ' ' + c.code + ' ' + c.teacher + ' ' + c.dept).toLowerCase().indexOf(q) > -1;
      });
    }
    if (view.dept !== 'All') list = list.filter(function (c) { return c.dept === view.dept; });
    if (view.semester !== 'All') list = list.filter(function (c) { return String(c.semester) === String(view.semester); });
    if (view.status !== 'All') list = list.filter(function (c) { return c.status === view.status; });
    return U.sortBy(list, view.sort, view.dir);
  }

  function courseCard(c) {
    var tone = c.attendance >= 90 ? 'green' : c.attendance >= 80 ? 'blue' : c.attendance >= 75 ? 'yellow' : 'red';
    return '<article class="card card-hover" data-course="' + U.esc(c.code) + '" style="cursor:pointer">' +
      '<div class="flex-between mb-12">' +
        '<span class="badge badge-blue" style="font-size:12px">' + U.esc(c.code) + '</span>' +
        UI.statusBadge(c.status) +
      '</div>' +
      '<h3 style="font-size:15px;line-height:1.35;margin-bottom:6px">' + U.esc(c.name) + '</h3>' +
      '<p class="text-soft text-sm mb-12"><i class="fas fa-user-tie"></i> ' + U.esc(c.teacher) + '</p>' +
      '<div class="resource-meta mb-12">' +
        '<div><span>Credits</span><strong>' + c.credits + ' Credit' + (c.credits > 1 ? 's' : '') + '</strong></div>' +
        '<div><span>Semester</span><strong>' + (c.semester === 1 ? '1st' : c.semester === 2 ? '2nd' : c.semester === 3 ? '3rd' : c.semester + 'th') + ' Semester</strong></div>' +
        '<div><span>Enrolled</span><strong>' + c.enrolled + ' students</strong></div>' +
      '</div>' +
      '<div class="meter"><div class="meter-top"><strong>Attendance</strong><span>' + c.attendance + '%</span></div>' + UI.progress(c.attendance, tone) + '</div>' +
      '<div class="meter mt-12"><div class="meter-top"><strong>Course progress</strong><span>' + c.progress + '%</span></div>' + UI.progress(c.progress, 'purple') + '</div>' +
      '<div class="resource-foot"><button class="btn btn-outline btn-sm" data-course-detail="' + U.esc(c.code) + '"><i class="fas fa-eye"></i> Details</button>' +
      '<button class="btn btn-ghost btn-sm" data-course-materials="' + U.esc(c.code) + '"><i class="fas fa-folder-open"></i> Materials</button></div>' +
    '</article>';
  }

  function coursesPage(host, ctx) {
    var D = global.SRMS_DATA;
    var depts = U.unique((D.courses || []).map(function (c) { return c.dept; }));

    var totalCredits = U.sum(D.courses || [], 'credits');
    var activeCount = (D.courses || []).filter(function (c) { return c.status === 'Active'; }).length;
    var avgAtt = U.avg(D.courses || [], 'attendance');
    var avgProgress = U.avg(D.courses || [], 'progress');

    host.innerHTML =
      UI.pageHead({ title:'My Courses', subtitle:'All courses you are enrolled in this semester, with live attendance and progress tracking.',
        actions:'<button class="btn btn-outline" id="cs-export"><i class="fas fa-file-export"></i> Export List</button>' +
                '<button class="btn btn-primary" id="cs-materials"><i class="fas fa-folder-open"></i> Course Materials</button>' }) +

      '<div class="grid grid-4 mb-16">' +
        UI.statCard({ title:'Enrolled Courses', value:D.courses.length, suffix:'total', icon:'fa-book-open', tone:'blue', note:activeCount + ' currently active' }) +
        UI.statCard({ title:'Credit Hours', value:totalCredits, suffix:'credits', icon:'fa-clock', tone:'purple', note:'Across all semesters' }) +
        UI.statCard({ title:'Average Attendance', value:U.fmtPct(avgAtt), icon:'fa-user-check', tone:'green', note:'Minimum required is 75%' }) +
        UI.statCard({ title:'Syllabus Coverage', value:U.fmtPct(avgProgress), icon:'fa-list-check', tone:'yellow', note:'Average across courses' }) +
      '</div>' +

      '<div class="card card-flush">' +
        '<div class="table-toolbar" style="padding:18px 20px 0">' +
          '<div class="table-tools">' +
            UI.searchBox('cs-search', 'Search courses, codes or instructors...', view.q) +
            UI.selectBox('cs-dept', [{ value:'All', label:'All Departments' }].concat(depts.map(function (d) { return { value:d, label:d }; })), view.dept, 'Filter by department') +
            UI.selectBox('cs-sem', [{ value:'All', label:'All Semesters' }].concat([1,2,3,5,7].map(function (s) { return { value:s, label:s + 'th Semester' }; })), view.semester, 'Filter by semester') +
            UI.selectBox('cs-status', ['All','Active','Completed'], view.status, 'Filter by status') +
            UI.selectBox('cs-sort', [
              { value:'code', label:'Sort: Course Code' }, { value:'name', label:'Sort: Course Name' },
              { value:'attendance', label:'Sort: Attendance' }, { value:'progress', label:'Sort: Progress' },
              { value:'credits', label:'Sort: Credits' }
            ], view.sort, 'Sort courses') +
          '</div>' +
          '<div class="chart-toggle" id="cs-view">' +
            '<button class="active" data-mode="grid"><i class="fas fa-table-cells-large"></i> Grid</button>' +
            '<button data-mode="table"><i class="fas fa-list"></i> Table</button>' +
          '</div>' +
        '</div>' +
        '<div style="padding:18px 20px 20px" id="cs-body"></div>' +
      '</div>';

    function renderBody() {
      var list = filtered();
      var body = document.getElementById('cs-body');

      if (!list.length) {
        body.innerHTML = UI.emptyState({ icon:'fa-book-open-reader', title:'No courses match your filters', message:'Try adjusting the search term or clearing the filters to see all enrolled courses.',
          action:'Clear Filters', actionId:'cs-clear', actionIcon:'fa-rotate-left' });
        var clr = document.getElementById('cs-clear');
        if (clr) clr.addEventListener('click', function () {
          view.q = ''; view.dept = 'All'; view.semester = 'All'; view.status = 'All'; view.page = 1;
          document.getElementById('cs-search').value = '';
          document.getElementById('cs-dept').value = 'All';
          document.getElementById('cs-sem').value = 'All';
          document.getElementById('cs-status').value = 'All';
          renderBody();
        });
        return;
      }

      if (view.mode === 'grid') {
        var info = U.paginate(list, view.page, view.per);
        body.innerHTML = '<div class="resource-grid">' + info.items.map(courseCard).join('') + '</div>' + UI.pagination(info);
      } else {
        var cols = [
          { key:'code', label:'Code', render:function (c) { return '<span class="badge badge-blue">' + U.esc(c.code) + '</span>'; } },
          { key:'name', label:'Course Name', render:function (c) { return '<span class="cell-strong">' + U.esc(c.name) + '</span>'; } },
          { key:'teacher', label:'Instructor' },
          { key:'credits', label:'Credits', className:'center' },
          { key:'semester', label:'Semester', className:'center', render:function (c) { return c.semester + 'th'; } },
          { key:'attendance', label:'Attendance', render:function (c) { return UI.progressRow(c.attendance); } },
          { key:'progress', label:'Progress', render:function (c) { return UI.progressRow(c.progress, 'purple'); } },
          { key:'status', label:'Status', render:function (c) { return UI.statusBadge(c.status); } },
          { key:'actions', label:'', sortable:false, render:function (c) {
              return '<div class="action-group">' +
                '<button class="icon-action" data-course-detail="' + U.esc(c.code) + '" title="View details" aria-label="View details"><i class="fas fa-eye"></i></button>' +
                '<button class="icon-action" data-course-materials="' + U.esc(c.code) + '" title="Materials" aria-label="Course materials"><i class="fas fa-folder-open"></i></button></div>';
            } }
        ];
        body.innerHTML = '<div class="table-wrap"><table class="table"><thead><tr>' + cols.map(function (c) { return '<th>' + c.label + '</th>'; }).join('') + '</tr></thead><tbody>' +
          list.map(function (c) { return '<tr>' + cols.map(function (col) { return '<td class="' + (col.className || '') + '">' + (col.render ? col.render(c) : U.esc(c[col.key])) + '</td>'; }).join('') + '</tr>'; }).join('') +
          '</tbody></table></div>' +
          UI.dataCards(list, function (c) {
            return '<div class="data-card"><div class="data-card-head"><strong>' + U.esc(c.name) + '</strong>' + UI.statusBadge(c.status) + '</div>' +
              '<div class="data-card-grid"><div><div class="dc-label">Code</div><div class="dc-value">' + U.esc(c.code) + '</div></div>' +
              '<div><div class="dc-label">Instructor</div><div class="dc-value">' + U.esc(c.teacher) + '</div></div>' +
              '<div><div class="dc-label">Credits</div><div class="dc-value">' + c.credits + '</div></div>' +
              '<div><div class="dc-label">Attendance</div><div class="dc-value">' + c.attendance + '%</div></div></div>' +
              '<button class="btn btn-outline btn-sm btn-block" data-course-detail="' + U.esc(c.code) + '"><i class="fas fa-eye"></i> View Details</button></div>';
          });
      }
    }

    /* ------------------------------------------------------------- WIRING */
    var si = document.getElementById('cs-search');
    si.addEventListener('input', U.debounce(function () { view.q = si.value; view.page = 1; renderBody(); }, 200));
    document.getElementById('cs-dept').addEventListener('change', function () { view.dept = this.value; view.page = 1; renderBody(); });
    document.getElementById('cs-sem').addEventListener('change', function () { view.semester = this.value; view.page = 1; renderBody(); });
    document.getElementById('cs-status').addEventListener('change', function () { view.status = this.value; view.page = 1; renderBody(); });
    document.getElementById('cs-sort').addEventListener('change', function () { view.sort = this.value; renderBody(); });

    document.getElementById('cs-view').addEventListener('click', function (e) {
      var b = e.target.closest('[data-mode]');
      if (!b) return;
      view.mode = b.getAttribute('data-mode'); view.page = 1;
      U.qsa('#cs-view button').forEach(function (x) { x.classList.toggle('active', x === b); });
      renderBody();
    });

    document.getElementById('cs-body').addEventListener('click', function (e) {
      var p = e.target.closest('[data-page]');
      if (p) { view.page = Number(p.getAttribute('data-page')); renderBody(); window.scrollTo({ top:0, behavior:'smooth' }); return; }
      var card = e.target.closest('[data-course]');
      var btn = e.target.closest('[data-course-detail]');
      if (btn) { openDetail(btn.getAttribute('data-course-detail')); return; }
      var mat = e.target.closest('[data-course-materials]');
      if (mat) { UI.toast('info', 'Course materials', 'Opening the resource folder for ' + mat.getAttribute('data-course-materials') + '.'); return; }
      if (card) openDetail(card.getAttribute('data-course'));
    });

    document.getElementById('cs-export').addEventListener('click', function () {
      var list = filtered();
      var rows = list.map(function (c) { return { Code:c.code, Course:c.name, Instructor:c.teacher, Credits:c.credits, Semester:c.semester, Attendance:c.attendance + '%', Progress:c.progress + '%', Status:c.status }; });
      U.download('srms-courses.csv', U.toCSV(rows, ['Code','Course','Instructor','Credits','Semester','Attendance','Progress','Status']), 'text/csv');
      UI.toast('success', 'Export complete', list.length + ' courses exported to srms-courses.csv.');
    });

    document.getElementById('cs-materials').addEventListener('click', function () {
      if (ctx.go) ctx.go('downloads');
    });

    renderBody();
  }

  /* -------------------------------------------------------- COURSE DETAIL */
  function openDetail(code) {
    var D = global.SRMS_DATA;
    var c = (D.courses || []).filter(function (x) { return x.code === code; })[0];
    if (!c) { UI.toast('error', 'Course not found', 'That course code is not in your enrolment list.'); return; }

    var assignments = (D.assignments || []).filter(function (a) { return a.code === c.code; });
    var attendance = (D.subjectAttendance || []).filter(function (a) { return a.code === c.code; })[0];
    var result = null;
    (D.semesterResults || []).forEach(function (s) {
      s.courses.forEach(function (x) { if (x.code === c.code) result = x; });
    });

    var resources = [
      { name:'Lecture Slides (Week 1-12)', size:'18.4 MB', icon:'fa-file-powerpoint', tone:'orange' },
      { name:'Reference Book Extract',     size:'6.2 MB',  icon:'fa-file-pdf', tone:'red' },
      { name:'Lab Manual',                 size:'2.1 MB',  icon:'fa-flask', tone:'teal' },
      { name:'Past Papers Bundle',         size:'4.8 MB',  icon:'fa-file-zipper', tone:'purple' },
      { name:'Data Set for Exercises',     size:'1.2 MB',  icon:'fa-database', tone:'blue' }
    ];

    var tabsHtml = UI.tabs('course-tabs', [
      { key:'overview', label:'Overview', icon:'fa-circle-info', content:
        '<div class="grid grid-2">' +
          '<div>' + UI.card({ title:'Course Description', body:'<p class="text-soft" style="line-height:1.75">' + U.esc(c.description) + '</p>' }) + '</div>' +
          '<div class="grid" style="gap:16px">' +
            UI.card({ title:'Quick Facts', body:'<dl class="info-grid">' +
              '<div class="info-item"><dt>Course Code</dt><dd>' + U.esc(c.code) + '</dd></div>' +
              '<div class="info-item"><dt>Credit Hours</dt><dd>' + c.credits + '</dd></div>' +
              '<div class="info-item"><dt>Department</dt><dd>' + U.esc(c.dept) + '</dd></div>' +
              '<div class="info-item"><dt>Semester</dt><dd>' + c.semester + 'th Semester</dd></div>' +
              '<div class="info-item"><dt>Section</dt><dd>' + U.esc(c.section) + '</dd></div>' +
              '<div class="info-item"><dt>Status</dt><dd>' + U.esc(c.status) + '</dd></div>' +
            '</dl>' }) +
          '</div>' +
        '</div>' +
        '<div class="kpi-strip"><div class="kpi-cell"><div class="kpi-label">Attendance</div><div class="kpi-val">' + c.attendance + '%</div></div>' +
        '<div class="kpi-cell"><div class="kpi-label">Progress</div><div class="kpi-val">' + c.progress + '%</div></div>' +
        '<div class="kpi-cell"><div class="kpi-label">Enrolled</div><div class="kpi-val">' + c.enrolled + '</div></div>' +
        '<div class="kpi-cell"><div class="kpi-label">Credits</div><div class="kpi-val">' + c.credits + '</div></div></div>' },

      { key:'instructor', label:'Instructor', icon:'fa-user-tie', content:
        '<div class="flex gap-16 flex-wrap">' + UI.avatar(c.teacher, 'xl') +
        '<div style="flex:1;min-width:220px"><h3>' + U.esc(c.teacher) + '</h3>' +
        '<p class="text-soft text-sm mt-4">Course Instructor \u00b7 ' + U.esc(c.dept) + '</p>' +
        '<dl class="info-grid mt-16">' +
          '<div class="info-item"><dt>Email</dt><dd>' + U.esc(U.slug(c.teacher) + '@university.edu') + '</dd></div>' +
          '<div class="info-item"><dt>Office</dt><dd>Faculty Block B, Room 214</dd></div>' +
          '<div class="info-item"><dt>Consultation</dt><dd>Mon &amp; Thu, 02:00 - 04:00 PM</dd></div>' +
          '<div class="info-item"><dt>Experience</dt><dd>12+ years</dd></div>' +
        '</dl>' +
        '<div class="form-actions"><button class="btn btn-primary btn-sm" data-msg-teacher="' + U.esc(c.teacher) + '"><i class="fas fa-comment-dots"></i> Send Message</button>' +
        '<button class="btn btn-outline btn-sm" data-msg-teacher="' + U.esc(c.teacher) + '"><i class="fas fa-calendar-check"></i> Request Meeting</button></div></div></div>' },

      { key:'schedule', label:'Schedule', icon:'fa-calendar-week', content:
        '<div class="table-wrap"><table class="table"><thead><tr><th>Day</th><th>Time</th><th>Room</th><th>Type</th></tr></thead><tbody>' +
        [['Monday','09:00 - 10:30','Lab C-12','Lecture'],['Wednesday','09:00 - 10:30','Lab C-12','Lecture'],['Friday','11:00 - 12:30','Lab C-04','Lab Session']]
          .map(function (r) { return '<tr><td class="cell-strong">' + r[0] + '</td><td>' + r[1] + '</td><td>' + r[2] + '</td><td>' + UI.badge(r[3], r[3] === 'Lab Session' ? 'purple' : 'blue') + '</td></tr>'; }).join('') +
        '</tbody></table></div><p class="helper-text mt-12"><i class="fas fa-circle-info"></i> ' + U.esc(c.schedule) + ' \u00b7 ' + U.esc(c.room) + '</p>' },

      { key:'syllabus', label:'Syllabus', icon:'fa-list-ol', content:
        '<div class="timeline">' + (c.syllabus || []).map(function (s, i) {
          var done = ((i + 1) / c.syllabus.length) * 100 <= c.progress;
          return '<div class="timeline-item"><span class="timeline-dot' + (done ? ' green' : '') + '"></span>' +
            '<div class="timeline-content"><strong>Unit ' + (i + 1) + ': ' + U.esc(s) + '</strong>' +
            '<p>' + (done ? 'Covered in class' : 'Scheduled for upcoming weeks') + '</p></div></div>';
        }).join('') + '</div>' },

      { key:'assignments', label:'Assignments', icon:'fa-clipboard-check', count:assignments.length, content: assignments.length ?
        '<div class="table-wrap"><table class="table"><thead><tr><th>Title</th><th>Assigned</th><th>Due</th><th>Marks</th><th>Status</th><th></th></tr></thead><tbody>' +
        assignments.map(function (a) {
          return '<tr><td class="cell-strong">' + U.esc(a.title) + '</td><td class="cell-mute">' + U.fmtDate(a.assigned) + '</td>' +
            '<td class="cell-mute">' + U.fmtDate(a.due) + '</td><td>' + (a.marks === null ? '<span class="text-mute">--</span>' : a.marks + ' / ' + a.total) + '</td>' +
            '<td>' + UI.statusBadge(a.status) + '</td><td><button class="btn btn-outline btn-xs"><i class="fas fa-download"></i></button></td></tr>';
        }).join('') + '</tbody></table></div>' : UI.emptyState({ small:true, icon:'fa-clipboard', title:'No assignments', message:'No assignments have been posted for this course.' }) },

      { key:'resources', label:'Resources', icon:'fa-folder-open', content:
        '<div class="resource-grid">' + resources.map(function (r) {
          return '<div class="file-card"><span class="file-ico badge-' + (r.tone === 'orange' ? 'yellow' : r.tone) + '"><i class="fas ' + r.icon + '"></i></span>' +
            '<span class="file-info"><strong>' + U.esc(r.name) + '</strong><span>' + r.size + ' \u00b7 PDF</span></span>' +
            '<button class="icon-action" data-dl="' + U.esc(r.name) + '" aria-label="Download"><i class="fas fa-download"></i></button></div>';
        }).join('') + '</div>' },

      { key:'attendance', label:'Attendance', icon:'fa-user-check', content:
        (attendance ?
          '<div class="grid grid-2"><div>' + UI.card({ title:'Attendance Breakdown', body:UI.meterList([
            { label:'Present', value:attendance.present + ' classes', percent:(attendance.present / attendance.held) * 100, tone:'green' },
            { label:'Absent',  value:attendance.absent + ' classes',  percent:(attendance.absent / attendance.held) * 100, tone:'red' },
            { label:'Late',    value:attendance.late + ' classes',    percent:(attendance.late / attendance.held) * 100, tone:'yellow' },
            { label:'Excused', value:attendance.excused + ' classes', percent:(attendance.excused / attendance.held) * 100, tone:'' }
          ]) }) + '</div>' +
          '<div>' + UI.card({ title:'Summary', body:'<div class="donut-wrap"><canvas id="course-att-donut" class="chart-h-240"></canvas>' +
            '<div class="donut-center"><strong>' + attendance.percentage + '%</strong><span>Attendance</span></div></div>' +
            '<div class="alert alert-' + (attendance.percentage >= 75 ? 'success' : 'danger') + ' mt-16"><i class="fas ' + (attendance.percentage >= 75 ? 'fa-circle-check' : 'fa-triangle-exclamation') + ' alert-ico"></i>' +
            '<div class="alert-body">' + (attendance.percentage >= 75 ? 'You meet the minimum 75 percent attendance requirement for this course.' : 'Below the 75 percent requirement. Attend remaining classes to become exam eligible.') + '</div></div></div>' }) + '</div>'
          : UI.emptyState({ small:true, icon:'fa-calendar-xmark', title:'No attendance records', message:'Attendance has not been recorded for this course yet.' })) },

      { key:'results', label:'Results', icon:'fa-chart-line', content:
        (result ?
          '<div class="grid grid-2"><div>' + UI.card({ title:'Published Result', body:UI.kpiStrip([
            { label:'Marks', value:result.marks + '/' + result.total },
            { label:'Grade', value:result.grade, color:'#16A34A' },
            { label:'Grade Point', value:result.gp.toFixed(2) },
            { label:'Credits', value:result.credits }
          ]) + '<div class="mt-16"><div class="meter-top"><strong>Percentage</strong><span>' + result.marks + '%</span></div>' + UI.progress(result.marks) + '</div></div>' })
          + '</div><div>' + UI.card({ title:'Performance Note', body:'<p class="text-soft" style="line-height:1.75">Your performance in ' + U.esc(c.name) + ' is ' + (result.marks >= 85 ? 'excellent' : result.marks >= 75 ? 'good' : result.marks >= 60 ? 'average' : 'below expectation') + '. ' +
            (result.marks >= 85 ? 'Keep maintaining this standard in the final examination.' : 'Focus additional study time on the weaker units listed in the syllabus tab.') + '</p>' }) + '</div></div>'
          : UI.emptyState({ small:true, icon:'fa-hourglass-half', title:'Result not published', message:'No result has been published for this course yet.' })) }
    ]);

    UI.modal({
      title:c.code + ' \u2014 ' + c.name,
      subtitle:c.teacher + ' \u00b7 ' + c.credits + ' Credit Hours \u00b7 ' + c.semester + 'th Semester',
      size:'xl',
      body:tabsHtml,
      footer:'<button class="btn btn-outline" data-modal-close>Close</button>' +
             '<button class="btn btn-ghost" id="cd-materials"><i class="fas fa-folder-open"></i> Materials</button>' +
             '<button class="btn btn-primary" id="cd-message"><i class="fas fa-comment-dots"></i> Message Instructor</button>',
      onMount:function (m) {
        UI.bindTabs('course-tabs', function (key) {
          if (key === 'attendance' && attendance) {
            C.donut('course-att-donut', { cutout:'70%', legend:false, data:[
              { label:'Present', value:attendance.present, color:'#22C55E' },
              { label:'Absent',  value:attendance.absent,  color:'#EF4444' },
              { label:'Late',    value:attendance.late,    color:'#F59E0B' },
              { label:'Excused', value:attendance.excused, color:'#94A3B8' }
            ] });
          }
        });
        m.on('#cd-message', 'click', function () { m.close(); if (global.SRMS_APP) global.SRMS_APP.go('messages'); });
        m.on('#cd-materials', 'click', function () { m.close(); UI.toast('info', 'Course materials', 'Opening downloads for ' + c.code + '.'); if (global.SRMS_APP) global.SRMS_APP.go('downloads'); });
        m.el.addEventListener('click', function (e) {
          var t = e.target.closest('[data-msg-teacher]');
          if (t) { m.close(); if (global.SRMS_APP) global.SRMS_APP.go('messages'); }
          var d = e.target.closest('[data-dl]');
          if (d) UI.toast('success', 'Download started', d.getAttribute('data-dl') + ' is being downloaded.');
        });
      }
    });
  }

  R.add('courses', 'student', {
    title:'My Courses', crumbs:['Academic','Courses'],
    render:coursesPage
  });

  global.SRMS_COURSE_DETAIL = openDetail;
})(window);
