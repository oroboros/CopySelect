(()=>{
function htmlEscape(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));}
function cleanupText(text,s){
  let t=String(text||"");
  if(s.removeZeroWidth) t=t.replace(/[\u200B-\u200D\uFEFF]/g,"");
  if(s.joinWrappedLines) t=t.replace(/([^\n.!?:;])\n(?=[a-z0-9])/gi,"$1 ");
  if(s.trimWhitespace) t=t.trim();
  if(s.normalizeWhitespace){
    t=s.preserveLineBreaks?t.split("\n").map(x=>x.replace(/[ \t]+/g," ").trim()).join("\n").replace(/\n{3,}/g,"\n\n"):t.replace(/\s+/g," ");
  }
  return t;
}
function pad2(n){return String(n).padStart(2,"0")}
function formatDateValue(d,s){
  const presets={
    locale:()=>d.toLocaleDateString(),
    iso:()=>`${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`,
    dmy:()=>`${pad2(d.getDate())}/${pad2(d.getMonth()+1)}/${d.getFullYear()}`,
    mdy:()=>`${pad2(d.getMonth()+1)}/${pad2(d.getDate())}/${d.getFullYear()}`,
    short:()=>`${d.toLocaleString(undefined,{month:"short"})}_${pad2(d.getDate())}`,
    custom:()=>formatPatternDate(d,s.dateCustomFormat||"DD/MM/YYYY")
  };
  return (presets[s.dateFormat]||presets.locale)();
}
function formatTimeValue(d,s){
  const presets={
    locale:()=>d.toLocaleTimeString(),
    hm24:()=>`${pad2(d.getHours())}:${pad2(d.getMinutes())}`,
    hms24:()=>`${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`,
    hm12:()=>d.toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit",hour12:true}),
    custom:()=>formatPatternDate(d,s.timeCustomFormat||"HH:mm")
  };
  return (presets[s.timeFormat]||presets.locale)();
}
function formatPatternDate(d,pattern){
  const monthShort=d.toLocaleString(undefined,{month:"short"}),monthLong=d.toLocaleString(undefined,{month:"long"});
  const h12=((d.getHours()+11)%12)+1;
  const tokens={YYYY:String(d.getFullYear()),YY:String(d.getFullYear()).slice(-2),MMMM:monthLong,MMM:monthShort,DDD:d.toLocaleDateString(undefined,{weekday:"short"}),MM:pad2(d.getMonth()+1),DD:pad2(d.getDate()),D:String(d.getDate()),HH:pad2(d.getHours()),H:String(d.getHours()),hh:pad2(h12),h:String(h12),mm:pad2(d.getMinutes()),ss:pad2(d.getSeconds()),A:d.getHours()<12?"AM":"PM"};
  return String(pattern||"").replace(/YYYY|MMMM|MMM|DDD|YY|MM|DD|HH|hh|mm|ss|D|H|h|A/g,m=>tokens[m]);
}
function tokenMap(ctx,text,s={}){
  const d=new Date();
  let domain=""; try{domain=new URL(ctx.url||"").hostname}catch{}
  return {
    text, url:ctx.url||"", title:ctx.title||"", domain,
    date:formatDateValue(d,s), time:formatTimeValue(d,s),
    selectionLength:String(text.length),
    characterCountWithSpaces:String(text.length),
    characterCountNoSpaces:String(String(text).replace(/\s/g," ").replace(/ /g,"").length),
    wordCount:String((String(text).trim().match(/\S+/g)||[]).length),
    paragraphCount:String(String(text).trim()?String(text).trim().split(/\n\s*\n/).length:0),
    isoDate:d.toISOString().slice(0,10),
    year:String(d.getFullYear())
  };
}
function renderTemplate(template,tokens){return String(template||"").replace(/\{(\w+)\}/g,(m,k)=>k in tokens?tokens[k]:m);}
function metadataParts(s,t){
  const p=[]; if(s.includeTitle)p.push(t.title); if(s.includeURL)p.push(t.url); if(s.includeDomain)p.push(t.domain);
  if(s.includeDate)p.push(t.date); if(s.includeTime)p.push(t.time); if(s.customText)p.push(s.customText); return p.filter(Boolean);
}
function formatCopy(text,ctx,s){
  const clean=cleanupText(text,s), tokens=tokenMap(ctx,clean,s); let out=clean, html=null;
  switch(s.copyMode){
    case "markdown": out=ctx.linkUrl?`[${clean}](${ctx.linkUrl})`:clean; break;
    case "quote-source": out=`“${clean}”\n— ${ctx.title||ctx.url||"Source"}${ctx.url?`\n${ctx.url}`:""}`; break;
    case "url-title": out=`${clean}\n\n[${[ctx.title,ctx.url,tokens.date].filter(Boolean).join(", ")}]`; break;
    case "custom": out=renderTemplate(s.customTemplate,tokens); break;
    case "original": out=clean; html=ctx.selectionHtml||null; break;
    default: out=clean;
  }
  if(s.includeMetadata && s.copyMode!=="custom"){
    const sep=s.metadataSeparator==="custom"?(s.metadataCustomSeparator||"\n"):(s.metadataSeparator||"\n");
    const enabled={title:s.includeTitle,domain:s.includeDomain,date:s.includeDate,time:s.includeTime,url:s.includeURL,selectionLength:s.includeSelectionLength!==false,text:true};
    const order=Array.isArray(s.simpleMetadataOrder)?s.simpleMetadataOrder:["title","domain","date","text","time","url","selectionLength"];
    const arranged=order.filter(key=>enabled[key]).map(key=>key==="text"?clean:tokens[key]).filter(Boolean);
    out=[s.metadataBeforeText,...arranged,s.metadataAfterText||s.customText].filter(Boolean).join(sep);
  }
  if(ctx.linkUrl){
    if(s.linkCopyMode==="url") out=ctx.linkUrl;
    else if(s.linkCopyMode==="markdown") out=`[${clean}](${ctx.linkUrl})`;
    else if(s.linkCopyMode==="html"){out=clean;html=`<a href="${htmlEscape(ctx.linkUrl)}">${htmlEscape(clean)}</a>`;}
    else if(s.linkCopyMode==="text-url") out=`${clean} — ${ctx.linkUrl}`;
  }
  return {text:out,html};
}
if(typeof globalThis!=="undefined")Object.assign(globalThis,{cleanupText,formatCopy,renderTemplate,htmlEscape});
})();
