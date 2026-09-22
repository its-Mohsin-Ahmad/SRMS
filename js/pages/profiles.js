/* =============================================================================
   SRMS - Faculty & Admin Profiles  (js/pages/profiles.js)
   Reuses the student profile renderer for teacher and admin accounts.
   ========================================================================== */
(function (global) {
  'use strict';
  var U = global.SRMS_UTIL;
  var UI = global.SRMS_UI;
  var R = global.SRMS_ROUTES;
  var C = global.SRMS_CHARTS;

  function genericProfile(host, ctx) {
    var D = global.SRMS_DATA;
    var u = ctx.user;
    var meta = u.meta || {};
    var isTeacher = ctx.role === 'teacher';

    var personal = [
      ['Full Name', u.name], ['Employee / Staff ID', meta.id || u.identifier],
      ['Email', u.email], ['Phone', meta.phone || '+92 300 0000000'],
      ['Department', meta.dept || 'Administration'], ['Designation', meta.designation || u.roleLabel],
      ['CNIC', meta.cnic || '42101-9876543-2'], ['Date of Joining', meta.experience !== undefined ? (2026 - meta.experience) + '-01-15' : '2020-03-01']
    ];

    var academic = isTeacher ? [
      ['Total Experience', (meta.experience || 0) + ' years'],
      ['Courses Assigned', (meta.courses || []).join(', ') || 'None'],
      ['Students Supervised', String(meta.students || 0)],
      ['Student Rating', (meta.rating || 0) + ' / 5.00'],
      ['Office', 'Faculty Block B, Room 214'],
      ['Consultation Hours', 'Mon & Thu, 02:00 - 04:00 PM'],
      ['Qualification', 'PhD ' + (meta.dept || '')],
      ['Account Status', meta.status || 'Active']
    ] : [
      ['Role', meta.role || 'Administrator'],
      ['Department', meta.dept || 'Administration'],
      ['Access Level', meta.role === 'Super Admin' ? 'Full platform control' : 'Module-scoped access'],
      ['Last Active', meta.lastActive ? U.fmtDateTime(meta.lastActive) : '--'],
      ['Modules Owned', 'Students, Results, Notices, Reports'],
      ['Account Status', meta.status || 'Active'],
      ['Password Age', '42 days since last change'],
      ['Two-Factor', 'Enabled via mobile OTP']
    ];

    host.innerHTML =
      UI.pageHead({ title:'My Profile', subtitle:'Your staff record and platform access summary.',
        actions:'<button class="btn btn-outline" id="gp-print"><i class="fas fa-print"></i> Print</button>' +
                '<button class="btn btn-outline" id="gp-pw"><i class="fas fa-key"></i> Change Password</button>' +
                '<button class="btn btn-primary" id="gp-edit"><i class="fas fa-pen"></i> Edit Profile</button>' }) +

      '<div class="profile-layout">' +
        '<div class="grid" style="gap:18px">' +
          '<div class="card profile-card">' +
            '<div class="profile-photo-wrap"><div class="profile-photo">' + U.esc(U.initials(u.name)) + '</div>' +
              '<button class="profile-photo-edit" id="gp-photo" aria-label="Change photo"><i class="fas fa-camera"></i></button></div>' +
            '<h3 class="profile-name">' + U.esc(u.name) + '</h3>' +
            '<p class="profile-sub">' + U.esc(u.roleLabel) + '</p>' +
            '<div class="profile-tags">' + UI.statusBadge(meta.status || 'Active') + UI.badge(meta.id || u.identifier, 'purple') + '</div>' +
            '<div class="stat-mini-strip mt-20">' +
              (isTeacher ?
                '<div class="stat-mini"><strong>' + (meta.students || 0) + '</strong><span>Students</span></div>' +
                '<div class="stat-mini"><strong>' + (meta.courses || []).length + '</strong><span>Courses</span></div>' +
                '<div class="stat-mini"><strong>' + (meta.rating || 0) + '</strong><span>Rating</span></div>' :
                '<div class="stat-mini"><strong>2712</strong><span>Users</span></div>' +
                '<div class="stat-mini"><strong>18</strong><span>Pending</span></div>' +
                '<div class="stat-mini"><strong>42</strong><span>Actions</span></div>') +
            '</div>' +
            '<div class="profile-quick">' +
              '<button class="btn btn-primary btn-block" id="gp-edit2"><i class="fas fa-pen"></i> Edit Profile</button>' +
              '<button class="btn btn-outline btn-block" id="gp-pw2"><i class="fas fa-key"></i> Change Password</button>' +
              '<button class="btn btn-outline btn-block" id="gp-2fa"><i class="fas fa-shield-halved"></i> Security Settings</button>' +
            '</div>' +
          '</div>' +
          UI.card({ title:isTeacher ? 'Teaching Load' : 'Administrative Activity', icon:'fa-chart-simple',
            body: isTeacher ?
              UI.meterList([
                { label:'Syllabus coverage', value:'78%', percent:78, tone:'' },
                { label:'Result submission', value:'92%', percent:92, tone:'green' },
                { label:'Attendance marking', value:'100%', percent:100, tone:'green' }
              ]) :
              UI.meterList([
                { label:'Data integrity checks', value:'100%', percent:100, tone:'green' },
                { label:'Pending approvals', value:'18 items', percent:46, tone:'yellow' },
                { label:'Backup status', value:'Healthy', percent:100, tone:'green' }
              ]) }) +
        '</div>' +

        '<div class="grid" style="gap:18px">' +
          UI.card({ title:'Personal Information', icon:'fa-id-card',
            body:'<dl class="info-grid">' + personal.map(function (p) {
              return '<div class="info-item"><dt>' + U.esc(p[0]) + '</dt><dd>' + U.esc(p[1] || '--') + '</dd></div>';
            }).join('') + '</dl>' }) +
          UI.card({ title:isTeacher ? 'Academic Information' : 'Administrative Information', icon: isTeacher ? 'fa-graduation-cap' : 'fa-user-shield',
            body:'<dl class="info-grid">' + academic.map(function (p) {
              return '<div class="info-item"><dt>' + U.esc(p[0]) + '</dt><dd>' + U.esc(p[1] || '--') + '</dd></div>';
            }).join('') + '</dl>' }) +
        '</div>' +
      '</div>';

    function openEdit() {
      UI.modal({
        title:'Edit Profile', subtitle:'Update your staff contact details.', size:'lg',
        body:'<div class="form-grid">' +
          '<div class="form-group"><label class="field-label">Full Name</label><div class="input-wrap no-icon"><input id="gp-name" value="' + U.esc(u.name) + '"></div></div>' +
          '<div class="form-group"><label class="field-label">Email</label><div class="input-wrap"><i class="fas fa-envelope input-icon"></i><input id="gp-email" value="' + U.esc(u.email) + '"></div></div>' +
          '<div class="form-group"><label class="field-label">Phone</label><div class="input-wrap"><i class="fas fa-phone input-icon"></i><input id="gp-phone" value="' + U.esc(meta.phone || '') + '"></div></div>' +
          '<div class="form-group"><label class="field-label">Office</label><div class="input-wrap no-icon"><input value="Faculty Block B, Room 214"></div></div>' +
        '</div><span class="field-error" id="gp-error"></span>',
        footer:'<button class="btn btn-outline" data-modal-close>Cancel</button><button class="btn btn-primary" id="gp-save"><i class="fas fa-check"></i> Save Changes</button>',
        onMount:function (m) {
          m.on('#gp-save', 'click', function () {
            var name = m.el.querySelector('#gp-name').value.trim();
            var email = m.el.querySelector('#gp-email').value.trim();
            var err = m.el.querySelector('#gp-error');
            if (!U.minLen(name, 3)) { err.textContent = 'Full name must be at least 3 characters.'; return; }
            if (!U.isEmail(email)) { err.textContent = 'Enter a valid email address.'; return; }
            err.textContent = '';
            u.name = name; u.email = email;
            m.close();
            UI.toast('success', 'Profile updated', 'Your staff record has been saved.');
            if (global.SRMS_NAVBAR) global.SRMS_NAVBAR.mountUser(u);
            R.reRender({ role:ctx.role, user:u, go:ctx.go });
          });
        }
      });
    }

    ['gp-edit','gp-edit2'].forEach(function (id) {
      var b = document.getElementById(id); if (b) b.addEventListener('click', openEdit);
    });
    ['gp-pw','gp-pw2'].forEach(function (id) {
      var b = document.getElementById(id); if (b) b.addEventListener('click', function () { global.SRMS_APP.openChangePassword(); });
    });
    var photo = document.getElementById('gp-photo');
    if (photo) photo.addEventListener('click', function () { UI.toast('info', 'Photo upload', 'Choose a square image smaller than 2 MB.'); });
    var tfa = document.getElementById('gp-2fa');
    if (tfa) tfa.addEventListener('click', function () { UI.toast('success', 'Security up to date', 'Two-factor authentication is already enabled.'); });
    var pr = document.getElementById('gp-print');
    if (pr) pr.addEventListener('click', function () { setTimeout(function () { window.print(); }, 350); });
  }

  R.add('profile', 'teacher', { title:'My Profile', crumbs:['Main','Profile'], render:genericProfile });
  R.add('profile', 'admin', { title:'My Profile', crumbs:['Main','Profile'], render:genericProfile });
})(window);
