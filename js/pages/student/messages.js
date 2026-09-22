/* =============================================================================
   SRMS - Messages  (js/pages/student/messages.js)
   Two-pane messaging interface with inbox, sent items, compose, search and
   unread counts. Shared by student, teacher and admin.
   ========================================================================== */
(function (global) {
  'use strict';
  var U = global.SRMS_UTIL;
  var UI = global.SRMS_UI;
  var R = global.SRMS_ROUTES;

  var state = { box:'inbox', active:null, q:'' };
  var sentItems = [
    { id:'S-01', to:'Dr. Ahmad Hassan', subject:'Assignment submission confirmation', preview:'I have submitted the ER diagram assignment before the deadline.', time:'2026-09-21T18:22:00', tone:'blue' },
    { id:'S-02', to:'Academic Advisor Office', subject:'Semester 6 elective selection', preview:'Requesting approval for the two elective courses I have selected.', time:'2026-09-19T11:05:00', tone:'purple' },
    { id:'S-03', to:'Ms. Hina Qureshi', subject:'Subnetting worksheet resubmission', preview:'Attached is the corrected worksheet with question four completed.', time:'2026-09-20T16:40:00', tone:'teal' }
  ];

  function threadList() {
    var out = (global.SRMS_DATA.threads || []).slice();
    if (state.box === 'sent') {
      return sentItems.filter(function (s) {
        if (!state.q) return true;
        return (s.to + ' ' + s.subject + ' ' + s.preview).toLowerCase().indexOf(state.q.toLowerCase()) > -1;
      });
    }
    if (state.box === 'unread') out = out.filter(function (t) { return t.unread > 0; });
    if (state.q) {
      var q = state.q.toLowerCase();
      out = out.filter(function (t) { return (t.with + ' ' + t.subject).toLowerCase().indexOf(q) > -1; });
    }
    return out;
  }

  function messagesPage(host, ctx) {
    var D = global.SRMS_DATA;
    var threads = D.threads || [];
    var unreadTotal = threads.filter(function (t) { return t.unread > 0; }).length;

    host.innerHTML =
      UI.pageHead({ title:'Messages', subtitle:'Communicate with your teachers, academic advisor and university administration.',
        actions:'<button class="btn btn-outline" id="mg-refresh"><i class="fas fa-rotate"></i> Refresh</button>' +
                '<button class="btn btn-primary" id="mg-compose"><i class="fas fa-pen-to-square"></i> Compose Message</button>' }) +

      '<div class="grid grid-4 mb-16">' +
        UI.statCard({ title:'Conversations', value:threads.length, suffix:'threads', icon:'fa-comments', tone:'blue', note:'Active message threads' }) +
        UI.statCard({ title:'Unread', value:unreadTotal, suffix:'threads', icon:'fa-envelope', tone:'red', note:'Awaiting your reply' }) +
        UI.statCard({ title:'Sent Items', value:sentItems.length, suffix:'messages', icon:'fa-paper-plane', tone:'purple', note:'Messages you have sent' }) +
        UI.statCard({ title:'Contacts', value:U.unique(threads.map(function (t) { return t.with; })).length, suffix:'people', icon:'fa-address-book', tone:'green', note:'Faculty and administration' }) +
      '</div>' +

      '<div class="messages-layout">' +
        '<div class="msg-sidebar">' +
          '<div class="msg-sidebar-head">' +
            '<div class="tabs" style="margin-bottom:0;border:0;gap:2px">' +
              '<button class="tab active" data-box="inbox" style="flex:1;justify-content:center"><i class="fas fa-inbox"></i> Inbox</button>' +
              '<button class="tab" data-box="sent" style="flex:1;justify-content:center"><i class="fas fa-paper-plane"></i> Sent</button>' +
              '<button class="tab" data-box="unread" style="flex:1;justify-content:center"><i class="fas fa-envelope"></i> Unread</button>' +
            '</div>' +
            '<div class="table-search"><i class="fas fa-search"></i><input type="search" id="mg-search" placeholder="Search messages..." aria-label="Search messages"></div>' +
          '</div>' +
          '<div class="msg-list" id="mg-list"></div>' +
        '</div>' +
        '<div class="msg-view" id="mg-view"></div>' +
      '</div>';

    function drawList() {
      var items = threadList();
      var list = document.getElementById('mg-list');
      if (!items.length) {
        list.innerHTML = UI.emptyState({ small:true, icon:'fa-comment-slash', title:'No messages', message:'Nothing matches this view or search term.' });
        return;
      }
      list.innerHTML = items.map(function (t) {
        var isSent = state.box === 'sent';
        var name = isSent ? t.to : t.with;
        var last = isSent ? t.time : t.messages[t.messages.length - 1].time;
        var preview = isSent ? t.preview : t.messages[t.messages.length - 1].text;
        var active = state.active === t.id ? ' active' : '';
        return '<button class="msg-thread' + active + (t.unread ? ' unread' : '') + '" data-thread="' + U.esc(t.id) + '">' +
          '<span class="avatar avatar-sm" style="background:linear-gradient(140deg,' + (t.tone === 'purple' ? '#8B5CF6' : t.tone === 'teal' ? '#14B8A6' : t.tone === 'yellow' ? '#F59E0B' : t.tone === 'green' ? '#22C55E' : '#1677E8') + ',#1557B0)">' + U.esc(U.initials(name)) + '</span>' +
          '<span class="msg-thread-body"><span class="msg-thread-top"><strong>' + U.esc(name) + '</strong><time>' + U.esc(U.timeAgo(last)) + '</time></span>' +
          '<span class="msg-thread-subject">' + U.esc(t.subject) + '</span>' +
          '<span class="msg-thread-preview">' + U.esc(preview) + '</span></span>' +
          (t.unread ? '<span class="msg-unread-dot"></span>' : '') + '</button>';
      }).join('');
    }

    function drawView() {
      var view = document.getElementById('mg-view');
      var all = state.box === 'sent' ? sentItems : (global.SRMS_DATA.threads || []);
      var t = all.filter(function (x) { return x.id === state.active; })[0];

      if (!t) {
        view.innerHTML = UI.emptyState({ icon:'fa-comments', title:'Select a conversation', message:'Choose a message from the list to read the full thread and reply.' });
        return;
      }

      var isSent = state.box === 'sent';
      var name = isSent ? t.to : t.with;
      var sub = isSent ? t.subject : t.role;

      view.innerHTML =
        '<div class="msg-view-head">' +
          '<div class="flex gap-12">' + UI.avatar(name, 'md') +
            '<div><strong style="display:block;font-size:14px">' + U.esc(name) + '</strong>' +
            '<span class="text-mute text-xs">' + U.esc(sub) + '</span></div></div>' +
          '<div class="action-group">' +
            '<button class="icon-action" data-mg-act="star" title="Star conversation" aria-label="Star"><i class="fas fa-star"></i></button>' +
            '<button class="icon-action" data-mg-act="archive" title="Archive" aria-label="Archive"><i class="fas fa-box-archive"></i></button>' +
            '<button class="icon-action danger" data-mg-act="delete" title="Delete" aria-label="Delete"><i class="fas fa-trash"></i></button>' +
          '</div>' +
        '</div>' +
        '<div class="msg-view-body">' +
          (isSent ?
            '<div class="msg-bubble-wrap out"><div class="avatar avatar-xs">' + U.esc(U.initials('You')) + '</div><div class="msg-bubble">' + U.esc(t.preview) + '<time>' + U.fmtDateTime(t.time) + '</time></div></div>' :
            t.messages.map(function (m) {
              var out = m.from === 'me';
              return '<div class="msg-bubble-wrap' + (out ? ' out' : '') + '">' +
                '<div class="avatar avatar-xs">' + U.esc(U.initials(out ? 'You' : t.with)) + '</div>' +
                '<div class="msg-bubble">' + U.esc(m.text) + '<time>' + U.fmtDateTime(m.time) + '</time></div></div>';
            }).join('')) +
        '</div>' +
        '<div class="msg-compose">' +
          '<textarea id="mg-input" placeholder="Type your reply..." rows="1" aria-label="Message text"></textarea>' +
          '<button class="btn btn-outline btn-icon-square" id="mg-attach" aria-label="Attach file"><i class="fas fa-paperclip"></i></button>' +
          '<button class="btn btn-primary" id="mg-send"><i class="fas fa-paper-plane"></i> Send</button>' +
        '</div>';

      var input = document.getElementById('mg-input');
      input.addEventListener('input', function () {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
      });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
      });
      document.getElementById('mg-send').addEventListener('click', send);
      document.getElementById('mg-attach').addEventListener('click', function () { UI.toast('info', 'Attach file', 'Choose a file to attach to your message.'); });

      function send() {
        var text = input.value.trim();
        if (!text) { UI.toast('error', 'Empty message', 'Please type a message before sending.'); return; }
        if (isSent) { UI.toast('info', 'Sent folder', 'Replies can only be sent from the inbox view.'); return; }
        t.messages.push({ from:'me', text:text, time:new Date().toISOString() });
        input.value = ''; input.style.height = 'auto';
        UI.toast('success', 'Message sent', 'Your reply has been delivered to ' + name + '.');
        drawView();
        drawList();
      }
    }

    /* ------------------------------------------------------------- WIRING */
    U.qsa('.msg-sidebar-head .tab').forEach(function (b) {
      b.addEventListener('click', function () {
        state.box = b.getAttribute('data-box');
        state.active = null;
        U.qsa('.msg-sidebar-head .tab').forEach(function (x) { x.classList.toggle('active', x === b); });
        drawList(); drawView();
      });
    });

    var si = document.getElementById('mg-search');
    si.addEventListener('input', U.debounce(function () { state.q = si.value; drawList(); }, 180));

    document.getElementById('mg-list').addEventListener('click', function (e) {
      var t = e.target.closest('[data-thread]');
      if (!t) return;
      state.active = t.getAttribute('data-thread');
      var th = (global.SRMS_DATA.threads || []).filter(function (x) { return x.id === state.active; })[0];
      if (th && th.unread) {
        th.unread = 0;
        if (global.SRMS_NAVBAR) global.SRMS_NAVBAR.renderMessages();
      }
      drawList(); drawView();
    });

    document.getElementById('mg-view').addEventListener('click', function (e) {
      var b = e.target.closest('[data-mg-act]');
      if (!b) return;
      var act = b.getAttribute('data-mg-act');
      if (act === 'delete') {
        var id = state.active;
        UI.confirm({ title:'Delete this conversation?', message:'The entire thread will be removed from your mailbox.', tone:'danger', confirmText:'Delete',
          onConfirm:function () {
            global.SRMS_DATA.threads = (global.SRMS_DATA.threads || []).filter(function (x) { return x.id !== id; });
            sentItems = sentItems.filter(function (x) { return x.id !== id; });
            state.active = null;
            drawList(); drawView();
            UI.toast('success', 'Conversation deleted', 'The thread has been removed from your mailbox.');
          } });
      } else if (act === 'star') {
        UI.toast('success', 'Starred', 'This conversation has been added to your starred items.');
      } else {
        UI.toast('info', 'Archived', 'The conversation has been moved to your archive.');
      }
    });

    document.getElementById('mg-refresh').addEventListener('click', function () {
      UI.toast('success', 'Mailbox refreshed', 'Your messages are up to date.');
      drawList(); drawView();
    });

    document.getElementById('mg-compose').addEventListener('click', function () {
      var contacts = U.unique((global.SRMS_DATA.threads || []).map(function (t) { return t.with; }))
        .concat((D.teachers || []).map(function (t) { return t.name; }));
      UI.modal({
        title:'Compose Message', subtitle:'Send a message to faculty or administration.', size:'lg',
        body:'<div class="form-grid">' +
          '<div class="form-group form-span-2"><label class="field-label">Recipient</label><div class="input-wrap no-icon"><select id="cp-to">' +
            U.unique(contacts).map(function (c) { return '<option>' + U.esc(c) + '</option>'; }).join('') + '</select></div></div>' +
          '<div class="form-group form-span-2"><label class="field-label">Subject</label><div class="input-wrap no-icon"><input id="cp-subject" placeholder="Enter a subject line"></div></div>' +
          '<div class="form-group form-span-2"><label class="field-label">Message</label><div class="input-wrap"><textarea id="cp-body" placeholder="Write your message..."></textarea></div></div>' +
          '<div class="form-group form-span-2"><label class="field-label">Attachment (optional)</label><div class="input-wrap"><input type="file" id="cp-file"></div></div>' +
        '</div><span class="field-error" id="cp-error"></span>',
        footer:'<button class="btn btn-outline" data-modal-close>Cancel</button><button class="btn btn-ghost" id="cp-draft"><i class="fas fa-file-lines"></i> Save Draft</button><button class="btn btn-primary" id="cp-send"><i class="fas fa-paper-plane"></i> Send Message</button>',
        onMount:function (m) {
          m.on('#cp-send', 'click', function () {
            var to = m.el.querySelector('#cp-to').value;
            var subject = m.el.querySelector('#cp-subject').value.trim();
            var body = m.el.querySelector('#cp-body').value.trim();
            var err = m.el.querySelector('#cp-error');
            if (!U.minLen(subject, 3)) { err.textContent = 'Subject must be at least 3 characters.'; return; }
            if (!U.minLen(body, 5)) { err.textContent = 'Message body must be at least 5 characters.'; return; }
            err.textContent = '';
            sentItems.unshift({ id:'S-' + Math.floor(10 + Math.random() * 89), to:to, subject:subject, preview:body, time:new Date().toISOString(), tone:'blue' });
            m.close();
            UI.toast('success', 'Message sent', 'Your message has been delivered to ' + to + '.');
            state.box = 'sent';
            U.qsa('.msg-sidebar-head .tab').forEach(function (x) { x.classList.toggle('active', x.getAttribute('data-box') === 'sent'); });
            drawList(); drawView();
          });
          m.on('#cp-draft', 'click', function () { UI.toast('info', 'Draft saved', 'You can continue writing this message later.'); m.close(); });
        }
      });
    });

    /* Auto-open the first conversation */
    var first = threadList()[0];
    if (first) state.active = first.id;
    drawList();
    drawView();
  }

  var def = { title:'Messages', crumbs:['Communication','Messages'], render:messagesPage };
  R.add('messages', 'student', def);
  R.add('messages', 'teacher', def);
})(window);
