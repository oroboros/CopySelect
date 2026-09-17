/**
 * CopySelect AI scaffold — inert by design.
 * No network calls, credentials, permissions, UI, or runtime imports are wired in this RC.
 * Future implementations should provide an explicit provider adapter and privacy mode.
 */
(function(global){
  "use strict";
  const AI_SCHEMA_VERSION=1;
  const PRIVACY_MODES=Object.freeze(["local-only","explicit-provider"]);
  function createRequest({task="classify",text="",context={},privacyMode="local-only"}={}){
    if(!PRIVACY_MODES.includes(privacyMode))throw new Error("Unsupported AI privacy mode");
    return Object.freeze({schemaVersion:AI_SCHEMA_VERSION,task:String(task),text:String(text),context:{...context},privacyMode});
  }
  function normalizeResult(result={}){return Object.freeze({schemaVersion:AI_SCHEMA_VERSION,ok:!!result.ok,labels:Array.isArray(result.labels)?result.labels.map(String):[],summary:String(result.summary||""),confidence:Number.isFinite(Number(result.confidence))?Number(result.confidence):null,provider:String(result.provider||"none"),error:result.error?String(result.error):""})}
  class ProviderAdapter{async run(){throw new Error("AI provider is not configured")}}
  global.CopySelectAI=Object.freeze({AI_SCHEMA_VERSION,PRIVACY_MODES,createRequest,normalizeResult,ProviderAdapter,enabled:false});
})(globalThis);
