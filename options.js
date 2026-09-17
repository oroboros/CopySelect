let state=null;
const $=q=>document.querySelector(q), $$=q=>[...document.querySelectorAll(q)];
function escapeHtml(value){return String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[ch]))}

async function safeMessage(message){
  const rt=globalThis.chrome?.runtime;
  if(!rt?.id||typeof rt.sendMessage!=="function")return {ok:false,error:"Extension context unavailable. Reload this settings tab."};
  try{return await rt.sendMessage(message)}catch(e){return {ok:false,error:String(e?.message||e)}}
}

const pageTitles={
  general:["General & copying","Copy behavior, selection rules, and output."],
  behavior:["Copy Behavior","Control where and how automatic copying triggers."],
  formatting:["Formatting","Clean, transform and package copied text."],
  metadata:["Metadata & Templates","Build reusable copied-text templates and source details."],
  notifications:["Copy confirmation","Choose how CopySelect confirms a successful copy."],
  sites:["Site Rules","Enable, disable or override behavior per site."],
  profiles:["Profiles","Switch groups of CopySelect settings instantly."],
  storage:["Clipboard Storage Settings","Control what gets saved, how long it’s kept, and how history is managed."],
  history:["Clipboard History","Search, inspect, tag, pin and re-copy recent items."],
  collections:["Collections","Organize clips with Collections, tags, Saved Views, and WordWatch."],
  shortcuts:["Read aloud","Configure speech and keyboard behavior."],
  backup:["Data & Backup","Export, restore, or reset your CopySelect data."],
  advanced:["Activity & Privacy","Local usage patterns, privacy, and data behavior."],
  about:["About","Version, privacy and reliability information."]
};


function setupVersionTooltip(){const version=chrome.runtime.getManifest().version,tip=`Version ${version}\n• Smarter keyboard and Shift+click selection\n• Unified search: fuzzy, quotes, *, +, -, Boolean logic\n• Rich History auto-contrast and timeline fixes\n• Storage, Collections, and Copy Confirmation polish\n\nSee Full Changelog for the complete changelog.`;document.querySelectorAll(".version-tip").forEach(el=>{el.dataset.tip=tip;el.setAttribute("aria-label",`CopySelect version ${version}`)})}
function consolidateInterface(){
  const historyPage=$("#page-history"),storageCard=historyPage?.querySelector(":scope > .history-storage-card");if(historyPage&&storageCard&&!$("#page-storage")){const storage=document.createElement("section");storage.className="page advanced-only";storage.id="page-storage";storageCard.querySelector(":scope > .history-section-heading")?.remove();storage.append(storageCard);historyPage.before(storage)}
  const general=$("#page-general"),copyCard=general?.querySelector(".stack .card:first-child"),statusCard=general?.querySelector(".stack .card:nth-child(2)"),quick=general?.querySelector(".compact-card");
  if(general){
    const makeGroup=(title,description,keys)=>{const section=document.createElement("section");section.className="card general-section";section.innerHTML=`<header><h2>${title}</h2>${description?`<p>${description}</p>`:""}</header>`;keys.forEach(k=>{const row=$(`[data-key="${k}"]`)?.closest(".row");if(row)section.append(row)});return section};
    const dashboard=document.createElement("div");dashboard.className="general-organized";
    copyCard?.classList.add("general-output");
    const automatic=makeGroup("Automatic copying","",["enabled","selectionTrigger","copyDelayEnabled","minSelectionLength"]);automatic.classList.add("general-master-card");
    const master=automatic.querySelector('[data-key="enabled"]'),masterRow=master?.closest(".row"),masterControl=document.createElement("label");masterControl.className="master-control";if(master){masterControl.append(master);automatic.querySelector("header")?.append(masterControl);masterRow?.remove()}
    const masterSticky=general.querySelector(".general-master-sticky");if(masterSticky){automatic.querySelector("header")?.after(masterSticky)}
    const where=makeGroup("Additional editable areas","Allow automatic copying inside editable controls.",["enableTextBoxes","enableContentEditable","pasteOnMiddleClick"]);where.classList.add("general-scope-card");
    const safeguards=makeGroup("Safeguards & overrides","",["ignoreWhitespaceOnly","duplicateSuppression","enableModifierKey"]);safeguards.classList.add("general-safeguards-card");
    dashboard.append(automatic,copyCard||document.createElement("div"),where,safeguards);
    const transforms=$("#page-formatting .settings-card"),template=$("#page-formatting .card:not(.settings-card)"),metadata=$("#page-metadata .stack");
    if(transforms){transforms.classList.add("advanced-only","general-transform-card");dashboard.append(transforms)}
    if(template&&metadata){template.classList.add("template-copy-card");metadata.prepend(template);const layout=$("#page-metadata .metadata-layout"),preview=layout?.querySelector(".sticky-preview");if(layout){const [builder,meta,beforeAfter,dateTime]=[...metadata.children];meta?.classList.add("template-metadata-card");beforeAfter?.classList.add("template-before-after-card");dateTime?.classList.add("template-date-time-card");preview?.classList.add("template-preview-card");const pills=document.createElement("div");pills.className="token-pills";pills.innerHTML='<span>Quick insert</span>'+[["{text}","Copied text","Insert copied text"],["{title}","Page title","Insert page title"],["{url}","URL","Insert URL\n(https://example.com/page)"],["{domain}","Domain","Insert domain\n(example.com)"],["{date}","Date","Insert date"],["{time}","Time","Insert time\nFormat can be customized below."],["{isoDate}","ISO date","Insert ISO date\n(2026-09-08)"],["{year}","Year","Insert year\n(2026)"],["{wordCount}","Word count","Insert word count"],["{paragraphCount}","Paragraph count","Insert paragraph count"]].map(([token,label,tip])=>`<button type="button" data-token="${token}" title="${tip.replace(/&/g,"&amp;").replace(/"/g,"&quot;")}">${label}</button>`).join("");builder?.querySelector("textarea")?.before(pills);pills.addEventListener("click",e=>{const b=e.target.closest("[data-token]"),area=builder?.querySelector("textarea");if(!b||!area)return;const start=area.selectionStart||0,end=area.selectionEnd||0;area.value=area.value.slice(0,start)+b.dataset.token+area.value.slice(end);area.selectionStart=area.selectionEnd=start+b.dataset.token.length;area.dispatchEvent(new Event("change",{bubbles:true}));area.focus()});layout.classList.add("template-layout","template-simplified");layout.replaceChildren(...[builder,meta,beforeAfter,dateTime,preview].filter(Boolean))}}
    quick?.remove();statusCard?.remove();general.replaceChildren(dashboard);$("#page-behavior")?.remove();$("#page-formatting")?.remove();document.querySelector('[data-page="formatting"]')?.remove();
  }
  const core=$(".feedback-core"),effectsActions=$(".effects-card .card-headline .actions"),cursor=core?.querySelector('[data-key="cursorFeedbackEnabled"]')?.closest("label"),reset=core?.querySelector("#resetAllAppearance");
  if(cursor&&effectsActions){cursor.className="channel-toggle";cursor.innerHTML='<input data-key="cursorFeedbackEnabled" class="toggle" type="checkbox" aria-label="Enable selection feedback">';effectsActions.prepend(cursor)}
  reset?.remove();core?.remove();
  const feedback=$(".feedback-page"),effects=$(".effects-card"),appearance=$(".appearance-card"),screen=appearance?.querySelector(".appearance-section:not(.selection-appearance)"),selection=appearance?.querySelector(".selection-appearance"),preview=$(".preview-card"),sound=$(".sound-card"),position=$(".position-block");
  if(feedback&&effects&&screen&&selection&&preview&&sound){
    const corner=document.createElement("section");corner.className="card corner-card";corner.append(screen);if(position)corner.append(position);
    const cornerReset=screen.querySelector("#resetScreenAppearance"),cornerGrid=screen.querySelector(".corner-message-grid");if(cornerReset&&cornerGrid)cornerGrid.append(cornerReset);
    selection.classList.add("advanced-only","embedded-customization");selection.querySelector("h2").textContent="Customize effect";
    const selectionReset=selection.querySelector("#resetSelectionAppearance"),selectionGrid=selection.querySelector(".selection-grid");if(selectionReset&&selectionGrid&&!selectionReset.closest(".restore-effect-field")){const restoreField=document.createElement("div"),restoreLabel=document.createElement("label");restoreField.className="mini-field restore-effect-field";restoreLabel.textContent="Restore Effects";selectionReset.classList.add("selection-restore-square");restoreField.append(restoreLabel,selectionReset);selectionGrid.append(restoreField)};
    effects.append(selection);
    const controls=document.createElement("div");controls.className="feedback-controls-column";controls.append(effects,corner);
    const previews=document.createElement("div");previews.className="feedback-preview-column";previews.append(preview);controls.append(sound);
    appearance.remove();feedback.replaceChildren(controls,previews);
  }
  const sites=$("#page-sites>.card"),ruleGrid=$(".rule-grid"),addRule=$("#addRule"),ruleHead=$(".rule-list-head"),rulesBody=$("#rulesBody");
  if(sites&&ruleGrid&&addRule&&ruleHead&&rulesBody&&!$(".site-workspace")){
    const fields=[...ruleGrid.children],byId=id=>fields.find(field=>field.querySelector(`#${id}`));
    const pattern=byId("rulePattern"),makeColumn=(title,description,ids)=>{const card=document.createElement("section");card.className="site-rule-column";card.innerHTML=`<header><h3>${title}</h3><p>${description}</p></header>`;ids.map(byId).filter(Boolean).forEach(field=>card.append(field));return card};
    const columns=document.createElement("div");columns.className="site-rule-columns";columns.append(
      makeColumn("Capture & behavior","What to copy and how it’s handled.",["ruleBehavior","ruleMode","ruleContentEditable","ruleTextBoxes","ruleDuplicates","ruleSaveHistory","ruleSourceDetails","ruleAutoCollection"]),
      makeColumn("Selection & timing","When and how selections trigger copying.",["ruleSelectionTrigger","ruleMinLength","ruleDelay","ruleDelayMs","rulePaste"]),
      makeColumn("Feedback & interface","What the user sees and hears.",["ruleEffect","ruleFeedbackStyle","ruleCursorFeedback","ruleScreenFeedback","ruleNotificationDuration","ruleSound","rulePosition"]));
    const soundField=byId("ruleSound");if(soundField&&!soundField.querySelector("#ruleTestSound")){const test=document.createElement("button");test.type="button";test.id="ruleTestSound";test.className="btn site-test-sound";test.textContent="▶  Test sound";soundField.append(test)}
    const editor=document.createElement("section");editor.className="site-editor";if(pattern){pattern.classList.add("site-pattern-field");editor.append(pattern)}editor.append(columns);ruleGrid.remove();
    const list=document.createElement("section");list.className="site-rule-list";const saved=document.createElement("div");saved.className="saved-rules-heading";saved.innerHTML='<h3>Saved rules</h3><p>Overrides summarized below.</p><input id="ruleListSearch" type="search" placeholder="example.com; *.example.com" aria-label="Search saved rules">';ruleHead.remove();list.append(saved,rulesBody);
    const listActions=document.createElement("div");listActions.className="site-rule-actions";addRule.textContent="＋ Add rule";addRule.classList.remove("primary");const editRule=document.createElement("button"),deleteRule=document.createElement("button");editRule.id="editSiteRule";deleteRule.id="deleteSiteRule";editRule.className="btn";editRule.textContent="Edit";editRule.disabled=true;deleteRule.className="btn";deleteRule.textContent="Delete";deleteRule.disabled=true;listActions.append(addRule,editRule,deleteRule);list.append(listActions);const priority=document.createElement("p");priority.className="site-rule-priority-note";priority.textContent="Rules higher in the list take precedence.";list.append(priority);
    const workspace=document.createElement("div");workspace.className="site-workspace";workspace.append(editor,list);sites.append(workspace);
    const footer=document.createElement("div");footer.className="site-rule-footer";footer.innerHTML='<button type="button" class="btn" data-site-action="reset">Reset to defaults</button><span></span><button type="button" class="btn" data-site-action="cancel">Cancel</button><button type="button" class="btn primary" data-site-action="save">Save changes</button>';sites.append(footer);
  }
  const historyToolbar=$(".history-toolbar"),historyPolicy=$(".history-policy-group");if(historyToolbar&&historyPolicy)historyToolbar.prepend(historyPolicy);
  const napNotes={notifications:"You put CopySelect down for a nap. Wake it up from",metadata:"You switched copying off, so the template studio is keeping its little drawers closed. Wake it from",sites:"The lunch rush paused automatic copying. Turn it back on from",profiles:"You turned copying off; your saved workflows are waiting politely. Return to"};["notifications","metadata","sites","profiles"].forEach(name=>{const page=$("#page-"+name);if(page&&!page.querySelector(".copy-disabled-notice")){const note=document.createElement("div");note.className=`copy-disabled-notice note-${name}`;note.innerHTML=`${napNotes[name]} <button type="button">General</button>.`;note.querySelector("button").onclick=()=>openPage("general");page.prepend(note)}});
  const tips={
    "selection-flash":"Briefly recolors the selected words.\nBest when you want confirmation without a new icon.",
    "selection-brackets":"Places an overlay bracket at the start and end of the selection.\nBest for showing the exact copied range.",
    "soft-halo":"A stationary, diffuse glow at the selection endpoint.\nCalmer and less directional than Glow trail.",
    "pulse-ring":"An expanding ring at the selection endpoint.\nBest for a clear, compact visual confirmation.",
    "ripple-check":"An expanding ripple with a check mark.\nBest for a more explicit success signal.",
    "spark":"A small sparkle just above the selection endpoint.\nBest for fast, light confirmation.",
    "copy-badge":"A compact copy icon beside the selected range.\nBest when meaning matters more than motion.",
    "dot-pulse":"A restrained pulsing dot at the endpoint.\nBest for minimal visual feedback.",
    "mini-clipboard":"A small clipboard glyph beside the selection.\nBest when you want an unmistakable copy cue.",
    "glow-trail":"A short directional streak that moves outward from the endpoint.\nMore dynamic than Soft halo, which stays in place.",
    "underline-sweep":"Draws a line beneath the selected words.\nBest when feedback should follow the text itself.",
    "none":"No visual effect beside copied text.\nCorner message and sound can still be used."
  };
  $$(".cursor-effect-grid label").forEach(label=>{const input=label.querySelector("input");label.title=tips[input?.value]||"Selection feedback."});
}
consolidateInterface();
const cornerMaxField=$('[data-key="notificationBoxSize"]')?.closest('.mini-field');if(cornerMaxField)cornerMaxField.style.setProperty('transform','none','important')
const profileExplainer=$("#profileExplainer");if(profileExplainer){[...profileExplainer.children].sort((a,b)=>a.querySelector("b")?.textContent.localeCompare(b.querySelector("b")?.textContent)).forEach(row=>profileExplainer.append(row))}
function syncInheritGlobalTint(){$$('.site-editor select').forEach(select=>{const inherited=select.value==="";select.classList.toggle("inherit-global",inherited);select.dataset.inheritGlobal=inherited?"true":"false"})}
$(".site-editor")?.addEventListener("change",syncInheritGlobalTint);queueMicrotask(syncInheritGlobalTint);
const displayedVersion=globalThis.chrome?.runtime?.getManifest?.().version||"3.7.8.23";if($("#sidebarVersion"))$("#sidebarVersion").textContent=`v${displayedVersion}`;if($(".changelog-version"))$(".changelog-version").textContent=`v${displayedVersion}`;
const recentIcon=$("#historyTabRecent");if(recentIcon){recentIcon.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2"/></svg><span class="sr-only">Recent</span>';recentIcon.title="Show recent clips"}
const lockedPinnedIcon=$("#historyTabPinned");if(lockedPinnedIcon){lockedPinnedIcon.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6l-1 5 3 3v2h-4v7l-1 2-1-2v-7H7v-2l3-3-1-5Z"/></svg><span class="sr-only">Pinned</span>';lockedPinnedIcon.title="Show pinned clips"}
for(const [id,kind,label] of [["historyCompact","compact","Compact"],["historyFull","expanded","Expanded"]]){const button=$("#"+id);if(button){button.innerHTML=`<img class="history-view-reference-icon" src="assets/icons/view-${kind}.png" alt=""><span class="sr-only">${label}</span>`;button.title=`Use ${kind} History view`;button.setAttribute("aria-label",`Use ${kind} History view`)}}
if($("#historyTabPinned")&&!$("#pinnedCount"))$("#historyTabPinned").insertAdjacentHTML("beforeend",'<span id="pinnedCount" class="sr-only">0</span>');
// Normalize the two user-facing format names without changing stored values.
for(const option of $$('option[value="plain"]'))option.textContent="Plain Text";
for(const option of $$('option[value="original"]'))option.textContent="Rich Text";
const terminologyWalker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);for(let node;node=terminologyWalker.nextNode();){node.nodeValue=node.nodeValue.replace(/Plain text/g,"Plain Text").replace(/Rich HTML/g,"Rich Text")}
$("#ruleListSearch")?.addEventListener("input",e=>{const q=e.target.value.trim();$$("#rulesBody .rule-card").forEach(card=>card.classList.toggle("hidden",!copySelectSearchMatches(card.textContent,q))) });

function setupToggleLabels(){document.querySelectorAll('.toggle-state-text').forEach(label=>label.remove())}
setupToggleLabels();
function applyUnifiedIcons(){const icons={pin:'<path d="M9 3l6 6-2 1 3 3-1 1-4-3-1 2-2-2 3-3-2-2 1-1 3 3 1-2z"/>',collection:'<path d="M3 6h6l2 2h10v11H3z"/>',paste:'<path d="M7 4h10v4h3v12H4V8h3V4Zm2 0v6h6V4M9 14h6m-3-3v6"/>',export:'<path d="M12 3v12m-4-4 4 4 4-4M5 19h14"/>',copy:'<path d="M8 8h11v11H8zM5 15H3V3h12v2"/>',delete:'<path d="M4 6h16M9 6V4h6v2m-9 0 1 15h10l1-15M10 10v7m4-7v7"/>',select:'<path d="M5 12l4 4L19 6"/>',add:'<path d="M12 5v14M5 12h14"/>'};document.querySelectorAll('[data-history-action],#historyCollectionsToggle,#pasteStackToggle,#newHistoryCollection').forEach(button=>{const action=button.dataset.historyAction||button.id,kind=action==='select-all'||action==='select-none'||action==='historySelectionToggle'?'select':action==='historyCollectionsToggle'?'collection':action==='pasteStackToggle'?'paste':action==='newHistoryCollection'?'add':action;if(!icons[kind]||button.querySelector('svg,img'))return;button.firstChild&&(button.firstChild.textContent=button.firstChild.textContent.replace(/^[^A-Za-z]+/,''));button.insertAdjacentHTML('afterbegin',`<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true">${icons[kind]}</svg>`)});}
applyUnifiedIcons();

function setupDateTimeTokenPills(){
  const add=(key,tokens)=>{const input=$(`[data-key="${key}"]`),field=input?.closest(".field");if(!input||!field||field.querySelector(".date-time-token-pills"))return;const pills=document.createElement("div");pills.className="token-pills date-time-token-pills hidden";pills.innerHTML='<span>Quick insert</span>'+tokens.map(t=>`<button type="button" data-format-token="${t}">${t}</button>`).join("");pills.addEventListener("click",e=>{const b=e.target.closest("[data-format-token]");if(!b)return;const start=input.selectionStart||0,end=input.selectionEnd||0;input.value=input.value.slice(0,start)+b.dataset.formatToken+input.value.slice(end);input.selectionStart=input.selectionEnd=start+b.dataset.formatToken.length;input.dispatchEvent(new Event("change",{bubbles:true}));input.focus()});field.append(pills)};
  add("dateCustomFormat",["YYYY","YY","MMMM","MMM","MM","DD","D","DDD"]);add("timeCustomFormat",["HH","H","hh","h","mm","ss","A"]);
  const templatePills=$(".template-copy-card .token-pills");if(templatePills&&!templatePills.querySelector('[data-token="{characterCountWithSpaces}"]'))templatePills.insertAdjacentHTML("beforeend",'<button type="button" data-token="{characterCountWithSpaces}" title="Insert character count including spaces">Chars (spaces)</button><button type="button" data-token="{characterCountNoSpaces}" title="Insert character count excluding spaces">Chars (no spaces)</button>');
}
setupDateTimeTokenPills();

const A11Y_NAMES={
  enabled:"Enable CopySelect",copyDelayEnabled:"Enable copy delay",copyDelay:"Copy delay in milliseconds",minSelectionLength:"Selection threshold in characters",duplicateSuppression:"Duplicate suppression",duplicateWindowSeconds:"Duplicate suppression window in seconds",
  copyMode:"Copy mode",enableTextBoxes:"Copy in text fields",enableContentEditable:"Copy in web apps",pasteOnMiddleClick:"Middle-click paste",selectionTrigger:"Selection trigger",ignoreWhitespaceOnly:"Ignore whitespace-only selections",enableModifierKey:"Enable modifier override",modifierKey:"Modifier override key",modifierKeyAction:"Modifier override action",
  trimWhitespace:"Trim whitespace",normalizeWhitespace:"Normalize whitespace",preserveLineBreaks:"Preserve line breaks",removeZeroWidth:"Remove zero-width characters",joinWrappedLines:"Join wrapped lines",linkCopyMode:"Copy mode for links",customTemplate:"Custom copy template",
  includeMetadata:"Enable metadata",metadataPosition:"Metadata block position",metadataSeparator:"Metadata separator",metadataBeforeText:"Text before copied text",metadataAfterText:"Text after copied text",dateFormat:"Date format",dateCustomFormat:"Custom date format",timeFormat:"Time format",timeCustomFormat:"Custom time format",
  cursorFeedbackEnabled:"Enable beside-selection confirmation",screenFeedbackEnabled:"Enable corner message",enableAudioNotification:"Enable sound confirmation",feedbackStyle:"Corner message style",feedbackSymbol:"Corner message symbol",feedbackCustomSymbol:"Custom corner message symbol",feedbackText:"Corner message text",notificationColor:"Corner message background color",notificationTextColor:"Corner message text color",notificationTransparency:"Corner message opacity",feedbackSize:"Corner message text size",notificationFontFamily:"Corner message font",notificationBoxSize:"Corner message maximum width in pixels",notificationDuration:"Corner message duration in milliseconds",
  cursorEffectColor:"Selection effect color",selectionFlashTextColor:"Selection flash text color",cursorEffectOpacity:"Selection effect opacity",cursorEffectSize:"Selection effect size",cursorEffectThickness:"Selection effect thickness",cursorFeedbackDuration:"Selection effect duration in milliseconds",
  historyLimit:"Maximum history entries",historyAutoDelete:"Enable maximum history age",historyAutoDeleteValue:"Maximum history age value",historyAutoDeleteUnit:"Maximum history age unit",historyMinimumKeep:"Minimum history entries to keep",historyKeepPinnedForever:"Protect pinned items",historyHoverDelay:"Auto-expand delay in milliseconds",
  enableTTSHotkey:"Enable read-aloud hotkey",ttsModifierKey:"Read-aloud modifier key",ttsKey:"Read-aloud key",ttsVoice:"Read-aloud voice",ttsRate:"Speech rate",ttsPitch:"Speech pitch",ttsVolume:"Speech volume",statsEnabled:"Enable local usage counters"
};
let a11ySeq=0;
function announceA11y(message,error=false){
  const el=$(error?"#a11yError":"#a11yStatus");if(!el||!message)return;
  el.textContent="";requestAnimationFrame(()=>{el.textContent=String(message)});
}
function directLabelText(el){
  const field=el.closest(".field,.mini-field");
  const label=field?.querySelector(":scope > label");
  return label?.textContent?.replace(/\s+/g," ").trim()||"";
}
function hasAccessibleLabel(el){
  if(el.getAttribute("aria-label")||el.getAttribute("aria-labelledby")||el.closest("label"))return true;
  if(el.id&&document.querySelector(`label[for="${CSS.escape(el.id)}"]`))return true;
  return false;
}
function accessibleControlName(el){
  const key=el.dataset?.key;if(key&&A11Y_NAMES[key])return A11Y_NAMES[key];
  if(el.id==="rulePattern")return "Site or pattern";
  if(el.id==="ruleDelayMs")return "Site rule delay in milliseconds";
  if(el.id==="ruleMinLength")return "Site rule minimum selection length in characters";
  if(el.id==="profileSelect")return "Active profile";
  if(el.id==="newProfile")return "New profile name";
  if(el.id==="historySearch")return "Search clipboard history";
  if(el.id==="historyFilter")return "Filter clipboard history";
  if(el.id==="historySort")return "Sort clipboard history";
  if(el.id==="importFile")return "Choose CopySelect backup file";
  if(el.name==="pos")return el.closest("label")?.title||`Corner message position ${el.value}`;
  return directLabelText(el)||el.closest(".row")?.querySelector(".meta b")?.textContent?.replace("?","").replace(/\s+/g," ").trim()||"";
}
function enhanceControlNames(root=document){
  root.querySelectorAll?.("input,select,textarea").forEach(el=>{
    if(el.getAttribute("aria-hidden")==="true")return;
    if(el.name==="pos"){el.setAttribute("aria-label",el.closest("label")?.title||`Corner message position ${el.value}`);return}
    if(hasAccessibleLabel(el))return;
    const name=accessibleControlName(el);if(name)el.setAttribute("aria-label",name);
    const row=el.closest(".row"),help=row?.querySelector(".meta small");
    if(help&&!el.getAttribute("aria-describedby")){
      if(!help.id)help.id=`a11y-help-${++a11ySeq}`;
      el.setAttribute("aria-describedby",help.id);
    }
  });
  root.querySelectorAll?.(".help[data-tip]").forEach(help=>{
    const context=help.closest("b,h2,label")?.textContent?.replace("?","").replace(/\s+/g," ").trim()||"Setting";
    if(help.dataset.a11yHelp==="1")return;
    help.dataset.a11yHelp="1";
    const tip=document.createElement("span");
    tip.className="sr-only a11y-tooltip-text";
    tip.id=`a11y-tooltip-${++a11ySeq}`;
    tip.setAttribute("role","tooltip");
    tip.textContent=help.dataset.tip.trim();
    help.after(tip);
    help.setAttribute("role","button");
    help.setAttribute("aria-label",`${context} help`);
    help.setAttribute("aria-describedby",tip.id);
    help.setAttribute("aria-expanded","false");
    const close=()=>{help.classList.remove("tip-open");help.setAttribute("aria-expanded","false")};
    const toggle=()=>{const open=!help.classList.contains("tip-open");help.classList.toggle("tip-open",open);help.setAttribute("aria-expanded",String(open))};
    help.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();toggle()});
    help.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();toggle()}else if(e.key==="Escape"){e.preventDefault();close()}});
    help.addEventListener("blur",close);
  });
  root.querySelectorAll?.('input[name="pos"]').forEach(el=>{if(!el.getAttribute("aria-label"))el.setAttribute("aria-label",el.closest("label")?.title||el.value)});
}
function markValidation(el){
  if(!(el instanceof HTMLInputElement)&&!(el instanceof HTMLSelectElement)&&!(el instanceof HTMLTextAreaElement))return;
  if(el.disabled||el.type==="range"||el.type==="checkbox"||el.type==="radio"||el.type==="file")return;
  let error=el.parentElement?.querySelector(`.a11y-field-error[data-for="${el.id||el.dataset.key||"control"}"]`);
  const invalid=!el.validity.valid;
  el.toggleAttribute("aria-invalid",invalid);
  if(!invalid){error?.remove();el.removeAttribute("aria-errormessage");return}
  if(!error){error=document.createElement("span");error.className="a11y-field-error";error.dataset.for=el.id||el.dataset.key||"control";error.id=`a11y-error-${++a11ySeq}`;el.insertAdjacentElement("afterend",error)}
  error.textContent=el.validationMessage||"Enter a valid value.";el.setAttribute("aria-errormessage",error.id);
}
const floatingMenuOrigins=new WeakMap();
function positionFloatingMenu(trigger,menu,{align="left",gap=4}={}){
  if(!trigger||!menu||menu.classList.contains("hidden"))return;
  const tr=trigger.getBoundingClientRect(),mr=menu.getBoundingClientRect(),pad=8;
  let left=align==="right"?tr.right-mr.width:align==="center"?tr.left+(tr.width-mr.width)/2:tr.left;
  left=Math.max(pad,Math.min(left,window.innerWidth-mr.width-pad));
  let top=tr.bottom+gap;
  if(top+mr.height>window.innerHeight-pad&&tr.top-mr.height-gap>=pad)top=tr.top-mr.height-gap;
  top=Math.max(pad,Math.min(top,window.innerHeight-mr.height-pad));
  Object.assign(menu.style,{position:"fixed",left:`${Math.round(left)}px`,top:`${Math.round(top)}px`,right:"auto",bottom:"auto",transform:"none",zIndex:"2147483000",visibility:"visible"});
}
function openFloatingMenu(trigger,menu,opts={}){
  if(!trigger||!menu)return;
  document.querySelectorAll('.floating-ui-menu:not(.hidden)').forEach(other=>{if(other!==menu){const origin=floatingMenuOrigins.get(other);closeFloatingMenu(origin?.trigger,other)}});
  if(!floatingMenuOrigins.has(menu))floatingMenuOrigins.set(menu,{parent:menu.parentNode,next:menu.nextSibling,trigger,opts});
  const origin=floatingMenuOrigins.get(menu);origin.trigger=trigger;origin.opts=opts;
  menu.classList.add("floating-ui-menu");
  document.body.append(menu);
  menu.classList.remove("hidden");
  trigger.setAttribute("aria-expanded","true");
  positionFloatingMenu(trigger,menu,opts);
}
function closeFloatingMenu(trigger,menu){
  if(!menu)return;
  menu.classList.add("hidden");
  const origin=floatingMenuOrigins.get(menu);
  const actualTrigger=trigger||origin?.trigger;
  actualTrigger?.setAttribute("aria-expanded","false");
  if(origin?.parent?.isConnected){
    if(origin.next?.parentNode===origin.parent)origin.parent.insertBefore(menu,origin.next);else origin.parent.append(menu);
  }else if(origin){menu.remove()}
  menu.classList.remove("floating-ui-menu");
  for(const prop of ["position","left","top","right","bottom","transform","zIndex","visibility"])menu.style.removeProperty(prop);
  floatingMenuOrigins.delete(menu);
}
window.addEventListener("resize",()=>document.querySelectorAll('.floating-ui-menu:not(.hidden)').forEach(menu=>{const o=floatingMenuOrigins.get(menu);positionFloatingMenu(o?.trigger,menu,o?.opts||{})}));
window.addEventListener("scroll",()=>document.querySelectorAll('.floating-ui-menu:not(.hidden)').forEach(menu=>{const o=floatingMenuOrigins.get(menu);positionFloatingMenu(o?.trigger,menu,o?.opts||{})}),true);
function wireDisclosureKeyboard(toggle,menu){
  if(!toggle||!menu||toggle.dataset.a11yMenu==="1")return;toggle.dataset.a11yMenu="1";
  toggle.addEventListener("keydown",e=>{if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();if(menu.classList.contains("hidden"))toggle.click();const items=[...menu.querySelectorAll("button:not(:disabled)")];(e.key==="ArrowUp"?items.at(-1):items[0])?.focus()}else if(e.key==="Escape"&&!menu.classList.contains("hidden")){e.preventDefault();toggle.click();toggle.focus()}});
  menu.addEventListener("keydown",e=>{const items=[...menu.querySelectorAll("button:not(:disabled)")],i=items.indexOf(document.activeElement);if(e.key==="Escape"){e.preventDefault();closeFloatingMenu(toggle,menu);toggle.focus();return}if(!items.length)return;if(["ArrowDown","ArrowUp","Home","End"].includes(e.key)){e.preventDefault();let next=0;if(e.key==="End")next=items.length-1;else if(e.key==="Home")next=0;else if(e.key==="ArrowDown")next=(i+1+items.length)%items.length;else next=(i-1+items.length)%items.length;items[next].focus()}});
}
function setupAccessibility(){
  enhanceControlNames();
  [["historySelectionToggle","historySelectionActions"],["historyCollectionsToggle","historyCollectionsMenu"],["pasteStackToggle","pasteStackMenu"]].forEach(([a,b])=>wireDisclosureKeyboard($("#"+a),$("#"+b)));
  ["historySelectionActions","historyCollectionsMenu","pasteStackMenu"].forEach(id=>$("#"+id)?.querySelectorAll("button").forEach(b=>b.setAttribute("role","menuitem")));
  document.addEventListener("change",e=>{if(e.target.matches?.('input[type="number"],input[type="text"],textarea,select')){markValidation(e.target);if(e.target.getAttribute("aria-invalid")==="true")announceA11y(`${accessibleControlName(e.target)||"Setting"}: ${e.target.validationMessage||"Enter a valid value."}`,true)}},true);
  document.addEventListener("input",e=>{if(e.target.matches?.('input[type="number"],input[type="text"],textarea'))markValidation(e.target)},true);
}
setupAccessibility();

