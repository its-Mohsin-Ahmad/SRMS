/* SRMS smoke test: loads every module in a stubbed DOM and validates routes. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');

function stubEl() {
  return {
    innerHTML:'', textContent:'', value:'', checked:false, hidden:false, style:{},
    classList:{ add(){}, remove(){}, toggle(){}, contains(){ return false; } },
    setAttribute(){}, getAttribute(){ return null; }, removeAttribute(){},
    addEventListener(){}, removeEventListener(){}, appendChild(){}, removeChild(){},
    querySelector(){ return null; }, querySelectorAll(){ return []; }, closest(){ return null; },
    focus(){}, click(){}, scrollIntoView(){}, files:null, dataset:{}, offsetWidth:0
  };
}

const documentStub = {
  getElementById(){ return stubEl(); },
  querySelector(){ return stubEl(); },
  querySelectorAll(){ return []; },
  createElement(){ return stubEl(); },
  addEventListener(){}, removeEventListener(){},
  body:Object.assign(stubEl(), { style:{} }),
  readyState:'complete'
};

const windowStub = {
  document:documentStub, console:{ log(){}, warn(){}, error(){} },
  matchMedia(){ return { matches:false }; },
  addEventListener(){}, removeEventListener(){},
  requestAnimationFrame(){ return 1; },
  localStorage:{ getItem(){ return null; }, setItem(){}, removeItem(){} },
  setTimeout, clearTimeout, setInterval, clearInterval,
  Blob:function(){}, URL:{ createObjectURL(){ return ''; }, revokeObjectURL(){} },
  Event:function(){}, Date:Date, Math:Math, JSON:JSON,
  scrollTo(){}, navigator:{}, Chart:null
};
windowStub.window = windowStub;
windowStub.globalThis = windowStub;

const ctx = vm.createContext(windowStub);

const files = [
  'js/data/demoData.js','js/data/academicData.js','js/data/resultsData.js',
  'js/data/operationsData.js','js/data/timetableData.js','js/data/portalData.js',
  'js/data/communicationData.js','js/data/analyticsData.js','js/data/index.js',
  'js/utils/helpers.js','js/utils/charts.js','js/components/uiComponents.js','js/components/register.js',
  'js/components/sidebar.js','js/components/navbar.js','js/config/router.js','js/pages/shared.js','js/pages/extra.js',
  'js/pages/profiles.js',
  'js/pages/student/dashboard.js','js/pages/student/profile.js','js/pages/student/courses.js',
  'js/pages/student/results.js','js/pages/student/attendance.js','js/pages/student/exams.js',
  'js/pages/student/timetable.js','js/pages/student/notices.js','js/pages/student/assignments.js',
  'js/pages/student/library.js','js/pages/student/messages.js','js/pages/student/feedback.js',
  'js/pages/student/downloads.js',
  'js/pages/teacher/dashboard.js','js/pages/teacher/students.js','js/pages/teacher/results.js',
  'js/pages/teacher/attendance.js','js/pages/teacher/exams.js','js/pages/teacher/reports.js',
  'js/pages/admin/dashboard.js','js/pages/admin/students.js','js/pages/admin/teachers.js',
  'js/pages/admin/courses.js','js/pages/admin/departments.js','js/pages/admin/exams.js',
  'js/pages/admin/notices.js','js/pages/admin/users.js','js/pages/admin/reports.js',
  'js/pages/admin/auditLogs.js','js/pages/admin/settings.js'
];

let failures = 0;
files.forEach(function (f) {
  const full = path.join(ROOT, f);
  try {
    vm.runInContext(fs.readFileSync(full, 'utf8'), ctx, { filename:f });
    console.log('LOADED  ' + f);
  } catch (e) {
    failures++;
    console.log('FAILED  ' + f + ' :: ' + e.message);
  }
});

/* Route coverage check ------------------------------------------------- */
const routes = vm.runInContext('SRMS_ROUTES.all()', ctx);
const fallbacks = vm.runInContext('SRMS_ROUTES.fallbacks()', ctx);
const menus = vm.runInContext('SRMS_SIDEBAR.MENUS', ctx);

['student','teacher','admin'].forEach(function (role) {
  const keys = [];
  (menus[role] || []).forEach(function (g) { g.items.forEach(function (i) { keys.push(i.key); }); });
  keys.push('profile','settings','help','notifications-center');
  const missing = keys.filter(function (k) { return !(routes[role + ':' + k] || fallbacks[k]); });
  if (missing.length) { failures++; console.log('ROLE ' + role.toUpperCase() + ' MISSING ROUTES: ' + missing.join(', ')); }
  else console.log('ROLES   ' + role + ': all ' + keys.length + ' nav keys resolve');
});

/* Data integrity ------------------------------------------------------- */
const checks = vm.runInContext([
  'SRMS_DATA.users.length',
  'SRMS_DATA.courses.length',
  'SRMS_DATA.semesterResults.length',
  'SRMS_DATA.exams.length',
  'SRMS_DATA.notices.length',
  'SRMS_DATA.assignments.length',
  'SRMS_DATA.books.length',
  'SRMS_DATA.threads.length',
  'SRMS_DATA.notifications.length',
  'SRMS_DATA.auditLogs.length',
  'SRMS_DATA.calendarEvents.length',
  'SRMS_DATA.studentRoster.length',
  'SRMS_DATA.teachers.length',
  'SRMS_DATA.departments.length',
  'SRMS_DATA.downloads.length',
  'SRMS_DATA.subjectAttendance.length'
].join(' + "|" + '), ctx).split('|').map(Number);

const expected = [3,8,5,12,8,8,10,5,10,12,16,24,12,6,10,8];
checks.forEach(function (n, i) {
  if (n !== expected[i]) { failures++; console.log('DATA FAIL index ' + i + ': got ' + n + ' expected ' + expected[i]); }
});
console.log('DATA    all ' + checks.length + ' datasets populated');

console.log(failures ? ('SMOKE TEST FAILED: ' + failures + ' issue(s)') : 'SMOKE TEST PASSED');
process.exit(failures ? 1 : 0);



