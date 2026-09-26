// Recovery from "version skew": a tab loaded before a deploy still asks for
// the old build's script/CSS files, which the new deployment no longer
// serves (404), and Next shows its bare "Application error" screen. A fresh
// document loads the new build, so reload, at most once a minute so a
// genuinely broken file can't cause a reload loop.
//
// This runs as an inline <head> script (see app/layout.tsx), not as a module:
// the whole point is to work when the site's own script files fail to load.
// Keep the storage key in step with app/error.tsx and app/global-error.tsx.

export const STALE_RELOAD_KEY = "ts_chunk_reload_at";

export const STALE_BUILD_GUARD_SCRIPT = `(function(){
var K=${JSON.stringify(STALE_RELOAD_KEY)};
function reload(){
  try{var last=+sessionStorage.getItem(K)||0;if(Date.now()-last<60000)return;sessionStorage.setItem(K,String(Date.now()))}catch(e){}
  location.reload();
}
addEventListener("error",function(e){
  var t=e.target;
  if(!t||t===window)return;
  var src=t.tagName==="SCRIPT"?t.src:t.tagName==="LINK"&&t.rel==="stylesheet"?t.href:"";
  if(src&&src.indexOf("/_next/static/")!==-1)reload();
},true);
addEventListener("unhandledrejection",function(e){
  var r=e.reason,m=r?String(r.name)+" "+String(r.message):"";
  if(/ChunkLoadError|Loading (CSS )?chunk|dynamically imported module/i.test(m))reload();
});
})();`;
