/* =============================================================================
   SRMS - Notice Board  (js/pages/student/notices.js)
   Filterable notice feed with categories, pinning, detail modal and admin CRUD
   entry points. Registered for every role.
   ========================================================================== */
(function (global) {
  'use strict';
  var U = global.SRMS_UTIL;
  var UI = global.SRMS_UI;
  var R = global.SRMS_ROUTES;

  var state = { q:'', cat:'All', page:1, per:6 };

  var CAT_ICON = {
    Examination:'fa-file-pen', Results:'fa-square-poll-vertical', Academic:'fa-graduation-cap',
    Library:'fa-book', Scholarship:'fa-hand-holding-dollar', General:'fa-calendar-day', Events:'fa-trophy'
  };
  var CAT_TONE = {
    Examination:'red', Results:'red', Academic:'blue', Library:'purple', Scholarship:'green', General:'yellow', Events:'teal'
  };

  function filtered(list) {
    var out = list.slice();
    if (state.q) {
      var q = state.q.toLowerCase();
      out = out.filter(function (n) { return (n.title + ' ' + n.description + ' ' + n.category).toLowerCase().indexOf(q) > -1; });
    }
    if (state.cat !== 'All') out = out.filter(function (n) { return n.category === state.cat; });
    return out.sort(function (a, b) {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.date.localeCompare(a.date);
    });
  }

  function noticeCard(n) {
    var tone = CAT_TONE[n.category] || 'blue';
    var icon = CAT_ICON[n.category] || 'fa-bullhorn';
    var expiry = U.daysBetween(U.todayISO(), n.expiry);
    return '<article class="card card-hover" data-notice="' + n.id + '" style="cursor:pointer">' +
      '<div class="flex-between mb-12">' +
        '<span class="notice-ico badge-' + tone + '"><i class="fas ' + icon + '"></i></span>' +
        '<div class="chip-row">' + (n.pinned ? UI.badge('Pinned', 'blue', 'fa-thumbtack') : '') +
        (n.unread ? UI.badge('New', 'red', 'fa-circle') : '') + UI.badge(n.category, 'gray') + '</div>' +
      '</div>' +
      '<h3 style="font-size:14.6px;line-height:1.4">' + U.esc(n.title) + '</h3>' +
      '<p class="text-soft text-sm mt-8" style="line-height:1.6">' + U.esc(n.description) + '</p>' +
      '<div class="notice-meta">' +
        '<time><i class="fas fa-calendar"></i> ' + U.fmtDate(n.date) + '</time>' +
        '<time><i class="fas fa-users"></i> ' + U.esc(n.audience) + '</time>' +
        (expiry >= 0 ? '<time><i class="fas fa-hourglass-half"></i> ' + expiry + ' day' + (expiry === 1 ? '' : 's') + ' left</time>' : '<time class="text-red"><i class="fas fa-circle-xmark"></i> Expired</time>') +
      '</div>' +
      (n.attachment ? '<div class="resource-foot"><span class="file-info text-xs"><i class="fas fa-paperclip"></i> ' + U.esc(n.attachment) + '</span></div>' : '') +
    '</article>';
  }

  function noticesPage(host, ctx) {
    var D = global.SRMS_DATA;
    var list = D.notices || [];
    var cats = ['All'].concat(U.unique(list.map(function (n) { return n.category; })));
    var canManage = ctx.role === 'admin' || ctx.role === 'teacher';

    host.innerHTML =
      UI.pageHead({ title:'Notice Board', subtitle:'Official announcements, examination updates and academic circulars.',
        actions:(canManage ? '<button class="btn btn-outline" id="nt-manage"><i class="fas fa-table-list"></i> Manage Notices</button>' : '') +
                '<button class="btn btn-outline" id="nt-readall"><i class="fas fa-check-double"></i> Mark All Read</button>' +
                (canManage ? '<button class="btn btn-primary" id="nt-new"><i class="fas fa-plus"></i> Create Notice</button>' : '<button class="btn btn-primary" id="nt-sub"><i class="fas fa-bell"></i> Subscribe</button>') }) +

      '<div class="grid grid-4 mb-16">' +
        UI.statCard({ title:'Total Notices', value:list.length, suffix:'published', icon:'fa-bullhorn', tone:'blue', note:'All categories combined' }) +
        UI.statCard({ title:'Unread', value:list.filter(function (n) { return n.unread; }).length, suffix:'notices', icon:'fa-envelope', tone:'red', note:'Awaiting your attention' }) +
        UI.statCard({ title:'Pinned', value:list.filter(function (n) { return n.pinned; }).length, suffix:'important', icon:'fa-thumbtack', tone:'yellow', note:'Highlighted by the registrar' }) +
        UI.statCard({ title:'This Month', value:list.filter(function (n) { return U.daysBetween(n.date, U.todayISO()) <= 30; }).length, suffix:'notices', icon:'fa-calendar', tone:'green', note:'Published recently' }) +
      '</div>' +

      '<div class="card card-flush">' +
        '<div class="table-toolbar" style="padding:18px 20px 0">' +
          '<div class="table-tools">' + UI.searchBox('nt-search', 'Search notices by title or keyword...', state.q) + '</div>' +
          '<div class="pill-tabs" id="nt-cats">' + UI.pillTabs(cats.map(function (c) { return { key:c, label:c }; }), state.cat) + '</div>' +
        '</div>' +
        '<div style="padding:18px 20px 20px" id="nt-body"></div>' +
      '</div>';

    function draw() {
      var out = filtered((global.SRMS_DATA.notices || []));
      var body = document.getElementById('nt-body');
      if (!out.length) {
        body.innerHTML = UI.emptyState({ icon:'fa-bullhorn', title:'No notices found', message:'No notices match your current search or category filter.',
          action:'Clear Filters', actionId:'nt-clear', actionIcon:'fa-rotate-left' });
        var c = document.getElementById('nt-clear');
        if (c) c.addEventListener('click', function () {
          state.q = ''; state.cat = 'All';
          document.getElementById('nt-search').value = '';
          U.qsa('#nt-cats .pill-tab').forEach(function (t, i) { t.classList.toggle('active', i === 0); });
          draw();
        });
        return;
      }
      var info = U.paginate(out, state.page, state.per);
      body.innerHTML = '<div class="grid grid-2">' + info.items.map(noticeCard).join('') + '</div>' + UI.pagination(info);
    }

    var si = document.getElementById('nt-search');
    si.addEventListener('input', U.debounce(function () { state.q = si.value; state.page = 1; draw(); }, 200));

    document.getElementById('nt-cats').addEventListener('click', function (e) {
      var t = e.target.closest('.pill-tab');
      if (!t) return;
      state.cat = t.getAttribute('data-pilltab'); state.page = 1;
      U.qsa('#nt-cats .pill-tab').forEach(function (x) { x.classList.toggle('active', x === t); });
      draw();
    });

    document.getElementById('nt-body').addEventListener('click', function (e) {
      var p = e.target.closest('[data-page]');
      if (p) { state.page = Number(p.getAttribute('data-page')); draw(); window.scrollTo({ top:0, behavior:'smooth' }); return; }
      var n = e.target.closest('[data-notice]');
      if (!n) return;
      var id = n.getAttribute('data-notice');
      var item = (global.SRMS_DATA.notices || []).filter(function (x) { return x.id === id; })[0];
      if (item) { item.unread = false; draw(); }
      openNotice(item);
    });

    function openNotice(n) {
      if (!n) return;
      var tone = CAT_TONE[n.category] || 'blue';
      UI.modal({
        title:n.title, subtitle:n.category + ' \u00b7 Published ' + U.fmtDateLong(n.date) + ' by ' + n.author, size:'lg',
        body:'<div class="alert alert-' + (tone === 'red' ? 'danger' : tone === 'yellow' ? 'warning' : tone === 'green' ? 'success' : 'info') + ' mb-16">' +
          '<i class="fas ' + (CAT_ICON[n.category] || 'fa-bullhorn') + ' alert-ico"></i><div class="alert-body"><strong>' + U.esc(n.category) + '</strong>Audience: ' + U.esc(n.audience) + '</div></div>' +
          '<p style="line-height:1.8">' + U.esc(n.description) + '</p>' +
          '<div class="divider"></div>' +
          '<dl class="info-grid">' +
            '<div class="info-item"><dt>Publish Date</dt><dd>' + U.fmtDateLong(n.date) + '</dd></div>' +
            '<div class="info-item"><dt>Expiry Date</dt><dd>' + U.fmtDateLong(n.expiry) + '</dd></div>' +
            '<div class="info-item"><dt>Issued By</dt><dd>' + U.esc(n.author) + '</dd></div>' +
            '<div class="info-item"><dt>Notice ID</dt><dd>' + U.esc(n.id) + '</dd></div>' +
          '</dl>' +
          (n.attachment ? '<div class="file-card mt-16"><span class="file-ico badge-red"><i class="fas fa-file-pdf"></i></span><span class="file-info"><strong>' + U.esc(n.attachment) + '</strong><span>Attached document</span></span><button class="icon-action" id="nt-att-dl"><i class="fas fa-download"></i></button></div>' : ''),
        footer:'<button class="btn btn-outline" data-modal-close>Close</button>' +
               (n.attachment ? '<button class="btn btn-ghost" id="nt-att"><i class="fas fa-paperclip"></i> Download Attachment</button>' : '') +
               '<button class="btn btn-primary" data-modal-close><i class="fas fa-check"></i> Understood</button>',
        onMount:function (m) {
          m.on('#nt-att', 'click', function () { UI.toast('success', 'Download started', n.attachment + ' is being downloaded.'); });
          m.on('#nt-att-dl', 'click', function () { UI.toast('success', 'Download started', n.attachment + ' is being downloaded.'); });
        }
      });
    }

    var readAll = document.getElementById('nt-readall');
    if (readAll) readAll.addEventListener('click', function () {
      (global.SRMS_DATA.notices || []).forEach(function (n) { n.unread = false; });
      draw();
      if (global.SRMS_NAVBAR) global.SRMS_NAVBAR.renderNotifications();
      UI.toast('success', 'All notices read', 'Your unread count has been cleared.');
    });

    var sub = document.getElementById('nt-sub');
    if (sub) sub.addEventListener('click', function () {
      UI.toast('success', 'Subscribed', 'You will receive email alerts for every new notice.');
    });

    var nw = document.getElementById('nt-new');
    if (nw) nw.addEventListener('click', function () { noticeForm(null, draw); });

    var mg = document.getElementById('nt-manage');
    if (mg) mg.addEventListener('click', function () {
      UI.modal({ title:'Manage Notices', subtitle:'Create, edit, publish or remove notices.', size:'lg',
        body:UI.table({ compact:true, columns:[
          { key:'title', label:'Title', render:function (n) { return '<span class="cell-strong">' + U.esc(n.title) + '</span>'; } },
          { key:'category', label:'Category', render:function (n) { return UI.badge(n.category, CAT_TONE[n.category] || 'gray'); } },
          { key:'date', label:'Published', render:function (n) { return U.fmtDate(n.date); } },
          { key:'status', label:'Status', render:function (n) { return n.pinned ? UI.badge('Pinned', 'blue') : UI.badge('Published', 'green'); } },
          { key:'actions', label:'', sortable:false, render:function (n) {
            return '<div class="action-group"><button class="icon-action" data-nt-edit="' + n.id + '" aria-label="Edit"><i class="fas fa-pen"></i></button>' +
              '<button class="icon-action danger" data-nt-del="' + n.id + '" aria-label="Delete"><i class="fas fa-trash"></i></button></div>';
          } }
        ], rows:(global.SRMS_DATA.notices || []) }),
        footer:'<button class="btn btn-outline" data-modal-close>Close</button><button class="btn btn-primary" id="ntm-new"><i class="fas fa-plus"></i> New Notice</button>',
        onMount:function (m) {
          m.on('#ntm-new', 'click', function () { m.close(); noticeForm(null, function () { R.reRender({ role:ctx.role, user:ctx.user, go:ctx.go }); }); });
          m.el.addEventListener('click', function (e) {
            var ed = e.target.closest('[data-nt-edit]');
            if (ed) {
              var item = (global.SRMS_DATA.notices || []).filter(function (x) { return x.id === ed.getAttribute('data-nt-edit'); })[0];
              m.close(); noticeForm(item, function () { R.reRender({ role:ctx.role, user:ctx.user, go:ctx.go }); });
              return;
            }
            var dl = e.target.closest('[data-nt-del]');
            if (dl) {
              var id = dl.getAttribute('data-nt-del');
              var target = (global.SRMS_DATA.notices || []).filter(function (x) { return x.id === id; })[0];
              m.close();
              UI.confirm({ title:'Delete this notice?', message:'\u201c' + (target ? target.title : '') + '\u201d will be permanently removed from the notice board.', tone:'danger', confirmText:'Delete Notice',
                onConfirm:function () {
                  global.SRMS_DATA.notices = (global.SRMS_DATA.notices || []).filter(function (x) { return x.id !== id; });
                  UI.toast('success', 'Notice deleted', 'The notice has been removed from the board.');
                  R.reRender({ role:ctx.role, user:ctx.user, go:ctx.go });
                } });
            }
          });
        }
      });
    });

    draw();
  }

  function noticeForm(existing, onSaved) {
    var isEdit = !!existing;
    var n = existing || { title:'', description:'', category:'Academic', audience:'All Students', date:U.todayISO(), expiry:U.todayISO(), attachment:'', pinned:false };
    UI.modal({
      title:isEdit ? 'Edit Notice' : 'Create Notice', subtitle:'Publish a circular to selected audiences.', size:'lg',
      body:'<div class="form-grid">' +
        '<div class="form-group form-span-2"><label class="field-label">Title</label><div class="input-wrap no-icon"><input id="nf-title" value="' + U.esc(n.title) + '" placeholder="Enter notice title"></div></div>' +
        '<div class="form-group"><label class="field-label">Category</label><div class="input-wrap no-icon"><select id="nf-cat">' +
          ['Academic','Examination','Results','Library','Scholarship','General','Events'].map(function (c) { return '<option' + (n.category === c ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></div></div>' +
        '<div class="form-group"><label class="field-label">Audience</label><div class="input-wrap no-icon"><select id="nf-audience">' +
          ['All Students','Teachers','5th Semester','7th Semester','Computer Science','Software Engineering'].map(function (a) { return '<option' + (n.audience === a ? ' selected' : '') + '>' + a + '</option>'; }).join('') + '</select></div></div>' +
        '<div class="form-group"><label class="field-label">Publish Date</label><div class="input-wrap no-icon"><input type="date" id="nf-date" value="' + U.esc(n.date) + '"></div></div>' +
        '<div class="form-group"><label class="field-label">Expiry Date</label><div class="input-wrap no-icon"><input type="date" id="nf-expiry" value="' + U.esc(n.expiry) + '"></div></div>' +
        '<div class="form-group form-span-2"><label class="field-label">Description</label><div class="input-wrap"><textarea id="nf-desc" placeholder="Write the full notice text...">' + U.esc(n.description) + '</textarea></div></div>' +
        '<div class="form-group form-span-2"><label class="field-label">Attachment (optional)</label><div class="input-wrap"><input type="file" id="nf-file"></div></div>' +
        '<div class="form-group form-span-2"><label class="checkbox-label"><input type="checkbox" id="nf-pin"' + (n.pinned ? ' checked' : '') + '><span class="checkbox-box"><i class="fas fa-check"></i></span> Pin this notice to the top of the board</label></div>' +
      '</div><span class="field-error" id="nf-error"></span>',
      footer:'<button class="btn btn-outline" data-modal-close>Cancel</button>' +
             (isEdit ? '<button class="btn btn-warning" id="nf-schedule"><i class="fas fa-clock"></i> Schedule</button>' : '') +
             '<button class="btn btn-ghost" id="nf-draft"><i class="fas fa-file-lines"></i> Save Draft</button>' +
             '<button class="btn btn-primary" id="nf-publish"><i class="fas fa-paper-plane"></i> ' + (isEdit ? 'Update Notice' : 'Publish Notice') + '</button>',
      onMount:function (m) {
        function collect() {
          return {
            title:m.el.querySelector('#nf-title').value.trim(),
            category:m.el.querySelector('#nf-cat').value,
            audience:m.el.querySelector('#nf-audience').value,
            date:m.el.querySelector('#nf-date').value,
            expiry:m.el.querySelector('#nf-expiry').value,
            description:m.el.querySelector('#nf-desc').value.trim(),
            pinned:m.el.querySelector('#nf-pin').checked
          };
        }
        function validate(d) {
          var err = m.el.querySelector('#nf-error');
          if (!U.minLen(d.title, 5)) { err.textContent = 'Title must be at least 5 characters.'; return false; }
          if (!U.minLen(d.description, 15)) { err.textContent = 'Description must be at least 15 characters.'; return false; }
          if (U.daysBetween(d.date, d.expiry) < 0) { err.textContent = 'Expiry date cannot be before the publish date.'; return false; }
          err.textContent = '';
          return true;
        }
        m.on('#nf-publish', 'click', function () {
          var d = collect();
          if (!validate(d)) return;
          UI.confirm({ title:isEdit ? 'Update this notice?' : 'Publish this notice?',
            message:'The notice will become visible to ' + d.audience + ' immediately.', tone:'info', confirmText:isEdit ? 'Update' : 'Publish',
            onConfirm:function () {
              if (isEdit) { Object.assign(existing, d); UI.toast('success', 'Notice updated', 'Changes are live on the notice board.'); }
              else {
                d.id = 'NTC-' + Math.floor(10 + Math.random() * 89);
                d.author = 'Administration'; d.unread = true;
                (global.SRMS_DATA.notices || []).unshift(d);
                UI.toast('success', 'Notice published', '\u201c' + d.title + '\u201d is now visible to ' + d.audience + '.');
              }
              m.close();
              if (typeof onSaved === 'function') onSaved();
            } });
        });
        m.on('#nf-draft', 'click', function () { UI.toast('info', 'Draft saved', 'You can continue editing this notice later.'); m.close(); });
        var sch = m.el.querySelector('#nf-schedule');
        if (sch) sch.addEventListener('click', function () {
          var d = collect();
          if (!validate(d)) return;
          m.close();
          UI.toast('success', 'Notice scheduled', 'It will be published automatically on ' + U.fmtDate(d.date) + '.');
        });
      }
    });
  }

  var def = { title:'Notice Board', crumbs:['Communication','Notice Board'], render:noticesPage };
  R.add('notices', 'student', def);
  R.add('notices', 'teacher', def);
  R.add('notices', 'admin', def);
})(window);
