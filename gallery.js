(() => {
"use strict";
const archive=document.getElementById("project-archive"),gallery=document.getElementById("project-media-gallery");
if(!archive&&!gallery)return;
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n;};
const href=slug=>"./project.html?project="+encodeURIComponent(slug);
const publicMedia=new Set(["KaisDream/KD1.png","KaisDream/KD2.png","KaisDream/KD3.png","KaisDream/KD4.png","RokeyasGarden/RG1.png","RokeyasGarden/RG2.png","RokeyasGarden/RG3.png","RokeyasGarden/RG4.png","DesignPreviewer/DP1.mp4","DesignPreviewer/DP2.png","DesignPreviewer/DP3.png","DesignPreviewer/DP4.png"]);
const safe=src=>typeof src==="string" && /^\.\/media\/[a-z0-9\/_ .-]+$/i.test(src);
Promise.all([fetch("./projects.normalized.json").then(r=>{if(!r.ok)throw Error("projects");return r.json();}),fetch("./gallery-media.json").then(r=>r.json())]).then(([data,mediaManifest])=>{
const projects=data.projects||[];
const mediaFor=p=>{
 const custom=mediaManifest.projects?.[p.slug];
 if(Array.isArray(custom)&&custom.length)return custom;
 if(p.slug==="red-hot-ball")return Array.from({length:12},(_,i)=>({type:i===11?"video":"image",src:null,label:i===0?"Current game key art":i===11?"Latest gameplay trailer":"Current-build screenshot "+i,source:null}));
 const source=p.mediaAssets||[];
 return source.length?source.map((name,i)=>({type:/\.(mp4|webm|mkv|mov)$/i.test(name)?"video":"image",src:publicMedia.has(name)?"./media/"+name:null,label:"Project media "+String(i+1).padStart(2,"0"),source:name})): [{type:"image",src:null,label:"Project media to be added",source:null}];
};
if(archive){const featured=new Set(["red-hot-ball","kai-s-dream","rokeya-s-garden","word-zenith","imho"]);projects.filter(p=>!featured.has(p.slug)).forEach(p=>{const a=el("a","archive-card");a.href=href(p.slug);a.append(el("span","archive-kind",p.category||"INTERACTIVE"),el("strong","",p.title),el("span","",mediaFor(p).length+" MEDIA ENTRIES ↗"));archive.append(a);});}
if(!gallery)return;
const slug=new URLSearchParams(location.search).get("project")||new URLSearchParams(location.search).get("slug")||"red-hot-ball";
const p=projects.find(x=>x.slug===slug);
if(!p){gallery.replaceChildren(el("p","","Project not found."));return;}
document.title=p.title+" | Touchstone Games";
const set=(id,value)=>{const n=document.getElementById(id);if(n)n.textContent=value;};
const summary= p.slug==="red-hot-ball"?"A heat-powered physics puzzle game with melting ice, moving hazards and timing challenges.":(p.oneLineHook||"Interactive game and technology project.");
set("detail-kicker",(p.category||"INTERACTIVE PROJECT").toUpperCase()+" / "+(p.role||"DEVELOPER").toUpperCase());
set("detail-title",p.title.toUpperCase());set("detail-summary",summary);
set("detail-monogram",p.slug==="red-hot-ball"?"✳":p.title.split(/\s+/).map(x=>x[0]).join("").slice(0,3));
const tags=document.getElementById("detail-tags");(p.tools||[]).slice(0,7).forEach(t=>tags.append(el("span","",t)));
const media=mediaFor(p);const note=document.querySelector(".gallery-note");if(note)note.textContent=media.some(item=>!safe(item.src))?(p.slug==="red-hot-ball"?"New screenshots and gameplay from the current Red Hot Ball build are coming soon.":"Project screenshots and video are coming soon."):"Select an image to view it at full size, or a video to open playback controls.";set("detail-media-count",media.length+" MEDIA ENTRIES / GROWING LIBRARY");set("gallery-count",media.length+" IMAGE + VIDEO ENTRIES");
const viewer=document.getElementById("media-viewer");const viewerContent=document.getElementById("viewer-content");let openIndex=0,playables=[];
const show=idx=>{if(!playables.length)return;openIndex=(idx+playables.length)%playables.length;const item=playables[openIndex];viewerContent.replaceChildren();const v=el(item.type==="video"?"video":"img");v.src=item.src;if(item.type==="video"){v.controls=true;v.playsInline=true;v.preload="metadata";if(safe(item.poster))v.poster=item.poster;}else v.alt=item.label||p.title+" screenshot";viewerContent.append(v);set("viewer-title",p.title.toUpperCase()+" / "+(item.label||"MEDIA"));set("viewer-counter",(openIndex+1)+" / "+playables.length);if(!viewer.open)viewer.showModal();};
document.getElementById("viewer-close").addEventListener("click",()=>viewer.close());document.getElementById("viewer-prev").addEventListener("click",()=>show(openIndex-1));document.getElementById("viewer-next").addEventListener("click",()=>show(openIndex+1));viewer.addEventListener("close",()=>viewerContent.replaceChildren());viewer.addEventListener("click",e=>{if(e.target===viewer)viewer.close();});viewer.addEventListener("keydown",e=>{if(e.key==="ArrowLeft")show(openIndex-1);if(e.key==="ArrowRight")show(openIndex+1);});
gallery.replaceChildren();media.forEach((item,i)=>{const card=el("article","gallery-card"+(i>=6?" is-collapsed":""));const available=safe(item.src)&&!/\.mkv$/i.test(item.src);const box=el(available?"button":"div","gallery-media"+(available?" is-real":""));if(available){box.type="button";box.setAttribute("aria-label","Open "+(item.label||"media"));}box.append(el("span","gallery-num",String(i+1).padStart(2,"0")+" / "+String(media.length).padStart(2,"0")));
if(available){const poster=safe(item.poster);const video=item.type==="video";const m=el(video&&!poster?"video":"img");m.src=video&&poster?item.poster:item.src;if(video&&!poster){m.preload="metadata";m.muted=true;m.playsInline=true;}else{m.loading=i<3?"eager":"lazy";m.decoding="async";m.alt=item.label||p.title+" visual";}m.onerror=()=>{m.remove();box.classList.remove("is-real");box.append(el("span","gallery-symbol","✳"),el("span","gallery-placeholder","ASSET NOT FOUND"));box.disabled=true;};box.append(m);const idx=playables.length;playables.push(item);box.addEventListener("click",()=>show(idx));}else{box.append(el("span","gallery-symbol"+(item.type==="video"?" video":""),item.type==="video"?"▷":"✳"),el("span","gallery-placeholder","MEDIA PLACEHOLDER"));}
box.append(el("span","gallery-type",item.type==="video"?"VIDEO":"IMAGE"));const caption=el("div","gallery-caption");caption.append(el("strong","",item.label||"Project media"),el("span","",available?"VIEW ↗":"PENDING"));card.append(box,caption);gallery.append(card);});
const more=document.getElementById("gallery-more");if(media.length>6){more.hidden=false;more.textContent="SHOW ALL "+media.length+" MEDIA ENTRIES ↓";more.addEventListener("click",()=>{const collapsed=gallery.querySelector(".gallery-card.is-collapsed");if(collapsed){gallery.querySelectorAll(".gallery-card.is-collapsed").forEach(n=>n.classList.remove("is-collapsed"));more.textContent="SHOW FEWER ↑";}else{[...gallery.querySelectorAll(".gallery-card")].forEach((n,i)=>n.classList.toggle("is-collapsed",i>=6));more.textContent="SHOW ALL "+media.length+" MEDIA ENTRIES ↓";}});}
const related=document.getElementById("related-projects");projects.filter(q=>q.slug!==p.slug).slice(0,3).forEach(q=>{const a=el("a","related-card");a.href=href(q.slug);a.append(el("span","related-kind",q.category||"GAME"),el("strong","",q.title),el("span","","VIEW GALLERY ↗"));related.append(a);});
}).catch(()=>{if(gallery)gallery.replaceChildren(el("p","","Could not load the project catalog."));if(archive)archive.append(el("p","","Project archive unavailable."));});
})();
