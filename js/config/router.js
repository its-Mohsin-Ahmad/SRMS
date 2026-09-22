/* =============================================================================
   SRMS - Client Router  (js/config/router.js)
   Registers pages per role, resolves routes, enforces role-based access and
   manages transitions, sidebar state, titles and chart lifecycles.
   ========================================================================== */
(function (global) {
  'use strict';
  var U = global.SRMS_UTIL;
  var pages = {};
  var fallbacks = {};
  var notFound = null;
  var current = { key:null, role:null };

  /* ----------------------------------------------------------------- ADD */
  /* def: { title, crumbs, render, layout, hideTitle } */
  function add(key, role, def) {
    if (!key || typeof def.render !== 'function') return;
    pages[role + ':' + key] = Object.assign({ key:key, role:role }, def);
  }

  function addShared(key, def) {
    if (!key || typeof def.render !== 'function') return;
    fallbacks[key] = Object.assign({ key:key, role:'*' }, def);
  }

  function setNotFound(fn) { notFound = fn; }

  function has(key, role) { return !!(pages[role + ':' + key] || fallbacks[key]); }

  function get(key, role) { return pages[role + ':' + key] || fallbacks[key] || null; }

  function keysFor(role) {
    return Object.keys(pages)
      .filter(function (k) { return k.indexOf(role + ':') === 0; })
      .map(function (k) { return k.split(':')[1]; });
  }

  /* ---------------------------------------------------------- AUTH GUARD */
  var guard = function () { return true; };
  function setGuard(fn) { guard = fn; }

  /* ------------------------------------------------------------- RENDER */
  function render(key, ctx) {
    var role = ctx.role;
    var def = get(key, role);
    var host = document.getElementById('main-content');
    if (!host) return;

    /* Role-based access control: deny if the page is registered for other
       roles only (fallback pages are open to every authenticated role). */
    if (!def) {
      if (typeof notFound === 'function') notFound(host, key, role);
      else host.innerHTML = '<div class="state-block"><div class="state-ico error"><i class="fas fa-lock"></i></div><h3>Page not available</h3><p>This section is not available for your account role.</p></div>';
      return;
    }

    if (!guard(key, role)) {
      host.innerHTML = '<div class="state-block"><div class="state-ico error"><i class="fas fa-shield-halved"></i></div><h3>Access denied</h3><p>You do not have permission to view this page. Please contact the administrator.</p></div>';
      return;
    }

    /* Tear down charts from the previous page to avoid canvas leaks. */
    if (global.SRMS_CHARTS && global.SRMS_CHARTS.destroyAll) global.SRMS_CHARTS.destroyAll();
    if (global.SRMS_UI && global.SRMS_UI.closeModal) global.SRMS_UI.closeModal();

    /* Replace the content host with a listener-free shallow clone so page modules
     * can safely call host.addEventListener on every render without stacking
     * duplicate handlers across navigations. */
    var fresh = host.cloneNode(false);
    if (host.parentNode) host.parentNode.replaceChild(fresh, host);
    host = fresh;

    host.innerHTML = '';
    try {
      def.render(host, ctx);
    } catch (err) {
      if (global.console) console.error('[SRMS] Page render failed:', key, err);
      host.innerHTML = global.SRMS_UI.errorState({
        title:'Unable to load this page',
        message:'An unexpected error occurred while rendering this section. Please retry or navigate to another page.'
      });
      var retry = document.getElementById('retry-action');
      if (retry) retry.addEventListener('click', function () { render(key, ctx); });
    }

    current = { key:key, role:role };

    if (global.SRMS_SIDEBAR) global.SRMS_SIDEBAR.setActive(key);
    if (global.SRMS_NAVBAR) global.SRMS_NAVBAR.setPage(def.title || key, def.crumbs || [def.title || key]);

    /* Replay the page-in animation and return to the top of the document. */
    host.style.animation = 'none';
    void host.offsetWidth;
    host.style.animation = '';
    window.scrollTo({ top:0, behavior:'auto' });

    if (typeof def.afterRender === 'function') def.afterRender(ctx);
  }

  function reRender(ctx) { if (current.key) render(current.key, ctx || { role:current.role }); }
  function currentPage() { return current.key; }

  global.SRMS_ROUTES = {
    add:add, addShared:addShared, get:get, has:has, keysFor:keysFor,
    render:render, reRender:reRender, currentPage:currentPage,
    setGuard:setGuard, setNotFound:setNotFound,
    all:function () { return pages; }, fallbacks:function () { return fallbacks; }
  };
})(window);
