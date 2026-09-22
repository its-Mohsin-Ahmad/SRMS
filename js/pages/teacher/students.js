/* =============================================================================
   SRMS - Teacher Student Management  (js/pages/teacher/students.js)
   Searchable, sortable, paginated student roster with view / edit / attendance /
   results / message actions plus CSV export.
   ========================================================================== */
(function (global) {
  'use strict';
  var U = global.SRMS_UTIL;
  var UI = global.SRMS_UI;
  var R = global.SRMS_ROUTES;

  var state = { q:'', dept:'All', sem:'All', status:'All', sort:'name', dir:'asc', page:1, per:8, selected:[] };

  function rows() {
    var out = (global.SRMS_DATA.studentRoster || []).slice();
    if (state.q) {
      var q = state.q.toLowerCase();
      out = out.filter(function (s) { return (s.name + ' ' + s.id + ' ' + s.email + ' ' + s.dept).toLowerCase().indexOf(q) > -1; });
    }
    if (state.dept !== 'All') out = out.filter(function (s) { return s.dept === state.dept; });
    if (state.sem !== 'All') out = out.filter(function (s) { return String(s.sem) === String(state.sem); });
    if (state.status !== 'All') out = out.filter(function (s) { return s.status === state.status; });
    return U.sortBy(out, state.sort, state.dir);
  }

  function studentsPage(host, ctx) {
    var D = global.SRMS_DATA;
    var list = D.studentRoster || [];
    var depts = U.unique(list.map(function (s) { return s.dept; })).sort();
    var risky = list.filter(function (s) { return s.attendance < 75; });
    var probation = list.filter(function (s) { return s.status === 'Probation' || s.status === 'Warning'; });

    host.innerHTML =
      UI.pageHead({ title:'Students', subtitle:'Manage student records, monitor attendance and review academic standing.',
        actions:'<button class="btn btn-outline" id="ts-import"><i class="fas fa-file-import"></i> Import</button>' +
                '<button class="btn btn-outline" id="ts-export"><i class="fas fa-file-export"></i> Export CSV</button>' +
                '<button class="btn btn-primary" id="ts-add"><i class="fas fa-user-plus"></i> Add Student</button>' }) +

      '<div class="grid grid-4 mb-16">' +
        UI.statCard({ title:'My Students', value:list.length, suffix:'records', icon:'fa-users', tone:'blue', note:'Across your teaching sections' }) +
        UI.statCard({ title:'Average CGPA', value:U.fmtGpa(U.avg(list, 'cgpa')), suffix:'/ 4.00', icon:'fa-award', tone:'purple', note:'Batch performance indicator', trend:{ dir:'up', value:'+0.06' } }) +
        UI.statCard({ title:'Average Attendance', value:U.fmtPct(U.avg(list, 'attendance')), icon:'fa-user-check', tone:'green', note:risky.length + ' students below 75%' }) +
        UI.statCard({ title:'Needs Attention', value:probation.length, suffix:'students', icon:'fa-triangle-exclamation', tone:'yellow', note:'On academic warning or probation' }) +
      '</div>' +

      (risky.length ? '<div class="mb-16">' + UI.alert({ tone:'warning', title:'Attendance follow-up required',
        message:risky.length + ' students have attendance below the 75 percent requirement: ' + risky.slice(0, 4).map(function (r) { return r.name; }).join(', ') + (risky.length > 4 ? ' and ' + (risky.length - 4) + ' more' : '') + '.' }) + '</div>' : '') +

      '<div class="card card-flush">' +
        '<div class="table-toolbar" style="padding:18px 20px 0">' +
          '<div class="table-tools">' +
            UI.searchBox('ts-search', 'Search by name, ID, email or department...', state.q) +
            UI.selectBox('ts-dept', [{ value:'All', label:'All Departments' }].concat(depts.map(function (d) { return { value:d, label:d }; })), state.dept, 'Filter by department') +
            UI.selectBox('ts-sem', [{ value:'All', label:'All Semesters' }].concat(U.unique(list.map(function (s) { return s.sem; })).sort().map(function (s) { return { value:s, label:s + 'th Semester' }; })), state.sem, 'Filter by semester') +
            UI.selectBox('ts-status', ['All','Active','Warning','Probation'], state.status, 'Filter by status') +
          '</div>' +
          '<div class="card-head-actions"><span class="badge badge-blue" id="ts-count"></span>' +
          '<button class="btn btn-outline btn-sm" id="ts-reset"><i class="fas fa-rotate-left"></i> Reset</button></div>' +
        '</div>' +
        '<div style="padding:18px 20px 20px" id="ts-body"></div>' +
        '<div id="ts-pagination" style="padding:0 20px 20px"></div>' +
      '</div>';

    function draw() {
      var out = rows();
      var info = U.paginate(out, state.page, state.per);
      document.getElementById('ts-count').textContent = out.length + ' students';
      var body = document.getElementById('ts-body');

      if (!out.length) {
        body.innerHTML = UI.emptyState({ icon:'fa-user-slash', title:'No students found', message:'No student records match the current search and filters.',
          action:'Clear Filters', actionId:'ts-clear', actionIcon:'fa-rotate-left' });
        document.getElementById('ts-pagination').innerHTML = '';
        var c = document.getElementById('ts-clear');
        if (c) c.addEventListener('click', reset);
        return;
      }

      var cols = [
        { key:'id', label:'Student ID', render:function (s) { return '<span class="badge badge-blue">' + U.esc(s.id) + '</span>'; } },
        { key:'name', label:'Name', render:function (s) { return '<div class="flex gap-8">' + UI.avatar(s.name, 'xs') + '<div><span class="cell-strong">' + U.esc(s.name) + '</span><div class="cell-mute">' + U.esc(s.email) + '</div></div></div>'; } },
        { key:'dept', label:'Department', render:function (s) { return U.esc(s.dept); } },
        { key:'sem', label:'Semester', className:'center', render:function (s) { return s.sem + 'th'; } },
        { key:'attendance', label:'Attendance', render:function (s) { return UI.progressRow(s.attendance, s.attendance >= 90 ? 'green' : s.attendance >= 80 ? '' : s.attendance >= 75 ? 'yellow' : 'red'); } },
        { key:'cgpa', label:'CGPA', className:'num', render:function (s) { return '<strong>' + U.fmtGpa(s.cgpa) + '</strong>'; } },
        { key:'status', label:'Status', render:function (s) { return UI.statusBadge(s.status); } },
        { key:'actions', label:'Actions', sortable:false, render:function (s) {
            return '<div class="action-group">' +
              '<button class="icon-action" data-st-view="' + U.esc(s.id) + '" title="View profile" aria-label="View"><i class="fas fa-eye"></i></button>' +
              '<button class="icon-action" data-st-edit="' + U.esc(s.id) + '" title="Edit student" aria-label="Edit"><i class="fas fa-pen"></i></button>' +
              '<button class="icon-action success" data-st-att="' + U.esc(s.id) + '" title="Attendance" aria-label="Attendance"><i class="fas fa-user-check"></i></button>' +
              '<button class="icon-action" data-st-res="' + U.esc(s.id) + '" title="Results" aria-label="Results"><i class="fas fa-square-poll-vertical"></i></button>' +
              '<button class="icon-action" data-st-msg="' + U.esc(s.id) + '" title="Message" aria-label="Message"><i class="fas fa-comment-dots"></i></button>' +
            '</div>';
          } }
      ];

      body.innerHTML = UI.table({ columns:cols, rows:info.items, sortKey:state.sort, sortDir:state.dir });
      body.innerHTML += UI.dataCards(info.items, function (s) {
        return '<div class="data-card"><div class="data-card-head"><div class="flex gap-8">' + UI.avatar(s.name, 'xs') +
          '<div><strong>' + U.esc(s.name) + '</strong><div class="text-mute text-xs">' + U.esc(s.id) + '</div></div></div>' + UI.statusBadge(s.status) + '</div>' +
          '<div class="data-card-grid"><div><div class="dc-label">Department</div><div class="dc-value">' + U.esc(s.dept) + '</div></div>' +
          '<div><div class="dc-label">Semester</div><div class="dc-value">' + s.sem + 'th</div></div>' +
          '<div><div class="dc-label">CGPA</div><div class="dc-value">' + U.fmtGpa(s.cgpa) + '</div></div>' +
          '<div><div class="dc-label">Attendance</div><div class="dc-value">' + s.attendance + '%</div></div></div>' +
          '<div class="action-group"><button class="btn btn-outline btn-xs" data-st-view="' + U.esc(s.id) + '"><i class="fas fa-eye"></i> View</button>' +
          '<button class="btn btn-ghost btn-xs" data-st-msg="' + U.esc(s.id) + '"><i class="fas fa-comment-dots"></i> Message</button></div></div>';
      });

      document.getElementById('ts-pagination').innerHTML = UI.pagination(info);
    }

    function reset() {
      state.q = ''; state.dept = 'All'; state.sem = 'All'; state.status = 'All'; state.page = 1;
      document.getElementById('ts-search').value = '';
      document.getElementById('ts-dept').value = 'All';
      document.getElementById('ts-sem').value = 'All';
      document.getElementById('ts-status').value = 'All';
      draw();
    }

    var si = document.getElementById('ts-search');
    si.addEventListener('input', U.debounce(function () { state.q = si.value; state.page = 1; draw(); }, 200));
    ['ts-dept','ts-sem','ts-status'].forEach(function (id) {
      document.getElementById(id).addEventListener('change', function () {
        if (id === 'ts-dept') state.dept = this.value;
        else if (id === 'ts-sem') state.sem = this.value;
        else state.status = this.value;
        state.page = 1; draw();
      });
    });
    document.getElementById('ts-reset').addEventListener('click', reset);

    host.addEventListener('click', function (e) {
      var p = e.target.closest('[data-page]');
      if (p) { state.page = Number(p.getAttribute('data-page')); draw(); window.scrollTo({ top:0, behavior:'smooth' }); return; }
      var th = e.target.closest('th[data-sort]');
      if (th) {
        var key = th.getAttribute('data-sort');
        if (state.sort === key) state.dir = state.dir === 'asc' ? 'desc' : 'asc';
        else { state.sort = key; state.dir = 'asc'; }
        draw();
        return;
      }
      var v = e.target.closest('[data-st-view]');
      if (v) { viewStudent(v.getAttribute('data-st-view'), ctx); return; }
      var ed = e.target.closest('[data-st-edit]');
      if (ed) { editStudent(ed.getAttribute('data-st-edit'), draw); return; }
      var at = e.target.closest('[data-st-att]');
      if (at) { if (ctx.go) ctx.go('attendance'); return; }
      var rs = e.target.closest('[data-st-res]');
      if (rs) { if (ctx.go) ctx.go('results'); return; }
      var ms = e.target.closest('[data-st-msg]');
      if (ms) {
        var st = find(ms.getAttribute('data-st-msg'));
        UI.toast('info', 'Opening conversation', 'Starting a message thread with ' + (st ? st.name : 'the student') + '.');
        if (ctx.go) setTimeout(function () { ctx.go('messages'); }, 600);
      }
    });

    function find(id) { return (global.SRMS_DATA.studentRoster || []).filter(function (x) { return x.id === id; })[0]; }

    document.getElementById('ts-export').addEventListener('click', function () {
      var out = rows();
      U.download('srms-students.csv', U.toCSV(out.map(function (s) {
        return { ID:s.id, Name:s.name, Email:s.email, Department:s.dept, Semester:s.sem, Section:s.section, Attendance:s.attendance + '%', CGPA:U.fmtGpa(s.cgpa), Status:s.status };
      }), ['ID','Name','Email','Department','Semester','Section','Attendance','CGPA','Status']), 'text/csv');
      UI.toast('success', 'Export complete', out.length + ' student records exported.');
    });

    document.getElementById('ts-import').addEventListener('click', function () {
      UI.modal({ title:'Import Students', subtitle:'Bulk upload student records from a CSV file.',
        body:'<div class="form-group"><label class="field-label">CSV File</label><div class="input-wrap"><input type="file" id="imp-file" accept=".csv"></div>' +
          '<span class="helper-text">Required columns: ID, Name, Email, Department, Semester, Section</span></div>' +
          UI.alert({ tone:'info', title:'Template available', message:'Download the sample CSV template from the Downloads page before importing.' }),
        footer:'<button class="btn btn-outline" data-modal-close>Cancel</button><button class="btn btn-primary" id="imp-go"><i class="fas fa-upload"></i> Import Records</button>',
        onMount:function (m) { m.on('#imp-go', 'click', function () {
          if (!m.el.querySelector('#imp-file').files.length) { UI.toast('error', 'No file selected', 'Choose a CSV file to import.'); return; }
          m.close(); UI.toast('success', 'Import complete', '12 new student records were imported successfully.');
        }); } });
    });

    document.getElementById('ts-add').addEventListener('click', function () { addStudent(draw); });

    draw();
  }

  /* ------------------------------------------------------- VIEW STUDENT */
  function findStudent(id) {
    return (global.SRMS_DATA.studentRoster || []).filter(function (x) { return x.id === id; })[0];
  }

  function viewStudent(id, ctx) {
    var s = findStudent(id);
    if (!s) return;
    var D = global.SRMS_DATA;
    var att = (D.subjectAttendance || []).slice(0, 5);
    var standing = s.cgpa >= 3.5 ? 'Excellent' : s.cgpa >= 3.0 ? 'Good' : s.cgpa >= 2.5 ? 'Satisfactory' : 'Needs Improvement';
    UI.modal({
      title:s.name, subtitle:s.id + ' \u00b7 ' + s.program, size:'lg',
      body:'<div class="flex gap-16 flex-wrap mb-16">' + UI.avatar(s.name, 'lg') +
        '<div style="flex:1;min-width:200px"><div class="chip-row">' + UI.statusBadge(s.status) + UI.badge(s.dept, 'blue') + UI.badge('Semester ' + s.sem, 'purple') + '</div>' +
        '<dl class="info-grid mt-12">' +
          '<div class="info-item"><dt>Email</dt><dd>' + U.esc(s.email) + '</dd></div>' +
          '<div class="info-item"><dt>Phone</dt><dd>' + U.esc(s.phone) + '</dd></div>' +
          '<div class="info-item"><dt>Section</dt><dd>' + U.esc(s.section) + '</dd></div>' +
          '<div class="info-item"><dt>Batch</dt><dd>' + U.esc(s.batch) + '</dd></div>' +
          '<div class="info-item"><dt>Advisor</dt><dd>' + U.esc(s.advisor) + '</dd></div>' +
          '<div class="info-item"><dt>Standing</dt><dd>' + standing + '</dd></div>' +
        '</dl></div></div>' +
        '<div class="kpi-strip">' +
          '<div class="kpi-cell"><div class="kpi-label">CGPA</div><div class="kpi-val">' + U.fmtGpa(s.cgpa) + '</div></div>' +
          '<div class="kpi-cell"><div class="kpi-label">Attendance</div><div class="kpi-val">' + s.attendance + '%</div></div>' +
          '<div class="kpi-cell"><div class="kpi-label">Semester</div><div class="kpi-val">' + s.sem + '</div></div>' +
          '<div class="kpi-cell"><div class="kpi-label">Section</div><div class="kpi-val">' + U.esc(s.section) + '</div></div>' +
        '</div>' +
        '<div class="divider"></div>' +
        '<h4 style="font-size:13.6px;margin-bottom:12px">Subject Attendance</h4>' + UI.meterList(att.map(function (a) {
          return { label:a.code + ' ' + a.name, value:a.percentage + '%', percent:a.percentage, tone: a.percentage >= 90 ? 'green' : a.percentage >= 80 ? '' : a.percentage >= 75 ? 'yellow' : 'red' };
        })),
      footer:'<button class="btn btn-outline" data-modal-close>Close</button>' +
             '<button class="btn btn-ghost" id="vs-att"><i class="fas fa-user-check"></i> Attendance</button>' +
             '<button class="btn btn-primary" id="vs-msg"><i class="fas fa-comment-dots"></i> Message Student</button>',
      onMount:function (m) {
        m.on('#vs-att', 'click', function () { m.close(); if (ctx.go) ctx.go('attendance'); });
        m.on('#vs-msg', 'click', function () { m.close(); UI.toast('info', 'Composing message', 'Starting a conversation with ' + s.name + '.'); if (ctx.go) setTimeout(function () { ctx.go('messages'); }, 500); });
      }
    });
  }

  /* --------------------------------------------------- ADD / EDIT STUDENT */
  function studentForm(existing, onSaved) {
    var isEdit = !!existing;
    var s = existing || { id:'STU-2021-00' + Math.floor(30 + Math.random() * 60), name:'', email:'', phone:'', dept:'Computer Science', program:'BS Computer Science', sem:5, section:'A', batch:'2021-2025', advisor:'Dr. Ahmad Hassan', status:'Active' };
    UI.modal({
      title:isEdit ? 'Edit Student' : 'Add New Student', subtitle:isEdit ? 'Update the student record.' : 'Create a new student account and enrolment record.', size:'lg',
      body:'<div class="form-grid">' +
        '<div class="form-group"><label class="field-label">Student ID</label><div class="input-wrap no-icon"><input id="sf-id" value="' + U.esc(s.id) + '"' + (isEdit ? ' readonly' : '') + '></div></div>' +
        '<div class="form-group"><label class="field-label">Full Name</label><div class="input-wrap no-icon"><input id="sf-name" value="' + U.esc(s.name) + '" placeholder="Enter full name"></div></div>' +
        '<div class="form-group"><label class="field-label">Email</label><div class="input-wrap"><i class="fas fa-envelope input-icon"></i><input id="sf-email" value="' + U.esc(s.email) + '" placeholder="student@university.edu"></div></div>' +
        '<div class="form-group"><label class="field-label">Phone</label><div class="input-wrap"><i class="fas fa-phone input-icon"></i><input id="sf-phone" value="' + U.esc(s.phone || '') + '" placeholder="+92 300 0000000"></div></div>' +
        '<div class="form-group"><label class="field-label">Department</label><div class="input-wrap no-icon"><select id="sf-dept">' +
          (global.SRMS_DATA.departments || []).map(function (d) { return '<option' + (s.dept === d.name ? ' selected' : '') + '>' + U.esc(d.name) + '</option>'; }).join('') + '</select></div></div>' +
        '<div class="form-group"><label class="field-label">Program</label><div class="input-wrap no-icon"><input id="sf-prog" value="' + U.esc(s.program) + '"></div></div>' +
        '<div class="form-group"><label class="field-label">Semester</label><div class="input-wrap no-icon"><select id="sf-sem">' +
          [1,2,3,4,5,6,7,8].map(function (n) { return '<option value="' + n + '"' + (Number(s.sem) === n ? ' selected' : '') + '>' + n + 'th Semester</option>'; }).join('') + '</select></div></div>' +
        '<div class="form-group"><label class="field-label">Section</label><div class="input-wrap no-icon"><select id="sf-sec">' +
          ['A','B','C'].map(function (n) { return '<option' + (s.section === n ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select></div></div>' +
        '<div class="form-group"><label class="field-label">Batch</label><div class="input-wrap no-icon"><input id="sf-batch" value="' + U.esc(s.batch) + '"></div></div>' +
        '<div class="form-group"><label class="field-label">Advisor</label><div class="input-wrap no-icon"><input id="sf-advisor" value="' + U.esc(s.advisor) + '"></div></div>' +
        '<div class="form-group"><label class="field-label">Status</label><div class="input-wrap no-icon"><select id="sf-status">' +
          ['Active','Warning','Probation','Inactive'].map(function (n) { return '<option' + (s.status === n ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select></div></div>' +
      '</div><span class="field-error" id="sf-error"></span>',
      footer:'<button class="btn btn-outline" data-modal-close>Cancel</button>' +
             '<button class="btn btn-primary" id="sf-save"><i class="fas fa-check"></i> ' + (isEdit ? 'Save Changes' : 'Create Student') + '</button>',
      onMount:function (m) {
        m.on('#sf-save', 'click', function () {
          var name = m.el.querySelector('#sf-name').value.trim();
          var email = m.el.querySelector('#sf-email').value.trim();
          var phone = m.el.querySelector('#sf-phone').value.trim();
          var err = m.el.querySelector('#sf-error');
          if (!U.minLen(name, 3)) { err.textContent = 'Full name must be at least 3 characters.'; return; }
          if (!U.isEmail(email)) { err.textContent = 'Enter a valid email address.'; return; }
          if (phone && !U.isPhone(phone)) { err.textContent = 'Enter a valid phone number.'; return; }
          err.textContent = '';
          var data = {
            id:m.el.querySelector('#sf-id').value.trim(), name:name, email:email, phone:phone,
            dept:m.el.querySelector('#sf-dept').value, program:m.el.querySelector('#sf-prog').value.trim(),
            sem:Number(m.el.querySelector('#sf-sem').value), section:m.el.querySelector('#sf-sec').value,
            batch:m.el.querySelector('#sf-batch').value.trim(), advisor:m.el.querySelector('#sf-advisor').value.trim(),
            status:m.el.querySelector('#sf-status').value
          };
          if (isEdit) {
            Object.assign(existing, data);
            m.close();
            UI.toast('success', 'Student updated', name + '\u2019s record has been saved.');
          } else {
            data.attendance = 0; data.cgpa = 0.0;
            (global.SRMS_DATA.studentRoster || []).unshift(data);
            m.close();
            UI.toast('success', 'Student created', name + ' has been added with ID ' + data.id + '.');
          }
          if (typeof onSaved === 'function') onSaved();
        });
      }
    });
  }

  function addStudent(onSaved) { studentForm(null, onSaved); }
  function editStudent(id, onSaved) { studentForm(findStudent(id), onSaved); }

  R.add('students', 'teacher', { title:'Students', crumbs:['Teaching','Students'], render:studentsPage });
  global.SRMS_TEACHER_STUDENTS = { studentForm:studentForm, viewStudent:viewStudent };
})(window);
