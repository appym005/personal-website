# Touchstone Games — comprehensive project media handoff for local Codex

The earlier **eight slots are only homepage feature thumbnails**. The actual game website now has **16 project galleries** powered by projects.normalized.json and gallery-media.json. Galleries are dynamic, accept unlimited images and videos, and show all entries with an expand control. The pre-existing normalized catalog references **156 media assets**. The two projects without media receive placeholder entries; Red Hot Ball gets 12 fresh-media slots instead of obsolete images.

On 2026-11-18 the connected Wix Media Manager returned **264 image/video/vector files**. This includes duplicates, templates, and media not meant for every portfolio project. The six generic "Project Title" entries in Wix Portfolio are unedited stock photography examples, not actual game-development projects. Do not import those as projects.

## Files
- Repo: appym005/personal-website; branch main; Cloudflare Pages: personal-website
- Homepage: index.html, game-site.css, game-site.js
- Homepage 8 curated covers/screens: site-media.json
- All projects / full galleries: projects.normalized.json, project.html, gallery.js, gallery.css
- Media overrides and gallery expansions: gallery-media.json
- Existing deployment file: .github/workflows/cloudflare-pages.yml (preserve)
- Preserve app-ads.txt and all existing auxiliary pages/links

## What Codex should do on the user's computer
1. Pull main; find the user's downloaded Wix media directory (ask for path only if discovery fails).
2. Recursively inventory every image and video, including duplicates. Cross-reference with projects.normalized.json projects[].mediaAssets and examine actual content. Categorize each file as included by project, duplicate, unrelated/stock, or needs review. Account for all 264 Wix media records where possible; local downloads may differ.
3. The 16 authentic projects are: Red Hot Ball; Kai's Dream; Anant Ratri; Rokeya's Garden; Gone Away; Procedural Endless Terrain; Wobbly Adventures; IMHO; Procedural Animations; Procedural Character Interactions; Design Previewer; Endless Runner; Third Person Shooter; Automated Animation Pipeline; Word Zenith; Spatial Audio Experience App.
4. Optimize/convert and place selected images/videos under media/site/<slug>/ (WebP/AVIF recommended; H.264 MP4/WebM for browser video; transcode MKV, don't just rename).
5. Add each project's authentic gallery entries under gallery-media.json projects[slug] as an array of {type:"image"|"video",src:"./media/site/...",label:"...",source:"original filename"}. Adding an override replaces fallback slots; include ALL appropriate entries, not just a fixed number. Each project may have 1, 10, 35 or more images/videos.
6. Update only the best eight **homepage** media in site-media.json separately. Full galleries do not use that eight-slot manifest.
7. **Red Hot Ball must use NEW, up-to-date game screenshots and video from the current Unity build. Never import the old RHB Wix images into the new public presentation.** Keep current placeholder entries until fresh captures are sourced. Include hero, title, menus, gameplay, mechanics, and trailer as appropriate.
8. Verify image/video layout, browser-compatible formats, mobile/desktop responsiveness, loading, lightbox controls, captions/alt text, and all project links.
9. Preserve Cloudflare repo/deploy settings and app-ads.txt. Commit/push updates to main; verify Cloudflare job success; report imported/excluded counts by project.

## Copy/paste task
Read MEDIA_HANDOFF.md, projects.normalized.json, gallery-media.json, and site-media.json. Locate the media I downloaded from Wix on this computer. Audit ALL of it and categorize by actual project. Import and optimize every relevant asset into the 16 expandable project galleries, with no eight-image cap; keep homepage media curated separately. Never reuse outdated Wix Red Hot Ball screenshots: source fresh captures from the current game build, or leave its placeholders. Test responsive galleries and video playback, preserve Cloudflare settings, and push verified media changes.