function openPage(name){
  let btn=$(`.nav button[data-page="${name}"]`);
  if(!btn)return;
  if(state?.settingsViewMode==="simple"&&btn.classList.contains("advanced-only")){
    state.settingsViewMode="advanced";
    chrome.storage.sync.set({settingsViewMode:"advanced"}).catch(()=>{});
    applySettingsMode();
  }
  btn=$(`.nav button[data-page="${name}"]`);if(!btn)return;
  $$(".nav button").forEach(x=>{x.classList.remove("active");x.removeAttribute("aria-current")});btn.classList.add("active");btn.setAttribute("aria-current","page");
  $$(".page").forEach(x=>x.classList.remove("active"));$("#page-"+name)?.classList.add("active");
  if(name!=="notifications")restoreSelectionSample();
  $("#pageTitle").textContent=pageTitles[name][0];$("#pageDesc").textContent=pageTitles[name][1];announceA11y(`${pageTitles[name][0]}. ${pageTitles[name][1]}`);
  history.replaceState(null,"","#"+name);
}

async function load(){
  const sync=await chrome.storage.sync.get(null);
  const runtime=await safeMessage({action:"runtimeData"});
  state=normalizeSettings({...sync,...((runtime&&runtime.history)?runtime:{})});
  if(state.historyAutoDelete){const pruned=await safeMessage({action:"pruneHistory"});if(pruned?.history){state.history=pruned.history;state.pinned=pruned.pinned||state.pinned}}
  bindState();renderRules();renderProfiles();renderHistory();renderOrganizationHub();refreshStatus();updatePreview();populateVoices();
  const hash=location.hash.replace("#","");if(pageTitles[hash])openPage(hash);
}

function bindState(){
  $$("[data-key]").forEach(el=>{
    const k=el.dataset.key,v=state[k];
    if(el.type==="checkbox")el.checked=!!v;
    else if(k==="metadataSeparator"){
      const map={"\\n":"\n","\\n\\n":"\n\n","\\t":"\t"};
      el.value=[...el.options].some(o=>o.value===v)?v:(Object.keys(map).find(x=>map[x]===v)||"\\n");
    }else el.value=v??"";
  });
  $$('input[name="pos"]').forEach(r=>r.checked=r.value===state.notificationPosition);
  $$('input[name="cursorEffect"]').forEach(r=>r.checked=r.value===state.cursorEffect);
  if($("#smartTagSuggestionMode"))$("#smartTagSuggestionMode").value=state.smartTagSuggestionMode||"suggest";
  if($("#smartTagAutoThreshold"))$("#smartTagAutoThreshold").value=state.smartTagAutoThreshold||90;
  if($("#smartTagLearningEnabled"))$("#smartTagLearningEnabled").checked=state.smartTagLearningEnabled!==false;
  applySettingsMode();updateValueLabels();updateMetadataPreview();updateDependencies();renderUsageStats();renderTemplateLibrary();
}
function renderUsageStats(){
  const stats=state?.stats||{},all=[...(state?.history||[]),...(state?.pinned||[])],unique=new Map(all.map(x=>[x.id||`${x.ts}:${x.text}`,x])),entries=[...unique.values()],days=new Map(),sites=new Map();let words=0,longest=0;
  for(const h of entries){const text=String(h.rawText??h.text??""),day=new Date(h.ts||0).toLocaleDateString();days.set(day,(days.get(day)||0)+(Number(h.repeatCount)||1));words+=text.trim().split(/\s+/).filter(Boolean).length;longest=Math.max(longest,text.length);try{const site=new URL(h.url).hostname;sites.set(site,(sites.get(site)||0)+(Number(h.repeatCount)||1))}catch{}}
  const busiest=[...days.entries()].sort((a,b)=>b[1]-a[1])[0],topSite=[...sites.entries()].sort((a,b)=>b[1]-a[1])[0];
  const currentWeek=stats.weekKey===copySelectWeekKey()?(stats.weeklyCopies||0):0,allTime=[["Copies",stats.totalCopies||0],["Characters",stats.charsCopied||0],["This week",currentWeek],["Repeated copies",stats.repeatCopies||0],["History re-copies",stats.historyRecopies||0],["Paste Stack uses",stats.pasteStackUses||0]],saved=[["Saved items",entries.length],["Words",words],["Sites",sites.size],["Active days",days.size],["Pinned",state?.pinned?.length||0],["Avg. words / saved copy",entries.length?(words/entries.length).toFixed(1):0],["Longest saved copy",longest?`${longest.toLocaleString()} chars`:"—"],["Top site",topSite?topSite[0]:"—"],["Busiest day",busiest?`${busiest[0]} · ${busiest[1]}`:"—"]],renderItems=items=>items.map(([label,value])=>`<div class="usage-stat"><dt>${label}</dt><dd>${typeof value==="number"?value.toLocaleString():value}</dd></div>`).join(""),box=$("#usageStats");if(box)box.innerHTML=`<section class="usage-group"><h3>All-time activity</h3><dl>${renderItems(allTime)}</dl></section><section class="usage-group"><h3>Saved in History</h3><dl>${renderItems(saved)}</dl></section>`;const usageState=$(".usage-toggle-state");if(usageState)usageState.textContent=state?.statsEnabled?"On":"Off"
}
function updateDependencies(){
  const disable=(key,on)=>{const el=$(`[data-key="${key}"]`);if(el)el.disabled=!!on};
  $(".history-retention-panel")?.classList.toggle("history-storage-off",!state.historyEnabled);
  $$(".history-retention-panel input,.history-retention-panel select,.history-retention-panel button").forEach(el=>{if(el.dataset.key!=="historyEnabled"&&el.id!=="clearHistory")el.disabled=!state.historyEnabled});
  $$(".history-auto-delete-controls input,.history-auto-delete-controls select").forEach(el=>el.disabled=!state.historyEnabled||!state.historyAutoDelete);
  const dependentPages=["notifications","metadata","sites","profiles"];
  const general=$("#page-general .general-organized");general?.classList.toggle("master-disabled",!state.enabled);general?.querySelectorAll('[data-key]:not([data-key="enabled"])').forEach(el=>el.disabled=!state.enabled);
  dependentPages.forEach(name=>{const page=$("#page-"+name);if(!page)return;page.classList.toggle("copying-disabled",!state.enabled);page.querySelectorAll("input,select,textarea,button").forEach(el=>{if(!el.closest(".copy-disabled-notice"))el.disabled=!state.enabled})});
  disable("historyHoverDelay",!state.historyEnabled);
  if(!state.enabled)return;
  disable("copyDelay",!state.copyDelayEnabled);disable("duplicateWindowSeconds",!state.duplicateSuppression);
  $(`[data-key="copyDelay"]`)?.closest(".control-inline")?.classList.toggle("dependent-off",!state.copyDelayEnabled);
  $(`[data-key="duplicateWindowSeconds"]`)?.closest(".control-inline")?.classList.toggle("dependent-off",!state.duplicateSuppression);
  disable("modifierKey",!state.enableModifierKey);disable("modifierKeyAction",!state.enableModifierKey);
  disable("dateCustomFormat",state.dateFormat!=="custom");disable("timeCustomFormat",state.timeFormat!=="custom");
  $$(".metadata-dependent input,.metadata-dependent select,.metadata-checks input,.metadata-checks label").forEach(el=>{el.disabled=!state.includeMetadata;el.closest("label")?.classList.toggle("is-disabled",!state.includeMetadata)});
  $(".metadata-dependent")?.classList.toggle("is-disabled",!state.includeMetadata);
  $(`[data-key="dateCustomFormat"]`)?.closest(".field")?.querySelector(".date-time-token-pills")?.classList.toggle("hidden",state.dateFormat!=="custom");
  $(`[data-key="timeCustomFormat"]`)?.closest(".field")?.querySelector(".date-time-token-pills")?.classList.toggle("hidden",state.timeFormat!=="custom");
  const dateInput=$(`[data-key="dateCustomFormat"]`),timeInput=$(`[data-key="timeCustomFormat"]`);if(dateInput)dateInput.placeholder=state.dateFormat==="custom"?"Use tokens below: DD/MM/YYYY":"DD/MM/YYYY";if(timeInput)timeInput.placeholder=state.timeFormat==="custom"?"Use tokens below: HH:mm":"HH:mm";
  ["ttsVoice","ttsModifierKey","ttsKey","ttsRate","ttsPitch","ttsVolume"].forEach(k=>disable(k,!state.enableTTSHotkey));
  const screen=$(".appearance-section:not(.selection-appearance)"),selection=$(".selection-appearance"),sound=$(".sound-card"),effects=$(".effects-card");
  screen?.classList.toggle("channel-off",!state.screenFeedbackEnabled);selection?.classList.toggle("channel-off",!state.cursorFeedbackEnabled);effects?.classList.toggle("channel-off",!state.cursorFeedbackEnabled);sound?.classList.toggle("channel-off",!state.enableAudioNotification);
  const custom=$(".custom-symbol-input");if(custom){custom.classList.toggle("hidden",state.feedbackSymbol!=="custom");custom.disabled=state.feedbackSymbol!=="custom"||!state.screenFeedbackEnabled}
}
function updateRangeFills(){
  $$('input[type="range"]').forEach(el=>{const min=Number(el.min||0),max=Number(el.max||100),value=Number(el.value||min),pct=Math.max(0,Math.min(100,((value-min)/(max-min))*100));el.style.setProperty("--range-fill",`${pct}%`)});
}
function updateValueLabels(){
  // The number boxes beside ranges are the current values; keep the final label
  // as a unit only so a value is never duplicated or stacked in a narrow card.
  if($("#feedbackSizeValue"))$("#feedbackSizeValue").textContent="px";
  if($("#screenOpacityValue"))$("#screenOpacityValue").textContent="%";
  if($("#cursorSizeValue"))$("#cursorSizeValue").textContent="px";
  if($("#cursorOpacityValue"))$("#cursorOpacityValue").textContent="%";
  if($("#cursorDurationValue"))$("#cursorDurationValue").textContent="ms";
  updateRangeFills();
}
const numericKeys=new Set(["copyDelay","minSelectionLength","duplicateWindowSeconds","notificationDuration","notificationTransparency","feedbackSize","notificationBoxSize","cursorFeedbackDuration","cursorEffectOpacity","cursorEffectSize","cursorEffectThickness","ttsRate","ttsPitch","ttsVolume","historyMinimumKeep","historyLimit","historyAutoDeleteValue","historyHoverDelay"]);
async function persist(k,v){
  if(numericKeys.has(k))v=Number(v);
  if(k==="metadataSeparator")v={"\\n":"\n","\\n\\n":"\n\n","\\t":"\t"}[v]??v;
  const previous=state[k],normalized=normalizeSettings({...state,[k]:v});
  if(Object.prototype.hasOwnProperty.call(CS_DEFAULTS,k))v=normalized[k];
  state[k]=v;
  const syncControls=()=>$$(`[data-key="${k}"]`).forEach(el=>{if(el.type==="checkbox")el.checked=!!state[k];else if(el.value!==String(state[k]))el.value=state[k]});
  syncControls();
  const patch={[k]:v};
  if(["cursorFeedbackEnabled","screenFeedbackEnabled","enableAudioNotification"].includes(k)){
    const visual=state.cursorFeedbackEnabled||state.screenFeedbackEnabled,sound=state.enableAudioNotification;
    state.notificationMode=visual?(sound?"visual-sound":"visual"):(sound?"sound":"none");
    patch.notificationMode=state.notificationMode;
  }
  try{await chrome.storage.sync.set(patch)}catch(err){state[k]=previous;syncControls();throw err}
  refreshStatus();updatePreview();updateMetadataPreview();updateDependencies();
}
function applySettingsMode(){
  const simple=(state?.settingsViewMode||"simple")==="simple";
  document.body.classList.toggle("simple-mode",simple);
  document.body.classList.toggle("advanced-mode",!simple);
  $("#modeSimple")?.classList.toggle("active",simple);$("#modeSimple")?.setAttribute("aria-pressed",String(simple));
  $("#modeAdvanced")?.classList.toggle("active",!simple);$("#modeAdvanced")?.setAttribute("aria-pressed",String(!simple));
  const metadataNav=$('[data-page="metadata"]');if(metadataNav)metadataNav.textContent=simple?"Metadata":"Metadata & Templates";
  pageTitles.metadata=simple?["Metadata","Add basic source details, before/after text, and date or time."]:["Metadata & Templates","Build a reusable template, format date and time, and verify the resolved result."];
  if($("#page-metadata")?.classList.contains("active")){$("#pageTitle").textContent=pageTitles.metadata[0];$("#pageDesc").textContent=pageTitles.metadata[1]}
}
async function setSettingsMode(mode){
  state.settingsViewMode=mode;await chrome.storage.sync.set({settingsViewMode:mode});applySettingsMode();announceA11y(`${mode==="simple"?"Simple":"Advanced"} settings mode`);
  if(mode==="simple"&&$(".nav button.active")?.classList.contains("advanced-only"))openPage("general");
}
$("#modeSimple")?.addEventListener("click",()=>setSettingsMode("simple"));
$("#modeAdvanced")?.addEventListener("click",()=>setSettingsMode("advanced"));
$("#openAdvancedEffects")?.addEventListener("click",()=>setSettingsMode("advanced"));
$("#openAdvancedHistory")?.addEventListener("click",async e=>{e.preventDefault();await setSettingsMode("advanced");openPage("storage")});
$("#sideMaster")?.addEventListener("change",e=>persist("enabled",e.target.checked));

$$("[data-key]").forEach(el=>{
  if(el.dataset.key==="feedbackStyle")return;
  el.addEventListener(el.type==="range"?"input":"change",e=>persist(el.dataset.key,el.type==="checkbox"?el.checked:el.value));
});
document.querySelector('[data-key="copyMode"]')?.addEventListener("change",()=>updatePreview());
document.querySelector('[data-key="enabled"]')?.addEventListener("change",e=>{state.enabled=e.target.checked;updateDependencies();refreshStatus()});
[["dateCustomFormat","dateFormat"],["timeCustomFormat","timeFormat"]].forEach(([input,key])=>$(`[data-key="${input}"]`)?.addEventListener("focus",()=>{if(state[key]!=="custom")persist(key,"custom")}));
$("#feedbackStyle")?.addEventListener("change",async e=>{
  const style=e.target.value,patch={feedbackStyle:style,...(CS_SCREEN_STYLE_DEFAULTS[style]||CS_SCREEN_DEFAULTS)};
  await applyPatch(patch);
});
$$('[data-corner-style]').forEach(button=>button.addEventListener('click',async()=>{
  const value=button.dataset.cornerStyle;
  const select=$('[data-key="notificationFontStyle"]');
  if(select)select.value=value;
  await persist('notificationFontStyle',value);
  $$('[data-corner-style]').forEach(item=>item.classList.toggle('active',item===button));
  closeFloatingMenu($("#cornerTextStyleButton"),$("#cornerTextStyleMenu"));
}));
$("#cornerTextStyleButton")?.addEventListener("click",e=>{e.stopPropagation();const menu=$("#cornerTextStyleMenu"),button=$("#cornerTextStyleButton");if(!menu||!button)return;if(menu.classList.contains("hidden"))openFloatingMenu(button,menu,{align:"center"});else closeFloatingMenu(button,menu)});
function pulsePositionPreview(pos){
  const stage=$("#previewStage"),pill=$("#notifyPreview");if(!stage||!pill)return;
  const [v,h]=String(pos||"bottom-right").split("-"),xs={left:"7%",center:"50%",right:"93%"},ys={top:"8%",center:"50%",bottom:"92%"};
  stage.style.setProperty("--position-x",xs[h]||xs.right);stage.style.setProperty("--position-y",ys[v]||ys.bottom);
  stage.classList.remove("position-pulse");void stage.offsetWidth;stage.classList.add("position-pulse");
  previewPos(pill,pos);pill.style.display="flex";pill.classList.add("position-message-preview");clearTimeout(previewTimer);
  previewTimer=setTimeout(()=>{pill.classList.remove("position-message-preview");stage.classList.remove("position-pulse");pill.style.display="none"},Math.max(900,state.notificationDuration||1000));
}
$$('input[name="pos"]').forEach(r=>r.addEventListener("change",async e=>{await persist("notificationPosition",e.target.value);pulsePositionPreview(e.target.value)}));
$$('input[name="cursorEffect"]').forEach(r=>r.addEventListener("change",async e=>{
  const effect=e.target.value,patch={cursorEffect:effect,...(CS_EFFECT_DEFAULTS[effect]||CS_EFFECT_DEFAULTS["selection-flash"])};
  await applyPatch(patch);pulsePreview(true);
}));
$$(".nav button").forEach(b=>b.onclick=()=>openPage(b.dataset.page));
$("#jumpHistory")?.addEventListener("click",()=>openPage("history"));

