/* =============================================================================
   SRMS - Student Profile  (js/pages/student/profile.js)
   Personal information, academic information, photo upload, quick actions and
   an academic summary sidebar.
   ========================================================================== */
(function (global) {
  'use strict';
  var U = global.SRMS_UTIL;
  var UI = global.SRMS_UI;
  var R = global.SRMS_ROUTES;
  var C = global.SRMS_CHARTS;

  var photoData = null;

  function infoItem(label, value, muted) {
    return '<div class="info-item"><dt>' + U.esc(label) + '</dt><dd' + (muted ? ' class="muted"' : '') + '>' + U.esc(value === null || value === undefined || value === '' ? '--' : value) + '</dd></div>';
  }

  function profilePage(host, ctx) {
    var D = global.SRMS_DATA;
    var sp = D.studentProfile;
    var A = D.analytics || {};

    host.innerHTML =
      UI.pageHead({ title:'My Profile', subtitle:'Your personal details, academic record and account actions.',
        actions:'<button class="btn btn-outline" id="pf-print"><i class="fas fa-print"></i> Print</button>' +
                '<button class="btn btn-outline" id="pf-change-pw"><i class="fas fa-key"></i> Change Password</button>' +
                '<button class="btn btn-primary" id="pf-download"><i class="fas fa-download"></i> Download Profile</button>' }) +

      '<div class="profile-layout">' +
        /* ------------------------------------------------ LEFT CARD */
        '<div class="grid" style="gap:18px">' +
          '<div class="card profile-card">' +
            '<div class="profile-photo-wrap">' +
              '<div class="profile-photo" id="pf-photo">' + U.esc(U.initials(sp.fullName)) + '</div>' +
              '<button class="profile-photo-edit" id="pf-photo-btn" aria-label="Change profile photo"><i class="fas fa-camera"></i></button>' +
              '<input type="file" id="pf-photo-input" accept="image/*" class="sr-only">' +
            '</div>' +
            '<h3 class="profile-name">' + U.esc(sp.fullName) + '</h3>' +
            '<p class="profile-sub">' + U.esc(sp.rollNo) + ' \u00b7 ' + U.esc(sp.program) + '</p>' +
            '<div class="profile-tags">' + UI.badge(sp.status, 'green', 'fa-circle-check') + UI.badge(sp.semesterLabel, 'blue') + UI.badge(sp.scholar, 'yellow', 'fa-award') + '</div>' +
            '<div class="stat-mini-strip mt-20">' +
              '<div class="stat-mini"><strong>' + U.fmtGpa(sp.cgpa) + '</strong><span>CGPA</span></div>' +
              '<div class="stat-mini"><strong>' + sp.attendanceOverall + '%</strong><span>Attendance</span></div>' +
              '<div class="stat-mini"><strong>' + sp.rank + '</strong><span>Rank</span></div>' +
            '</div>' +
            '<div class="profile-quick">' +
              '<button class="btn btn-primary btn-block" id="pf-edit"><i class="fas fa-pen-to-square"></i> Edit Profile</button>' +
              '<button class="btn btn-outline btn-block" id="pf-change-pw2"><i class="fas fa-key"></i> Change Password</button>' +
              '<button class="btn btn-outline btn-block" id="pf-download2"><i class="fas fa-file-arrow-down"></i> Download Profile</button>' +
            '</div>' +
          '</div>' +

          UI.card({ title:'Academic Summary', icon:'fa-chart-simple',
            body:UI.meterList([
              { label:'Degree completion',  value:Math.round((sp.creditsCompleted / sp.totalCredits) * 100) + '%', percent:(sp.creditsCompleted / sp.totalCredits) * 100, tone:'' },
              { label:'Attendance record',  value:sp.attendanceOverall + '%', percent:sp.attendanceOverall, tone: sp.attendanceOverall >= 75 ? 'green' : 'red' },
              { label:'CGPA on 4.0 scale',  value:U.fmtGpa(sp.cgpa), percent:U.cgpaToPercent(sp.cgpa), tone:'purple' },
              { label:'Fee clearance',      value:sp.feeStatus, percent:100, tone:'green' }
            ]) }) +
        '</div>' +

        /* ---------------------------------------------- RIGHT COLUMN */
        '<div class="grid" style="gap:18px">' +
          UI.card({ title:'Personal Information', icon:'fa-id-card', subtitle:'Official details recorded by the registrar office',
            actions:'<button class="btn btn-ghost btn-sm" id="pf-edit2"><i class="fas fa-pen"></i> Edit</button>',
            body:'<dl class="info-grid">' +
              infoItem('Full Name', sp.fullName) +
              infoItem('Student ID', sp.id) +
              infoItem('Roll Number', sp.rollNo) +
              infoItem('Father Name', sp.fatherName) +
              infoItem('Date of Birth', U.fmtDateLong(sp.dob)) +
              infoItem('Gender', sp.gender) +
              infoItem('CNIC', sp.cnic) +
              infoItem('Blood Group', sp.bloodGroup) +
              infoItem('Email', sp.email) +
              infoItem('Phone', sp.phone) +
              infoItem('City', sp.city) +
              infoItem('Country', sp.country) +
              '<div style="grid-column:1/-1">' + infoItem('Address', sp.address) + '</div>' +
            '</dl>' }) +

          UI.card({ title:'Academic Information', icon:'fa-graduation-cap', subtitle:'Programme enrolment and performance record',
            body:'<dl class="info-grid">' +
              infoItem('Department', sp.department) +
              infoItem('Program', sp.program) +
              infoItem('Degree', sp.degree) +
              infoItem('Current Semester', sp.semesterLabel) +
              infoItem('Section', sp.section) +
              infoItem('Batch', sp.batch) +
              infoItem('CGPA', U.fmtGpa(sp.cgpa) + ' / 4.00') +
              infoItem('Credits Completed', sp.creditsCompleted + ' of ' + sp.totalCredits) +
              infoItem('Advisor', sp.advisor) +
              infoItem('Advisor Email', sp.advisorEmail) +
              infoItem('Enrollment Date', U.fmtDateLong(sp.enrollmentDate)) +
              infoItem('Expected Graduation', U.fmtDateLong(sp.expectedGraduation)) +
            '</dl>' }) +

          '<div class="grid grid-2">' +
            UI.card({ title:'Result History', icon:'fa-clock-rotate-left',
              body:UI.timeline((D.semesterResults || []).slice(0, 5).map(function (s) {
                return { title:s.label + ' \u00b7 GPA ' + U.fmtGpa(s.gpa), text:s.credits + ' credit hours \u00b7 ' + s.courses.length + ' courses', time:s.status, tone: s.status === 'In Progress' ? 'yellow' : 'green' };
              })) }) +
            UI.card({ title:'Attendance Trend', icon:'fa-chart-area',
              body:'<div class="chart-box chart-h-240"><canvas id="chart-profile-att"></canvas></div>' }) +
          '</div>' +
        '</div>' +
      '</div>';

    /* -------------------------------------------------------- PHOTO UPLOAD */
    var input = document.getElementById('pf-photo-input');
    var btn = document.getElementById('pf-photo-btn');
    if (btn && input) {
      btn.addEventListener('click', function () { input.click(); });
      input.addEventListener('change', function () {
        var f = input.files && input.files[0];
        if (!f) return;
        if (f.size > 2 * 1024 * 1024) { UI.toast('error', 'File too large', 'Please choose an image smaller than 2 MB.'); return; }
        var reader = new FileReader();
        reader.onload = function (ev) {
          photoData = ev.target.result;
          var box = document.getElementById('pf-photo');
          box.innerHTML = '<img src="' + photoData + '" alt="Profile photo">';
          UI.toast('success', 'Photo updated', 'Your profile picture has been changed for this session.');
        };
        reader.readAsDataURL(f);
      });
    }

    /* -------------------------------------------------------- EDIT PROFILE */
    function openEdit() {
      UI.modal({
        title:'Edit Profile', subtitle:'Update your contact details. Academic fields are managed by the registrar.', size:'lg',
        body:'<div class="form-grid">' +
          '<div class="form-group"><label class="field-label">Full Name</label><div class="input-wrap no-icon"><input id="ep-name" value="' + U.esc(sp.fullName) + '"></div></div>' +
          '<div class="form-group"><label class="field-label">Father Name</label><div class="input-wrap no-icon"><input id="ep-father" value="' + U.esc(sp.fatherName) + '"></div></div>' +
          '<div class="form-group"><label class="field-label">Email</label><div class="input-wrap"><i class="fas fa-envelope input-icon"></i><input id="ep-email" value="' + U.esc(sp.email) + '"></div></div>' +
          '<div class="form-group"><label class="field-label">Phone</label><div class="input-wrap"><i class="fas fa-phone input-icon"></i><input id="ep-phone" value="' + U.esc(sp.phone) + '"></div></div>' +
          '<div class="form-group"><label class="field-label">Date of Birth</label><div class="input-wrap no-icon"><input type="date" id="ep-dob" value="' + U.esc(sp.dob) + '"></div></div>' +
          '<div class="form-group"><label class="field-label">Gender</label><div class="input-wrap no-icon"><select id="ep-gender"><option' + (sp.gender === 'Male' ? ' selected' : '') + '>Male</option><option' + (sp.gender === 'Female' ? ' selected' : '') + '>Female</option><option>Other</option></select></div></div>' +
          '<div class="form-group form-span-2"><label class="field-label">Address</label><div class="input-wrap"><textarea id="ep-address" style="min-height:72px">' + U.esc(sp.address) + '</textarea></div></div>' +
        '</div><span class="field-error" id="ep-error"></span>',
        footer:'<button class="btn btn-outline" data-modal-close>Cancel</button><button class="btn btn-primary" id="ep-save"><i class="fas fa-check"></i> Save Changes</button>',
        onMount:function (m) {
          m.on('#ep-save', 'click', function () {
            var name = m.el.querySelector('#ep-name').value.trim();
            var email = m.el.querySelector('#ep-email').value.trim();
            var phone = m.el.querySelector('#ep-phone').value.trim();
            var err = m.el.querySelector('#ep-error');
            if (!U.isRequired(name)) { err.textContent = 'Full name is required.'; return; }
            if (!U.isEmail(email)) { err.textContent = 'Enter a valid email address.'; return; }
            if (!U.isPhone(phone)) { err.textContent = 'Enter a valid phone number.'; return; }
            err.textContent = '';
            sp.fullName = name; sp.email = email; sp.phone = phone;
            sp.fatherName = m.el.querySelector('#ep-father').value.trim();
            sp.dob = m.el.querySelector('#ep-dob').value;
            sp.gender = m.el.querySelector('#ep-gender').value;
            sp.address = m.el.querySelector('#ep-address').value.trim();
            m.close();
            UI.toast('success', 'Profile updated', 'Your changes have been saved successfully.');
            R.reRender({ role:ctx.role, user:ctx.user, go:ctx.go });
          });
        }
      });
    }

    ['pf-edit','pf-edit2'].forEach(function (id) {
      var b = document.getElementById(id);
      if (b) b.addEventListener('click', openEdit);
    });

    /* ------------------------------------------------------- DOWNLOAD */
    function doDownload() {
      var lines = [
        'SRMS - STUDENT PROFILE RECORD',
        '========================================',
        'Generated: ' + U.fmtDateTime(new Date()),
        '',
        'PERSONAL INFORMATION',
        'Full Name      : ' + sp.fullName,
        'Student ID     : ' + sp.id,
        'Roll Number    : ' + sp.rollNo,
        'Father Name    : ' + sp.fatherName,
        'Date of Birth  : ' + U.fmtDateLong(sp.dob),
        'Gender         : ' + sp.gender,
        'CNIC           : ' + sp.cnic,
        'Email          : ' + sp.email,
        'Phone          : ' + sp.phone,
        'Address        : ' + sp.address,
        '',
        'ACADEMIC INFORMATION',
        'Department     : ' + sp.department,
        'Program        : ' + sp.program,
        'Semester       : ' + sp.semesterLabel,
        'Section        : ' + sp.section,
        'Batch          : ' + sp.batch,
        'CGPA           : ' + U.fmtGpa(sp.cgpa) + ' / 4.00',
        'Credits        : ' + sp.creditsCompleted + ' / ' + sp.totalCredits,
        'Advisor        : ' + sp.advisor,
        'Enrollment     : ' + U.fmtDateLong(sp.enrollmentDate),
        'Attendance     : ' + sp.attendanceOverall + '%',
        'Rank           : ' + sp.rank + ' of ' + sp.totalStudentsInBatch
      ];
      U.download('srms-profile-' + sp.id + '.txt', lines.join('\r\n'));
      UI.toast('success', 'Profile downloaded', 'srms-profile-' + sp.id + '.txt saved to your device.');
    }
    ['pf-download','pf-download2'].forEach(function (id) {
      var b = document.getElementById(id);
      if (b) b.addEventListener('click', doDownload);
    });

    ['pf-change-pw','pf-change-pw2'].forEach(function (id) {
      var b = document.getElementById(id);
      if (b) b.addEventListener('click', function () { global.SRMS_APP.openChangePassword(); });
    });

    var pr = document.getElementById('pf-print');
    if (pr) pr.addEventListener('click', function () {
      UI.toast('info', 'Opening print dialog', 'Use your browser print options to save as PDF.');
      setTimeout(function () { window.print(); }, 420);
    });
  }

  function afterProfile() {
    var sa = (global.SRMS_DATA.subjectAttendance || []).slice(0, 6);
    C.line('chart-profile-att', {
      labels: global.SRMS_DATA.cgpaTrend ? global.SRMS_DATA.cgpaTrend.labels : [],
      legend:false, min:70, max:100, unit:'%',
      datasets:[{ label:'Attendance', data:[82, 84, 85, 86, 87], color:'#14B8A6' }]
    });
  }

  R.add('profile', 'student', { title:'My Profile', crumbs:['Main','Profile'], render:profilePage, afterRender:afterProfile });
})(window);
