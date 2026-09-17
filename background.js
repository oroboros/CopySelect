// Clipboard service must register even if an optional organization module fails.
importScripts("settings.js");
try{importScripts("smart-core.js")}catch(e){console.warn("CopySelect organization module unavailable; clipboard remains active",e)}
if(!globalThis.CopySelectSmartCore)globalThis.CopySelectSmartCore={normalizeWordWatch:()=>null,collectionMatch:()=>({matched:false,reasons:[]}),evaluateCollections:()=>({matches:[],actions:{addCollections:[],addTags:[],pin:false,pasteStack:false},feedback:null}),suggestTags:()=>[],organizationStamp:()=>""};

async function getSettings(){
  const sync=await chrome.storage.sync.get(null);
  return normalizeSettings(sync);
}
let runtimeMutationChain=Promise.resolve();
function mutateRuntime(fn){
  const op=runtimeMutationChain.then(fn,fn);
  runtimeMutationChain=op.catch(()=>{});
  return op;
}
async function getRuntimeData(){
  const d=await chrome.storage.local.get({history:[],pinned:[],pasteStack:[],stats:CS_DEFAULTS.stats});
  const normalized=normalizeRuntimeState(d);
  if(normalized.changed)await chrome.storage.local.set({history:normalized.history,pinned:normalized.pinned,pasteStack:normalized.pasteStack,stats:normalized.stats});
  return {history:normalized.history,pinned:normalized.pinned,pasteStack:normalized.pasteStack,stats:normalized.stats};
}
async function stableRuntimeData(){await runtimeMutationChain.catch(()=>{});return getRuntimeData()}
let learnerRefreshTimer=null;
async function recomputeSuggestionsBackground(){
  return mutateRuntime(async()=>{
    const s=await getSettings();if(s.smartTagSuggestionMode==="off")return {ok:true,refreshed:0};
    const data=await getRuntimeData(),{smartTagLearner={}}=await chrome.storage.local.get({smartTagLearner:{}}),refresh=item=>({...item,suggestedTags:CopySelectSmartCore?.suggestTags?.(String(item.rawText??item.text??""),{max:5,learner:smartTagLearner,existing:item.tags||[]})||[]});
    const history=data.history.map(refresh),pinned=data.pinned.map(refresh);await chrome.storage.local.set({history,pinned});return {ok:true,refreshed:history.length+pinned.length};
  });
}
function scheduleSuggestionRefresh(){clearTimeout(learnerRefreshTimer);learnerRefreshTimer=setTimeout(()=>{learnerRefreshTimer=null;void recomputeSuggestionsBackground().catch(e=>console.warn("CopySelect suggestion refresh failed",e))},80)}
chrome.storage.onChanged?.addListener?.((changes,area)=>{if(area==="local"&&changes.smartTagLearner)scheduleSuggestionRefresh()});
async function reconnectTab(tabId){
  if(!chrome.scripting?.executeScript||!Number.isInteger(Number(tabId)))return {ok:false,error:"Page reconnection is unavailable"};
  try{await chrome.scripting.executeScript({target:{tabId:Number(tabId)},files:["settings.js","copy-utils.js","content.js"]});return {ok:true}}
  catch(error){return {ok:false,error:String(error?.message||error)}}
}
async function reconnectOpenTabs(){
  if(!chrome.tabs?.query||!chrome.scripting?.executeScript)return;
  const tabs=await chrome.tabs.query({});
  await Promise.allSettled(tabs.filter(tab=>/^https?:\/\//i.test(String(tab.url||""))).map(tab=>reconnectTab(tab.id)));
}
chrome.runtime.onInstalled.addListener(async()=>{
  const stored=await chrome.storage.sync.get(null);
  const legacyHistory=Array.isArray(stored.history)?stored.history:[];
  const legacyPinned=Array.isArray(stored.pinned)?stored.pinned:[];
  const normalized=normalizeSettings(stored);
  const {history,pinned,pasteStack,stats,...syncSafe}=normalized;
  // "Until restart" pauses must not survive an install, update, or unpacked reload.
  syncSafe.pauseUntilRestart=false;
  syncSafe.pausedUntil=0;
  await chrome.storage.sync.set(syncSafe);
  await chrome.storage.sync.remove(["history","pinned","stats"]);
  const local=await chrome.storage.local.get(null);
  const migration={};
  if(!Array.isArray(local.history)||(local.history.length===0&&legacyHistory.length))migration.history=legacyHistory;
  if(!Array.isArray(local.pinned)||(local.pinned.length===0&&legacyPinned.length))migration.pinned=legacyPinned;
  if(!local.stats)migration.stats=normalized.stats||CS_DEFAULTS.stats;
  if(Object.keys(migration).length)await chrome.storage.local.set(migration);
  await getRuntimeData(); // migrate legacy runtime entries to stable unique IDs.
  chrome.contextMenus.removeAll(()=>{
    chrome.contextMenus.create({id:"cs-toggle-site",title:"Toggle CopySelect on this site",contexts:["page","selection"]});
    chrome.contextMenus.create({id:"cs-copy-source",title:"Copy selection with source",contexts:["selection"]});
  });
  await reconnectOpenTabs();
});
chrome.runtime.onStartup?.addListener(()=>{
  chrome.storage.sync.set({pauseUntilRestart:false,pausedUntil:0,historyPauseUntilRestart:false,historyPausedUntil:0}).catch(()=>{});
  void reconnectOpenTabs();
});
let offscreenCreatePromise=null;
async function ensureOffscreen(){
  if(!chrome.offscreen)return false;
  if(!offscreenCreatePromise)offscreenCreatePromise=(async()=>{
    let exists=false;
    if(chrome.offscreen.hasDocument)exists=await chrome.offscreen.hasDocument();
    else if(chrome.runtime.getContexts){
      const contexts=await chrome.runtime.getContexts({contextTypes:["OFFSCREEN_DOCUMENT"],documentUrls:[chrome.runtime.getURL("offscreen.html")]});
      exists=contexts.length>0;
    }
    if(!exists)await chrome.offscreen.createDocument({url:"offscreen.html",reasons:["CLIPBOARD"],justification:"Read and write clipboard content for CopySelect copy and plain-text paste"});
    return true;
  })();
  try{return await offscreenCreatePromise}finally{offscreenCreatePromise=null}
}
async function rebuildOffscreen(){
  offscreenCreatePromise=null;
  try{if(chrome.offscreen?.closeDocument)await chrome.offscreen.closeDocument()}catch{}
  return ensureOffscreen();
}
async function sendClipboardRequest(text,html){
  const rt=globalThis.chrome?.runtime;
  if(!rt||typeof rt.sendMessage!=="function")return {ok:false,error:"Extension context unavailable"};
  let timer;
  try{return await Promise.race([
    rt.sendMessage({target:"offscreen",action:"writeClipboard",text,html}),
    new Promise(resolve=>{timer=setTimeout(()=>resolve({ok:false,error:"Clipboard writer did not respond"}),1400)})
  ])}catch(error){return {ok:false,error:String(error?.message||error)}}finally{clearTimeout(timer)}
}
async function readClipboardText(){
  const rt=globalThis.chrome?.runtime;
  if(!rt||typeof rt.sendMessage!=="function")return {ok:false,error:"Extension context unavailable"};
  try{
    if(!await ensureOffscreen())return {ok:false,error:"Clipboard unavailable"};
    return await Promise.race([
      rt.sendMessage({target:"offscreen",action:"readClipboard"}),
      new Promise(resolve=>setTimeout(()=>resolve({ok:false,error:"Clipboard reader did not respond"}),1400))
    ]);
  }catch(error){return {ok:false,error:String(error?.message||error)}}
}
let lastClipboardEnvelope=null;
function comparableClipboardText(value){return String(value??"").replace(/\r\n/g,"\n")}
async function rememberClipboardEnvelope(formatted,raw){
  const envelope={formatted:String(formatted??""),raw:String(raw??formatted??""),ts:Date.now()};
  lastClipboardEnvelope=envelope;
  try{await chrome.storage.session?.set?.({lastClipboardEnvelope:envelope})}catch{}
}
async function getClipboardEnvelope(){
  if(lastClipboardEnvelope)return lastClipboardEnvelope;
  try{
    const stored=await chrome.storage.session?.get?.({lastClipboardEnvelope:null});
    if(stored?.lastClipboardEnvelope)lastClipboardEnvelope=stored.lastClipboardEnvelope;
  }catch{}
  return lastClipboardEnvelope;
}
function normalizedClipboardCompare(value){return comparableClipboardText(value).replace(/\r/g,"\n").replace(/\u0000/g,"").normalize("NFC")}
async function resolvePlainPasteText(currentText){
  const current=String(currentText??"");
  const envelope=await getClipboardEnvelope();
  if(!envelope)return {ok:true,text:current,strippedCopySelectMetadata:false};
  const age=Date.now()-Number(envelope.ts||0);
  if(age<0||age>12*60*60*1000)return {ok:true,text:current,strippedCopySelectMetadata:false};
  const a=normalizedClipboardCompare(current),b=normalizedClipboardCompare(envelope.formatted);
  const exact=a===b||a.replace(/\n+$/g,"")===b.replace(/\n+$/g,"");
  if(exact)return {ok:true,text:String(envelope.raw??""),strippedCopySelectMetadata:normalizedClipboardCompare(envelope.raw)!==b};
  return {ok:true,text:current,strippedCopySelectMetadata:false};
}
async function readClipboardPlainText(){
  const current=await readClipboardText();
  if(!current?.ok)return current;
  return resolvePlainPasteText(current.text);
}

async function writeClipboard(text,html){
  let first={ok:false,error:"Clipboard unavailable"};
  try{if(await ensureOffscreen())first=await sendClipboardRequest(text,html)}catch(e){first={ok:false,error:String(e?.message||e)}}
  if(first?.ok)return first;
  console.warn("CopySelect clipboard writer unavailable; rebuilding once",first?.error||"Unknown error");
  try{if(await rebuildOffscreen()){const retry=await sendClipboardRequest(text,html);if(retry?.ok)return {...retry,recovered:true};return retry}}catch(e){return {ok:false,error:String(e?.message||e)}}
  return first;
}
function weekKey(){return copySelectWeekKey()}
function findProfileTarget(s){const name=String(s.profileTargetCollectionName||"").trim().toLowerCase();if(!name)return null;const c=(s.historyCollections||[]).find(x=>String(x.name||"").toLowerCase()===name);if(!c)return null;if(s.profileRequireLockedCollection&&!c.locked)return null;return c}
function mergeUnique(a,b){return [...new Set([...(a||[]),...(b||[])].map(x=>String(x).trim()).filter(Boolean))]}
function suggestedForEntry(entry,s,learner,preSuggested=null){if(s.smartTagSuggestionMode==="off")return {tags:entry.tags||[],suggestedTags:[]};const suggested=Array.isArray(preSuggested)?preSuggested:(CopySelectSmartCore?.suggestTags?.(String(entry.rawText??entry.text??""),{max:5,learner,existing:entry.tags||[]})||[]),threshold=(Number(s.smartTagAutoThreshold)||90)/100;if(s.smartTagSuggestionMode==="auto"){const auto=suggested.filter(x=>Number(x.confidence)>=threshold).map(x=>x.tag),rest=suggested.filter(x=>Number(x.confidence)<threshold);return {tags:mergeUnique(entry.tags,auto),suggestedTags:rest}}return {tags:entry.tags||[],suggestedTags:suggested}}
function validPreAnalysis(pre,s){return !!(pre&&pre.stamp&&CopySelectSmartCore?.organizationStamp?.(s)===String(pre.stamp))}
function evaluationFromPreAnalysis(pre,s){if(!validPreAnalysis(pre,s))return null;const byId=new Map((s.historyCollections||[]).map(c=>[String(c.id),c])),matches=(pre.matchIds||[]).map(id=>{const collection=byId.get(String(id));if(!collection)return null;return {collection,wordWatch:CopySelectSmartCore?.normalizeWordWatch?.(collection)||null,reasons:[]}}).filter(Boolean);return {matches,actions:pre.actions||{addCollections:[],addTags:[],pin:false,pasteStack:false},feedback:pre.feedback||null}}
function makePreAnalysis(entry,s,learner){const evaluation=CopySelectSmartCore?.evaluateCollections?.(entry,s.historyCollections||[],{maxActive:20})||{matches:[],actions:{addCollections:[],addTags:[],pin:false,pasteStack:false},feedback:null};const suggestedTags=s.smartTagSuggestionMode==="off"?[]:(CopySelectSmartCore?.suggestTags?.(String(entry.rawText??entry.text??""),{max:5,learner,existing:entry.tags||[]})||[]);return {stamp:CopySelectSmartCore?.organizationStamp?.(s)||"",matchIds:evaluation.matches.map(m=>m.collection.id),matchNames:evaluation.matches.map(m=>m.collection.name),actions:evaluation.actions,feedback:evaluation.feedback,suggestedTags}}
function organizeEntry(entry,s,learner,preAnalysis=null){const evaluation=evaluationFromPreAnalysis(preAnalysis,s)||(CopySelectSmartCore?.evaluateCollections?.(entry,s.historyCollections||[],{maxActive:20})||{matches:[],actions:{addCollections:[],addTags:[],pin:false,pasteStack:false},feedback:null}),target=findProfileTarget(s),actions=evaluation.actions||{};entry.collectionIds=mergeUnique(entry.collectionIds,[...(actions.addCollections||[]),...(target?[target.id]:[])]);entry.tags=mergeUnique(entry.tags,actions.addTags||[]);const suggestions=suggestedForEntry(entry,s,learner,validPreAnalysis(preAnalysis,s)?preAnalysis.suggestedTags:null);entry.tags=suggestions.tags;entry.suggestedTags=suggestions.suggestedTags;return {entry,evaluation,profileTarget:target,shouldPin:!!(actions.pin||s.profileAutoPin),shouldStack:!!(actions.pasteStack||s.profileAddPasteStack)}}
function stackEntry(entry){return {id:entry.id,text:String(entry.rawText??entry.text??""),title:entry.title||"",url:entry.url||"",collectionIds:[...(entry.collectionIds||[])]}}
async function addHistory(item){
  return mutateRuntime(async()=>{
    const s=await getSettings(),data=await getRuntimeData(),localMeta=await chrome.storage.local.get({smartTagLearner:{}}),learner=localMeta.smartTagLearner||{};
    const rawCapture=String(item.rawText??item.text??"");if(!rawCapture.trim())return {saved:false};if(item.copyMode!=="manual"&&rawCapture.trim().length<Math.max(1,Number(s.minSelectionLength)||1))return {saved:false};
    let stats=data.stats;const wk=weekKey();if(s.statsEnabled)stats={...stats,totalCopies:(stats.totalCopies||0)+1,charsCopied:(stats.charsCopied||0)+String(item.text||"").length,weeklyCopies:stats.weekKey===wk?(stats.weeklyCopies||0)+1:1,weekKey:wk};
    const historyPaused=s.historyPauseUntilRestart||(s.historyPausedUntil&&Date.now()<s.historyPausedUntil),historyEnabled=item.historyEnabled===undefined?s.historyEnabled:!!item.historyEnabled,saveSource=item.historyCaptureSourceDetails===undefined?s.historyCaptureSourceDetails:!!item.historyCaptureSourceDetails;if(!historyEnabled||historyPaused){if(s.statsEnabled)await chrome.storage.local.set({stats});return {saved:false}}if(s.historyIgnoreSensitiveFields&&item.sensitive){if(s.statsEnabled)await chrome.storage.local.set({stats});return {saved:false}}
    const savedHtml=s.historySaveRichText&&typeof item.html==="string"?item.html.slice(0,200000):"",html=s.historySaveImages?savedHtml:savedHtml.replace(/<img\b[^>]*>/gi,""),rawText=rawCapture,now=Date.now(),matchIndex=data.history.findIndex(x=>String(x.originalText??x.text??"")===String(item.text||"")&&String(x.html||"")===html);let entry,history;
    if(matchIndex>=0){const old=data.history[matchIndex];entry={...old,text:old.originalText!==undefined?old.text:item.text,rawText,html,url:saveSource?(item.url||""):"",title:saveSource?(item.title||""):"",copyMode:item.copyMode||old.copyMode||"plain",ts:now,lastTs:now,firstTs:old.firstTs||old.ts||now,repeatCount:(Number(old.repeatCount)||1)+1,tags:[...(old.tags||[])],suggestedTags:[...(old.suggestedTags||[])],collectionIds:[...(old.collectionIds||[])]};history=[entry,...data.history.filter((_,i)=>i!==matchIndex)];if(s.statsEnabled)stats={...stats,repeatCopies:(stats.repeatCopies||0)+1}}
    else{entry={id:crypto.randomUUID(),text:item.text,rawText,html,url:saveSource?(item.url||""):"",title:saveSource?(item.title||""):"",copyMode:item.copyMode||"plain",ts:now,firstTs:now,lastTs:now,repeatCount:1,tags:[],suggestedTags:[],collectionIds:[]};history=[entry,...data.history]}
    if(item.autoCollectionId)entry.collectionIds=mergeUnique(entry.collectionIds,[item.autoCollectionId]);const org=organizeEntry(entry,s,learner,item.preAnalysis||null);entry=org.entry;history[0]=entry;history=applyHistoryRetention(history,s);
    let pinned=data.pinned.map(x=>x.id===entry.id?{...x,...entry}:x);if(org.shouldPin&&!pinned.some(x=>x.id===entry.id))pinned=[entry,...pinned];let pasteStack=data.pasteStack;if(org.shouldStack&&!pasteStack.some(x=>x.id===entry.id))pasteStack=[...pasteStack,stackEntry(entry)].slice(0,100);
    const lastWordWatchMatch=org.evaluation.matches?.length?{ts:now,clipId:entry.id,names:org.evaluation.matches.map(m=>m.collection.name),feedback:org.evaluation.feedback||null}:null;await chrome.storage.local.set({history,pinned,pasteStack,stats,...(lastWordWatchMatch?{lastWordWatchMatch}:{})});return {saved:true,entryId:entry.id,organization:{matches:lastWordWatchMatch?.names||[],feedback:org.evaluation.feedback||null,autoTags:entry.tags||[],suggestedTags:entry.suggestedTags||[]}};
  });
}
function applyHistoryRetention(items,s){
  const maxCount=Math.max(1,Number(s.historyLimit)||50);
  let result=items.slice(0,maxCount);
  if(s.historyAutoDelete){
    const value=Math.max(1,Number(s.historyAutoDeleteValue)||30),ms=value*(s.historyAutoDeleteUnit==="hours"?3600000:86400000);
    result=result.filter(x=>Number(x.ts||0)>=Date.now()-ms);
  }
  const minimum=Math.min(Math.max(0,Number(s.historyMinimumKeep)||0),items.length,maxCount);
  if(result.length<minimum)result=items.slice(0,minimum);
  return result;
}
chrome.runtime.onMessage.addListener((req,sender,sendResponse)=>{
  // Offscreen messages must be handled exclusively by offscreen.js.
  // Do not claim their async response channel from the service worker.
  if(req.target==="offscreen") return false;
  (async()=>{
    if(req.action==="readClipboardText"){sendResponse(await readClipboardPlainText());return}
    if(req.action==="resolvePlainPasteText"){sendResponse(await resolvePlainPasteText(req.text));return}
    if(req.action==="preAnalyzeCapture"){
      const s=await getSettings(),localMeta=await chrome.storage.local.get({smartTagLearner:{}}),learner=s.smartTagLearningEnabled?(localMeta.smartTagLearner||{}):{};
      const entry={text:req.text||req.rawText||"",rawText:req.rawText||req.text||"",copyMode:req.copyMode||s.copyMode,url:req.url||"",title:req.title||"",tags:Array.isArray(req.tags)?req.tags:[],collectionIds:[]};
      sendResponse({ok:true,analysis:makePreAnalysis(entry,s,learner)});return;
    }
    if(req.action==="copy"){
      // Stability rule: preserve the proven v3.6.9 clipboard path. Smart organization is
      // allowed to fail independently and must never prevent or replace the clipboard write.
      const result=await writeClipboard(req.text,req.html);
      // Keep the raw selection paired with the exact formatted clipboard payload so
      // Ctrl+Shift+V can paste genuinely plain selected text instead of merely
      // stripping HTML from a metadata-wrapped text/plain payload.
      if(result?.ok)await rememberClipboardEnvelope(req.text,req.rawText??req.text);
      // Reply as soon as the clipboard confirms success. History and WordWatch persistence
      // continue afterward so UI feedback and the next CopySelect are never gated on storage.
      sendResponse(result);
      if(result?.ok){
        try{
          const saved=await addHistory({text:req.text,rawText:req.rawText,copyMode:req.copyMode,html:req.historyHtml||req.html,url:req.url,title:req.title,sensitive:!!req.sensitive,preAnalysis:req.preAnalysis||null});
          if(saved?.organization?.feedback&&sender.tab?.id)chrome.tabs.sendMessage(sender.tab.id,{action:"wordWatchFeedback",feedback:saved.organization.feedback}).catch(()=>{});
        }catch(e){console.warn("CopySelect history/organization save failed after clipboard success",e)}
      }
      return;
    }
    if(req.action==="copyAgain"){const result=await writeClipboard(req.text,req.html||null);if(result?.ok&&req.source==="history"){const s=await getSettings();if(s.statsEnabled)await mutateRuntime(async()=>{const data=await getRuntimeData(),stats={...data.stats,historyRecopies:(data.stats.historyRecopies||0)+1};await chrome.storage.local.set({stats})})}sendResponse(result);return}
    if(req.action==="saveManualChromeCopy"){await addHistory({text:req.text,rawText:req.rawText,copyMode:req.copyMode||"manual",html:req.html||"",url:req.url,title:req.title,sensitive:!!req.sensitive,historyEnabled:req.historyEnabled,historyCaptureSourceDetails:req.historyCaptureSourceDetails,autoCollectionId:req.autoCollectionId});sendResponse({ok:true});return}
    if(req.action==="getActiveTab"){const [tab]=await chrome.tabs.query({active:true,currentWindow:true});sendResponse({url:tab?.url||"",title:tab?.title||"",id:tab?.id});return}
    if(req.action==="reconnectTab"){sendResponse(await reconnectTab(req.tabId));return}
    if(req.action==="setSiteRule"){
      const s=await getSettings(),host=new URL(req.url).hostname;
      s.siteRules=s.siteRules.filter(r=>r.pattern!==host);
      if(req.behavior!=="inherit")s.siteRules.unshift({pattern:host,type:"auto",behavior:req.behavior,enabled:true});
      await chrome.storage.sync.set({siteRules:s.siteRules});sendResponse({ok:true});return;
    }
    if(req.action==="pin"){
      const result=await mutateRuntime(async()=>{
        const data=await getRuntimeData(),raw=req.item&&typeof req.item==="object"?req.item:{};
        const id=typeof raw.id==="string"&&raw.id.trim()?raw.id.trim():crypto.randomUUID();
        const item={...raw,id},exists=data.pinned.some(x=>x.id===id);
        const pinned=exists?data.pinned:[item,...data.pinned];
        if(!exists)await chrome.storage.local.set({pinned});
        return {ok:true,pinned};
      });sendResponse(result);return;
    }
    if(req.action==="unpin"){
      const result=await mutateRuntime(async()=>{const data=await getRuntimeData();const id=String(req.id||"").trim();const pinned=id?data.pinned.filter(x=>x.id!==id):data.pinned.filter(x=>x.text!==req.text);await chrome.storage.local.set({pinned});return {ok:true,pinned}});sendResponse(result);return;
    }
    if(req.action==="clearHistory"){await mutateRuntime(()=>chrome.storage.local.set({history:[]}));sendResponse({ok:true});return}
    if(req.action==="deleteHistory"){
      const id=String(req.id||"").trim();if(!id){sendResponse({ok:false,error:"Invalid history entry ID"});return}
      const result=await mutateRuntime(async()=>{const data=await getRuntimeData(),history=data.history.filter(x=>x.id!==id),pinned=data.pinned.filter(x=>x.id!==id),pasteStack=data.pasteStack.filter(x=>x.id!==id);await chrome.storage.local.set({history,pinned,pasteStack});return {ok:true,history,pinned,pasteStack}});sendResponse(result);return;
    }
    if(req.action==="pruneHistory"){const result=await mutateRuntime(async()=>{const s=await getSettings(),data=await getRuntimeData(),history=applyHistoryRetention(data.history,s),pinned=data.pinned;await chrome.storage.local.set({history,pinned});return {ok:true,history,pinned}});sendResponse(result);return}
    if(req.action==="addPasteStack"){const result=await mutateRuntime(async()=>{const data=await getRuntimeData(),incoming=Array.isArray(req.items)?req.items:[],pasteStack=[...data.pasteStack,...incoming.map(stackEntry)].slice(-100);await chrome.storage.local.set({pasteStack});return {ok:true,pasteStack}});sendResponse(result);return}
    if(req.action==="peekPasteStack"){const data=await stableRuntimeData();sendResponse({ok:true,item:data.pasteStack[0]||null,pasteStack:data.pasteStack});return}
    if(req.action==="consumePasteStack"){const id=String(req.id||"").trim();if(!id){sendResponse({ok:false,error:"Invalid Paste Stack item ID"});return}const result=await mutateRuntime(async()=>{const data=await getRuntimeData(),first=data.pasteStack[0];if(!first||first.id!==id)return {ok:false,error:"Paste Stack changed before the item could be consumed",pasteStack:data.pasteStack};const pasteStack=data.pasteStack.slice(1),s=await getSettings();if(s.statsEnabled){const stats={...data.stats,pasteStackUses:(data.stats.pasteStackUses||0)+1};await chrome.storage.local.set({pasteStack,stats})}else await chrome.storage.local.set({pasteStack});return {ok:true,item:first,pasteStack}});sendResponse(result);return}
    if(req.action==="copyNextPasteStack"||req.action==="nextPasteStack"){const result=await mutateRuntime(async()=>{const data=await getRuntimeData();if(!data.pasteStack.length)return {ok:true,item:null,pasteStack:[]};const item=data.pasteStack[0],copyResult=await writeClipboard(item.text,null);if(!copyResult?.ok)return {...copyResult,item:null,pasteStack:data.pasteStack};const pasteStack=data.pasteStack.slice(1),s=await getSettings();if(s.statsEnabled){const stats={...data.stats,pasteStackUses:(data.stats.pasteStackUses||0)+1};await chrome.storage.local.set({pasteStack,stats})}else await chrome.storage.local.set({pasteStack});return {ok:true,item,pasteStack}});sendResponse(result);return}
    if(req.action==="clearPasteStack"){await mutateRuntime(()=>chrome.storage.local.set({pasteStack:[]}));sendResponse({ok:true,pasteStack:[]});return}
    if(req.action==="editClip"){
      const result=await mutateRuntime(async()=>{
        const data=await getRuntimeData();let found=false;
        const update=item=>{if(item.id!==req.id)return item;found=true;return {...item,originalText:String(item.originalText??item.text??""),text:String(req.text??item.text??""),label:String(req.label||"").slice(0,100),note:String(req.note||"")}};
        const history=data.history.map(update),pinned=data.pinned.map(update);
        if(!found)return {ok:false,error:"This clip is no longer saved."};
        await chrome.storage.local.set({history,pinned});return {ok:true,history,pinned};
      });sendResponse(result);return;
    }
    if(req.action==="updateClipOrganization"){
      const result=await mutateRuntime(async()=>{const data=await getRuntimeData(),s=await getSettings(),{smartTagLearner={}}=await chrome.storage.local.get({smartTagLearner:{}}),id=String(req.id||"");if(!id)return {ok:false,error:"Invalid clip ID"};let found=false;const update=item=>{if(item.id!==id)return item;found=true;let tags=mergeUnique(item.tags,req.addTags||[]),collectionIds=mergeUnique(item.collectionIds,req.addCollections||[]),suggestedTags=[...(item.suggestedTags||[])];if(req.removeTags?.length){const rm=new Set(req.removeTags.map(x=>String(x).toLowerCase()));tags=tags.filter(x=>!rm.has(String(x).toLowerCase()))}if(req.removeCollections?.length){const rm=new Set(req.removeCollections.map(String));collectionIds=collectionIds.filter(x=>!rm.has(String(x)))}const explicitRm=new Set((req.removeSuggestions||[]).map(x=>String(x).toLowerCase())),confirmedNow=new Set((req.addTags||[]).map(x=>String(x).toLowerCase()));if(explicitRm.size||confirmedNow.size)suggestedTags=suggestedTags.filter(x=>!explicitRm.has(String(x.tag).toLowerCase())&&!confirmedNow.has(String(x.tag).toLowerCase()));if(s.smartTagSuggestionMode!=="off")suggestedTags=CopySelectSmartCore?.suggestTags?.(String(item.rawText??item.text??""),{max:5,learner:smartTagLearner,existing:tags})||[];else suggestedTags=[];const keepTag=String(req.keepAsSuggestion||"").trim();if(keepTag&&!tags.some(x=>String(x).toLowerCase()===keepTag.toLowerCase())&&!suggestedTags.some(x=>String(x.tag).toLowerCase()===keepTag.toLowerCase()))suggestedTags=[{tag:keepTag,confidence:1,source:"manual-toggle",reason:"Not saved"},...suggestedTags].slice(0,5);return {...item,tags,suggestedTags,collectionIds,revision:(Number(item.revision)||0)+1}};const history=data.history.map(update),pinned=data.pinned.map(update);if(!found)return {ok:false,error:"Clip no longer exists"};await chrome.storage.local.set({history,pinned});return {ok:true,history,pinned}});sendResponse(result);return;
    }
    if(req.action==="renameTag"){
      const oldTag=String(req.oldTag||"").trim(),newTag=String(req.newTag||"").trim();if(!oldTag||!newTag){sendResponse({ok:false,error:"Both tag names are required"});return}const result=await mutateRuntime(async()=>{const data=await getRuntimeData(),s=await getSettings(),{smartTagLearner={}}=await chrome.storage.local.get({smartTagLearner:{}}),rewrite=item=>{const tags=mergeUnique((item.tags||[]).filter(x=>String(x).toLowerCase()!==oldTag.toLowerCase()),(item.tags||[]).some(x=>String(x).toLowerCase()===oldTag.toLowerCase())?[newTag]:[]),suggestedTags=s.smartTagSuggestionMode==="off"?[]:(CopySelectSmartCore?.suggestTags?.(String(item.rawText??item.text??""),{max:5,learner:smartTagLearner,existing:tags})||[]);return {...item,tags,suggestedTags,revision:(Number(item.revision)||0)+1}},history=data.history.map(rewrite),pinned=data.pinned.map(rewrite);await chrome.storage.local.set({history,pinned});return {ok:true,history,pinned}});sendResponse(result);return;
    }
    if(req.action==="recomputeOrganization"){
      const result=await mutateRuntime(async()=>{const s=await getSettings(),data=await getRuntimeData(),{smartTagLearner={}}=await chrome.storage.local.get({smartTagLearner:{}});let refreshed=0;const refresh=item=>{if(s.smartTagSuggestionMode==="off")return {...item,suggestedTags:[]};const suggested=CopySelectSmartCore?.suggestTags?.(String(item.rawText??item.text??""),{max:5,learner:smartTagLearner,existing:item.tags||[]})||[];refreshed++;return {...item,suggestedTags:suggested}};const history=data.history.map(refresh),pinned=data.pinned.map(refresh);await chrome.storage.local.set({history,pinned});return {ok:true,history,pinned,refreshed}});sendResponse(result);return;
    }
    if(req.action==="reapplyWordWatch"){
      const result=await mutateRuntime(async()=>{const s=await getSettings(),data=await getRuntimeData(),c=(s.historyCollections||[]).find(x=>x.id===req.collectionId);if(!c)return {ok:false,error:"Collection not found"};const w=CopySelectSmartCore?.normalizeWordWatch?.(c);if(!w)return {ok:false,error:"WordWatch is not enabled for this Collection"};let matched=0,pasteStack=[...data.pasteStack],pinned=[...data.pinned];const rewrite=item=>{const ev=CopySelectSmartCore.collectionMatch(item,c);if(!ev.matched)return item;matched++;let next={...item,collectionIds:w.actions.addToCollection?mergeUnique(item.collectionIds,[c.id]):item.collectionIds,tags:mergeUnique(item.tags,w.actions.addTags)};if(w.actions.pin&&!pinned.some(x=>x.id===next.id))pinned.unshift(next);if(w.actions.pasteStack&&!pasteStack.some(x=>x.id===next.id))pasteStack.push(stackEntry(next));return next};const history=data.history.map(rewrite);pinned=pinned.map(x=>history.find(h=>h.id===x.id)||x);pasteStack=pasteStack.slice(0,100);await chrome.storage.local.set({history,pinned,pasteStack});return {ok:true,history,pinned,pasteStack,matched}});sendResponse(result);return;
    }
    if(req.action==="runtimeData"){
      const data=await stableRuntimeData(),s=await getSettings(),meta=await chrome.storage.local.get({lastWordWatchMatch:null});data.lastWordWatchMatch=meta.lastWordWatchMatch;
      if(!String(sender?.url||"").startsWith(chrome.runtime.getURL("options.html"))){
        const lockedCollections=(s.historyCollections||[]).filter(c=>c.locked),privateIds=new Set(lockedCollections.map(c=>c.id)),privateNames=new Set(lockedCollections.map(c=>String(c.name||"")));
        const hidden=new Set([...data.history,...data.pinned,...data.pasteStack].filter(h=>(h.collectionIds||[]).some(id=>privateIds.has(id))).map(h=>h.id));
        data.history=data.history.filter(h=>!hidden.has(h.id));data.pinned=data.pinned.filter(h=>!hidden.has(h.id));data.pasteStack=data.pasteStack.filter(h=>!hidden.has(h.id));
        if(hidden.has(data.lastWordWatchMatch?.clipId)||(data.lastWordWatchMatch?.names||[]).some(name=>privateNames.has(String(name))))data.lastWordWatchMatch=null;
      }
      sendResponse(data);return;
    }
  })().catch(e=>sendResponse({ok:false,error:e.message}));
  return true;
});
chrome.contextMenus.onClicked.addListener(async(info,tab)=>{
  if(info.menuItemId==="cs-toggle-site"&&tab?.url){
    const s=await getSettings(),dec=getSiteDecision(tab.url,s),host=new URL(tab.url).hostname;
    s.siteRules=s.siteRules.filter(r=>r.pattern!==host);
    s.siteRules.unshift({pattern:host,type:"auto",behavior:dec.enabled?"disable":"enable",enabled:true});
    await chrome.storage.sync.set({siteRules:s.siteRules});
  }
  if(info.menuItemId==="cs-copy-source"&&info.selectionText){
    const text=`“${info.selectionText}”\n— ${tab.title}\n${tab.url}`;
    const result=await writeClipboard(text,null);if(result?.ok)await addHistory({text,rawText:info.selectionText,copyMode:"quote-source",url:tab.url,title:tab.title});
  }
});