function copySelectSearchMatches(text,query){
  const q=String(query||"").trim();if(!q)return true;
  try{
    if(globalThis.CopySelectSmartCore?.compileQuery)return CopySelectSmartCore.compileQuery(q).test({text:String(text||"")});
  }catch{}
  return String(text||"").toLowerCase().includes(q.toLowerCase());
}
const settingsSearch=$("#search"),searchResults=document.createElement("div");searchResults.id="settingsSearchResults";searchResults.className="settings-search-results hidden";settingsSearch?.setAttribute("aria-controls",searchResults.id);settingsSearch?.setAttribute("aria-expanded","false");settingsSearch?.after(searchResults);
settingsSearch?.addEventListener("input",e=>{const q=e.target.value.trim();if(!q){searchResults.classList.add("hidden");searchResults.innerHTML="";settingsSearch.setAttribute("aria-expanded","false");return}const matches=[];$$('.page').forEach(page=>{page.querySelectorAll('.row,.field,.card h2,.history-setting,.history-limit,.helper-list>div,.profile-explainer>div,.site-rule-list').forEach(el=>{const text=el.textContent.replace(/\s+/g,' ').trim();if(text.length&&copySelectSearchMatches(text,q))matches.push({page:page.id.replace('page-',''),text:text.slice(0,110),el})})});const unique=matches.filter((m,i,a)=>a.findIndex(x=>x.page===m.page&&x.text===m.text)===i).slice(0,14);searchResults.innerHTML=unique.length?unique.map((m,i)=>`<button type="button" data-search-index="${i}"><b>${htmlEscape(pageTitles[m.page]?.[0]||m.page)}</b><span>${htmlEscape(m.text)}</span></button>`).join(''):'<div class="search-empty">No settings found.</div>';searchResults.classList.remove('hidden');settingsSearch.setAttribute('aria-expanded','true');announceA11y(`${unique.length} setting${unique.length===1?'':'s'} found`);searchResults.onclick=ev=>{const i=Number(ev.target.closest('[data-search-index]')?.dataset.searchIndex);if(!Number.isInteger(i)||!unique[i])return;openPage(unique[i].page);searchResults.classList.add('hidden');settingsSearch.setAttribute('aria-expanded','false');settingsSearch.value='';unique[i].el.scrollIntoView({behavior:'smooth',block:'center'});unique[i].el.classList.add('search-hit');setTimeout(()=>unique[i].el.classList.remove('search-hit'),1400)}});
settingsSearch?.addEventListener("keydown",e=>{if(e.key==="Escape"&&!searchResults.classList.contains("hidden")){e.preventDefault();searchResults.classList.add("hidden");settingsSearch.setAttribute("aria-expanded","false");searchResults.innerHTML=""}else if(e.key==="ArrowDown"&&!searchResults.classList.contains("hidden")){e.preventDefault();searchResults.querySelector("button")?.focus()}});
$$("[data-pause]").forEach(b=>b.onclick=async()=>{
  const v=b.dataset.pause;
  if(v==="restart"){state.pauseUntilRestart=true;state.pausedUntil=0}
  else{state.pauseUntilRestart=false;state.pausedUntil=Date.now()+Number(v)*60000}
  await chrome.storage.sync.set({pauseUntilRestart:state.pauseUntilRestart,pausedUntil:state.pausedUntil});refreshStatus();
});
$("#resumeBtn")?.addEventListener("click",async()=>{
  state.pauseUntilRestart=false;state.pausedUntil=0;
  await chrome.storage.sync.set({pauseUntilRestart:false,pausedUntil:0});refreshStatus();
});
function refreshStatus(){
  if(!state)return;
  const paused=state.pauseUntilRestart||(state.pausedUntil>Date.now()),active=state.enabled&&!paused;
  const side=$("#sideStatus");if(side){side.querySelector("span").textContent=active?"CopySelect active":"CopySelect paused";side.querySelector("input").checked=!!state.enabled;side.style.background=active?"#123b2b":"#4a2f17";side.style.color=active?"#86efac":"#fdba74"}
  const master=$(".master-control");if(master){const text=master.querySelector("span");if(text)text.textContent=state.enabled?"On":"Off"}
  if($("#statusText"))$("#statusText").textContent=active?"CopySelect is active and ready.":"CopySelect is disabled or temporarily paused.";
}
function previewPos(el,pos){
  el.style.top=el.style.right=el.style.bottom=el.style.left="auto";el.style.transform="none";
  const [v,h]=String(pos||"bottom-right").split("-");
  if(v==="top")el.style.top="8px";else if(v==="center")el.style.top="50%";else el.style.bottom="8px";
  if(h==="left")el.style.left="8px";else if(h==="center")el.style.left="50%";else el.style.right="8px";
  el.style.transform=`translate(${h==="center"?"-50%":"0"},${v==="center"?"-50%":"0"})`;
}
function symbolGlyph(name){
  if(name==="none")return "\u00A0";
  if(name==="custom")return String(state?.feedbackCustomSymbol||"✨").trim().slice(0,4)||"✨";
  return {check:"✓",copy:"⧉",clipboard:"▣",sparkle:"✦",star:"★",dot:"●",plus:"+",lightning:"⚡",circle:"◉",slash:"／",halo:"◌",arrow:"➜",heart:"♥",diamond:"◆",bracket:"[ ]",tick:"✔",burst:"✧",square:"■",ring:"◎"}[name]||"✓";
}
function effectGlyph(effect){
  return {"ripple-check":"✓","spark":"✦","copy-badge":"⧉","dot-pulse":"●","mini-clipboard":"▣"}[effect]||"";
}
function effectPreviewClass(effect){
  if(effect==="selection-flash")return "fx-flash";
  if(effect==="selection-brackets")return "fx-brackets";
  if(effect==="soft-halo")return "fx-halo";
  if(effect==="pulse-ring"||effect==="ripple-check")return "fx-ring";
  if(["spark","copy-badge","dot-pulse","mini-clipboard"].includes(effect))return "fx-glyph";
  if(effect==="glow-trail")return "fx-trail";
  if(effect==="underline-sweep")return "fx-underline";
  return "";
}
function positionSelectionPreviewNode(){
  const stage=$("#previewStage"),sel=$("#selectionPreview"),c=$("#cursorPreview"),start=$("#previewBracketStart"),end=$("#previewBracketEnd");
  if(!stage||!sel||!c)return;
  const sr=stage.getBoundingClientRect();let rr=sel.getBoundingClientRect();
  // When the user manually selects sample text, preview the effect at that real
  // selection rather than snapping back to the canned phrase.
  if(stage.classList.contains("manual-preview")){
    const live=globalThis.getSelection?.();
    if(live?.rangeCount&&!live.isCollapsed){
      const range=live.getRangeAt(0),node=range.commonAncestorContainer.nodeType===1?range.commonAncestorContainer:range.commonAncestorContainer.parentElement;
      if(node&&stage.contains(node)){const liveRect=range.getBoundingClientRect();if(liveRect.width>0&&liveRect.height>0)rr=liveRect}
    }
  }
  const pad=Math.max(18,(state?.cursorEffectSize||22)*.7),mid=rr.top-sr.top+rr.height/2;
  c.style.left=`${Math.min(stage.clientWidth-pad,Math.max(pad,rr.right-sr.left+6))}px`;
  c.style.top=`${Math.min(stage.clientHeight-pad,Math.max(pad,mid))}px`;
  if(start&&end){
    const size=Math.max(16,state?.cursorEffectSize||22),outside=Math.max(5,size*.18);
    start.style.left=`${Math.max(size*.35,rr.left-sr.left-outside)}px`;start.style.top=`${mid}px`;
    end.style.left=`${Math.min(stage.clientWidth-size*.35,rr.right-sr.left+outside)}px`;end.style.top=`${mid}px`;
    start.style.fontSize=end.style.fontSize=`${size}px`;
  }
}
function updatePreview(){
  const p=$("#notifyPreview");if(!p||!state)return;
  p.style.background=state.notificationColor;p.style.color=state.notificationTextColor;
  p.style.opacity=state.notificationTransparency/100;p.style.fontSize=state.feedbackSize+"px";
  p.style.setProperty("--message-opacity",String(state.notificationTransparency/100));
  p.style.maxWidth=state.notificationBoxSize+"px";p.style.borderRadius=state.notificationPreset==="square"?"7px":"999px";
  p.style.fontFamily=state.notificationFontFamily||"system-ui";p.style.fontWeight="650";p.style.fontStyle="normal";p.style.textDecoration="none";
  const previewText=$("#previewText"),previewSymbol=$("#previewSymbol");
  previewText.textContent=state.feedbackText||"Copied";previewText.style.fontWeight=state.notificationFontStyle==="bold"?"800":"650";previewText.style.fontStyle=state.notificationFontStyle==="italic"?"italic":"normal";previewText.style.textDecoration=state.notificationFontStyle==="underline"?"underline":"none";
  previewSymbol.textContent=symbolGlyph(state.feedbackSymbol);previewSymbol.style.fontWeight="800";previewSymbol.style.fontStyle="normal";previewSymbol.style.textDecoration="none";
  const inline=$("#cornerInlinePreview"),inlineSymbol=$("#cornerInlineSymbol"),inlineText=$("#cornerInlineText");if(inline){inline.style.background=state.notificationColor;inline.style.color=state.notificationTextColor;inline.style.opacity=state.notificationTransparency/100;inline.style.fontSize=state.feedbackSize+"px";inline.style.fontFamily=state.notificationFontFamily||"system-ui";inline.style.fontWeight="650";inline.style.fontStyle="normal";inline.style.textDecoration="none";inline.style.borderRadius=state.notificationPreset==="square"?"7px":"999px";inline.style.maxWidth=state.notificationBoxSize+"px";inline.classList.toggle("off",!state.screenFeedbackEnabled)}if(inlineSymbol){inlineSymbol.textContent=symbolGlyph(state.feedbackSymbol);inlineSymbol.style.fontWeight="800";inlineSymbol.style.fontStyle="normal";inlineSymbol.style.textDecoration="none"}if(inlineText){inlineText.textContent=state.feedbackText||"Copied";inlineText.style.display=state.feedbackStyle==="icon"?"none":"inline";inlineText.style.fontWeight=state.notificationFontStyle==="bold"?"800":"650";inlineText.style.fontStyle=state.notificationFontStyle==="italic"?"italic":"normal";inlineText.style.textDecoration=state.notificationFontStyle==="underline"?"underline":"none"}$$('[data-corner-style]').forEach(button=>button.classList.toggle('active',button.dataset.cornerStyle===state.notificationFontStyle));const styleGlyph=$("#cornerTextStyleGlyph");if(styleGlyph)styleGlyph.textContent=({normal:"",bold:"B",underline:"U",italic:"I"}[state.notificationFontStyle]||"");
  $("#previewText").style.display=state.feedbackStyle==="icon"?"none":"inline";
  p.style.display="none";
  previewPos(p,state.notificationPosition||"bottom-right");

  const stage=$("#previewStage"),c=$("#cursorPreview");
  if(stage){
    stage.style.setProperty("--fx",state.cursorEffectColor||"#4f7cff");
    const alpha=Math.round((state.cursorEffectOpacity??70)*2.55).toString(16).padStart(2,"0");
    stage.style.setProperty("--fxA",`${state.cursorEffectColor||"#4f7cff"}${alpha}`);
    stage.style.setProperty("--fx-size",`${state.cursorEffectSize||22}px`);
    stage.style.setProperty("--fx-duration",`${state.cursorFeedbackDuration||280}ms`);
    stage.style.setProperty("--fx-thickness",`${state.cursorEffectThickness||3}px`);
    stage.style.setProperty("--flashText",state.selectionFlashTextColor||"#fff");
  }
  if(c){
    c.textContent=effectGlyph(state.cursorEffect);
    c.style.color=state.cursorEffectColor||"#4f7cff";
    c.style.fontSize=Math.max(14,state.cursorEffectSize||22)+"px";
    c.style.opacity=(state.cursorEffectOpacity??70)/100;
    c.style.display=state.cursorFeedbackEnabled&&!["none","sound"].includes(state.notificationMode)&&state.cursorEffect!=="none"?"block":"none";
    positionSelectionPreviewNode();
  }
  const flash=state.cursorEffect==="selection-flash";
  $$(".flash-only").forEach(el=>{el.classList.toggle("hidden",!flash);el.classList.remove("not-applicable");el.querySelectorAll("input,select").forEach(x=>x.disabled=!flash)});
  $$(".non-flash-only").forEach(el=>{const off=flash||state.cursorEffect==="none";el.classList.remove("hidden");el.classList.toggle("not-applicable",off);el.querySelectorAll("input,select").forEach(x=>x.disabled=off)});
  $$(".underline-only").forEach(el=>{const on=state.cursorEffect==="underline-sweep";el.classList.toggle("hidden",!on);el.querySelectorAll("input").forEach(x=>x.disabled=!on)});
  if($("#cursorSizeLabel"))$("#cursorSizeLabel").textContent=state.cursorEffect==="underline-sweep"?"Line span":"Size";
  const corner=$(".corner-card"),symbolOnly=state.feedbackStyle==="icon";
  corner?.classList.toggle("symbol-only",symbolOnly);
  corner?.querySelector(".position-block")?.classList.toggle("not-applicable",!state.screenFeedbackEnabled);
  corner?.querySelectorAll('.position-block input').forEach(el=>el.disabled=!state.screenFeedbackEnabled);
  corner?.querySelectorAll("[data-key]").forEach(el=>{
    if(["screenFeedbackEnabled","feedbackStyle","feedbackSymbol"].includes(el.dataset.key))return;
    el.disabled=symbolOnly||!state.screenFeedbackEnabled;
  });
  const effectName={"selection-flash":"Flash","selection-brackets":"Brackets","soft-halo":"Soft halo","pulse-ring":"Pulse ring","ripple-check":"Ripple + check",spark:"Spark","copy-badge":"Copy badge","dot-pulse":"Dot pulse","mini-clipboard":"Mini clipboard","glow-trail":"Glow trail","underline-sweep":"Underline sweep",none:"No effect"}[state.cursorEffect]||"Effect";
  if($("#resetSelectionAppearance")){const label=`Restore ${effectName} preset`;$("#resetSelectionAppearance").title=label;$("#resetSelectionAppearance").setAttribute("aria-label",label)}
  updateValueLabels();applySettingsMode();
  if($("#copyModePreview")){
    const box=$("#copyModePreview"),selected="Design systems work best when typography, spacing, and behavior reinforce one another.";box.className=`mode-${state.copyMode}`;
    const link=state.linkCopyMode==="url"?"https://example.com/design":state.linkCopyMode==="text"?"Building a Better Interface":"Building a Better Interface — https://example.com/design";
    if(state.copyMode==="original"){box.innerHTML='<article class="rich-page"><p class="rich-page-note copy-preview-lead">RICH TEXT — Keep a webpage’s visual structure. Less cleanup. More “oh, nice.”</p><div class="copy-preview-empty-line" aria-hidden="true"></div><header><div><strong>Making interfaces feel <b>kinder</b> <small>tiny notes for people who notice the details</small></strong></div></header><div class="rich-body-row"><img class="rich-sample-image" src="assets/four-leaf-clover-pickpik.png" alt="Four-leaf clover"><p>Good pages let <span class="rainbow-word"><i>c</i><i>o</i><i>l</i><i>o</i><i>r</i></span>, <span class="dancing-word"><i>r</i><i>h</i><i>y</i><i>t</i><i>h</i><i>m</i></span>, <u>emphasis</u>, <em>quiet asides</em>, <strong>bold ideas</strong>, <span style="font-size:1.15em;color:#7c3aed">playful scale</span>, and <a href="#">useful links</a> travel together—with a little luck. 🍀✨</p></div><p class="rich-fit"><span aria-hidden="true">•</span> <strong>Rich Text</strong> is a lovely fit when pasting into a <em>document editor</em>, <u>mail draft</u>, or <a href="#">note app</a> that can keep the original structure intact.</p><ul><li><strong>Headings</strong> keep their hierarchy</li><li><em>Emphasis</em>, links, and lists travel with the words</li><li>Paragraphs remain comfortably separated</li></ul></article>'}
    else if(state.copyMode==="custom"){const advanced=document.body.classList.contains("advanced-mode");box.innerHTML=advanced?'<div class="custom-mode-invite custom-mode-advanced"><div><p class="custom-template-title copy-preview-lead">Templates like a little more mischief.</p><p class="custom-template-spacer" aria-hidden="true"></p><p>Build yours in Metadata &amp; Templates—tokens, order, punctuation, the lot.</p></div><a href="#" id="openTemplateFromPreview"><strong>Visit Metadata &amp; Templates</strong></a></div>':'<div class="custom-mode-invite custom-mode-simple"><div><p class="custom-template-title"><strong>Create a custom copy template!</strong></p><p>Pick exactly what travels with your copied text.</p><p class="template-token-example">{title} · {domain} · {date} · {time} · {wordCount} · {url} · {selectionLength}</p></div><a href="#" id="openTemplateFromPreview"><strong>Advanced Mode — Metadata &amp; Templates</strong></a></div>'}
    else{const samples={plain:`PLAIN TEXT — All formatting is removed; line breaks preserved.\n\n${selected}\n\nUse this when a clean, predictable paste matters more than preserving the original page’s appearance.\n\nLink: ${link}`,markdown:`MARKDOWN — Structure that travels well in plain text.\n\n# A calmer interface\n\n**Design systems** make work calmer when *typography*, spacing, and [useful links](https://example.com/design) travel together.\n\n- Portable headings\n- Useful lists\n- **Bold**, *italic*, and \`inline code\`\n\n> Tiny syntax, surprisingly tidy suitcase. 🧳`,"quote-source":`QUOTE + SOURCE — A citation-ready passage with its origin. Text is quoted.\n\nUseful for research notes and traceable quotations.\n\n“${selected}”\n\n— Building a Better Interface\nhttps://example.com/design`,"url-title":`TEXT + REFERENCE + DATE — Plain text with the page title, URL, and date.\n\nOctopuses have a central brain plus large neural clusters in their arms—and three hearts. Curious creatures keep excellent references. 🐙\n\n[Building a Better Interface, https://example.com/design; Sep 3, 2026]\n\nWant more than simple text? Custom templates can add exactly the details you need.`};const sample=samples[state.copyMode]||samples.plain,[lead,...rest]=sample.split("\n");box.replaceChildren();const leadEl=document.createElement("div");leadEl.className="copy-preview-lead";leadEl.textContent=lead;const bodyEl=document.createElement("div");bodyEl.className="copy-preview-body";bodyEl.textContent=rest.join("\n");box.append(leadEl,bodyEl)}
    $("#openTemplateFromPreview")?.addEventListener("click",()=>openPage("metadata"));
  }
}

const SYMBOL_OPTIONS=[
  ["check","✓","Check"],["none"," ","None"],["tick","✔","Bold check"],["copy","⧉","Copy"],
  ["clipboard","▣","Clipboard"],["sparkle","✦","Sparkle"],["star","★","Star"],["dot","●","Dot"],
  ["lightning","⚡","Lightning"],["circle","◉","Circle"],["arrow","➜","Arrow"],["heart","♥","Heart"],
  ["diamond","◆","Diamond"],["burst","✧","Burst"],["square","■","Square"],["custom","✎","Custom…"]
];
function syncSymbolPicker(){
  const trigger=$("#feedbackSymbolButton"),glyph=$("#feedbackSymbolGlyph"),menu=$("#feedbackSymbolMenu");
  if(!trigger||!glyph||!menu)return;
  glyph.textContent=symbolGlyph(state?.feedbackSymbol);
  const currentLabel=(SYMBOL_OPTIONS.find(x=>x[0]===state?.feedbackSymbol)?.[2]||"Choose symbol");trigger.title=currentLabel;trigger.setAttribute("aria-label",`Corner message symbol: ${currentLabel}. Choose symbol`);
  menu.querySelectorAll("[data-symbol]").forEach(b=>{const on=b.dataset.symbol===state?.feedbackSymbol;b.classList.toggle("selected",on);b.setAttribute("aria-selected",String(on))});
}
function setupSymbolPicker(){
  const trigger=$("#feedbackSymbolButton"),menu=$("#feedbackSymbolMenu"),native=$('[data-key="feedbackSymbol"]');
  if(!trigger||!menu||!native)return;
  menu.innerHTML=SYMBOL_OPTIONS.map(([value,glyph,label])=>`<button type="button" role="option" data-symbol="${value}" aria-label="${label}" title="${label}"><span>${glyph}</span></button>`).join("");
  const close=()=>closeFloatingMenu(trigger,menu);
  trigger.addEventListener("click",e=>{e.stopPropagation();if(menu.classList.contains("hidden"))openFloatingMenu(trigger,menu,{align:"center"});else close()});
  menu.addEventListener("click",async e=>{const button=e.target.closest("[data-symbol]");if(!button)return;native.value=button.dataset.symbol;await persist("feedbackSymbol",button.dataset.symbol);syncSymbolPicker();close();pulsePreview(true);if(button.dataset.symbol==="custom")setTimeout(()=>$(".custom-symbol-input")?.focus(),0)});
  document.addEventListener("click",e=>{if(!e.target.closest(".symbol-picker")&&!e.target.closest(".symbol-menu"))close()});
  trigger.addEventListener("keydown",e=>{if(e.key==="Escape")close();else if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();if(menu.classList.contains("hidden"))trigger.click();const items=[...menu.querySelectorAll("[role=option]")],selected=items.find(x=>x.getAttribute("aria-selected")==="true");(selected||items[e.key==="ArrowUp"?items.length-1:0])?.focus()}});
  menu.addEventListener("keydown",e=>{const items=[...menu.querySelectorAll("[role=option]")],i=items.indexOf(document.activeElement);if(e.key==="Escape"){e.preventDefault();close();trigger.focus()}else if(["ArrowDown","ArrowUp","Home","End"].includes(e.key)){e.preventDefault();let n=e.key==="Home"?0:e.key==="End"?items.length-1:e.key==="ArrowDown"?(i+1+items.length)%items.length:(i-1+items.length)%items.length;items[n]?.focus()}});
  syncSymbolPicker();
}
function clearPreviewEffectClasses(){
  const stage=$("#previewStage");if(!stage)return;
  stage.classList.remove("selection-sweeping","previewing","fx-flash","fx-brackets","fx-halo","fx-ring","fx-glyph","fx-trail","fx-underline");
}
let previewTimer=null;
let previewEffectTimer=null;
let selectionRestoreTimer=null;
let previewRunId=0;
function restoreSelectionSample(){clearTimeout(selectionRestoreTimer);$("#previewStage")?.classList.remove("manual-preview")}
function pulsePreview(effectOnly=false){
  const stage=$("#previewStage"),p=$("#notifyPreview");if(!stage)return;
  const runId=++previewRunId;
  clearTimeout(previewTimer);
  clearTimeout(previewEffectTimer);
  updatePreview();
  clearPreviewEffectClasses();void stage.offsetWidth;
  const classes=effectPreviewClass(state.cursorEffect).split(" ").filter(Boolean);
  const sweepDuration=820,pauseAfterSelection=260,effectDelay=sweepDuration+pauseAfterSelection;
  stage.classList.add("selection-sweeping");
  previewEffectTimer=setTimeout(()=>{
    if(runId!==previewRunId)return;
    stage.classList.remove("selection-sweeping");
    stage.classList.add("previewing",...classes);
    if(!effectOnly&&p&&state.screenFeedbackEnabled&&!["none","sound"].includes(state.notificationMode))p.style.display="flex";
    positionSelectionPreviewNode();
  },effectDelay);
  positionSelectionPreviewNode();
  let oldDisplay;
  if(effectOnly&&p){oldDisplay=p.style.display;p.style.display="none"}
  const effectDuration=Math.max(240,Number(state.cursorFeedbackDuration)||280),messageDuration=Math.max(240,Number(state.notificationDuration)||1000);const duration=effectDelay+(effectOnly?effectDuration:Math.max(effectDuration,messageDuration));
  previewTimer=setTimeout(()=>{
    if(runId!==previewRunId)return;
    clearTimeout(previewEffectTimer);
    stage.classList.remove("selection-sweeping");
    clearPreviewEffectClasses();
    if(effectOnly&&p)p.style.display=oldDisplay||"";
    updatePreview();
  },duration);
}
$("#previewFeedback")?.addEventListener("click",()=>pulsePreview(false));
$("#previewCursor")?.addEventListener("click",()=>pulsePreview(true));
// This is a safe sandbox: selecting its sample text previews feedback but never writes a clipboard entry.
$("#previewStage")?.addEventListener("pointerdown",()=>{globalThis.getSelection?.()?.removeAllRanges();$("#previewStage")?.classList.add("manual-preview");clearTimeout(selectionRestoreTimer)});
$("#previewStage")?.addEventListener("pointerup",()=>{const selected=String(globalThis.getSelection?.()?.toString()||"").trim();if(!selected)return;pulsePreview(false);clearTimeout(selectionRestoreTimer);selectionRestoreTimer=setTimeout(restoreSelectionSample,30000)});
let voiceLoadAttempts=0,voiceLoadTimer=0;
function populateVoices({retry=true}={}){
  const select=$("#ttsVoice");if(!select||!globalThis.speechSynthesis)return;
  const voices=[...speechSynthesis.getVoices()],mark=voices.find(v=>/Microsoft Mark/i.test(v.name)&&/^en\b/i.test(v.lang)),selected=state?.ttsVoice||(mark?.voiceURI||"");select.innerHTML='<option value="">System default</option>';
  const natural=v=>/(natural|neural|online|google|aria|jenny|guy|sonia|ryan|libby)/i.test(v.name);
  voices.sort((a,b)=>Number(natural(b))-Number(natural(a))||a.lang.localeCompare(b.lang)||a.name.localeCompare(b.name)).forEach(v=>{const o=document.createElement("option");o.value=v.voiceURI;o.textContent=`${v.name} — ${v.lang}${v.localService?" · local":""}`;select.append(o)});select.value=[...select.options].some(o=>o.value===selected)?selected:"";if(!state?.ttsVoice&&mark&&select.value===mark.voiceURI)void persist("ttsVoice",mark.voiceURI);
  const chosen=voices.find(v=>v.voiceURI===select.value),isMark=!!chosen&&/Microsoft Mark/i.test(chosen.name);if(!isMark&&state&&(state.ttsRate!==1||state.ttsPitch!==1||state.ttsVolume!==1))void applyPatch({ttsRate:1,ttsPitch:1,ttsVolume:1});
  if(voices.length){voiceLoadAttempts=0;clearTimeout(voiceLoadTimer);select.title=`${voices.length} installed voice${voices.length===1?"":"s"} available`;return}
  select.title="Chrome has not returned the installed voice list yet";
  if(retry&&voiceLoadAttempts<12){voiceLoadAttempts++;clearTimeout(voiceLoadTimer);voiceLoadTimer=setTimeout(()=>populateVoices({retry:true}),250)}
}
if(globalThis.speechSynthesis){speechSynthesis.addEventListener?.("voiceschanged",()=>populateVoices({retry:false}));setTimeout(()=>populateVoices({retry:true}),0)}
$("#ttsVoice")?.addEventListener("pointerdown",()=>populateVoices({retry:true}));
$("#ttsVoice")?.addEventListener("focus",()=>populateVoices({retry:true}));
$("#refreshVoices")?.addEventListener("click",()=>{voiceLoadAttempts=0;populateVoices({retry:true})});
function previewVoice(){if(!globalThis.speechSynthesis)return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance("CopySelect is ready. Select, copied, done.");u.rate=state.ttsRate;u.pitch=state.ttsPitch;u.volume=state.ttsVolume;const voice=speechSynthesis.getVoices().find(v=>v.voiceURI===$("#ttsVoice")?.value||v.voiceURI===state.ttsVoice);if(voice)u.voice=voice;speechSynthesis.speak(u)}
$("#previewVoice")?.addEventListener("click",previewVoice);
$("#ttsVoice")?.addEventListener("change",async e=>{const mark=/Microsoft Mark/i.test(e.target.selectedOptions?.[0]?.textContent||"");if(!mark)await applyPatch({ttsRate:1,ttsPitch:1,ttsVolume:1});previewVoice()});
// Easter egg: one self-contained, beat-authored controller.
// Story content, behavior, and visual motion are deliberately separated so a CSS change
// cannot silently move an effect to a neighboring beat.
const finalEggButton=$("#easterEgg");if(finalEggButton)finalEggButton.replaceChildren(document.createTextNode("Do not CopySelect this button"));
(()=>{
  const previous=$(".about-egg-zone");if(!previous)return;
  const zone=previous.cloneNode(true);previous.replaceWith(zone);
  const button=zone.querySelector("#easterEgg"),scene=zone.querySelector("#eggScene");if(!button||!scene)return;

  const storyBeats=[
    {text:""},
    {text:""},
    {text:"Nothing happened. 😶"},
    {text:"Still nothing. 🫥"},
    {text:"Wait, shouldn’t the button say ‘Do not PRESS this button’?! 🤨"},
    {text:"A tiny button looks back at you. 👀✨"},
    {text:"A pigeon has been appointed project manager. 🐦📋"},
    {text:"She wears a tiny lanyard and takes meetings very seriously. 🪪"},
    {text:"Her first proposal: more crumbs, fewer dashboards! 🍞📊"},
    {text:"A second pigeon arrives as legal counsel. ⚖️🐦"},
    {text:"They explain that buttons deserve boundaries. 🚧"},
    {text:"You offer sunflower seeds as a settlement. 🌻🤝"},
    {text:"The legal pigeon accepts, then invoices you in breadcrumbs. 🧾🍞"},
    {text:"A paper airplane delivers the morale report. ✈️📨"},
    {text:"Morale is excellent.\nProductivity is suspiciously feathery. 🪶📈"},
    {text:"The project-manager pigeon starts a stand-up.\nLiterally. 🐦🧍",buttonMotion:"jump"},
    {text:"Everyone stands. Even the button. 😐",buttonMotion:"jump"},
    {text:"A sparrow brings a one-slide deck: ‘chirp’. 🐤📊"},
    {text:"It is, somehow, persuasive.... 🤔✨"},
    {text:"You all agree to take a five-minute sky break. 🌤️🪽"},
    {text:"The pigeons call it cloud computing. ☁️💻"},
    {text:"A rainbow appears in the quarterly forecast. 🌈📈"},
    {text:"The button quietly learns to believe in itself. 🥹💙"},
    {text:"You are promoted to\nVice President of Gentle Clicking. 🏅🫡"},
    {text:"Moral: curiosity is wonderful;\nkindness makes tiny systems better. 💛✨"},
    {text:""},
    {text:""},
    {text:"Hey stop it! I’m going to\ntake this button away from you...! 🫳😑",buttonMotion:"jumpOut"}
  ];
  const finaleBeats=[
    {text:"Sparkles! ✨"},
    {text:"A very polite rainbow! 🌈"},
    {text:"A clown delivers a heart. 🤡💖"},
    {text:"A unicorn reports:\n‘needs more snacks.’ 🦄"},
    {text:"A tiny disco moment. 🪩",lineMotion:"jump"},
    {text:"A metaphorical cookie appears. 🍪"},
    {text:"Oh! I get it!!\nYou’re in the mood to be silly! 😏"},
    {text:"Did you eat a clown for breakfast?! 🤡"},
    {text:"OK, got it…!\nNo more work!\nLet’s play!! 🎮"},
    {text:"Ready? 👀"},
    {text:"Are you sure?! 😈"},
    {text:"You asked for it!!! 🚀",portal:true}
  ];

  let press=0,cardClick=0,afterPortal=0;const eggHistory=[];
  const cancelEggAnimations=el=>el?.getAnimations?.().filter(a=>String(a.id||"").startsWith("egg-")).forEach(a=>a.cancel());
  const show=(text,x,y)=>{
    scene.replaceChildren();scene.classList.remove("play");
    if(!text)return null;
    const p=document.createElement("p"),line=document.createElement("span");line.className="egg-line-content";line.textContent=text;p.append(line);
    if(Number.isFinite(x)){p.classList.add("egg-click-line");p.style.left=`${x}px`;p.style.top=`${y}px`}
    scene.append(p);scene.classList.add("play");return p;
  };
  const showTranslucent=(dots,lineOpacity)=>{
    let p=scene.querySelector(".egg-translucent-line");
    if(!p){
      scene.replaceChildren();scene.classList.remove("play");p=document.createElement("p");p.className="egg-translucent-line";
      const base=document.createElement("span");base.className="egg-translucent-base";base.textContent="The button is becoming emotionally translucent";
      const trail=document.createElement("span");trail.className="egg-translucent-dots";p.append(base,trail);p.style.setProperty("--egg-line-opacity","1");scene.append(p);scene.classList.add("play");void p.offsetWidth;
    }
    p.querySelector(".egg-translucent-dots").textContent=".".repeat(dots);
    requestAnimationFrame(()=>p.style.setProperty("--egg-line-opacity",String(lineOpacity)));
  };
  const fadeEggButton=fade=>{
    button.classList.add("egg-fading");
    if(!button.style.getPropertyValue("--egg-fade")){button.style.setProperty("--egg-fade","1");void button.offsetWidth}
    requestAnimationFrame(()=>button.style.setProperty("--egg-fade",String(fade)));
  };
  const runButtonMotion=kind=>{
    cancelEggAnimations(button);
    const frames=kind==="jumpOut"
      ? [{translate:"0 0"},{translate:"0 -11px",offset:.45},{translate:"0 2px",offset:.78},{translate:"0 0"}]
      : [{translate:"0 0"},{translate:"0 -7px",offset:.45},{translate:"0 2px",offset:.72},{translate:"0 0"}];
    const anim=button.animate(frames,{duration:kind==="jumpOut"?360:340,easing:kind==="jumpOut"?"ease-out":"cubic-bezier(.2,.75,.28,1)"});
    anim.id=`egg-${kind}`;return anim;
  };
  const runLineJump=p=>{
    if(!p)return;cancelEggAnimations(p);
    // Recreate the old accidental line-entry hop deliberately: position only, no bow/rotate/scale.
    const anim=p.animate([{translate:"0 5px"},{translate:"0 0"}],{duration:360,easing:"ease",fill:"both"});anim.id="egg-line-jump";return anim;
  };
  const snapshot=()=>({press,cardClick,afterPortal,buttonClass:button.className,fade:button.style.getPropertyValue("--egg-fade"),sceneClass:scene.className,sceneHtml:scene.innerHTML});
  const restoreSnapshot=snap=>{if(!snap)return;cancelEggAnimations(button);press=snap.press;cardClick=snap.cardClick;afterPortal=snap.afterPortal;button.className=snap.buttonClass;button.style.removeProperty("--egg-fade");if(snap.fade)button.style.setProperty("--egg-fade",snap.fade);scene.className=snap.sceneClass;scene.innerHTML=snap.sceneHtml};
  const reset=()=>{cancelEggAnimations(button);press=cardClick=afterPortal=0;eggHistory.length=0;button.classList.remove("egg-gone","egg-fading");button.style.removeProperty("--egg-fade");scene.replaceChildren();scene.classList.remove("play")};

  zone.addEventListener("click",e=>{
    if(e.shiftKey){e.preventDefault();e.stopImmediatePropagation();reset();return}
    if(e.ctrlKey){e.preventDefault();e.stopImmediatePropagation();restoreSnapshot(eggHistory.pop());return}
  },true);

  button.addEventListener("click",e=>{
    e.stopPropagation();eggHistory.push(snapshot());press++;
    if(press<=storyBeats.length){
      const beat=storyBeats[press-1];
      if(beat.buttonMotion)runButtonMotion(beat.buttonMotion);
      show(beat.text);return;
    }
    const fadeStep=press-storyBeats.length;
    if(fadeStep>=1&&fadeStep<=6){
      const fade=Math.max(.08,1-fadeStep*.15),lineOpacity=Math.max(.42,1-fadeStep*.075);
      showTranslucent(fadeStep,lineOpacity);fadeEggButton(fade);
      if(fadeStep===6)setTimeout(()=>button.classList.add("egg-gone"),430);
    }
  });

  zone.addEventListener("click",e=>{
    if(!button.classList.contains("egg-gone"))return;e.stopPropagation();eggHistory.push(snapshot());
    if(afterPortal){
      afterPortal++;
      if(afterPortal===2)show("Somebody erased the ‘r’ from ‘break.’\nThe pigeons are now officially on beak. 🐦😌",e.offsetX,e.offsetY);
      else if(afterPortal===3)show("Game break granted.\nThe pigeons approve! 🐦🎮",e.offsetX,e.offsetY);
      else reset();
      return;
    }
    cardClick++;
    if(cardClick<=2){show("");return}
    if(cardClick===3){show("The button has wandered off to find a quiet shelf. 🪑",e.offsetX,e.offsetY);return}
    if(cardClick>=4&&cardClick<=6){show("");return}
    const beat=finaleBeats[cardClick-7];if(!beat){show("");return}
    const p=show(beat.text,e.offsetX,e.offsetY);if(beat.lineMotion==="jump")requestAnimationFrame(()=>runLineJump(p));
    if(beat.portal){window.open("https://www.retrogames.cc/","_blank","noopener");afterPortal=1}
  },true);

  reset();
})();

