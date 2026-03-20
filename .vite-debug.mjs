import { build } from 'vite';
import fs from 'fs';
build().catch(err => {
  fs.writeFileSync('vite-error.json', JSON.stringify({
    message: err.message,
    frame: err.frame,
    loc: err.loc,
    stack: err.stack
  }, null, 2));
});
