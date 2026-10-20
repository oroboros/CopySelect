'use strict';
/**
 * CopySelect local UI integrity guard.
 * Zero dependencies, read-only. Designed for CI on every PR.
 */
const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const errors = [];
const warnings = [];
function visit(dir) {
  return fs.readdirSync(dir, {withFileTypes:true}).flatMap(entry => {
    if (['.git','node_modules'].includes(entry.name)) return [];
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? visit(full) : [full];
  });
}
const htmlFiles = visit(root).filter(p => p.endsWith('.html'));
for (const file of htmlFiles) {
  const html = fs.readFileSync(file,'utf8');
  const relative = path.relative(root,file);
  const ids = new Map();
  const idRe = /\bid\s*=\s*["']([^"']+)["']/gi;
  for(const match of html.matchAll(idRe)) {
    const id = match[1];
    if(ids.has(id)) errors.push(relative + ': duplicate id "' + id + '"');
    ids.set(id,true);
  }
  const resourceRe = /<(script|link)\b[^>]*?\b(src|href)\s*=\s*["']([^"']+)["'][^>]*>/gi;
  for(const match of html.matchAll(resourceRe)){
    const [,tag,attr,url] = match;
    // Ignore anchors, data URLs and fragment references.
    if (!url || url.startsWith('#') || url.startsWith('data:')) continue;
    if (/^(https?:)?\/\//i.test(url)) {
      if (tag.toLowerCase() === 'script') errors.push(relative + ': remote script forbidden: ' + url);
      else warnings.push(relative + ': external stylesheet/reference: ' + url);
      continue;
    }
    if (/^(chrome-extension:|moz-extension:|blob:)/i.test(url)) continue;
    const clean = decodeURIComponent(url.split(/[?#]/)[0]).replace(/^\//,'');
    if (!clean) continue;
    const resolved = path.resolve(path.dirname(file),clean);
    if (!resolved.startsWith(root + path.sep)) {
      errors.push(relative + ': escaping local resource: ' + url);
    } else if(!fs.existsSync(resolved)) {
      errors.push(relative + ': missing local resource: ' + url);
    }
  }
}
console.log(JSON.stringify({htmlChecked:htmlFiles.length,warnings,errors},null,2));
if(errors.length) process.exitCode=1;