async function applyPatch(patch){
  Object.assign(state,patch);await chrome.storage.sync.set(patch);bindState();updatePreview();refreshStatus();
}
$("#resetCursorAppearance")?.addEventListener("click",()=>applyPatch(CS_EFFECT_DEFAULTS[state.cursorEffect]||CS_EFFECT_DEFAULTS["selection-flash"]));
$("#resetSelectionAppearance")?.addEventListener("click",()=>applyPatch(CS_EFFECT_DEFAULTS[state.cursorEffect]||CS_EFFECT_DEFAULTS["selection-flash"]));
$("#resetScreenAppearance")?.addEventListener("click",()=>applyPatch(CS_SCREEN_STYLE_DEFAULTS[state.feedbackStyle]||CS_SCREEN_DEFAULTS));
$("#resetAllAppearance")?.addEventListener("click",()=>applyPatch({
  notificationMode:CS_DEFAULTS.notificationMode,screenFeedbackEnabled:CS_DEFAULTS.screenFeedbackEnabled,cursorFeedbackEnabled:CS_DEFAULTS.cursorFeedbackEnabled,
  cursorEffect:CS_DEFAULTS.cursorEffect,...CS_EFFECT_DEFAULTS[CS_DEFAULTS.cursorEffect],...CS_SCREEN_STYLE_DEFAULTS.pill
}));

function metadataSep(){return state.metadataSeparator==="custom"?(state.metadataCustomSeparator||"\n"):(state.metadataSeparator||"\n")}
function metadataDatePreview(d=new Date()){
  const pad=n=>String(n).padStart(2,"0"),short=d.toLocaleString(undefined,{month:"short"}),long=d.toLocaleString(undefined,{month:"long"});
  const custom=pat=>String(pat||"").replace(/YYYY|MMMM|MMM|DDD|YY|MM|DD|D/g,t=>({YYYY:d.getFullYear(),YY:String(d.getFullYear()).slice(-2),MMMM:long,MMM:short,DDD:d.toLocaleDateString(undefined,{weekday:"short"}),MM:pad(d.getMonth()+1),DD:pad(d.getDate()),D:d.getDate()}[t]));
  return state.dateFormat==="iso"?`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`:
    state.dateFormat==="dmy"?`${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`:
    state.dateFormat==="mdy"?`${pad(d.getMonth()+1)}/${pad(d.getDate())}/${d.getFullYear()}`:
    state.dateFormat==="short"?`${short}_${pad(d.getDate())}`:
    state.dateFormat==="custom"?custom(state.dateCustomFormat||"DD/MM/YYYY"):d.toLocaleDateString();
}
function metadataTimePreview(d=new Date()){
  const pad=n=>String(n).padStart(2,"0"),h12=((d.getHours()+11)%12)+1;
  const custom=pat=>String(pat||"").replace(/HH|hh|mm|ss|H|h|A/g,t=>({HH:pad(d.getHours()),H:d.getHours(),hh:pad(h12),h:h12,mm:pad(d.getMinutes()),ss:pad(d.getSeconds()),A:d.getHours()<12?"AM":"PM"}[t]));
  return state.timeFormat==="hm24"?`${pad(d.getHours())}:${pad(d.getMinutes())}`:
    state.timeFormat==="hms24"?`${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`:
    state.timeFormat==="hm12"?d.toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit",hour12:true}):
    state.timeFormat==="custom"?custom(state.timeCustomFormat||"HH:mm"):d.toLocaleTimeString();
}
function updateMetadataPreview(){
  const box=$("#metadataPreview");if(!box||!state)return;
  const sep=metadataSep(),parts=[];
  if(state.includeTitle)parts.push("Example Article Title");
  if(state.includeURL)parts.push("https://example.com/article");
  if(state.includeDomain)parts.push("example.com");
  if(state.includeDate)parts.push(metadataDatePreview());
  if(state.includeTime)parts.push(metadataTimePreview());
  const meta=parts.join(sep),core="Thoughtful interfaces do their best work quietly: the next action feels obvious, useful context stays close, and a small spark of personality makes the practical details pleasant to revisit.";
  const before=[state.metadataBeforeText,state.metadataPosition==="before"?meta:""].filter(Boolean).join(sep);
  const after=[state.metadataPosition==="after"?meta:"",state.metadataAfterText||state.customText].filter(Boolean).join(sep);
  const liveTemplate=$('[data-key="customTemplate"]')?.value;
  const template=String(liveTemplate??state.customTemplate??"").trim(),tokens={text:core,title:"How thoughtful interfaces earn attention",url:"https://fieldnotes.example/design/thoughtful-interfaces",domain:"fieldnotes.example",date:metadataDatePreview(),time:metadataTimePreview(),isoDate:new Date().toISOString().slice(0,10),year:String(new Date().getFullYear()),selectionLength:String(core.length),wordCount:String(core.trim().split(/\s+/).length),paragraphCount:"1",characterCountWithSpaces:String(core.length),characterCountNoSpaces:String(core.replace(/\s/g,"").length)},resolved=template?template.replace(/\{(\w+)\}/g,(m,k)=>tokens[k]??m):(state.includeMetadata?[before,core,after].filter(Boolean).join(sep):core);box.textContent=resolved.replace(/^\n+/,"");
}
// Keep the preview faithful while a person is typing, rather than waiting for
// the storage-backed setting update that follows the control's change event.
$("#page-metadata")?.addEventListener("input",()=>requestAnimationFrame(updateMetadataPreview));
$("#page-metadata")?.addEventListener("change",()=>requestAnimationFrame(updateMetadataPreview));
$("#refreshMetadataPreview")?.addEventListener("click",updateMetadataPreview);
function renderTemplateLibrary(){const select=$("#templateSelect");if(!select||!state)return;const current=select.value;select.innerHTML=((state.savedTemplates||[]).map((t,i)=>`<option value="${i}">${htmlEscape(t.name)}</option>`).join(""))+'<option value="">New template…</option>';if(current&&[...select.options].some(o=>o.value===current))select.value=current;else{const match=(state.savedTemplates||[]).findIndex(t=>t.template===state.customTemplate);select.value=match>=0?String(match):""}}
$("#templateSelect")?.addEventListener("change",async e=>{const item=(state.savedTemplates||[])[Number(e.target.value)];if(!item)return;await persist("customTemplate",item.template);const area=$('[data-key="customTemplate"]');if(area)area.value=item.template;updateMetadataPreview()});
$("#saveTemplate")?.addEventListener("click",async()=>{const name=prompt("Name this template:","My template")?.trim();if(!name)return;const template=String($('[data-key="customTemplate"]')?.value||state.customTemplate||"");const saved=[...(state.savedTemplates||[])],existing=saved.findIndex(t=>t.name.toLowerCase()===name.toLowerCase());if(existing>=0)saved[existing]={name,template};else saved.push({name,template});await persist("savedTemplates",saved);renderTemplateLibrary();$("#templateSelect").value=String(existing>=0?existing:saved.length-1);announceA11y(`Saved template ${name}`)});
$("#resetMetadata")?.addEventListener("click",()=>applyPatch({
  includeMetadata:CS_DEFAULTS.includeMetadata,includeDate:CS_DEFAULTS.includeDate,includeTime:CS_DEFAULTS.includeTime,includeURL:CS_DEFAULTS.includeURL,includeTitle:CS_DEFAULTS.includeTitle,includeDomain:CS_DEFAULTS.includeDomain,includeSelectionLength:CS_DEFAULTS.includeSelectionLength,
  metadataBeforeText:"",metadataAfterText:"",metadataPosition:"after",metadataSeparator:"\n",
  dateFormat:"locale",dateCustomFormat:"DD/MM/YYYY",timeFormat:"locale",timeCustomFormat:"HH:mm"
}));

function playSoundChoice(sound,{alertOnBlock=false}={}){
  const rt=globalThis.chrome?.runtime;if(!rt?.id||!sound||sound==="none")return;
  const file={"soft-beep":"soft-beep.wav","glass-chime":"glass-chime.wav","soft-tap":"soft-tap.wav",ding:"ding.wav",drop:"drop.wav",bell:"bell.wav"}[sound]||`${sound}.wav`;
  const a=new Audio(rt.getURL("sounds/"+file));a.volume=.6;a.play().catch(()=>{if(alertOnBlock)alert("Chrome blocked audio preview. Choose the sound again after interacting with this page.")});
}
function previewSelectedSound(){playSoundChoice(state.audioNotificationSound,{alertOnBlock:true})}
$("#previewSound")?.addEventListener("click",previewSelectedSound);
$("#audioNotificationSound")?.addEventListener("input",()=>setTimeout(previewSelectedSound,0));

function overrideSummary(r){
  const o=r.overrides||{},parts=[];
  if(o.copyMode)parts.push(`Mode: ${o.copyMode}`);
  if("enableContentEditable" in o)parts.push(`Content-editable: ${o.enableContentEditable?"allow":"block"}`);
  if("enableTextBoxes" in o)parts.push(`Form fields: ${o.enableTextBoxes?"allow":"block"}`);
  if("pasteOnMiddleClick" in o)parts.push(`Middle paste: ${o.pasteOnMiddleClick?"on":"off"}`);
  if("duplicateSuppression" in o)parts.push(`Duplicates: ${o.duplicateSuppression?"suppress":"allow"}`);
  if("includeMetadata" in o)parts.push(`Metadata: ${o.includeMetadata?"on":"off"}`);
  if("screenFeedbackEnabled" in o)parts.push(`Screen: ${o.screenFeedbackEnabled?"on":"off"}`);
  if("cursorFeedbackEnabled" in o)parts.push(`Selection: ${o.cursorFeedbackEnabled?"on":"off"}`);
  if("copyDelayEnabled" in o)parts.push(`Delay: ${o.copyDelayEnabled?"on":"off"}`);
  if(Number.isFinite(o.copyDelay))parts.push(`Delay ${o.copyDelay} ms`);
  if(Number.isFinite(o.minSelectionLength))parts.push(`Min ${o.minSelectionLength} chars`);
  return parts.length?parts.join(" · "):"Uses global settings";
}
let siteRuleSelectedIndex=null,siteRuleEditIndex=null,siteRuleDragIndex=null;
function renderRuleCollectionOptions(){
  const target=$("#ruleAutoCollectionTarget");if(!target)return;const current=target.value;target.replaceChildren();const first=document.createElement("option");first.value="";first.textContent="Choose collection…";target.append(first);for(const c of state.historyCollections||[]){const o=document.createElement("option");o.value=c.id;o.textContent=c.name;target.append(o)}if([...target.options].some(o=>o.value===current))target.value=current;target.disabled=$("#ruleAutoCollection")?.value!=="collection";
}
function syncSiteRuleConditionalInputs(){
  const min=$("#ruleMinLength"),duration=$("#ruleNotificationDuration"),collection=$("#ruleAutoCollectionTarget"),delay=$("#ruleDelayMs");if(min)min.disabled=$("#ruleMinMode")?.value!=="custom";if(duration)duration.disabled=$("#ruleNotificationDurationMode")?.value!=="custom";if(collection)collection.disabled=$("#ruleAutoCollection")?.value!=="collection";if(delay)delay.disabled=$("#ruleDelay")?.value!=="on";
}
function syncSiteRuleButtons(){const has=Number.isInteger(siteRuleSelectedIndex)&&!!state.siteRules[siteRuleSelectedIndex];const edit=$("#editSiteRule"),del=$("#deleteSiteRule");if(edit)edit.disabled=!has;if(del)del.disabled=!has}
function setTriSelect(id,o,key){const el=$(id);if(!el)return;el.value=Object.prototype.hasOwnProperty.call(o,key)?(o[key]?"on":"off"):""}
function resetSiteRuleEditor({keepPattern=false,keepEdit=false}={}){
  const pattern=keepPattern?$("#rulePattern")?.value||"":"";if($("#rulePattern"))$("#rulePattern").value=pattern;if($("#ruleBehavior"))$("#ruleBehavior").value="enable";
  ["#ruleMode","#ruleContentEditable","#ruleTextBoxes","#rulePaste","#ruleDuplicates","#ruleSelectionTrigger","#ruleEffect","#ruleFeedbackStyle","#ruleScreenFeedback","#ruleCursorFeedback","#ruleDelay","#ruleSaveHistory","#ruleSourceDetails","#ruleSound","#rulePosition","#ruleMinMode","#ruleNotificationDurationMode","#ruleAutoCollection"].forEach(id=>{if($(id))$(id).value=""});
  ["#ruleDelayMs","#ruleMinLength","#ruleNotificationDuration"].forEach(id=>{if($(id))$(id).value=""});if($("#ruleAutoCollectionTarget"))$("#ruleAutoCollectionTarget").value="";if(!keepEdit)siteRuleEditIndex=null;renderRuleCollectionOptions();syncSiteRuleConditionalInputs();syncInheritGlobalTint();
}
function fillSiteRuleEditor(index){
  const r=state.siteRules[index];if(!r)return;resetSiteRuleEditor();siteRuleSelectedIndex=index;siteRuleEditIndex=index;const o=r.overrides||{};$("#rulePattern").value=r.pattern||"";$("#ruleBehavior").value=r.behavior||"enable";if($("#ruleMode"))$("#ruleMode").value=o.copyMode||"";
  setTriSelect("#ruleContentEditable",o,"enableContentEditable");setTriSelect("#ruleTextBoxes",o,"enableTextBoxes");setTriSelect("#rulePaste",o,"pasteOnMiddleClick");setTriSelect("#ruleDuplicates",o,"duplicateSuppression");setTriSelect("#ruleScreenFeedback",o,"screenFeedbackEnabled");setTriSelect("#ruleCursorFeedback",o,"cursorFeedbackEnabled");setTriSelect("#ruleDelay",o,"copyDelayEnabled");setTriSelect("#ruleSaveHistory",o,"historyEnabled");setTriSelect("#ruleSourceDetails",o,"historyCaptureSourceDetails");
  if($("#ruleSelectionTrigger"))$("#ruleSelectionTrigger").value=o.selectionTrigger||"";if($("#ruleEffect"))$("#ruleEffect").value=o.cursorEffect||"";if($("#ruleFeedbackStyle"))$("#ruleFeedbackStyle").value=o.feedbackStyle||"";if($("#ruleSound"))$("#ruleSound").value=o.audioNotificationSound||"";if($("#rulePosition"))$("#rulePosition").value=o.notificationPosition||"";
  if(Number.isFinite(o.copyDelay)){if(!Object.prototype.hasOwnProperty.call(o,"copyDelayEnabled"))$("#ruleDelay").value="on";$("#ruleDelayMs").value=o.copyDelay}if(Number.isFinite(o.minSelectionLength)){$("#ruleMinMode").value="custom";$("#ruleMinLength").value=o.minSelectionLength}if(Number.isFinite(o.notificationDuration)){$("#ruleNotificationDurationMode").value="custom";$("#ruleNotificationDuration").value=o.notificationDuration}
  if(Object.prototype.hasOwnProperty.call(o,"autoCollectionId")){if(o.autoCollectionId){$("#ruleAutoCollection").value="collection";renderRuleCollectionOptions();$("#ruleAutoCollectionTarget").value=o.autoCollectionId}else $("#ruleAutoCollection").value="off"}
  renderRuleCollectionOptions();syncSiteRuleConditionalInputs();syncInheritGlobalTint();renderRules();$("#rulePattern")?.focus();
}
function siteRuleFromEditor(){
  const pattern=$("#rulePattern").value.trim(),patternInput=$("#rulePattern");if(!pattern){patternInput.setCustomValidity("Enter a site or pattern.");patternInput.reportValidity();return null}if(pattern.startsWith("^")){try{new RegExp(pattern);patternInput.setCustomValidity("")}catch{patternInput.setCustomValidity("This regular expression is not valid.");patternInput.reportValidity();return null}}else patternInput.setCustomValidity("");
  const behavior=$("#ruleBehavior").value,mode=$("#ruleMode").value,overrides={};if(mode)overrides.copyMode=mode;
  [["#ruleContentEditable","enableContentEditable"],["#ruleTextBoxes","enableTextBoxes"],["#rulePaste","pasteOnMiddleClick"],["#ruleDuplicates","duplicateSuppression"],["#ruleScreenFeedback","screenFeedbackEnabled"],["#ruleCursorFeedback","cursorFeedbackEnabled"],["#ruleDelay","copyDelayEnabled"],["#ruleSaveHistory","historyEnabled"],["#ruleSourceDetails","historyCaptureSourceDetails"]].forEach(([id,key])=>{const v=triValue(id);if(v!==undefined)overrides[key]=v});
  if($("#ruleDelay")?.value==="on"&&$("#ruleDelayMs").value!=="")overrides.copyDelay=Math.max(0,Math.min(10000,Number($("#ruleDelayMs").value)));
  if($("#ruleMinMode")?.value==="custom"&&$("#ruleMinLength").value!=="")overrides.minSelectionLength=Math.max(1,Number($("#ruleMinLength").value));
  const trigger=$("#ruleSelectionTrigger")?.value,effect=$("#ruleEffect")?.value;if(trigger)overrides.selectionTrigger=trigger;if(effect)overrides.cursorEffect=effect;
  const feedbackStyle=$("#ruleFeedbackStyle")?.value,sound=$("#ruleSound")?.value,position=$("#rulePosition")?.value;if(feedbackStyle)overrides.feedbackStyle=feedbackStyle;if($("#ruleNotificationDurationMode")?.value==="custom"&&$("#ruleNotificationDuration").value!=="")overrides.notificationDuration=Math.max(100,Math.min(10000,Number($("#ruleNotificationDuration").value)));if(sound)overrides.audioNotificationSound=sound;if(position)overrides.notificationPosition=position;
  const autoMode=$("#ruleAutoCollection")?.value;if(autoMode==="collection"){const target=$("#ruleAutoCollectionTarget")?.value;if(!target){$("#ruleAutoCollectionTarget")?.focus();return null}overrides.autoCollectionId=target}else if(autoMode==="off")overrides.autoCollectionId="";
  const rule={pattern,type:pattern.startsWith("^")?"regex":pattern.includes("*")?"wildcard":"auto",behavior,enabled:true};if(Object.keys(overrides).length)rule.overrides=overrides;return rule;
}
async function saveSiteRule(){const rule=siteRuleFromEditor();if(!rule)return false;if(Number.isInteger(siteRuleEditIndex)&&state.siteRules[siteRuleEditIndex]){state.siteRules[siteRuleEditIndex]=rule;siteRuleSelectedIndex=siteRuleEditIndex}else{state.siteRules.unshift(rule);siteRuleSelectedIndex=0;siteRuleEditIndex=0}await chrome.storage.sync.set({siteRules:state.siteRules});renderRules();return true}
function renderRules(){
  const body=$("#rulesBody");if(!body)return;body.innerHTML="";renderRuleCollectionOptions();
  if(!state.siteRules.length){["example.com","*.example.com","^https://(docs|mail)\\.example\\.com/","^https://[^/]+\\.example\\.org/projects/"].forEach(pattern=>{const example=document.createElement("div");example.className="rule-card rule-example";example.textContent=pattern;body.append(example)});siteRuleSelectedIndex=null;syncSiteRuleButtons();return}
  state.siteRules.forEach((r,i)=>{const card=document.createElement("button");card.type="button";card.className="rule-card";card.dataset.ruleIndex=String(i);card.draggable=true;card.title="Select rule. Drag to change priority.";if(i===siteRuleSelectedIndex)card.classList.add("selected");const main=document.createElement("div");main.className="rule-card-main";const pattern=document.createElement("b");pattern.className="rule-pattern";pattern.textContent=r.pattern;const summary=document.createElement("div");summary.className="tiny rule-summary";summary.textContent=`${r.behavior==="disable"?"Always off":"Always on"} · ${overrideSummary(r)}`;main.append(pattern,summary);card.append(main);card.addEventListener("click",()=>{siteRuleSelectedIndex=i;renderRules()});card.addEventListener("dblclick",()=>fillSiteRuleEditor(i));card.addEventListener("dragstart",()=>{siteRuleDragIndex=i;card.classList.add("dragging")});card.addEventListener("dragend",()=>{siteRuleDragIndex=null;card.classList.remove("dragging")});card.addEventListener("dragover",e=>e.preventDefault());card.addEventListener("drop",async e=>{e.preventDefault();if(!Number.isInteger(siteRuleDragIndex)||siteRuleDragIndex===i)return;const [moved]=state.siteRules.splice(siteRuleDragIndex,1);state.siteRules.splice(i,0,moved);siteRuleSelectedIndex=i;siteRuleEditIndex=siteRuleEditIndex===siteRuleDragIndex?i:siteRuleEditIndex;await chrome.storage.sync.set({siteRules:state.siteRules});renderRules()});body.append(card)});syncSiteRuleButtons();
}
function triValue(id){const v=$(id)?.value??"";return v===""?undefined:v==="on"}
$("#addRule")?.addEventListener("click",()=>{siteRuleSelectedIndex=null;siteRuleEditIndex=null;resetSiteRuleEditor();renderRules();$("#rulePattern")?.focus()});
$("#editSiteRule")?.addEventListener("click",()=>{if(Number.isInteger(siteRuleSelectedIndex))fillSiteRuleEditor(siteRuleSelectedIndex)});
$("#deleteSiteRule")?.addEventListener("click",async()=>{if(!Number.isInteger(siteRuleSelectedIndex)||!state.siteRules[siteRuleSelectedIndex])return;const rule=state.siteRules[siteRuleSelectedIndex];if(!await confirmDestructive(`Delete site rule “${rule.pattern}”?`))return;state.siteRules.splice(siteRuleSelectedIndex,1);await chrome.storage.sync.set({siteRules:state.siteRules});siteRuleSelectedIndex=null;siteRuleEditIndex=null;resetSiteRuleEditor();renderRules()});
$("#ruleMinMode")?.addEventListener("change",syncSiteRuleConditionalInputs);$("#ruleNotificationDurationMode")?.addEventListener("change",syncSiteRuleConditionalInputs);$("#ruleAutoCollection")?.addEventListener("change",syncSiteRuleConditionalInputs);$("#ruleDelay")?.addEventListener("change",syncSiteRuleConditionalInputs);
$("#ruleTestSound")?.addEventListener("click",()=>playSoundChoice($("#ruleSound")?.value));$("#ruleSound")?.addEventListener("change",e=>setTimeout(()=>playSoundChoice(e.target.value),0));
$("[data-site-action='reset']")?.addEventListener("click",()=>resetSiteRuleEditor({keepPattern:true,keepEdit:true}));
$("[data-site-action='cancel']")?.addEventListener("click",()=>{siteRuleSelectedIndex=null;siteRuleEditIndex=null;resetSiteRuleEditor();renderRules()});
$("[data-site-action='save']")?.addEventListener("click",saveSiteRule);

function renderProfiles(){
  const sel=$("#profileSelect");if(!sel)return;sel.innerHTML="";
  Object.keys(state.profiles).forEach(n=>{const o=document.createElement("option");o.value=o.textContent=n;sel.appendChild(o)});sel.value=state.activeProfile;
  $("#profileList").innerHTML="";
}
const PROFILE_KEYS=["copyMode","notificationMode","feedbackStyle","cursorEffect","screenFeedbackEnabled","cursorFeedbackEnabled","enableAudioNotification","feedbackSize","cursorEffectSize","cursorEffectThickness","cursorEffectColor","cursorEffectOpacity","cursorFeedbackDuration","copyDelayEnabled","copyDelay","includeMetadata","includeURL","includeTitle","includeDomain","includeDate","includeTime","trimWhitespace","normalizeWhitespace","preserveLineBreaks","removeZeroWidth","joinWrappedLines","linkCopyMode","profileTargetCollectionName","profileRequireLockedCollection","profileAutoPin","profileAddPasteStack"];
async function applyProfile(name){
  const base=Object.fromEntries(PROFILE_KEYS.map(k=>[k,CS_DEFAULTS[k]])),patch={...base,...(state.profiles[name]||{}),activeProfile:name};
  Object.assign(state,patch);await chrome.storage.sync.set(patch);bindState();renderProfiles();refreshStatus();updatePreview();
}
$("#profileSelect")?.addEventListener("change",e=>applyProfile(e.target.value));
function setProfileGuideLabel(button,open){button.innerHTML=`<span>Profile guide</span><i class="disclosure-chevron ${open?"open":""}" aria-hidden="true"></i>`}
if($("#profileDescriptionsToggle"))setProfileGuideLabel($("#profileDescriptionsToggle"),false);
$("#profileDescriptionsToggle")?.addEventListener("click",e=>{const panel=$("#profileExplainer"),open=panel?.classList.contains("hidden");panel?.classList.toggle("hidden",!open);e.currentTarget.setAttribute("aria-expanded",String(open));setProfileGuideLabel(e.currentTarget,open)});
function profileSnapshot(){return Object.fromEntries(PROFILE_KEYS.map(k=>[k,state[k]]))}
$("#addProfile")?.addEventListener("click",async()=>{
  const n=$("#newProfile").value.trim();if(!n)return;
  const snapshot=profileSnapshot();
  state.profiles[n]=snapshot;state.activeProfile=n;await chrome.storage.sync.set({profiles:state.profiles,activeProfile:n});$("#newProfile").value="";renderProfiles();
});
$("#saveProfile")?.addEventListener("click",async()=>{const n=state.activeProfile||"Default";state.profiles[n]=profileSnapshot();await chrome.storage.sync.set({profiles:state.profiles});renderProfiles()});
function escapeText(s){const d=document.createElement("div");d.textContent=String(s??"");return d.innerHTML}

