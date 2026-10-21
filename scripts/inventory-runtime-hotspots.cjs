'use strict';
// Static hotspot inventory, not a performance benchmark or security verdict.
const fs=require('node:fs');
const path=require('node:path');
const patterns={
 domWrites:/\b(?:innerHTML|outerHTML|insertAdjacentHTML|appendChild|replaceChildren)\b/g,
 domQueries:/\b(?:querySelectorAll|querySelector|getElementsByClassName|getElementById)\b/g,
 observers:/\bMutationObserver\b/g,
 storage:/\b(?:chrome|browser)\.storage\b/g,
 messages:/\b(?:sendMessage|onMessage)\b/g,
 timers:/\b(?:setInterval|setTimeout)\s*\(/g,
 layoutReads:/\b(?:getBoundingClientRect|offsetWidth|offsetHeight|clientWidth|clientHeight)\b/g,
 inlineStyles:/\.style\.[a-zA-Z]+\s*=/g
};
function files(dir){
 return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{
  if(e.isDirectory()&&['.git','node_modules','tests'].includes(e.name))return [];
  const full=path.join(dir,e.name);
  return e.isDirectory()?files(full):e.isFile()&&e.name.endsWith('.js')?[full]:[];
 });
}
const results=[];
for(const f of files('.')){
 const s=fs.readFileSync(f,'utf8');
 const counts={};
 for(const [k,re] of Object.entries(patterns)){re.lastIndex=0;counts[k]=[...s.matchAll(re)].length;}
 if(Object.values(counts).some(Boolean))results.push({file:f.replaceAll('\\','/'),lines:s.split('\n').length,...counts});
}
results.sort((a,b)=>Object.keys(patterns).reduce((n,k)=>n+b[k]-a[k],0)-Object.keys(patterns).reduce((n,k)=>n+a[k]-b[k],0));
const report={generatedFrom:'static source inspection',warning:'Counts may include comments or strings; investigate with runtime traces before changing code',files:results};
fs.writeFileSync('runtime-hotspots.json',JSON.stringify(report,null,2)+'\n');
console.log('Static hotspot inventory: '+results.length+' files. See runtime-hotspots.json');
