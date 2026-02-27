const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get all files with conflict markers
const result = execSync('git grep -l "<<<<<<< Updated upstream"').toString().split('\n').filter(Boolean);

console.log(`Found ${result.length} files with conflicts. Resolving...`);

let resolvedCount = 0;

for (const file of result) {
    const filePath = path.resolve(process.cwd(), file);
    if (!fs.existsSync(filePath)) continue;

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const newLines = [];

    let inUpstream = false;
    let inStash = false;

    for (const line of lines) {
        if (line.startsWith('<<<<<<< Updated upstream')) {
            inUpstream = true;
            continue;
        } else if (line.startsWith('=======')) {
            if (inUpstream) {
                inUpstream = false;
                inStash = true;
                continue;
            }
        } else if (line.startsWith('>>>>>>> Stashed changes')) {
            if (inStash) {
                inStash = false;
                continue;
            } else if (inUpstream) { // Sometimes ======= is missing if one block is empty
                inUpstream = false;
                continue;
            }
        } else if (line.startsWith('>>>>>>> ')) {
            if (inStash || inUpstream) {
                inStash = false;
                inUpstream = false;
                continue;
            }
        }

        if (!inUpstream) {
            newLines.push(line);
        }
    }

    fs.writeFileSync(filePath, newLines.join('\n'));
    resolvedCount++;
}

console.log(`Successfully resolved ${resolvedCount} files by accepting Stashed changes.`);