function historyExcerpt(text,limit=340){
  text=String(text||"");
  if(text.length<=limit)return {text,hidden:0};
  const head=Math.max(150,Math.floor(limit*.68)),tail=Math.max(70,limit-head-25),hidden=text.length-head-tail;
  return {text:text.slice(0,head)+`\n… +${hidden.toLocaleString()} chars …\n`+text.slice(-tail),hidden};
}
const HISTORY_ALLOWED_TAGS=new Set(["P","BR","DIV","SPAN","STRONG","B","EM","I","U","S","UL","OL","LI","BLOCKQUOTE","PRE","CODE","H1","H2","H3","H4","H5","H6","A","IMG","TABLE","THEAD","TBODY","TR","TH","TD","HR"]);
const HISTORY_STYLE_PROPS=new Set(["color","background-color","font-family","font-size","font-weight","font-style","text-decoration-line","text-align","line-height","white-space","list-style-type"]);
function sanitizedHistoryFragment(html,{loadImages=false}={}){
  const template=document.createElement("template");template.innerHTML=String(html||"").slice(0,200000);
  [...template.content.querySelectorAll("*")].forEach(el=>{
    if(!HISTORY_ALLOWED_TAGS.has(el.tagName)){el.replaceWith(...el.childNodes);return}
    const attrs=[...el.attributes],styleText=el.getAttribute("style")||"";attrs.forEach(a=>el.removeAttribute(a.name));
    if(styleText){const probe=document.createElement("span");probe.setAttribute("style",styleText);for(const prop of HISTORY_STYLE_PROPS){const value=probe.style.getPropertyValue(prop);if(value&&!/url\s*\(/i.test(value))el.style.setProperty(prop,value)}}
    if(el.tagName==="A")el.setAttribute("aria-label","Link in copied content");
    if(["TD","TH"].includes(el.tagName)){for(const name of ["colspan","rowspan"]){const value=attrs.find(a=>a.name.toLowerCase()===name)?.value;if(/^\d{1,2}$/.test(value||""))el.setAttribute(name,value)}}
    if(el.tagName==="IMG"){
      const src=attrs.find(a=>a.name.toLowerCase()==="src")?.value||"",alt=attrs.find(a=>a.name.toLowerCase()==="alt")?.value||"Copied image";
      el.alt=alt;el.loading="lazy";el.referrerPolicy="no-referrer";
      if(/^data:image\/(png|jpeg|gif|webp);base64,/i.test(src))el.src=src;
      else if(/^https?:\/\//i.test(src)){el.dataset.remoteSrc=src;if(loadImages)el.src=src}
    }
  });
  return template.content;
}
function isLocalToday(ts){const d=new Date(Number(ts)||0),n=new Date();return d.getFullYear()===n.getFullYear()&&d.getMonth()===n.getMonth()&&d.getDate()===n.getDate()}
function sameHistoryIdentity(a,b){const ai=String(a?.id||""),bi=String(b?.id||"");if(ai&&bi)return ai===bi;return String(a?.text||"")===String(b?.text||"")&&Number(a?.ts||0)===Number(b?.ts||0)}
const unlockedCollectionIds=new Set();
const GENERIC_DOMAIN_HUE_KEY="copyselectGenericDomainHues";
const genericDomainHues=(()=>{try{return new Map(Object.entries(JSON.parse(localStorage.getItem(GENERIC_DOMAIN_HUE_KEY)||"{}")))}catch{return new Map()}})();
function persistentDomainHue(domain){
  const key=String(domain||"").toLowerCase();if(!key)return 210;if(genericDomainHues.has(key))return Number(genericDomainHues.get(key));
  const occupied=new Set([...genericDomainHues.values()].map(Number));let hue=[...key].reduce((n,c)=>(n*33+c.charCodeAt(0))%360,19);while(occupied.has(hue))hue=(hue+47)%360;genericDomainHues.set(key,hue);try{localStorage.setItem(GENERIC_DOMAIN_HUE_KEY,JSON.stringify(Object.fromEntries(genericDomainHues)))}catch{}return hue;
}
const searchNorm=value=>String(value||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
function fuzzyTokenMatch(hay,token){
  if(hay.includes(token))return true;
  const words=hay.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  return words.some(word=>{
    let i=0;for(const ch of word)if(ch===token[i])i++;
    if(i===token.length&&token.length>=3)return true;
    if(token.length<4||Math.abs(word.length-token.length)>1)return false;
    let a=0,b=0,edits=0;
    while(a<word.length&&b<token.length){if(word[a]===token[b]){a++;b++;continue}if(++edits>1)return false;if(word.length>=token.length)a++;if(token.length>=word.length)b++}
    return edits+(word.length-a)+(token.length-b)<=1;
  });
}
function itemIsLocked(h){return (h.collectionIds||[]).some(id=>{const c=(state.historyCollections||[]).find(x=>x.id===id);return c?.locked&&!unlockedCollectionIds.has(id)})}
function filteredHistory(source=state.history,{applyFilters=true}={}){
  const raw=(($("#historySearch")?.value)||"").trim(),filter=$("#historyFilter")?.value||"all",sort=$("#historySort")?.value||"newest",now=Date.now();
  let sourceItems=[...(source||[])].filter(h=>!itemIsLocked(h));
  const pinnedIds=new Set((state.pinned||[]).map(x=>x.id)),stackIds=new Set((state.pasteStack||[]).map(x=>x.id));
  let advancedHandled=false;
  if(raw&&globalThis.CopySelectSmartCore){
    try{
      const q=CopySelectSmartCore.compileQuery(raw,{collections:state.historyCollections||[]});
      sourceItems=q.filter(sourceItems.map(h=>({...h,pinned:pinnedIds.has(h.id),inPasteStack:stackIds.has(h.id)})));
      advancedHandled=true;
      $("#historySearch")?.removeAttribute("aria-invalid");
    }catch(err){$("#historySearch")?.setAttribute("aria-invalid","true")}
  }
  const operators={},terms=[];let phrases=[];
  if(!advancedHandled){
    let working=raw.replace(/\b(site|collection|tag|collectionID):(?:"([^"]+)"|([^\s"]+))/gi,(_,key,quoted,bare)=>{const value=String(quoted||bare||"").trim().toLowerCase();if(value)(operators[key.toLowerCase()]||(operators[key.toLowerCase()]=[])).push(value);return " "});
    phrases=[...working.matchAll(/"([^"]+)"/g)].map(m=>m[1].toLowerCase());working=working.replace(/"[^"]+"/g," ");
    for(const token of working.split(/\s+/).filter(Boolean)){const lower=token.toLowerCase();if(["today","pinned","formatted","images","repeated"].includes(lower)){operators[lower]=["1"];continue}terms.push(lower)}
    sourceItems=sourceItems.filter(h=>{
      const collectionNames=(h.collectionIds||[]).map(id=>(state.historyCollections||[]).find(c=>c.id===id)?.name||"");
      const hay=searchNorm([h.rawText,h.text,h.label,h.note,h.title,h.url,...(h.tags||[]),...collectionNames].join("\n")),domain=(()=>{try{return new URL(h.url).hostname.toLowerCase()}catch{return""}})();
      if(phrases.some(p=>!hay.includes(searchNorm(p)))||terms.some(t=>!fuzzyTokenMatch(hay,searchNorm(t))))return false;
      if(operators.site&&!operators.site.some(v=>domain.includes(v)))return false;
      if(operators.collection){const names=(h.collectionIds||[]).map(id=>(state.historyCollections||[]).find(c=>c.id===id)?.name?.toLowerCase()||"");if(!operators.collection.some(v=>names.some(n=>n.includes(v))))return false}
      if(operators.collectionid&&!operators.collectionid.some(v=>(h.collectionIds||[]).some(id=>String(id).toLowerCase()===v)))return false;
      if(operators.tag&&!operators.tag.some(v=>(h.tags||[]).some(t=>String(t).toLowerCase()===v)))return false;
      if(operators.today&&!isLocalToday(h.ts))return false;if(operators.pinned&&!pinnedIds.has(h.id))return false;
      if(operators.formatted&&!String(h.html||"").trim())return false;if(operators.images&&!/<img\b/i.test(String(h.html||"")))return false;if(operators.repeated&&(Number(h.repeatCount)||1)<2)return false;return true;
    });
  }
  let items=sourceItems.filter(h=>{
    if(!applyFilters)return true;
    if(filter==="today")return isLocalToday(h.ts);if(filter==="week")return now-h.ts<604800000;if(filter==="pinned")return pinnedIds.has(h.id);
    if(filter==="formatted")return !!String(h.html||"").trim();if(filter==="images")return /<img\b/i.test(String(h.html||""));if(filter==="long")return String(h.rawText??h.text??"").length>300;if(filter==="repeated")return (Number(h.repeatCount)||1)>1;
    if(filter.startsWith("collection:"))return (h.collectionIds||[]).includes(filter.slice(11));return true;
  });
  const rank=h=>{const body=searchNorm(h.text),secondary=searchNorm([h.label,h.note,h.title,h.url,...(h.tags||[])].join(" "));return terms.reduce((score,t)=>score+(body.includes(searchNorm(t))?20:secondary.includes(searchNorm(t))?10:1),0)+phrases.reduce((score,p)=>score+(body.includes(searchNorm(p))?100:0),0)};
  items=[...items].sort((a,b)=>(sort==="newest"&&!advancedHandled&&(terms.length||phrases.length)?rank(b)-rank(a):0)||(sort==="oldest"?a.ts-b.ts:sort==="longest"?String(b.text||"").length-String(a.text||"").length:b.ts-a.ts));
  return items;
}
function historyDateOnly(ts){
  const d=new Date(ts),now=new Date(),yesterday=new Date(now);yesterday.setDate(now.getDate()-1);
  const sameDay=(a,b)=>a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();
  if(sameDay(d,yesterday))return "Yesterday";
  if(state.historyTimestampFormat==="iso")return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  if(state.historyTimestampFormat==="locale")return d.toLocaleDateString();
  const months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sept","Oct","Nov","Dec"];return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}
function relativeTime(ts){
  const min=Math.max(0,(Date.now()-Number(ts||0))/60000);
  if(min<2.5)return "1 min ago";
  if(min<7.5)return "~5 min ago";
  if(min<12.5)return "~10 min ago";
  if(min<22.5)return "~15 min ago";
  if(min<37.5)return "~30 min ago";
  if(min<52.5)return "~45 min ago";
  if(min<90)return "~1 hr ago";
  if(min<150)return "~2 hrs ago";
  if(min<210)return "~3 hrs ago";
  return historyDateOnly(ts);
}
function historyTimelineClock(ts){
  const d=new Date(Number(ts)||Date.now());
  const q=Math.floor(d.getMinutes()/15)*15;d.setMinutes(q,0,0);
  return d.toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"});
}
function historyTimelineDay(ts){
  const d=new Date(Number(ts)||Date.now()),now=new Date(),yesterday=new Date(now);yesterday.setDate(now.getDate()-1);
  const sameDay=(a,b)=>a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();
  if(sameDay(d,now))return "Today";if(sameDay(d,yesterday))return "Yesterday";return historyDateOnly(ts);
}
function historyTimelineMarkers(items,nowMs=Date.now()){
  const ages=items.map(h=>Math.max(0,(nowMs-Number(h.ts||0))/60000));
  const recentCount=ages.filter(m=>m<=15).length;
  const hourCounts=new Map();
  ages.forEach(m=>{if(m>60&&m<240){const h=Math.max(1,Math.floor(m/60));hourCounts.set(h,(hourCounts.get(h)||0)+1)}});
  const markers=[];let previousKey=null;
  for(let i=0;i<items.length;i++){
    const ts=Number(items[i].ts||0),min=ages[i];let key,label;
    if(min<=15){
      if(recentCount>12){const bucket=Math.max(1,Math.min(13,Math.floor(Math.max(0,min-1)/3)*3+1));key=`r3:${bucket}`;label=bucket===1?"1 min ago":`~${bucket} min ago`}
      else{const minute=Math.max(1,Math.min(15,Math.round(min)));key=`rm:${minute}`;label=`${minute} min ago`}
    }else if(min<60){
      const q=Math.max(15,Math.min(45,Math.round(min/15)*15));key=`rq:${q}`;label=`~${q} min ago`;
    }else if(min<240){
      const hour=Math.max(1,Math.floor(min/60)),dense=(hourCounts.get(hour)||0)>8;
      if(dense){const total=Math.max(60,Math.round(min/15)*15),h=Math.floor(total/60),q=total%60;key=`rhq:${total}`;label=q?`~${h} hr ${q} min ago`:`~${h} hr${h===1?"":"s"} ago`}
      else{const h=Math.max(1,Math.min(3,Math.round(min/60)));key=`rh:${h}`;label=`~${h} hr${h===1?"":"s"} ago`}
    }else{
      const d=new Date(ts),q=Math.floor(d.getMinutes()/15)*15;d.setMinutes(q,0,0);key=`abs:${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}-${q}`;label=`${historyTimelineDay(ts)}\n${historyTimelineClock(ts)}`;
    }
    if(key===previousKey)markers.push("");else{markers.push(label);previousKey=key}
  }
  return markers;
}

function absoluteHistoryTime(ts){const d=new Date(ts);if(state.historyTimestampFormat==="iso")return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}:${String(d.getSeconds()).padStart(2,"0")}`;if(state.historyTimestampFormat==="locale")return d.toLocaleString();const months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sept","Oct","Nov","Dec"],pad=n=>String(n).padStart(2,"0");return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}.${pad(d.getSeconds())}`}
let historyStatusTimer=null;
const historyBatchSelection=new Set();
function announceHistory(message,error=false){
  const el=$("#historyActionStatus");if(!el)return;
  clearTimeout(historyStatusTimer);el.textContent=message;el.classList.toggle("error",error);announceA11y(message,error);
  historyStatusTimer=setTimeout(()=>{el.textContent="";el.classList.remove("error")},2200);
}
function historyRgb(value){const m=String(value||"").match(/rgba?\((\d+)[, ]+(\d+)[, ]+(\d+)(?:[, /]+([\d.]+))?/i);return m?{r:Number(m[1]),g:Number(m[2]),b:Number(m[3]),a:m[4]===undefined?1:Number(m[4])}:null}
function historyRelativeLuminance({r,g,b}){const lin=v=>{v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4)};return .2126*lin(r)+.7152*lin(g)+.0722*lin(b)}
function historyContrastRatio(a,b){const la=historyRelativeLuminance(a),lb=historyRelativeLuminance(b),hi=Math.max(la,lb),lo=Math.min(la,lb);return (hi+.05)/(lo+.05)}
function historyEffectiveBackground(el,stop){for(let n=el;n&&n!==stop?.parentElement;n=n.parentElement){const c=historyRgb(getComputedStyle(n).backgroundColor);if(c&&c.a>.05)return c}return {r:255,g:255,b:255,a:1}}
function markHistoryLightText(content){if(!content)return;requestAnimationFrame(()=>{let adjusted=false;const nodes=[content,...content.querySelectorAll("*")];for(const el of nodes){el.classList.remove("history-light-text","history-auto-contrast");const fg=historyRgb(getComputedStyle(el).color);if(!fg||fg.a<.15)continue;const bg=historyEffectiveBackground(el,content.closest(".history-item"));if(historyContrastRatio(fg,bg)<4.5){el.classList.add("history-auto-contrast");adjusted=true}}const item=content.closest(".history-item");if(item){item.dataset.contrastAdjusted=adjusted?"1":"0";item.dispatchEvent(new CustomEvent("historycontrastchange",{bubbles:true,detail:{adjusted}}))}})}
function makeHistoryItem(h,{pinned=false,showSiteIcon=false}={}){
  const full=String(h.text||""),rich=String(h.html||"").trim(),richReusable=!!rich&&full===String(h.originalText??h.rawText??h.text??""),ex=historyExcerpt(full),d=document.createElement("article");d.className="history-item history-card";
  const check=document.createElement("input");check.type="checkbox";check.className="history-batch-check";check.checked=historyBatchSelection.has(h.id);check.setAttribute("aria-label","Select history item");check.onchange=()=>{check.checked?historyBatchSelection.add(h.id):historyBatchSelection.delete(h.id);renderHistorySelection()};d.append(check)
  d.setAttribute("aria-label",`${rich?"Formatted ":""}history entry`);
  const source=h.title||h.url||"Copied text",domain=(()=>{try{return new URL(h.url).hostname}catch{return""}})();check.setAttribute("aria-label",`Select history item: ${source}`);
  const top=document.createElement("div");top.className="history-top";
  const metaWrap=document.createElement("div");metaWrap.className="history-entry-meta";
  const src=document.createElement("div");src.className="history-source";
  const srcTitle=document.createElement("span");srcTitle.className="history-source-title";srcTitle.textContent=h.label||source;src.append(srcTitle);
  if(domain){const domainLabel=document.createElement("span");domainLabel.className="history-domain";domainLabel.textContent=`(${domain})`;src.append(domainLabel)}
  if(h.label){const originalSource=document.createElement("small");originalSource.className="history-original-source";originalSource.textContent=source;src.append(originalSource)}
  const absolute=document.createElement("time");absolute.className="history-absolute-time";absolute.dateTime=new Date(h.ts).toISOString();absolute.textContent=absoluteHistoryTime(h.ts);
  const meta=document.createElement("div");meta.className="history-meta";meta.textContent=`${full.length.toLocaleString()} characters${rich?" · Formatted":""}`;if((Number(h.repeatCount)||1)>1){const repeat=document.createElement("span");repeat.className="history-repeat-badge";repeat.textContent=`×${h.repeatCount}`;repeat.title=`Copied ${h.repeatCount} times`;src.append(repeat)}metaWrap.append(src,absolute,meta);
  const actions=document.createElement("div");actions.className="history-actions";
  const alreadyPinned=pinned||state.pinned.some(x=>sameHistoryIdentity(x,h));
  const pin=document.createElement("button");pin.className="btn icon-btn pin-btn"+(alreadyPinned?" pinned":"");const pinImg=document.createElement("img");pinImg.src=alreadyPinned?"assets/icons/pin-down.svg":"assets/icons/pin-angled.svg";pinImg.alt="";pin.append(pinImg);pin.title=alreadyPinned?"Unpin":"Pin";pin.setAttribute("aria-label",alreadyPinned?"Unpin entry":"Pin entry");
  const copyAsWrap=document.createElement("div");copyAsWrap.className="history-copy-as";const copyAs=document.createElement("button");copyAs.className="btn history-copy-as-btn";copyAs.type="button";copyAs.textContent="Copy as ⌄";copyAs.setAttribute("aria-expanded","false");copyAs.setAttribute("aria-haspopup","menu");const copyMenu=document.createElement("div");copyMenu.className="history-copy-as-menu hidden";copyMenu.setAttribute("role","menu");copyMenu.innerHTML='<button role="menuitem" data-copy-format="original">Rich Text</button><button role="menuitem" data-copy-format="plain">Plain Text</button><button role="menuitem" data-copy-format="markdown">Markdown + source</button><button role="menuitem" data-copy-format="quote-source">Quote + Source</button><button role="menuitem" data-copy-format="url-title">Text + Reference</button><button role="menuitem" data-copy-format="custom">Custom Template</button>';const hasSource=!!(h.url||h.title),richButton=copyMenu.querySelector('[data-copy-format="original"]');richButton.disabled=!richReusable;richButton.title=richReusable?"Copy the saved Rich Text":rich?"Rich formatting belongs to the preserved original and cannot safely represent the edited reusable text":"Rich Text was not captured for this item";for(const format of ["markdown","quote-source","url-title"]){const button=copyMenu.querySelector(`[data-copy-format="${format}"]`);button.disabled=!hasSource;if(!hasSource)button.title="Source details were not captured for this item"}copyAsWrap.append(copyAs,copyMenu);wireDisclosureKeyboard(copyAs,copyMenu);
  const edit=document.createElement("button");edit.className="btn icon-btn history-edit";edit.type="button";edit.textContent="✎";edit.title="Edit clip, label, or note";edit.setAttribute("aria-label","Edit clip, label, or note");
  const del=document.createElement("button");del.className="btn icon-btn history-delete";const trash=document.createElement("img");trash.src="assets/icons/trash.svg";trash.alt="";del.append(trash);del.title="Delete this snippet";del.setAttribute("aria-label","Delete history entry");
  actions.append(copyAsWrap,edit,pin,del);top.append(metaWrap);
  metaWrap.classList.toggle("hidden",!state.historyShowMetadata);
  const contentWrap=document.createElement("div");contentWrap.className="history-content-wrap";
  if(showSiteIcon&&h.url){const favicon=document.createElement("img");favicon.className="history-site-icon";favicon.alt="";favicon.title=domain||"Source site";favicon.src=chrome.runtime.getURL(`/_favicon/?pageUrl=${encodeURIComponent(h.url)}&size=16`);d.append(favicon);d.classList.add("has-site-icon")}
  const content=document.createElement("div");content.className="history-text"+(rich?" history-rich":" history-plain");
  if(richReusable)content.append(sanitizedHistoryFragment(rich));else content.textContent=ex.text;
  content.setAttribute("aria-label","Copied content preview");
  contentWrap.tabIndex=0;contentWrap.setAttribute("aria-label",`Copy ${rich?"formatted ":""}history entry`);contentWrap.append(content);
  if(richReusable)markHistoryLightText(content);if(h.note&&state.historyViewMode==="full"){const note=document.createElement("p");note.className="history-clip-note";note.textContent=h.note;contentWrap.append(note)}
  const tagRow=buildHistoryTagRow(h);if(tagRow)contentWrap.append(tagRow);
  contentWrap.append(actions);d.append(top,contentWrap);
  const copyEntry=async format=>{
    const raw=String(h.text??""),ctx={url:h.url||"",title:h.title||"",selectionHtml:rich||null};let text=full,html=null,label="Copied";
    if(format==="original"){text=full;html=richReusable?rich:null;label=richReusable?"Copied with formatting":"Copied reusable text"}
    else if(format==="plain"){text=raw;label="Copied as plain text"}
    else if(format==="markdown"){text=h.url?`${raw}

[${h.title||h.url}](${h.url})`:raw;label="Copied as Markdown"}
    else{const out=formatCopy(raw,ctx,{...state,copyMode:format,includeMetadata:false});text=out.text;html=out.html;label=format==="quote-source"?"Copied as Quote + Source":format==="url-title"?"Copied with reference":"Copied with custom template"}
    const result=await safeMessage({action:"copyAgain",source:"history",text,html});
    d.classList.remove("copy-flash","copy-error");void d.offsetWidth;
    if(result?.ok){d.classList.add("copy-flash");announceHistory(label);setTimeout(()=>d.classList.remove("copy-flash"),500)}
    else{d.classList.add("copy-error");announceHistory(result?.error||"Copy failed",true);setTimeout(()=>d.classList.remove("copy-error"),1200)}
  };
  contentWrap.addEventListener("click",e=>{if(e.target.closest("button"))return;void copyEntry("original")});
  contentWrap.addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&!e.target.closest("button")){e.preventDefault();void copyEntry("original")}});
  copyAs.addEventListener("click",e=>{e.stopPropagation();if(copyMenu.classList.contains("hidden"))openFloatingMenu(copyAs,copyMenu,{align:"right"});else closeFloatingMenu(copyAs,copyMenu)});
  copyMenu.addEventListener("click",e=>{e.stopPropagation();const button=e.target.closest("[data-copy-format]");if(!button||button.disabled)return;closeFloatingMenu(copyAs,copyMenu);void copyEntry(button.dataset.copyFormat)});
  edit.addEventListener("click",e=>{e.stopPropagation();openClipEditor(h)});
  const expandable=!!ex.hidden||(richReusable&&/(<img|<table|<ul|<ol|<blockquote|<pre|<h[1-6])/i.test(rich));
  if(expandable){
    d.classList.add("expandable");const expand=document.createElement("button"),setExpandIcon=open=>{expand.innerHTML=`<img class="history-snippet-reference-icon" src="assets/icons/snippet-${open?"compact":"expanded"}.png" alt="">`};expand.className="history-expand";expand.setAttribute("aria-label","Expand snippet");expand.title="Expand snippet";expand.setAttribute("aria-expanded","false");setExpandIcon(false);actions.prepend(expand);
    let peekTimer=null;
    const open=()=>{clearTimeout(peekTimer);if(richReusable){content.innerHTML="";content.append(sanitizedHistoryFragment(rich,{loadImages:true}));markHistoryLightText(content)}else content.textContent=full;d.classList.add("expanded");metaWrap.classList.toggle("hidden",!state.historyShowMetadata);expand.setAttribute("aria-expanded","true");expand.setAttribute("aria-label","Collapse snippet");expand.title="Collapse snippet";setExpandIcon(true)};
    const close=()=>{clearTimeout(peekTimer);if(richReusable){content.innerHTML="";content.append(sanitizedHistoryFragment(rich));markHistoryLightText(content)}else content.textContent=ex.text;d.classList.remove("expanded");metaWrap.classList.toggle("hidden",!state.historyShowMetadata);expand.setAttribute("aria-expanded","false");expand.setAttribute("aria-label","Expand snippet");expand.title="Expand snippet";setExpandIcon(false)};
    expand.addEventListener("click",e=>{e.stopPropagation();d.classList.contains("expanded")?close():open()});
    top.addEventListener("click",e=>{e.stopPropagation()});
    d.addEventListener("mouseenter",()=>{if(state.historyHoverExpand&&!d.classList.contains("expanded"))peekTimer=setTimeout(open,state.historyHoverDelay)});d.addEventListener("mouseleave",()=>clearTimeout(peekTimer));
    d.addEventListener("keydown",e=>{if(e.key==="Escape")close()});
    if(state.historyViewMode==="full")open();
  }else d.classList.add("not-expandable");
  pin.onclick=async e=>{
    e.stopPropagation();
    pin.disabled=true;
    const result=alreadyPinned?await safeMessage({action:"unpin",id:h.id,text:h.text}):await safeMessage({action:"pin",item:h});
    pin.disabled=false;
    if(!result?.ok){announceHistory(result?.error||"Pin action failed",true);return}
    const runtime=await safeMessage({action:"runtimeData"});
    if(!runtime?.history){announceHistory(runtime?.error||"Could not refresh history",true);return}
    state.pinned=runtime.pinned||[];announceHistory(alreadyPinned?"Removed from pinned":"Pinned for later");
    renderHistory();
  };
  del.onclick=async e=>{e.stopPropagation();if(!await confirmDestructive("Delete this history snippet?"))return;const result=await safeMessage({action:"deleteHistory",id:h.id});if(!result?.ok){announceHistory(result?.error||"Could not delete snippet",true);return}const runtime=await safeMessage({action:"runtimeData"});if(runtime?.history){state.history=runtime.history;state.pinned=runtime.pinned||[];state.pasteStack=runtime.pasteStack||[];renderHistory();announceHistory("Snippet deleted")}};
  return d;
}
const HISTORY_RENDER_BATCH=50;
let historyVisibleRecent=HISTORY_RENDER_BATCH,historyVisiblePinned=HISTORY_RENDER_BATCH,historyLoadObserver=null;
function resetHistoryPaging(){historyVisibleRecent=HISTORY_RENDER_BATCH;historyVisiblePinned=HISTORY_RENDER_BATCH}
function disconnectHistoryLoadObserver(){historyLoadObserver?.disconnect?.();historyLoadObserver=null}
function installHistoryAutoLoad(){
  disconnectHistoryLoadObserver();
  const sentinels=$$(".history-more-sentinel");if(!sentinels.length||typeof IntersectionObserver!=="function")return;
  historyLoadObserver=new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting)continue;const kind=entry.target.dataset.historyMore;if(kind==="pinned")historyVisiblePinned+=HISTORY_RENDER_BATCH;else historyVisibleRecent+=HISTORY_RENDER_BATCH;disconnectHistoryLoadObserver();renderHistory();break}},{root:null,rootMargin:"220px 0px",threshold:0});
  sentinels.forEach(el=>historyLoadObserver.observe(el));
}

