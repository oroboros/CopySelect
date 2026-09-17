
const versionNode=document.querySelector(".pop-version");if(versionNode)versionNode.textContent=chrome.runtime.getManifest().version;
let settings=null,tab=null;

function setupPopupVersionTooltip(){
  const version=chrome.runtime.getManifest().version;
  const tip=`Version ${version}\n• Smarter keyboard and Shift+click selection\n• Unified search and richer History\n• Storage, Collections, and Copy Confirmation polish\n\nSee Full Changelog for the complete changelog.`;
  document.querySelectorAll(".version-tip").forEach(el=>{el.dataset.tip=tip;el.setAttribute("aria-label",`CopySelect version ${version}`)});
}
function announcePopup(message,error=false){const el=document.getElementById(error?"popupError":"popupStatus");if(!el||!message)return;el.textContent="";requestAnimationFrame(()=>{el.textContent=String(message)})}
const $=id=>document.getElementById(id);
async function safeMessage(message){
  const rt=globalThis.chrome?.runtime;
  if(!rt?.id||typeof rt.sendMessage!=="function")return {ok:false,error:"Extension context unavailable"};
  try{return await rt.sendMessage(message)}catch(e){return {ok:false,error:String(e?.message||e)}}
}
async function save(p){const normalized=normalizeSettings({...settings,...p}),patch={};for(const [k,v] of Object.entries(p))patch[k]=Object.prototype.hasOwnProperty.call(CS_DEFAULTS,k)?normalized[k]:v;Object.assign(settings,patch);await chrome.storage.sync.set(patch)}
function recentExcerpt(s,n=96){
  s=String(s||"").replace(/\s+/g," ").trim();
  if(s.length<=n)return {text:s,hidden:0};
  const head=60,tail=24,hidden=s.length-head-tail;
  return {text:`${s.slice(0,head)} … ${s.slice(-tail)}`,hidden};
}
function renderRecent(){
  const box=$("recentList");box.innerHTML="";
  const items=(settings.history||[]).filter(h=>!(h.collectionIds||[]).some(id=>(settings.historyCollections||[]).some(c=>c.id===id&&c.locked))).slice(0,2);
  if(!items.length){box.innerHTML='<div class="tiny">Nothing copied yet.</div>';return}
  items.forEach(h=>{
    const d=document.createElement("div");d.className="recent-item";
    const ex=recentExcerpt(h.text),wrap=document.createElement("div");wrap.style.minWidth="0";
    const text=document.createElement("div");text.className="clip";text.textContent=ex.text;
    const meta=document.createElement("div");meta.className="tiny";meta.textContent=`${String(h.text||"").length.toLocaleString()} chars${ex.hidden?` · +${ex.hidden.toLocaleString()} hidden`:""}`;
    wrap.append(text,meta);
    d.tabIndex=0;d.setAttribute("role","button");d.setAttribute("aria-label",`Copy recent entry: ${ex.text}`);
    const copy=async()=>{const r=await safeMessage({action:"copyAgain",source:"history",text:h.text,html:h.originalText!==undefined&&h.text!==h.originalText?null:h.html||null});d.classList.remove("copy-flash","copy-error");void d.offsetWidth;d.classList.add(r?.ok?"copy-flash":"copy-error");announcePopup(r?.ok?"Recent entry copied":r?.error||"Copy failed",!r?.ok)};
    d.onclick=()=>void copy();d.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();void copy()}};
    d.append(wrap);box.appendChild(d);
  });
}
async function checkPageConnection(repair=false){
  const status=$("pageConnectionStatus"),button=$("reconnectPage");
  if(!tab?.id||!/^https?:\/\//i.test(String(tab.url||""))){status.textContent="Unavailable on this page";button.classList.add("hidden");return false}
  if(repair){status.textContent="Reconnecting…";const repaired=await safeMessage({action:"reconnectTab",tabId:tab.id});if(!repaired?.ok){status.textContent="Refresh this page";button.classList.remove("hidden");return false}}
  try{const health=await chrome.tabs.sendMessage(tab.id,{action:"copySelectHealth"}),current=chrome.runtime.getManifest().version,ok=!!health?.ok&&health.version===current;status.textContent=ok?`Connected · v${current}`:"Outdated page script";button.classList.toggle("hidden",ok);return ok}catch{status.textContent="Not connected";button.classList.remove("hidden");return false}
}
async function init(){setupPopupVersionTooltip();
  const sync=await chrome.storage.sync.get(null),runtime=await safeMessage({action:"runtimeData"});
  settings=normalizeSettings({...sync,...(runtime?.history?runtime:{})});
  tab=await safeMessage({action:"getActiveTab"});
  $("master").checked=settings.enabled;$("copyMode").value=settings.copyMode;$("delay").value=settings.copyDelay;$("notify").value=settings.notificationMode;$("quickEffect").value=[...$("quickEffect").options].some(o=>o.value===settings.cursorEffect)?settings.cursorEffect:"selection-flash";
  $("masterLabel").textContent=settings.enabled?"Automatic copy is on":"Automatic copy is off";
  try{$("siteHost").textContent=new URL(tab?.url||"").hostname||"Current site"}catch{$("siteHost").textContent="Current site"}
  let host="";try{host=new URL(tab?.url||"").hostname}catch{}
  const exact=(settings.siteRules||[]).find(r=>String(r.pattern||"").replace(/^\*\./,"")===host);
  $("siteBehavior").value=exact?.behavior||"inherit";
  const profiles=$("profile");profiles.innerHTML="";Object.keys(settings.profiles||{Default:{}}).forEach(name=>{const o=document.createElement("option");o.value=o.textContent=name;profiles.append(o)});profiles.value=settings.activeProfile||"Default";renderRecent();
  renderPause();renderHistoryPause();renderWorkingNow();await checkPageConnection();
}
function renderPause(){const paused=settings.pauseUntilRestart||settings.pausedUntil>Date.now(),select=$("pause"),control=$("pauseControl");select.value=settings.pauseUntilRestart?"restart":paused?(settings.pausedUntil-Date.now()>45*60000?"60":settings.pausedUntil-Date.now()>15*60000?"30":"5"):"resume";control.classList.toggle("pressed",paused);control.querySelector("span").textContent=paused?"Paused":"Pause"}
function renderHistoryPause(){const select=$("historyPause");if(!select)return;select.disabled=!settings.historyEnabled;select.title=settings.historyEnabled?"Pause local History saving without pausing automatic copying":"Clipboard History saving is disabled in Settings";const paused=settings.historyPauseUntilRestart||settings.historyPausedUntil>Date.now();select.value=settings.historyPauseUntilRestart?"restart":paused?(settings.historyPausedUntil-Date.now()>30*60000?"60":"15"):"resume"}
$("master").addEventListener("change",async e=>{try{await save({enabled:e.target.checked});$("masterLabel").textContent=e.target.checked?"Automatic copy is on":"Automatic copy is off";announcePopup(e.target.checked?"Automatic copy enabled":"Automatic copy disabled")}catch(err){e.target.checked=!e.target.checked;announcePopup("Could not update automatic copy",true)}});
$("copyMode").addEventListener("change",async e=>{await save({copyMode:e.target.value});if(e.target.value==="custom")openOptions("metadata")});
$("delay").addEventListener("input",e=>{const invalid=!e.target.validity.valid;e.target.toggleAttribute("aria-invalid",invalid)});
$("delay").addEventListener("change",async e=>{if(!e.target.validity.valid){e.target.setAttribute("aria-invalid","true");announcePopup(`Copy delay: ${e.target.validationMessage||"Enter a value from 0 to 10000 milliseconds."}`,true);e.target.value=settings.copyDelay;return}e.target.removeAttribute("aria-invalid");try{await save({copyDelay:Number(e.target.value),copyDelayEnabled:true});announcePopup("Copy delay saved")}catch(err){announcePopup("Could not save copy delay",true)}});
$("notify").addEventListener("change",e=>{const mode=e.target.value,visual=mode==="visual"||mode==="visual-sound",sound=mode==="sound"||mode==="visual-sound";save({notificationMode:mode,cursorFeedbackEnabled:visual,screenFeedbackEnabled:visual,enableAudioNotification:sound})});
$("quickEffect").addEventListener("change",e=>save({cursorEffect:e.target.value,...(CS_EFFECT_DEFAULTS[e.target.value]||{})}));
$("profile").addEventListener("change",async e=>{const name=e.target.value,owned=["copyMode","notificationMode","feedbackStyle","cursorEffect","screenFeedbackEnabled","cursorFeedbackEnabled","enableAudioNotification","feedbackSize","cursorEffectSize","cursorEffectColor","copyDelayEnabled","copyDelay","includeMetadata","includeURL","includeTitle","includeDomain","includeDate","includeTime","trimWhitespace","normalizeWhitespace","preserveLineBreaks","profileTargetCollectionName","profileRequireLockedCollection","profileAutoPin","profileAddPasteStack"],base=Object.fromEntries(owned.map(k=>[k,CS_DEFAULTS[k]])),patch={...base,...(settings.profiles?.[name]||{}),activeProfile:name};await save(patch);$("copyMode").value=settings.copyMode;$("notify").value=settings.notificationMode;$("delay").value=settings.copyDelay;$("quickEffect").value=[...$("quickEffect").options].some(o=>o.value===settings.cursorEffect)?settings.cursorEffect:"selection-flash"});
$("siteBehavior").addEventListener("change",async e=>{if(tab?.url)await safeMessage({action:"setSiteRule",url:tab.url,behavior:e.target.value})});
$("pause").addEventListener("change",async e=>{const v=e.target.value;if(v==="resume")await save({pausedUntil:0,pauseUntilRestart:false});else if(v==="restart")await save({pausedUntil:0,pauseUntilRestart:true});else await save({pausedUntil:Date.now()+Number(v)*60000,pauseUntilRestart:false});renderPause()});
$("historyPause").addEventListener("change",async e=>{const v=e.target.value;if(v==="resume")await save({historyPausedUntil:0,historyPauseUntilRestart:false});else if(v==="restart")await save({historyPausedUntil:0,historyPauseUntilRestart:true});else await save({historyPausedUntil:Date.now()+Number(v)*60000,historyPauseUntilRestart:false});renderHistoryPause()});
function openOptions(section=""){
  const rt=globalThis.chrome?.runtime;if(!rt?.id)return;
  chrome.tabs.create({url:rt.getURL("options.html"+(section?"#"+section:""))});
}
$("settingsTop").onclick=()=>openOptions();
$("history").onclick=$("viewHistory").onclick=()=>openOptions("history");
function renderWorkingNow(){if(!settings)return;const stack=settings.pasteStack||[];if($("popupPasteStackCount"))$("popupPasteStackCount").textContent=String(stack.length);if($("popupPasteStack"))$("popupPasteStack").disabled=!stack.length;const active=(settings.historyCollections||[]).filter(c=>CopySelectSmartCore?.normalizeWordWatch?.(c)).length;if($("wordWatchStatus"))$("wordWatchStatus").textContent=`WordWatch · ${active} active`;const match=settings.lastWordWatchMatch,box=$("popupLastMatch");if(box){box.classList.toggle("hidden",!match?.names?.length);if(match?.names?.length)box.textContent=`Last match: ${match.names.join(" + ")}`}}
$("popupPasteStack")?.addEventListener("click",async()=>{const r=await safeMessage({action:"copyNextPasteStack"});if(r?.ok&&r.item){settings.pasteStack=r.pasteStack||[];renderWorkingNow();announcePopup("Next Paste Stack item copied")}else announcePopup(r?.error||"Paste Stack is empty",true)});
$("popupCollections")?.addEventListener("click",()=>openOptions("collections"));
$("popupPinLast")?.addEventListener("click",async()=>{const item=(settings.history||[])[0];if(!item){announcePopup("Nothing to pin yet",true);return}const r=await safeMessage({action:"pin",item});announcePopup(r?.ok?"Last copy pinned":r?.error||"Could not pin",!r?.ok)});
$("reconnectPage")?.addEventListener("click",()=>checkPageConnection(true));
chrome.storage.onChanged.addListener(async(c,area)=>{
  if(area==="sync"){await init();return}
  if(area==="local"&&(c.history||c.stats||c.pasteStack||c.lastWordWatchMatch)){
    const runtime=await safeMessage({action:"runtimeData"});
    if(runtime?.history){Object.assign(settings,runtime);renderRecent();renderWorkingNow()}
  }
});
init().catch(err=>{console.error("CopySelect popup failed to initialize",err);announcePopup("CopySelect could not load. Close and reopen the extension popup.",true)});
