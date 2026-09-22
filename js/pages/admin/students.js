/* =============================================================================
   SRMS - Admin Student Management  (js/pages/admin/students.js)
   Full CRUD over the student directory: add, edit, view, delete and export,
   with search, filters, sorting and pagination.
   ========================================================================== */
(function (global) {
  'use strict';
  var U = global.SRMS_UTIL;
  var UI = global.SRMS_UI;
  var R = global.SRMS_ROUTES;

  var state = { q:'', dept:'All', sem:'All', status:'All', batch:'All', sort:'name', dir:'asc', page:1, per:8 };

  function rows() {
    var out = (global.SRMS_DATA.studentRoster || []).slice();
    if (state.q) {
      var q = state.q.toLowerCase();
      out = out.filter(function (s) { return (s.name + ' ' + s.id + ' ' + s.email).toLowerCase().indexOf(q) > -1; });
    }
    if (state.dept !== 'All') out = out.filter(function (s) { return s.dept === state.dept; });
    if (state.sem !== 'All') out = out.filter(function (s) { return String(s.sem) === String(state.sem); });
    if (state.status !== 'All') out = out.filter(function (s) { return s.status === state.status; });
    if (state.batch !== 'All') out = out.filter(function (s) { return s.batch === state.batch; });
    return U.sortBy(out, state.sort, state.dir);
  }

  function find(id) { return (global.SRMS_DATA.studentRoster || []).filter(function (x) { return x.id === id; })[0]; }

  function studentsPage(host, ctx) {
    var D = global.SRMS_DATA;
    var list = D.studentRoster || [];
    var depts = U.unique(list.map(function (s) { return s.dept; })).sort();
    var batches = U.unique(list.map(function (s) { return s.batch; })).sort();

    host.innerHTML =
      UI.pageHead({ title:'Student Management', subtitle:'Create, update, inspect and remove student records across the institution.',
        actions:'<button class="btn btn-outline" id="as-import"><i class="fas fa-file-import"></i> Import</button>' +
                '<button class="btn btn-outline" id="as-export"><i class="fas fa-file-export"></i> Export All</button>' +
                '<button class="btn btn-primary" id="as-add"><i class="fas fa-user-plus"></i> Add Student</button>' }) +

      '<div class="grid grid-4 mb-16">' +
        UI.statCard({ title:'Total Students', value:U.fmtNum((D.analytics || {}).adminStats ? (D.analytics.adminStats.totalStudents || 2450) : 2450), icon:'fa-user-graduate', tone:'blue', note:list.length + ' records loaded in this view' }) +
        UI.statCard({ title:'Active', value:list.filter(function (s) { return s.status === 'Active'; }).length, suffix:'students', icon:'fa-circle-check', tone:'green', note:'In good academic standing' }) +
        UI.statCard({ title:'Warnings', value:list.filter(function (s) { return s.status === 'Warning'; }).length, suffix:'students', icon:'fa-triangle-exclamation', tone:'yellow', note:'Attendance or grades below threshold' }) +
        UI.statCard({ title:'Probation', value:list.filter(function (s) { return s.status === 'Probation'; }).length, suffix:'students', icon:'fa-user-clock', tone:'red', note:'Under academic review' }) +
      '</div>' +

      '<div class="card card-flush">' +
        '<div class="table-toolbar" style="padding:18px 20px 0">' +
          '<div class="table-tools">' +
            UI.searchBox('adm-s-search', 'Search by name, ID or email...', state.q) +
            UI.selectBox('adm-s-dept', [{ value:'All', label:'All Departments' }].concat(depts.map(function (d) { return { value:d, label:d }; })), state.dept, 'Filter department') +
            UI.selectBox('adm-s-sem', [{ value:'All', label:'All Semesters' }].concat(U.unique(list.map(function (s) { return s.sem; })).sort().map(function (s) { return { value:s, label:s + 'th Semester' }; })), state.sem, 'Filter semester') +
            UI.selectBox('adm-s-status', ['All','Active','Warning','Probation','Inactive'], state.status, 'Filter status') +
            UI.selectBox('adm-s-batch', [{ value:'All', label:'All Batches' }].concat(batches.map(function (b) { return { value:b, label:b }; })), state.batch, 'Filter batch') +
            UI.selectBox('adm-s-sort', [
              { value:'name', label:'Sort: Name' }, { value:'id', label:'Sort: Student ID' },
              { value:'cgpa', label:'Sort: CGPA' }, { value:'attendance', label:'Sort: Attendance' }
            ], state.sort, 'Sort') +
          '</div>' +
          '<div class="card-head-actions"><button class="btn btn-outline btn-sm" id="adm-s-reset"><i class="fas fa-rotate-left"></i> Reset</button></div>' +
        '</div>' +
        '<div style="padding:18px 20px 0" id="adm-s-body"></div>' +
        '<div id="adm-s-pagination" style="padding:0 20px 18px"></div>' +
      '</div>';

    function draw() {
      var out = rows();
      var info = U.paginate(out, state.page, state.per);
      var body = document.getElementById('adm-s-body');

      if (!out.length) {
        body.innerHTML = UI.emptyState({ icon:'fa-user-slash', title:'No students found', message:'No records match the current filters.',
          action:'Clear Filters', actionId:'adm-s-clear', actionIcon:'fa-rotate-left' });
        document.getElementById('adm-s-pagination').innerHTML = '';
        var c = document.getElementById('adm-s-clear');
        if (c) c.addEventListener('click', reset);
        return;
      }

      var cols = [
        { key:'id', label:'Student ID', render:function (s) { return '<span class="badge badge-blue">' + U.esc(s.id) + '</span>'; } },
        { key:'name', label:'Name', render:function (s) { return '<div class="flex gap-8">' + UI.avatar(s.name, 'xs') + '<div><span class="cell-strong">' + U.esc(s.name) + '</span><div class="cell-mute">' + U.esc(s.email) + '</div></div></div>'; } },
        { key:'dept', label:'Department' },
        { key:'program', label:'Program', render:function (s) { return '<span class="cell-mute">' + U.esc(s.program) + '</span>'; } },
        { key:'sem', label:'Sem', className:'center', render:function (s) { return s.sem + 'th'; } },
        { key:'section', label:'Section', className:'center' },
        { key:'batch', label:'Batch', className:'center' },
        { key:'cgpa', label:'CGPA', className:'num', render:function (s) { return '<strong>' + U.fmtGpa(s.cgpa) + '</strong>'; } },
        { key:'status', label:'Status', render:function (s) { return UI.statusBadge(s.status); } },
        { key:'actions', label:'Actions', sortable:false, render:function (s) {
            return '<div class="action-group">' +
              '<button class="icon-action" data-sv="' + U.esc(s.id) + '" title="View" aria-label="View"><i class="fas fa-eye"></i></button>' +
              '<button class="icon-action" data-se="' + U.esc(s.id) + '" title="Edit" aria-label="Edit"><i class="fas fa-pen"></i></button>' +
              '<button class="icon-action danger" data-sd="' + U.esc(s.id) + '" title="Delete" aria-label="Delete"><i class="fas fa-trash"></i></button>' +
            '</div>';
          } }
      ];

      body.innerHTML = UI.table({ columns:cols, rows:info.items, sortKey:state.sort, sortDir:state.dir }) +
        UI.dataCards(info.items, function (s) {
          return '<div class="data-card"><div class="data-card-head"><div class="flex gap-8">' + UI.avatar(s.name, 'xs') +
            '<div><strong>' + U.esc(s.name) + '</strong><div class="text-mute text-xs">' + U.esc(s.id) + '</div></div></div>' + UI.statusBadge(s.status) + '</div>' +
            '<div class="data-card-grid"><div><div class="dc-label">Department</div><div class="dc-value">' + U.esc(s.dept) + '</div></div>' +
            '<div><div class="dc-label">Semester</div><div class="dc-value">' + s.sem + 'th</div></div>' +
            '<div><div class="dc-label">CGPA</div><div class="dc-value">' + U.fmtGpa(s.cgpa) + '</div></div>' +
            '<div><div class="dc-label">Batch</div><div class="dc-value">' + U.esc(s.batch) + '</div></div></div>' +
            '<div class="action-group"><button class="btn btn-outline btn-xs" data-sv="' + U.esc(s.id) + '"><i class="fas fa-eye"></i> View</button>' +
            '<button class="btn btn-ghost btn-xs" data-se="' + U.esc(s.id) + '"><i class="fas fa-pen"></i> Edit</button>' +
            '<button class="btn btn-danger btn-xs" data-sd="' + U.esc(s.id) + '"><i class="fas fa-trash"></i></button></div></div>';
        });

      document.getElementById('adm-s-pagination').innerHTML = UI.pagination(info);
    }

    function reset() {
      state.q = ''; state.dept = 'All'; state.sem = 'All'; state.status = 'All'; state.batch = 'All'; state.page = 1;
      ['adm-s-search','adm-s-dept','adm-s-sem','adm-s-status','adm-s-batch'].forEach(function (id) {
        var el = document.getElementById(id); if (el) el.value = id === 'adm-s-search' ? '' : 'All';
      });
      draw();
    }

    var si = document.getElementById('adm-s-search');
    si.addEventListener('input', U.debounce(function () { state.q = si.value; state.page = 1; draw(); }, 200));
    ['adm-s-dept','adm-s-sem','adm-s-status','adm-s-batch'].forEach(function (id) {
      document.getElementById(id).addEventListener('change', function () {
        var map = { 'adm-s-dept':'dept', 'adm-s-sem':'sem', 'adm-s-status':'status', 'adm-s-batch':'batch' };
        state[map[id]] = this.value; state.page = 1; draw();
      });
    });
    document.getElementById('adm-s-sort').addEventListener('change', function () { state.sort = this.value; draw(); });
    document.getElementById('adm-s-reset').addEventListener('click', reset);

    host.addEventListener('click', function (e) {
      var p = e.target.closest('[data-page]');
      if (p) { state.page = Number(p.getAttribute('data-page')); draw(); window.scrollTo({ top:0, behavior:'smooth' }); return; }
      var th = e.target.closest('th[data-sort]');
      if (th) {
        var key = th.getAttribute('data-sort');
        if (state.sort === key) state.dir = state.dir === 'asc' ? 'desc' : 'asc'; else { state.sort = key; state.dir = 'asc'; }
        draw(); return;
      }
      var v = e.target.closest('[data-sv]');
      if (v) { viewStudent(v.getAttribute('data-sv')); return; }
      var ed = e.target.closest('[data-se]');
      if (ed) { openForm(find(ed.getAttribute('data-se')), draw); return; }
      var d = e.target.closest('[data-sd]');
      if (d) {
        var s = find(d.getAttribute('data-sd'));
        UI.confirm({ title:'Delete student record?', message:'\u201c' + (s ? s.name : '') + '\u201d (\u201c' + (s ? s.id : '') + '\u201d) will be permanently removed along with enrolment history. This action cannot be undone.', tone:'danger', confirmText:'Delete Student',
          onConfirm:function () {
            global.SRMS_DATA.studentRoster = (global.SRMS_DATA.studentRoster || []).filter(function (x) { return x.id !== s.id; });
            UI.toast('success', 'Student deleted', s.name + '\u2019s record has been permanently removed.');
            draw();
          } });
      }
    });

    document.getElementById('as-add').addEventListener('click', function () { openForm(null, draw); });

    document.getElementById('as-export').addEventListener('click', function () {
      var out = rows();
      U.download('srms-admin-students.csv', U.toCSV(out.map(function (s) {
        return { ID:s.id, Name:s.name, Email:s.email, Phone:s.phone, Department:s.dept, Program:s.program, Semester:s.sem, Section:s.section, Batch:s.batch, Advisor:s.advisor, Status:s.status, CGPA:U.fmtGpa(s.cgpa), Attendance:s.attendance + '%' };
      }), ['ID','Name','Email','Phone','Department','Program','Semester','Section','Batch','Advisor','Status','CGPA','Attendance']), 'text/csv');
      UI.toast('success', 'Export complete', out.length + ' student records exported.');
    });

    document.getElementById('as-import').addEventListener('click', function () {
      UI.modal({ title:'Bulk Import Students', subtitle:'Upload a CSV file to create or update student records.',
        body:'<div class="form-group"><label class="field-label">CSV File</label><div class="input-wrap"><input type="file" id="aimp-file" accept=".csv"></div>' +
          '<span class="helper-text">Columns: ID, Name, Email, Department, Program, Semester, Section, Batch, Advisor, Status</span></div>' +
          UI.alert({ tone:'warning', title:'Duplicate handling', message:'Existing students with a matching ID will be updated instead of duplicated.' }),
        footer:'<button class="btn btn-outline" data-modal-close>Cancel</button><button class="btn btn-primary" id="aimp-go"><i class="fas fa-upload"></i> Start Import</button>',
        onMount:function (m) { m.on('#aimp-go', 'click', function () {
          if (!m.el.querySelector('#aimp-file').files.length) { UI.toast('error', 'No file selected', 'Please choose a CSV file to import.'); return; }
          m.close(); UI.toast('success', 'Import finished', '38 students were imported or updated.');
        }); } });
    });

    function viewStudent(id) {
      var s = find(id);
      if (!s) return;
      UI.modal({
        title:s.name, subtitle:s.id + ' \u00b7 ' + s.program, size:'lg',
        body:'<div class="flex gap-16 flex-wrap mb-16">' + UI.avatar(s.name, 'lg') +
          '<div style="flex:1;min-width:220px"><div class="chip-row">' + UI.statusBadge(s.status) + UI.badge(s.dept, 'blue') + UI.badge('Section ' + s.section, 'purple') + UI.badge(s.batch, 'teal') + '</div>' +
          '<dl class="info-grid mt-12">' +
            '<div class="info-item"><dt>Email</dt><dd>' + U.esc(s.email) + '</dd></div>' +
            '<div class="info-item"><dt>Phone</dt><dd>' + U.esc(s.phone || '--') + '</dd></div>' +
            '<div class="info-item"><dt>Advisor</dt><dd>' + U.esc(s.advisor) + '</dd></div>' +
            '<div class="info-item"><dt>Attendance</dt><dd>' + s.attendance + '%</dd></div>' +
            '<div class="info-item"><dt>CGPA</dt><dd>' + U.fmtGpa(s.cgpa) + '</dd></div>' +
            '<div class="info-item"><dt>Program</dt><dd>' + U.esc(s.program) + '</dd></div>' +
          '</dl></div></div>',
        footer:'<button class="btn btn-outline" data-modal-close>Close</button><button class="btn btn-primary" id="vs-edit"><i class="fas fa-pen"></i> Edit Record</button>',
        onMount:function (m) { m.on('#vs-edit', 'click', function () { m.close(); openForm(s, draw); }); }
      });
    }

    function openForm(existing, onSaved) {
      var isEdit = !!existing;
      var s = existing || { id:'STU-2021-00' + Math.floor(30 + Math.random() * 60), name:'', email:'', phone:'', dept:'Computer Science', program:'BS Computer Science', sem:1, section:'A', batch:'2021-2025', advisor:'Dr. Ahmad Hassan', status:'Active' };
      UI.modal({
        title:isEdit ? 'Edit Student' : 'Add New Student', subtitle:'All fields marked by validation are required.', size:'lg',
        body:'<div class="form-grid">' +
          '<div class="form-group"><label class="field-label">Student ID</label><div class="input-wrap no-icon"><input id="af-id" value="' + U.esc(s.id) + '"' + (isEdit ? ' readonly' : '') + '></div></div>' +
          '<div class="form-group"><label class="field-label">Full Name</label><div class="input-wrap no-icon"><input id="af-name" value="' + U.esc(s.name) + '"></div></div>' +
          '<div class="form-group"><label class="field-label">Email</label><div class="input-wrap"><i class="fas fa-envelope input-icon"></i><input id="af-email" value="' + U.esc(s.email) + '"></div></div>' +
          '<div class="form-group"><label class="field-label">Phone</label><div class="input-wrap"><i class="fas fa-phone input-icon"></i><input id="af-phone" value="' + U.esc(s.phone || '') + '"></div></div>' +
          '<div class="form-group"><label class="field-label">Department</label><div class="input-wrap no-icon"><select id="af-dept">' +
            (D.departments || []).map(function (d2) { return '<option' + (s.dept === d2.name ? ' selected' : '') + '>' + U.esc(d2.name) + '</option>'; }).join('') + '</select></div></div>' +
          '<div class="form-group"><label class="field-label">Program</label><div class="input-wrap no-icon"><input id="af-prog" value="' + U.esc(s.program) + '"></div></div>' +
          '<div class="form-group"><label class="field-label">Semester</label><div class="input-wrap no-icon"><select id="af-sem">' +
            [1,2,3,4,5,6,7,8].map(function (n) { return '<option value="' + n + '"' + (Number(s.sem) === n ? ' selected' : '') + '>' + n + 'th</option>'; }).join('') + '</select></div></div>' +
          '<div class="form-group"><label class="field-label">Section</label><div class="input-wrap no-icon"><select id="af-sec">' +
            ['A','B','C'].map(function (n) { return '<option' + (s.section === n ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select></div></div>' +
          '<div class="form-group"><label class="field-label">Batch</label><div class="input-wrap no-icon"><input id="af-batch" value="' + U.esc(s.batch) + '"></div></div>' +
          '<div class="form-group"><label class="field-label">Advisor</label><div class="input-wrap no-icon"><input id="af-adv" value="' + U.esc(s.advisor) + '"></div></div>' +
          '<div class="form-group"><label class="field-label">Status</label><div class="input-wrap no-icon"><select id="af-status">' +
            ['Active','Warning','Probation','Inactive'].map(function (n) { return '<option' + (s.status === n ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select></div></div>' +
        '</div><span class="field-error" id="af-error"></span>',
        footer:'<button class="btn btn-outline" data-modal-close>Cancel</button>' +
               '<button class="btn btn-primary" id="af-save"><i class="fas fa-check"></i> ' + (isEdit ? 'Save Changes' : 'Create Student') + '</button>',
        onMount:function (m) {
          m.on('#af-save', 'click', function () {
            var name = m.el.querySelector('#af-name').value.trim();
            var email = m.el.querySelector('#af-email').value.trim();
            var err = m.el.querySelector('#af-error');
            if (!U.minLen(name, 3)) { err.textContent = 'Full name must be at least 3 characters.'; return; }
            if (!U.isEmail(email)) { err.textContent = 'Enter a valid email address.'; return; }
            err.textContent = '';
            var data = { id:m.el.querySelector('#af-id').value.trim(), name:name, email:email, phone:m.el.querySelector('#af-phone').value.trim(),
              dept:m.el.querySelector('#af-dept').value, program:m.el.querySelector('#af-prog').value.trim(), sem:Number(m.el.querySelector('#af-sem').value),
              section:m.el.querySelector('#af-sec').value, batch:m.el.querySelector('#af-batch').value.trim(), advisor:m.el.querySelector('#af-adv').value.trim(), status:m.el.querySelector('#af-status').value };
            if (isEdit) { Object.assign(existing, data); m.close(); UI.toast('success', 'Student updated', data.name + '\u2019s record has been saved.'); }
            else {
              data.attendance = 0; data.cgpa = 0;
              (global.SRMS_DATA.studentRoster || []).unshift(data);
              m.close(); UI.toast('success', 'Student created', data.name + ' has been enrolled with ID ' + data.id + '.');
            }
            onSaved();
          });
        }
      });
    }

    draw();
  }

  R.add('students', 'admin', { title:'Student Management', crumbs:['Management','Students'], render:studentsPage });
})(window);