function renderHistory(){
  disconnectHistoryLoadObserver();
  document.querySelectorAll(".floating-ui-menu").forEach(menu=>{const o=floatingMenuOrigins.get(menu);closeFloatingMenu(o?.trigger,menu)});
  const validIds=new Set([...state.history,...state.pinned].filter(x=>!itemIsLocked(x)).map(x=>x.id));for(const id of historyBatchSelection)if(!validIds.has(id))historyBatchSelection.delete(id);
  if($("#historyCount"))$("#historyCount").textContent=state.history.length;
  $("#pinnedCount").textContent=state.pinned.length;
  $("#toggleHistoryMetadata").checked=!!state.historyShowMetadata;
  $("#historyCompact").classList.toggle("active",state.historyViewMode==="compact");$("#historyCompact").setAttribute("aria-pressed",String(state.historyViewMode==="compact"));$("#historyFull").classList.toggle("active",state.historyViewMode==="full");$("#historyFull").setAttribute("aria-pressed",String(state.historyViewMode==="full"));
  if($("#historyTimestampFormat"))$("#historyTimestampFormat").value=state.historyTimestampFormat||"friendly";
  if($("#historyRetentionValue"))$("#historyRetentionValue").value=state.historyLimit;
  $("#historyAutoDeleteValue").value=state.historyAutoDeleteValue;$("#historyAutoDeleteUnit").value=state.historyAutoDeleteUnit;
  $$(".history-auto-delete-controls input,.history-auto-delete-controls select").forEach(el=>el.disabled=!state.historyAutoDelete);
  $("#historyHoverExpand").checked=!!state.historyHoverExpand;
  if($("#historyHoverDelay")){
    $("#historyHoverDelay").value=state.historyHoverDelay;
    $("#historyHoverDelay").disabled=!state.historyHoverExpand;
  }
  $(".history-hover-delay")?.classList.toggle("dependent-off",!state.historyHoverExpand);
  let policy=$(".history-retention-summary");if(!policy){policy=document.createElement("p");policy.className="history-retention-summary";$(".history-auto-delete")?.closest(".history-subcard")?.append(policy)}if(policy){const limit=Math.max(1,Number(state.historyLimit)||50),minimum=Math.min(Number(state.historyMinimumKeep)||0,limit),unit=state.historyAutoDeleteUnit==="hours"?"hours":"days",duration=Math.max(1,Number(state.historyAutoDeleteValue)||30);policy.innerHTML=state.historyAutoDelete?`Keep up to <strong>${limit} entries</strong> for up to<br><span class="retention-indent"><strong>${duration} ${unit}</strong>, but always retain at least <strong>${minimum} entries</strong>.<br>Older, unpinned items are tidied automatically.</span>`:`Keep up to <strong>${limit} entries</strong>.<br><span class="retention-indent">Always retain at least <strong>${minimum} entries</strong>.<br>Older, unpinned items are tidied automatically.</span>`}
  $(".history-retention-panel")?.classList.toggle("history-storage-off",!state.historyEnabled);
  $$(".history-retention-panel input,.history-retention-panel select,.history-retention-panel button").forEach(el=>{if(el.dataset.key!=="historyEnabled"&&el.id!=="clearHistory")el.disabled=!state.historyEnabled});
  const autoDeleteToggle=document.querySelector('[data-key="historyAutoDelete"]');if(autoDeleteToggle)autoDeleteToggle.disabled=!state.historyEnabled;
  $$(".history-auto-delete-controls input,.history-auto-delete-controls select").forEach(el=>el.disabled=!state.historyEnabled||!state.historyAutoDelete);
  const box=$("#historyList");box.innerHTML="";
  const items=filteredHistory(),visibleItems=items.slice(0,historyVisibleRecent);
  if(!items.length)box.innerHTML='<div class="history-empty">No matching history.</div>';
  else appendHistoryTimeGroups(box,visibleItems,{hasMore:visibleItems.length<items.length,moreKind:"recent"});
  const pbox=$("#pinnedList");pbox.innerHTML="";
  const pinnedItems=filteredHistory(state.pinned),visiblePinned=pinnedItems.slice(0,historyVisiblePinned);
  if(!pinnedItems.length)pbox.innerHTML='<div class="history-empty">Nothing pinned here. Use the pushpin on any recent item to keep it.</div>';
  else appendHistoryTimeGroups(pbox,visiblePinned,{pinned:true,hasMore:visiblePinned.length<pinnedItems.length,moreKind:"pinned"});
  renderHistoryCollections();renderHistorySelection();renderPasteStack();renderOrganizationHub();installHistoryAutoLoad();
}
function historyBucket(ts){return Math.floor(Number(ts||Date.now())/900000)*900000}
function historyBucketLabel(ts){
  const bucketTs=historyBucket(ts),d=new Date(bucketTs),now=new Date(),yesterday=new Date(now);yesterday.setDate(now.getDate()-1);
  const sameDay=(a,b)=>a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();
  const day=sameDay(d,now)?"Today":sameDay(d,yesterday)?"Yesterday":d.toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"});
  return {day,dayKey:`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`,bucketTs,time:d.toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"}),relative:""};
}
function appendHistoryTimeGroups(container,items,opts={}){
  const pinnedIds=new Set((state.pinned||[]).map(x=>x.id)),stackIds=new Set((state.pasteStack||[]).map(x=>x.id));
  const timelineMarkers=historyTimelineMarkers(items);
  let previousSiteKey=null;const usedHues=new Set(),domainHues=new Map();const hueFor=domain=>{if(domainHues.has(domain))return domainHues.get(domain);let hue=persistentDomainHue(domain);while(usedHues.has(hue)&&![...domainHues.entries()].some(([d,h])=>d===domain&&h===hue))hue=(hue+47)%360;usedHues.add(hue);domainHues.set(domain,hue);return hue};
  const makeDomainFallback=(domain,label)=>{const fallback=document.createElement("span");fallback.className="history-domain-initial";fallback.textContent=(label||domain||"C").trim().charAt(0).toUpperCase()||"C";fallback.title=domain||"Local clipboard item";fallback.style.setProperty("--domain-hue",String(domain?hueFor(domain):210));return fallback};
  items.forEach((h,itemIndex)=>{
      const row=document.createElement("section");row.className="history-time-group history-entry-row";const item=makeHistoryItem(h,{...opts,showSiteIcon:false});item.dataset.historyId=h.id;const check=item.querySelector(".history-batch-check");if(check)check.dataset.historyId=h.id;
      const marker=document.createElement("div");marker.className="history-time-marker";const post=document.createElement("time");post.className="history-quarter-post";post.dateTime=new Date(h.ts).toISOString();post.textContent=timelineMarkers[itemIndex]||"";post.classList.toggle("empty",!post.textContent);marker.append(post);
      const iconSlot=document.createElement("div");iconSlot.className="history-icon-slot";let site="";try{site=new URL(h.url).hostname}catch{}const siteKey=site||"__local__",isLast=itemIndex===items.length-1,needsIcon=isLast||siteKey!==previousSiteKey;previousSiteKey=siteKey;if(needsIcon){if(site){const favicon=document.createElement("img"),fallback=makeDomainFallback(site,site);favicon.className="history-timeline-icon";favicon.alt="";favicon.title=site;favicon.src=chrome.runtime.getURL(`/_favicon/?pageUrl=${encodeURIComponent(h.url)}&size=16`);favicon.onerror=()=>favicon.replaceWith(fallback);iconSlot.append(favicon)}else iconSlot.append(makeDomainFallback("","C"))}
      const contrast=document.createElement("span");contrast.className="history-contrast-indicator hidden";contrast.setAttribute("role","img");contrast.setAttribute("aria-label","Preview contrast adjusted");contrast.dataset.tip="Text was recolored in this preview to improve readability. The saved Rich Text colors were not changed.";contrast.innerHTML='<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8.2" fill="white" stroke="currentColor" stroke-width="1.6"/><path d="M10 1.8a8.2 8.2 0 0 1 0 16.4z" fill="currentColor"/></svg>';const syncContrast=()=>contrast.classList.toggle("hidden",item.dataset.contrastAdjusted!=="1");item.addEventListener("historycontrastchange",syncContrast);syncContrast();
      if(check)row.append(check);else row.append(document.createElement("span"));row.append(marker,iconSlot,contrast,item);
      row.addEventListener("click",e=>{if(!check||e.target.closest("input,button,a,select,textarea,.history-item"))return;const railX=iconSlot.getBoundingClientRect().left;if(e.clientX>=railX)return;check.checked=!check.checked;check.checked?historyBatchSelection.add(h.id):historyBatchSelection.delete(h.id);renderHistorySelection()});
      container.append(row);
  });
  if(opts.hasMore){const more=document.createElement("div");more.className="history-more-sentinel";more.dataset.historyMore=opts.moreKind||"recent";more.setAttribute("role","status");more.textContent="Loading more…";container.append(more)}else{const end=document.createElement("div");end.className="history-end-marker";const filter=String($("#historyFilter")?.value||"all"),query=String($("#historySearch")?.value||"").trim();let label="End of History";if(opts.pinned)label="End of Pinned";else if(query)label="End of results";else if(filter!=="all"){const names={today:"Today",week:"This week",pinned:"Pinned",formatted:"Formatted",images:"Images",long:"Long snippets",repeated:"Repeated"};if(filter.startsWith("collection:")){const id=filter.slice(11),c=(state.historyCollections||[]).find(x=>x.id===id);label=`End of ${c?.name||"Collection"}`}else label=`End of ${names[filter]||"History"}`;}end.innerHTML=`<span class="history-end-icon" aria-hidden="true">●</span><span>${escapeHtml(label)}</span>`;container.append(end)}
  requestAnimationFrame(()=>{const rows=[...container.querySelectorAll(".history-entry-row")];if(!rows.length)return;container.classList.toggle("history-single-entry",rows.length===1);const cr=container.getBoundingClientRect(),firstIcon=rows[0].querySelector(".history-timeline-icon,.history-domain-initial")?.getBoundingClientRect(),lastIcon=rows.at(-1).querySelector(".history-timeline-icon,.history-domain-initial")?.getBoundingClientRect();if(firstIcon&&lastIcon&&rows.length>1){const firstCenterY=(firstIcon.top-cr.top)+(firstIcon.height/2),lastCenterY=(lastIcon.top-cr.top)+(lastIcon.height/2),railLeft=(firstIcon.left-cr.left)+(firstIcon.width/2);container.style.setProperty("--timeline-rail-top",`${Math.max(0,firstCenterY)}px`);container.style.setProperty("--timeline-rail-bottom",`${Math.max(0,cr.height-lastCenterY)}px`);container.style.setProperty("--timeline-rail-left",`${Math.max(0,railLeft)}px`)}});
}
function setHistoryTab(which){
  const pinned=which==="pinned";
  $("#historyRecentPane").classList.toggle("hidden",pinned);$("#historyPinnedPane").classList.toggle("hidden",!pinned);
  $("#historyTabRecent").classList.toggle("active",!pinned);$("#historyTabPinned").classList.toggle("active",pinned);
  $("#historyTabRecent").setAttribute("aria-selected",String(!pinned));$("#historyTabPinned").setAttribute("aria-selected",String(pinned));$("#historyTabRecent").tabIndex=pinned?-1:0;$("#historyTabPinned").tabIndex=pinned?0:-1;
  $("#historyFilter").disabled=pinned;queueMicrotask(installHistoryAutoLoad);announceA11y(`${pinned?"Pinned":"Recent"} clipboard history`);$("#historyFilter").title=pinned?"Filters apply to Recent; search and sorting apply to Pinned.":"";
}
$("#historyTabRecent")?.addEventListener("click",()=>setHistoryTab("recent"));
$("#historyTabPinned")?.addEventListener("click",()=>setHistoryTab("pinned"));
$$('.history-tabs [role="tab"]').forEach((tab,i,tabs)=>tab.addEventListener("keydown",e=>{if(e.key==="ArrowRight"||e.key==="ArrowLeft"){e.preventDefault();const next=tabs[(i+(e.key==="ArrowRight"?1:-1)+tabs.length)%tabs.length];next.click();next.focus()}}));
function syncHistorySearchClear(){const input=$("#historySearch"),clear=$("#clearHistorySearch");if(clear)clear.classList.toggle("hidden",!String(input?.value||""))}
$("#historySearch")?.addEventListener("input",()=>{syncHistorySearchClear();resetHistoryPaging();renderHistory()});
$("#clearHistorySearch")?.addEventListener("click",()=>{const input=$("#historySearch");if(!input)return;input.value="";syncHistorySearchClear();resetHistoryPaging();renderHistory();input.focus()});
$("#historyFilter")?.addEventListener("change",e=>{resetHistoryPaging();const id=String(e.currentTarget.value||"").startsWith("collection:")?String(e.currentTarget.value).slice(11):"",c=(state.historyCollections||[]).find(x=>x.id===id);if(c?.locked&&!unlockedCollectionIds.has(id)){e.currentTarget.value="all";openUnlockDialog(id);return}renderHistory()});
$("#historySort")?.addEventListener("change",()=>{resetHistoryPaging();renderHistory()});
$("#toggleHistoryMetadata")?.addEventListener("change",async e=>{await persist("historyShowMetadata",e.target.checked);renderHistory()});
let historyViewRequest=0;
async function setHistoryView(mode){const request=++historyViewRequest;state.historyViewMode=mode;renderHistory();await chrome.storage.sync.set({historyViewMode:mode});if(request!==historyViewRequest)return;state.historyViewMode=mode;renderHistory()}
$("#historyCompact")?.addEventListener("click",()=>setHistoryView("compact"));
$("#historyFull")?.addEventListener("click",()=>setHistoryView("full"));
$("#historyTimestampFormat")?.addEventListener("change",async e=>{await persist("historyTimestampFormat",e.target.value);renderHistory()});
async function pruneAndRender(){const result=await safeMessage({action:"pruneHistory"});if(result?.history)state.history=result.history;renderHistory()}
$("#historyRetentionValue")?.addEventListener("change",async e=>{const value=Math.max(1,Number(e.target.value)||50);await persist("historyLimit",value);if(state.historyMinimumKeep>value)await persist("historyMinimumKeep",value);await pruneAndRender()});
$("#historyAutoDeleteValue")?.addEventListener("change",async e=>{await persist("historyAutoDeleteValue",Number(e.target.value));await pruneAndRender()});
$("#historyAutoDeleteUnit")?.addEventListener("change",async e=>{await persist("historyAutoDeleteUnit",e.target.value);await pruneAndRender()});
for(const key of ["historyAutoDelete","historyMinimumKeep","historyKeepPinnedForever"]){$(`[data-key="${key}"]`)?.addEventListener("change",async e=>{await persist(key,e.target.type==="checkbox"?e.target.checked:e.target.value);await pruneAndRender()})}
$("#historyHoverExpand")?.addEventListener("change",async e=>{await persist("historyHoverExpand",e.target.checked);renderHistory()});
$("#historyHoverDelay")?.addEventListener("input",e=>{const el=e.currentTarget;let v=String(el.value||"").replace(/\D/g,"").slice(0,4);if(v!==String(el.value))el.value=v});
function confirmDestructive(text){return new Promise(resolve=>{const dialog=$("#destructiveConfirmDialog"),ack=$("#destructiveConfirmAck"),button=$("#destructiveConfirmAction"),copy=$("#destructiveConfirmText");if(!dialog)return resolve(false);copy.textContent=text;ack.checked=false;button.disabled=true;const sync=()=>button.disabled=!ack.checked,done=()=>{dialog.removeEventListener("close",done);ack.removeEventListener("change",sync);resolve(dialog.returnValue==="default"&&ack.checked)};ack.addEventListener("change",sync);dialog.addEventListener("close",done);dialog.showModal()})}
$("#collectionReapplyWordWatch")?.addEventListener("click",async event=>{event.preventDefault();event.stopImmediatePropagation();if(!editingCollectionId){$("#collectionWordWatchTestResult").textContent="Save this Collection first, then reapply WordWatch to existing History.";return}const collection=(state.historyCollections||[]).find(item=>item.id===editingCollectionId),count=(state.history||[]).filter(item=>smartCollectionMatches(item,collection)).length;if(!await confirmDestructive(`Reapply “${collection?.name||"WordWatch"}” to ${count} current History clip${count===1?"":"s"}? This can add organization, pins, or Paste Stack entries.`))return;const result=await safeMessage({action:"reapplyWordWatch",collectionId:editingCollectionId});$("#collectionWordWatchTestResult").textContent=result?.ok?`✓ Reapplied to ${result.matched||0} matching clip${result.matched===1?"":"s"}.`:result?.error||"Could not reapply WordWatch"},true);
// Catch destructive menu actions before legacy bubbling handlers so every delete
// uses the same acknowledgement dialog rather than a one-step browser prompt.
$("#historySelectionActions")?.addEventListener("click",async e=>{const button=e.target.closest('[data-history-action="delete"]');if(!button)return;e.preventDefault();e.stopImmediatePropagation();const items=selectedHistoryItems();if(!items.length)return;if(!await confirmDestructive(`Delete ${items.length} selected item${items.length===1?"":"s"} from History?`))return;for(const item of items)await safeMessage({action:"deleteHistory",id:item.id});historyBatchSelection.clear();await refreshRuntimeHistory();announceHistory("Selected items deleted");closeFloatingMenu($("#historySelectionToggle"),$("#historySelectionActions"))},true);
$("#historyCollectionsMenu")?.addEventListener("click",async e=>{const button=e.target.closest('[data-delete-collection]');if(!button)return;e.preventDefault();e.stopImmediatePropagation();const id=button.dataset.deleteCollection,c=(state.historyCollections||[]).find(x=>x.id===id);if(!c)return;if(c.locked&&!unlockedCollectionIds.has(id)){openUnlockDialog(id);return}if(!await confirmDestructive(`Delete Collection “${c.name}”? Its clips remain safely in History.`))return;state.historyCollections=state.historyCollections.filter(x=>x.id!==id);[...state.history,...state.pinned].forEach(item=>item.collectionIds=(item.collectionIds||[]).filter(collectionId=>collectionId!==id));await chrome.storage.local.set({history:state.history,pinned:state.pinned});await saveCollections();renderHistoryCollections()},true);
$("#clearHistory")?.addEventListener("click",async()=>{
  if(await confirmDestructive("This removes every unpinned clip permanently. Pinned items stay protected.")){
    const result=await safeMessage({action:"clearHistory"});
    if(result?.ok){state.history=[];renderHistory();announceHistory("Unpinned history cleared")}
    else announceHistory(result?.error||"Could not clear history",true);
  }
});
function confidenceLabel(v){v=Number(v)||0;return v>=.9?"High":v>=.72?"Medium":"Low"}
async function persistLearnerChoice(item,tag,accepted){if(!state.smartTagLearningEnabled)return;const {smartTagLearner={}}=await chrome.storage.local.get({smartTagLearner:{}});const next=CopySelectSmartCore?.learnTagChoice?.(smartTagLearner,tag,String(item.rawText??item.text??""),accepted)||smartTagLearner;await chrome.storage.local.set({smartTagLearner:next})}
async function acceptSuggestedTag(item,tag){await persistLearnerChoice(item,tag,true);const r=await safeMessage({action:"updateClipOrganization",id:item.id,addTags:[tag],removeSuggestions:[tag]});if(r?.ok){await refreshRuntimeHistory();announceHistory(`${tag} confirmed`)}else announceHistory(r?.error||"Could not update tag",true)}
async function rejectSuggestedTag(item,tag){await persistLearnerChoice(item,tag,false);const r=await safeMessage({action:"updateClipOrganization",id:item.id,removeSuggestions:[tag]});if(r?.ok){await refreshRuntimeHistory();announceHistory(`${tag} suggestion dismissed`)}else announceHistory(r?.error||"Could not dismiss tag",true)}
function buildHistoryTagRow(h){
  const confirmed=[...(h.tags||[])],suggested=(h.suggestedTags||[]).filter(x=>x&&!x.dismissed),collections=(h.collectionIds||[]).map(id=>(state.historyCollections||[]).find(c=>c.id===id)).filter(c=>c&&!c.locked||unlockedCollectionIds.has(c?.id));
  if(!confirmed.length&&!suggested.length&&!collections.length)return null;
  const row=document.createElement("div");row.className="history-tag-row";
  collections.forEach(c=>{const chip=document.createElement("button");chip.type="button";chip.className="history-collection-chip";chip.textContent=c.name;chip.title=`Collection: ${c.name}`;chip.onclick=e=>{e.stopPropagation();openPage("collections")};row.append(chip)});
  const addToggle=(tag,saved,sg=null)=>{const button=document.createElement("button"),label=document.createElement("span"),stateGlyph=document.createElement("span");button.type="button";button.className=`history-tag-toggle ${saved?"saved":"unsaved"}`;button.setAttribute("aria-pressed",String(saved));label.className="history-tag-toggle-label";label.textContent=tag;stateGlyph.className="history-tag-toggle-state";stateGlyph.textContent=saved?"✓":"×";button.append(label,stateGlyph);button.title=saved?`Saved tag · click to stop saving ${tag}`:`${sg?`Suggested tag · ${confidenceLabel(sg.confidence)} confidence${sg.reason?`\n${sg.reason}`:""}\n`:""}Not saved · click to save`;button.onclick=async e=>{e.stopPropagation();button.disabled=true;if(saved){await persistLearnerChoice(h,tag,false);const r=await safeMessage({action:"updateClipOrganization",id:h.id,removeTags:[tag],keepAsSuggestion:tag,tagSource:"manual"});if(r?.ok){await refreshRuntimeHistory();announceHistory(`${tag} not saved`)}else{button.disabled=false;announceHistory(r?.error||"Could not update tag",true)}}else{await persistLearnerChoice(h,tag,true);const r=await safeMessage({action:"updateClipOrganization",id:h.id,addTags:[tag],removeSuggestions:[tag],tagSource:"manual"});if(r?.ok){await refreshRuntimeHistory();announceHistory(`${tag} saved`)}else{button.disabled=false;announceHistory(r?.error||"Could not update tag",true)}}};row.append(button)};
  confirmed.forEach(tag=>addToggle(tag,true));
  const confirmedLower=new Set(confirmed.map(tag=>String(tag).toLowerCase()));suggested.slice(0,5).forEach(sg=>{if(!confirmedLower.has(String(sg.tag).toLowerCase()))addToggle(sg.tag,false,sg)});
  return row
}
let tagDialogItems=[],tagDialogMode="add";
function openTagDialog(items,{mode="add",suggestions=[]}={}){tagDialogItems=items;tagDialogMode=mode;$("#tagDialogTitle").textContent=mode==="remove"?"Remove tags":"Tags";$("#tagDialogHint").textContent=mode==="remove"?"Remove confirmed tags from the selected clips.":"Add lightweight labels without creating a Collection.";$("#tagDialogInput").value="";const box=$("#tagDialogSuggestions");box.replaceChildren();suggestions.forEach(s=>{const b=document.createElement("button");b.type="button";b.className="history-tag-chip suggested";b.textContent=`${s.tag} · ${confidenceLabel(s.confidence)}`;b.onclick=()=>{const current=CopySelectSmartCore.splitRuleTerms($("#tagDialogInput").value),next=[...new Set([...current,s.tag])];$("#tagDialogInput").value=next.join(", ")};box.append(b)});$("#tagDialogApply").textContent=mode==="remove"?"Remove tags":"Apply tags";$("#tagDialog")?.showModal()}
$("#tagDialogApply")?.addEventListener("click",async e=>{e.preventDefault();const tags=CopySelectSmartCore?.splitRuleTerms?.($("#tagDialogInput").value)||[];if(!tags.length)return;for(const item of tagDialogItems){for(const tag of tags)await persistLearnerChoice(item,tag,tagDialogMode!=="remove");await safeMessage({action:"updateClipOrganization",id:item.id,...(tagDialogMode==="remove"?{removeTags:tags}:{addTags:tags}),tagSource:"manual"})}$("#tagDialog")?.close();await refreshRuntimeHistory();announceHistory(`${tags.length} tag${tags.length===1?"":"s"} ${tagDialogMode==="remove"?"removed":"applied"}`)});
function teachWordWatchFrom(items){const suggestions=CopySelectSmartCore?.suggestTagsForGroup?.(items,{max:10})||[];showCollectionSettings();$("#collectionSmartEnabled").checked=true;$("#collectionSmartText").value=suggestions.slice(0,8).map(x=>x.tag.includes(" ")?x.tag:`${x.tag}*`).join("\n");$("#collectionActionTags").value=suggestions.slice(0,3).map(x=>x.tag).join(", ");$("#collectionDescription").value="Created from selected History examples. Review WordWatch terms before saving.";collectionTargetItems=items;syncSmartEditor();$("#collectionWordWatchTestResult").textContent="Drafted from selected clips. Review the terms, add exclusions if needed, then save."}
function selectedHistoryItems(){return [...state.history,...state.pinned].filter((h,i,a)=>!itemIsLocked(h)&&historyBatchSelection.has(h.id)&&a.findIndex(x=>x.id===h.id)===i)}
function visibleUnorganizedHistoryItems(){
  const pinnedPane=!$("#historyPinnedPane")?.classList.contains("hidden");if(pinnedPane)return [];
  const visible=filteredHistory().slice(0,historyVisibleRecent),pinnedIds=new Set((state.pinned||[]).map(x=>x.id)),stackIds=new Set((state.pasteStack||[]).map(x=>x.id));
  return visible.filter(item=>CopySelectSmartCore?.isUnorganized?CopySelectSmartCore.isUnorganized(item,{pinnedIds,stackIds,collections:state.historyCollections||[]}):false);
}
function renderHistorySelection(){const n=historyBatchSelection.size;if($("#historySelectedCount"))$("#historySelectedCount").textContent=n;if($("#historySelectedFooter"))$("#historySelectedFooter").textContent=n?`${n} item${n===1?"":"s"} selected`:"No items selected";const pinned=!$("#historyPinnedPane")?.classList.contains("hidden"),visible=filteredHistory(pinned?state.pinned:state.history,{applyFilters:!pinned}),allButton=$("#historySelectionActions [data-history-action=\"select-all\"]"),allBox=allButton?.querySelector(".selection-menu-box"),allSelected=visible.length>0&&visible.every(item=>historyBatchSelection.has(item.id));if(allButton){allButton.setAttribute("aria-pressed",String(allSelected));allBox?.classList.toggle("checked",allSelected)}const button=$("#historySelectionActions [data-history-action=\"select-unorganized\"]"),items=visibleUnorganizedHistoryItems();if(button){const unorganizedSelected=items.length>0&&items.every(item=>historyBatchSelection.has(item.id)),box=button.querySelector(".selection-menu-box"),label=button.querySelector(".selection-menu-label");button.disabled=!items.length;button.setAttribute("aria-pressed",String(unorganizedSelected));box?.classList.toggle("checked",unorganizedSelected);if(label)label.textContent=`Unorganized${items.length?` (${items.length})`:""}`}}
const selectionActions=$("#historySelectionActions");if(selectionActions&&!selectionActions.querySelector('[data-history-action="select-all"]'))selectionActions.insertAdjacentHTML('afterbegin','<button data-history-action="select-all" aria-pressed="false"><span class="selection-menu-box" aria-hidden="true"></span><span>All</span></button><button data-history-action="select-none"><span class="selection-menu-box" aria-hidden="true"></span><span>None</span></button><button data-history-action="select-unorganized" aria-pressed="false"><span class="selection-menu-box" aria-hidden="true"></span><span class="selection-menu-label">Unorganized</span></button><button data-history-action="select-clear"><span class="selection-menu-box clear" aria-hidden="true"></span><span>Clear active selection</span></button>');
function organizeHistorySelectionMenu(){const menu=$("#historySelectionActions");if(!menu||menu.dataset.organized)return;const byAction=action=>menu.querySelector(`[data-history-action="${action}"]`),groups=[["Selection",["select-all","select-none","select-unorganized","select-clear"]],["Organize",["pin","tags-add","tags-remove","tags-suggest","wordwatch-teach","collection","paste-stack"]],["Use",["copy","export"]],["Remove",["delete"]]];const fragment=document.createDocumentFragment();groups.forEach(([label,actions])=>{const buttons=actions.map(byAction).filter(Boolean);if(!buttons.length)return;const group=document.createElement("div");group.className="history-action-group";const title=document.createElement("span");title.className="history-action-group-label";title.textContent=label;group.append(title,...buttons);fragment.append(group)});menu.replaceChildren(fragment);menu.dataset.organized="true"}
organizeHistorySelectionMenu();
const teachWordWatchButton=$("[data-history-action=\"wordwatch-teach\"]");if(teachWordWatchButton&&!teachWordWatchButton.querySelector("svg"))teachWordWatchButton.insertAdjacentHTML("afterbegin",'<svg class="ui-icon wordwatch-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 17.5V20h2.5l9.7-9.7-2.5-2.5L4 17.5ZM15 6.5l1.2-1.2a2.1 2.1 0 0 1 3 3L18 9.5 15 6.5ZM3 4h6M3 8h3"/></svg>');
function renderHistoryCollections(){
  const select=$("#historyFilter"),list=$("#historyCollectionsList");if(!select||!list)return;const current=select.value,collections=state.historyCollections||[],H=state.history||[];
  const counts={today:H.filter(x=>isLocalToday(x.ts)).length,week:H.filter(x=>Date.now()-x.ts<604800000).length,pinned:(state.pinned||[]).length,formatted:H.filter(x=>String(x.html||"").trim()).length,images:H.filter(x=>/<img\b/i.test(String(x.html||""))).length,long:H.filter(x=>String(x.rawText??x.text??"").length>300).length,repeated:H.filter(x=>(Number(x.repeatCount)||1)>1).length};
  const standard=[["all","All",H.length],["today","Today",counts.today],["week","Last 7 days",counts.week],["pinned","Pinned",counts.pinned],["formatted","Formatted",counts.formatted],["images","With images",counts.images],["long","Long copies",counts.long],["repeated","Repeated",counts.repeated]];
  select.replaceChildren(...standard.map(([value,label,count])=>{const o=document.createElement("option");o.value=value;o.textContent=value==="all"?label:`${label}${count?` (${count})`:""}`;if(value!=="all"&&!count)o.disabled=true;return o}),...collections.map(c=>{const o=document.createElement("option");o.value=`collection:${c.id}`;const count=H.filter(h=>(h.collectionIds||[]).includes(c.id)).length;o.textContent=`${c.locked&&!unlockedCollectionIds.has(c.id)?"🔒 ":""}${c.name}${count?` (${count})`:""}`;if(!count)o.disabled=true;return o}));
  select.value=[...select.options].some(o=>o.value===current&&!o.disabled)?current:"all";
  list.replaceChildren(...collections.map(c=>{const row=document.createElement("div");row.className="history-collection-menu-row";const b=document.createElement("button");b.type="button";b.setAttribute("role","menuitem");b.dataset.collection=`collection:${c.id}`;b.textContent=`${c.locked&&!unlockedCollectionIds.has(c.id)?"🔒 ":""}${c.name}`;const edit=document.createElement("button");edit.type="button";edit.className="collection-menu-edit";edit.dataset.editCollection=c.id;edit.setAttribute("aria-label",`Edit ${c.name}`);edit.textContent="✎";const del=document.createElement("button");del.type="button";del.className="collection-menu-delete";del.dataset.deleteCollection=c.id;del.setAttribute("aria-label",`Delete ${c.name}`);del.textContent="×";row.append(b,edit,del);return row}));
}
let collectionTargetItems=[],editingCollectionId=null,editingClipId=null,pendingUnlockCollectionId=null;
$("#collectionManageList")?.addEventListener("click",e=>{
  const id=e.target.closest("[data-rename]")?.dataset.rename,c=state.historyCollections.find(x=>x.id===id);
  if(c?.locked&&!unlockedCollectionIds.has(id)){e.stopImmediatePropagation();$("#collectionDialog").close();openUnlockDialog(id)}
},true);
$("#collectionSave")?.addEventListener("click",e=>{
  const c=state.historyCollections.find(x=>x.id===editingCollectionId);
  if($("#collectionLocked").checked&&!c?.lockHash&&!$("#collectionPin").value.trim()){e.preventDefault();e.stopImmediatePropagation();$("#collectionPin").setCustomValidity("Choose a PIN before locking this collection.");$("#collectionPin").reportValidity()}
},true);
$("#collectionPin")?.addEventListener("input",e=>e.target.setCustomValidity(""));
const lockNow=document.createElement("button");lockNow.type="button";lockNow.className="btn";lockNow.textContent="Lock now";lockNow.id="lockCollectionsNow";
$("#historyCollectionsMenu")?.append(lockNow);
lockNow.addEventListener("click",()=>{unlockedCollectionIds.clear();historyBatchSelection.clear();renderHistory();announceHistory("Collections locked")});
async function digestPin(value){const bytes=new TextEncoder().encode(String(value||"")),hash=await crypto.subtle.digest("SHA-256",bytes);return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,"0")).join("")}
function openClipEditor(item){editingClipId=item.id;$("#clipLabel").value=item.label||"";$("#clipReusableText").value=item.text||"";$("#clipNote").value=item.note||"";$("#clipEditDialog")?.showModal();setTimeout(()=>$("#clipLabel")?.focus(),0)}
$("#clipEditSave")?.addEventListener("click",async e=>{e.preventDefault();const result=await safeMessage({action:"editClip",id:editingClipId,label:$("#clipLabel").value.trim(),text:$("#clipReusableText").value,note:$("#clipNote").value});if(!result?.ok){announceHistory(result?.error||"Could not save clip",true);return}if(result.history){state.history=result.history;state.pinned=result.pinned||[]}$("#clipEditDialog")?.close();renderHistory();announceHistory("Clip updated")});
function openUnlockDialog(id){const c=(state.historyCollections||[]).find(x=>x.id===id);if(!c)return;pendingUnlockCollectionId=id;$("#collectionUnlockName").textContent=`Unlock “${c.name}” to show its clips.`;$("#collectionUnlockPin").value="";$("#collectionUnlockError").textContent="";$("#collectionUnlockDialog")?.showModal();setTimeout(()=>$("#collectionUnlockPin")?.focus(),0)}
$("#collectionUnlockButton")?.addEventListener("click",async e=>{e.preventDefault();const c=(state.historyCollections||[]).find(x=>x.id===pendingUnlockCollectionId);if(!c)return;const valid=!c.lockHash||await digestPin($("#collectionUnlockPin").value)===c.lockHash;if(!valid){$("#collectionUnlockError").textContent="That PIN did not unlock this collection.";return}unlockedCollectionIds.add(c.id);$("#collectionUnlockDialog")?.close();renderHistoryCollections();if($("#historyFilter"))$("#historyFilter").value=`collection:${c.id}`;renderHistory();announceHistory(`${c.name} unlocked for this Settings session`)});
function smartCollectionMatches(item,c){return !!CopySelectSmartCore?.collectionMatch?.(item,c)?.matched}
function updateCollectionLogicHelp(){const help=$("#collectionLogicHelp"),logic=$("#collectionSmartLogic")?.value;if(!help)return;help.textContent=logic==="and"?"Site and text evidence must both match.":logic==="site"?"Only the source site is evaluated.":logic==="text"?"Only WordWatch text rules are evaluated.":"A matching site or matching WordWatch text can trigger this Collection."}
function syncSmartEditor(){const on=$("#collectionSmartEnabled")?.checked;$("#collectionSmartRules")?.classList.toggle("disabled",!on);$("#collectionSmartRules")?.querySelectorAll("input,select,textarea,button").forEach(el=>{if(el.id!=="collectionSmartEnabled")el.disabled=!on});updateCollectionLogicHelp()}
function syncLockEditor(){const on=$("#collectionLocked")?.checked;const grid=$(".collection-lock-grid");grid?.classList.toggle("disabled",!on);grid?.querySelectorAll("input,select").forEach(el=>el.disabled=!on)}
function wordWatchAndTextareas(){return [...document.querySelectorAll("#collectionAndGroups textarea")]}
function addWordWatchAndGroup(value="",{removable=true}={}){
  const box=$("#collectionAndGroups");if(!box||box.querySelectorAll(".wordwatch-and-group").length>=9)return null;
  const row=document.createElement("div");row.className="wordwatch-and-group";row.innerHTML='<label>AND any of these <textarea rows="3" placeholder="another required evidence group…"></textarea></label><button type="button" class="wordwatch-remove-group" aria-label="Remove this AND group">×</button>';
  const ta=row.querySelector("textarea");ta.value=value;row.querySelector(".wordwatch-remove-group").classList.toggle("hidden",!removable);box.append(row);return row;
}
function resetWordWatchAndGroups(values=[]){
  const box=$("#collectionAndGroups");if(!box)return;box.replaceChildren();const list=values.length?values:[""];
  list.slice(0,9).forEach((value,i)=>{const row=addWordWatchAndGroup(value,{removable:i>0});if(i===0&&row?.querySelector("textarea"))row.querySelector("textarea").id="collectionWordWatchAnd"});
}
function currentCollectionDraft(){
  const groups=[];const orTerms=CopySelectSmartCore?.splitRuleTerms?.($("#collectionSmartText")?.value)||[];
  if(orTerms.length)groups.push({mode:"any",terms:orTerms});for(const ta of wordWatchAndTextareas()){const terms=CopySelectSmartCore?.splitRuleTerms?.(ta.value)||[];if(terms.length)groups.push({mode:"any",terms})}
  return {
    id:editingCollectionId||"__preview__",name:$("#collectionName")?.value.trim()||"New Collection",description:$("#collectionDescription")?.value.trim()||"",
    wordWatch:{enabled:!!$("#collectionSmartEnabled")?.checked,sites:CopySelectSmartCore?.splitRuleTerms?.($("#collectionSmartSites")?.value)||[],siteLogic:$("#collectionSmartLogic")?.value||"or",groups,exclude:CopySelectSmartCore?.splitRuleTerms?.($("#collectionWordWatchExclude")?.value)||[],copyMode:$("#collectionSmartMode")?.value||"",wholeWords:!!$("#collectionSmartWhole")?.checked,caseSensitive:!!$("#collectionSmartCase")?.checked,useConcepts:!!$("#collectionWordWatchConcepts")?.checked,actions:{addToCollection:!!$("#collectionActionAdd")?.checked,addTags:CopySelectSmartCore?.splitRuleTerms?.($("#collectionActionTags")?.value)||[],pin:!!$("#collectionActionPin")?.checked,pasteStack:!!$("#collectionActionStack")?.checked},feedback:{mode:$("#collectionFeedbackMode")?.value||"global",message:$("#collectionFeedbackMessage")?.value.trim()||"",color:$("#collectionFeedbackColor")?.value||"",effect:$("#collectionFeedbackEffect")?.value||"",sound:$("#collectionFeedbackSound")?.value||"",duration:Number($("#collectionFeedbackDuration")?.value)||0,priority:$("#collectionFeedbackPriority")?.value||"normal"}},
    locked:!!$("#collectionLocked")?.checked,lockOnClose:!!$("#collectionLockOnClose")?.checked,autoLockMinutes:Number($("#collectionAutoLock")?.value)||0
  };
}
function fillCollectionEditor(c=null){
  editingCollectionId=c?.id||null;const w=CopySelectSmartCore?.normalizeWordWatch?.(c)||null,groups=w?.groups||[];
  $("#collectionName").value=c?.name||"";$("#collectionDescription").value=c?.description||"";$("#collectionSmartEnabled").checked=c?!!w:true;
  $("#collectionSmartSites").value=(w?.sites||[]).join("\n");$("#collectionSmartText").value=(groups[0]?.terms||[]).join("\n");resetWordWatchAndGroups(groups.slice(1).map(g=>(g?.terms||[]).join("\n")));$("#collectionWordWatchExclude").value=(w?.exclude||[]).join("\n");
  $("#collectionSmartMode").value=w?.copyMode||"";$("#collectionSmartLogic").value=w?.siteLogic||"or";$("#collectionSmartWhole").checked=!!w?.wholeWords;$("#collectionSmartCase").checked=!!w?.caseSensitive;$("#collectionWordWatchConcepts").checked=w?.useConcepts!==false;
  $("#collectionActionAdd").checked=w?.actions?.addToCollection!==false;$("#collectionActionTags").value=(w?.actions?.addTags||[]).join(", ");$("#collectionActionPin").checked=!!w?.actions?.pin;$("#collectionActionStack").checked=!!w?.actions?.pasteStack;
  $("#collectionFeedbackMode").value=w?.feedback?.mode||"global";$("#collectionFeedbackMessage").value=w?.feedback?.message||"";$("#collectionFeedbackColor").value=/^#[0-9a-f]{6}$/i.test(w?.feedback?.color||"")?w.feedback.color:"#f97316";$("#collectionFeedbackEffect").value=w?.feedback?.effect||"";$("#collectionFeedbackSound").value=w?.feedback?.sound||"";$("#collectionFeedbackDuration").value=String(w?.feedback?.duration||900);$("#collectionFeedbackPriority").value=w?.feedback?.priority||"normal";
  $("#collectionLocked").checked=!!c?.locked;$("#collectionPin").value="";$("#collectionPinConfirm").value="";$("#collectionLockOnClose").checked=!!c?.lockOnClose;$("#collectionAutoLock").value=String(c?.autoLockMinutes||0);$("#collectionPin").placeholder=c?.lockHash?"Leave blank to keep current PIN":"Choose a PIN";
  $("#collectionWordWatchTestText").value="";$("#collectionWordWatchTestResult").textContent="";syncSmartEditor();syncLockEditor();$("#collectionSave").textContent=c?"Save changes":"Save collection";
}
function setWordWatchStudio(open){const dialog=$("#collectionDialog"),title=$("#collectionDialogTitle"),intro=dialog?.querySelector("header p"),button=$("#toggleAdvancedWordWatch"),setup=dialog?.querySelector(".wordwatch-setup-bar"),head=dialog?.querySelector("header>div");if(!dialog)return;dialog.classList.toggle("wordwatch-studio-open",open);if(title)title.textContent=open?"WordWatch Studio":"Collection settings";if(intro)intro.textContent=open?"Build, test, and reuse a precise WordWatch rule. Its actions still organize this Collection.":"A Collection is a durable project or archive. Turn on WordWatch when you want future matching clips organized automatically.";if(button){button.textContent=open?"<- Back to Collection Settings":"Open Advanced WordWatch Studio";button.classList.toggle("wordwatch-back-button",open);if(open&&head)head.insertBefore(button,intro||null);else if(!open&&setup)setup.append(button)}}
function showCollectionSettings(c=null){collectionTargetItems=[];const dialog=$("#collectionDialog"),list=$("#collectionManageList");if(!dialog)return;fillCollectionEditor(c);list?.classList.add("hidden");dialog.classList.remove("assignment-mode");setWordWatchStudio(false);dialog.showModal();setTimeout(()=>{dialog.querySelector("form")?.scrollTo(0,0);$("#collectionName")?.focus({preventScroll:true})},0)}
function openCollectionDialog(items=[]){collectionTargetItems=items;const dialog=$("#collectionDialog"),list=$("#collectionManageList");if(!dialog)return;fillCollectionEditor();list.replaceChildren();dialog.classList.toggle("assignment-mode",!!items.length);if(items.length){list.classList.remove("hidden");const heading=document.createElement("strong");heading.className="collection-assign-heading";heading.textContent="Add selected clips to";list.append(heading);const collections=state.historyCollections||[];if(!collections.length){const empty=document.createElement("small");empty.textContent="Create the first Collection above.";list.append(empty)}else collections.forEach(c=>{const row=document.createElement("div");row.dataset.id=c.id;const main=document.createElement("button");main.type="button";main.dataset.use=c.id;main.textContent=`${c.locked?"🔒 ":""}${c.name}${CopySelectSmartCore?.normalizeWordWatch?.(c)?" · WordWatch":""}`;main.title=`Add selected items to ${c.name}`;row.append(main);list.append(row)})}else list.classList.add("hidden");dialog.showModal();setTimeout(()=>{dialog.querySelector("form")?.scrollTo(0,0);$("#collectionName")?.focus({preventScroll:true})},0)}
async function saveCollections(){await chrome.storage.sync.set({historyCollections:state.historyCollections});renderHistoryCollections();renderOrganizationHub()}
async function assignCollection(id){const targetIds=new Set(collectionTargetItems.map(x=>String(x?.id||"")).filter(Boolean));for(const item of collectionTargetItems){if(!targetIds.has(String(item.id||"")))continue;await safeMessage({action:"updateClipOrganization",id:item.id,addCollections:[id]})}$("#collectionDialog")?.close();await refreshRuntimeHistory();announceHistory("Added to Collection")}
$("#collectionSmartEnabled")?.addEventListener("change",syncSmartEditor);$("#collectionSmartLogic")?.addEventListener("change",updateCollectionLogicHelp);$("#collectionLocked")?.addEventListener("change",syncLockEditor);$("#collectionCancel")?.addEventListener("click",()=>$("#collectionDialog")?.close());
$("#collectionAddAndGroup")?.addEventListener("click",()=>{addWordWatchAndGroup();syncSmartEditor()});
$("#collectionAndGroups")?.addEventListener("click",e=>{const b=e.target.closest(".wordwatch-remove-group");if(!b)return;b.closest(".wordwatch-and-group")?.remove()});
$("#collectionManageList")?.addEventListener("click",async e=>{const use=e.target.closest("[data-use]")?.dataset.use;if(use)await assignCollection(use)});
$("#collectionWordWatchTest")?.addEventListener("click",()=>{const draft=currentCollectionDraft(),sample=$("#collectionWordWatchTestText")?.value||"",result=CopySelectSmartCore?.collectionMatch?.({text:sample,rawText:sample,url:"https://example.com",copyMode:"plain"},draft),out=$("#collectionWordWatchTestResult");if(!out)return;out.textContent=result?.matched?`✓ Matches${result.reasons?.length?` · ${result.reasons.join(", ")}`:""}`:"✕ Does not match these rules";out.classList.toggle("error",!result?.matched)});
$("#toggleAdvancedWordWatch")?.addEventListener("click",()=>{const dialog=$("#collectionDialog"),open=!dialog?.classList.contains("wordwatch-studio-open");setWordWatchStudio(open);dialog?.querySelector("form")?.scrollTo({top:0,behavior:"smooth"})});
$("#collectionWordWatchTemplate")?.addEventListener("change",e=>{const presets={recipes:"recipe*, ingredient*, method, cook, bake",research:"study, research, evidence, journal, citation",travel:"flight, hotel, itinerary, reservation, destination",shopping:"price, discount, cart, product, review",coding:"function, class, error, API, code"},value=presets[e.target.value];if(!value)return;$("#collectionSmartText").value=value;$("#collectionActionTags").value=e.target.value;syncSmartEditor()});
$("#collectionAiPrompt")?.addEventListener("click",async()=>{const d=currentCollectionDraft(),w=d.wordWatch,terms=[...(w.groups||[]).flatMap(g=>g.terms||[]),...(w.exclude||[])],examples=collectionTargetItems.map(x=>String(x.rawText??x.text??""));const prompt=CopySelectSmartCore?.buildAiPrompt?.({name:d.name||"WordWatch",terms,examples,languages:["English","Italian","Portuguese"],privacyMode:examples.length?"examples":"terms"})||"";const r=await safeMessage({action:"copyAgain",source:"wordwatch-ai",text:prompt});$("#collectionWordWatchTestResult").textContent=r?.ok?"✓ AI prompt copied. Paste it into your preferred AI, then use its suggestions to refine these rules.":r?.error||"Could not copy prompt"});
$("#collectionReapplyWordWatch")?.addEventListener("click",async()=>{if(!editingCollectionId){$("#collectionWordWatchTestResult").textContent="Save this Collection first, then reapply WordWatch to existing History.";return}const c=(state.historyCollections||[]).find(x=>x.id===editingCollectionId),count=(state.history||[]).filter(h=>smartCollectionMatches(h,c)).length;if(!confirm(`Reapply “${c?.name||"WordWatch"}” to existing History?\n\n${count} current clip${count===1?"":"s"} match. This may add Collection membership, tags, pins or Paste Stack entries. Existing confirmed organization will not be removed.`))return;const r=await safeMessage({action:"reapplyWordWatch",collectionId:editingCollectionId});if(r?.ok){await refreshRuntimeHistory();$("#collectionWordWatchTestResult").textContent=`✓ Reapplied to ${r.matched||0} matching clip${r.matched===1?"":"s"}.`}else $("#collectionWordWatchTestResult").textContent=r?.error||"Could not reapply WordWatch"});
$("#collectionSave")?.addEventListener("click",async e=>{
  e.preventDefault();const name=$("#collectionName").value.trim(),pin=$("#collectionPin").value,confirmPin=$("#collectionPinConfirm").value;if(!name){$("#collectionName").reportValidity();return}if(pin&&pin!==confirmPin){$("#collectionPinConfirm").setCustomValidity("PINs do not match.");$("#collectionPinConfirm").reportValidity();return}$("#collectionPinConfirm").setCustomValidity("");
  const draft=currentCollectionDraft(),activeCount=(state.historyCollections||[]).filter(x=>x.id!==editingCollectionId&&CopySelectSmartCore?.normalizeWordWatch?.(x)).length;if(draft.wordWatch.enabled&&activeCount>=20){alert("CopySelect currently allows up to 20 active WordWatch Collections. Disable one before enabling another.");return}
  const watchedTermCount=(draft.wordWatch.groups||[]).reduce((n,g)=>n+(g.terms||[]).length,0)+(draft.wordWatch.exclude||[]).length;if(draft.wordWatch.enabled&&watchedTermCount>100){alert(`This WordWatch has ${watchedTermCount} watched/excluded terms. The current limit is 100. Remove ${watchedTermCount-100} term${watchedTermCount-100===1?"":"s"} before saving.`);return}
  let c=editingCollectionId?(state.historyCollections||[]).find(x=>x.id===editingCollectionId):null;if(!c)c=(state.historyCollections||[]).find(x=>x.name.toLowerCase()===name.toLowerCase());const locked=draft.locked;
  const wordWatch=draft.wordWatch.enabled?draft.wordWatch:{enabled:false};const legacySmart={enabled:false};
  if(c){Object.assign(c,{name,description:draft.description,wordWatch,smart:legacySmart,locked,lockOnClose:draft.lockOnClose,autoLockMinutes:draft.autoLockMinutes});if(pin)c.lockHash=await digestPin(pin);if(!locked){c.lockHash="";unlockedCollectionIds.delete(c.id)}}else{c={id:crypto.randomUUID?.()||String(Date.now()),name,description:draft.description,wordWatch,smart:legacySmart,locked,lockOnClose:draft.lockOnClose,autoLockMinutes:draft.autoLockMinutes,lockHash:pin?await digestPin(pin):""};state.historyCollections=[...(state.historyCollections||[]),c]}
  await saveCollections();if(collectionTargetItems.length)await assignCollection(c.id);else $("#collectionDialog")?.close();renderHistory();announceHistory(`${name} saved${wordWatch.enabled?" · WordWatch active":""}`);
});
async function refreshRuntimeHistory(){const runtime=await safeMessage({action:"runtimeData"});if(runtime?.history){state.history=runtime.history;state.pinned=runtime.pinned||[];state.pasteStack=runtime.pasteStack||[];state.stats=runtime.stats||state.stats;state.lastWordWatchMatch=runtime.lastWordWatchMatch||state.lastWordWatchMatch;renderHistory();renderUsageStats();renderOrganizationHub()}}
function renderPasteStack(){const stack=Array.isArray(state?.pasteStack)?state.pasteStack:[],count=$("#pasteStackCount"),preview=$("#pasteStackPreview"),next=$("#pasteStackNext"),clear=$("#pasteStackClear");if(count)count.textContent=stack.length;if(preview){preview.replaceChildren();if(stack.length)stack.slice(0,5).forEach((x,i)=>{const row=document.createElement("div"),n=document.createElement("b"),text=document.createElement("span");n.textContent=String(i+1);text.textContent=String(x.text||"").slice(0,90)||"(empty)";row.append(n,text);preview.append(row)});else preview.textContent="Stack is empty."}if(next)next.disabled=!stack.length;if(clear)clear.disabled=!stack.length}
$("#pasteStackToggle")?.addEventListener("click",e=>{e.stopPropagation();const menu=$("#pasteStackMenu");if(!menu)return;if(menu.classList.contains("hidden"))openFloatingMenu(e.currentTarget,menu,{align:"left"});else closeFloatingMenu(e.currentTarget,menu)});
$("#pasteStackNext")?.addEventListener("click",async()=>{const result=await safeMessage({action:"copyNextPasteStack"});if(result?.ok&&!result.item){announceHistory("Paste Stack is empty",true);return}if(result?.ok){state.pasteStack=result.pasteStack||[];renderPasteStack();announceHistory("Next Paste Stack item copied")}else announceHistory(result?.error||"Copy failed",true)});
$("#pasteStackClear")?.addEventListener("click",async()=>{if(!await confirmDestructive("Clear the Paste Stack?"))return;const r=await safeMessage({action:"clearPasteStack"});if(r?.ok){state.pasteStack=[];renderPasteStack();announceHistory("Paste Stack cleared")}});
$("#historySelectionToggle")?.addEventListener("click",e=>{e.stopPropagation();const menu=$("#historySelectionActions");if(!menu)return;if(menu.classList.contains("hidden"))openFloatingMenu(e.currentTarget,menu,{align:"left"});else closeFloatingMenu(e.currentTarget,menu)});
$("#historyCollectionsToggle")?.addEventListener("click",e=>{e.stopPropagation();const menu=$("#historyCollectionsMenu");if(!menu)return;if(menu.classList.contains("hidden"))openFloatingMenu(e.currentTarget,menu,{align:"left"});else closeFloatingMenu(e.currentTarget,menu)});
document.addEventListener("click",e=>{
  if(!e.target.closest(".history-selection-menu")&&!e.target.closest("#historySelectionActions"))closeFloatingMenu($("#historySelectionToggle"),$("#historySelectionActions"));
  if(!e.target.closest(".history-collections")&&!e.target.closest("#historyCollectionsMenu"))closeFloatingMenu($("#historyCollectionsToggle"),$("#historyCollectionsMenu"));
  if(!e.target.closest(".paste-stack-menu")&&!e.target.closest("#pasteStackMenu"))closeFloatingMenu($("#pasteStackToggle"),$("#pasteStackMenu"));
  if(!e.target.closest(".history-copy-as")&&!e.target.closest(".history-copy-as-menu"))document.querySelectorAll(".history-copy-as-menu").forEach(x=>{const o=floatingMenuOrigins.get(x);closeFloatingMenu(o?.trigger,x)});
});
$("#historyCollectionsMenu")?.addEventListener("click",async e=>{const edit=e.target.closest("[data-edit-collection]")?.dataset.editCollection,remove=e.target.closest("[data-delete-collection]")?.dataset.deleteCollection;if(edit){const c=(state.historyCollections||[]).find(x=>x.id===edit);closeFloatingMenu($("#historyCollectionsToggle"),$("#historyCollectionsMenu"));if(c?.locked&&!unlockedCollectionIds.has(edit)){openUnlockDialog(edit);return}showCollectionSettings(c);return}if(remove){const c=(state.historyCollections||[]).find(x=>x.id===remove);if(c?.locked&&!unlockedCollectionIds.has(remove)){openUnlockDialog(remove);announceHistory("Unlock this Collection before deleting it",true);return}if(!c||!confirm(`Delete collection “${c.name}”? Items themselves will stay in History.`))return;state.historyCollections=state.historyCollections.filter(x=>x.id!==remove);[...state.history,...state.pinned].forEach(x=>x.collectionIds=(x.collectionIds||[]).filter(id=>id!==remove));await chrome.storage.local.set({history:state.history,pinned:state.pinned});await saveCollections();renderHistoryCollections();return}const b=e.target.closest("[data-collection]");if(!b)return;const id=String(b.dataset.collection||"").startsWith("collection:")?String(b.dataset.collection).slice(11):"",c=(state.historyCollections||[]).find(x=>x.id===id);closeFloatingMenu($("#historyCollectionsToggle"),$("#historyCollectionsMenu"));if(c?.locked&&!unlockedCollectionIds.has(id)){openUnlockDialog(id);return}$("#historyFilter").value=b.dataset.collection;renderHistory()});
$("#newHistoryCollection")?.addEventListener("click",()=>showCollectionSettings());
$("#historySelectionActions")?.addEventListener("click",e=>{if(e.target.closest('[data-history-action="collection"]')){e.stopImmediatePropagation();const items=selectedHistoryItems();if(!items.length){announceHistory("Select one or more items first",true);return}openCollectionDialog(items)}},true);
$("#historySelectionActions")?.addEventListener("click",e=>{const action=e.target.closest('[data-history-action]')?.dataset.historyAction;if(!['select-all','select-none','select-unorganized','select-clear'].includes(action))return;e.stopImmediatePropagation();if(action==='select-unorganized'){const items=visibleUnorganizedHistoryItems();if(!items.length){announceHistory("No visible unorganized clips");return}const allSelected=items.every(item=>historyBatchSelection.has(item.id));items.forEach(item=>allSelected?historyBatchSelection.delete(item.id):historyBatchSelection.add(item.id));renderHistory();announceHistory(allSelected?"Unorganized clips unselected":`${items.length} unorganized clip${items.length===1?"":"s"} selected`);return}historyBatchSelection.clear();if(action==='select-all'){const pinned=!$("#historyPinnedPane")?.classList.contains('hidden');filteredHistory(pinned?state.pinned:state.history,{applyFilters:!pinned}).forEach(x=>historyBatchSelection.add(x.id))}renderHistory();announceHistory(action==='select-all'?'Visible items selected':'Selection cleared');if(action==='select-clear'){closeFloatingMenu($("#historySelectionToggle"),$("#historySelectionActions"))}},true);
$("#historySelectionActions")?.addEventListener("click",async e=>{const action=e.target.closest("[data-history-action]")?.dataset.historyAction;if(!action||["select-all","select-none","select-unorganized","select-clear","collection"].includes(action))return;const items=selectedHistoryItems();if(!items.length){announceHistory("Select one or more items first",true);return}if(action==="tags-add")openTagDialog(items);if(action==="tags-remove")openTagDialog(items,{mode:"remove"});if(action==="tags-suggest"){const {smartTagLearner={}}=await chrome.storage.local.get({smartTagLearner:{}}),suggestions=CopySelectSmartCore?.suggestTagsForGroup?.(items,{max:10,learner:smartTagLearner})||[];openTagDialog(items,{suggestions})}if(action==="wordwatch-teach")teachWordWatchFrom(items);if(action==="copy"){const result=await safeMessage({action:"copyAgain",source:"history",text:items.map(x=>x.text).join("\n\n")});announceHistory(result?.ok?"Copied text":result?.error||"Copy failed",!result?.ok)}if(action==="paste-stack"){const result=await safeMessage({action:"addPasteStack",items});if(result?.ok){state.pasteStack=result.pasteStack||[];renderPasteStack();announceHistory(`${items.length} item${items.length===1?"":"s"} added to Paste Stack`)}else announceHistory(result?.error||"Could not update Paste Stack",true)}if(action==="export")downloadBackup({items,visibleFilter:$("#historyFilter")?.value||"all",exportedAt:new Date().toISOString(),exportType:"selected-history"},`CopySelect-selected-history-${exportDateStamp()}.json`);if(action==="pin"){for(const item of items)await safeMessage({action:"pin",item});await refreshRuntimeHistory();announceHistory("Selected items pinned")}if(action==="delete"){if(!confirm(`Delete ${items.length} selected item${items.length===1?"":"s"}?`))return;for(const item of items)await safeMessage({action:"deleteHistory",id:item.id});historyBatchSelection.clear();await refreshRuntimeHistory();announceHistory("Selected items deleted")}if(!["tags-add","tags-remove","tags-suggest","wordwatch-teach"].includes(action)){closeFloatingMenu($("#historySelectionToggle"),$("#historySelectionActions"))}});
$("#exportVisibleHistory")?.addEventListener("click",()=>{const pinned=!$("#historyPinnedPane")?.classList.contains("hidden"),items=filteredHistory(pinned?state.pinned:state.history,{applyFilters:!pinned});downloadBackup({items,visibleFilter:$("#historyFilter")?.value||"all",exportedAt:new Date().toISOString(),exportType:"visible-history"},`CopySelect-visible-history-${exportDateStamp()}.json`)});
function renderOrganizationHub(){if(!state||!$("#collectionsGrid"))return;const collections=state.historyCollections||[],H=[...(state.history||[]),...(state.pinned||[])].filter((x,i,a)=>a.findIndex(y=>y.id===x.id)===i);const active=collections.filter(c=>CopySelectSmartCore?.normalizeWordWatch?.(c)).length;if($("#wordWatchActiveCount"))$("#wordWatchActiveCount").textContent=`${active} active WordWatch${active===1?"":"es"}`;const grid=$("#collectionsGrid");grid.replaceChildren();if(!collections.length){grid.innerHTML='<div class="organization-empty"><b>No Collections yet</b><span>Create one manually, or select clips in History and teach WordWatch from examples.</span></div>'}else collections.forEach(c=>{const count=H.filter(h=>(h.collectionIds||[]).includes(c.id)).length,w=CopySelectSmartCore?.normalizeWordWatch?.(c),card=document.createElement("article");card.className="collection-card";card.innerHTML=`<div class="collection-card-head"><b>${c.locked?"🔒 ":""}${escapeHtml(c.name)}</b><span>${count} clip${count===1?"":"s"}</span></div><p>${escapeHtml(c.description||"No description")}</p><div class="collection-card-meta"><span class="${w?"wordwatch-on":""}">${w?"WordWatch ON":"Manual"}</span>${w?.actions?.addTags?.length?`<span>${w.actions.addTags.slice(0,3).map(escapeHtml).join(" · ")}</span>`:""}</div><div class="collection-card-actions"><button type="button" data-open-collection="${c.id}">Open clips</button><button type="button" data-edit-org-collection="${c.id}">WordWatch / Settings</button></div>`;grid.append(card)});
  const counts=new Map();H.forEach(h=>(h.tags||[]).forEach(t=>counts.set(t,(counts.get(t)||0)+1)));const tb=$("#tagsBrowser");tb.replaceChildren();[...counts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).forEach(([tag,count])=>{const row=document.createElement("div");row.className="tag-browser-row";row.innerHTML=`<button type="button" data-open-tag="${encodeURIComponent(tag)}"><span>${escapeHtml(tag)}</span><b>${count}</b></button><button type="button" data-rename-tag="${encodeURIComponent(tag)}" aria-label="Rename ${escapeHtml(tag)}">✎</button>`;tb.append(row)});if(!counts.size)tb.innerHTML='<div class="organization-empty"><span>No saved tags yet. Unsaved suggestions appear gray with × in History.</span></div>';
  const views=$("#savedViewsList");views.replaceChildren();(state.historySavedViews||[]).forEach(v=>{let count=0;try{count=CopySelectSmartCore.compileQuery(v.query,{collections}).filter(H).length}catch{}const row=document.createElement("article");row.className="saved-view-row";row.innerHTML=`<div><b>${escapeHtml(v.name)}</b><code>${escapeHtml(v.query)}</code><span>${count} current result${count===1?"":"s"}</span></div><div><button type="button" data-open-view="${v.id}">Open</button><button type="button" data-delete-view="${v.id}" aria-label="Delete ${escapeHtml(v.name)}">×</button></div>`;views.append(row)});if(!(state.historySavedViews||[]).length)views.innerHTML='<div class="organization-empty"><span>Save an Advanced Search to reuse and refresh it here.</span></div>';
}
$("#collectionsGrid")?.addEventListener("click",e=>{const open=e.target.closest("[data-open-collection]")?.dataset.openCollection,edit=e.target.closest("[data-edit-org-collection]")?.dataset.editOrgCollection;if(open){const c=(state.historyCollections||[]).find(x=>x.id===open);if(c?.locked&&!unlockedCollectionIds.has(open)){openUnlockDialog(open);return}openPage("history");renderHistoryCollections();$("#historyFilter").value=`collection:${open}`;renderHistory()}if(edit){const c=(state.historyCollections||[]).find(x=>x.id===edit);if(c?.locked&&!unlockedCollectionIds.has(edit)){openUnlockDialog(edit);return}showCollectionSettings(c)}});
$("#tagsBrowser")?.addEventListener("click",async e=>{const open=e.target.closest("[data-open-tag]")?.dataset.openTag,rename=e.target.closest("[data-rename-tag]")?.dataset.renameTag;if(open){openPage("history");$("#historySearch").value=`tag:\"${decodeURIComponent(open)}\"`;renderHistory()}if(rename){const old=decodeURIComponent(rename),next=prompt(`Rename tag “${old}” to:`,old)?.trim();if(!next||next===old)return;const r=await safeMessage({action:"renameTag",oldTag:old,newTag:next});if(r?.ok)await refreshRuntimeHistory();else announceHistory(r?.error||"Could not rename tag",true)}});
$("#savedViewsList")?.addEventListener("click",async e=>{const open=e.target.closest("[data-open-view]")?.dataset.openView,del=e.target.closest("[data-delete-view]")?.dataset.deleteView;if(open){const v=(state.historySavedViews||[]).find(x=>x.id===open);if(v){openPage("history");$("#historySearch").value=v.query;renderHistory()}}if(del){state.historySavedViews=(state.historySavedViews||[]).filter(x=>x.id!==del);await persist("historySavedViews",state.historySavedViews);renderOrganizationHub()}});
$("#saveCurrentView")?.addEventListener("click",async()=>{const query=$("#historySearch")?.value.trim();if(!query){announceHistory("Enter an Advanced Search first",true);return}const name=prompt("Name this Saved View:",query.slice(0,40));if(!name?.trim())return;state.historySavedViews=[...(state.historySavedViews||[]),{id:crypto.randomUUID?.()||String(Date.now()),name:name.trim(),query,createdAt:Date.now(),updatedAt:Date.now()}];await persist("historySavedViews",state.historySavedViews);renderOrganizationHub();announceHistory("Saved View created")});
$$("[data-org-tab]").forEach(b=>b.addEventListener("click",()=>{const tab=b.dataset.orgTab;$$("[data-org-tab]").forEach(x=>x.classList.toggle("active",x===b));$$(".organization-pane").forEach(x=>x.classList.add("hidden"));$(`#org${tab[0].toUpperCase()+tab.slice(1)}Pane`)?.classList.remove("hidden")}));
$("#newCollectionFromHub")?.addEventListener("click",()=>showCollectionSettings());
async function runHardRefresh(button=$("#historyHardRefresh")){button?.classList.add("is-refreshing");button?.setAttribute("aria-busy","true");announceHistory("Refreshing organization…");const r=await safeMessage({action:"recomputeOrganization"});if(r?.ok){await refreshRuntimeHistory();announceHistory(`Up to date${Number.isFinite(r.refreshed)?` · ${r.refreshed} suggestions refreshed`:""}`)}else announceHistory(r?.error||"Refresh failed",true);button?.classList.remove("is-refreshing");button?.removeAttribute("aria-busy")}
$("#historyHardRefresh")?.addEventListener("click",e=>runHardRefresh(e.currentTarget));$("#organizationHardRefresh")?.addEventListener("click",e=>runHardRefresh(e.currentTarget));
$("#smartTagSuggestionMode")?.addEventListener("change",e=>persist("smartTagSuggestionMode",e.target.value));$("#smartTagAutoThreshold")?.addEventListener("change",e=>persist("smartTagAutoThreshold",Math.max(50,Math.min(99,Number(e.target.value)||90))));$("#smartTagLearningEnabled")?.addEventListener("change",e=>persist("smartTagLearningEnabled",e.target.checked));
$("#openChangelog")?.addEventListener("click",()=>chrome.windows?.create?.({url:chrome.runtime.getURL("changelog.html"),type:"popup",width:900,height:720}));

