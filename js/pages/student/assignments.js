/* =============================================================================
   SRMS - Assignments  (js/pages/student/assignments.js)
   Upcoming / pending / submitted / graded assignment tracking with deadline
   countdowns, submission dialogs and grading. Shared by student and teacher.
   ========================================================================== */
(function (global) {
  'use strict';
  var U = global.SRMS_UTIL;
  var UI = global.SRMS_UI;
  var R = global.SRMS_ROUTES;

  var state = { tab:'Upcoming', q:'', code:'All', page:1, per:6 };

  function inTab(a, tab) {
    if (tab === 'Upcoming') return a.status === 'Pending' && U.daysBetween(U.todayISO(), a.due) >= 0;
    if (tab === 'Pending') return a.status === 'Pending' && U.daysBetween(U.todayISO(), a.due) < 0;
    if (tab === 'Submitted') return a.status === 'Submitted';
    if (tab === 'Completed') return a.status === 'Graded' || a.status === 'Completed';
    return true;
  }

  function list() {
    var out = (global.SRMS_DATA.assignments || []).filter(function (a) { return inTab(a, state.tab); });
    if (state.code !== 'All') out = out.filter(function (a) { return a.code === state.code; });
    if (state.q) {
      var q = state.q.toLowerCase();
      out = out.filter(function (a) { return (a.title + ' ' + a.course + ' ' + a.code + ' ' + a.teacher).toLowerCase().indexOf(q) > -1; });
    }
    return out.sort(function (a, b) { return a.due.localeCompare(b.due); });
  }

  function card(a, canGrade) {
    var cd = U.countdown(a.due);
    var overdue = cd.expired && a.status === 'Pending';
    var tone = a.status === 'Graded' ? 'green' : overdue ? 'red' : a.status === 'Submitted' ? 'blue' : cd.days <= 3 ? 'red' : cd.days <= 7 ? 'yellow' : 'blue';
    return '<article class="card card-hover"><div class="flex-between mb-12">' +
      '<span class="badge badge-' + (a.priority === 'High' ? 'red' : a.priority === 'Medium' ? 'yellow' : 'gray') + '"><i class="fas fa-flag"></i> ' + U.esc(a.priority) + '</span>' +
      (a.status === 'Pending' ? '<span class="badge badge-' + tone + '">' + U.esc(cd.text) + '</span>' : UI.statusBadge(a.status)) + '</div>' +
      '<h3 style="font-size:14.6px;line-height:1.4">' + U.esc(a.title) + '</h3>' +
      '<p class="text-soft text-sm mt-4"><i class="fas fa-book"></i> ' + U.esc(a.course) + ' \u00b7 ' + U.esc(a.code) + '</p>' +
      '<p class="text-mute text-xs mt-8" style="line-height:1.6">' + U.esc(a.description.substring(0, 108)) + (a.description.length > 108 ? '\u2026' : '') + '</p>' +
      '<div class="resource-meta mt-12">' +
        '<div><span><i class="fas fa-user-tie"></i> Teacher</span><strong>' + U.esc(a.teacher) + '</strong></div>' +
        '<div><span><i class="fas fa-calendar-plus"></i> Assigned</span><strong>' + U.fmtDate(a.assigned) + '</strong></div>' +
        '<div><span><i class="fas fa-calendar-check"></i> Due</span><strong>' + U.fmtDate(a.due) + '</strong></div>' +
        '<div><span><i class="fas fa-award"></i> Marks</span><strong>' + (a.marks === null || a.marks === undefined ? 'Not graded' : a.marks + ' / ' + a.total) + '</strong></div>' +
      '</div>' +
      (a.status === 'Graded' && a.marks !== null ? '<div class="mt-12"><div class="meter-top"><strong>Score</strong><span>' + Math.round((a.marks / a.total) * 100) + '%</span></div>' + UI.progress((a.marks / a.total) * 100, 'green') + '</div>' : '') +
      '<div class="resource-foot">' +
        '<button class="btn btn-outline btn-sm" data-as-view="' + U.esc(a.id) + '"><i class="fas fa-eye"></i> View</button>' +
        (a.status === 'Pending' ? '<button class="btn btn-primary btn-sm" data-as-submit="' + U.esc(a.id) + '"><i class="fas fa-upload"></i> Submit</button>' : '') +
        '<button class="btn btn-ghost btn-sm" data-as-dl="' + U.esc(a.id) + '"><i class="fas fa-download"></i> File</button>' +
        (canGrade ? '<button class="btn btn-outline btn-sm" data-as-grade="' + U.esc(a.id) + '"><i class="fas fa-pen"></i> Grade</button>' : '') +
      '</div></article>';
  }

  function assignmentsPage(host, ctx) {
    var D = global.SRMS_DATA;
    var all = D.assignments || [];
    var canGrade = ctx.role === 'teacher' || ctx.role === 'admin';
    var codes = U.unique(all.map(function (a) { return a.code; })).sort();
    var pending = all.filter(function (a) { return a.status === 'Pending'; }).length;
    var overdue = all.filter(function (a) { return a.status === 'Pending' && U.daysBetween(U.todayISO(), a.due) < 0; }).length;
    var graded = all.filter(function (a) { return a.status === 'Graded'; });
    var avgScore = graded.length ? Math.round(U.avg(graded, function (g) { return (g.marks / g.total) * 100; })) : 0;

    host.innerHTML =
      UI.pageHead({ title:canGrade ? 'Assignment Management' : 'My Assignments',
        subtitle:canGrade ? 'Create, review and grade student submissions.' : 'Track every assignment, submit your work and review marks.',
        actions:'<button class="btn btn-outline" id="as-export"><i class="fas fa-file-export"></i> Export</button>' +
                (canGrade ? '<button class="btn btn-primary" id="as-new"><i class="fas fa-plus"></i> New Assignment</button>' : '<button class="btn btn-primary" id="as-calendar"><i class="fas fa-calendar-plus"></i> Add to Calendar</button>') }) +

      '<div class="grid grid-4 mb-16">' +
        UI.statCard({ title:'Total Assignments', value:all.length, suffix:'posted', icon:'fa-clipboard-check', tone:'blue', note:'Across all enrolled courses' }) +
        UI.statCard({ title:'Pending Submission', value:pending, suffix:'pending', icon:'fa-hourglass-half', tone:'yellow', note:overdue + ' already overdue' }) +
        UI.statCard({ title:'Submitted', value:all.filter(function (a) { return a.status === 'Submitted'; }).length, suffix:'submitted', icon:'fa-paper-plane', tone:'purple', note:'Awaiting evaluation' }) +
        UI.statCard({ title:'Average Score', value:avgScore + '%', icon:'fa-award', tone:'green', note:'Across ' + graded.length + ' graded assignments' }) +
      '</div>' +
      (overdue ? '<div class="mb-16">' + UI.alert({ tone:'danger', title:'Overdue submissions', message:'You have ' + overdue + ' assignment' + (overdue > 1 ? 's' : '') + ' past the due date. Late submissions may carry a marking penalty.' }) + '</div>' : '') +

      '<div class="card card-flush">' +
        '<div class="table-toolbar" style="padding:18px 20px 0">' +
          '<div class="table-tools">' + UI.searchBox('as-search', 'Search assignments...', state.q) +
            UI.selectBox('as-course', [{ value:'All', label:'All Courses' }].concat(codes.map(function (c) { return { value:c, label:c }; })), state.code, 'Filter by course') + '</div>' +
          '<div class="card-head-actions"><button class="btn btn-outline btn-sm" id="as-reset"><i class="fas fa-rotate-left"></i> Reset Filters</button></div>' +
        '</div>' +
        '<div style="padding:16px 20px 0">' + UI.tabs('as-tabs', [
          { key:'Upcoming',  label:'Upcoming',  icon:'fa-hourglass-half', count:all.filter(function (a) { return inTab(a, 'Upcoming'); }).length },
          { key:'Pending',   label:'Pending',   icon:'fa-triangle-exclamation', count:all.filter(function (a) { return inTab(a, 'Pending'); }).length },
          { key:'Submitted', label:'Submitted', icon:'fa-paper-plane', count:all.filter(function (a) { return inTab(a, 'Submitted'); }).length },
          { key:'Completed', label:'Completed', icon:'fa-circle-check', count:all.filter(function (a) { return inTab(a, 'Completed'); }).length }
        ], state.tab) + '</div>' +
        '<div style="padding:6px 20px 20px" id="as-body"></div>' +
      '</div>';

    function draw() {
      var items = list();
      var body = document.getElementById('as-body');
      if (!items.length) {
        body.innerHTML = UI.emptyState({ icon:'fa-clipboard', title:'No assignments in this view', message:'Nothing matches the ' + state.tab + ' filter with your current search.',
          action:'Show All', actionId:'as-all', actionIcon:'fa-list' });
        var b = document.getElementById('as-all');
        if (b) b.addEventListener('click', function () {
          state.q = ''; state.code = 'All';
          document.getElementById('as-search').value = '';
          document.getElementById('as-course').value = 'All';
          draw();
        });
        return;
      }
      var info = U.paginate(items, state.page, state.per);
      body.innerHTML = '<div class="grid grid-2">' + info.items.map(function (a) { return card(a, canGrade); }).join('') + '</div>' + UI.pagination(info);
    }

    var si = document.getElementById('as-search');
    si.addEventListener('input', U.debounce(function () { state.q = si.value; state.page = 1; draw(); }, 200));
    document.getElementById('as-course').addEventListener('change', function () { state.code = this.value; state.page = 1; draw(); });
    document.getElementById('as-reset').addEventListener('click', function () {
      state.q = ''; state.code = 'All';
      si.value = ''; document.getElementById('as-course').value = 'All';
      draw(); UI.toast('info', 'Filters cleared', 'Showing every assignment in this view.');
    });
    UI.bindTabs('as-tabs', function (key) { state.tab = key; state.page = 1; draw(); });

    document.getElementById('as-body').addEventListener('click', function (e) {
      var p = e.target.closest('[data-page]');
      if (p) { state.page = Number(p.getAttribute('data-page')); draw(); window.scrollTo({ top:0, behavior:'smooth' }); return; }
      var v = e.target.closest('[data-as-view]');
      if (v) { openView(v.getAttribute('data-as-view'), canGrade, ctx); return; }
      var s = e.target.closest('[data-as-submit]');
      if (s) { openSubmit(s.getAttribute('data-as-submit'), draw); return; }
      var g = e.target.closest('[data-as-grade]');
      if (g) { openGrade(g.getAttribute('data-as-grade'), draw); return; }
      var d = e.target.closest('[data-as-dl]');
      if (d) {
        var a = (global.SRMS_DATA.assignments || []).filter(function (x) { return x.id === d.getAttribute('data-as-dl'); })[0];
        UI.toast('success', 'Download started', (a ? a.code : 'assignment') + '-assignment.pdf is being downloaded.');
      }
    });

    document.getElementById('as-export').addEventListener('click', function () {
      var rows = (global.SRMS_DATA.assignments || []).map(function (a) { return { ID:a.id, Title:a.title, Course:a.course, Code:a.code, Teacher:a.teacher, Assigned:a.assigned, Due:a.due, Status:a.status, Marks:a.marks === null ? '' : a.marks + '/' + a.total }; });
      U.download('srms-assignments.csv', U.toCSV(rows, ['ID','Title','Course','Code','Teacher','Assigned','Due','Status','Marks']), 'text/csv');
      UI.toast('success', 'Export complete', 'srms-assignments.csv saved successfully.');
    });

    var nw = document.getElementById('as-new');
    if (nw) nw.addEventListener('click', function () { newAssignment(draw); });

    var cal = document.getElementById('as-calendar');
    if (cal) cal.addEventListener('click', function () {
      UI.toast('success', 'Calendar updated', 'All pending assignment deadlines have been added to your calendar.');
      if (ctx.go) setTimeout(function () { ctx.go('calendar'); }, 700);
    });

    draw();
  }

  /* ------------------------------------------------------- VIEW DIALOG */
  function findAssignment(id) {
    return (global.SRMS_DATA.assignments || []).filter(function (a) { return a.id === id; })[0];
  }

  function openView(id, canGrade, ctx) {
    var a = findAssignment(id);
    if (!a) return;
    var cd = U.countdown(a.due);
    UI.modal({
      title:a.title, subtitle:a.course + ' \u00b7 ' + a.code + ' \u00b7 ' + a.teacher, size:'lg',
      body:'<div class="flex-between mb-16">' + UI.statusBadge(a.status) +
        '<span class="badge badge-' + (cd.expired ? 'red' : cd.days <= 3 ? 'red' : cd.days <= 7 ? 'yellow' : 'blue') + '">' + U.esc(cd.text) + '</span></div>' +
        '<p style="line-height:1.8">' + U.esc(a.description) + '</p>' +
        '<div class="divider"></div>' +
        '<dl class="info-grid">' +
          '<div class="info-item"><dt>Assigned Date</dt><dd>' + U.fmtDateLong(a.assigned) + '</dd></div>' +
          '<div class="info-item"><dt>Due Date</dt><dd>' + U.fmtDateLong(a.due) + '</dd></div>' +
          '<div class="info-item"><dt>Total Marks</dt><dd>' + a.total + '</dd></div>' +
          '<div class="info-item"><dt>Priority</dt><dd>' + U.esc(a.priority) + '</dd></div>' +
          '<div class="info-item"><dt>Submission</dt><dd>' + U.esc(a.submission) + '</dd></div>' +
          '<div class="info-item"><dt>Awarded Marks</dt><dd>' + (a.marks === null || a.marks === undefined ? 'Not graded yet' : a.marks + ' / ' + a.total) + '</dd></div>' +
        '</dl>' +
        (a.status === 'Graded' && a.marks !== null ? '<div class="mt-16"><div class="meter-top"><strong>Final Score</strong><span>' + Math.round((a.marks / a.total) * 100) + '%</span></div>' + UI.progress((a.marks / a.total) * 100, 'green') + '</div>' : ''),
      footer:'<button class="btn btn-outline" data-modal-close>Close</button>' +
             '<button class="btn btn-ghost" id="av-dl"><i class="fas fa-download"></i> Download</button>' +
             (a.status === 'Pending' ? '<button class="btn btn-primary" id="av-submit"><i class="fas fa-upload"></i> Submit Now</button>' : ''),
      onMount:function (m) {
        m.on('#av-dl', 'click', function () { UI.toast('success', 'Download started', a.code + '-assignment.pdf is being downloaded.'); });
        var sb = m.el.querySelector('#av-submit');
        if (sb) sb.addEventListener('click', function () { m.close(); openSubmit(id, function () { R.reRender({ role:ctx.role, user:ctx.user, go:ctx.go }); }); });
      }
    });
  }

  /* ----------------------------------------------------- SUBMIT DIALOG */
  function openSubmit(id, onDone) {
    var a = findAssignment(id);
    if (!a) return;
    UI.modal({
      title:'Submit Assignment', subtitle:a.title + ' \u00b7 ' + a.code, 
      body:'<div class="form-group"><label class="field-label">Submission File</label>' +
        '<div class="input-wrap"><input type="file" id="sb-file"></div>' +
        '<span class="helper-text">Accepted formats: PDF, DOCX, ZIP. Maximum size 25 MB.</span></div>' +
        '<div class="form-group mt-16"><label class="field-label">Comments for the instructor (optional)</label>' +
        '<div class="input-wrap"><textarea id="sb-comment" placeholder="Add any notes about your submission..."></textarea></div></div>' +
        UI.alert({ tone:'info', title:'Academic integrity', message:'By submitting you confirm this work is your own and complies with the university academic integrity policy.' }),
      footer:'<button class="btn btn-outline" data-modal-close>Cancel</button>' +
             '<button class="btn btn-primary" id="sb-send"><i class="fas fa-paper-plane"></i> Submit Assignment</button>',
      onMount:function (m) {
        m.on('#sb-send', 'click', function () {
          var f = m.el.querySelector('#sb-file').files;
          if (!f || !f.length) { UI.toast('error', 'File required', 'Please attach your submission file before submitting.'); return; }
          UI.confirm({
            title:'Confirm submission',
            message:'Your work for \u201c' + a.title + '\u201d will be sent to ' + a.teacher + ' for evaluation.',
            tone:'info', confirmText:'Submit',
            onConfirm:function () {
              a.status = 'Submitted';
              a.submission = U.todayISO();
              m.close();
              UI.toast('success', 'Assignment submitted', 'Your submission has been recorded successfully.');
              if (typeof onDone === 'function') onDone();
            }
          });
        });
      }
    });
  }

  /* ------------------------------------------------------ GRADE DIALOG */
  function openGrade(id, onDone) {
    var a = findAssignment(id);
    if (!a) return;
    UI.modal({
      title:'Grade Submission', subtitle:a.title + ' \u00b7 ' + a.code,
      body:'<div class="form-grid">' +
        '<div class="form-group"><label class="field-label">Student ID</label><div class="input-wrap no-icon"><input id="gd-student" placeholder="STU-2021-0012"></div></div>' +
        '<div class="form-group"><label class="field-label">Awarded Marks (out of ' + a.total + ')</label><div class="input-wrap no-icon"><input type="number" id="gd-marks" min="0" max="' + a.total + '" value="' + (a.marks === null ? '' : a.marks) + '"></div></div>' +
        '<div class="form-group form-span-2"><label class="field-label">Feedback</label><div class="input-wrap"><textarea id="gd-feedback" placeholder="Provide constructive feedback..."></textarea></div></div>' +
      '</div><div id="gd-preview" class="mt-16"></div>',
      footer:'<button class="btn btn-outline" data-modal-close>Cancel</button><button class="btn btn-primary" id="gd-save"><i class="fas fa-check"></i> Save Grade</button>',
      onMount:function (m) {
        var marks = m.el.querySelector('#gd-marks');
        marks.addEventListener('input', function () {
          var v = Number(marks.value);
          var pct = (v / a.total) * 100;
          var g = U.gradeFromMarks(pct);
          m.el.querySelector('#gd-preview').innerHTML = (marks.value === '') ? '' :
            '<div class="kpi-strip"><div class="kpi-cell"><div class="kpi-label">Percentage</div><div class="kpi-val">' + Math.round(pct) + '%</div></div>' +
            '<div class="kpi-cell"><div class="kpi-label">Grade</div><div class="kpi-val">' + g.grade + '</div></div>' +
            '<div class="kpi-cell"><div class="kpi-label">Grade Point</div><div class="kpi-val">' + g.gp.toFixed(2) + '</div></div></div>';
        });
        m.on('#gd-save', 'click', function () {
          var v = Number(marks.value);
          if (marks.value === '' || isNaN(v) || v < 0 || v > a.total) { UI.toast('error', 'Invalid marks', 'Enter a value between 0 and ' + a.total + '.'); return; }
          a.marks = v; a.status = 'Graded';
          m.close();
          UI.toast('success', 'Grade saved', 'The submission has been graded ' + v + ' / ' + a.total + '.');
          if (typeof onDone === 'function') onDone();
        });
      }
    });
  }

  /* ---------------------------------------------------- NEW ASSIGNMENT */
  function newAssignment(onDone) {
    var courses = global.SRMS_DATA.courses || [];
    UI.modal({
      title:'Create Assignment', subtitle:'Publish a new assignment to your students.', size:'lg',
      body:'<div class="form-grid">' +
        '<div class="form-group form-span-2"><label class="field-label">Assignment Title</label><div class="input-wrap no-icon"><input id="na-title" placeholder="e.g. ER Diagram for Library System"></div></div>' +
        '<div class="form-group"><label class="field-label">Course</label><div class="input-wrap no-icon"><select id="na-course">' +
          courses.map(function (c) { return '<option value="' + U.esc(c.code) + '">' + U.esc(c.code + ' - ' + c.name) + '</option>'; }).join('') + '</select></div></div>' +
        '<div class="form-group"><label class="field-label">Total Marks</label><div class="input-wrap no-icon"><input type="number" id="na-total" value="20" min="1" max="100"></div></div>' +
        '<div class="form-group"><label class="field-label">Due Date</label><div class="input-wrap no-icon"><input type="date" id="na-due" value="' + U.todayISO() + '"></div></div>' +
        '<div class="form-group"><label class="field-label">Priority</label><div class="input-wrap no-icon"><select id="na-priority"><option>High</option><option selected>Medium</option><option>Low</option></select></div></div>' +
        '<div class="form-group form-span-2"><label class="field-label">Instructions</label><div class="input-wrap"><textarea id="na-desc" placeholder="Describe the task, deliverables and marking criteria..."></textarea></div></div>' +
        '<div class="form-group form-span-2"><label class="field-label">Attach Brief (optional)</label><div class="input-wrap"><input type="file" id="na-file"></div></div>' +
      '</div><span class="field-error" id="na-error"></span>',
      footer:'<button class="btn btn-outline" data-modal-close>Cancel</button><button class="btn btn-primary" id="na-publish"><i class="fas fa-paper-plane"></i> Publish Assignment</button>',
      onMount:function (m) {
        m.on('#na-publish', 'click', function () {
          var title = m.el.querySelector('#na-title').value.trim();
          var desc = m.el.querySelector('#na-desc').value.trim();
          var err = m.el.querySelector('#na-error');
          if (!U.minLen(title, 4)) { err.textContent = 'Title must be at least 4 characters.'; return; }
          if (!U.minLen(desc, 15)) { err.textContent = 'Instructions must be at least 15 characters.'; return; }
          err.textContent = '';
          var code = m.el.querySelector('#na-course').value;
          var course = courses.filter(function (c) { return c.code === code; })[0] || {};
          UI.confirm({ title:'Publish assignment?', message:'All enrolled students in ' + code + ' will be notified immediately.', tone:'info', confirmText:'Publish',
            onConfirm:function () {
              (global.SRMS_DATA.assignments || []).unshift({
                id:'AS-' + Math.floor(200 + Math.random() * 799),
                title:title, course:course.name || code, code:code, teacher:course.teacher || 'Faculty',
                assigned:U.todayISO(), due:m.el.querySelector('#na-due').value, status:'Pending',
                submission:'Not submitted', marks:null, total:Number(m.el.querySelector('#na-total').value) || 20,
                priority:m.el.querySelector('#na-priority').value, description:desc
              });
              m.close();
              UI.toast('success', 'Assignment published', 'Students can now view and submit this assignment.');
              if (typeof onDone === 'function') onDone();
            } });
        });
      }
    });
  }

  var def = { title:'Assignments', crumbs:['Services','Assignments'], render:assignmentsPage };
  R.add('assignments', 'student', def);
  R.add('assignments', 'teacher', { title:'Assignments', crumbs:['Teaching','Assignments'], render:assignmentsPage });
  R.add('assignments', 'admin', { title:'Assignments', crumbs:['Content','Assignments'], render:assignmentsPage });
})(window);
