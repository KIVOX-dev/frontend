const fs = require('fs');
const html = fs.readFileSync('SkilloWait_Enhanced_With_Tests_4.html', 'utf8');

const instStart = '<div class="screen" id="screen-admin">';
const scriptStart = '<script data-cfasync="false">';

const iI = html.indexOf(instStart);
const iS = html.indexOf(scriptStart);

const instHtml = html.slice(iI, iS);

console.log('Inst screens logic size:', instHtml.length);
fs.writeFileSync('inst_screens.txt', instHtml);
