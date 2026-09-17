/* CopySelect Smart Core v0.4-browser
 * Framework-free local WordWatch, concept normalization, tag suggestions,
 * Saved View query parsing, session grouping, and lightweight learning helpers.
 */
(function(global){
  'use strict';
  const STOP=new Set(`a an the and or but if then else to of in on at for from with without by as is are was were be been being this that these those it its into out over under about after before new good more most some any all page text copy copied item items thing things still yet though thoughout however therefore thus so such very really quite rather maybe perhaps probably simply actually already even ever never always often sometimes usually here there where when why how what which who whom whose this that these those those're these're there's here's i i'm i’m im ive i've i’ve id i'd i’d ill i'll i’ll me mine myself you you're you’re youre you've you’ve youve you'd you’d youll you'll you’ll yourself yourselves we we're we’re were we've we’ve wed we'd we’d well we'll we’ll us ours ourselves they they're they’re theyre they've they’ve theyve they'd they’d theyll they'll they’ll them theirs themselves he he's he’s hes he'd he’d hell he'll he’ll him his himself she she's she’s shes she'd she’d shell she'll she’ll her hers herself it it's it’s its it'd it’d it'll it’ll itself my your our their still just also very really quite rather maybe perhaps probably simply actually already even ever never always often sometimes usually here there where when why how what which who whom whose have has had having do does did doing can could may might must shall should will would not no nor yes yeah okay ok de da do das dos e o a os as um uma para por com sem em no na nos nas que se un una el la los las y en con per il lo gli le di del della dei degli delle da al alla alle e che un uno una`.split(/\s+/));
  const CONCEPTS={
    restaurant:['restaurant','restaurants','trattoria','trattorie','osteria','osterie','ristorante','ristoranti','eatery','eateries','bistro','brasserie','dining','place to eat','restaurante','restaurantes','tasca','tascas'],
    recipe:['recipe','recipes','ricetta','ricette','receita','receitas','receta','recetas','ingredient','ingredients','ingrediente','ingredienti','ingredientes','method','instructions','serves','yield','preparation','preparazione','preparação'],
    measurement:['cup','cups','tsp','tbsp','teaspoon','teaspoons','tablespoon','tablespoons','gram','grams','gramme','grammes','grammi','gramas','kg','ml','milliliter','milliliters','millilitre','millilitres','litre','liter','oz','ounce','ounces','°c','°f'],
    hotel:['hotel','hotels','hostel','hostels','lodging','accommodation','accommodations','albergo','alberghi','alloggio','alloggi','hôtel','hôtels','hotelaria'],
    museum:['museum','museums','museo','musei','museu','museus','gallery','galleries','exhibition','exhibitions','mostra','mostre','exposição','exposições'],
    travel:['travel','trip','visit','visiting','itinerary','itineraries','flight','flights','reservation','reservations','booking','bookings','viaggio','viaggi','visita','visitar','viagem','viagens','roteiro','roteiros'],
    research:['research','study','studies','evidence','citation','citations','paper','papers','journal','journals','according to','researchers found','evidence suggests','studio','ricerca','pesquisa','estudo','estudos'],
    coding:['code','coding','function','functions','const','class','import','export','npm','git','github','api','json','javascript','typescript','python','sql','select','commit','branch'],
    shopping:['price','prices','shipping','delivery','discount','sale','€','$','£','preço','prezzi','spedizione','consegna','entrega','desconto'],
    address:['address','addresses','street','road','avenue','piazza','via','rua','avenida','postcode','zip code','postal code'],
    phone:['phone','telephone','tel','mobile','cell','telefone','telefono']
  };
  const ALIAS_TO_CONCEPT=new Map();
  for(const [concept,aliases] of Object.entries(CONCEPTS)) for(const alias of aliases) ALIAS_TO_CONCEPT.set(alias.toLowerCase(),concept);
  const esc=s=>String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  function fold(s){return String(s??'').normalize('NFKC').toLocaleLowerCase().replace(/[\u200B-\u200D\uFEFF]/g,'').replace(/\s+/g,' ').trim()}
  function tokens(s){return fold(s).match(/[\p{L}\p{N}][\p{L}\p{N}'’.-]*/gu)||[]}
  const REGEX_CACHE=new Map();
  function wildcardRegex(term,{wholeWords=false,caseSensitive=false}={}){
    const raw=String(term??'').trim(),key=`${wholeWords?1:0}|${caseSensitive?1:0}|${raw}`;
    let cached=REGEX_CACHE.get(key);if(cached)return cached;
    let src=raw.split('*').map(esc).join('.*?');
    if(wholeWords)src=`(?:^|[^\p{L}\p{N}_])(${src})(?=$|[^\p{L}\p{N}_])`;
    cached=new RegExp(src,`${caseSensitive?'':'i'}u`);
    if(REGEX_CACHE.size>=4096)REGEX_CACHE.clear();
    REGEX_CACHE.set(key,cached);return cached;
  }
  function matchTerm(text,term,{wholeWords=false,caseSensitive=false}={}){
    const raw=String(term??'').trim();if(!raw)return false;
    const hay=caseSensitive?String(text??''):String(text??'').toLocaleLowerCase(),pattern=caseSensitive?raw:raw.toLocaleLowerCase();
    const parts=pattern.split('*').filter(Boolean),isWord=c=>!!c&&/[\p{L}\p{N}_]/u.test(c);
    if(!parts.length)return true;
    const tryFrom=start=>{
      let pos=start,first=-1,end=-1;
      for(const part of parts){const found=hay.indexOf(part,pos);if(found<0)return null;if(first<0)first=found;pos=found+part.length;end=pos}
      return {first,end};
    };
    let from=0;
    while(from<=hay.length){
      const hit=tryFrom(from);if(!hit)return false;
      let boundaryStart=hit.first,boundaryEnd=hit.end;
      if(pattern.startsWith('*'))while(boundaryStart>0&&isWord(hay[boundaryStart-1]))boundaryStart--;
      if(pattern.endsWith('*'))while(boundaryEnd<hay.length&&isWord(hay[boundaryEnd]))boundaryEnd++;
      if(!wholeWords||(!isWord(hay[boundaryStart-1])&&!isWord(hay[boundaryEnd])))return true;
      const next=hay.indexOf(parts[0],hit.first+1);if(next<0)return false;from=next;
    }
    return false;
  }
  function splitRuleTerms(value){
    if(Array.isArray(value))return value.map(String).map(x=>x.trim()).filter(Boolean);
    return String(value??'').split(/[\n,;]+/).map(x=>x.trim()).filter(Boolean);
  }
  function conceptHits(text){
    const hay=fold(text),out=new Map();
    for(const [alias,concept] of ALIAS_TO_CONCEPT){
      let ok=false;
      if(alias.length<=3)ok=new RegExp(`(?:^|[^\\p{L}\\p{N}_])${esc(alias)}(?=$|[^\\p{L}\\p{N}_])`,'iu').test(hay);
      else ok=hay.includes(alias);
      if(ok)out.set(concept,(out.get(concept)||0)+1);
    }
    return out;
  }
  function normalizedConcepts(text){return [...conceptHits(text).keys()]}
  function canonicalTerm(term){const key=fold(term);return ALIAS_TO_CONCEPT.get(key)||key.replace(/(?:ies)$/,'y').replace(/(?:s)$/,'')}
  function scoreLearned(learner,tag,text){
    const rec=learner?.[fold(tag)];if(!rec)return 0;
    const words=new Set(tokens(text).filter(x=>x.length>2&&!STOP.has(x)));
    let score=Number(rec.bias||0);
    for(const w of words)score+=Number(rec.weights?.[w]||0);
    return Math.max(0,Math.min(.99,.5+score*.08));
  }
  function learnTagChoice(learner={},tag,text,accepted=true){
    const key=fold(tag);if(!key)return learner;
    const next=JSON.parse(JSON.stringify(learner||{})),rec=next[key]||{bias:0,weights:{},accepted:0,rejected:0};
    const delta=accepted?1:-1.15;rec.bias=Math.max(-8,Math.min(8,Number(rec.bias||0)+delta*.12));
    for(const w of [...new Set(tokens(text).filter(x=>x.length>2&&!STOP.has(x)))].slice(0,40))rec.weights[w]=Math.max(-5,Math.min(5,Number(rec.weights[w]||0)+delta*.18));
    accepted?rec.accepted++:rec.rejected++;next[key]=rec;return next;
  }
  function suggestTags(text,{max=5,learner=null,existing=[]}={}){
    const raw=String(text??''),hay=fold(raw),existingSet=new Set((existing||[]).map(fold)),candidates=[];
    const hits=conceptHits(raw);
    for(const [tag,count] of hits){
      let confidence=Math.min(.96,.76+Math.min(4,count)*.045);
      confidence=Math.max(confidence,scoreLearned(learner,tag,raw));
      if(!existingSet.has(fold(tag)))candidates.push({tag,confidence,source:'concept',reason:`Matched ${count} related ${count===1?'term':'terms'}`});
    }
    const proper=[...raw.matchAll(/\b([A-ZÀ-ÖØ-Ý][\p{L}’'-]{2,}(?:\s+[A-ZÀ-ÖØ-Ý][\p{L}’'-]{2,}){0,2})\b/gu)].map(m=>m[1].trim());
    const pc=new Map();for(const p of proper)if(!STOP.has(fold(p)))pc.set(p,(pc.get(p)||0)+1);
    for(const [tag,count] of pc){if(existingSet.has(fold(tag)))continue;let confidence=Math.min(.88,.68+count*.07);confidence=Math.max(confidence,scoreLearned(learner,tag,raw));candidates.push({tag,confidence,source:'entity',reason:'Named place, person, product, or topic'})}
    const wc=new Map();for(const w of tokens(raw)){if(w.length<4||STOP.has(w)||/^\d+$/.test(w))continue;wc.set(w,(wc.get(w)||0)+1)}
    for(const [w,count] of [...wc.entries()].sort((a,b)=>b[1]-a[1]).slice(0,12)){
      const tag=canonicalTerm(w);if(existingSet.has(fold(tag))||candidates.some(c=>fold(c.tag)===fold(tag)))continue;
      let confidence=Math.min(.77,.48+Math.min(5,count)*.055);confidence=Math.max(confidence,scoreLearned(learner,tag,raw));
      if(confidence>=.55)candidates.push({tag,confidence,source:'lexical',reason:`Repeated or distinctive term (${count}×)`});
    }
    return candidates.sort((a,b)=>b.confidence-a.confidence||a.tag.localeCompare(b.tag)).slice(0,max).map(x=>({...x,confidence:Math.round(x.confidence*100)/100}));
  }
  function suggestTagsForGroup(snippets,{max=10,learner=null}={}){
    const texts=(snippets||[]).map(x=>typeof x==='string'?x:String(x?.text??x?.rawText??'')).filter(Boolean),n=Math.max(1,texts.length),map=new Map();
    texts.forEach(text=>suggestTags(text,{max:12,learner}).forEach(s=>{const k=fold(s.tag),rec=map.get(k)||{...s,coverage:0,total:0};rec.coverage++;rec.total+=s.confidence;rec.confidence=Math.min(.98,rec.total/rec.coverage*.72+(rec.coverage/n)*.28);map.set(k,rec)}));
    return [...map.values()].sort((a,b)=>(b.coverage/n)-(a.coverage/n)||b.confidence-a.confidence).slice(0,max).map(x=>({tag:x.tag,confidence:Math.round(x.confidence*100)/100,coverage:x.coverage,total:n,source:x.source,reason:`Appears across ${x.coverage}/${n} selected clips`}));
  }
  function legacyToWordWatch(collection){
    const r=collection?.smart;if(!r?.enabled)return null;
    const terms=splitRuleTerms(r.text),sites=splitRuleTerms(r.sites);
    let groups=[];
    if(terms.length)groups=[{mode:r.matchAll?'all':'any',terms}];
    return {enabled:true,sites,siteLogic:r.logic||'or',groups,exclude:[],copyMode:r.copyMode||'',wholeWords:!!r.wholeWords,caseSensitive:!!r.caseSensitive,useConcepts:true,actions:{addToCollection:true,addTags:[],pin:false,pasteStack:false},feedback:{mode:'global',priority:'normal'}};
  }
  function normalizeWordWatch(collection){
    const w=collection?.wordWatch&&typeof collection.wordWatch==='object'?collection.wordWatch:legacyToWordWatch(collection);
    if(!w?.enabled)return null;
    let remaining=100;
    const groups=[];
    for(const g of (Array.isArray(w.groups)?w.groups:[]).slice(0,10)){
      if(remaining<=0)break;
      const terms=splitRuleTerms(g?.terms).slice(0,remaining);remaining-=terms.length;
      if(terms.length)groups.push({mode:g?.mode==='all'?'all':'any',terms});
    }
    const exclude=splitRuleTerms(w.exclude).slice(0,remaining),sites=splitRuleTerms(w.sites).slice(0,100);
    return {
      enabled:true,
      sites,siteLogic:w.siteLogic||w.logic||'or',groups,exclude,copyMode:String(w.copyMode||''),wholeWords:!!w.wholeWords,caseSensitive:!!w.caseSensitive,useConcepts:w.useConcepts!==false,
      actions:{addToCollection:w.actions?.addToCollection!==false,addTags:splitRuleTerms(w.actions?.addTags).slice(0,50),pin:!!w.actions?.pin,pasteStack:!!w.actions?.pasteStack},
      feedback:{mode:w.feedback?.mode==='custom'?'custom':'global',message:String(w.feedback?.message||'').slice(0,80),color:String(w.feedback?.color||''),textColor:String(w.feedback?.textColor||''),sound:String(w.feedback?.sound||''),priority:['low','normal','high'].includes(w.feedback?.priority)?w.feedback.priority:'normal',effect:String(w.feedback?.effect||''),duration:Math.max(0,Math.min(10000,Number(w.feedback?.duration)||0))}
    };
  }

  function prepareEntry(entry){
    const source=String(entry?.rawText??entry?.text??'');
    let domain='';try{domain=new URL(entry?.url||'').hostname.toLowerCase()}catch{}
    return {entry,source,lower:source.toLowerCase(),domain,concepts:new Set(normalizedConcepts(source))};
  }
  function collectionMatch(entry,collection,prepared=null){
    const w=normalizeWordWatch(collection);if(!w)return {matched:false,wordWatch:null,reasons:[]};
    const ctx=prepared||prepareEntry(entry),source=ctx.source,hay=w.caseSensitive?source:ctx.lower,opts={wholeWords:w.wholeWords,caseSensitive:w.caseSensitive};
    const siteOK=!w.sites.length||w.sites.some(s=>{const rule=fold(s).replace(/^\*\./,'').replace(/^\.+|\.+$/g,'');return !!rule&&(ctx.domain===rule||ctx.domain.endsWith('.'+rule))});
    const termOK=t=>matchTerm(hay,t,opts)||(w.useConcepts&&ctx.concepts.has(canonicalTerm(t)));
    const groupResults=w.groups.map(g=>g.mode==='all'?g.terms.every(termOK):g.terms.some(termOK));
    const textOK=!groupResults.length||groupResults.every(Boolean),excluded=w.exclude.some(t=>matchTerm(hay,t,opts));
    const modeOK=!w.copyMode||w.copyMode===entry?.copyMode;
    let ruleOK;
    if(w.sites.length&&w.groups.length)ruleOK=w.siteLogic==='and'?siteOK&&textOK:w.siteLogic==='site'?siteOK:w.siteLogic==='text'?textOK:siteOK||textOK;
    else ruleOK=siteOK&&textOK;
    const matched=modeOK&&ruleOK&&!excluded;
    const reasons=[];if(matched){if(w.sites.length&&siteOK)reasons.push('site');w.groups.forEach((g,i)=>groupResults[i]&&reasons.push(`group ${i+1}`));if(w.useConcepts)reasons.push('concept normalization on')}
    return {matched,wordWatch:w,reasons};
  }
  function evaluateCollections(entry,collections,{maxActive=20}={}){
    const active=(collections||[]).filter(c=>normalizeWordWatch(c)).slice(0,maxActive),matches=[],prepared=prepareEntry(entry);
    const actions={addCollections:[],addTags:[],pin:false,pasteStack:false};
    for(const c of active){const ev=collectionMatch(entry,c,prepared);if(!ev.matched)continue;matches.push({collection:c,wordWatch:ev.wordWatch,reasons:ev.reasons});if(ev.wordWatch.actions.addToCollection)actions.addCollections.push(c.id);actions.addTags.push(...ev.wordWatch.actions.addTags);actions.pin||=ev.wordWatch.actions.pin;actions.pasteStack||=ev.wordWatch.actions.pasteStack}
    actions.addCollections=[...new Set(actions.addCollections)];actions.addTags=[...new Set(actions.addTags.map(x=>x.trim()).filter(Boolean))];
    const rank={low:0,normal:1,high:2};let feedback=null;
    for(const m of matches){const f=m.wordWatch.feedback;if(f.mode!=='custom')continue;if(!feedback||rank[f.priority]>=rank[feedback.priority])feedback={...f,collectionId:m.collection.id,collectionName:m.collection.name}}
    if(matches.length&&feedback){const names=matches.map(m=>m.collection.name);feedback.message=feedback.message||`Saved to ${names[0]}${names.length>1?` +${names.length-1}`:''}`;feedback.matchNames=names}
    return {matches,actions,feedback};
  }

  function organizationStamp(settings={}){
    const source=JSON.stringify([settings.historyCollections||[],settings.smartTagSuggestionMode||"off",Number(settings.smartTagAutoThreshold)||90,settings.profileTargetCollectionName||"",!!settings.profileRequireLockedCollection,!!settings.profileAutoPin,!!settings.profileAddPasteStack]);let h=2166136261;for(let i=0;i<source.length;i++){h^=source.charCodeAt(i);h=Math.imul(h,16777619)}return String(h>>>0);
  }
  function preAnalyze(entry,settings={}){
    const evaluation=evaluateCollections(entry,settings.historyCollections||[],{maxActive:20}),suggestedTags=settings.smartTagSuggestionMode==="off"?[]:suggestTags(String(entry?.rawText??entry?.text??""),{max:5,existing:entry?.tags||[]});
    return {stamp:organizationStamp(settings),matchNames:evaluation.matches.map(m=>m.collection.name),actions:evaluation.actions,feedback:evaluation.feedback,suggestedTags};
  }
  function groupSessions(items,gapMs=30*60*1000){
    const sorted=[...(items||[])].sort((a,b)=>Number(b.ts||0)-Number(a.ts||0)),sessions=[];let current=null;
    for(const item of sorted){const ts=Number(item.ts||Date.now());if(!current||Math.abs(Number(current.oldest.ts||0)-ts)>gapMs){current={id:`session-${ts}`,newest:item,oldest:item,items:[item]};sessions.push(current)}else{current.items.push(item);current.oldest=item}}
    return sessions;
  }
  function isUnorganized(item,{pinnedIds=new Set(),stackIds=new Set(),collections=[]}={}){
    if((item?.tags||[]).length)return false;if((item?.collectionIds||[]).length)return false;if(pinnedIds.has(item?.id))return false;if(stackIds.has(item?.id))return false;if(item?.protected)return false;
    if((item?.collectionIds||[]).some(id=>collections.some(c=>c.id===id&&c.locked)))return false;return true;
  }
  class QuerySyntaxError extends Error{constructor(message,position){super(`${message}${Number.isInteger(position)?` at ${position}`:''}`);this.name='QuerySyntaxError';this.position=position}}
  function fuzzyTextMatch(hay,token){
    const h=fold(hay),t=fold(token);if(!t)return true;if(h.includes(t))return true;
    const words=h.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
    return words.some(word=>{
      let i=0;for(const ch of word)if(ch===t[i])i++;
      if(i===t.length&&t.length>=3)return true;
      if(t.length<4||Math.abs(word.length-t.length)>1)return false;
      let a=0,b=0,edits=0;
      while(a<word.length&&b<t.length){if(word[a]===t[b]){a++;b++;continue}if(++edits>1)return false;if(word.length>=t.length)a++;if(t.length>=word.length)b++}
      return edits+(word.length-a)+(t.length-b)<=1;
    });
  }
  function queryValueMatch(hay,rawValue,{exact=false,fuzzy=true}={}){
    const raw=String(rawValue??'').trim();if(!raw)return true;
    if(raw.includes('*'))return matchTerm(String(hay??''),raw,{wholeWords:false,caseSensitive:false});
    if(exact||!fuzzy)return fold(hay).includes(fold(raw));
    return fuzzyTextMatch(hay,raw);
  }
  function tokenizeQuery(input=''){
    const s=String(input),out=[];let i=0,push=(type,value,pos=i)=>out.push({type,value,pos});
    while(i<s.length){
      if(/\s/.test(s[i])){i++;continue}
      if(s[i]==='('||s[i]===')'){push(s[i],s[i],i++);continue}
      if(s[i]==='-'){push('NOT','NOT',i++);continue}
      if(s[i]==='+'){push('PLUS','PLUS',i++);continue}
      const start=i;let field=null,value='',exact=false,j=i;
      while(j<s.length&&!/[\s()"]/.test(s[j])&&s[j]!==':')j++;
      if(s[j]===':'){field=s.slice(i,j);i=j+1}
      if(s[i]==='"'){exact=true;i++;while(i<s.length){if(s[i]==='\\'&&i+1<s.length){value+=s[i+1];i+=2;continue}if(s[i]==='"'){i++;break}value+=s[i++]}}
      else{const st=i;while(i<s.length&&!/[\s()]/.test(s[i]))i++;value=s.slice(st,i)}
      if(!field&&/^(AND|OR|NOT)$/i.test(value))push(value.toUpperCase(),value.toUpperCase(),start);
      else if(field)push('TERM',{field,value,exact},start);
      else if(value)push('TERM',{field:'text',value,exact},start)
    }
    return out;
  }
  function parseQuery(input){
    const t=tokenizeQuery(input);let i=0,peek=()=>t[i],take=()=>t[i++];
    function primary(){const x=peek();if(!x)throw new QuerySyntaxError('Expected term',String(input).length);if(x.type==='('){take();const e=or();const c=take();if(!c||c.type!==')')throw new QuerySyntaxError('Expected )',x.pos);return e}if(x.type==='TERM'){take();return {type:'term',...x.value}}throw new QuerySyntaxError(`Unexpected ${x.type}`,x.pos)}
    function unary(){if(peek()?.type==='NOT'){take();return {type:'not',value:unary()}}if(peek()?.type==='PLUS'){take();return {type:'required',value:unary()}}return primary()}
    function and(){let l=unary();while(true){const x=peek();if(x?.type==='AND'){take();l={type:'and',left:l,right:unary()};continue}if(x&&(x.type==='TERM'||x.type==='('||x.type==='NOT'||x.type==='PLUS')){l={type:'and',left:l,right:unary()};continue}break}return l}
    function or(){let l=and();while(peek()?.type==='OR'){take();l={type:'or',left:l,right:and()}}return l}
    if(!t.length)return {type:'all'};const ast=or();if(i<t.length)throw new QuerySyntaxError(`Unexpected ${t[i].type}`,t[i].pos);return ast
  }
  function termMatch(clip,field,rawValue,collections=[],exact=false){
    const v=fold(rawValue),f=fold(field),ids=clip.collectionIds||[],tags=clip.tags||[];
    if(f==='text'){
      if(v==='pinned')return !!clip.pinned;
      if(v==='today'){const d=new Date(Number(clip.ts)||0),n=new Date();return d.getFullYear()===n.getFullYear()&&d.getMonth()===n.getMonth()&&d.getDate()===n.getDate()}
      if(v==='formatted')return !!String(clip.html||'').trim();
      if(v==='images')return /<img\b/i.test(String(clip.html||''));
      if(v==='repeated')return (Number(clip.repeatCount)||1)>1
    }
    const wildcard=String(rawValue||'').includes('*');
    switch(f){
      case'tag':return tags.some(x=>wildcard?queryValueMatch(x,rawValue,{exact:false,fuzzy:false}):fold(x)===v);
      case'collectionid':return ids.some(x=>wildcard?queryValueMatch(String(x),rawValue,{exact:false,fuzzy:false}):fold(x)===v);
      case'collection':return ids.some(id=>{const c=collections.find(x=>String(x.id)===String(id));return queryValueMatch(c?.name||id,rawValue,{exact,fuzzy:false})});
      case'pinned':return !!clip.pinned===/^(1|true|yes|on)$/i.test(v);
      case'stack':case'pastestack':return !!clip.inPasteStack===/^(1|true|yes|on)$/i.test(v);
      case'site':case'source':return queryValueMatch(`${clip.title||''} ${clip.url||''}`,rawValue,{exact,fuzzy:false});
      case'title':return queryValueMatch(clip.title,rawValue,{exact,fuzzy:false});
      case'url':return queryValueMatch(clip.url,rawValue,{exact,fuzzy:false});
      default:return queryValueMatch([clip.rawText,clip.text,clip.label,clip.note,clip.title,clip.url,...tags].join(' '),rawValue,{exact,fuzzy:true})
    }
  }
  function compileQuery(query,{collections=[]}={}){const ast=parseQuery(query);const evalAst=(a,c)=>a.type==='all'?true:a.type==='term'?termMatch(c,a.field,a.value,collections,!!a.exact):a.type==='required'?evalAst(a.value,c):a.type==='not'?!evalAst(a.value,c):a.type==='and'?evalAst(a.left,c)&&evalAst(a.right,c):a.type==='or'?evalAst(a.left,c)||evalAst(a.right,c):false;const required=[];(function collect(a){if(!a)return;if(a.type==='required'){required.push(a.value);collect(a.value);return}if(a.left)collect(a.left);if(a.right)collect(a.right);if(a.type==='not')return;if(a.value&&typeof a.value==='object')collect(a.value)})(ast);const test=c=>evalAst(ast,c)&&required.every(r=>evalAst(r,c));return {query:String(query||''),ast,test,filter:clips=>(clips||[]).filter(test)}}
  function buildAiPrompt({name='WordWatch',terms=[],examples=[],languages=['English'],privacyMode='terms'}={}){
    const source=privacyMode==='examples'&&examples.length?`Example clips:\n${examples.slice(0,8).map((x,i)=>`${i+1}. ${String(x).slice(0,700)}`).join('\n')}`:`Current seed terms:\n${terms.join(', ')||'(none yet)'}`;
    return `You are helping configure CopySelect WordWatch, a local clipboard classification rule.\n\nGoal: ${name}\nLanguages: ${languages.join(', ')}\n${source}\n\nReturn ONLY valid JSON with this shape:\n{"groups":[{"mode":"any","terms":["term*","phrase"]},{"mode":"any","terms":["second evidence group"]}],"exclude":["false positive"],"suggestedTags":["tag"],"notes":"short explanation"}\n\nUse multiple groups when two kinds of evidence should both be present. Terms inside an any-group are OR; groups are ANDed. Use * only as a simple wildcard. Include useful multilingual variants, likely false positives, and normalized concepts. Do not include regex or executable code.`;
  }
  global.CopySelectSmartCore={CONCEPTS,fold,tokens,normalizedConcepts,canonicalTerm,matchTerm,splitRuleTerms,suggestTags,suggestTagsForGroup,learnTagChoice,scoreLearned,normalizeWordWatch,collectionMatch,evaluateCollections,organizationStamp,preAnalyze,groupSessions,isUnorganized,QuerySyntaxError,tokenizeQuery,parseQuery,compileQuery,buildAiPrompt};
  if(typeof module!=='undefined'&&module.exports)module.exports=global.CopySelectSmartCore;
})(typeof globalThis!=='undefined'?globalThis:this);
