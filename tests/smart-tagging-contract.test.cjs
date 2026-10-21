'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const core=require('../smart-core.js');
test('concepts normalize across languages',()=>{
 for(const [input,tag] of [['ricetta con ingredienti','recipe'],['receita com ingredientes','recipe'],['research paper with evidence','research'],['museu e exposição','museum']]){
  assert.ok(core.suggestTags(input,{max:20}).some(x=>x.tag===tag));
 }
});
test('existing tags excluded and output deterministic',()=>{
 const text='Research paper with evidence and journal citations';
 const a=core.suggestTags(text,{existing:['research'],max:20});
 assert.equal(a.some(x=>x.tag==='research'),false);
 assert.deepEqual(a,core.suggestTags(text,{existing:['research'],max:20}));
 assert.equal(new Set(a.map(x=>x.tag)).size,a.length);
 for(const tag of a)assert.ok(tag.confidence>=0&&tag.confidence<=1);
});
test('learning does not mutate original',()=>{
 const original={};
 const accepted=core.learnTagChoice(original,'research','research paper',true);
 assert.deepEqual(original,{});
 assert.equal(accepted.research.accepted,1);
});
