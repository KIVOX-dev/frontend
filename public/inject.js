const fs = require('fs');

function inject(targetFile, txtFile, startMarker, endMarker) {
    const html = fs.readFileSync(targetFile, 'utf8');
    const screens = fs.readFileSync(txtFile, 'utf8');

    // Replace everything between startMarker and endMarker with the new screens
    const startIdx = html.indexOf(startMarker);
    const endIdx = html.indexOf(endMarker, startIdx);

    if (startIdx === -1 || endIdx === -1) {
        console.error("Could not find markers in " + targetFile);
        return;
    }

    const before = html.slice(0, startIdx + startMarker.length);
    const after = html.slice(endIdx);

    const newHtml = before + '\n' + screens + '\n' + after;
    fs.writeFileSync(targetFile, newHtml);
    console.log("Injected into " + targetFile);
}

// learner.html
inject('learner.html', 'learner_screens.txt', '<div id="content">', '\n      </div>\n    </div>\n  </div>');

// hr.html
// Looking at hr.html, wait, let me check what the end marker should be.
// Let's use the same closing tags if it exists.
