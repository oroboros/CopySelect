(()=>{
  const out=document.getElementById("content");
  fetch(chrome.runtime.getURL("CHANGELOG.txt"),{cache:"no-store"})
    .then(r=>{if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.text()})
    .then(text=>{out.textContent=text.trim()||"No changelog entries yet."})
    .catch(err=>{console.error("CopySelect changelog load failed",err);out.textContent="Could not load the changelog."});
})();
