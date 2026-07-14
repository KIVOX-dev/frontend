const fs = require('fs');

const mono = fs.readFileSync('SkilloWait_Enhanced_With_Tests_4.html', 'utf8');

// 1. Learner
const idx1 = mono.indexOf('<!-- ══ DASHBOARD ══ -->');
const idx2 = mono.indexOf('<!-- ══ HR DASHBOARD ══ -->');
const learnerScreens = mono.substring(idx1, idx2);

// 2. HR
const idx3 = mono.indexOf('<div class="screen" id="screen-admin">');
const hrScreens = mono.substring(idx2, idx3);

// 3. Admin / Institutional
// From screen-admin up to the closing of #app
const fpStart = mono.indexOf('<!-- ════════ FACULTY PORTAL ════════ -->');
let cadmScreens = mono.substring(idx3, mono.lastIndexOf('</div><!-- /content -->', fpStart));

// 4. Faculty Portal Content
const fpContentStart = mono.indexOf('<div class="fp-content">', fpStart);
const fpContentEnd = mono.indexOf('</div>', mono.indexOf('id="screen-fac-student"', fpContentStart));
// Actually, let's just get what's inside <div class="fp-content"> ... </div>
const fpEndTag = mono.indexOf('<!-- ════════ ADMIN STUDENT ACCESS SCREEN ════════ -->');
let fpScreens = mono.substring(fpContentStart + '<div class="fp-content">'.length, fpEndTag);
// find last </div> from there
fpScreens = fpScreens.substring(0, fpScreens.lastIndexOf('</div></div>') + 12);  // rough but wait, easier to just match exact.
// let's exact match the screens inside fp-content
const facDash = mono.indexOf('<div class="screen" id="screen-fac-dash">');
const facEnd = mono.indexOf('<!-- ════════ ADMIN STUDENT ACCESS SCREEN ════════ -->');

fpScreens = mono.substring(facDash, facEnd);


function inject(file, startMarker, endMarker, str) {
    const text = fs.readFileSync(file, 'utf8');
    const part1 = text.substring(0, text.indexOf(startMarker) + startMarker.length);
    const part2 = text.substring(text.indexOf(endMarker, part1.length));
    fs.writeFileSync(file, part1 + '\n' + str + '\n' + part2);
    console.log('Injected ' + file);
}

inject('learner.html', '<div id="content">', '    </div>\n    </div>\n  </div>', learnerScreens);
inject('hr.html', '<div id="content">', '    </div>\n    </div>\n  </div>', hrScreens);
inject('institutional.html', '<div id="content">', '    </div>\n    </div>\n  </div>', cadmScreens);
inject('institutional.html', '<div class="fp-content">', '      </div>\n    </div>\n  </div>', fpScreens);
