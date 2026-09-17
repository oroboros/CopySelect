(()=>{
const CS_DEFAULTS = Object.freeze({
  schemaVersion: 29,
  enabled: true,
  pausedUntil: 0,
  pauseUntilRestart: false,
  copyDelayEnabled: true,
  copyDelay: 450,

  notificationMode: "visual",
  screenFeedbackEnabled: true,
  cursorFeedbackEnabled: true,
  feedbackStyle: "pill",
  cursorEffect: "selection-flash",
  feedbackText: "Copied",
  feedbackSymbol: "check",
  feedbackCustomSymbol: "✨",
  notificationDuration: 1000,
  notificationPosition: "bottom-left",
  notificationColor: "#111827",
  notificationTextColor: "#ffffff",
  notificationTransparency: 94,
  feedbackSize: 18,
  notificationBoxSize: 220,
  notificationPreset: "subtle",
  cursorFeedbackDuration: 320,
  cursorEffectColor: "#f97316",
  cursorEffectOpacity: 70,
  cursorEffectSize: 22,
  cursorEffectThickness: 3,
  cursorEffectFontFamily: "system-ui",
  notificationFontFamily: "ui-monospace, monospace",
  notificationFontStyle: "bold",
  selectionFlashTextColor: "#111827",

  enableAudioNotification: false,
  audioNotificationSound: "glass-chime",

  enableTextBoxes: true,
  enableContentEditable: true,
  pasteOnMiddleClick: true,
  selectionTrigger: "any",
  minSelectionLength: 2,
  ignoreWhitespaceOnly: true,
  duplicateSuppression: true,
  duplicateWindowSeconds: 5,
  enableModifierKey: false,
  modifierKey: "ALT",
  modifierKeyAction: "enable",
  profileTargetCollectionName: "",
  profileRequireLockedCollection: false,
  profileAutoPin: false,
  profileAddPasteStack: false,

  copyMode: "original",
  linkCopyMode: "html",
  trimWhitespace: true,
  normalizeWhitespace: false,
  preserveLineBreaks: true,
  removeZeroWidth: true,
  joinWrappedLines: false,

  includeMetadata: false,
  includeDate: true,
  includeTime: true,
  includeURL: true,
  includeTitle: true,
  includeDomain: true,
  includeSelectionLength: true,
  customText: "",
  metadataBeforeText: "",
  metadataAfterText: "",
  metadataPosition: "after",
  simpleMetadataOrder: ["title","domain","date","text","time","url","selectionLength"],
  metadataSeparator: "\n",
  metadataCustomSeparator: "",
  dateFormat: "locale",
  dateCustomFormat: "DD/MM/YYYY",
  timeFormat: "locale",
  timeCustomFormat: "HH:mm",
  customTemplate: "{title} · {date}\n\n{text}\n\n## {url}",
  savedTemplates: [
    {name:"Save for later",template:"\"{title}\" · {date}\n\n{text}\n\n## {url}"},
    {name:"Research excerpt",template:"## {title}\n\n> {text}\n\nSource: {domain}\n\n{url}\nCaptured: {date}, {time} ({wordCount} words)"},
    {name:"Quick refining",template:"{text}\n\n— {title}\n{domain}\n\n({url})"}
  ],

  siteRules: [],
  activeProfile: "Default",
  profiles: {
    "Default": {},
    "Research": {copyMode:"quote-source",includeURL:true,includeTitle:true,includeDate:true,includeTime:true,includeMetadata:true,copyDelay:600,profileTargetCollectionName:"Research"},
    "Coding": {copyMode:"plain",preserveLineBreaks:true,normalizeWhitespace:false,copyDelay:250,screenFeedbackEnabled:false,profileTargetCollectionName:"Code"},
    "Writing": {copyMode:"plain",trimWhitespace:true,normalizeWhitespace:true,copyDelay:400,enableAudioNotification:false},
    "Minimal": {copyMode:"plain",notificationMode:"none",cursorFeedbackEnabled:false,screenFeedbackEnabled:false,enableAudioNotification:false,copyDelay:350},
    "Rapid Capture": {copyMode:"plain",copyDelay:200,profileAutoPin:true,historyEnabled:true},
    "Batch Transfer": {copyMode:"plain",copyDelay:250,profileAddPasteStack:true,historyEnabled:true,screenFeedbackEnabled:false,enableAudioNotification:false},
    "Private Capture": {copyMode:"plain",includeMetadata:false,includeURL:false,includeTitle:false,profileTargetCollectionName:"Private",profileRequireLockedCollection:true,feedbackText:"Saved privately"},
    "Recipes": {copyMode:"original",copyDelay:400,profileTargetCollectionName:"Recipes",feedbackText:"Saved to Recipes"}
  },

  historyEnabled: true,
  captureManualChromeCopies: false,
  historyPausedUntil: 0,
  historyPauseUntilRestart: false,
  historyCaptureSourceDetails: true,
  historyIgnoreSensitiveFields: true,
  historySaveRichText: true,
  historySaveImages: true,
  historyMinimumKeep: 10,
  historyKeepPinnedForever: true,
  historyCollections: [],
  historySavedViews: [],
  smartTagSuggestionMode: "suggest",
  smartTagAutoThreshold: 90,
  smartTagLearningEnabled: true,
  historySessionGapMinutes: 30,
  historyLimit: 50,
  historyShowMetadata: true,
  historyViewMode: "compact",
  historyTimestampFormat: "friendly",
  historyAutoDelete: true,
  historyAutoDeleteValue: 30,
  historyAutoDeleteUnit: "days",
  historyHoverExpand: false,
  historyHoverDelay: 1500,
  history: [],
  pinned: [],
  statsEnabled: true,
  stats: {totalCopies:0, weeklyCopies:0, weekKey:"", charsCopied:0, repeatCopies:0, historyRecopies:0, pasteStackUses:0},

  enableTTSHotkey: true,
  ttsModifierKey: "ALT",
  ttsKey: "S",
  ttsRate: .7,
  ttsPitch: .5,
  ttsVolume: 1,
  ttsVoice: "",
  theme: "system",
  settingsViewMode: "simple"
});

/*
  Tuned presets: a heuristic "panel" review, not a claim of a live research panel.
  Each effect intentionally differs in timing, scale, color and opacity so choosing
  an effect feels complete out-of-the-box. Users can always customize and reset.
*/
const CS_EFFECT_DEFAULTS = Object.freeze({
  "selection-flash":   {cursorEffectColor:"#f97316",selectionFlashTextColor:"#111827",cursorEffectOpacity:70,cursorEffectSize:22,cursorEffectThickness:3,cursorFeedbackDuration:320},
  "selection-brackets":{cursorEffectColor:"#f59e0b",selectionFlashTextColor:"#111827",cursorEffectOpacity:100,cursorEffectSize:24,cursorEffectThickness:3,cursorFeedbackDuration:600},
  "soft-halo":         {cursorEffectColor:"#a855f7",selectionFlashTextColor:"#ffffff",cursorEffectOpacity:60,cursorEffectSize:48,cursorFeedbackDuration:520},
  "pulse-ring":        {cursorEffectColor:"#0891b2",selectionFlashTextColor:"#111827",cursorEffectOpacity:100,cursorEffectSize:40,cursorFeedbackDuration:560},
  "ripple-check":      {cursorEffectColor:"#16a34a",selectionFlashTextColor:"#ffffff",cursorEffectOpacity:100,cursorEffectSize:38,cursorFeedbackDuration:650},
  "spark":             {cursorEffectColor:"#db2777",selectionFlashTextColor:"#ffffff",cursorEffectOpacity:100,cursorEffectSize:32,cursorFeedbackDuration:420},
  "copy-badge":        {cursorEffectColor:"#4f46e5",selectionFlashTextColor:"#ffffff",cursorEffectOpacity:100,cursorEffectSize:30,cursorFeedbackDuration:600},
  "dot-pulse":         {cursorEffectColor:"#ea580c",selectionFlashTextColor:"#ffffff",cursorEffectOpacity:100,cursorEffectSize:22,cursorFeedbackDuration:380},
  "mini-clipboard":    {cursorEffectColor:"#0f766e",selectionFlashTextColor:"#ffffff",cursorEffectOpacity:100,cursorEffectSize:32,cursorFeedbackDuration:620},
  "glow-trail":        {cursorEffectColor:"#7c3aed",selectionFlashTextColor:"#ffffff",cursorEffectOpacity:65,cursorEffectSize:48,cursorFeedbackDuration:520},
  "underline-sweep":   {cursorEffectColor:"#0f6b78",selectionFlashTextColor:"#ffffff",cursorEffectOpacity:90,cursorEffectSize:18,cursorEffectThickness:3,cursorFeedbackDuration:480},
  "none":              {cursorEffectColor:"#4f7cff",selectionFlashTextColor:"#ffffff",cursorEffectOpacity:70,cursorEffectSize:22,cursorFeedbackDuration:280}
});

const CS_SCREEN_STYLE_DEFAULTS = Object.freeze({
  "pill": {
    notificationColor:"#111827", notificationTextColor:"#ffffff", notificationTransparency:94,
    feedbackSize:18, notificationBoxSize:220, notificationDuration:1000,
    notificationFontFamily:"ui-monospace, monospace", notificationFontStyle:"bold", notificationPosition:"bottom-left",
    notificationPreset:"subtle", feedbackStyle:"pill", feedbackText:"Copied", feedbackSymbol:"check"
  },
  "icon": {
    notificationColor:"#111827", notificationTextColor:"#ffffff", notificationTransparency:92,
    feedbackSize:20, notificationBoxSize:72, notificationDuration:820,
    notificationPreset:"subtle", feedbackStyle:"icon", feedbackText:"Copied", feedbackSymbol:"check"
  }
});

const CS_SCREEN_DEFAULTS = CS_SCREEN_STYLE_DEFAULTS.pill;

function clampNumber(v,min,max,fallback){
  const n=Number(v); return Number.isFinite(n)?Math.min(max,Math.max(min,n)):fallback;
}
function normalizeSettings(raw={}){
  const migrated={...raw};
  const priorSchema=Number(migrated.schemaVersion||0);
  const priorTemplate="📎 {title}\nSaved from {domain} on {date} at {time}\n\n“{text}”\n\nRead it where it lived: {url}\nSnapshot: {wordCount} words · {paragraphCount} paragraph · {characterCountWithSpaces} characters with spaces · {characterCountNoSpaces} without\n\nPlain text is lovely, but give every copy a little context. ✨";
  if(migrated.customTemplate===priorTemplate)migrated.customTemplate=CS_DEFAULTS.customTemplate;
  const templateText=String(migrated.customTemplate||"").trim(),tokenDump=/^(?:\{(?:text|title|url|domain|date|time|isoDate|year|selectionLength|wordCount|paragraphCount|characterCountWithSpaces|characterCountNoSpaces)\}\s*)+$/;
  if(priorSchema<18&&(/(Plain text is lovely|Copied text is lovely|Tiny receipt for a thought|Snapshot: \{wordCount\}|RESEARCH NOTE|Research note)/.test(templateText)||tokenDump.test(templateText)))migrated.customTemplate=CS_DEFAULTS.customTemplate;
  const legacyFlash=["#4f7cff","#2563eb"].includes(String(migrated.cursorEffectColor||"").toLowerCase())&&
    [68,70].includes(Number(migrated.cursorEffectOpacity))&&[22].includes(Number(migrated.cursorEffectSize))&&
    [240,280].includes(Number(migrated.cursorFeedbackDuration));
  if(priorSchema<11&&migrated.cursorEffect==="selection-flash"&&legacyFlash)Object.assign(migrated,CS_EFFECT_DEFAULTS["selection-flash"]);
  if(migrated.notificationMode==="toast") migrated.notificationMode="visual";
  if(migrated.notificationMode==="toast-sound") migrated.notificationMode="visual-sound";
  if(migrated.feedbackSize==null && migrated.notificationSize!=null) migrated.feedbackSize=migrated.notificationSize;
  delete migrated.notificationSize;

  if(migrated.feedbackStyle==="cursor"){
    migrated.cursorEffect="soft-halo"; migrated.cursorFeedbackEnabled=true;
    migrated.screenFeedbackEnabled=false; migrated.feedbackStyle="pill";
  }
  if(migrated.feedbackStyle==="ripple"){
    migrated.cursorEffect="ripple-check"; migrated.cursorFeedbackEnabled=true;
    migrated.screenFeedbackEnabled=false; migrated.feedbackStyle="pill";
  }
  // Old arrow/cursor effects migrate to selection-oriented equivalents.
  if(["arrow-check","copy-cursor","selection-corners"].includes(migrated.cursorEffect)){
    migrated.cursorEffect=migrated.cursorEffect==="selection-corners"?"selection-brackets":"soft-halo";
  }
  // The combined experiment was retired in v2.5: flash and brackets are
  // deliberately separate choices with separate tuned presets.
  if(migrated.cursorEffect==="flash-brackets")migrated.cursorEffect="selection-flash";
  if(migrated.settingsViewMode==="basic") migrated.settingsViewMode="simple";
  if(migrated.settingsViewMode==="power") migrated.settingsViewMode="advanced";
  if(migrated.cursorEffectColor==null && migrated.notificationColor) migrated.cursorEffectColor=migrated.notificationColor;
  if(migrated.cursorEffectOpacity==null && migrated.notificationTransparency!=null) migrated.cursorEffectOpacity=migrated.notificationTransparency;
  if(migrated.cursorEffectSize==null && migrated.feedbackSize!=null) migrated.cursorEffectSize=migrated.feedbackSize;
  if(migrated.metadataAfterText==null && migrated.customText) migrated.metadataAfterText=migrated.customText;
  const legacyTemplates=[
    "{text}\n\n— {title} · {domain}\n{date} at {time} · {wordCount} words · {characterCountNoSpaces} characters\nTiny receipt for a thought worth keeping. ✨",
    "{title}\n{text}\n\n— {domain} · {date} at {time}\n{wordCount} words · {characterCountNoSpaces} characters · {paragraphCount} paragraph(s)\nPlain text is lovely, but every copy deserves a tiny filing clerk. ✨",
    "{title}\n{domain} · {date} at {time}\n\n{text}\n\nSource: {url}\n{wordCount} words · {paragraphCount} paragraph · {characterCountWithSpaces} characters including spaces · {characterCountNoSpaces} without\n\nPlain text is lovely, but give every copy a little context. ✨"
  ];
  if(legacyTemplates.includes(migrated.customTemplate)) migrated.customTemplate=CS_DEFAULTS.customTemplate;
  if(priorSchema<19&&(!Array.isArray(migrated.savedTemplates)||migrated.savedTemplates.length===0))migrated.savedTemplates=[{name:"Reading note",template:CS_DEFAULTS.customTemplate}];
  // v3.6 folds the old Capture profile into explicit capture toggles.
  if(priorSchema<13&&migrated.captureProfile){
    if(migrated.captureProfile==="copy-no-save")migrated.historyEnabled=false;
    if(migrated.captureProfile==="manual-chrome"){migrated.historyEnabled=true;migrated.captureManualChromeCopies=true;}
    if(migrated.captureProfile==="paused")migrated.historyEnabled=false;
    delete migrated.captureProfile;
  }
  // v3.6 presents retention as independent maximum-count and maximum-age limits.
  if(priorSchema<13){
    if(migrated.historyRetentionMode&&migrated.historyRetentionMode!=="entries"){
      migrated.historyAutoDelete=true;
      migrated.historyAutoDeleteUnit=migrated.historyRetentionMode;
      migrated.historyAutoDeleteValue=migrated.historyRetentionMode==="hours"?(migrated.historyRetentionHours||24):(migrated.historyRetentionDays||30);
    }
    // The old “auto-delete after N entries” is now simply the maximum-history cap.
    if(migrated.historyAutoDelete&&migrated.historyAutoDeleteUnit==="entries"){
      const entryCap=clampNumber(migrated.historyAutoDeleteValue,1,10000,50);
      migrated.historyLimit=Math.min(clampNumber(migrated.historyLimit,1,10000,entryCap),entryCap);
      migrated.historyAutoDelete=false;
      migrated.historyAutoDeleteUnit="days";
    }
  }
  delete migrated.historyRetentionMode;delete migrated.historyRetentionDays;delete migrated.historyRetentionHours;delete migrated.pinnedLimit;

  const s={...CS_DEFAULTS,...migrated};
  if(priorSchema<21&&Array.isArray(s.savedTemplates)&&s.savedTemplates.length===1&&s.savedTemplates[0]?.name==="Reading note")s.savedTemplates=CS_DEFAULTS.savedTemplates.map(x=>({...x}));
  if(priorSchema<23){
    s.linkCopyMode="html";
    const saved=Array.isArray(s.savedTemplates)?s.savedTemplates:[];
    const names=new Set(saved.map(x=>String(x?.name||"").toLowerCase()));
    for(const builtIn of CS_DEFAULTS.savedTemplates)if(!names.has(builtIn.name.toLowerCase()))saved.push({...builtIn});
    s.savedTemplates=saved.filter(x=>x?.name!=="Reading note");
  }
  if(priorSchema<24){
    s.enableAudioNotification=true;s.audioNotificationSound="glass-chime";s.enableTTSHotkey=true;s.ttsRate=.7;s.ttsPitch=.5;s.ttsVolume=1;
  }
  if(priorSchema<25)s.historyHoverDelay=1500;
  if(priorSchema<26){
    const builtIns=new Map(CS_DEFAULTS.savedTemplates.map(t=>[t.name.toLowerCase(),t]));
    const aliases={"quick reference":"quick refining","project handoff":"proj handoff"};
    const existing=Array.isArray(s.savedTemplates)?s.savedTemplates:[];
    const retained=existing.filter(t=>!builtIns.has(String(t?.name||"").toLowerCase())&&!Object.prototype.hasOwnProperty.call(aliases,String(t?.name||"").toLowerCase()));
    s.savedTemplates=[...CS_DEFAULTS.savedTemplates.map(t=>({...t})),...retained];
    if(s.customTemplate==="{title} · {date}\n{text}\n{url}")s.customTemplate=CS_DEFAULTS.customTemplate;
  }
  if(priorSchema<27){
    const retiredNames=new Set(["proj handoff","project handoff"]);
    s.savedTemplates=(Array.isArray(s.savedTemplates)?s.savedTemplates:[]).filter(t=>!retiredNames.has(String(t?.name||"").trim().toLowerCase()));
  }
  // v3.7.8.17 hotfix: Metadata → Defaults accidentally enabled metadata even
  // though CopySelect's actual default is OFF. Repair the exact Default-profile
  // configuration produced by that bug without touching custom/profile-driven
  // metadata setups.
  if(priorSchema<28){
    const looksLikeBuggyMetadataDefaults=
      (migrated.activeProfile||"Default")==="Default" && migrated.includeMetadata===true &&
      (migrated.copyMode==null||migrated.copyMode==="original") &&
      migrated.includeDate!==false && migrated.includeTime!==false && migrated.includeURL!==false &&
      migrated.includeTitle!==false && migrated.includeDomain!==false && migrated.includeSelectionLength!==false &&
      !String(migrated.metadataBeforeText||"") && !String(migrated.metadataAfterText||"") && !String(migrated.customText||"") &&
      (migrated.metadataSeparator==null||migrated.metadataSeparator==="\n") &&
      !String(migrated.metadataCustomSeparator||"");
    if(looksLikeBuggyMetadataDefaults)s.includeMetadata=false;
  }
  // v3.7.8.18: the previous hotfix repaired the live includeMetadata flag but
  // could leave a saved Default-profile snapshot with includeMetadata=true.
  // Re-applying Default then silently turned metadata back on. Repair that exact
  // affected state, including the user's {text}-only template configuration.
  if(priorSchema<29){
    const defaultProfile=s.profiles&&typeof s.profiles==="object"?s.profiles.Default:null;
    const defaultProfileLooksAffected=!!(defaultProfile&&defaultProfile.includeMetadata===true&&
      (defaultProfile.copyMode==null||defaultProfile.copyMode==="original")&&
      defaultProfile.includeDate!==false&&defaultProfile.includeTime!==false&&defaultProfile.includeURL!==false&&
      defaultProfile.includeTitle!==false&&defaultProfile.includeDomain!==false);
    const liveDefaultLooksAffected=
      (s.activeProfile||"Default")==="Default"&&s.includeMetadata===true&&
      (s.copyMode==null||s.copyMode==="original")&&
      String(s.customTemplate||"").trim()==="{text}"&&
      s.includeDate!==false&&s.includeTime!==false&&s.includeURL!==false&&
      s.includeTitle!==false&&s.includeDomain!==false&&s.includeSelectionLength!==false&&
      !String(s.metadataBeforeText||"")&&!String(s.metadataAfterText||"")&&!String(s.customText||"");
    if((s.activeProfile||"Default")==="Default"&&String(s.customTemplate||"").trim()==="{text}"&&(defaultProfileLooksAffected||liveDefaultLooksAffected)){
      s.includeMetadata=false;
      if(defaultProfileLooksAffected)s.profiles={...s.profiles,Default:{...defaultProfile,includeMetadata:false}};
    }
  }
  s.historyKeepPinnedForever=true;
  s.schemaVersion=29;
  s.simpleMetadataOrder=Array.isArray(s.simpleMetadataOrder)?s.simpleMetadataOrder.filter(x=>["title","domain","date","text","time","url","selectionLength"].includes(x)):CS_DEFAULTS.simpleMetadataOrder.slice();
  if(!s.simpleMetadataOrder.includes("text"))s.simpleMetadataOrder.splice(Math.min(3,s.simpleMetadataOrder.length),0,"text");
  for(const token of CS_DEFAULTS.simpleMetadataOrder)if(!s.simpleMetadataOrder.includes(token))s.simpleMetadataOrder.push(token);
  s.enabled=!!s.enabled;
  s.copyDelay=clampNumber(s.copyDelay,0,10000,450);
  s.notificationDuration=clampNumber(s.notificationDuration,100,10000,1000);
  s.notificationTransparency=clampNumber(s.notificationTransparency,10,100,94);
  s.feedbackSize=clampNumber(s.feedbackSize,10,96,15);
  s.notificationBoxSize=clampNumber(s.notificationBoxSize,60,600,220);
  s.cursorFeedbackDuration=clampNumber(s.cursorFeedbackDuration,100,3000,280);
  s.cursorEffectOpacity=clampNumber(s.cursorEffectOpacity,10,100,70);
  s.cursorEffectSize=clampNumber(s.cursorEffectSize,10,96,22);
  s.cursorEffectThickness=clampNumber(s.cursorEffectThickness,1,12,3);
  s.minSelectionLength=clampNumber(s.minSelectionLength,1,1000,2);
  s.duplicateWindowSeconds=clampNumber(s.duplicateWindowSeconds,0,3600,5);
  s.historyLimit=clampNumber(s.historyLimit,1,10000,50);
  s.historyAutoDeleteValue=clampNumber(s.historyAutoDeleteValue,1,10000,30);
  s.historyMinimumKeep=Math.min(clampNumber(s.historyMinimumKeep,0,10000,10),s.historyLimit);
  s.historyKeepPinnedForever=true;
  s.historyHoverDelay=clampNumber(s.historyHoverDelay,100,9999,1500);
  s.smartTagSuggestionMode=["off","suggest","auto"].includes(s.smartTagSuggestionMode)?s.smartTagSuggestionMode:"suggest";
  s.smartTagAutoThreshold=clampNumber(s.smartTagAutoThreshold,50,99,90);
  s.smartTagLearningEnabled=s.smartTagLearningEnabled!==false;
  s.historySessionGapMinutes=clampNumber(s.historySessionGapMinutes,5,240,30);
  s.historySavedViews=Array.isArray(s.historySavedViews)?s.historySavedViews.filter(v=>v&&v.id&&v.name&&typeof v.query==="string").slice(0,100):[];
  s.ttsRate=clampNumber(s.ttsRate,.5,2,.7);
  s.ttsPitch=clampNumber(s.ttsPitch,0,2,.5);
  s.ttsVolume=clampNumber(s.ttsVolume,0,1,1);
  s.settingsViewMode=["simple","advanced"].includes(s.settingsViewMode)?s.settingsViewMode:"simple";
  s.historyViewMode=["compact","full"].includes(s.historyViewMode)?s.historyViewMode:"compact";
  s.historyAutoDeleteUnit=["hours","days"].includes(s.historyAutoDeleteUnit)?s.historyAutoDeleteUnit:"days";
  s.historyPausedUntil=clampNumber(s.historyPausedUntil,0,Number.MAX_SAFE_INTEGER,0);
  s.historyPauseUntilRestart=!!s.historyPauseUntilRestart;
  if(!CS_EFFECT_DEFAULTS[s.cursorEffect])s.cursorEffect="selection-flash";
  s.siteRules=Array.isArray(s.siteRules)?s.siteRules.filter(r=>r&&typeof r.pattern==="string").slice(0,300):[];
  s.history=Array.isArray(s.history)?s.history.slice(0,s.historyLimit):[];
  s.pinned=Array.isArray(s.pinned)?s.pinned:[];
  s.profiles=s.profiles&&typeof s.profiles==="object"?s.profiles:{...CS_DEFAULTS.profiles};
  s.historyCollections=Array.isArray(s.historyCollections)?s.historyCollections.filter(c=>c&&c.id&&c.name).slice(0,500).map(c=>{
    const smart=c.smart&&typeof c.smart==="object"?{enabled:!!c.smart.enabled,sites:String(c.smart.sites||""),text:String(c.smart.text||""),copyMode:String(c.smart.copyMode||""),logic:["or","and","site","text"].includes(c.smart.logic)?c.smart.logic:"or",matchAll:!!c.smart.matchAll,wholeWords:!!c.smart.wholeWords,caseSensitive:!!c.smart.caseSensitive}:null;
    return {...c,description:String(c.description||""),locked:!!c.locked,lockHash:String(c.lockHash||""),lockOnClose:!!c.lockOnClose,autoLockMinutes:clampNumber(c.autoLockMinutes,0,60,0),smart,wordWatch:c.wordWatch&&typeof c.wordWatch==="object"?c.wordWatch:null};
  }):[];
  s.stats={...CS_DEFAULTS.stats,...(s.stats||{})};
  return s;
}

function makeRuntimeId(){
  try{return globalThis.crypto?.randomUUID?.()||`cs-${Date.now()}-${Math.random().toString(36).slice(2)}`}
  catch{return `cs-${Date.now()}-${Math.random().toString(36).slice(2)}`}
}
function runtimeEntrySignature(item={}){
  return [item.text||"",item.html||"",item.url||"",item.title||"",Number(item.ts||0)].join("\u241f");
}
function normalizeRuntimeState(raw={}){
  const now=Date.now();
  const normalizeItem=(item,id)=>{
    const src=item&&typeof item==="object"?item:{};
    const ts=Number(src.ts);
    const safeTs=Number.isFinite(ts)&&ts>0?ts:now;
    const firstTs=Number(src.firstTs),lastTs=Number(src.lastTs);
    const collections=Array.isArray(src.collectionIds)?[...new Set(src.collectionIds.map(String).filter(Boolean))]:[];
    const tags=Array.isArray(src.tags)?[...new Set(src.tags.map(String).map(x=>x.trim()).filter(Boolean))].slice(0,50):[];
    const suggestedTags=Array.isArray(src.suggestedTags)?src.suggestedTags.filter(x=>x&&x.tag).slice(0,12).map(x=>({tag:String(x.tag),confidence:Math.max(0,Math.min(1,Number(x.confidence)||0)),source:String(x.source||"local"),reason:String(x.reason||"")})):[];
    return {...src,id,text:String(src.text??""),originalText:String(src.originalText??src.text??""),rawText:String(src.rawText??src.text??""),label:String(src.label||""),note:String(src.note||""),html:String(src.html??""),url:String(src.url??""),title:String(src.title??""),ts:safeTs,firstTs:Number.isFinite(firstTs)&&firstTs>0?firstTs:safeTs,lastTs:Number.isFinite(lastTs)&&lastTs>0?lastTs:safeTs,repeatCount:Math.max(1,Math.floor(Number(src.repeatCount)||1)),collectionIds:collections,tags,suggestedTags};
  };
  const history=[],historyIds=new Set(),historyBySig=new Map();
  for(const src of Array.isArray(raw.history)?raw.history:[]){
    let id=typeof src?.id==="string"&&src.id.trim()?src.id.trim():makeRuntimeId();
    while(historyIds.has(id))id=makeRuntimeId();
    historyIds.add(id);
    const item=normalizeItem(src,id);history.push(item);
    if(!historyBySig.has(runtimeEntrySignature(item)))historyBySig.set(runtimeEntrySignature(item),id);
  }
  const pinned=[],pinnedIds=new Set();
  for(const src of Array.isArray(raw.pinned)?raw.pinned:[]){
    let id=typeof src?.id==="string"&&src.id.trim()?src.id.trim():historyBySig.get(runtimeEntrySignature(src));
    if(!id)id=makeRuntimeId();
    while(pinnedIds.has(id))id=makeRuntimeId();
    pinnedIds.add(id);pinned.push(normalizeItem(src,id));
  }
  const pasteStack=[],stackIds=new Set();
  for(const src of Array.isArray(raw.pasteStack)?raw.pasteStack:[]){
    const item=src&&typeof src==="object"?src:{};
    let id=typeof item.id==="string"&&item.id.trim()?item.id.trim():makeRuntimeId();
    while(stackIds.has(id))id=makeRuntimeId();stackIds.add(id);
    pasteStack.push({...item,id,text:String(item.text??""),title:String(item.title??""),url:String(item.url??"")});
  }
  const stats={...CS_DEFAULTS.stats,...(raw.stats&&typeof raw.stats==="object"?raw.stats:{})};
  const before={history:Array.isArray(raw.history)?raw.history:[],pinned:Array.isArray(raw.pinned)?raw.pinned:[],pasteStack:Array.isArray(raw.pasteStack)?raw.pasteStack:[],stats:raw.stats&&typeof raw.stats==="object"?raw.stats:{}};
  const after={history,pinned,pasteStack,stats};
  let changed=false;
  try{changed=JSON.stringify(before)!==JSON.stringify(after)}catch{changed=true}
  return {...after,changed};
}
function copySelectWeekKey(date=new Date()){
  const d=date instanceof Date?date:new Date(date),first=new Date(d.getFullYear(),0,1);
  return `${d.getFullYear()}-${Math.ceil((((d-first)/86400000)+first.getDay()+1)/7)}`;
}
function wildcardToRegex(pattern){
  const escaped=pattern.replace(/[.+?^${}()|[\]\\]/g,"\\$&").replace(/\*/g,".*");
  return new RegExp("^"+escaped+"$","i");
}
function matchPattern(url,pattern,type="auto"){
  if(!pattern)return false; const p=pattern.trim();
  try{
    if(type==="regex"||(type==="auto"&&p.startsWith("^")))return new RegExp(p,"i").test(url);
    if(type==="wildcard"||p.includes("*")){
      let target=url;
      if(!p.includes("://")){
        const u=new URL(url); target=u.hostname+u.pathname;
        const pp=p.startsWith("*.")?"*"+p.slice(1)+"*":p;
        return wildcardToRegex(pp).test(target);
      }
      return wildcardToRegex(p).test(url);
    }
    const a=new URL(url),b=new URL(p.includes("://")?p:"https://"+p);
    if(!p.includes("/")||b.pathname==="/") return a.hostname===b.hostname;
    return a.href.replace(/\/$/,"")===b.href.replace(/\/$/,"");
  }catch{return url.includes(p)}
}
function getSiteDecision(url,settings){
  let decision={enabled:settings.enabled,overrides:{}};
  // Rules are shown highest-priority first; process bottom-up so the first row wins.
  for(const rule of [...(settings.siteRules||[])].reverse()){
    if(rule.enabled!==false&&matchPattern(url,rule.pattern,rule.type||"auto")){
      if(rule.behavior==="disable")decision.enabled=false;
      if(rule.behavior==="enable")decision.enabled=true;
      if(rule.overrides&&typeof rule.overrides==="object")decision.overrides={...decision.overrides,...rule.overrides};
    }
  }
  return decision;
}
if(typeof globalThis!=="undefined")Object.assign(globalThis,{
  CS_DEFAULTS,CS_EFFECT_DEFAULTS,CS_SCREEN_DEFAULTS,CS_SCREEN_STYLE_DEFAULTS,
  normalizeSettings,normalizeRuntimeState,copySelectWeekKey,matchPattern,getSiteDecision
});
})();
