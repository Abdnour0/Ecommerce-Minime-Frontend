// MIGRATION SCRIPT — safe to delete, already applied.
const fs = require('fs');
let code = fs.readFileSync('components/ui-utils.js', 'utf8');

const splitToken = 'export function trapFocus(element) {';
if (code.includes(splitToken)) {
    const parts = code.split(splitToken);
    const newFunc = `export function trapFocus(element) {
    const focusableEls = element.querySelectorAll('a[href]:not([disabled]), button:not([disabled]), textarea:not([disabled]), input[type="text"]:not([disabled]), input[type="radio"]:not([disabled]), input[type="checkbox"]:not([disabled]), select:not([disabled])');
    if (!focusableEls.length) return;
    const firstFocusableEl = focusableEls[0];
    const lastFocusableEl = focusableEls[focusableEls.length - 1];

    if (element._focusTrapController) element._focusTrapController.abort();
    const controller = new AbortController();
    element._focusTrapController = controller;

    element.addEventListener('keydown', function(e) {
        const isTabPressed = e.key === 'Tab' || e.keyCode === 9;
        if (!isTabPressed) return;
        if (e.shiftKey) {
            if (document.activeElement === firstFocusableEl) { lastFocusableEl.focus(); e.preventDefault(); }
        } else {
            if (document.activeElement === lastFocusableEl) { firstFocusableEl.focus(); e.preventDefault(); }
        }
    }, { signal: controller.signal });
}
`;
    fs.writeFileSync('components/ui-utils.js', parts[0] + newFunc, 'utf8');
}
