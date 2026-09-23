/* =============================================================================
   SRMS - Application Bootstrap  (js/app.js)
   Loading screen, authentication flow, session restore, global event wiring.
   ========================================================================== */
(function (global) {
  'use strict';
  var U = global.SRMS_UTIL;
  var UI = global.SRMS_UI;

  var state = { role:'student', user:null, booted:false };

  /* ----------------------------------------------------------- ROLE SETUP */
  var ROLE_LABEL = { student:'Student', teacher:'Teacher', admin:'Administrator' };
  var ROLE_DEFAULT_PAGE = { student:'dashboard', teacher:'dashboard', admin:'dashboard' };

  function buildUser(account, role) {
    if (role === 'student') {
      var sp = global.SRMS_DATA.studentProfile;
      return {
        id:account.id, role:'student', name:sp.fullName, email:account.email,
        identifier:sp.id, roleLabel:sp.program + ' \u00b7 ' + sp.semesterLabel,
        meta:sp
      };
    }
    if (role === 'teacher') {
      var t = global.SRMS_DATA.teachers[0];
      return {
        id:account.id, role:'teacher', name:t.name, email:account.email,
        identifier:t.id, roleLabel:t.designation + ' \u00b7 ' + t.dept,
        meta:t
      };
    }
    var a = global.SRMS_DATA.admins[0];
    return {
      id:account.id, role:'admin', name:a.name, email:account.email,
      identifier:a.id, roleLabel:a.role, meta:a
    };
  }

  /* Authenticate against the demo user directory. Passwords are never stored
     in plain text in a real backend; the hash helper demonstrates the shape
     of the value that would be compared server-side. */
  function authenticate(identifier, password) {
    var users = global.SRMS_DATA.users || [];
    var id = String(identifier || '').trim().toLowerCase();
    var account = users.filter(function (u) {
      return u.email.toLowerCase() === id || u.identifier.toLowerCase() === id;
    })[0];
    if (!account) return { ok:false, error:'No account found with that email or ID.' };
    if (account.role !== state.role) {
      return { ok:false, error:'This account is registered as ' + ROLE_LABEL[account.role] + '. Select the correct role tab.' };
    }
    if (account.password !== password) return { ok:false, error:'Incorrect password. Try demo123 for the demo accounts.' };
    if (account.status !== 'active') return { ok:false, error:'This account is deactivated. Contact the administrator.' };
    return { ok:true, account:account };
  }

  /* --------------------------------------------------------------- SCREENS */
  function showLogin() {
    var shell = document.getElementById('app-shell');
    var login = document.getElementById('login-page');
    if (shell) shell.hidden = true;
    if (login) login.style.display = '';
    document.body.style.overflow = '';
    var em = document.getElementById('login-email');
    if (em) setTimeout(function () { em.focus(); }, 120);
  }

  function showApp() {
    var shell = document.getElementById('app-shell');
    var login = document.getElementById('login-page');
    if (login) login.style.display = 'none';
    if (shell) shell.hidden = false;
  }

  function hideLoading() {
    var l = document.getElementById('loading-screen');
    if (l) { l.classList.add('hide'); setTimeout(function () { if (l.parentNode) l.parentNode.removeChild(l); }, 420); }
  }

  /* ------------------------------------------------------------------ ROUTE */
  function go(page) {
    if (!state.user) return;
    var target = page || ROLE_DEFAULT_PAGE[state.user.role];
    if (!global.SRMS_ROUTES.has(target, state.user.role)) {
      UI.toast('warning', 'Not available', 'That page is not available for your role.');
      return;
    }
    if (global.SRMS_SIDEBAR) global.SRMS_SIDEBAR.setActive(target);
    global.SRMS_ROUTES.render(target, { role:state.user.role, user:state.user, go:go });
  }

  /* ------------------------------------------------------------------- LOGIN */
  function startSession(account, remember) {
    var user = buildUser(account, account.role);
    state.user = user;
    var session = { userId:account.id, role:account.role, name:user.name, email:user.email, at:Date.now() };
    U.setSession(session);
    if (remember) U.setPrefs(Object.assign(U.getPrefs(), { remember:user.email }));

    showApp();
    if (global.SRMS_SIDEBAR) global.SRMS_SIDEBAR.render(user.role, ROLE_DEFAULT_PAGE[user.role]);
    if (global.SRMS_SIDEBAR) global.SRMS_SIDEBAR.init(user.role, go);
    if (global.SRMS_NAVBAR) global.SRMS_NAVBAR.init(user.role, user, go);

    var logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.onclick = logout;
    var sideLogout = document.getElementById('sidebar-logout');
    if (sideLogout) sideLogout.onclick = logout;

    var chpw = document.getElementById('open-change-password');
    if (chpw) chpw.onclick = function () { UI.closeDropdowns && UI.closeDropdowns(); openChangePassword(); };

    go(ROLE_DEFAULT_PAGE[user.role]);
    setTimeout(function () {
      UI.toast('success', 'Welcome back, ' + user.name.split(' ')[0] + '!', 'You are signed in as ' + ROLE_LABEL[user.role] + '.');
    }, 380);
  }

  function logout() {
    UI.confirm({
      title:'Sign out of SRMS?',
      message:'You will need to sign in again to access your dashboard.',
      confirmText:'Sign Out', tone:'danger',
      onConfirm:function () {
        U.clearSession();
        state.user = null;
        showLogin();
        if (global.SRMS_CHARTS) global.SRMS_CHARTS.destroyAll();
        UI.toast('info', 'Signed out', 'Your session has been closed securely.');
      }
    });
  }

  /* Change password dialog (shared by every role) -------------------------- */
  function openChangePassword() {
    UI.modal({
      title:'Change Password', subtitle:'Choose a strong password with at least 8 characters.',
      body:
        '<div class="form-grid">' +
          '<div class="form-group"><label for="cp-current">Current Password</label>' +
            '<div class="input-wrap"><i class="fas fa-lock input-icon"></i><input type="password" id="cp-current" placeholder="Enter current password"></div></div>' +
          '<div class="form-group"><label for="cp-new">New Password</label>' +
            '<div class="input-wrap"><i class="fas fa-key input-icon"></i><input type="password" id="cp-new" placeholder="Enter new password"></div>' +
            '<span class="helper-text" id="cp-strength">Password strength: --</span></div>' +
          '<div class="form-group"><label for="cp-confirm">Confirm New Password</label>' +
            '<div class="input-wrap"><i class="fas fa-key input-icon"></i><input type="password" id="cp-confirm" placeholder="Re-enter new password"></div>' +
            '<span class="field-error" id="cp-error"></span></div>' +
        '</div>',
      footer:'<button class="btn btn-outline" data-modal-close>Cancel</button>' +
             '<button class="btn btn-primary" id="cp-save"><i class="fas fa-check"></i> Update Password</button>',
      onMount:function (m) {
        var nu = m.el.querySelector('#cp-new');
        nu.addEventListener('input', function () {
          var s = U.passwordStrength(nu.value);
          var label = s <= 1 ? 'Weak' : s === 2 ? 'Fair' : s === 3 ? 'Strong' : 'Very strong';
          var el = m.el.querySelector('#cp-strength');
          el.textContent = 'Password strength: ' + label;
          el.style.color = s <= 1 ? '#EF4444' : s === 2 ? '#F59E0B' : '#22C55E';
        });
        m.on('#cp-save', 'click', function () {
          var cur = m.el.querySelector('#cp-current').value;
          var nw = nu.value;
          var cf = m.el.querySelector('#cp-confirm').value;
          var err = m.el.querySelector('#cp-error');
          if (!U.isRequired(cur)) { err.textContent = 'Enter your current password.'; return; }
          if (U.passwordStrength(nw) < 2) { err.textContent = 'New password is too weak.'; return; }
          if (nw !== cf) { err.textContent = 'Passwords do not match.'; return; }
          err.textContent = '';
          m.close();
          UI.toast('success', 'Password updated', 'Your password was changed. Hashed value stored: ' + U.fakeHash(nw).slice(0, 22) + '...');
        });
      }
    });
  }

  /* --------------------------------------------------------------- LOGIN UI */
  function initLogin() {
    var form = document.getElementById('login-form');
    var roleBtns = U.qsa('.role-btn');
    var idLabel = document.getElementById('login-id-label');
    var emailInput = document.getElementById('login-email');
    var prefs = U.getPrefs();
    var remember = document.getElementById('remember-me');

    var PLACEHOLDER = {
      student:'student@university.edu or STU-2021-0012',
      teacher:'teacher@university.edu or TCH-1001',
      admin:'admin@university.edu or ADM-0001'
    };
    var LABEL = { student:'Email or Student ID', teacher:'Email or Teacher ID', admin:'Email or Admin ID' };

    function setRole(role) {
      state.role = role;
      roleBtns.forEach(function (b) {
        var on = b.getAttribute('data-role') === role;
        b.classList.toggle('active', on);
        b.setAttribute('aria-selected', String(on));
      });
      if (idLabel) idLabel.textContent = LABEL[role];
      if (emailInput) emailInput.placeholder = PLACEHOLDER[role];
    }

    roleBtns.forEach(function (b) {
      b.addEventListener('click', function () { setRole(b.getAttribute('data-role')); });
    });

    if (prefs.remember && emailInput) emailInput.value = prefs.remember;
    if (remember) remember.checked = !!prefs.remember;

    var toggle = document.getElementById('toggle-password');
    var pw = document.getElementById('login-password');
    if (toggle && pw) toggle.addEventListener('click', function () {
      var showing = pw.type === 'text';
      pw.type = showing ? 'password' : 'text';
      toggle.innerHTML = '<i class="fas ' + (showing ? 'fa-eye' : 'fa-eye-slash') + '"></i>';
      toggle.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
    });

    U.qsa('.demo-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        var role = chip.getAttribute('data-demo');
        setRole(role);
        var map = { student:'student@university.edu', teacher:'teacher@university.edu', admin:'admin@university.edu' };
        emailInput.value = map[role];
        pw.value = 'demo123';
        UI.toast('info', 'Demo credentials filled', 'Click Sign In to continue as ' + ROLE_LABEL[role] + '.');
      });
    });

    var forgot = document.getElementById('forgot-password');
    if (forgot) forgot.addEventListener('click', function (e) {
      e.preventDefault();
      UI.modal({
        title:'Reset your password', subtitle:'Enter your registered email and we will send a reset link.',
        body:'<div class="form-group"><label for="fp-email">Registered Email</label>' +
          '<div class="input-wrap"><i class="fas fa-envelope input-icon"></i><input type="email" id="fp-email" placeholder="you@university.edu"></div>' +
          '<span class="helper-text">Demo environment: no email is actually sent.</span></div>',
        footer:'<button class="btn btn-outline" data-modal-close>Cancel</button>' +
               '<button class="btn btn-primary" id="fp-send"><i class="fas fa-paper-plane"></i> Send Reset Link</button>',
        onMount:function (m) {
          m.on('#fp-send', 'click', function () {
            var v = m.el.querySelector('#fp-email').value;
            if (!U.isEmail(v)) { UI.toast('error', 'Invalid email', 'Enter a valid email address.'); return; }
            m.close();
            UI.toast('success', 'Reset link sent', 'Check ' + v + ' for further instructions.');
          });
        }
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var errEl = document.getElementById('login-email-error');
      var pwErr = document.getElementById('login-password-error');
      var id = emailInput.value.trim();
      var password = pw.value;
      errEl.textContent = ''; pwErr.textContent = '';
      emailInput.closest('.input-wrap').classList.remove('has-error');
      pw.closest('.input-wrap').classList.remove('has-error');

      if (!U.isRequired(id)) { errEl.textContent = 'Email or ID is required.'; emailInput.closest('.input-wrap').classList.add('has-error'); return; }
      if (!U.minLen(password, 6)) { pwErr.textContent = 'Password must be at least 6 characters.'; pw.closest('.input-wrap').classList.add('has-error'); return; }

      var btn = document.getElementById('login-submit');
      btn.classList.add('is-loading'); btn.disabled = true;

      setTimeout(function () {
        var res = authenticate(id, password);
        btn.classList.remove('is-loading'); btn.disabled = false;
        if (!res.ok) {
          pwErr.textContent = res.error;
          pw.closest('.input-wrap').classList.add('has-error');
          UI.toast('error', 'Sign in failed', res.error);
          return;
        }
        startSession(res.account, remember && remember.checked);
      }, 620);
    });

    setRole('student');
  }

  /* -------------------------------------------------------- SESSION RESTORE */
  function restoreSession() {
    var s = U.getSession();
    if (!s) { showLogin(); return false; }
    var account = (global.SRMS_DATA.users || []).filter(function (u) { return u.id === s.userId; })[0];
    if (!account) { U.clearSession(); showLogin(); return false; }
    startSession(account, true);
    return true;
  }

  /* -------------------------------------------------------------- BOOTSTRAP */
  function boot() {
    initLogin();

    var restored = restoreSession();
    if (!restored) showLogin();

    /* Global keyboard shortcuts */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && global.SRMS_SIDEBAR && global.SRMS_SIDEBAR.isMobile()) global.SRMS_SIDEBAR.closeDrawer();
    });

    /* Dismissible alerts + generic confirm-free buttons */
    document.addEventListener('click', function (e) {
      var d = e.target.closest('[data-dismiss]');
      if (d) { var a = d.closest('.alert'); if (a) a.remove(); }
    });

    state.booted = true;

    setTimeout(hideLoading, restored ? 520 : 900);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  global.SRMS_APP = {
    go:go,
    logout:logout,
    currentUser:function () { return state.user; },
    currentRole:function () { return state.user ? state.user.role : state.role; },
    openChangePassword:openChangePassword,
    setRoleTab:function (r) { state.role = r; }
  };
})(window);
