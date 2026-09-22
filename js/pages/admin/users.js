/* =============================================================================
   SRMS - Admin User Management  (js/pages/admin/users.js)
   Manage students, teachers and administrator accounts: add, edit, deactivate,
   reset password, view profile and delete with confirmation dialogs.
   ========================================================================== */
(function (global) {
  'use strict';
  var U = global.SRMS_UTIL;
  var UI = global.SRMS_UI;
  var R = global.SRMS_ROUTES;

  var state = { q:'', role:'All', status:'All', page:1, per:8 };

  function allUsers() {
    var D = global.SRMS_DATA;
    var out = [];
    (D.studentRoster || []).slice(0, 10).forEach(function (s) {
      out.push({ id:s.id, name:s.name, email:s.email, role:'Student', roleIcon:'fa-user-graduate', detail:s.dept, status:s.status, lastActive:'--' });
    });
    (D.teachers || []).forEach(function (t) {
      out.push({ id:t.id, name:t.name, email:t.email, role:'Teacher', roleIcon:'fa-chalkboard-user', detail:t.designation + ' \u00b7 ' + t.dept, status:t.status, lastActive:'--' });
    });
    (D.admins || []).forEach(function (a) {
      out.push({ id:a.id, name:a.name, email:a.email, role:'Administrator', roleIcon:'fa-user-shield', detail:a.role + ' \u00b7 ' + a.dept, status:a.status, lastActive:a.lastActive });
    });
    return out;
  }

  function rows() {
    var out = allUsers();
    if (state.q) {
      var q = state.q.toLowerCase();
      out = out.filter(function (u) { return (u.name + ' ' + u.id + ' ' + u.email).toLowerCase().indexOf(q) > -1; });
    }
    if (state.role !== 'All') out = out.filter(function (u) { return u.role === state.role; });
    if (state.status !== 'All') out = out.filter(function (u) { return u.status === state.status; });
    return out;
  }

  function find(id) { return allUsers().filter(function (u) { return u.id === id; })[0]; }

  function usersPage(host, ctx) {
    var D = global.SRMS_DATA;
    var all = allUsers();

    host.innerHTML =
      UI.pageHead({ title:'User Management', subtitle:'Control platform access for students, teachers and administrators.',
        actions:'<button class="btn btn-outline" id="um-export"><i class="fas fa-file-export"></i> Export</button>' +
                '<button class="btn btn-primary" id="um-add"><i class="fas fa-user-plus"></i> Add User</button>' }) +

      '<div class="grid grid-4 mb-16">' +
        UI.statCard({ title:'Total Users', value:U.fmtNum((D.analytics || {}).adminStats ? (D.analytics.adminStats.systemUsers || 2712) : 2712), icon:'fa-users', tone:'blue', note:all.length + ' records in this directory view' }) +
        UI.statCard({ title:'Students', value:(D.analytics || {}).adminStats ? (D.analytics.adminStats.totalStudents || 2450) : 2450, icon:'fa-user-graduate', tone:'green', note:'Registered learner accounts' }) +
        UI.statCard({ title:'Teachers', value:(D.teachers || []).length, icon:'fa-chalkboard-user', tone:'purple', note:'Faculty portal accounts' }) +
        UI.statCard({ title:'Administrators', value:(D.admins || []).length, icon:'fa-user-shield', tone:'yellow', note:'Back-office operator accounts' }) +
      '</div>' +

      '<div class="card card-flush">' +
        '<div class="table-toolbar" style="padding:18px 20px 0">' +
          '<div class="table-tools">' +
            UI.searchBox('um-search', 'Search users by name, ID or email...', state.q) +
            UI.selectBox('um-role', ['All','Student','Teacher','Administrator'], state.role, 'Filter role') +
            UI.selectBox('um-status', ['All','Active','Inactive','Warning','Probation','On Leave','Suspended'], state.status, 'Filter status') +
          '</div>' +
          '<div class="card-head-actions"><button class="btn btn-outline btn-sm" id="um-reset"><i class="fas fa-rotate-left"></i> Reset</button></div>' +
        '</div>' +
        '<div style="padding:18px 20px 0" id="um-body"></div>' +
        '<div id="um-pagination" style="padding:0 20px 18px"></div>' +
      '</div>';

    function draw() {
      var out = rows();
      var info = U.paginate(out, state.page, state.per);
      var body = document.getElementById('um-body');
      if (!out.length) {
        body.innerHTML = UI.emptyState({ icon:'fa-users-slash', title:'No users found', message:'No user accounts match the current filters.',
          action:'Clear Filters', actionId:'um-clear', actionIcon:'fa-rotate-left' });
        document.getElementById('um-pagination').innerHTML = '';
        var c = document.getElementById('um-clear');
        if (c) c.addEventListener('click', reset);
        return;
      }

      var cols = [
        { key:'id', label:'User ID', render:function (u) { return '<span class="badge badge-gray">' + U.esc(u.id) + '</span>'; } },
        { key:'name', label:'Name', render:function (u) { return '<div class="flex gap-8">' + UI.avatar(u.name, 'xs') + '<div><span class="cell-strong">' + U.esc(u.name) + '</span><div class="cell-mute">' + U.esc(u.email) + '</div></div></div>'; } },
        { key:'role', label:'Role', render:function (u) { return UI.badge(u.role, u.role === 'Administrator' ? 'yellow' : u.role === 'Teacher' ? 'purple' : 'blue', u.roleIcon); } },
        { key:'detail', label:'Detail', render:function (u) { return '<span class="cell-mute">' + U.esc(u.detail) + '</span>'; } },
        { key:'lastActive', label:'Last Active', render:function (u) { return '<span class="cell-mute">' + (u.lastActive === '--' ? '--' : U.fmtDateTime(u.lastActive)) + '</span>'; } },
        { key:'status', label:'Status', render:function (u) { return UI.statusBadge(u.status); } },
        { key:'actions', label:'Actions', sortable:false, render:function (u) {
            var active = u.status === 'Active';
            return '<div class="action-group">' +
              '<button class="icon-action" data-uv="' + U.esc(u.id) + '" title="View profile" aria-label="View"><i class="fas fa-eye"></i></button>' +
              '<button class="icon-action" data-ue="' + U.esc(u.id) + '" title="Edit user" aria-label="Edit"><i class="fas fa-pen"></i></button>' +
              '<button class="icon-action ' + (active ? 'warning' : 'success') + '" data-ut="' + U.esc(u.id) + '" title="' + (active ? 'Deactivate' : 'Activate') + '" aria-label="Toggle"><i class="fas ' + (active ? 'fa-user-lock' : 'fa-user-check') + '"></i></button>' +
              '<button class="icon-action" data-ur="' + U.esc(u.id) + '" title="Reset password" aria-label="Reset password"><i class="fas fa-key"></i></button>' +
              '<button class="icon-action danger" data-ud="' + U.esc(u.id) + '" title="Delete" aria-label="Delete"><i class="fas fa-trash"></i></button></div>';
          } }
      ];

      body.innerHTML = UI.table({ columns:cols, rows:info.items }) +
        UI.dataCards(info.items, function (u) {
          return '<div class="data-card"><div class="data-card-head"><div class="flex gap-8">' + UI.avatar(u.name, 'xs') + '<div><strong>' + U.esc(u.name) + '</strong><div class="text-mute text-xs">' + U.esc(u.id) + '</div></div></div>' + UI.statusBadge(u.status) + '</div>' +
            '<div class="data-card-grid"><div><div class="dc-label">Role</div><div class="dc-value">' + U.esc(u.role) + '</div></div>' +
            '<div><div class="dc-label">Email</div><div class="dc-value">' + U.esc(u.email) + '</div></div>' +
            '<div><div class="dc-label">Detail</div><div class="dc-value">' + U.esc(u.detail) + '</div></div>' +
            '<div><div class="dc-label">Last Active</div><div class="dc-value">' + (u.lastActive === '--' ? '--' : U.fmtDateTime(u.lastActive)) + '</div></div></div></div>';
        });

      document.getElementById('um-pagination').innerHTML = UI.pagination(info);
    }

    function reset() {
      state.q = ''; state.role = 'All'; state.status = 'All'; state.page = 1;
      document.getElementById('um-search').value = '';
      document.getElementById('um-role').value = 'All';
      document.getElementById('um-status').value = 'All';
      draw();
    }

    var si = document.getElementById('um-search');
    si.addEventListener('input', U.debounce(function () { state.q = si.value; state.page = 1; draw(); }, 200));
    ['um-role','um-status'].forEach(function (id) {
      document.getElementById(id).addEventListener('change', function () {
        if (id === 'um-role') state.role = this.value; else state.status = this.value;
        state.page = 1; draw();
      });
    });
    document.getElementById('um-reset').addEventListener('click', reset);

    host.addEventListener('click', function (e) {
      var p = e.target.closest('[data-page]');
      if (p) { state.page = Number(p.getAttribute('data-page')); draw(); window.scrollTo({ top:0, behavior:'smooth' }); return; }
      var v = e.target.closest('[data-uv]');
      if (v) { viewUser(find(v.getAttribute('data-uv'))); return; }
      var ed = e.target.closest('[data-ue]');
      if (ed) { openForm(find(ed.getAttribute('data-ue')), draw); return; }
      var t = e.target.closest('[data-ut]');
      if (t) {
        var u = find(t.getAttribute('data-ut'));
        var deactivating = u.status === 'Active';
        UI.confirm({ title:(deactivating ? 'Deactivate' : 'Activate') + ' this account?', message:u.name + ' will ' + (deactivating ? 'lose portal access immediately.' : 'regain full portal access.'), tone: deactivating ? 'warning' : 'info', confirmText: deactivating ? 'Deactivate' : 'Activate',
          onConfirm:function () { u.status = deactivating ? 'Inactive' : 'Active'; UI.toast('success', 'Account ' + (deactivating ? 'deactivated' : 'activated'), u.name + '\u2019s account has been updated.'); draw(); } });
        return;
      }
      var r = e.target.closest('[data-ur]');
      if (r) {
        var u2 = find(r.getAttribute('data-ur'));
        UI.confirm({ title:'Reset password?', message:'A temporary password will be emailed to ' + u2.email + '. The user must change it at next login.', tone:'warning', confirmText:'Reset Password',
          onConfirm:function () { UI.toast('success', 'Password reset', 'A temporary password has been sent to ' + u2.email + '.'); } });
        return;
      }
      var d = e.target.closest('[data-ud]');
      if (d) {
        var u3 = find(d.getAttribute('data-ud'));
        UI.confirm({ title:'Delete user account?', message:'\u201c' + u3.name + '\u201d (' + u3.id + ') will be permanently deleted. This action is irreversible.', tone:'danger', confirmText:'Delete User',
          onConfirm:function () {
            if (u3.role === 'Teacher') global.SRMS_DATA.teachers = (global.SRMS_DATA.teachers || []).filter(function (x) { return x.id !== u3.id; });
            if (u3.role === 'Administrator') global.SRMS_DATA.admins = (global.SRMS_DATA.admins || []).filter(function (x) { return x.id !== u3.id; });
            if (u3.role === 'Student') global.SRMS_DATA.studentRoster = (global.SRMS_DATA.studentRoster || []).filter(function (x) { return x.id !== u3.id; });
            UI.toast('success', 'User deleted', u3.name + ' has been permanently removed.');
            draw();
          } });
      }
    });

    document.getElementById('um-add').addEventListener('click', function () { openForm(null, draw); });

    document.getElementById('um-export').addEventListener('click', function () {
      var out = rows();
      U.download('srms-users.csv', U.toCSV(out.map(function (u) {
        return { ID:u.id, Name:u.name, Email:u.email, Role:u.role, Detail:u.detail, Status:u.status };
      }), ['ID','Name','Email','Role','Detail','Status']), 'text/csv');
      UI.toast('success', 'Export complete', out.length + ' user records exported.');
    });

    function viewUser(u) {
      if (!u) return;
      UI.modal({
        title:u.name, subtitle:u.role + ' \u00b7 ' + u.id,
        body:'<div class="flex gap-16 flex-wrap mb-16">' + UI.avatar(u.name, 'lg') +
          '<div style="flex:1;min-width:200px"><div class="chip-row">' + UI.statusBadge(u.status) + UI.badge(u.role, 'blue') + '</div>' +
          '<dl class="info-grid mt-12">' +
            '<div class="info-item"><dt>Email</dt><dd>' + U.esc(u.email) + '</dd></div>' +
            '<div class="info-item"><dt>Detail</dt><dd>' + U.esc(u.detail) + '</dd></div>' +
            '<div class="info-item"><dt>Last Active</dt><dd>' + (u.lastActive === '--' ? '--' : U.fmtDateTime(u.lastActive)) + '</dd></div>' +
            '<div class="info-item"><dt>Password Storage</dt><dd>' + U.fakeHash(u.id) + '</dd></div>' +
          '</dl></div></div>',
        footer:'<button class="btn btn-outline" data-modal-close>Close</button><button class="btn btn-primary" id="uv-edit"><i class="fas fa-pen"></i> Edit User</button>',
        onMount:function (m) { m.on('#uv-edit', 'click', function () { m.close(); openForm(u, draw); }); }
      });
    }

    function openForm(existing, onSaved) {
      var isEdit = !!existing;
      var u = existing || { id:'', name:'', email:'', role:'Student', detail:'', status:'Active' };
      UI.modal({
        title:isEdit ? 'Edit User' : 'Add New User', subtitle:'Configure identity, role and access level.', size:'lg',
        body:'<div class="form-grid">' +
          '<div class="form-group"><label class="field-label">User ID</label><div class="input-wrap no-icon"><input id="uf-id" value="' + U.esc(u.id) + '" placeholder="Auto-generated if blank"' + (isEdit ? ' readonly' : '') + '></div></div>' +
          '<div class="form-group"><label class="field-label">Full Name</label><div class="input-wrap no-icon"><input id="uf-name" value="' + U.esc(u.name) + '"></div></div>' +
          '<div class="form-group form-span-2"><label class="field-label">Email</label><div class="input-wrap"><i class="fas fa-envelope input-icon"></i><input id="uf-email" value="' + U.esc(u.email) + '"></div></div>' +
          '<div class="form-group"><label class="field-label">Role</label><div class="input-wrap no-icon"><select id="uf-role">' +
            ['Student','Teacher','Administrator'].map(function (r) { return '<option' + (u.role === r ? ' selected' : '') + '>' + r + '</option>'; }).join('') + '</select></div></div>' +
          '<div class="form-group"><label class="field-label">Status</label><div class="input-wrap no-icon"><select id="uf-status">' +
            ['Active','Inactive','Warning'].map(function (s) { return '<option' + (u.status === s ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></div></div>' +
          (isEdit ? '' : '<div class="form-group form-span-2"><label class="field-label">Temporary Password</label>' +
            '<div class="input-wrap"><i class="fas fa-key input-icon"></i><input type="text" id="uf-pw" value="Welcome@2026"></div>' +
            '<span class="helper-text">The user must change this password at first login. Stored as a salted hash.</span></div>') +
        '</div><span class="field-error" id="uf-error"></span>',
        footer:'<button class="btn btn-outline" data-modal-close>Cancel</button><button class="btn btn-primary" id="uf-save"><i class="fas fa-check"></i> ' + (isEdit ? 'Save Changes' : 'Create User') + '</button>',
        onMount:function (m) {
          m.on('#uf-save', 'click', function () {
            var name = m.el.querySelector('#uf-name').value.trim();
            var email = m.el.querySelector('#uf-email').value.trim();
            var role = m.el.querySelector('#uf-role').value;
            var err = m.el.querySelector('#uf-error');
            if (!U.minLen(name, 3)) { err.textContent = 'Full name must be at least 3 characters.'; return; }
            if (!U.isEmail(email)) { err.textContent = 'Enter a valid email address.'; return; }
            if (!isEdit && U.passwordStrength(m.el.querySelector('#uf-pw').value) < 2) { err.textContent = 'Temporary password is too weak.'; return; }
            err.textContent = '';
            var data = { id: m.el.querySelector('#uf-id').value.trim() || (role === 'Student' ? 'STU-2021-00' + Math.floor(30 + Math.random() * 69) : role === 'Teacher' ? 'TCH-10' + Math.floor(13 + Math.random() * 86) : 'ADM-00' + Math.floor(6 + Math.random() * 3)),
              name:name, email:email, role:role, status:m.el.querySelector('#uf-status').value, detail:u.detail || (role + ' account'), roleIcon: role === 'Student' ? 'fa-user-graduate' : role === 'Teacher' ? 'fa-chalkboard-user' : 'fa-user-shield', lastActive:'--' };
            if (isEdit) { Object.assign(existing, data); m.close(); UI.toast('success', 'User updated', data.name + '\u2019s account has been saved.'); }
            else {
              if (role === 'Teacher') { (global.SRMS_DATA.teachers || []).push({ id:data.id, name:name, email:email, dept:'--', designation:'Lecturer', courses:[], phone:'--', students:0, status:data.status, experience:0, rating:0 }); }
              else if (role === 'Administrator') { (global.SRMS_DATA.admins || []).push({ id:data.id, name:name, email:email, role:'Admin', dept:'--', lastActive:'--', status:data.status }); }
              else { (global.SRMS_DATA.studentRoster || []).unshift({ id:data.id, name:name, email:email, dept:'--', program:'--', sem:1, section:'A', batch:'2026-2030', advisor:'--', status:data.status, attendance:0, cgpa:0, phone:'--' }); }
              m.close();
              UI.toast('success', 'User created', data.name + ' can now sign in with the temporary password.');
            }
            onSaved();
          });
        }
      });
    }

    draw();
  }

  R.add('users', 'admin', { title:'User Management', crumbs:['System','User Management'], render:usersPage });
})(window);