function downloadBackup(data,name){const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
const backupSchemaVersion=Number(CS_DEFAULTS?.schemaVersion||27);
const exportDateStamp=()=>{const d=new Date(),pad=n=>String(n).padStart(2,"0");return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`};
$("#exportBtn")?.addEventListener("click",()=>downloadBackup({...state,history:state.history.filter(x=>!itemIsLocked(x)),pinned:state.pinned.filter(x=>!itemIsLocked(x)),pasteStack:(state.pasteStack||[]).filter(x=>!itemIsLocked(x)),schemaVersion:backupSchemaVersion,exportedAt:new Date().toISOString()},`CopySelect-complete-${exportDateStamp()}.json`));
$("#exportSettingsBtn")?.addEventListener("click",()=>{const {history,pinned,pasteStack,stats,...settingsOnly}=state;downloadBackup({...settingsOnly,schemaVersion:backupSchemaVersion,exportedAt:new Date().toISOString(),exportType:"settings"},`CopySelect-settings-${exportDateStamp()}.json`)});
$("#exportHistoryBtn")?.addEventListener("click",()=>downloadBackup({history:state.history.filter(x=>!itemIsLocked(x)),pinned:state.pinned.filter(x=>!itemIsLocked(x)),pasteStack:(state.pasteStack||[]).filter(x=>!itemIsLocked(x)),schemaVersion:backupSchemaVersion,exportedAt:new Date().toISOString(),exportType:"history"},`CopySelect-history-${exportDateStamp()}.json`));
$("#resetStats")?.addEventListener("click",async()=>{if(!await confirmDestructive("Reset local usage counters?"))return;state.stats={...CS_DEFAULTS.stats};await chrome.storage.local.set({stats:state.stats});renderUsageStats();announceA11y("Local usage counters reset")});
$("#importBtn")?.addEventListener("click",()=>$("#importFile").click());
$("#importFile")?.addEventListener("change",async e=>{
  const f=e.target.files[0];if(!f)return;
  try{
    const parsed=JSON.parse(await f.text());
    if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))throw new Error("Backup root must be an object");
    const kind=["settings","history","complete"].includes(parsed.exportType)?parsed.exportType:"complete";
    const normalized=kind==="history"?normalizeSettings(state):normalizeSettings(parsed);
    const importedRuntime=normalizeRuntimeState({
      history:kind==="settings"?state.history:parsed.history,
      pinned:kind==="settings"?state.pinned:parsed.pinned,
      pasteStack:kind==="settings"?state.pasteStack:parsed.pasteStack,
      stats:kind==="complete"?parsed.stats:state.stats
    });
    const summary=`Import ${kind} backup?\nSchema: ${parsed.schemaVersion||"legacy"} → ${backupSchemaVersion}\nProfiles: ${Object.keys(normalized.profiles).length}\nSite rules: ${normalized.siteRules.length}\nHistory: ${importedRuntime.history.length}`;
    if(await confirmDestructive(summary)){
      const {history:_h,pinned:_p,pasteStack:_ps,stats:_st,...syncSafe}=normalized;
      if(kind==="settings"){
        await chrome.storage.sync.set(syncSafe);Object.assign(state,syncSafe);
      }else if(kind==="history"){
        await chrome.storage.local.set({history:importedRuntime.history,pinned:importedRuntime.pinned,pasteStack:importedRuntime.pasteStack});
        Object.assign(state,{history:importedRuntime.history,pinned:importedRuntime.pinned,pasteStack:importedRuntime.pasteStack});
      }else{
        const previousSync=await chrome.storage.sync.get(null),previousLocal=await chrome.storage.local.get(null);
        try{
          await chrome.storage.sync.clear();await chrome.storage.local.clear();
          await chrome.storage.sync.set(syncSafe);
          await chrome.storage.local.set({history:importedRuntime.history,pinned:importedRuntime.pinned,pasteStack:importedRuntime.pasteStack,stats:importedRuntime.stats});
        }catch(writeError){
          try{await chrome.storage.sync.clear();await chrome.storage.local.clear();await chrome.storage.sync.set(previousSync);await chrome.storage.local.set(previousLocal)}
          catch(rollbackError){console.error("CopySelect backup rollback failed",rollbackError)}
          throw new Error(`Restore failed; previous data was restored where possible. ${writeError?.message||writeError}`);
        }
        state={...normalized,history:importedRuntime.history,pinned:importedRuntime.pinned,pasteStack:importedRuntime.pasteStack,stats:importedRuntime.stats};
      }
      bindState();renderRules();renderProfiles();renderHistory();renderUsageStats();refreshStatus();updatePreview();
    }
  }catch(err){console.error("CopySelect import failed",err);alert(`Import failed. ${err?.message||"The file is not a valid CopySelect backup."}`)}
  e.target.value="";
});
$("#resetBtn")?.addEventListener("click",async()=>{
  if(await confirmDestructive("This erases all CopySelect settings, profiles, rules, and local clipboard items permanently.")){
    const normalized=normalizeSettings(CS_DEFAULTS),{history,pinned,pasteStack,stats,...syncSafe}=normalized;
    await chrome.storage.sync.clear();await chrome.storage.local.clear();await chrome.storage.sync.set(syncSafe);await chrome.storage.local.set({history:[],pinned:[],pasteStack:[],stats:CS_DEFAULTS.stats});
    state=normalizeSettings(CS_DEFAULTS);bindState();renderRules();renderProfiles();renderHistory();refreshStatus();updatePreview();openPage("general");
  }
});
chrome.storage.onChanged.addListener(async(changes,area)=>{
  if(area==="local"&&(changes.history||changes.pinned||changes.stats||changes.pasteStack||changes.lastWordWatchMatch)){
    const runtime=await safeMessage({action:"runtimeData"});
    if(runtime?.history){
      state.history=runtime.history;state.pinned=runtime.pinned||[];state.pasteStack=runtime.pasteStack||[];state.stats=runtime.stats||state.stats;state.lastWordWatchMatch=runtime.lastWordWatchMatch||state.lastWordWatchMatch;
      // A History re-copy updates stats. Re-rendering the entire list for that stats-only
      // change destroys the copy-flash DOM node immediately, making every configured
      // duration look identical. Only rebuild History when History-shaped data changed.
      if(changes.history||changes.pinned||changes.pasteStack)renderHistory();
      if(changes.stats)renderUsageStats();
      if(changes.lastWordWatchMatch||changes.history||changes.pinned||changes.pasteStack)renderOrganizationHub();
    }
  }
  if(area==="sync"&&(changes.historyCollections||changes.historySavedViews||changes.smartTagSuggestionMode||changes.smartTagAutoThreshold||changes.smartTagLearningEnabled||changes.activeProfile||changes.profiles)){
    const sync=normalizeSettings({...state,...await chrome.storage.sync.get(null)});Object.assign(state,{historyCollections:sync.historyCollections,historySavedViews:sync.historySavedViews,smartTagSuggestionMode:sync.smartTagSuggestionMode,smartTagAutoThreshold:sync.smartTagAutoThreshold,smartTagLearningEnabled:sync.smartTagLearningEnabled,activeProfile:sync.activeProfile,profiles:sync.profiles});bindState();renderProfiles();renderHistory();renderOrganizationHub();
  }
});

setupSymbolPicker();
const filterPanel=$("#findSenseFilters");
function renderSimpleMetadataOrder(){const host=$("#simpleMetadataOrder");if(!host)return;const labels={title:"Title",domain:"Domain",date:"Date",text:"COPIED TEXT",time:"Time",url:"URL",selectionLength:"Length"},enabled={title:state.includeTitle,domain:state.includeDomain,date:state.includeDate,text:true,time:state.includeTime,url:state.includeURL,selectionLength:state.includeSelectionLength!==false};host.replaceChildren(...state.simpleMetadataOrder.map(key=>{const chip=document.createElement(key==="text"?"span":"button");if(key!=="text")chip.type="button";chip.className="metadata-order-chip"+(key==="text"?" anchor":"");chip.dataset.metadataToken=key;chip.draggable=key!=="text";if(key!=="text")chip.disabled=!enabled[key];chip.innerHTML=key==="text"?labels[key]:`<span aria-hidden="true">⋮⋮</span>${labels[key]}`;return chip}))}
let draggedMetadataToken="";
$("#simpleMetadataOrder")?.addEventListener("dragstart",e=>{const chip=e.target.closest("[data-metadata-token]");if(!chip||chip.dataset.metadataToken==="text")return;draggedMetadataToken=chip.dataset.metadataToken;e.dataTransfer.effectAllowed="move"});
$("#simpleMetadataOrder")?.addEventListener("dragover",e=>e.preventDefault());
$("#simpleMetadataOrder")?.addEventListener("drop",async e=>{e.preventDefault();const target=e.target.closest("[data-metadata-token]")?.dataset.metadataToken;if(!draggedMetadataToken||!target)return;const order=state.simpleMetadataOrder.filter(x=>x!==draggedMetadataToken),at=order.indexOf(target);order.splice(at<0?order.length:at,0,draggedMetadataToken);state.simpleMetadataOrder=order;await chrome.storage.sync.set({simpleMetadataOrder:order});renderSimpleMetadataOrder();updateMetadataPreview()});
$(".simple-metadata-card .metadata-checks")?.addEventListener("change",()=>queueMicrotask(renderSimpleMetadataOrder));
function setHistoryFiltersOpen(open){filterPanel?.classList.toggle("hidden",!open);$("#historyFiltersToggle")?.setAttribute("aria-expanded",String(open));const caret=$("#historyFiltersCaret");if(caret){caret.textContent="";caret.classList.toggle("open",open)}}
setHistoryFiltersOpen(false);
$("#historyFiltersToggle")?.addEventListener("click",()=>setHistoryFiltersOpen(filterPanel?.classList.contains("hidden")));
$("#findSensePinned")?.addEventListener("change",e=>{resetHistoryPaging();const search=$("#historySearch");if(!search)return;const withoutPinned=search.value.replace(/\bpinned\b/gi,"").replace(/\s{2,}/g," ").trim();search.value=e.currentTarget.checked?[withoutPinned,"pinned"].filter(Boolean).join(" "):withoutPinned;syncHistorySearchClear();renderHistory()});
$("#findSenseApply")?.addEventListener("click",()=>{resetHistoryPaging();
  const search=$("#historySearch"),site=$("#findSenseSite").value.trim().replace(/["\s]/g,"");
  const clean=search.value.replace(/\bsite:(?:"[^"]+"|\S+)/gi,"").replace(/\b(today|formatted|images|repeated|pinned)\b/g,"").trim();
  search.value=[clean,site?"site:"+site:"",$("#findSenseDate").value,$("#findSenseType").value,$("#findSensePinned").checked?"pinned":""].filter(Boolean).join(" ");
  renderHistory();setHistoryFiltersOpen(false);search.focus();
});
// Checkbox-gated confirmations for destructive collection, bulk-history, and Saved View actions.
document.addEventListener("click",async e=>{
  const batch=e.target.closest?.('[data-history-action="delete"]');
  if(batch){e.preventDefault();e.stopImmediatePropagation();const items=selectedHistoryItems();if(!items.length){announceHistory("Select one or more items first",true);return}if(!await confirmDestructive(`Delete ${items.length} selected item${items.length===1?"":"s"}?`))return;for(const item of items)await safeMessage({action:"deleteHistory",id:item.id});historyBatchSelection.clear();await refreshRuntimeHistory();announceHistory("Selected items deleted");return}
  const collectionId=e.target.closest?.("[data-delete-collection]")?.dataset.deleteCollection;
  if(collectionId){e.preventDefault();e.stopImmediatePropagation();const c=(state.historyCollections||[]).find(x=>x.id===collectionId);if(!c)return;if(c.locked&&!unlockedCollectionIds.has(collectionId)){openUnlockDialog(collectionId);announceHistory("Unlock this Collection before deleting it",true);return}if(!await confirmDestructive(`Delete collection “${c.name}”? Items themselves will stay in History.`))return;state.historyCollections=state.historyCollections.filter(x=>x.id!==collectionId);[...state.history,...state.pinned].forEach(x=>x.collectionIds=(x.collectionIds||[]).filter(id=>id!==collectionId));await chrome.storage.local.set({history:state.history,pinned:state.pinned});await saveCollections();renderHistoryCollections();return}
  const viewId=e.target.closest?.("[data-delete-view]")?.dataset.deleteView;
  if(viewId){e.preventDefault();e.stopImmediatePropagation();const v=(state.historySavedViews||[]).find(x=>x.id===viewId);if(!v||!await confirmDestructive(`Delete Saved View “${v.name}”?`))return;state.historySavedViews=state.historySavedViews.filter(x=>x.id!==viewId);await persist("historySavedViews",state.historySavedViews);renderOrganizationHub()}
},true);
load().then(()=>{setupVersionTooltip();syncSymbolPicker();renderSimpleMetadataOrder()}).catch(e=>{console.error("CopySelect settings failed to initialize",e);announceA11y("CopySelect settings could not be loaded. Reload this page.",true)});

// About FAQ deep links use the same page navigation as the sidebar.
document.addEventListener("click",e=>{const link=e.target.closest?.("[data-faq-page]");if(!link)return;e.preventDefault();const page=link.dataset.faqPage;if(page)openPage(page)});
function syncFaqToggleAll(){const button=$("#faqToggleAll"),details=$$(".about-faq details");if(!button||!details.length)return;const allOpen=details.every(section=>section.open);button.dataset.state=allOpen?"collapse":"expand";button.setAttribute("aria-label",allOpen?"Collapse all FAQ categories":"Expand all FAQ categories");button.title=allOpen?"Collapse all FAQ categories":"Expand all FAQ categories";const text=button.querySelector(".faq-toggle-text");if(text)text.textContent=allOpen?"Collapse all":"Expand all"}
$("#faqToggleAll")?.addEventListener("click",()=>{const details=$$(".about-faq details"),collapse=details.every(section=>section.open);details.forEach(section=>section.open=!collapse);syncFaqToggleAll();announceA11y(collapse?"All FAQ categories collapsed":"All FAQ categories expanded")});
$$(".about-faq details").forEach(section=>section.addEventListener("toggle",syncFaqToggleAll));
queueMicrotask(syncFaqToggleAll);
