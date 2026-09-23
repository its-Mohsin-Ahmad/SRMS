/* =============================================================================
   SRMS - Registration / Sign-Up  (js/components/register.js)
   Multi-step Student & Teacher registration matching the SRMS design system.
   NOTE: front-end demo. In production, duplicate-account checks, password
   hashing, email verification, CSRF and rate limiting run on the server; only
   a hashed password is persisted here, never plaintext.
   ========================================================================== */
(function (global) {
  'use strict';
  var U = global.SRMS_UTIL;
  var UI = global.SRMS_UI;
  var REG_KEY = 'srms.registered';
  var state = { type:'student', step:1, submitting:false, resendTimer:null };
  var inited = false;

  function $(id) { return document.getElementById(id); }
  function val(id) { var el = $(id); return el ? String(el.value || '').trim() : ''; }

  function loadRegistered() {
    try { return JSON.parse(localStorage.getItem(REG_KEY)) || []; } catch (e) { return []; }
  }
  function saveRegistered(list) {
    try { localStorage.setItem(REG_KEY, JSON.stringify(list)); } catch (e) {}
  }

  /* ---------------------------------------------------------- VALIDATION */
  function setError(id, msg) {
    var input = $(id); if (!input) return;
    var wrap = input.closest ? input.closest('.input-wrap') : null;
    var err = $(id + '-err');
    if (msg) {
      if (wrap) wrap.classList.add('has-error');
      if (err) err.textContent = msg;
      input.setAttribute('aria-invalid', 'true');
    } else {
      if (wrap) wrap.classList.remove('has-error');
      if (err) err.textContent = '';
      input.removeAttribute('aria-invalid');
    }
  }

  function rulesFor(step) {
    var t = state.type;
    if (step === 1) {
      if (t === 'student') return [
        { id:'rg-first', req:true, msg:'Please enter your first name.' },
        { id:'rg-last', req:true, msg:'Please enter your last name.' },
        { id:'rg-sid', req:true, test:function (v) { return /^[A-Za-z0-9][A-Za-z0-9\-_\/]{3,19}$/.test(v); }, msg:'Please enter a valid Student ID.' },
        { id:'rg-email', req:true, test:function (v) { return U.isEmail(v); }, msg:'Please enter a valid email address.' },
        { id:'rg-phone', req:true, test:function (v) { return U.isPhone(v); }, msg:'Please enter a valid phone number.' },
        { id:'rg-dob', req:true, msg:'Please select your date of birth.' },
        { id:'rg-gender', req:true, msg:'Please select your gender.' }
      ];
      return [
        { id:'rg-tname', req:true, msg:'Please enter your full name.' },
        { id:'rg-tid', req:true, test:function (v) { return /^[A-Za-z0-9][A-Za-z0-9\-_\/]{3,19}$/.test(v); }, msg:'Please enter a valid Teacher ID.' },
        { id:'rg-temail', req:true, test:function (v) { return U.isEmail(v); }, msg:'Please enter a valid email address.' },
        { id:'rg-tphone', req:true, test:function (v) { return U.isPhone(v); }, msg:'Please enter a valid phone number.' }
      ];
    }
    if (step === 2) {
      if (t === 'student') return [
        { id:'rg-dept', req:true, msg:'Please select your department.' },
        { id:'rg-program', req:true, msg:'Please select your program.' },
        { id:'rg-semester', req:true, msg:'Please select your semester.' }
      ];
      return [
        { id:'rg-tdept', req:true, msg:'Please select your department.' },
        { id:'rg-designation', req:true, msg:'Please select your designation.' },
        { id:'rg-qualification', req:true, msg:'Please select your qualification.' },
        { id:'rg-joindate', req:true, msg:'Please select your joining date.' }
      ];
    }
    return [];
  }

  function validateStep(step) {
    var firstBad = null;
    rulesFor(step).forEach(function (r) {
      var v = val(r.id);
      var ok = true;
      if (r.req && !v) ok = false;
      else if (v && r.test && !r.test(v)) ok = false;
      setError(r.id, ok ? '' : r.msg);
      if (!ok && !firstBad) firstBad = r.id;
    });
    if (firstBad) { var el = $(firstBad); if (el) { try { el.focus(); } catch (e) {} } }
    return !firstBad;
  }
  function pwChecks(pw) {
    return { len:pw.length >= 8, upper:/[A-Z]/.test(pw), lower:/[a-z]/.test(pw), num:/[0-9]/.test(pw), spec:/[^A-Za-z0-9]/.test(pw) };
  }
  function mark(id, met) { var el = $(id); if (el) el.classList.toggle('met', !!met); }

  function updateStrength() {
    var pw = val('rg-pw');
    var c = pwChecks(pw);
    mark('req-len', c.len); mark('req-upper', c.upper); mark('req-lower', c.lower);
    mark('req-num', c.num); mark('req-spec', c.spec);
    var score = (c.len?1:0)+(c.upper?1:0)+(c.lower?1:0)+(c.num?1:0)+(c.spec?1:0);
    var level = score <= 2 ? 'weak' : (score <= 4 ? 'medium' : 'strong');
    var word = level.charAt(0).toUpperCase() + level.slice(1);
    var color = level === 'weak' ? 'var(--red)' : level === 'medium' ? 'var(--yellow)' : 'var(--green)';
    var fill = $('pw-fill'), lab = $('pw-label');
    if (fill) { fill.style.width = Math.round(score / 5 * 100) + '%'; fill.style.background = color; }
    if (lab) { lab.textContent = pw ? word : '—'; lab.className = 'pw-label ' + (pw ? level : ''); }
    return { score:score, all:score === 5 };
  }

  function validateSecurity() {
    var ok = true, firstBad = null;
    var pw = val('rg-pw');
    var s = updateStrength();
    if (!pw) { setError('rg-pw', 'Please enter a password.'); ok = false; firstBad = firstBad || 'rg-pw'; }
    else if (!s.all) { setError('rg-pw', 'Please meet all password requirements below.'); ok = false; firstBad = firstBad || 'rg-pw'; }
    else setError('rg-pw', '');

    var pw2 = val('rg-pw2');
    if (!pw2) { setError('rg-pw2', 'Please confirm your password.'); ok = false; firstBad = firstBad || 'rg-pw2'; }
    else if (pw2 !== pw) { setError('rg-pw2', 'Passwords do not match.'); ok = false; firstBad = firstBad || 'rg-pw2'; }
    else setError('rg-pw2', '');

    var terms = $('rg-terms'), terr = $('rg-terms-err');
    if (!terms || !terms.checked) {
      if (terr) terr.textContent = 'Please accept the Terms & Conditions.';
      if (terms) terms.setAttribute('aria-invalid', 'true');
      ok = false; firstBad = firstBad || 'rg-terms';
    } else {
      if (terr) terr.textContent = '';
      if (terms) terms.removeAttribute('aria-invalid');
    }
    if (firstBad) { var el = $(firstBad); if (el) { try { el.focus(); } catch (e) {} } }
    return ok;
  }

  /* Duplicate account check against seeded data + registered store -------- */
  function dupCheck() {
    var D = global.SRMS_DATA || {};
    var reg = loadRegistered();
    var email, idv, emailField, idField;
    if (state.type === 'student') { email = val('rg-email'); idv = val('rg-sid'); emailField = 'rg-email'; idField = 'rg-sid'; }
    else { email = val('rg-temail'); idv = val('rg-tid'); emailField = 'rg-temail'; idField = 'rg-tid'; }
    email = email.toLowerCase(); idv = idv.toUpperCase();

    var emails = [];
    [].concat(D.users || [], D.studentRoster || [], D.teachers || [], reg).forEach(function (x) {
      if (x && x.email) emails.push(String(x.email).toLowerCase());
    });
    if (emails.indexOf(email) > -1) return { field:emailField, msg:'This email address is already registered.' };

    var ids = [];
    (D.users || []).forEach(function (u) { ids.push(String(u.identifier || '').toUpperCase()); });
    (D.studentRoster || []).forEach(function (s) { ids.push(String(s.id || '').toUpperCase()); });
    (D.teachers || []).forEach(function (t) { ids.push(String(t.id || '').toUpperCase()); });
    reg.forEach(function (r) { ids.push(String(r.identifier || '').toUpperCase()); });
    if (ids.indexOf(idv) > -1) return { field:idField, msg:'This ' + (state.type === 'student' ? 'Student' : 'Teacher') + ' ID is already registered.' };
    return null;
  }
  /* ----------------------------------------------------------- STEP NAV */
  function qsa(sel) { return document.querySelectorAll ? Array.prototype.slice.call(document.querySelectorAll(sel)) : []; }

  function goStep(n) {
    state.step = n;
    qsa('.reg-panel').forEach(function (p) { p.classList.toggle('active', Number(p.getAttribute('data-panel')) === n); });
    qsa('.reg-step').forEach(function (s) {
      var i = Number(s.getAttribute('data-step'));
      s.classList.toggle('active', i === n);
      s.classList.toggle('done', i < n);
      if (i === n) s.setAttribute('aria-current', 'step'); else s.removeAttribute('aria-current');
    });
    var back = $('reg-back'), next = $('reg-next'), submit = $('reg-submit');
    if (back) back.hidden = n === 1;
    if (next) next.hidden = n === 3;
    if (submit) submit.hidden = n !== 3;
  }

  function setType(t) {
    state.type = t;
    qsa('[data-atype]').forEach(function (b) {
      var on = b.getAttribute('data-atype') === t;
      b.classList.toggle('active', on);
      b.setAttribute('aria-checked', on ? 'true' : 'false');
    });
    qsa('[data-for]').forEach(function (el) { el.hidden = el.getAttribute('data-for') !== t; });
  }

  /* ------------------------------------------------- EMAIL VERIFICATION */
  function showVerify(email) {
    var wrap = document.querySelector ? document.querySelector('.reg-wrap') : null;
    if (wrap) wrap.classList.add('verifying');
    var verify = $('reg-verify'); if (verify) verify.hidden = false;
    var ve = $('verify-email'); if (ve) ve.textContent = email;
    startResend(30);
    var rb = $('reg-resend'); if (rb) { try { rb.focus(); } catch (e) {} }
  }
  function startResend(sec) {
    if (state.resendTimer) { clearInterval(state.resendTimer); state.resendTimer = null; }
    var btn = $('reg-resend'), lab = $('resend-label');
    var left = sec;
    if (btn) btn.disabled = true;
    if (lab) lab.textContent = 'Resend in ' + left + 's';
    state.resendTimer = setInterval(function () {
      left--;
      if (left <= 0) {
        clearInterval(state.resendTimer); state.resendTimer = null;
        if (btn) btn.disabled = false;
        if (lab) lab.textContent = 'Resend Verification Email';
      } else if (lab) lab.textContent = 'Resend in ' + left + 's';
    }, 1000);
  }

  /* ------------------------------------------------------------ SUBMIT */
  function onSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (state.submitting) return;                       /* block double-submit */
    if (!validateStep(1)) { goStep(1); return; }
    if (!validateStep(2)) { goStep(2); return; }
    if (!validateSecurity()) { goStep(3); return; }
    var dup = dupCheck();
    if (dup) {
      setError(dup.field, dup.msg);
      goStep(1);
      var fe = $(dup.field); if (fe) { try { fe.focus(); } catch (err) {} }
      if (UI && UI.toast) UI.toast('error', 'Duplicate account', dup.msg);
      return;
    }
    var email = state.type === 'student' ? val('rg-email') : val('rg-temail');
    var pw = val('rg-pw');
    var btn = $('reg-submit');
    var lab = btn ? btn.querySelector('.btn-label') : null;
    state.submitting = true;
    if (btn) { btn.disabled = true; btn.classList.add('is-loading'); }
    if (lab) lab.textContent = 'Creating Account...';

    /* Simulated server round-trip. Persist ONLY the hashed password. */
    setTimeout(function () {
      var reg = loadRegistered();
      reg.push({
        identifier: state.type === 'student' ? val('rg-sid') : val('rg-tid'),
        email: email,
        password: U.fakeHash(pw),
        role: state.type,
        name: state.type === 'student' ? (val('rg-first') + ' ' + val('rg-last')).trim() : val('rg-tname'),
        verified: false, createdAt: Date.now()
      });
      saveRegistered(reg);
      if (btn) { btn.classList.remove('is-loading'); btn.classList.add('reg-success'); }
      if (lab) lab.textContent = 'Account Created ✓';
      setTimeout(function () { state.submitting = false; showVerify(email); }, 700);
    }, 1500);
  }
  /* ------------------------------------------------------------ SHOW/HIDE */
  function resetForm() {
    var form = $('register-form');
    if (form) form.reset();
    qsa('.input-wrap.has-error').forEach(function (w) { w.classList.remove('has-error'); });
    qsa('.field-error').forEach(function (e) { e.textContent = ''; });
    var wrap = document.querySelector ? document.querySelector('.reg-wrap') : null;
    if (wrap) wrap.classList.remove('verifying');
    var verify = $('reg-verify'); if (verify) verify.hidden = true;
    var btn = $('reg-submit'); var lab = btn ? btn.querySelector('.btn-label') : null;
    if (btn) { btn.disabled = false; btn.classList.remove('is-loading'); btn.classList.remove('reg-success'); }
    if (lab) lab.textContent = 'Create Account';
    if (state.resendTimer) { clearInterval(state.resendTimer); state.resendTimer = null; }
    state.submitting = false;
    setType(state.type);
    updateStrength();
  }

  function show() {
    var login = document.getElementById('login-page');
    var shell = document.getElementById('app-shell');
    var page = $('register-page');
    if (login) login.style.display = 'none';
    if (shell) shell.hidden = true;
    if (page) page.style.display = '';
    resetForm();
    goStep(1);
    var f = $('rg-first'); if (f) setTimeout(function () { try { f.focus(); } catch (e) {} }, 140);
  }
  function hide() {
    var login = document.getElementById('login-page');
    var page = $('register-page');
    if (page) page.style.display = 'none';
    if (login) login.style.display = '';
    var em = document.getElementById('login-email');
    if (em) setTimeout(function () { try { em.focus(); } catch (e) {} }, 120);
  }

  /* -------------------------------------------------------------- BINDING */
  function onClick(sel, fn) {
    var el = document.querySelector ? document.querySelector(sel) : null;
    if (el) el.addEventListener('click', fn);
  }

  function bind() {
    qsa('[data-atype]').forEach(function (b) {
      b.addEventListener('click', function () { setType(b.getAttribute('data-atype')); });
    });
    onClick('#reg-next', function () {
      if (state.step === 1 && !validateStep(1)) return;
      if (state.step === 2 && !validateStep(2)) return;
      if (state.step < 3) goStep(state.step + 1);
    });
    onClick('#reg-back', function () { if (state.step > 1) goStep(state.step - 1); });
    var form = $('register-form');
    if (form) form.addEventListener('submit', onSubmit);

    if (form) {
      form.addEventListener('input', function (e) {
        var t = e.target;
        if (t && t.id) { setError(t.id, ''); if (t.id === 'rg-pw' || t.id === 'rg-pw2') updateStrength(); }
      });
      form.addEventListener('change', function (e) {
        var t = e.target;
        if (t && t.id) setError(t.id, '');
        if (t && t.id === 'rg-terms' && t.checked) { var te = $('rg-terms-err'); if (te) te.textContent = ''; }
      });
    }
    var pw1 = $('rg-pw'); if (pw1) pw1.addEventListener('input', updateStrength);

    qsa('[data-toggle-pw]').forEach(function (b) {
      b.addEventListener('click', function () {
        var inp = $(b.getAttribute('data-toggle-pw'));
        if (!inp) return;
        var showing = inp.type === 'password';
        inp.type = showing ? 'text' : 'password';
        var ic = b.querySelector('i'); if (ic) ic.className = showing ? 'fas fa-eye-slash' : 'fas fa-eye';
        b.setAttribute('aria-label', showing ? 'Hide password' : 'Show password');
      });
    });

    onClick('#goto-register', function (e) { e.preventDefault(); show(); });
    onClick('#goto-login', function (e) { e.preventDefault(); hide(); });
    onClick('#verify-login', function (e) { e.preventDefault(); hide(); });
    onClick('#reg-resend', function () {
      var rb = $('reg-resend');
      if (!rb || rb.disabled) return;
      if (UI && UI.toast) UI.toast('success', 'Verification email sent', 'A new verification link has been sent to your inbox.');
      startResend(30);
    });
    onClick('#rg-terms-link', function (e) { e.preventDefault(); e.stopPropagation(); showDoc('Terms & Conditions', TERMS); });
    onClick('#rg-privacy-link', function (e) { e.preventDefault(); e.stopPropagation(); showDoc('Privacy Policy', PRIVACY); });
  }

  var TERMS = 'By creating an account you agree to use SRMS responsibly, keep your credentials secure, and abide by your institution&rsquo;s academic policies. Accounts are for the named individual only and must not be shared.';
  var PRIVACY = 'SRMS stores only the data needed to operate your academic portal. Passwords are never stored in plain text. Your information is used for results, attendance and communication and is not sold to third parties.';

  function showDoc(title, body) {
    if (UI && UI.modal) {
      UI.modal({
        title:title, subtitle:'SRMS legal',
        body:'<p style="font-size:13.4px;line-height:1.75;color:var(--text-soft)">' + body + '</p>',
        footer:'<button class="btn btn-primary" data-modal-close>Close</button>'
      });
    }
  }

  function init() {
    if (inited) return;
    inited = true;
    bind();
    setType('student');
    goStep(1);
    updateStrength();
  }

  global.SRMS_REGISTER = { init:init, show:show, hide:hide, setType:setType, goStep:goStep };

  /* Auto-init once the DOM is ready so the Login "Create Account" link works. */
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window);