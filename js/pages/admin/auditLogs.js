/* =============================================================================
   SRMS - Admin Audit Logs  (js/pages/admin/auditLogs.js)
   Security and activity log with search, filters, pagination and export.
   ========================================================================== */
(function (global) {
  'use strict';
  var U = global.SRMS_UTIL;
  var UI = global.SRMS_UI;
  var R = global.SRMS_ROUTES;

  var state = { q:'', status:'All', module:'All', page:1, per:8 };

  function rows() {
    var out = (global.SRMS_DATA.auditLogs || []).slice();
    if (state.q) {
      var q = state.q.toLowerCase();
      out = out.filter(function (l) { return (l.user + ' ' + l.action + ' ' + l.module + ' ' + l.ip).toLowerCase().indexOf(q) > -1; });
    }
    if (state.status !== 'All') out = out.filter(function (l) { return l.status === state.status; });
    if (state.module !== 'All') out = out.filter(function (l) { return l.module === state.module; });
    return out;
  }

  function auditPage(host, ctx) {
    var logs = global.SRMS_DATA.auditLogs || [];
    var modules = U.unique(logs.map(function (l) { return l.module; })).sort();

    host.innerHTML =
      UI.pageHead({ title:'Audit Logs', subtitle:'Complete security trail of every sensitive action performed in the system.',
        actions:'<button class="btn btn-outline" id="al-export"><i class="fas fa-file-export"></i> Export Logs</button>' +
                '<button class="btn btn-danger" id="al-purge"><i class="fas fa-broom"></i> Purge Old Logs</button>' }) +

      (logs.filter(function (l) { return l.status !== 'Success'; }).length ?
        '<div class="mb-16">' + UI.alert({ tone:'danger', title:'Security events detected',
          message:logs.filter(function (l) { return l.status !== 'Success'; }).length + ' failed or blocked events recorded. Review the log entries below and verify that these attempts are expected.' }) + '</div>' : '') +

      '<div class="grid grid-4 mb-16">' +
        UI.statCard({ title:'Total Events', value:logs.length, suffix:'entries', icon:'fa-shield-halved', tone:'blue', note:'Recorded in the last 7 days' }) +
        UI.statCard({ title:'Successful', value:logs.filter(function (l) { return l.status === 'Success'; }).length, suffix:'events', icon:'fa-circle-check', tone:'green', note:'Completed without errors' }) +
        UI.statCard({ title:'Failed', value:logs.filter(function (l) { return l.status === 'Failed'; }).length, suffix:'events', icon:'fa-circle-xmark', tone:'red', note:'Mostly failed login attempts' }) +
        UI.statCard({ title:'Blocked', value:logs.filter(function (l) { return l.status === 'Blocked'; }).length, suffix:'events', icon:'fa-ban', tone:'yellow', note:'Stopped by rate limiting or ACL' }) +
      '</div>' +

      '<div class="card card-flush">' +
        '<div class="table-toolbar" style="padding:18px 20px 0">' +
          '<div class="table-tools">' +
            UI.searchBox('al-search', 'Search by user, action, module or IP...', state.q) +
            UI.selectBox('al-status', ['All','Success','Failed','Blocked'], state.status, 'Filter status') +
            UI.selectBox('al-module', [{ value:'All', label:'All Modules' }].concat(modules.map(function (m) { return { value:m, label:m }; })), state.module, 'Filter module') +
          '</div>' +
          '<div class="card-head-actions"><button class="btn btn-outline btn-sm" id="al-reset"><i class="fas fa-rotate-left"></i> Reset</button></div>' +
        '</div>' +
        '<div style="padding:18px 20px 0" id="al-body"></div>' +
        '<div id="al-pagination" style="padding:0 20px 18px"></div>' +
      '</div>';

    function draw() {
      var out = rows();
      var info = U.paginate(out, state.page, state.per);
      var body = document.getElementById('al-body');
      if (!out.length) {
        body.innerHTML = UI.emptyState({ icon:'fa-shield-halved', title:'No log entries', message:'No audit events match the current filters.',
          action:'Clear Filters', actionId:'al-clear', actionIcon:'fa-rotate-left' });
        document.getElementById('al-pagination').innerHTML = '';
        var c = document.getElementById('al-clear');
        if (c) c.addEventListener('click', reset);
        return;
      }

      var cols = [
        { key:'id', label:'Log ID', render:function (l) { return '<span class="badge badge-gray">' + U.esc(l.id) + '</span>'; } },
        { key:'user', label:'User', render:function (l) { return '<div class="flex gap-8">' + UI.avatar(l.user, 'xs') + '<div><span class="cell-strong">' + U.esc(l.user) + '</span><div class="cell-mute">' + U.esc(l.role) + '</div></div></div>'; } },
        { key:'action', label:'Action', render:function (l) { return '<span class="cell-strong">' + U.esc(l.action) + '</span>'; } },
        { key:'module', label:'Module', render:function (l) { return UI.badge(l.module, 'blue'); } },
        { key:'date', label:'Date', render:function (l) { return U.fmtDate(l.date); } },
        { key:'time', label:'Time' },
        { key:'ip', label:'IP / Device', render:function (l) { return '<div><span class="cell-mute">' + U.esc(l.ip) + '</span><div class="cell-mute">' + U.esc(l.device) + '</div></div>'; } },
        { key:'status', label:'Status', render:function (l) { return UI.statusBadge(l.status); } }
      ];

      body.innerHTML = UI.table({ columns:cols, rows:info.items }) +
        UI.dataCards(info.items, function (l) {
          return '<div class="data-card"><div class="data-card-head"><strong>' + U.esc(l.action) + '</strong>' + UI.statusBadge(l.status) + '</div>' +
            '<div class="data-card-grid"><div><div class="dc-label">User</div><div class="dc-value">' + U.esc(l.user) + '</div></div>' +
            '<div><div class="dc-label">Module</div><div class="dc-value">' + U.esc(l.module) + '</div></div>' +
            '<div><div class="dc-label">When</div><div class="dc-value">' + U.fmtDate(l.date) + ' ' + U.esc(l.time) + '</div></div>' +
            '<div><div class="dc-label">IP</div><div class="dc-value">' + U.esc(l.ip) + '</div></div></div></div>';
        });

      document.getElementById('al-pagination').innerHTML = UI.pagination(info);
    }

    function reset() {
      state.q = ''; state.status = 'All'; state.module = 'All'; state.page = 1;
      document.getElementById('al-search').value = '';
      document.getElementById('al-status').value = 'All';
      document.getElementById('al-module').value = 'All';
      draw();
    }

    var si = document.getElementById('al-search');
    si.addEventListener('input', U.debounce(function () { state.q = si.value; state.page = 1; draw(); }, 200));
    ['al-status','al-module'].forEach(function (id) {
      document.getElementById(id).addEventListener('change', function () {
        if (id === 'al-status') state.status = this.value; else state.module = this.value;
        state.page = 1; draw();
      });
    });
    document.getElementById('al-reset').addEventListener('click', reset);

    document.getElementById('al-export').addEventListener('click', function () {
      var out = rows();
      U.download('srms-audit-logs.csv', U.toCSV(out.map(function (l) {
        return { ID:l.id, User:l.user, Role:l.role, Action:l.action, Module:l.module, Date:l.date, Time:l.time, IP:l.ip, Device:l.device, Status:l.status };
      }), ['ID','User','Role','Action','Module','Date','Time','IP','Device','Status']), 'text/csv');
      UI.toast('success', 'Export complete', out.length + ' audit entries exported.');
    });

    document.getElementById('al-purge').addEventListener('click', function () {
      UI.confirm({ title:'Purge logs older than 90 days?', message:'Archived entries beyond the 90-day retention window will be permanently deleted. Recent entries are preserved.', tone:'danger', confirmText:'Purge Logs',
        onConfirm:function () { UI.toast('success', 'Purge complete', '14 archived log entries beyond the retention window were deleted.'); } });
    });

    draw();
  }

  R.add('audit', 'admin', { title:'Audit Logs', crumbs:['System','Audit Logs'], render:auditPage });
})(window);
