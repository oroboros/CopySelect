'use strict';
/**
 * Manifest and runtime-reference inventory for CopySelect MV3.
 * Non-invasive: reports permissions, referenced files and potential risks.
 * Fails only on missing required local assets or invalid manifest structure.
 */
const fs=require('node:fs');
const path=require('node:path');
const m=JSON.parse(fs.readFileSync('manifest.json','utf8'));
const errors=[],warnings=[],refs=[];
if(m.manifest_version!==3) errors.push('Expected manifest_version 3');
if(!/^\d+\.\d+\.\d+(?:\.\d+)?$/.test(m.version||'')) errors.push('Invalid Chrome extension version');
function add(file,kind){
  if(typeof file!=='string'||!file){errors.push('Invalid '+kind+' reference');return}
  refs.push({file,kind});
  if(file.includes('..')||path.isAbsolute(file)) errors.push('Unsafe relative path: '+file);
  else if(!fs.existsSync(file)) errors.push('Missing '+kind+': '+file);
}
if(m.background?.service_worker)add(m.background.service_worker,'service_worker');
if(m.action?.default_popup)add(m.action.default_popup,'popup');
if(m.options_ui?.page)add(m.options_ui.page,'options');
for(const s of m.content_scripts||[]){
  for(const f of s.js||[])add(f,'content_script');
  for(const f of s.css||[])add(f,'content_style');
}
const perms=new Set(m.permissions||[]);
const hosts=m.host_permissions||[];
if(hosts.some(x=>x==='*://*/*'||x==='<all_urls>'))warnings.push('Broad host access: review necessity');
for(const p of ['clipboardRead','clipboardWrite','unlimitedStorage','offscreen','scripting']){
  if(perms.has(p))warnings.push('Sensitive permission present: '+p);
}
if(!m.content_scripts?.length)warnings.push('No content scripts declared');
const result={name:m.name,version:m.version,version_name:m.version_name||null,manifest_version:m.manifest_version,permissions:[...perms].sort(),host_permissions:hosts,referenced_files:refs,errors,warnings};
console.log(JSON.stringify(result,null,2));
if(errors.length)process.exitCode=1;
