/* =============================================================================
   SRMS - Admin Course Management  (js/pages/admin/courses.js)
   Create, edit and delete courses; assign teachers and students; manage credit
   hours, semesters and sections.
   ========================================================================== */
(function (global) {
  'use strict';
  var U = global.SRMS_UTIL;
  var UI = global.SRMS_UI;
  var R = global.SRMS_ROUTES;

  var state = { q:'', dept:'All', sem:'All', status:'All', sort:'code', dir:'asc', page:1, per:8 };
  var extra = [];
  var removed = [];

  function rows() {
    var out = ((global.SRMS_DATA.courses || []).concat(extra)).filter(function (c) { return removed.indexOf(c.code) === -1; });
    if (state.q) {
      var q = state.q.toLowerCase();
      out = out.filter(function (c) { return (c.name + ' ' + c.code + ' ' + c.teacher).toLowerCase().indexOf(q) > -1; });
    }
    if (state.dept !== 'All') out = out.filter(function (c) { return c.dept === state.dept; });
    if (state.sem !== 'All') out = out.filter(function (c) { return String(c.semester) === String(state.sem); });
    if (state.status !== 'All') out = out.filter(function (c) { return c.status === state.status; });
    return U.sortBy(out, state.sort, state.dir);
  }

  function find(code) {
    return ((global.SRMS_DATA.courses || []).concat(extra)).filter(function (c) { return c.code === code; })[0];
  }

  function coursesPage(host, ctx) {
    var D = global.SRMS_DATA;
    var depts = U.unique((D.courses || []).map(function (c) { return c.dept; })).sort();

    host.innerHTML =
      UI.pageHead({ title:'Course Management', subtitle:'Create courses, assign faculty, manage credit hours and enrolment.',
        actions:'<button class="btn btn-outline" id="ac-export"><i class="fas fa-file-export"></i> Export</button>' +
                '<button class="btn btn-primary" id="ac-add"><i class="fas fa-plus"></i> Create Course</button>' }) +

      '<div class="grid grid-4 mb-16">' +
        UI.statCard({ title:'Total Courses', value:(D.courses || []).length + extra.length, suffix:'courses', icon:'fa-book-open', tone:'blue', note:'Across all departments' }) +
        UI.statCard({ title:'Active Courses', value:rows().filter(function (c) { return c.status === 'Active'; }).length, suffix:'running', icon:'fa-circle-play', tone:'green', note:'Currently in session' }) +
        UI.statCard({ title:'Total Credits', value:U.sum((D.courses || []).concat(extra), 'credits'), suffix:'credit hours', icon:'fa-clock', tone:'purple', note:'Sum of all course credits' }) +
        UI.statCard({ title:'Total Enrolment', value:U.fmtNum(U.sum((D.courses || []).concat(extra), 'enrolled')), icon:'fa-users', tone:'teal', note:'Students across all courses' }) +
      '</div>' +

      '<div class="card card-flush">' +
        '<div class="table-toolbar" style="padding:18px 20px 0">' +
          '<div class="table-tools">' +
            UI.searchBox('adm-c-search', 'Search courses by code, name or teacher...', state.q) +
            UI.selectBox('adm-c-dept', [{ value:'All', label:'All Departments' }].concat(depts.map(function (d) { return { value:d, label:d }; })), state.dept, 'Filter department') +
            UI.selectBox('adm-c-sem', [{ value:'All', label:'All Semesters' }].concat(U.unique((D.courses || []).map(function (c) { return c.semester; })).sort().map(function (s) { return { value:s, label:s + 'th Semester' }; })), state.sem, 'Filter semester') +
            UI.selectBox('adm-c-status', ['All','Active','Completed','Inactive'], state.status, 'Filter status') +
            UI.selectBox('adm-c-sort', [
              { value:'code', label:'Sort: Course Code' }, { value:'name', label:'Sort: Course Name' },
              { value:'credits', label:'Sort: Credits' }, { value:'enrolled', label:'Sort: Enrolment' }
            ], state.sort, 'Sort courses') +
          '</div>' +
          '<div class="card-head-actions"><button class="btn btn-outline btn-sm" id="adm-c-reset"><i class="fas fa-rotate-left"></i> Reset</button></div>' +
        '</div>' +
        '<div style="padding:18px 20px 0" id="adm-c-body"></div>' +
        '<div id="adm-c-pagination" style="padding:0 20px 18px"></div>' +
      '</div>';

    function draw() {
      var out = rows();
      var info = U.paginate(out, state.page, state.per);
      var body = document.getElementById('adm-c-body');
      if (!out.length) {
        body.innerHTML = UI.emptyState({ icon:'fa-book', title:'No courses found', message:'No courses match the current filters.',
          action:'Clear Filters', actionId:'adm-c-clear', actionIcon:'fa-rotate-left' });
        document.getElementById('adm-c-pagination').innerHTML = '';
        var c = document.getElementById('adm-c-clear');
        if (c) c.addEventListener('click', reset);
        return;
      }

      var cols = [
        { key:'code', label:'Code', render:function (c) { return '<span class="badge badge-blue">' + U.esc(c.code) + '</span>'; } },
        { key:'name', label:'Course Name', render:function (c) { return '<span class="cell-strong">' + U.esc(c.name) + '</span>'; } },
        { key:'dept', label:'Department', render:function (c) { return '<span class="cell-mute">' + U.esc(c.dept) + '</span>'; } },
        { key:'credits', label:'Credits', className:'center' },
        { key:'teacher', label:'Assigned Teacher' },
        { key:'semester', label:'Semester', className:'center', render:function (c) { return c.semester + 'th'; } },
        { key:'section', label:'Section', className:'center' },
        { key:'enrolled', label:'Students', className:'num' },
        { key:'status', label:'Status', render:function (c) { return UI.statusBadge(c.status); } },
        { key:'actions', label:'Actions', sortable:false, render:function (c) {
            return '<div class="action-group">' +
              '<button class="icon-action" data-cv="' + U.esc(c.code) + '" title="View" aria-label="View"><i class="fas fa-eye"></i></button>' +
              '<button class="icon-action" data-ce="' + U.esc(c.code) + '" title="Edit" aria-label="Edit"><i class="fas fa-pen"></i></button>' +
              '<button class="icon-action success" data-ct="' + U.esc(c.code) + '" title="Assign teacher" aria-label="Assign teacher"><i class="fas fa-user-tie"></i></button>' +
              '<button class="icon-action danger" data-cd="' + U.esc(c.code) + '" title="Delete" aria-label="Delete"><i class="fas fa-trash"></i></button></div>';
          } }
      ];

      body.innerHTML = UI.table({ columns:cols, rows:info.items, sortKey:state.sort, sortDir:state.dir }) +
        UI.dataCards(info.items, function (c) {
          return '<div class="data-card"><div class="data-card-head"><strong>' + U.esc(c.name) + '</strong>' + UI.statusBadge(c.status) + '</div>' +
            '<div class="data-card-grid"><div><div class="dc-label">Code</div><div class="dc-value">' + U.esc(c.code) + '</div></div>' +
            '<div><div class="dc-label">Teacher</div><div class="dc-value">' + U.esc(c.teacher) + '</div></div>' +
            '<div><div class="dc-label">Credits</div><div class="dc-value">' + c.credits + '</div></div>' +
            '<div><div class="dc-label">Students</div><div class="dc-value">' + c.enrolled + '</div></div></div></div>';
        });

      document.getElementById('adm-c-pagination').innerHTML = UI.pagination(info);
    }

    function reset() {
      state.q = ''; state.dept = 'All'; state.sem = 'All'; state.status = 'All'; state.page = 1;
      document.getElementById('adm-c-search').value = '';
      ['adm-c-dept','adm-c-sem','adm-c-status'].forEach(function (id) { document.getElementById(id).value = 'All'; });
      draw();
    }

    var si = document.getElementById('adm-c-search');
    si.addEventListener('input', U.debounce(function () { state.q = si.value; state.page = 1; draw(); }, 200));
    ['adm-c-dept','adm-c-sem','adm-c-status'].forEach(function (id) {
      document.getElementById(id).addEventListener('change', function () {
        var map = { 'adm-c-dept':'dept', 'adm-c-sem':'sem', 'adm-c-status':'status' };
        state[map[id]] = this.value; state.page = 1; draw();
      });
    });
    document.getElementById('adm-c-sort').addEventListener('change', function () { state.sort = this.value; draw(); });
    document.getElementById('adm-c-reset').addEventListener('click', reset);

    host.addEventListener('click', function (e) {
      var p = e.target.closest('[data-page]');
      if (p) { state.page = Number(p.getAttribute('data-page')); draw(); window.scrollTo({ top:0, behavior:'smooth' }); return; }
      var v = e.target.closest('[data-cv]');
      if (v) { viewCourse(v.getAttribute('data-cv')); return; }
      var ed = e.target.closest('[data-ce]');
      if (ed) { openForm(find(ed.getAttribute('data-ce')), draw); return; }
      var t = e.target.closest('[data-ct]');
      if (t) { assignTeacher(find(t.getAttribute('data-ct')), draw); return; }
      var d = e.target.closest('[data-cd]');
      if (d) {
        var c = find(d.getAttribute('data-cd'));
        UI.confirm({ title:'Delete this course?', message:'\u201c' + (c ? c.code + ' - ' + c.name : '') + '\u201d will be removed along with ' + (c ? c.enrolled : 0) + ' enrolments. This action cannot be undone.', tone:'danger', confirmText:'Delete Course',
          onConfirm:function () {
            removed.push(c.code);
            extra = extra.filter(function (x) { return x.code !== c.code; });
            UI.toast('success', 'Course deleted', c.code + ' has been removed from the catalogue.');
            draw();
          } });
      }
    });

    document.getElementById('ac-add').addEventListener('click', function () { openForm(null, draw); });

    document.getElementById('ac-export').addEventListener('click', function () {
      var out = rows();
      U.download('srms-courses-admin.csv', U.toCSV(out.map(function (c) {
        return { Code:c.code, Name:c.name, Department:c.dept, Credits:c.credits, Teacher:c.teacher, Semester:c.semester, Section:c.section, Students:c.enrolled, Status:c.status };
      }), ['Code','Name','Department','Credits','Teacher','Semester','Section','Students','Status']), 'text/csv');
      UI.toast('success', 'Export complete', out.length + ' courses exported.');
    });

    function viewCourse(code) {
      var c = find(code);
      if (!c) return;
      UI.modal({
        title:c.code + ' \u2014 ' + c.name, subtitle:c.teacher + ' \u00b7 ' + c.credits + ' credits \u00b7 Semester ' + c.semester, size:'lg',
        body:'<div class="chip-row mb-16">' + UI.statusBadge(c.status) + UI.badge(c.dept, 'blue') + UI.badge('Section ' + c.section, 'purple') + UI.badge(c.enrolled + ' students', 'teal') + '</div>' +
          '<p class="text-soft" style="line-height:1.75">' + U.esc(c.description) + '</p>' +
          '<div class="divider"></div>' +
          '<dl class="info-grid">' +
            '<div class="info-item"><dt>Schedule</dt><dd>' + U.esc(c.schedule) + '</dd></div>' +
            '<div class="info-item"><dt>Room</dt><dd>' + U.esc(c.room) + '</dd></div>' +
            '<div class="info-item"><dt>Attendance</dt><dd>' + c.attendance + '%</dd></div>' +
            '<div class="info-item"><dt>Syllabus Coverage</dt><dd>' + c.progress + '%</dd></div>' +
          '</dl>' +
          '<div class="divider"></div><h4 style="font-size:13.6px;margin-bottom:12px">Syllabus Units</h4>' +
          '<div class="timeline">' + (c.syllabus || []).map(function (s, i) {
            var done = ((i + 1) / c.syllabus.length) * 100 <= c.progress;
            return '<div class="timeline-item"><span class="timeline-dot' + (done ? ' green' : '') + '"></span><div class="timeline-content"><strong>Unit ' + (i + 1) + ': ' + U.esc(s) + '</strong></div></div>';
          }).join('') + '</div>',
        footer:'<button class="btn btn-outline" data-modal-close>Close</button><button class="btn btn-primary" id="vc-edit"><i class="fas fa-pen"></i> Edit Course</button>',
        onMount:function (m) { m.on('#vc-edit', 'click', function () { m.close(); openForm(c, draw); }); }
      });
    }

    function openForm(existing, onSaved) {
      var isEdit = !!existing;
      var c = existing || { code:'', name:'', dept:'Computer Science', credits:3, teacher:'Dr. Ahmad Hassan', semester:1, section:'A', status:'Active', enrolled:0, attendance:0, progress:0, room:'Room A-01', schedule:'Mon, Wed 09:00 - 10:30', syllabus:[], description:'' };
      UI.modal({
        title:isEdit ? 'Edit Course' : 'Create Course', subtitle:'Set course meta, credit hours, semester and faculty.', size:'lg',
        body:'<div class="form-grid">' +
          '<div class="form-group"><label class="field-label">Course Code</label><div class="input-wrap no-icon"><input id="cf-code" value="' + U.esc(c.code) + '" placeholder="e.g. CS-401"' + (isEdit ? ' readonly' : '') + '></div></div>' +
          '<div class="form-group"><label class="field-label">Course Name</label><div class="input-wrap no-icon"><input id="cf-name" value="' + U.esc(c.name) + '"></div></div>' +
          '<div class="form-group"><label class="field-label">Department</label><div class="input-wrap no-icon"><select id="cf-dept">' +
            (D.departments || []).map(function (d2) { return '<option' + (c.dept === d2.name ? ' selected' : '') + '>' + U.esc(d2.name) + '</option>'; }).join('') + '</select></div></div>' +
          '<div class="form-group"><label class="field-label">Credit Hours</label><div class="input-wrap no-icon"><select id="cf-credits">' +
            [1,2,3,4].map(function (n) { return '<option value="' + n + '"' + (c.credits === n ? ' selected' : '') + '>' + n + ' Credit' + (n > 1 ? 's' : '') + '</option>'; }).join('') + '</select></div></div>' +
          '<div class="form-group"><label class="field-label">Assigned Teacher</label><div class="input-wrap no-icon"><select id="cf-teacher">' +
            (D.teachers || []).map(function (t) { return '<option' + (c.teacher === t.name ? ' selected' : '') + '>' + U.esc(t.name) + '</option>'; }).join('') + '</select></div></div>' +
          '<div class="form-group"><label class="field-label">Semester</label><div class="input-wrap no-icon"><select id="cf-sem">' +
            [1,2,3,4,5,6,7,8].map(function (n) { return '<option value="' + n + '"' + (Number(c.semester) === n ? ' selected' : '') + '>' + n + 'th Semester</option>'; }).join('') + '</select></div></div>' +
          '<div class="form-group"><label class="field-label">Section</label><div class="input-wrap no-icon"><select id="cf-sec">' +
            ['A','B','C'].map(function (n) { return '<option' + (c.section === n ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select></div></div>' +
          '<div class="form-group"><label class="field-label">Room</label><div class="input-wrap no-icon"><input id="cf-room" value="' + U.esc(c.room) + '"></div></div>' +
          '<div class="form-group"><label class="field-label">Schedule</label><div class="input-wrap no-icon"><input id="cf-sched" value="' + U.esc(c.schedule) + '"></div></div>' +
          '<div class="form-group"><label class="field-label">Status</label><div class="input-wrap no-icon"><select id="cf-status">' +
            ['Active','Completed','Inactive'].map(function (n) { return '<option' + (c.status === n ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select></div></div>' +
          '<div class="form-group form-span-2"><label class="field-label">Description</label><div class="input-wrap"><textarea id="cf-desc">' + U.esc(c.description) + '</textarea></div></div>' +
        '</div><span class="field-error" id="cf-error"></span>',
        footer:'<button class="btn btn-outline" data-modal-close>Cancel</button><button class="btn btn-primary" id="cf-save"><i class="fas fa-check"></i> ' + (isEdit ? 'Save Changes' : 'Create Course') + '</button>',
        onMount:function (m) {
          m.on('#cf-save', 'click', function () {
            var code = m.el.querySelector('#cf-code').value.trim().toUpperCase();
            var name = m.el.querySelector('#cf-name').value.trim();
            var err = m.el.querySelector('#cf-error');
            if (!/^[A-Z]{2,4}-\d{3}$/.test(code)) { err.textContent = 'Course code must match the pattern CS-401.'; return; }
            if (!U.minLen(name, 4)) { err.textContent = 'Course name must be at least 4 characters.'; return; }
            err.textContent = '';
            var teacherName = m.el.querySelector('#cf-teacher').value;
            var data = { code:code, name:name, dept:m.el.querySelector('#cf-dept').value, credits:Number(m.el.querySelector('#cf-credits').value),
              teacher:teacherName, semester:Number(m.el.querySelector('#cf-sem').value), section:m.el.querySelector('#cf-sec').value,
              room:m.el.querySelector('#cf-room').value.trim(), schedule:m.el.querySelector('#cf-sched').value.trim(),
              status:m.el.querySelector('#cf-status').value, description:m.el.querySelector('#cf-desc').value.trim(),
              enrolled:c.enrolled || 0, attendance:c.attendance || 0, progress:c.progress || 0, syllabus:c.syllabus || [] };
            if (isEdit) { Object.assign(existing, data); m.close(); UI.toast('success', 'Course updated', data.code + ' has been saved successfully.'); }
            else {
              extra.push(data);
              var tch = (D.teachers || []).filter(function (t) { return t.name === teacherName; })[0];
              if (tch && tch.courses.indexOf(code) === -1) tch.courses.push(code);
              m.close();
              UI.toast('success', 'Course created', data.code + ' - ' + data.name + ' has been added to the catalogue.');
            }
            onSaved();
          });
        }
      });
    }

    function assignTeacher(c, onSaved) {
      if (!c) return;
      UI.modal({
        title:'Assign Teacher', subtitle:c.code + ' \u2014 ' + c.name,
        body:'<div class="form-group"><label class="field-label">Select Faculty Member</label><div class="input-wrap no-icon"><select id="at-teacher">' +
          (D.teachers || []).filter(function (t) { return t.status === 'Active'; }).map(function (t) {
            return '<option value="' + U.esc(t.id) + '"' + (c.teacher === t.name ? ' selected' : '') + '>' + U.esc(t.name + ' \u00b7 ' + t.designation + ' \u00b7 ' + t.dept) + '</option>';
          }).join('') + '</select></div><span class="helper-text">The selected faculty member gains result entry and attendance rights for this course.</span></div>',
        footer:'<button class="btn btn-outline" data-modal-close>Cancel</button><button class="btn btn-primary" id="at-save"><i class="fas fa-check"></i> Assign Teacher</button>',
        onMount:function (m) {
          m.on('#at-save', 'click', function () {
            var tid = m.el.querySelector('#at-teacher').value;
            var t = (D.teachers || []).filter(function (x) { return x.id === tid; })[0];
            var old = (D.teachers || []).filter(function (x) { return x.name === c.teacher; })[0];
            if (old && old.courses) old.courses = old.courses.filter(function (x) { return x !== c.code; });
            if (t) { c.teacher = t.name; if (t.courses.indexOf(c.code) === -1) t.courses.push(c.code); }
            m.close();
            UI.toast('success', 'Teacher assigned', c.code + ' is now taught by ' + (t ? t.name : 'the selected faculty') + '.');
            onSaved();
          });
        }
      });
    }

    draw();
  }

  R.add('courses', 'admin', { title:'Course Management', crumbs:['Management','Courses'], render:coursesPage });
})(window);
