const fs = require('fs');
const ms = fs.readFileSync('monolith_script.js', 'utf8');

// 1. data.js
const qsEnd = ms.indexOf('// ════════ STATE ════════');
let dataJs = ms.substring(0, qsEnd);

// 2. core.js
const stateStart = ms.indexOf('// ════════ STATE ════════');
const learnerStart = ms.indexOf('// ════════ PRACTICE ════════');
let coreMain = ms.substring(stateStart, learnerStart);

// Shared utilities at the bottom
const sharedModalsStart = ms.indexOf('// ════════ STUDENT PROFILE MODAL ════════');
let sharedModals = ms.substring(sharedModalsStart);

let coreJs = coreMain + '\n\n' + sharedModals;

// 3. learner.js
const hrStart = ms.indexOf('// ════════ HR VACANCY POST ════════');
let learnerJs = ms.substring(learnerStart, hrStart);

// 4. hr.js
const cadmStart = ms.indexOf('// ════════ COLLEGE ADMIN MODULE ════════');
let hrJs = ms.substring(hrStart, cadmStart);

// 5. institutional.js
let instJs = ms.substring(cadmStart, sharedModalsStart);

// Save and log
console.log({
  dataLen: dataJs.length,
  coreLen: coreJs.length,
  learnerLen: learnerJs.length,
  hrLen: hrJs.length,
  instLen: instJs.length
});

try {
    fs.writeFileSync('data.js', dataJs);
    fs.writeFileSync('core.js', coreJs);
    fs.writeFileSync('learner.js', learnerJs);
    fs.writeFileSync('hr.js', hrJs);
    fs.writeFileSync('institutional.js', instJs);
    console.log("Successfully executed PERFECT split!");
} catch(e) {
    console.error(e);
}
