(()=>{
let contentVersion="";try{contentVersion=globalThis.chrome?.runtime?.getManifest?.().version||"unknown"}catch{contentVersion="invalid"}
if(contentVersion!=="invalid"&&globalThis.__copySelectContentVersion===contentVersion)return;
globalThis.__copySelectContentVersion=contentVersion;
let CS_SETTINGS=null,pendingTimer=null,lastCopied={text:"",ts:0},captureSequence=0,lastAutoCapture={stage:"waiting",reason:"No selection seen yet",ts:0};
let lastPlainPasteEnvelope=null,plainPasteChordUntil=0,ctrlHeld=false,shiftHeld=false;
let feedbackEl=null,feedbackTimer=null,effectTimer=null,effectEls=[];

function extensionRuntime(){
  const rt=globalThis.chrome?.runtime;
  return rt?.id&&typeof rt.sendMessage==="function"?rt:null;
}
async function safeSendMessage(message){
  const rt=extensionRuntime();
  if(!rt)return {ok:false,error:"CopySelect was updated. Refresh this tab to reconnect.",contextInvalidated:true};
  try{
    const res=await rt.sendMessage(message);
    return res??{ok:false,error:"No response from CopySelect background service."};
  }catch(err){
    const msg=String(err?.message||err||"Message failed");
    return {ok:false,error:msg,contextInvalidated:/context invalidated|receiving end does not exist|message port closed/i.test(msg)};
  }
}
function localClipboardFallback(text,html){
  const holder=document.createElement("div"),selection=window.getSelection(),saved=[];
  try{
    for(let i=0;i<(selection?.rangeCount||0);i++)saved.push(selection.getRangeAt(i).cloneRange());
    holder.contentEditable="true";
    holder.setAttribute("aria-hidden","true");
    holder.style.cssText="position:fixed;left:-10000px;top:-10000px;opacity:0;pointer-events:none;";
    if(html)holder.innerHTML=html;else holder.textContent=String(text??"");
    document.documentElement.appendChild(holder);
    const range=document.createRange();range.selectNodeContents(holder);selection?.removeAllRanges();selection?.addRange(range);
    const onCopy=event=>{event.preventDefault();event.clipboardData?.setData("text/plain",String(text??""));if(html)event.clipboardData?.setData("text/html",html)};
    document.addEventListener("copy",onCopy,{once:true,capture:true});
    const ok=document.execCommand("copy");
    if(!ok)document.removeEventListener("copy",onCopy,true);
    return !!ok;
  }catch{return false}
  finally{
    holder.remove();selection?.removeAllRanges();saved.forEach(range=>{try{selection?.addRange(range)}catch{}});
  }
}
async function loadSettings(){
  try{
    const sync=globalThis.chrome?.storage?.sync;
    if(!sync)return;
    CS_SETTINGS=normalizeSettings(await sync.get(null));
  }catch{}
}
loadSettings();
try{
  globalThis.chrome?.storage?.onChanged?.addListener((changes,area)=>{
    if(area==="sync")void loadSettings();
  });
}catch{}

function modifierHeld(e,s){
  const map={CTRL:e.ctrlKey,ALT:e.altKey,SHIFT:e.shiftKey,CAPS:e.getModifierState?.("CapsLock"),"CTRL+ALT":e.ctrlKey&&e.altKey};
  return !!map[s.modifierKey];
}
function eligibleTarget(target,s){
  if(!target)return true;
  const tag=(target.tagName||"").toLowerCase();
  if(["input","textarea"].includes(tag)&&!s.enableTextBoxes)return false;
  if(target.closest?.("[contenteditable=true]")&&!s.enableContentEditable)return false;
  return true;
}
function selectionKindFromText(text){
  const t=String(text||"").trim();
  if(!t)return "none";
  return /\s/.test(t)?"range":"word";
}
function selectionKind(){
  const sel=window.getSelection();
  if(!sel||sel.rangeCount===0||sel.getRangeAt(0).collapsed)return "none";
  return selectionKindFromText(sel.toString());
}
function selectedControlText(target){
  if(!["INPUT","TEXTAREA"].includes(target?.tagName))return "";
  const start=Number(target.selectionStart),end=Number(target.selectionEnd);
  if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)return "";
  return String(target.value||"").slice(start,end);
}
function triggerAllowed(kind,s){
  return s.selectionTrigger==="any"||(s.selectionTrigger==="word"&&(kind==="word"||kind==="paragraph"))||(s.selectionTrigger==="range"&&kind==="range");
}
function selectionHtml(){
  const sel=window.getSelection();
  if(!sel||!sel.rangeCount)return "";
  const wrap=document.createElement("div");
  const props=["color","background-color","font-family","font-size","font-weight","font-style","text-decoration-line","text-align","line-height","white-space","list-style-type"];
  for(let i=0;i<sel.rangeCount;i++){
    const range=sel.getRangeAt(i),fragment=range.cloneContents(),root=range.commonAncestorContainer.nodeType===1?range.commonAncestorContainer:range.commonAncestorContainer.parentElement;
    const sources=[...(root?.querySelectorAll?.("*")||[])].filter(el=>{try{return range.intersectsNode(el)}catch{return false}}),clones=[...fragment.querySelectorAll("*")];
    let cursor=0;clones.forEach(clone=>{const at=sources.slice(cursor).findIndex(src=>src.tagName===clone.tagName);if(at<0)return;const src=sources[cursor+at];cursor+=at+1;const cs=getComputedStyle(src),style=props.map(p=>`${p}:${cs.getPropertyValue(p)}`).join(";");clone.setAttribute("style",style)});
    wrap.appendChild(fragment);
  }
  return wrap.innerHTML;
}
function selectionSnapshot(event,textOverride,gestureKind){
  const sel=window.getSelection(),rects=[];
  if(sel?.rangeCount){
    for(let i=0;i<sel.rangeCount;i++){
      const rs=[...sel.getRangeAt(i).getClientRects()];
      for(const r of rs){
        if(r.width>0&&r.height>0)rects.push({left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height});
      }
    }
  }
  if(!rects.length){
    const x=event?.clientX??innerWidth/2,y=event?.clientY??innerHeight/2;
    rects.push({left:x-1,right:x+1,top:y-8,bottom:y+8,width:2,height:16});
  }
  const anchor=sel?.anchorNode,text=textOverride==null?String(sel?.toString()||""):String(textOverride);
  return {
    rects,eventX:event?.clientX??innerWidth/2,eventY:event?.clientY??innerHeight/2,text,
    kind:gestureKind||(textOverride==null?selectionKind():selectionKindFromText(text)),html:["INPUT","TEXTAREA"].includes(event?.target?.tagName)?"":selectionHtml(),linkUrl:getLinkContext(anchor)
  };
}
function getLinkContext(node){
  const el=node?.nodeType===1?node:node?.parentElement;
  return el?.closest?.("a[href]")?.href||"";
}
function symbolFor(name){
  if(name==="custom")return String(CS_SETTINGS?.feedbackCustomSymbol||"✨").trim().slice(0,4)||"✨";
  return {check:"✓",clipboard:"▣",sparkle:"✦",dot:"●",copy:"⧉",star:"★",plus:"+",
    lightning:"⚡",circle:"◉",slash:"／",halo:"◌",arrow:"➜",heart:"♥",diamond:"◆",
    bracket:"[ ]",tick:"✔",burst:"✧",square:"■",bookmark:"◆",ring:"◎"}[name]||"✓";
}
function posStyles(pos){
  const gap="18px",o={top:"auto",right:"auto",bottom:"auto",left:"auto",transform:"none"};
  const [v,h]=String(pos||"bottom-right").split("-");
  if(v==="top")o.top=gap; else if(v==="center")o.top="50%"; else o.bottom=gap;
  if(h==="left")o.left=gap; else if(h==="center")o.left="50%"; else o.right=gap;
  const tx=h==="center"?"-50%":"0",ty=v==="center"?"-50%":"0";
  o.transform=`translate(${tx},${ty})`;
  return o;
}
function clearFeedback(){
  clearTimeout(feedbackTimer);
  if(feedbackEl){feedbackEl.remove();feedbackEl=null}
}
function clearSelectionEffect(){
  clearTimeout(effectTimer);
  effectEls.forEach(n=>{try{n.remove()}catch{}});
  effectEls=[];
  const st=document.getElementById("__copyselect_selection_style");
  if(st)st.remove();
}
function appendEffect(n){
  n.setAttribute("aria-hidden","true");
  effectEls.push(n);
  document.documentElement.appendChild(n);
  return n;
}
function colorWithAlpha(hex,alpha){
  const m=/^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(String(hex||""));
  return m?`rgba(${parseInt(m[1],16)},${parseInt(m[2],16)},${parseInt(m[3],16)},${Math.max(0,Math.min(1,alpha))})`:hex;
}
function effectAnchor(snapshot){
  const rects=snapshot?.rects||[],last=rects[rects.length-1];
  return last?{x:last.right+5,y:last.top+last.height/2}:{x:snapshot?.eventX??innerWidth/2,y:snapshot?.eventY??innerHeight/2};
}
function baseEffectNode(x,y,s,sizeMult=2.15){
  const n=document.createElement("div"),size=Math.max(10,s.cursorEffectSize||22),box=size*sizeMult,margin=Math.max(12,box/2+3);
  Object.assign(n.style,{
    position:"fixed",left:`${Math.min(innerWidth-margin,Math.max(margin,x))}px`,top:`${Math.min(innerHeight-margin,Math.max(margin,y))}px`,
    width:`${size*sizeMult}px`,height:`${size*sizeMult}px`,zIndex:"2147483647",pointerEvents:"none",
    transform:"translate(-50%,-50%)",color:s.cursorEffectColor||"#4f7cff",
    font:`800 ${size}px system-ui,-apple-system,"Segoe UI",sans-serif`,display:"grid",placeItems:"center",
    opacity:String((s.cursorEffectOpacity??70)/100),textShadow:"0 1px 2px #fff,0 0 4px rgba(0,0,0,.62)"
  });
  return n;
}
function selectionFlash(snapshot,s){
  const color=s.cursorEffectColor||"#4f7cff",opacity=(s.cursorEffectOpacity??68)/100,dur=Math.max(120,s.cursorFeedbackDuration||280);
  // Where the native selection still exists, change the actual selection colors too.
  const style=document.createElement("style");
  style.id="__copyselect_selection_style";
  style.textContent=`*::selection{background:${colorWithAlpha(color,opacity)}!important;color:${s.selectionFlashTextColor||"#fff"}!important}`;
  document.documentElement.appendChild(style);
  effectEls.push(style);

  // Rect overlays keep the feedback visible even on sites that collapse selection on mouseup.
  for(const r of snapshot.rects||[]){
    const n=document.createElement("div");
    Object.assign(n.style,{
      position:"fixed",left:`${r.left}px`,top:`${r.top}px`,width:`${Math.max(1,r.width)}px`,height:`${Math.max(1,r.height)}px`,
      borderRadius:"2px",background:color,opacity:String(opacity),zIndex:"2147483646",
      pointerEvents:"none",mixBlendMode:"multiply",transition:`opacity ${Math.min(180,dur/2)}ms ease`
    });
    appendEffect(n);
    requestAnimationFrame(()=>{n.style.opacity=String(Math.max(.08,opacity*.24))});
  }
}
function selectionBrackets(snapshot,s){
  const rects=snapshot.rects||[],first=rects[0],last=rects[rects.length-1];
  if(!first||!last)return;
  const size=Math.max(14,s.cursorEffectSize||20),color=s.cursorEffectColor||"#2563eb";
  const specs=[
    // Overlay the edge characters instead of adding space around the selection.
    {txt:"[",x:first.left+Math.min(4,first.width*.22),y:first.top+first.height/2,tx:"-50%"},
    {txt:"]",x:last.right-Math.min(4,last.width*.22),y:last.top+last.height/2,tx:"-50%"}
  ];
  specs.forEach(sp=>{
    const n=document.createElement("div");
    n.textContent=sp.txt;
    const safeX=Math.max(size*.35,Math.min(innerWidth-size*.35,sp.x));
    const safeY=Math.max(size/2+3,Math.min(innerHeight-size/2-3,sp.y));
    Object.assign(n.style,{
      position:"fixed",left:`${safeX}px`,top:`${safeY}px`,
      transform:`translate(${sp.tx},-50%)`,zIndex:"2147483647",pointerEvents:"none",
      color,font:`800 ${size}px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace`,
      opacity:String((s.cursorEffectOpacity??94)/100),textShadow:"0 1px 2px #fff,0 0 4px rgba(0,0,0,.7)",
      transition:"opacity .16s ease,transform .18s ease"
    });
    appendEffect(n);
    requestAnimationFrame(()=>{n.style.transform=`translate(${sp.tx},-50%) scale(1.08)`});
  });
}
function showSelectionEffect(s,snapshot){
  if(!s.cursorFeedbackEnabled||["none","sound"].includes(s.notificationMode)||s.cursorEffect==="none")return;
  clearSelectionEffect();
  const effect=s.cursorEffect||"selection-flash",dur=Math.max(100,s.cursorFeedbackDuration||280),color=s.cursorEffectColor||"#4f7cff";
  const reduced=globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if(effect==="selection-flash")selectionFlash(snapshot,s);
  else if(effect==="selection-brackets")selectionBrackets(snapshot,s);
  else{
    const a=effectAnchor(snapshot),n=baseEffectNode(a.x,a.y,s),ring=`0 0 0 2px ${color}55,0 0 0 7px ${color}25`;
    if(effect==="soft-halo"){
      n.style.borderRadius="50%";n.style.background=`radial-gradient(circle,${color}66 0,${color}28 42%,transparent 72%)`;n.style.filter="blur(.3px)";
    }else if(effect==="pulse-ring"){
      n.style.border=`2px solid ${color}`;n.style.borderRadius="50%";n.style.boxShadow=ring;
    }else if(effect==="ripple-check"){
      n.innerHTML=`<span style="width:1.65em;height:1.65em;border-radius:50%;border:2px solid ${color};display:grid;place-items:center;color:${color};box-shadow:${ring};background:#fff">✓</span>`;
    }else if(effect==="spark")n.textContent="✦";
    else if(effect==="copy-badge")n.textContent="⧉";
    else if(effect==="dot-pulse")n.innerHTML=`<span style="width:.62em;height:.62em;border-radius:50%;background:${color};box-shadow:0 0 .8em ${color}"></span>`;
    else if(effect==="mini-clipboard")n.textContent="▣";
    else if(effect==="glow-trail"){
      n.style.borderRadius="50%";n.style.background=`linear-gradient(90deg,${color}aa,${color}44,transparent)`;n.style.filter="blur(3px)";n.style.transform="translate(-75%,-50%) scaleX(1.8)";
    }else if(effect==="underline-sweep"){
      n.remove();
      for(const r of snapshot.rects||[]){const line=document.createElement("div");Object.assign(line.style,{position:"fixed",left:`${r.left}px`,top:`${r.bottom+2}px`,width:`${Math.max(2,r.width)}px`,height:`${Math.max(1,s.cursorEffectThickness||3)}px`,background:color,borderRadius:"3px",transform:"scaleX(.15)",transformOrigin:"left center",opacity:String((s.cursorEffectOpacity??85)/100),zIndex:"2147483647",pointerEvents:"none",transition:`transform ${Math.min(220,dur/2)}ms ease,opacity ${Math.min(240,dur/2)}ms ease`});appendEffect(line);requestAnimationFrame(()=>line.style.transform="scaleX(1)")}
      effectTimer=setTimeout(()=>{effectEls.forEach(el=>{if(el instanceof HTMLElement)el.style.opacity="0"});setTimeout(clearSelectionEffect,190)},dur);return;
    }else n.textContent=symbolFor(s.feedbackSymbol);
    n.style.transition=`transform ${Math.min(220,dur/2)}ms ease,opacity ${Math.min(240,dur/2)}ms ease,filter ${Math.min(240,dur/2)}ms ease`;
    appendEffect(n);
    if(!reduced)requestAnimationFrame(()=>{
      if(effect==="pulse-ring"||effect==="ripple-check")n.style.transform="translate(-50%,-50%) scale(1.35)";
      else if(effect==="spark")n.style.transform="translate(-50%,-50%) rotate(20deg) scale(1.22)";
      else if(effect==="underline-sweep")n.style.transform="scaleX(1)";
    });
  }
  effectTimer=setTimeout(()=>{
    effectEls.forEach(n=>{if(n instanceof HTMLElement)n.style.opacity="0"});
    setTimeout(clearSelectionEffect,190);
  },dur);
}
function announceVisualCopy(message="Copied",assertive=false){
  const n=document.createElement("div");n.setAttribute("role",assertive?"alert":"status");n.setAttribute("aria-live",assertive?"assertive":"polite");n.setAttribute("aria-atomic","true");n.textContent="";Object.assign(n.style,{position:"fixed",width:"1px",height:"1px",padding:"0",margin:"-1px",overflow:"hidden",clip:"rect(0,0,0,0)",whiteSpace:"nowrap",border:"0"});document.documentElement.appendChild(n);requestAnimationFrame(()=>{n.textContent=message});setTimeout(()=>n.remove(),1200);
}
function showScreenFeedback(s){
  if(!s.screenFeedbackEnabled||["none","sound"].includes(s.notificationMode))return;
  clearFeedback();
  const n=document.createElement("div");feedbackEl=n;n.setAttribute("aria-hidden","true");
  const icon=symbolFor(s.feedbackSymbol);
  if(s.feedbackStyle==="icon")n.textContent=icon;
  else{
    const ic=document.createElement("span");ic.textContent=icon;Object.assign(ic.style,{fontWeight:"800",fontStyle:"normal",textDecoration:"none"});
    const tx=document.createElement("span");tx.textContent=s.feedbackText||"Copied";Object.assign(tx.style,{fontWeight:s.notificationFontStyle==="bold"||s.notificationFontStyle==="bold-italic"?"800":"650",fontStyle:s.notificationFontStyle==="italic"||s.notificationFontStyle==="bold-italic"?"italic":"normal",textDecoration:s.notificationFontStyle==="underline"?"underline":"none"});
    n.append(ic,tx);
  }
  const ps=posStyles(s.notificationPosition),size=Math.max(10,s.feedbackSize||15);
  Object.assign(n.style,{
    position:"fixed",display:"flex",alignItems:"center",gap:`${Math.max(4,size*.35)}px`,
    padding:s.feedbackStyle==="icon"?`${Math.max(5,size*.35)}px`:`${Math.max(5,size*.3)}px ${Math.max(8,size*.48)}px`,
    maxWidth:`${s.notificationBoxSize}px`,background:s.notificationColor,color:s.notificationTextColor,
    opacity:String(s.notificationTransparency/100),font:`650 ${size}px ${s.notificationFontFamily||"system-ui,-apple-system,Segoe UI,sans-serif"}`,
    textDecoration:"none",
    borderRadius:s.notificationPreset==="square"?"7px":"999px",boxShadow:"0 6px 18px rgba(0,0,0,.16)",
    zIndex:"2147483647",pointerEvents:"none",transition:"opacity .18s ease",...ps
  });
  document.documentElement.appendChild(n);
  feedbackTimer=setTimeout(()=>{n.style.opacity="0";setTimeout(()=>n.remove(),180)},s.notificationDuration);
}
function showVisualFeedback(s,snapshot){
  showScreenFeedback(s);
  showSelectionEffect(s,snapshot);
  if((s.screenFeedbackEnabled||s.cursorFeedbackEnabled)&&!["none","sound"].includes(s.notificationMode))announceVisualCopy(s.feedbackText||"Copied");
}
function showCopyError(snapshot,message){
  clearFeedback();clearSelectionEffect();
  const a=effectAnchor(snapshot||{}),n=document.createElement("div");feedbackEl=n;
  n.textContent=/refresh this tab/i.test(message||"")?"Refresh tab to reconnect":"Copy failed";n.setAttribute("role","alert");n.setAttribute("aria-live","assertive");n.setAttribute("aria-atomic","true");
  Object.assign(n.style,{
    position:"fixed",left:`${Math.min(innerWidth-90,Math.max(90,a.x))}px`,top:`${Math.min(innerHeight-35,Math.max(35,a.y))}px`,
    transform:"translate(-50%,-50%)",padding:"6px 9px",borderRadius:"999px",background:"#b42318",color:"#fff",
    font:"650 12px system-ui,-apple-system,sans-serif",boxShadow:"0 5px 16px rgba(0,0,0,.18)",
    zIndex:"2147483647",pointerEvents:"none"
  });
  document.documentElement.appendChild(n);
  feedbackTimer=setTimeout(()=>n.remove(),1400);
}
function playSound(s){
  if(!s.enableAudioNotification&&!["sound","visual-sound"].includes(s.notificationMode))return;
  const rt=extensionRuntime(); if(!rt)return;
  const file={"soft-beep":"soft-beep.wav","glass-chime":"glass-chime.wav","soft-tap":"soft-tap.wav",ding:"ding.wav",drop:"drop.wav",bell:"bell.wav"}[s.audioNotificationSound]||"soft-beep.wav";
  try{const a=new Audio(rt.getURL("sounds/"+file));a.volume=.5;a.play().catch(()=>{})}catch{}
}
async function performCopy(raw,e,snapshot){
  try{
    const base=CS_SETTINGS||normalizeSettings({});
    if(!base.enabled||base.pauseUntilRestart||(base.pausedUntil&&Date.now()<base.pausedUntil)){lastAutoCapture={stage:"blocked",reason:"CopySelect is disabled or paused",ts:Date.now()};return}
    const decision=getSiteDecision(location.href,base);if(!decision.enabled){lastAutoCapture={stage:"blocked",reason:"Disabled by this site's rule",ts:Date.now()};return}
    const s=normalizeSettings({...base,...decision.overrides});
    if(s.enableModifierKey){
      const held=modifierHeld(e,s);
      if((s.modifierKeyAction==="enable"&&!held)||(s.modifierKeyAction==="disable"&&held)){lastAutoCapture={stage:"blocked",reason:"Modifier-key rule did not allow the selection",ts:Date.now()};return}
    }
    if(!eligibleTarget(e.target,s)){lastAutoCapture={stage:"blocked",reason:"Selections in this field type are disabled",ts:Date.now()};return}
    const text=String(raw||"");if(s.ignoreWhitespaceOnly&&!text.trim()){lastAutoCapture={stage:"blocked",reason:"Whitespace-only selection",ts:Date.now()};return}
    if(text.trim().length<s.minSelectionLength){lastAutoCapture={stage:"blocked",reason:`Selection is shorter than ${s.minSelectionLength} characters`,ts:Date.now()};return}
    if(!triggerAllowed(snapshot?.kind||selectionKind(),s)){lastAutoCapture={stage:"blocked",reason:"Selection trigger does not match",ts:Date.now()};return}
    const now=Date.now();
    if(s.duplicateSuppression&&lastCopied.text===text&&now-lastCopied.ts<s.duplicateWindowSeconds*1000){lastAutoCapture={stage:"blocked",reason:"Duplicate suppressed",ts:Date.now()};return}
    const linkUrl=snapshot?.linkUrl||"";
    const out=formatCopy(text,{url:location.href,title:document.title,linkUrl,selectionHtml:snapshot?.html||selectionHtml()},s);
    const target=e?.target,descriptor=[target?.type,target?.name,target?.id,target?.autocomplete,target?.getAttribute?.("aria-label")].filter(Boolean).join(" ");
    const sensitive=target?.tagName==="INPUT"&&(/password|cc-|credit.?card|card.?number|cvv|cvc|security.?code/i.test(descriptor));
    let res=await safeSendMessage({action:"copy",text:out.text,rawText:text,copyMode:s.copyMode,html:out.html,historyHtml:snapshot?.html||out.html,url:location.href,title:document.title,sensitive,preAnalysis:snapshot?.preAnalysis||null});
    // Keep automatic CopySelect useful even if the optional worker/history path is
    // temporarily unavailable. This fallback never claims to have saved History.
    if(!res?.ok&&localClipboardFallback(out.text,out.html))res={ok:true,method:"page-fallback",historySaved:false};
    if(res?.ok){
      lastCopied={text,ts:now};
      lastPlainPasteEnvelope={formatted:String(out.text??""),raw:String(text??""),ts:Date.now()};
      lastAutoCapture={stage:"copied",reason:res.recovered?"Clipboard writer recovered and copied":"Copied successfully",ts:Date.now()};
      showVisualFeedback(s,snapshot);
      playSound(s);
    }else{
      lastAutoCapture={stage:"failed",reason:res?.error||"Clipboard write failed",ts:Date.now()};
      console.warn("CopySelect: clipboard write failed",res?.error||"Unknown error");
      showCopyError(snapshot,res?.error);
    }
  }catch(err){
    lastAutoCapture={stage:"failed",reason:String(err?.message||err),ts:Date.now()};
    console.warn("CopySelect: copy handler recovered from an error",err);
    showCopyError(snapshot,String(err?.message||err));
  }
}
let lastSelectionGesture="range";
const KEYBOARD_EDITABLE_GRACE_MS=1200;
let keyboardCapturePending=false,keyboardSelectionActive=false,shiftPointerSelection=false;
let pointerSelectionBaseline=null,lastPointerUpAt=0;
const KEYBOARD_SELECTION_KEYS=new Set(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End","PageUp","PageDown"]);
function editableSelectionTarget(target){return !!target&&(["INPUT","TEXTAREA"].includes(target.tagName)||!!target.isContentEditable||!!target.closest?.("[contenteditable=true]"))}
function currentSelectionState(target){
  const control=["INPUT","TEXTAREA"].includes(target?.tagName)?target:null;
  if(control){const start=control.selectionStart??0,end=control.selectionEnd??start;return {kind:"control",target:control,start,end,text:String(control.value||"").slice(start,end)}}
  const sel=window.getSelection?.();
  if(!sel||!sel.rangeCount)return {kind:"dom",anchorNode:null,focusNode:null,anchorOffset:0,focusOffset:0,text:""};
  return {kind:"dom",anchorNode:sel.anchorNode,focusNode:sel.focusNode,anchorOffset:sel.anchorOffset,focusOffset:sel.focusOffset,text:sel.toString()||""};
}
function sameSelectionState(a,b){
  if(!a||!b||a.kind!==b.kind)return false;
  if(a.kind==="control")return a.target===b.target&&a.start===b.start&&a.end===b.end&&a.text===b.text;
  return a.anchorNode===b.anchorNode&&a.focusNode===b.focusNode&&a.anchorOffset===b.anchorOffset&&a.focusOffset===b.focusOffset&&a.text===b.text;
}
function pointerSelectionActuallyChanged(target){
  const after=currentSelectionState(target),before=pointerSelectionBaseline;pointerSelectionBaseline=null;
  if(!String(after.text||"").trim())return false;
  return !before||!sameSelectionState(before,after);
}
function cancelPendingAutomaticCapture(reason="Selection changed before CopySelect copied it"){captureSequence++;clearTimeout(pendingTimer);pendingTimer=null;if(keyboardCapturePending)lastAutoCapture={stage:"cancelled",reason,ts:Date.now()};keyboardCapturePending=false}
function queueAutomaticSelection(e){
  const control=["INPUT","TEXTAREA"].includes(e.target?.tagName)?e.target:null;
  const txt=control?String(control.value||"").slice(control.selectionStart??0,control.selectionEnd??0):(window.getSelection()?.toString()||"");
  clearTimeout(pendingTimer);
  if(!txt){lastAutoCapture={stage:"waiting",reason:"Selection completion contained no text",ts:Date.now()};return}
  const sequence=++captureSequence,s=CS_SETTINGS||normalizeSettings({});let snap;
  const keyboard=e?.type==="keyup"&&e?.key==="Shift",editable=keyboard&&editableSelectionTarget(e.target);
  const gesture=keyboard?"range":lastSelectionGesture;
  try{snap=selectionSnapshot(e,txt,gesture)}catch{snap={rects:[],eventX:e?.clientX,eventY:e?.clientY,text:txt,kind:gesture,html:"",linkUrl:""}}
  // Start local organization work during the delay. The copy path never waits for it:
  // only a completed analysis with the same capture sequence is reused.
  void safeSendMessage({action:"preAnalyzeCapture",text:txt,rawText:txt,copyMode:s.copyMode,url:location.href,title:document.title}).then(result=>{if(sequence===captureSequence&&result?.ok&&result.analysis)snap.preAnalysis=result.analysis}).catch(()=>{});
  const currentSelectionText=()=>{const t=e?.target;if(["INPUT","TEXTAREA"].includes(t?.tagName))return String(t.value||"").slice(t.selectionStart??0,t.selectionEnd??0);return window.getSelection?.()?.toString()||""};
  const run=()=>{if(sequence!==captureSequence)return;keyboardCapturePending=false;if(keyboard&&currentSelectionText()!==txt){lastAutoCapture={stage:"cancelled",reason:"Keyboard selection changed before the grace period ended",ts:Date.now()};return}void performCopy(txt,e,snap)};
  const normalDelay=s.copyDelayEnabled?Math.max(0,Number(s.copyDelay)||0):0;
  const delay=editable?Math.max(KEYBOARD_EDITABLE_GRACE_MS,normalDelay):normalDelay;
  keyboardCapturePending=keyboard;
  lastAutoCapture={stage:"pending",reason:editable?`Keyboard selection grace period: ${delay} ms`:`Waiting ${delay} ms`,ts:Date.now()};
  if(delay>0)pendingTimer=setTimeout(run,delay);else run();
}
function completePointerSelection(e){
  if(!pointerSelectionActuallyChanged(e.target)){shiftPointerSelection=false;lastAutoCapture={stage:"ignored",reason:"Pointer gesture did not create or change the existing selection",ts:Date.now()};return}
  shiftPointerSelection=false;queueAutomaticSelection(e);
}
document.addEventListener("pointerup",e=>{lastPointerUpAt=performance.now();completePointerSelection(e)},true);
// Modern Chrome/Edge fire pointerup and mouseup for the same gesture. Keep mouseup only
// as a fallback for unusual pages/environments so a single gesture can never queue twice.
document.addEventListener("mouseup",e=>{if(performance.now()-lastPointerUpAt<250)return;completePointerSelection(e)},true);
document.addEventListener("keyup",e=>{if(e.key==="Shift"&&keyboardSelectionActive){keyboardSelectionActive=false;queueAutomaticSelection(e)}},true);
document.addEventListener("pointerdown",e=>{pointerSelectionBaseline=currentSelectionState(e.target);if(e.shiftKey){shiftPointerSelection=true;keyboardSelectionActive=false}cancelPendingAutomaticCapture("Pointer input started before the pending copy")},true);
document.addEventListener("mousedown",e=>{if(!pointerSelectionBaseline)pointerSelectionBaseline=currentSelectionState(e.target);if(e.shiftKey){shiftPointerSelection=true;keyboardSelectionActive=false}lastSelectionGesture=e.detail>=3?"paragraph":e.detail===2?"word":"range";cancelPendingAutomaticCapture("Mouse selection changed before the pending copy")},true);
document.addEventListener("beforeinput",e=>{if(keyboardCapturePending&&editableSelectionTarget(e.target))cancelPendingAutomaticCapture("Editing started before the keyboard-selection grace period ended")},true);
document.addEventListener("paste",()=>{if(keyboardCapturePending)cancelPendingAutomaticCapture("Paste started before the keyboard-selection grace period ended")},true);
document.addEventListener("cut",()=>{if(keyboardCapturePending)cancelPendingAutomaticCapture("Cut started before the keyboard-selection grace period ended")},true);
function plainPasteTarget(target){
  const direct=target instanceof Element?target:null,active=document.activeElement instanceof Element?document.activeElement:null;
  for(const el of [direct,active]){
    if(!el)continue;
    if(["INPUT","TEXTAREA"].includes(el.tagName))return el;
    if(el.isContentEditable)return el;
    const host=el.closest?.('[contenteditable="true"],[contenteditable=""],[contenteditable="plaintext-only"],[role="textbox"]');
    if(host)return host;
  }
  return null;
}
function comparableLocalClipboard(value){return String(value??"").replace(/\r\n?/g,"\n").replace(/\u0000/g,"").normalize("NFC")}
function localRawPlainPaste(current){
  const env=lastPlainPasteEnvelope;if(!env||Date.now()-Number(env.ts||0)>12*60*60*1000)return null;
  const a=comparableLocalClipboard(current),b=comparableLocalClipboard(env.formatted);
  return (a===b||a.replace(/\n+$/g,"")===b.replace(/\n+$/g,""))?String(env.raw??""):null;
}
function insertPlainTextIntoEditable(target,text){
  if(!target)return false;text=String(text??"");
  if(["INPUT","TEXTAREA"].includes(target.tagName)){
    const start=target.selectionStart??target.value.length,end=target.selectionEnd??start;
    target.setRangeText(text,start,end,"end");
    target.dispatchEvent(new InputEvent("input",{bubbles:true,inputType:"insertFromPaste",data:text}));
    return true;
  }
  target.focus();
  return !!document.execCommand("insertText",false,text);
}
async function resolveAndInsertPlainPaste(target,currentText){
  const local=localRawPlainPaste(currentText);
  if(local!==null)return insertPlainTextIntoEditable(target,local);
  const response=await safeSendMessage({action:"resolvePlainPasteText",text:String(currentText??"")});
  return response?.ok?insertPlainTextIntoEditable(target,response.text):false;
}
// Track the modifier keys separately because Chromium can reserve Ctrl+Shift+V
// before a page sees the V keydown. The subsequent paste event is the reliable
// interception point for editors such as ChatGPT.
document.addEventListener("keydown",e=>{
  if(e.key==="Control")ctrlHeld=true;if(e.key==="Shift")shiftHeld=true;
  if(e.ctrlKey&&!e.altKey&&!e.metaKey&&e.shiftKey&&String(e.key).toLowerCase()==="v")plainPasteChordUntil=Date.now()+1500;
},true);
document.addEventListener("keyup",e=>{if(e.key==="Control")ctrlHeld=false;if(e.key==="Shift")shiftHeld=false},true);
window.addEventListener("blur",()=>{ctrlHeld=false;shiftHeld=false},true);
document.addEventListener("paste",e=>{
  const requested=(ctrlHeld&&shiftHeld)||Date.now()<=plainPasteChordUntil;if(!requested)return;
  const target=plainPasteTarget(e.target);if(!target)return;
  const current=String(e.clipboardData?.getData("text/plain")??"");
  e.preventDefault();e.stopImmediatePropagation();plainPasteChordUntil=0;
  if(keyboardCapturePending)cancelPendingAutomaticCapture("Plain-text paste started before the keyboard-selection grace period ended");
  void resolveAndInsertPlainPaste(target,current);
},true);

document.addEventListener("keydown",e=>{
  if(e.shiftKey&&KEYBOARD_SELECTION_KEYS.has(e.key)){keyboardSelectionActive=true;if(keyboardCapturePending)cancelPendingAutomaticCapture("Keyboard selection was refined before the grace period ended");return}
  if(!keyboardCapturePending)return;if(e.key==="Shift")return;
  cancelPendingAutomaticCapture((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="c"?"Explicit copy replaced pending automatic keyboard copy":"Keyboard input started before the grace period ended")
},true);

// FUTURE: Optionally capture webpage-owned Copy buttons that call
// navigator.clipboard.writeText() directly and therefore emit no normal document
// "copy" event. Do not monkey-patch the Clipboard API in the RC. Revisit as an
// opt-in Advanced feature: "Capture webpage Copy buttons".

// Optional, page-scoped history capture for a normal Ctrl+C or context-menu Copy.
// This records only a selection from a web page; it never reads the Windows clipboard.
document.addEventListener("copy",e=>{
  if(keyboardCapturePending)cancelPendingAutomaticCapture("Explicit browser copy replaced pending automatic keyboard copy");
  const s=CS_SETTINGS||normalizeSettings({});
  if(!s.enabled||!s.historyEnabled||!s.captureManualChromeCopies)return;
  const decision=getSiteDecision(location.href,s);if(!decision.enabled)return;
  const selected=selectedControlText(e.target)||window.getSelection?.()?.toString()||"",snap=selectionSnapshot(e,selected),text=String(selected).trim();
  if(!text)return;
  const target=e.target,descriptor=[target?.type,target?.name,target?.id,target?.autocomplete,target?.getAttribute?.("aria-label")].filter(Boolean).join(" ");
  const sensitive=target?.tagName==="INPUT"&&(/password|cc-|credit.?card|card.?number|cvv|cvc|security.?code/i.test(descriptor));
  setTimeout(()=>{if(!e.defaultPrevented)void safeSendMessage({action:"saveManualChromeCopy",text,rawText:text,copyMode:"manual",html:snap?.html||"",url:location.href,title:document.title,sensitive})},0);
});

document.addEventListener("auxclick",async e=>{
  const s=CS_SETTINGS||normalizeSettings({});
  if(e.button!==1||!s.pasteOnMiddleClick)return;
  if(!["INPUT","TEXTAREA"].includes(e.target?.tagName)&&!e.target?.isContentEditable)return;
  e.preventDefault();
  try{
    const queued=await safeSendMessage({action:"peekPasteStack"}),stackItem=queued?.item||null;
    const txt=stackItem?.text!=null?String(stackItem.text):await navigator.clipboard.readText();
    let inserted=false;
    if(e.target.isContentEditable)inserted=!!document.execCommand("insertText",false,txt);
    else{
      const a=e.target.selectionStart,b=e.target.selectionEnd;
      e.target.setRangeText(txt,a,b,"end");
      e.target.dispatchEvent(new Event("input",{bubbles:true}));
      inserted=true;
    }
    if(inserted&&stackItem?.id)await safeSendMessage({action:"consumePasteStack",id:stackItem.id});
  }catch{}
},true);

document.addEventListener("keydown",e=>{
  const s=CS_SETTINGS||normalizeSettings({});
  if(!s.enableTTSHotkey)return;
  const mod=s.ttsModifierKey==="CTRL"?e.ctrlKey:s.ttsModifierKey==="ALT"?e.altKey:e.shiftKey;
  if(mod&&e.key.toUpperCase()===String(s.ttsKey).toUpperCase()){
    e.preventDefault();
    try{
      void safeSendMessage({action:"runtimeData"}).then(({history=[]}={})=>{
        const selected=window.getSelection()?.toString().trim(),text=selected||history[0]?.text;
        if(!text)return;
        speechSynthesis.cancel();
        const u=new SpeechSynthesisUtterance(text);u.rate=s.ttsRate;u.pitch=s.ttsPitch;u.volume=s.ttsVolume;const voice=speechSynthesis.getVoices().find(v=>v.voiceURI===s.ttsVoice);if(voice)u.voice=voice;speechSynthesis.speak(u);
      });
    }catch{}
  }
});
try{globalThis.chrome?.runtime?.onMessage?.addListener((request,_sender,sendResponse)=>{if(request?.action==="wordWatchFeedback"){const feedback=request.feedback||{},settings=normalizeSettings({...CS_SETTINGS,...(feedback.mode==="custom"?{feedbackText:feedback.message||CS_SETTINGS?.feedbackText,notificationColor:feedback.color||CS_SETTINGS?.notificationColor,notificationTextColor:feedback.textColor||CS_SETTINGS?.notificationTextColor,audioNotificationSound:feedback.sound||CS_SETTINGS?.audioNotificationSound,cursorEffect:feedback.effect||CS_SETTINGS?.cursorEffect,notificationDuration:feedback.duration||CS_SETTINGS?.notificationDuration}: {})});showVisualFeedback(settings,null);playSound(settings);sendResponse?.({ok:true});return false}if(request?.action!=="copySelectHealth")return false;sendResponse({ok:true,version:contentVersion,settingsLoaded:!!CS_SETTINGS,url:location.href,lastAutoCapture});return false})}catch{}
})();
