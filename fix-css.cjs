const fs = require('fs');

const cssPath = './style.css';
let css = fs.readFileSync(cssPath, 'utf8');

// Extract the variables from :root (approximately lines 8 to 41)
const rootSectionMatch = css.match(/:root\s*{([^}]+)}/);
if (!rootSectionMatch) {
    console.error('Could not find :root section');
    process.exit(1);
}

const fallbacks = {};
const rootLines = rootSectionMatch[1].split('\n');
for (const line of rootLines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('--')) {
        const [key, value] = trimmed.split(':');
        if (key && value) {
            // Remove the semicolon and trim
            fallbacks[key.trim()] = value.replace(';', '').trim();
        }
    }
}

// Replace var(--key) with var(--key, fallback)
let replacedCount = 0;
const newCss = css.replace(/var\((--[\w-]+)\)/g, (match, key) => {
    if (fallbacks[key]) {
        replacedCount++;
        return `var(${key}, ${fallbacks[key]})`;
    }
    return match;
});

fs.writeFileSync(cssPath, newCss, 'utf8');
console.log(`Successfully added ${replacedCount} fallbacks to style.css`);
