/* =============================================================================
   SRMS - Teacher Attendance Management  (js/pages/teacher/attendance.js)
   Course / date / section selector, per-student Present, Absent, Late and
   Excused marking, mark-all-present, save and edit previous attendance.
   ========================================================================== */
(function (global) {
  'use strict';
  var U = global.SRMS_UTIL;
  var UI = global.SRMS_UI;
  var R = global.SRMS_ROUTES;
  var C = global.SRMS_CHARTS;

  var STATUSES = [
    { key:'Present',  icon:'fa-check',        tone:'green' },
    { key:'Absent',   icon:'fa-xmark',        tone:'red' },
    { key:'Late',     icon:'fa-clock',        tone:'yellow' },
    { key:'Excused',  icon:'fa-file-shield',  tone:'purple' }
  ];

  var records = {};
  var history = [];
  var state = { course:'CS-301', date:U.todayISO(), section:'A', q:'', page:1, per:8, mode:'mark' };

  function roster() {
    var list = (global.SRMS_DATA.studentRoster || []).filter(function (s) { return s.dept === 'Computer Science' && s.section === state.section; });
    if (state.q) {
      var q = state.q.toLowerCase();
      list = list.filter(function (s) { return (s.name + ' ' + s.id).toLowerCase().indexOf(q) > -1; });
    }
    return list;
  }

  function defaultStatus(i) {
    return i % 9 === 4 ? 'Absent' : i % 7 === 3 ? 'Late' : 'Present';
  }

  function attendancePage(host, ctx) {
    var D = global.SRMS_DATA;
    var myCourses = (D.courses || []).filter(function (c) { return c.teacher === D.teachers[0].name; });
    var all = (D.studentRoster || []).filter(function (s) { return s.dept === 'Computer Science' && s.section === state.section; });

    all.forEach(function (s, i) { if (!records[s.id]) records[s.id] = defaultStatus(i); });

    host.innerHTML =
      UI.pageHead({ title:'Attendance Management', subtitle:'Mark daily attendance, review history and edit previously recorded sessions.',
        actions:'<button class="btn btn-outline" id="ta-history"><i class="fas fa-clock-rotate-left"></i> Previous Attendance</button>' +
                '<button class="btn btn-outline" id="ta-export"><i class="fas fa-file-export"></i> Export Register</button>' +
                '<button class="btn btn-primary" id="ta-save"><i class="fas fa-floppy-disk"></i> Save Attendance</button>' }) +

      '<div class="grid grid-4 mb-16">' +
        UI.statCard({ title:'Section Strength', value:all.length, suffix:'students', icon:'fa-users', tone:'blue', note:'Section ' + state.section + ' roster' }) +
        UI.statCard({ title:'Present Today', value:presentCount(), suffix:'students', icon:'fa-circle-check', tone:'green', note:U.fmtPct(presentPct()) + ' attendance rate' }) +
        UI.statCard({ title:'Absent', value:countOf('Absent'), suffix:'students', icon:'fa-circle-xmark', tone:'red', note:'Requires follow-up' }) +
        UI.statCard({ title:'Late / Excused', value:countOf('Late') + ' / ' + countOf('Excused'), suffix:'students', icon:'fa-clock', tone:'yellow', note:'Recorded exceptions' }) +
      '</div>' +

      '<div class="card card-flush mb-16">' +
        '<div class="table-toolbar" style="padding:18px 20px 0">' +
          '<div class="table-tools">' +
            UI.selectBox('ta-course', myCourses.map(function (c) { return { value:c.code, label:c.code + ' - ' + c.name }; }), state.course, 'Select course') +
            '<div class="table-search" style="max-width:190px"><i class="fas fa-calendar"></i><input type="date" id="ta-date" value="' + U.esc(state.date) + '" aria-label="Select date"></div>' +
            UI.selectBox('ta-section', ['A','B','C'], state.section, 'Select section') +
            UI.searchBox('ta-search', 'Search students...', state.q) +
          '</div>' +
          '<div class="card-head-actions">' +
            '<button class="btn btn-success btn-sm" id="ta-all-present"><i class="fas fa-check-double"></i> Mark All Present</button>' +
            '<button class="btn btn-outline btn-sm" id="ta-reset"><i class="fas fa-rotate-left"></i> Reset</button>' +
          '</div>' +
        '</div>' +
        '<div class="alert alert-info" style="margin:16px 20px 0"><i class="fas fa-circle-info alert-ico"></i>' +
          '<div class="alert-body"><strong>Session: ' + U.esc(state.course) + ' \u00b7 ' + U.fmtDate(state.date) + ' \u00b7 Section ' + U.esc(state.section) + '</strong>' +
          'Students below 75 percent attendance become ineligible for the final examination. Attendance changes are logged in the audit trail.</div></div>' +
        '<div style="padding:18px 20px 0" id="ta-body"></div>' +
        '<div id="ta-pagination" style="padding:0 20px 18px"></div>' +
      '</div>' +

      '<div class="grid grid-2">' +
        UI.card({ title:'Today\u2019s Attendance Distribution', icon:'fa-chart-pie', subtitle:'Live summary of the current marking session',
          body:'<div class="donut-wrap"><canvas id="ta-donut" class="chart-h-260"></canvas>' +
            '<div class="donut-center"><strong>' + presentPct() + '%</strong><span>Present</span></div></div><div id="ta-legend"></div>' }) +
        UI.card({ title:'Recent Sessions', icon:'fa-clock-rotate-left', subtitle:'Attendance sessions you have recorded',
          body:'<div id="ta-recent"></div>' })
      + '</div>';

    function presentCount() { return Object.keys(records).filter(function (k) { return records[k] === 'Present'; }).length; }
    function countOf(st) { return Object.keys(records).filter(function (k) { return records[k] === st; }).length; }
    function presentPct() {
      var total = Object.keys(records).length;
      return total ? Math.round((presentCount() / total) * 100) : 0;
    }

    function draw() {
      var list = roster();
      var info = U.paginate(list, state.page, state.per);
      var body = document.getElementById('ta-body');

      if (!list.length) {
        body.innerHTML = UI.emptyState({ icon:'fa-user-slash', title:'No students found', message:'No students match the current section or search term.' });
        document.getElementById('ta-pagination').innerHTML = '';
        return;
      }

      body.innerHTML = '<div class="table-wrap"><table class="table table-compact"><thead><tr>' +
        '<th>Student</th><th class="center">Student ID</th><th class="center">Overall %</th><th style="min-width:290px">Mark Attendance</th></tr></thead><tbody>' +
        info.items.map(function (s) {
          var cur = records[s.id] || 'Present';
          return '<tr data-att-row="' + U.esc(s.id) + '"><td><div class="flex gap-8">' + UI.avatar(s.name, 'xs') + '<span class="cell-strong">' + U.esc(s.name) + '</span></div></td>' +
            '<td class="center cell-mute">' + U.esc(s.id) + '</td>' +
            '<td class="center">' + UI.progressRow(s.attendance, s.attendance >= 90 ? 'green' : s.attendance >= 80 ? '' : s.attendance >= 75 ? 'yellow' : 'red') + '</td>' +
            '<td><div class="att-toggle" role="radiogroup" aria-label="Attendance for ' + U.esc(s.name) + '">' +
              STATUSES.map(function (st) {
                return '<button class="att-btn' + (cur === st.key ? ' active ' + st.tone : '') + '" data-id="' + U.esc(s.id) + '" data-status="' + st.key + '">' +
                  '<i class="fas ' + st.icon + '"></i> ' + st.key + '</button>';
              }).join('') + '</div></td></tr>';
        }).join('') + '</tbody></table></div>' +
        UI.dataCards(info.items, function (s) {
          var cur = records[s.id] || 'Present';
          return '<div class="data-card"><div class="data-card-head"><strong>' + U.esc(s.name) + '</strong>' + UI.statusBadge(cur) + '</div>' +
            '<div class="data-card-grid"><div><div class="dc-label">Student ID</div><div class="dc-value">' + U.esc(s.id) + '</div></div>' +
            '<div><div class="dc-label">Overall</div><div class="dc-value">' + s.attendance + '%</div></div></div>' +
            '<div class="att-toggle" role="radiogroup">' + STATUSES.map(function (st) {
              return '<button class="att-btn' + (cur === st.key ? ' active ' + st.tone : '') + '" data-id="' + U.esc(s.id) + '" data-status="' + st.key + '"><i class="fas ' + st.icon + '"></i> ' + st.key + '</button>';
            }).join('') + '</div></div>';
        });

      document.getElementById('ta-pagination').innerHTML = UI.pagination(info);
    }

    function drawCharts() {
      var data = STATUSES.map(function (st) {
        return { label:st.key, value:countOf(st.key), color: st.key === 'Present' ? '#22C55E' : st.key === 'Absent' ? '#EF4444' : st.key === 'Late' ? '#F59E0B' : '#8B5CF6' };
      });
      C.donut('ta-donut', { cutout:'70%', legend:false, unit:' students', data:data });
      document.getElementById('ta-legend').innerHTML = UI.legendRows(data);
      document.querySelector('.donut-center strong').textContent = presentPct() + '%';
    }

    function drawRecent() {
      var list = history.length ? history : [
        { date:U.todayISO(), course:state.course, section:state.section, present:presentCount(), total:Object.keys(records).length },
        { date:'2026-09-18', course:'CS-301', section:'A', present:19, total:20 },
        { date:'2026-09-16', course:'CS-303', section:'A', present:18, total:20 },
        { date:'2026-09-14', course:'CS-207', section:'A', present:17, total:20 },
        { date:'2026-09-11', course:'CS-301', section:'A', present:20, total:20 }
      ];
      document.getElementById('ta-recent').innerHTML = '<div class="list-simple">' + list.slice(0, 6).map(function (h) {
        var pct = Math.round((h.present / h.total) * 100);
        return '<div class="list-row"><span class="resource-ico badge-' + (pct >= 90 ? 'green' : pct >= 80 ? 'blue' : 'yellow') + '" style="width:38px;height:38px;font-size:14px;border-radius:11px"><i class="fas fa-calendar-check"></i></span>' +
          '<div class="list-row-main"><strong>' + U.esc(h.course) + ' \u00b7 Section ' + U.esc(h.section) + '</strong><span>' + U.fmtDate(h.date) + ' \u00b7 ' + h.present + ' of ' + h.total + ' present</span></div>' +
          '<button class="btn btn-outline btn-xs" data-edit-session="' + U.esc(h.date) + '"><i class="fas fa-pen"></i> Edit</button></div>';
      }).join('') + '</div>';
    }

    /* ------------------------------------------------------------- WIRING */
    document.getElementById('ta-body').addEventListener('click', function (e) {
      var p = e.target.closest('[data-page]');
      if (p) { state.page = Number(p.getAttribute('data-page')); draw(); window.scrollTo({ top:0, behavior:'smooth' }); return; }
      var btn = e.target.closest('.att-btn');
      if (!btn) return;
      var id = btn.getAttribute('data-id');
      records[id] = btn.getAttribute('data-status');
      var group = btn.closest('.att-toggle');
      U.qsa('.att-btn', group).forEach(function (b) {
        var on = b === btn;
        b.className = 'att-btn' + (on ? ' active ' + STATUSES.filter(function (s) { return s.key === b.getAttribute('data-status'); })[0].tone : '');
      });
      updateStats();
    });

    function updateStats() {
      var cards = U.qsa('.stat-card .stat-value');
      if (cards[1]) cards[1].innerHTML = presentCount() + ' <small>students</small>';
      if (cards[2]) cards[2].innerHTML = countOf('Absent') + ' <small>students</small>';
      if (cards[3]) cards[3].innerHTML = countOf('Late') + ' / ' + countOf('Excused') + ' <small>students</small>';
      drawCharts();
    }

    document.getElementById('ta-course').addEventListener('change', function () { state.course = this.value; drawRecent(); });
    document.getElementById('ta-date').addEventListener('change', function () { state.date = this.value; UI.toast('info', 'Date changed', 'Marking attendance for ' + U.fmtDate(this.value) + '.'); });
    document.getElementById('ta-section').addEventListener('change', function () { state.section = this.value; state.page = 1; draw(); updateStats(); });
    var si = document.getElementById('ta-search');
    si.addEventListener('input', U.debounce(function () { state.q = si.value; state.page = 1; draw(); }, 200));

    document.getElementById('ta-all-present').addEventListener('click', function () {
      roster().forEach(function (s) { records[s.id] = 'Present'; });
      draw(); updateStats();
      UI.toast('success', 'Marked present', roster().length + ' students marked present for this session.');
    });

    document.getElementById('ta-reset').addEventListener('click', function () {
      roster().forEach(function (s, i) { records[s.id] = defaultStatus(i); });
      draw(); updateStats();
      UI.toast('info', 'Reset complete', 'Attendance restored to the previously saved values.');
    });

    document.getElementById('ta-save').addEventListener('click', function () {
      UI.confirm({
        title:'Save this attendance session?',
        message:state.course + ' \u00b7 ' + U.fmtDate(state.date) + ' \u00b7 Section ' + state.section + ' \u2014 ' + presentCount() + ' present, ' + countOf('Absent') + ' absent, ' + countOf('Late') + ' late, ' + countOf('Excused') + ' excused.',
        tone:'info', confirmText:'Save Attendance',
        onConfirm:function () {
          history.unshift({ date:state.date, course:state.course, section:state.section, present:presentCount(), total:Object.keys(records).length });
          drawRecent();
          UI.toast('success', 'Attendance saved', 'The register for ' + U.fmtDate(state.date) + ' has been stored successfully.');
        }
      });
    });

    document.getElementById('ta-history').addEventListener('click', function () { openHistory(); });

    function openHistory() {
      var list = (global.SRMS_DATA.attendanceLog || []);
      UI.modal({ title:'Previous Attendance', subtitle:'Review and edit earlier sessions', size:'lg',
        body:UI.table({ compact:true, columns:[
          { key:'date', label:'Date', render:function (r) { return U.fmtDate(r.date); } },
          { key:'course', label:'Course', render:function (r) { return '<span class="cell-strong">' + U.esc(r.course) + '</span>'; } },
          { key:'slot', label:'Slot' },
          { key:'status', label:'Status', render:function (r) { return UI.statusBadge(r.status); } },
          { key:'actions', label:'', sortable:false, render:function (r) { return '<button class="btn btn-outline btn-xs" data-edit-session="' + U.esc(r.date) + '"><i class="fas fa-pen"></i> Edit</button>'; } }
        ], rows:list }),
        footer:'<button class="btn btn-outline" data-modal-close>Close</button><button class="btn btn-primary" id="th-save"><i class="fas fa-floppy-disk"></i> Save Changes</button>',
        onMount:function (m) {
          m.on('#th-save', 'click', function () { m.close(); UI.toast('success', 'Changes saved', 'Updated attendance records have been stored.'); });
          m.el.addEventListener('click', function (e) {
            var b = e.target.closest('[data-edit-session]');
            if (!b) return;
            state.date = b.getAttribute('data-edit-session');
            var dEl = document.getElementById('ta-date');
            if (dEl) dEl.value = state.date;
            m.close();
            UI.toast('info', 'Editing session', 'Loaded attendance for ' + U.fmtDate(state.date) + '.');
          });
        } });
    }

    document.getElementById('ta-export').addEventListener('click', function () {
      var list = roster();
      var rows = list.map(function (s) { return { StudentID:s.id, Name:s.name, Course:state.course, Date:state.date, Section:state.section, Status:records[s.id] || 'Present', Overall:s.attendance + '%' }; });
      U.download('srms-attendance-register.csv', U.toCSV(rows, ['StudentID','Name','Course','Date','Section','Status','Overall']), 'text/csv');
      UI.toast('success', 'Export complete', rows.length + ' attendance rows exported.');
    });

    host.addEventListener('click', function (e) {
      var b = e.target.closest('[data-edit-session]');
      if (b && !e.target.closest('.modal')) {
        state.date = b.getAttribute('data-edit-session');
        var dEl = document.getElementById('ta-date');
        if (dEl) dEl.value = state.date;
        UI.toast('info', 'Session loaded', 'Showing attendance for ' + U.fmtDate(state.date) + '.');
      }
    });

    draw();
    drawCharts();
    drawRecent();
  }

  R.add('attendance', 'teacher', { title:'Attendance Management', crumbs:['Teaching','Attendance'], render:attendancePage });
})(window);
