/* =============================================================================
   SRMS - Admin Teacher Management  (js/pages/admin/teachers.js)
   Faculty directory with add, edit, view, delete and course assignment.
   ========================================================================== */
(function (global) {
  'use strict';
  var U = global.SRMS_UTIL;
  var UI = global.SRMS_UI;
  var R = global.SRMS_ROUTES;

  var state = { q:'', dept:'All', status:'All', sort:'name', dir:'asc', page:1, per:8 };
  var extra = [];

  function rows() {
    var out = ((global.SRMS_DATA.teachers || []).concat(extra)).slice();
    if (state.q) {
      var q = state.q.toLowerCase();
      out = out.filter(function (t) { return (t.name + ' ' + t.id + ' ' + t.email + ' ' + t.dept).toLowerCase().indexOf(q) > -1; });
    }
    if (state.dept !== 'All') out = out.filter(function (t) { return t.dept === state.dept; });
    if (state.status !== 'All') out = out.filter(function (t) { return t.status === state.status; });
    return U.sortBy(out, state.sort, state.dir);
  }

  function find(id) {
    return ((global.SRMS_DATA.teachers || []).concat(extra)).filter(function (t) { return t.id === id; })[0];
  }

  function teachersPage(host, ctx) {
    var D = global.SRMS_DATA;
    var list = (D.teachers || []).concat(extra);
    var depts = U.unique(list.map(function (t) { return t.dept; })).sort();

    host.innerHTML =
      UI.pageHead({ title:'Teacher Management', subtitle:'Manage faculty records, designations and course assignments.',
        actions:'<button class="btn btn-outline" id="tch-export"><i class="fas fa-file-export"></i> Export</button>' +
                '<button class="btn btn-primary" id="tch-add"><i class="fas fa-user-plus"></i> Add Teacher</button>' }) +

      '<div class="grid grid-4 mb-16">' +
        UI.statCard({ title:'Total Faculty', value:list.length, suffix:'teachers', icon:'fa-chalkboard-user', tone:'blue', note:'Across all departments' }) +
        UI.statCard({ title:'Active', value:list.filter(function (t) { return t.status === 'Active'; }).length, suffix:'faculty', icon:'fa-circle-check', tone:'green', note:'Currently teaching' }) +
        UI.statCard({ title:'On Leave', value:list.filter(function (t) { return t.status !== 'Active' && t.status !== 'Inactive'; }).length, suffix:'faculty', icon:'fa-plane-departure', tone:'yellow', note:'Approved leave or sabbatical' }) +
        UI.statCard({ title:'Average Rating', value:U.fmtGpa(U.avg(list, 'rating')), suffix:'/ 5.00', icon:'fa-star', tone:'purple', note:'Student feedback score' }) +
      '</div>' +

      '<div class="card card-flush">' +
        '<div class="table-toolbar" style="padding:18px 20px 0">' +
          '<div class="table-tools">' +
            UI.searchBox('tch-search', 'Search faculty by name, ID or department...', state.q) +
            UI.selectBox('tch-dept', [{ value:'All', label:'All Departments' }].concat(depts.map(function (d) { return { value:d, label:d }; })), state.dept, 'Filter department') +
            UI.selectBox('tch-status', ['All','Active','On Leave','Inactive'], state.status, 'Filter status') +
            UI.selectBox('tch-sort', [{ value:'name', label:'Sort: Name' }, { value:'students', label:'Sort: Students' }, { value:'experience', label:'Sort: Experience' }], state.sort, 'Sort') +
          '</div>' +
          '<div class="card-head-actions"><button class="btn btn-outline btn-sm" id="tch-reset"><i class="fas fa-rotate-left"></i> Reset</button></div>' +
        '</div>' +
        '<div style="padding:18px 20px 0" id="tch-body"></div>' +
        '<div id="tch-pagination" style="padding:0 20px 18px"></div>' +
      '</div>';

    function draw() {
      var out = rows();
      var info = U.paginate(out, state.page, state.per);
      var body = document.getElementById('tch-body');
      if (!out.length) {
        body.innerHTML = UI.emptyState({ icon:'fa-user-slash', title:'No faculty found', message:'No teacher records match the current filters.',
          action:'Clear Filters', actionId:'tch-clear', actionIcon:'fa-rotate-left' });
        document.getElementById('tch-pagination').innerHTML = '';
        var c = document.getElementById('tch-clear');
        if (c) c.addEventListener('click', reset);
        return;
      }

      var cols = [
        { key:'id', label:'Teacher ID', render:function (t) { return '<span class="badge badge-purple">' + U.esc(t.id) + '</span>'; } },
        { key:'name', label:'Name', render:function (t) { return '<div class="flex gap-8">' + UI.avatar(t.name, 'xs') + '<div><span class="cell-strong">' + U.esc(t.name) + '</span><div class="cell-mute">' + U.esc(t.email) + '</div></div></div>'; } },
        { key:'dept', label:'Department' },
        { key:'designation', label:'Designation', render:function (t) { return '<span class="cell-mute">' + U.esc(t.designation) + '</span>'; } },
        { key:'courses', label:'Courses', render:function (t) { return '<div class="chip-row">' + (t.courses || []).slice(0, 2).map(function (c) { return UI.badge(c, 'blue'); }).join('') + ((t.courses || []).length > 2 ? UI.badge('+' + (t.courses.length - 2), 'gray') : '') + '</div>'; } },
        { key:'phone', label:'Phone', render:function (t) { return '<span class="cell-mute">' + U.esc(t.phone) + '</span>'; } },
        { key:'status', label:'Status', render:function (t) { return UI.statusBadge(t.status); } },
        { key:'actions', label:'Actions', sortable:false, render:function (t) {
            return '<div class="action-group">' +
              '<button class="icon-action" data-tv="' + U.esc(t.id) + '" title="View" aria-label="View"><i class="fas fa-eye"></i></button>' +
              '<button class="icon-action" data-te="' + U.esc(t.id) + '" title="Edit" aria-label="Edit"><i class="fas fa-pen"></i></button>' +
              '<button class="icon-action success" data-ta="' + U.esc(t.id) + '" title="Assign course" aria-label="Assign"><i class="fas fa-book"></i></button>' +
              '<button class="icon-action danger" data-td="' + U.esc(t.id) + '" title="Delete" aria-label="Delete"><i class="fas fa-trash"></i></button></div>';
          } }
      ];

      body.innerHTML = UI.table({ columns:cols, rows:info.items, sortKey:state.sort, sortDir:state.dir }) +
        UI.dataCards(info.items, function (t) {
          return '<div class="data-card"><div class="data-card-head"><div class="flex gap-8">' + UI.avatar(t.name, 'xs') + '<div><strong>' + U.esc(t.name) + '</strong><div class="text-mute text-xs">' + U.esc(t.designation) + '</div></div></div>' + UI.statusBadge(t.status) + '</div>' +
            '<div class="data-card-grid"><div><div class="dc-label">ID</div><div class="dc-value">' + U.esc(t.id) + '</div></div>' +
            '<div><div class="dc-label">Department</div><div class="dc-value">' + U.esc(t.dept) + '</div></div>' +
            '<div><div class="dc-label">Courses</div><div class="dc-value">' + (t.courses || []).join(', ') + '</div></div>' +
            '<div><div class="dc-label">Rating</div><div class="dc-value">' + t.rating + '</div></div></div></div>';
        });

      document.getElementById('tch-pagination').innerHTML = UI.pagination(info);
    }

    function reset() {
      state.q = ''; state.dept = 'All'; state.status = 'All'; state.page = 1;
      document.getElementById('tch-search').value = '';
      document.getElementById('tch-dept').value = 'All';
      document.getElementById('tch-status').value = 'All';
      draw();
    }

    var si = document.getElementById('tch-search');
    si.addEventListener('input', U.debounce(function () { state.q = si.value; state.page = 1; draw(); }, 200));
    ['tch-dept','tch-status'].forEach(function (id) {
      document.getElementById(id).addEventListener('change', function () {
        if (id === 'tch-dept') state.dept = this.value; else state.status = this.value;
        state.page = 1; draw();
      });
    });
    document.getElementById('tch-sort').addEventListener('change', function () { state.sort = this.value; draw(); });
    document.getElementById('tch-reset').addEventListener('click', reset);

    host.addEventListener('click', function (e) {
      var p = e.target.closest('[data-page]');
      if (p) { state.page = Number(p.getAttribute('data-page')); draw(); window.scrollTo({ top:0, behavior:'smooth' }); return; }
      var v = e.target.closest('[data-tv]');
      if (v) { viewTeacher(v.getAttribute('data-tv')); return; }
      var ed = e.target.closest('[data-te]');
      if (ed) { openForm(find(ed.getAttribute('data-te')), draw); return; }
      var a = e.target.closest('[data-ta]');
      if (a) { assignCourse(find(a.getAttribute('data-ta')), draw); return; }
      var d = e.target.closest('[data-td]');
      if (d) {
        var t = find(d.getAttribute('data-td'));
        UI.confirm({ title:'Remove faculty member?', message:'\u201c' + (t ? t.name : '') + '\u201d will be deactivated and unassigned from all courses. Historical records are preserved.', tone:'danger', confirmText:'Remove Faculty',
          onConfirm:function () {
            global.SRMS_DATA.teachers = (global.SRMS_DATA.teachers || []).filter(function (x) { return x.id !== t.id; });
            extra = extra.filter(function (x) { return x.id !== t.id; });
            UI.toast('success', 'Faculty removed', t.name + ' has been removed from the directory.');
            draw();
          } });
      }
    });

    document.getElementById('tch-add').addEventListener('click', function () { openForm(null, draw); });

    document.getElementById('tch-export').addEventListener('click', function () {
      var out = rows();
      U.download('srms-teachers.csv', U.toCSV(out.map(function (t) {
        return { ID:t.id, Name:t.name, Email:t.email, Department:t.dept, Designation:t.designation, Courses:(t.courses || []).join(' | '), Phone:t.phone, Students:t.students, Experience:t.experience + ' years', Rating:t.rating, Status:t.status };
      }), ['ID','Name','Email','Department','Designation','Courses','Phone','Students','Experience','Rating','Status']), 'text/csv');
      UI.toast('success', 'Export complete', out.length + ' faculty records exported.');
    });

    function viewTeacher(id) {
      var t = find(id);
      if (!t) return;
      UI.modal({
        title:t.name, subtitle:t.designation + ' \u00b7 ' + t.dept, size:'lg',
        body:'<div class="flex gap-16 flex-wrap mb-16">' + UI.avatar(t.name, 'lg') +
          '<div style="flex:1;min-width:220px"><div class="chip-row">' + UI.statusBadge(t.status) + UI.badge(t.id, 'purple') + UI.badge('Rating ' + t.rating, 'yellow', 'fa-star') + '</div>' +
          '<dl class="info-grid mt-12">' +
            '<div class="info-item"><dt>Email</dt><dd>' + U.esc(t.email) + '</dd></div>' +
            '<div class="info-item"><dt>Phone</dt><dd>' + U.esc(t.phone) + '</dd></div>' +
            '<div class="info-item"><dt>Experience</dt><dd>' + t.experience + ' years</dd></div>' +
            '<div class="info-item"><dt>Students</dt><dd>' + t.students + '</dd></div>' +
            '<div class="info-item"><dt>Courses</dt><dd>' + (t.courses || []).join(', ') + '</dd></div>' +
            '<div class="info-item"><dt>Department</dt><dd>' + U.esc(t.dept) + '</dd></div>' +
          '</dl></div></div>' +
          '<div class="kpi-strip"><div class="kpi-cell"><div class="kpi-label">Rating</div><div class="kpi-val">' + t.rating + '</div></div>' +
            '<div class="kpi-cell"><div class="kpi-label">Experience</div><div class="kpi-val">' + t.experience + 'y</div></div>' +
            '<div class="kpi-cell"><div class="kpi-label">Students</div><div class="kpi-val">' + t.students + '</div></div>' +
            '<div class="kpi-cell"><div class="kpi-label">Courses</div><div class="kpi-val">' + (t.courses || []).length + '</div></div></div>',
        footer:'<button class="btn btn-outline" data-modal-close>Close</button><button class="btn btn-primary" id="tv-edit"><i class="fas fa-pen"></i> Edit Faculty</button>',
        onMount:function (m) { m.on('#tv-edit', 'click', function () { m.close(); openForm(t, draw); }); }
      });
    }

    function openForm(existing, onSaved) {
      var isEdit = !!existing;
      var t = existing || { id:'TCH-10' + Math.floor(13 + Math.random() * 86), name:'', email:'', dept:'Computer Science', designation:'Lecturer', courses:[], phone:'', status:'Active', experience:1, rating:4.0, students:0 };
      UI.modal({
        title:isEdit ? 'Edit Faculty' : 'Add New Faculty', subtitle:isEdit ? 'Update the faculty record.' : 'Create a new faculty account.', size:'lg',
        body:'<div class="form-grid">' +
          '<div class="form-group"><label class="field-label">Teacher ID</label><div class="input-wrap no-icon"><input id="tf-id" value="' + U.esc(t.id) + '"' + (isEdit ? ' readonly' : '') + '></div></div>' +
          '<div class="form-group"><label class="field-label">Full Name</label><div class="input-wrap no-icon"><input id="tf-name" value="' + U.esc(t.name) + '"></div></div>' +
          '<div class="form-group"><label class="field-label">Email</label><div class="input-wrap"><i class="fas fa-envelope input-icon"></i><input id="tf-email" value="' + U.esc(t.email) + '"></div></div>' +
          '<div class="form-group"><label class="field-label">Phone</label><div class="input-wrap"><i class="fas fa-phone input-icon"></i><input id="tf-phone" value="' + U.esc(t.phone) + '"></div></div>' +
          '<div class="form-group"><label class="field-label">Department</label><div class="input-wrap no-icon"><select id="tf-dept">' +
            (D.departments || []).map(function (d2) { return '<option' + (t.dept === d2.name ? ' selected' : '') + '>' + U.esc(d2.name) + '</option>'; }).join('') + '</select></div></div>' +
          '<div class="form-group"><label class="field-label">Designation</label><div class="input-wrap no-icon"><select id="tf-desig">' +
            ['Professor','Associate Professor','Assistant Professor','Lecturer'].map(function (n) { return '<option' + (t.designation === n ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select></div></div>' +
          '<div class="form-group"><label class="field-label">Experience (years)</label><div class="input-wrap no-icon"><input type="number" id="tf-exp" value="' + (t.experience || 1) + '" min="0" max="45"></div></div>' +
          '<div class="form-group"><label class="field-label">Status</label><div class="input-wrap no-icon"><select id="tf-status">' +
            ['Active','On Leave','Inactive'].map(function (n) { return '<option' + (t.status === n ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select></div></div>' +
        '</div><span class="field-error" id="tf-error"></span>',
        footer:'<button class="btn btn-outline" data-modal-close>Cancel</button><button class="btn btn-primary" id="tf-save"><i class="fas fa-check"></i> ' + (isEdit ? 'Save Changes' : 'Create Faculty') + '</button>',
        onMount:function (m) {
          m.on('#tf-save', 'click', function () {
            var name = m.el.querySelector('#tf-name').value.trim();
            var email = m.el.querySelector('#tf-email').value.trim();
            var err = m.el.querySelector('#tf-error');
            if (!U.minLen(name, 3)) { err.textContent = 'Full name must be at least 3 characters.'; return; }
            if (!U.isEmail(email)) { err.textContent = 'Enter a valid email address.'; return; }
            err.textContent = '';
            var data = { id:m.el.querySelector('#tf-id').value.trim(), name:name, email:email, phone:m.el.querySelector('#tf-phone').value.trim(),
              dept:m.el.querySelector('#tf-dept').value, designation:m.el.querySelector('#tf-desig').value,
              experience:Number(m.el.querySelector('#tf-exp').value) || 0, status:m.el.querySelector('#tf-status').value,
              courses:t.courses || [], students:t.students || 0, rating:t.rating || 4.0 };
            if (isEdit) { Object.assign(existing, data); m.close(); UI.toast('success', 'Faculty updated', data.name + '\u2019s record has been saved.'); }
            else { extra.push(data); m.close(); UI.toast('success', 'Faculty created', data.name + ' has been added to the directory.'); }
            onSaved();
          });
        }
      });
    }

    function assignCourse(t, onSaved) {
      if (!t) return;
      var assigned = (t.courses || []).slice();
      var allCourses = global.SRMS_DATA.courses || [];
      UI.modal({
        title:'Assign Courses', subtitle:t.name + ' \u00b7 ' + t.dept,
        body:'<p class="text-soft text-sm mb-12">Select every course this faculty member should teach. Existing selections are pre-checked.</p>' +
          '<div class="list-simple" style="max-height:300px;overflow-y:auto">' + allCourses.map(function (c) {
            var on = assigned.indexOf(c.code) > -1;
            return '<label class="list-row" style="cursor:pointer"><div class="list-row-main"><strong>' + U.esc(c.code + ' - ' + c.name) + '</strong>' +
              '<span>' + c.credits + ' credits \u00b7 Semester ' + c.semester + '</span></div>' +
              '<input type="checkbox" data-course-code="' + U.esc(c.code) + '"' + (on ? ' checked' : '') + '><span class="checkbox-box"><i class="fas fa-check"></i></span></label>';
          }).join('') + '</div>',
        footer:'<button class="btn btn-outline" data-modal-close>Cancel</button><button class="btn btn-primary" id="ac-save"><i class="fas fa-check"></i> Save Assignments</button>',
        onMount:function (m) {
          m.on('#ac-save', 'click', function () {
            var picked = U.qsa('[data-course-code]', m.el).filter(function (i) { return i.checked; }).map(function (i) { return i.getAttribute('data-course-code'); });
            t.courses = picked;
            m.close();
            UI.toast('success', 'Courses assigned', t.name + ' is now teaching ' + picked.length + ' course' + (picked.length === 1 ? '' : 's') + '.');
            onSaved();
          });
        }
      });
    }

    draw();
  }

  R.add('teachers', 'admin', { title:'Teacher Management', crumbs:['Management','Teachers'], render:teachersPage });
})(window);
