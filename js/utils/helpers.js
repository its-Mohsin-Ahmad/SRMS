/* =============================================================================
   SRMS - Helpers / Utilities  (js/utils/helpers.js)
   ========================================================================== */
(function (global) {
  'use strict';

  /* ------------------------------------------------------------- DOM UTILS */
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'class') node.className = v;
        else if (k === 'html') node.innerHTML = v;
        else if (k === 'text') node.textContent = v;
        else if (k.indexOf('on') === 0 && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
        else if (k === 'dataset' && typeof v === 'object') Object.keys(v).forEach(function (d) { node.dataset[d] = v[d]; });
        else node.setAttribute(k, v);
      });
    }
    (children || []).forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      node.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
    });
    return node;
  }

  function on(target, evt, sel, handler) {
    if (typeof sel === 'function') { target.addEventListener(evt, sel, handler); return; }
    target.addEventListener(evt, function (e) {
      var m = e.target.closest(sel);
      if (m && target.contains(m)) handler(e, m);
    });
  }

  function delegate(root, evt, sel, handler) { on(root, evt, sel, handler); }

  /* ---------------------------------------------------------- SAFE STRINGS */
  function esc(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function slug(str) { return String(str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function initials(name) {
    var p = String(name || '?').trim().split(/\s+/);
    if (!p.length) return '?';
    if (p.length === 1) return p[0].charAt(0).toUpperCase();
    return (p[0].charAt(0) + p[p.length - 1].charAt(0)).toUpperCase();
  }

  /* ------------------------------------------------------------ FORMATTERS */
  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function toDate(v) {
    if (v instanceof Date) return v;
    if (!v) return new Date();
    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
      var q = v.split('-');
      return new Date(+q[0], +q[1] - 1, +q[2]);
    }
    return new Date(v);
  }

  function fmtDate(v) {
    var d = toDate(v);
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return pad(d.getDate()) + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
  }

  function fmtDateLong(v) {
    var d = toDate(v);
    var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
  }

  function fmtDateTime(v) {
    var d = toDate(v);
    return fmtDate(d) + ', ' + fmtTime(d);
  }

  function fmtTime(v) {
    var d = toDate(v), h = d.getHours(), m = d.getMinutes();
    var ap = h >= 12 ? 'PM' : 'AM';
    var hh = h % 12; if (hh === 0) hh = 12;
    return hh + ':' + pad(m) + ' ' + ap;
  }

  function timeAgo(v) {
    var d = toDate(v), diff = Date.now() - d.getTime();
    if (isNaN(diff)) return '';
    var mins = Math.round(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return mins + ' min ago';
    var hrs = Math.round(mins / 60);
    if (hrs < 24) return hrs + (hrs === 1 ? ' hour ago' : ' hours ago');
    var days = Math.round(hrs / 24);
    if (days === 1) return 'Yesterday';
    if (days < 7) return days + ' days ago';
    return fmtDate(d);
  }

  function daysBetween(a, b) {
    var d1 = toDate(a), d2 = toDate(b);
    d1.setHours(0,0,0,0); d2.setHours(0,0,0,0);
    return Math.round((d2 - d1) / 86400000);
  }

  function countdown(target) {
    var diff = toDate(target).getTime() - Date.now();
    if (diff <= 0) return { expired:true, text:'Expired', days:0, hours:0, minutes:0 };
    var days = Math.floor(diff / 86400000);
    var hours = Math.floor((diff % 86400000) / 3600000);
    var minutes = Math.floor((diff % 3600000) / 60000);
    var text = days > 0 ? days + 'd ' + hours + 'h left' : (hours > 0 ? hours + 'h ' + minutes + 'm left' : minutes + 'm left');
    return { expired:false, text:text, days:days, hours:hours, minutes:minutes };
  }

  function fmtNum(n, dec) {
    if (n === null || n === undefined || n === '') return '--';
    var num = Number(n);
    if (isNaN(num)) return String(n);
    return num.toLocaleString('en-US', { minimumFractionDigits:dec||0, maximumFractionDigits:dec===undefined?0:dec });
  }

  function fmtPct(n, dec) { return fmtNum(n, dec === undefined ? 0 : dec) + '%'; }
  function fmtGpa(n) { return (Math.round(Number(n) * 100) / 100).toFixed(2); }

  function fmtBytes(bytes) {
    if (!bytes) return '0 B';
    var k = 1024, sizes = ['B','KB','MB','GB'], i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /* ------------------------------------------------------------- GRADE MATH */
  function gradeFromMarks(pct) {
    if (pct >= 90) return { grade:'A+', gp:4.00 };
    if (pct >= 85) return { grade:'A',  gp:4.00 };
    if (pct >= 80) return { grade:'A-', gp:3.67 };
    if (pct >= 75) return { grade:'B+', gp:3.33 };
    if (pct >= 70) return { grade:'B',  gp:3.00 };
    if (pct >= 65) return { grade:'B-', gp:2.67 };
    if (pct >= 60) return { grade:'C+', gp:2.33 };
    if (pct >= 55) return { grade:'C',  gp:2.00 };
    if (pct >= 50) return { grade:'D',  gp:1.00 };
    return { grade:'F', gp:0.00 };
  }

  function gradeClass(grade) {
    var g = String(grade || '').replace('+','-plus').replace(/-/g,'minus');
    return 'grade-' + String(grade || '').toLowerCase().replace('+','plus').replace(/-/g,'' );
  }

  function computeGpa(courses) {
    var cr = 0, pts = 0;
    (courses || []).forEach(function (c) { cr += (+c.credits || 0); pts += (+c.credits || 0) * (+c.gp || 0); });
    return cr ? (pts / cr) : 0;
  }

  function cgpaToPercent(cgpa) { return (Number(cgpa) / 4) * 100; }

  /* ---------------------------------------------------------------- STORAGE */
  var KEY = 'srms.session.v2';
  var PREFS = 'srms.prefs.v2';

  var store = {
    save: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    load: function (k) { try { var r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch (e) { return null; } },
    remove: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
  };

  function setSession(s) { store.save(KEY, s); }
  function getSession() { return store.load(KEY); }
  function clearSession() { store.remove(KEY); }
  function setPrefs(p) { store.save(PREFS, p); }
  function getPrefs() { return store.load(PREFS) || {}; }

  /* --------------------------------------------------------------- VALIDATE */
  function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '').trim()); }
  function isPhone(v) { return /^[+\d][\d\s()-]{7,}$/.test(String(v || '').trim()); }
  function minLen(v, n) { return String(v || '').length >= n; }
  function isRequired(v) { return String(v === null || v === undefined ? '' : v).trim().length > 0; }

  /* Password strength: 0-4 */
  function passwordStrength(pw) {
    var s = 0;
    if (!pw) return s;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  }

  function fakeHash(pw) {
    var h = 0, str = String(pw || '');
    for (var i = 0; i < str.length; i++) { h = ((h << 5) - h) + str.charCodeAt(i); h |= 0; }
    return 'sha256$client$' + Math.abs(h).toString(16) + '$' + str.length;
  }

  /* ------------------------------------------------------------------ UTILS */
  function debounce(fn, wait) {
    var t;
    return function () {
      var ctx = this, args = arguments;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, wait || 250);
    };
  }

  function throttle(fn, wait) {
    var last = 0;
    return function () {
      var now = Date.now();
      if (now - last >= (wait || 200)) { last = now; fn.apply(this, arguments); }
    };
  }

  function uid(prefix) { return (prefix || 'id') + '-' + Math.random().toString(36).slice(2, 9); }

  function clamp(v, min, max) { return Math.min(Math.max(v, min), max); }

  function groupBy(arr, key) {
    return (arr || []).reduce(function (acc, item) {
      var k = typeof key === 'function' ? key(item) : item[key];
      (acc[k] = acc[k] || []).push(item);
      return acc;
    }, {});
  }

  function sum(arr, key) {
    return (arr || []).reduce(function (a, i) { return a + (+(typeof key === 'function' ? key(i) : (key ? i[key] : i)) || 0); }, 0);
  }

  function avg(arr, key) { return arr && arr.length ? sum(arr, key) / arr.length : 0; }

  function unique(arr) { return arr.filter(function (v, i) { return arr.indexOf(v) === i; }); }

  function sortBy(arr, key, dir) {
    var d = dir === 'desc' ? -1 : 1;
    return arr.slice().sort(function (a, b) {
      var av = typeof key === 'function' ? key(a) : a[key];
      var bv = typeof key === 'function' ? key(b) : b[key];
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * d;
      return String(av).localeCompare(String(bv)) * d;
    });
  }

  function paginate(arr, page, perPage) {
    var p = Math.max(1, page || 1), pp = perPage || 10;
    var start = (p - 1) * pp;
    return { items:arr.slice(start, start + pp), page:p, perPage:pp, total:arr.length, pages:Math.max(1, Math.ceil(arr.length / pp)), start:start };
  }

  function greeting() {
    var h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  function todayISO() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function toneForStatus(status) {
    var s = String(status || '').toLowerCase();
    if (s.indexOf('active') > -1 || s === 'present' || s === 'pass' || s === 'success' || s === 'graded' || s === 'paid' || s === 'completed') return 'green';
    if (s.indexOf('pending') > -1 || s.indexOf('due') > -1 || s === 'late' || s === 'warning' || s === 'upcoming') return 'yellow';
    if (s.indexOf('overdue') > -1 || s === 'absent' || s === 'fail' || s === 'failed' || s === 'blocked' || s === 'probation' || s === 'inactive') return 'red';
    if (s === 'submitted' || s === 'excused' || s === 'issued') return 'blue';
    if (s === 'reserved' || s === 'on leave') return 'purple';
    return 'gray';
  }

  function download(filename, text, mime) {
    var blob = new Blob([text], { type:mime || 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1200);
  }

  function toCSV(rows, columns) {
    var cols = columns || (rows[0] ? Object.keys(rows[0]) : []);
    var head = cols.join(',');
    var body = rows.map(function (r) {
      return cols.map(function (c) {
        var v = r[c]; v = v === null || v === undefined ? '' : String(v);
        return '"' + v.replace(/"/g, '""') + '"';
      }).join(',');
    }).join('\n');
    return head + '\n' + body;
  }

  global.SRMS_UTIL = {
    qs:qs, qsa:qsa, el:el, on:on, delegate:delegate,
    esc:esc, slug:slug, initials:initials,
    fmtDate:fmtDate, fmtDateLong:fmtDateLong, fmtDateTime:fmtDateTime, fmtTime:fmtTime,
    timeAgo:timeAgo, daysBetween:daysBetween, countdown:countdown,
    fmtNum:fmtNum, fmtPct:fmtPct, fmtGpa:fmtGpa, fmtBytes:fmtBytes,
    gradeFromMarks:gradeFromMarks, gradeClass:gradeClass, computeGpa:computeGpa, cgpaToPercent:cgpaToPercent,
    setSession:setSession, getSession:getSession, clearSession:clearSession,
    setPrefs:setPrefs, getPrefs:getPrefs,
    isEmail:isEmail, isPhone:isPhone, minLen:minLen, isRequired:isRequired,
    passwordStrength:passwordStrength, fakeHash:fakeHash,
    debounce:debounce, throttle:throttle, uid:uid, clamp:clamp,
    groupBy:groupBy, sum:sum, avg:avg, unique:unique, sortBy:sortBy, paginate:paginate,
    greeting:greeting, todayISO:todayISO, toneForStatus:toneForStatus,
    download:download, toCSV:toCSV, toDate:toDate
  };
})(window);
