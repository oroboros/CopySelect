async function modernWrite(text, html) {
  if (html && typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
    const item = new ClipboardItem({
      "text/plain": new Blob([text], {type:"text/plain"}),
      "text/html": new Blob([html], {type:"text/html"})
    });
    await navigator.clipboard.write([item]);
    return true;
  }
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  return false;
}

function legacyWrite(text, html) {
  const holder = document.createElement("div");
  holder.contentEditable = "true";
  holder.style.cssText = "position:fixed;left:-10000px;top:-10000px;opacity:0;pointer-events:none;";
  if (html) holder.innerHTML = html;
  else holder.textContent = text;
  document.body.appendChild(holder);

  const range = document.createRange();
  range.selectNodeContents(holder);
  const selection = getSelection();
  selection.removeAllRanges();
  selection.addRange(range);

  let onCopy;
  if (html) {
    onCopy = e => {
      e.preventDefault();
      e.clipboardData.setData("text/plain", text);
      e.clipboardData.setData("text/html", html);
    };
    document.addEventListener("copy", onCopy, {once:true});
  }

  let ok = false;
  try { ok = document.execCommand("copy"); } catch {}
  if (onCopy && !ok) document.removeEventListener("copy", onCopy);
  selection.removeAllRanges();
  holder.remove();
  return ok;
}

chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.target !== "offscreen") return false;
  if (req.action === "readClipboard") {
    (async () => {
      try {
        const text = navigator.clipboard?.readText ? await navigator.clipboard.readText() : "";
        sendResponse({ok:true,text:String(text ?? "")});
      } catch (e) {
        sendResponse({ok:false,error:e?.message || "Clipboard read failed"});
      }
    })();
    return true;
  }
  if (req.action !== "writeClipboard") return false;
  (async () => {
    try {
      let ok = false;
      try { ok = await modernWrite(String(req.text ?? ""), req.html || null); } catch {}
      if (!ok) ok = legacyWrite(String(req.text ?? ""), req.html || null);
      sendResponse(ok ? {ok:true, method:"clipboard"} : {ok:false, error:"Clipboard write failed"});
    } catch (e) {
      let ok = false;
      try { ok = legacyWrite(String(req.text ?? ""), req.html || null); } catch {}
      sendResponse(ok ? {ok:true, method:"fallback"} : {ok:false, error:e?.message || "Clipboard write failed"});
    }
  })();
  return true;
});
