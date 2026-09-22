/* =============================================================================
   SRMS - Admin Exam Management  (js/pages/admin/exams.js)
   Create Midterm, Final, Quiz, Practical and Assignment exams with course,
   date, time, room, teacher, semester and section. Full CRUD with confirmation.
   ========================================================================== */
(function (global) {
  'use strict';
  var U = global.SRMS_UTIL;
  var UI = global.SRMS_UI;
  var R = global.SRMS_ROUTES;

  var state = { q:'', type:'All', status:'All', sort:'date', dir:'asc', page:1, per:8 };
  var extra = [];
  var removed = [];

  function rows() {
    var out = ((global.SRMS_DATA.exams || []).concat(extra)).filter(function (e) { return removed.indexOf(e.id) === -1; });
    if (state.q) {
      var q = state.q.toLowerCase();
      out = out.filter(function (e) { return (e.course + ' ' + e.code + ' ' + e.room + ' ' + e.teacher).toLowerCase().indexOf(q) > -1; });
    }
    if (state.type !== 'All') out = out.filter(function (e) { return e.type === state.type; });
    if (state.status !== 'All') out = out.filter(function (e) { return e.status === state.status; });
    return U.sortBy(out, state.sort, state.dir);
  }

  function find(id) { return ((global.SRMS_DATA.exams || []).concat(extra)).filter(function (e) { return e.id === id; })[0]; }

  function examTone(type) {
    return type === 'Final' ? 'red' : type === 'Midterm' ? 'blue' : type === 'Quiz' ? 'purple' : type === 'Practical' ? 'teal' : 'yellow';
  }

  function examsPage(host, ctx) {
    var D = global.SRMS_DATA;
    var all = (D.exams || []).concat(extra);

    host.innerHTML =
      UI.pageHead({ title:'Exam Management', subtitle:'Create and schedule Midterm, Final, Quiz, Practical and Assignment assessments.',
        actions:'<button class="btn btn-outline" id="ax-export"><i class="fas fa-file-export"></i> Export</button>' +
                '<button class="btn btn-primary" id="ax-add"><i class="fas fa-calendar-plus"></i> Create Exam</button>' }) +

      '<div class="grid grid-4 mb-16">' +
        UI.statCard({ title:'Total Exams', value:all.length, suffix:'scheduled', icon:'fa-file-pen', tone:'blue', note:'All assessment types' }) +
        UI.statCard({ title:'Upcoming', value:all.filter(function (e) { return e.status === 'Upcoming'; }).length, suffix:'exams', icon:'fa-hourglass-half', tone:'yellow', note:'Scheduled in the future' }) +
        UI.statCard({ title:'Completed', value:all.filter(function (e) { return e.status === 'Completed'; }).length, suffix:'exams', icon:'fa-circle-check', tone:'green', note:'Results published' }) +
        UI.statCard({ title:'Halls Allocated', value:U.unique(all.map(function (e) { return e.room; })).length, suffix:'venues', icon:'fa-door-open', tone:'purple', note:'Examination halls in use' }) +
      '</div>' +

      '<div class="card card-flush">' +
        '<div class="table-toolbar" style="padding:18px 20px 0">' +
          '<div class="table-tools">' +
            UI.searchBox('ax-search', 'Search exams by course, code or room...', state.q) +
            UI.selectBox('ax-type', ['All','Midterm','Final','Quiz','Practical','Assignment'], state.type, 'Filter exam type') +
            UI.selectBox('ax-status', ['All','Upcoming','Completed'], state.status, 'Filter status') +
          '</div>' +
          '<div class="card-head-actions"><button class="btn btn-outline btn-sm" id="ax-reset"><i class="fas fa-rotate-left"></i> Reset</button></div>' +
        '</div>' +
        '<div style="padding:18px 20px 0" id="ax-body"></div>' +
        '<div id="ax-pagination" style="padding:0 20px 18px"></div>' +
      '</div>';

    function draw() {
      var out = rows();
      var info = U.paginate(out, state.page, state.per);
      var body = document.getElementById('ax-body');
      if (!out.length) {
        body.innerHTML = UI.emptyState({ icon:'fa-calendar-xmark', title:'No exams found', message:'No examinations match the current filters.',
          action:'Clear Filters', actionId:'ax-clear', actionIcon:'fa-rotate-left' });
        document.getElementById('ax-pagination').innerHTML = '';
        var c = document.getElementById('ax-clear');
        if (c) c.addEventListener('click', reset);
        return;
      }

      var cols = [
        { key:'code', label:'Course Code', render:function (e) { return '<span class="badge badge-blue">' + U.esc(e.code) + '</span>'; } },
        { key:'course', label:'Course', render:function (e) { return '<span class="cell-strong">' + U.esc(e.course) + '</span>'; } },
        { key:'type', label:'Exam Type', render:function (e) { return UI.badge(e.type, examTone(e.type)); } },
        { key:'date', label:'Date', render:function (e) { return U.fmtDate(e.date); } },
        { key:'time', label:'Time' },
        { key:'room', label:'Room' },
        { key:'teacher', label:'Teacher', render:function (e) { return '<span class="cell-mute">' + U.esc(e.teacher) + '</span>'; } },
        { key:'semester', label:'Semester', className:'center', render:function (e) { return (e.semester || 5) + 'th \u00b7 ' + U.esc(e.section || 'A'); } },
        { key:'status', label:'Status', render:function (e) { return UI.statusBadge(e.status); } },
        { key:'actions', label:'Actions', sortable:false, render:function (e) {
            return '<div class="action-group">' +
              '<button class="icon-action" data-xe="' + U.esc(e.id) + '" title="Edit" aria-label="Edit"><i class="fas fa-pen"></i></button>' +
              '<button class="icon-action danger" data-xd="' + U.esc(e.id) + '" title="Delete" aria-label="Delete"><i class="fas fa-trash"></i></button></div>';
          } }
      ];

      body.innerHTML = UI.table({ columns:cols, rows:info.items, sortKey:state.sort, sortDir:state.dir }) +
        UI.dataCards(info.items, function (e) {
          return '<div class="data-card"><div class="data-card-head"><strong>' + U.esc(e.course) + '</strong>' + UI.badge(e.type, examTone(e.type)) + '</div>' +
            '<div class="data-card-grid"><div><div class="dc-label">Date</div><div class="dc-value">' + U.fmtDate(e.date) + '</div></div>' +
            '<div><div class="dc-label">Time</div><div class="dc-value">' + U.esc(e.time) + '</div></div>' +
            '<div><div class="dc-label">Room</div><div class="dc-value">' + U.esc(e.room) + '</div></div>' +
            '<div><div class="dc-label">Status</div><div class="dc-value">' + U.esc(e.status) + '</div></div></div></div>';
        });

      document.getElementById('ax-pagination').innerHTML = UI.pagination(info);
    }

    function reset() {
      state.q = ''; state.type = 'All'; state.status = 'All'; state.page = 1;
      document.getElementById('ax-search').value = '';
      document.getElementById('ax-type').value = 'All';
      document.getElementById('ax-status').value = 'All';
      draw();
    }

    var si = document.getElementById('ax-search');
    si.addEventListener('input', U.debounce(function () { state.q = si.value; state.page = 1; draw(); }, 200));
    ['ax-type','ax-status'].forEach(function (id) {
      document.getElementById(id).addEventListener('change', function () {
        if (id === 'ax-type') state.type = this.value; else state.status = this.value;
        state.page = 1; draw();
      });
    });
    document.getElementById('ax-reset').addEventListener('click', reset);

    host.addEventListener('click', function (e) {
      var p = e.target.closest('[data-page]');
      if (p) { state.page = Number(p.getAttribute('data-page')); draw(); window.scrollTo({ top:0, behavior:'smooth' }); return; }
      var ed = e.target.closest('[data-xe]');
      if (ed) { openForm(find(ed.getAttribute('data-xe')), draw); return; }
      var d = e.target.closest('[data-xd]');
      if (d) {
        var ex = find(d.getAttribute('data-xd'));
        UI.confirm({ title:'Delete this exam?', message:'\u201c' + (ex ? ex.course + ' ' + ex.type : '') + '\u201d scheduled for ' + (ex ? U.fmtDate(ex.date) : '') + ' will be removed. Invigilators will be notified.', tone:'danger', confirmText:'Delete Exam',
          onConfirm:function () {
            removed.push(ex.id);
            extra = extra.filter(function (x) { return x.id !== ex.id; });
            UI.toast('success', 'Exam deleted', ex.course + ' ' + ex.type + ' has been cancelled.');
            draw();
          } });
      }
    });

    document.getElementById('ax-add').addEventListener('click', function () { openForm(null, draw); });

    document.getElementById('ax-export').addEventListener('click', function () {
      var out = rows();
      U.download('srms-admin-exams.csv', U.toCSV(out.map(function (e) {
        return { ID:e.id, Code:e.code, Course:e.course, Type:e.type, Date:e.date, Time:e.time, Room:e.room, Teacher:e.teacher, Semester:e.semester, Section:e.section, Status:e.status };
      }), ['ID','Code','Course','Type','Date','Time','Room','Teacher','Semester','Section','Status']), 'text/csv');
      UI.toast('success', 'Export complete', out.length + ' exams exported.');
    });

    function openForm(existing, onSaved) {
      var isEdit = !!existing;
      var e = existing || { id:'', code:'CS-301', type:'Midterm', date:U.todayISO(), time:'09:00', room:'Hall A-01', teacher:'Dr. Ahmad Hassan', semester:5, section:'A', status:'Upcoming' };
      var courses = global.SRMS_DATA.courses || [];
      UI.modal({
        title:isEdit ? 'Edit Examination' : 'Create Examination', subtitle:'Configure the assessment slot, venue and invigilation.', size:'lg',
        body:'<div class="form-grid">' +
          '<div class="form-group form-span-2"><label class="field-label">Course</label><div class="input-wrap no-icon"><select id="xf-course">' +
            courses.map(function (c) { return '<option value="' + U.esc(c.code) + '"' + (e.code === c.code ? ' selected' : '') + '>' + U.esc(c.code + ' - ' + c.name) + '</option>'; }).join('') + '</select></div></div>' +
          '<div class="form-group"><label class="field-label">Exam Type</label><div class="input-wrap no-icon"><select id="xf-type">' +
            ['Midterm','Final','Quiz','Practical','Assignment'].map(function (t) { return '<option' + (e.type === t ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select></div></div>' +
          '<div class="form-group"><label class="field-label">Date</label><div class="input-wrap no-icon"><input type="date" id="xf-date" value="' + U.esc(e.date) + '"></div></div>' +
          '<div class="form-group"><label class="field-label">Start Time</label><div class="input-wrap no-icon"><input type="time" id="xf-time" value="' + U.esc(e.time) + '"></div></div>' +
          '<div class="form-group"><label class="field-label">Room / Hall</label><div class="input-wrap no-icon"><select id="xf-room">' +
            ['Hall A-01','Hall A-02','Hall A-03','Hall B-01','Hall B-04','Hall C-02','Lab C-04','Lab C-12'].map(function (r) { return '<option' + (e.room === r ? ' selected' : '') + '>' + r + '</option>'; }).join('') + '</select></div></div>' +
          '<div class="form-group"><label class="field-label">Invigilator</label><div class="input-wrap no-icon"><select id="xf-teacher">' +
            (D.teachers || []).map(function (t) { return '<option' + (e.teacher === t.name ? ' selected' : '') + '>' + U.esc(t.name) + '</option>'; }).join('') + '</select></div></div>' +
          '<div class="form-group"><label class="field-label">Semester</label><div class="input-wrap no-icon"><select id="xf-sem">' +
            [1,2,3,4,5,6,7,8].map(function (n) { return '<option value="' + n + '"' + (Number(e.semester) === n ? ' selected' : '') + '>' + n + 'th</option>'; }).join('') + '</select></div></div>' +
          '<div class="form-group"><label class="field-label">Section</label><div class="input-wrap no-icon"><select id="xf-sec">' +
            ['A','B','C'].map(function (n) { return '<option' + (e.section === n ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select></div></div>' +
        '</div><span class="field-error" id="xf-error"></span>',
        footer:'<button class="btn btn-outline" data-modal-close>Cancel</button><button class="btn btn-primary" id="xf-save"><i class="fas fa-check"></i> ' + (isEdit ? 'Update Exam' : 'Create Exam') + '</button>',
        onMount:function (m) {
          m.on('#xf-save', 'click', function () {
            var date = m.el.querySelector('#xf-date').value;
            var err = m.el.querySelector('#xf-error');
            if (!date) { err.textContent = 'Please select an exam date.'; return; }
            if (!isEdit && U.daysBetween(U.todayISO(), date) < 0) { err.textContent = 'Exam date cannot be in the past.'; return; }
            err.textContent = '';
            var code = m.el.querySelector('#xf-course').value;
            var course = courses.filter(function (c) { return c.code === code; })[0] || {};
            var data = { code:code, course:course.name || code, type:m.el.querySelector('#xf-type').value, date:date,
              time:m.el.querySelector('#xf-time').value, room:m.el.querySelector('#xf-room').value,
              teacher:m.el.querySelector('#xf-teacher').value, semester:Number(m.el.querySelector('#xf-sem').value),
              section:m.el.querySelector('#xf-sec').value, status:e.status || 'Upcoming' };
            if (isEdit) { Object.assign(existing, data); m.close(); UI.toast('success', 'Exam updated', data.course + ' ' + data.type + ' has been rescheduled.'); }
            else {
              data.id = 'EX-' + Math.floor(700 + Math.random() * 299);
              (global.SRMS_DATA.exams || []).push(data);
              m.close();
              UI.confirm({ title:'Notify students and faculty?', message:'Students of semester ' + data.semester + ' section ' + data.section + ' and invigilator ' + data.teacher + ' will be notified.', tone:'info', confirmText:'Notify',
                onConfirm:function () { UI.toast('success', 'Exam created', data.course + ' scheduled for ' + U.fmtDate(data.date) + ' at ' + data.time + '.'); } });
            }
            onSaved();
          });
        }
      });
    }

    draw();
  }

  R.add('exams', 'admin', { title:'Exam Management', crumbs:['Academic','Exams'], render:examsPage });
})(window);
