/* =============================================================================
   SRMS - Admin Notice Management  (js/pages/admin/notices.js)
   Notice administration: create, edit, publish, schedule, pin and delete with
   audience targeting and expiry control.
   ========================================================================== */
(function (global) {
  'use strict';
  var U = global.SRMS_UTIL;
  var UI = global.SRMS_UI;
  var R = global.SRMS_ROUTES;

  var state = { q:'', cat:'All', audience:'All', page:1, per:8 };

  function rows() {
    var out = (global.SRMS_DATA.notices || []).slice();
    if (state.q) {
      var q = state.q.toLowerCase();
      out = out.filter(function (n) { return (n.title + ' ' + n.description + ' ' + n.category).toLowerCase().indexOf(q) > -1; });
    }
    if (state.cat !== 'All') out = out.filter(function (n) { return n.category === state.cat; });
    if (state.audience !== 'All') out = out.filter(function (n) { return n.audience === state.audience; });
    return out.sort(function (a, b) { return b.date.localeCompare(a.date); });
  }

  function noticesPage(host, ctx) {
    var D = global.SRMS_DATA;
    var list = D.notices || [];
    var cats = U.unique(list.map(function (n) { return n.category; })).sort();
    var audiences = U.unique(list.map(function (n) { return n.audience; })).sort();

    host.innerHTML =
      UI.pageHead({ title:'Notice Management', subtitle:'Publish, schedule and retire notices across the entire institution.',
        actions:'<button class="btn btn-outline" id="an-export"><i class="fas fa-file-export"></i> Export</button>' +
                '<button class="btn btn-primary" id="an-add"><i class="fas fa-plus"></i> Create Notice</button>' }) +

      '<div class="grid grid-4 mb-16">' +
        UI.statCard({ title:'Total Notices', value:list.length, suffix:'published', icon:'fa-bullhorn', tone:'blue', note:'All audiences combined' }) +
        UI.statCard({ title:'Pinned', value:list.filter(function (n) { return n.pinned; }).length, suffix:'highlighted', icon:'fa-thumbtack', tone:'yellow', note:'Shown at the top of the board' }) +
        UI.statCard({ title:'Expiring Soon', value:list.filter(function (n) { var d = U.daysBetween(U.todayISO(), n.expiry); return d >= 0 && d <= 14; }).length, suffix:'notices', icon:'fa-hourglass-end', tone:'red', note:'Expiring within 14 days' }) +
        UI.statCard({ title:'With Attachments', value:list.filter(function (n) { return n.attachment; }).length, suffix:'notices', icon:'fa-paperclip', tone:'purple', note:'Documents attached' }) +
      '</div>' +

      '<div class="card card-flush">' +
        '<div class="table-toolbar" style="padding:18px 20px 0">' +
          '<div class="table-tools">' +
            UI.searchBox('an-search', 'Search notices...', state.q) +
            UI.selectBox('an-cat', [{ value:'All', label:'All Categories' }].concat(cats.map(function (c) { return { value:c, label:c }; })), state.cat, 'Filter category') +
            UI.selectBox('an-aud', [{ value:'All', label:'All Audiences' }].concat(audiences.map(function (a) { return { value:a, label:a }; })), state.audience, 'Filter audience') +
          '</div>' +
          '<div class="card-head-actions"><button class="btn btn-outline btn-sm" id="an-reset"><i class="fas fa-rotate-left"></i> Reset</button></div>' +
        '</div>' +
        '<div style="padding:18px 20px 0" id="an-body"></div>' +
        '<div id="an-pagination" style="padding:0 20px 18px"></div>' +
      '</div>';

    function draw() {
      var out = rows();
      var info = U.paginate(out, state.page, state.per);
      var body = document.getElementById('an-body');
      if (!out.length) {
        body.innerHTML = UI.emptyState({ icon:'fa-bullhorn', title:'No notices found', message:'No notices match the current filters.',
          action:'Clear Filters', actionId:'an-clear', actionIcon:'fa-rotate-left' });
        document.getElementById('an-pagination').innerHTML = '';
        var c = document.getElementById('an-clear');
        if (c) c.addEventListener('click', reset);
        return;
      }

      var cols = [
        { key:'title', label:'Title', render:function (n) { return '<span class="cell-strong">' + U.esc(n.title) + '</span>' + (n.pinned ? ' ' + UI.badge('Pinned', 'blue') : ''); } },
        { key:'category', label:'Category', render:function (n) { return UI.badge(n.category, 'gray'); } },
        { key:'audience', label:'Audience' },
        { key:'date', label:'Published', render:function (n) { return U.fmtDate(n.date); } },
        { key:'expiry', label:'Expires', render:function (n) {
            var d = U.daysBetween(U.todayISO(), n.expiry);
            return d < 0 ? '<span class="badge badge-red">Expired</span>' : '<span class="cell-mute">' + U.fmtDate(n.expiry) + '</span>';
          } },
        { key:'author', label:'Published By', render:function (n) { return '<span class="cell-mute">' + U.esc(n.author) + '</span>'; } },
        { key:'actions', label:'Actions', sortable:false, render:function (n) {
            return '<div class="action-group">' +
              '<button class="icon-action" data-np="' + U.esc(n.id) + '" title="' + (n.pinned ? 'Unpin' : 'Pin') + '" aria-label="Pin"><i class="fas fa-thumbtack"></i></button>' +
              '<button class="icon-action" data-ne="' + U.esc(n.id) + '" title="Edit" aria-label="Edit"><i class="fas fa-pen"></i></button>' +
              '<button class="icon-action danger" data-nd="' + U.esc(n.id) + '" title="Delete" aria-label="Delete"><i class="fas fa-trash"></i></button></div>';
          } }
      ];

      body.innerHTML = UI.table({ columns:cols, rows:info.items }) +
        UI.dataCards(info.items, function (n) {
          return '<div class="data-card"><div class="data-card-head"><strong>' + U.esc(n.title) + '</strong>' + UI.badge(n.category, 'gray') + '</div>' +
            '<div class="data-card-grid"><div><div class="dc-label">Audience</div><div class="dc-value">' + U.esc(n.audience) + '</div></div>' +
            '<div><div class="dc-label">Published</div><div class="dc-value">' + U.fmtDate(n.date) + '</div></div>' +
            '<div><div class="dc-label">Expires</div><div class="dc-value">' + U.fmtDate(n.expiry) + '</div></div>' +
            '<div><div class="dc-label">By</div><div class="dc-value">' + U.esc(n.author) + '</div></div></div></div>';
        });

      document.getElementById('an-pagination').innerHTML = UI.pagination(info);
    }

    function reset() {
      state.q = ''; state.cat = 'All'; state.audience = 'All'; state.page = 1;
      document.getElementById('an-search').value = '';
      document.getElementById('an-cat').value = 'All';
      document.getElementById('an-aud').value = 'All';
      draw();
    }

    var si = document.getElementById('an-search');
    si.addEventListener('input', U.debounce(function () { state.q = si.value; state.page = 1; draw(); }, 200));
    ['an-cat','an-aud'].forEach(function (id) {
      document.getElementById(id).addEventListener('change', function () {
        if (id === 'an-cat') state.cat = this.value; else state.audience = this.value;
        state.page = 1; draw();
      });
    });
    document.getElementById('an-reset').addEventListener('click', reset);

    host.addEventListener('click', function (e) {
      var p = e.target.closest('[data-page]');
      if (p) { state.page = Number(p.getAttribute('data-page')); draw(); window.scrollTo({ top:0, behavior:'smooth' }); return; }
      var pin = e.target.closest('[data-np]');
      if (pin) {
        var n1 = (global.SRMS_DATA.notices || []).filter(function (x) { return x.id === pin.getAttribute('data-np'); })[0];
        if (n1) { n1.pinned = !n1.pinned; draw(); UI.toast('info', n1.pinned ? 'Notice pinned' : 'Notice unpinned', n1.title); }
        return;
      }
      var ed = e.target.closest('[data-ne]');
      if (ed) {
        var n2 = (global.SRMS_DATA.notices || []).filter(function (x) { return x.id === ed.getAttribute('data-ne'); })[0];
        openForm(n2, draw);
        return;
      }
      var d = e.target.closest('[data-nd]');
      if (d) {
        var n3 = (global.SRMS_DATA.notices || []).filter(function (x) { return x.id === d.getAttribute('data-nd'); })[0];
        UI.confirm({ title:'Delete this notice?', message:'\u201c' + (n3 ? n3.title : '') + '\u201d will be permanently removed from the notice board.', tone:'danger', confirmText:'Delete Notice',
          onConfirm:function () {
            global.SRMS_DATA.notices = (global.SRMS_DATA.notices || []).filter(function (x) { return x.id !== n3.id; });
            UI.toast('success', 'Notice deleted', 'The notice has been removed from the board.');
            draw();
          } });
      }
    });

    document.getElementById('an-add').addEventListener('click', function () { openForm(null, draw); });

    document.getElementById('an-export').addEventListener('click', function () {
      var out = rows();
      U.download('srms-notices-admin.csv', U.toCSV(out.map(function (n) {
        return { ID:n.id, Title:n.title, Category:n.category, Audience:n.audience, Published:n.date, Expiry:n.expiry, Author:n.author, Pinned:n.pinned ? 'Yes' : 'No' };
      }), ['ID','Title','Category','Audience','Published','Expiry','Author','Pinned']), 'text/csv');
      UI.toast('success', 'Export complete', out.length + ' notices exported.');
    });

    function openForm(existing, onSaved) {
      var isEdit = !!existing;
      var n = existing || { title:'', description:'', category:'Academic', audience:'All Students', date:U.todayISO(), expiry:U.todayISO(), attachment:'', pinned:false, author:'Administration' };
      UI.modal({
        title:isEdit ? 'Edit Notice' : 'Create Notice', subtitle:'Target an audience and control the publish window.', size:'lg',
        body:'<div class="form-grid">' +
          '<div class="form-group form-span-2"><label class="field-label">Title</label><div class="input-wrap no-icon"><input id="nf2-title" value="' + U.esc(n.title) + '"></div></div>' +
          '<div class="form-group"><label class="field-label">Category</label><div class="input-wrap no-icon"><select id="nf2-cat">' +
            ['Academic','Examination','Results','Library','Scholarship','General','Events'].map(function (c) { return '<option' + (n.category === c ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></div></div>' +
          '<div class="form-group"><label class="field-label">Audience</label><div class="input-wrap no-icon"><select id="nf2-aud">' +
            ['All Students','Teachers','Specific Department','Specific Semester','Computer Science','Software Engineering','5th Semester','7th Semester'].map(function (a) { return '<option' + (n.audience === a ? ' selected' : '') + '>' + a + '</option>'; }).join('') + '</select></div></div>' +
          '<div class="form-group"><label class="field-label">Publish Date</label><div class="input-wrap no-icon"><input type="date" id="nf2-date" value="' + U.esc(n.date) + '"></div></div>' +
          '<div class="form-group"><label class="field-label">Expiry Date</label><div class="input-wrap no-icon"><input type="date" id="nf2-expiry" value="' + U.esc(n.expiry) + '"></div></div>' +
          '<div class="form-group form-span-2"><label class="field-label">Description</label><div class="input-wrap"><textarea id="nf2-desc">' + U.esc(n.description) + '</textarea></div></div>' +
          '<div class="form-group form-span-2"><label class="field-label">Attachment</label><div class="input-wrap"><input type="file" id="nf2-file"></div>' +
            (n.attachment ? '<span class="helper-text">Current: ' + U.esc(n.attachment) + '</span>' : '') + '</div>' +
          '<div class="form-group form-span-2"><label class="checkbox-label"><input type="checkbox" id="nf2-pin"' + (n.pinned ? ' checked' : '') + '><span class="checkbox-box"><i class="fas fa-check"></i></span> Pin to the top of the notice board</label></div>' +
        '</div><span class="field-error" id="nf2-error"></span>',
        footer:'<button class="btn btn-outline" data-modal-close>Cancel</button>' +
               '<button class="btn btn-ghost" id="nf2-schedule"><i class="fas fa-clock"></i> Schedule</button>' +
               '<button class="btn btn-primary" id="nf2-save"><i class="fas fa-paper-plane"></i> ' + (isEdit ? 'Update Notice' : 'Publish Notice') + '</button>',
        onMount:function (m) {
          function collect() {
            return { title:m.el.querySelector('#nf2-title').value.trim(), category:m.el.querySelector('#nf2-cat').value,
              audience:m.el.querySelector('#nf2-aud').value, date:m.el.querySelector('#nf2-date').value,
              expiry:m.el.querySelector('#nf2-expiry').value, description:m.el.querySelector('#nf2-desc').value.trim(),
              pinned:m.el.querySelector('#nf2-pin').checked, author:n.author, attachment:n.attachment };
          }
          function validate(d) {
            var err = m.el.querySelector('#nf2-error');
            if (!U.minLen(d.title, 5)) { err.textContent = 'Title must be at least 5 characters.'; return false; }
            if (!U.minLen(d.description, 15)) { err.textContent = 'Description must be at least 15 characters.'; return false; }
            if (U.daysBetween(d.date, d.expiry) < 0) { err.textContent = 'Expiry cannot be before the publish date.'; return false; }
            err.textContent = '';
            return true;
          }
          m.on('#nf2-save', 'click', function () {
            var d = collect();
            if (!validate(d)) return;
            UI.confirm({ title:isEdit ? 'Update notice?' : 'Publish notice?', message:'It will be visible to ' + d.audience + ' immediately.', tone:'info', confirmText:isEdit ? 'Update' : 'Publish',
              onConfirm:function () {
                if (isEdit) { Object.assign(existing, d); m.close(); UI.toast('success', 'Notice updated', d.title + ' has been saved.'); }
                else {
                  d.id = 'NTC-' + Math.floor(20 + Math.random() * 79);
                  d.unread = true;
                  (global.SRMS_DATA.notices || []).unshift(d);
                  m.close();
                  UI.toast('success', 'Notice published', d.title + ' is now visible to ' + d.audience + '.');
                }
                onSaved();
              } });
          });
          m.on('#nf2-schedule', 'click', function () {
            var d2 = collect();
            if (!validate(d2)) return;
            m.close();
            UI.toast('success', 'Notice scheduled', 'It will publish automatically on ' + U.fmtDate(d2.date) + '.');
          });
        }
      });
    }

    draw();
  }

  R.add('notices', 'admin', { title:'Notice Management', crumbs:['Content','Notice Board'], render:noticesPage });
})(window);
