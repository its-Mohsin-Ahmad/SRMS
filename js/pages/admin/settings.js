/* =============================================================================
   SRMS - Admin System Settings  (js/pages/admin/settings.js)
   Institution identity, academic configuration, security policy and the
   notification matrix for the whole platform.
   ========================================================================== */
(function (global) {
  'use strict';
  var U = global.SRMS_UTIL;
  var UI = global.SRMS_UI;
  var R = global.SRMS_ROUTES;

  function settingsPage(host, ctx) {
    global.SRMS_SHARED.settingsPage(host, ctx);
    /* Admin gets an extra configuration card appended. */
    var extra = document.createElement('div');
    extra.className = 'grid grid-main-side';
    extra.style.marginTop = '18px';
    extra.innerHTML =
      UI.card({ title:'Institution Configuration', icon:'fa-building-columns', subtitle:'Global academic parameters applied across the platform',
        body:'<div class="form-grid">' +
          '<div class="form-group"><label class="field-label">Institution Name</label><div class="input-wrap no-icon"><input value="University of Technology \u2014 Main Campus"></div></div>' +
          '<div class="form-group"><label class="field-label">Academic Year</label><div class="input-wrap no-icon"><select><option>2026-2027</option><option>2027-2028</option></select></div></div>' +
          '<div class="form-group"><label class="field-label">Current Semester</label><div class="input-wrap no-icon"><select><option>Fall 2026</option><option>Spring 2027</option></select></div></div>' +
          '<div class="form-group"><label class="field-label">Grading Scale</label><div class="input-wrap no-icon"><select><option>4.00 Scale (default)</option><option>5.00 Scale</option><option>Percentage</option></select></div></div>' +
          '<div class="form-group"><label class="field-label">Minimum Attendance %</label><div class="input-wrap no-icon"><input type="number" value="75"></div></div>' +
          '<div class="form-group"><label class="field-label">Pass Mark %</label><div class="input-wrap no-icon"><input type="number" value="50"></div></div>' +
        '</div>' +
        '<div class="form-actions"><button class="btn btn-primary" id="asp-save"><i class="fas fa-floppy-disk"></i> Save Configuration</button>' +
        '<button class="btn btn-danger" id="asp-reset"><i class="fas fa-rotate-left"></i> Reset to Defaults</button></div>' }) +
      UI.card({ title:'Security Policy', icon:'fa-shield-halved', subtitle:'Authentication and access rules for every account',
        body:'<div class="list-simple">' + [
          ['Enforce strong passwords','Require 8+ characters with mixed case and a digit', true],
          ['Two-factor authentication','Mandatory for administrator accounts', true],
          ['Session timeout','Sign out inactive sessions after 30 minutes', true],
          ['Login attempt limit','Lock accounts after 5 failed attempts', true],
          ['Audit sensitive actions','Log every publish, delete and export', true],
          ['Allow self-registration','Students may create accounts without an invite', false]
        ].map(function (p, i) {
          return '<div class="list-row"><span class="resource-ico badge-purple" style="width:34px;height:34px;font-size:13px;border-radius:10px"><i class="fas fa-lock"></i></span>' +
            '<div class="list-row-main"><strong>' + p[0] + '</strong><span>' + p[1] + '</span></div>' +
            '<label class="checkbox-label"><input type="checkbox"' + (p[2] ? ' checked' : '') + '><span class="checkbox-box"><i class="fas fa-check"></i></span></label></div>';
        }).join('') + '</div>' }) ;
    host.appendChild(extra);

    var save = document.getElementById('asp-save');
    if (save) save.addEventListener('click', function () { UI.toast('success', 'Configuration saved', 'Institution-wide settings have been applied.'); });
    var reset = document.getElementById('asp-reset');
    if (reset) reset.addEventListener('click', function () {
      UI.confirm({ title:'Reset system configuration?', message:'All institution-level parameters return to their factory defaults.', tone:'danger', confirmText:'Reset System',
        onConfirm:function () { UI.toast('success', 'System reset', 'Configuration restored to factory defaults.'); } });
    });
  }

  R.add('settings', 'admin', { title:'System Settings', crumbs:['System','Settings'], render:settingsPage });
})(window);
