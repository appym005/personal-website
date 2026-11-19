# Media import report — 19 November 2026

Repository: appym005/personal-website, main. Starting revision: 70b04b5.

## Inventory and decisions

The Wix ZIP contains **282 files** (243 images, 31 videos, seven PDFs and one GLB). The categorized local project folders contain another **160 media files**. All **442 file occurrences** are accounted for in [media-inventory.json](media-inventory.json), with filenames, collection, SHA-256, sizes, project association, inclusion/exclusion reason and imported paths. Output records also include dimensions, codecs, duration and checksums.

| Collection | Imported sources | Duplicates | Unrelated excluded | Needs association review | Outdated RHB excluded |
|---|---:|---:|---:|---:|---:|
| wix-export | 43 | 147 | 40 | 33 | 19 |
| legacy-folders | 144 | 5 | 0 | 0 | 11 |

**187 source assets** were imported: 160 images and 27 videos. Videos longer than two minutes are split into ordered parts, producing **48 complete MP4 parts** without dropping source sections. The galleries contain **208 playable/viewable media entries** across 14 projects. There is no eight-media cap. An additional 48 WebP video posters bring the imported output total to **256 files**, 322,605,589 bytes (307.7 MiB). Largest output: 19,641,450 bytes (18.7 MiB).

The handoff mentions 264 remote Wix records; the supplied local ZIP contains 282 files. Without the original remote record list, the 18-record difference cannot be reconciled reliably. No stock "Project Title" items were added as portfolio projects.

## Galleries

| Project | Imported source assets | Images | MP4 parts | Status |
|---|---:|---:|---:|---|
| Kai's Dream | 9 | 9 | 0 | Populated |
| Anant Ratri | 35 | 30 | 13 | Populated |
| Red Hot Ball | 0 | 0 | 0 | 12 current-build placeholders; no obsolete Wix assets |
| Rokeya's Garden | 13 | 12 | 2 | Populated |
| Gone Away | 34 | 33 | 1 | Populated |
| Procedural Endless Terrain | 10 | 10 | 0 | Populated |
| Wobbly Adventures | 20 | 18 | 4 | Populated |
| IMHO | 1 | 1 | 0 | Populated |
| Procedural Animations | 8 | 1 | 7 | Populated |
| Procedural Character Interactions | 5 | 2 | 3 | Populated |
| Design Previewer | 7 | 6 | 1 | Populated |
| Endless Runner | 4 | 3 | 1 | Populated |
| Third Person Shooter | 28 | 25 | 3 | Populated |
| Automated Animation Pipeline | 4 | 1 | 13 | Populated |
| Word Zenith | 9 | 9 | 0 | Populated |
| Spatial Audio Experience App | 0 | 0 | 0 | Placeholder; no attributable source media found |

Subliminal media maps to **Procedural Character Interactions**, as specified in the normalized project description. Extra reviewed gameplay, environment and technical demo captures expand galleries beyond their original catalog entries.

## Homepage curation

All eight homepage slots were reviewed separately. Kai's Dream uses KD4, Rokeya's Garden uses RG1, Word Zenith uses WZ1, and IMHO uses IMHO1, converted to optimized WebP. The four Red Hot Ball slots remain null. Full gallery contents are independent of these cover choices. Portrait covers and screenshots retain their full frame.

## Exclusions and unresolved associations

- **152 duplicates:** byte-identical sources, identical decoded image pixels, or confirmed video container/compression variants. A walkthrough initially missed by fraction-based sampling was compared at fixed timestamps 38, 191 and 306 seconds and removed as a duplicate of AR1. Distinct uncut and highlight edits remain.
- **30 outdated Red Hot Ball occurrences:** excluded from galleries and homepage.
- **40 unrelated files:** resumes, portraits, certificates, logos, the GLB and other non-gallery material.
- **33 files needing association review:** MoonLake/Main landscape art, MrRobot sequence images, standalone character/monster renders, Batman and other unassigned demonstrations. These are inventoried individually but withheld because no supported association with one of the 16 projects was established.

The source downloads and originals were preserved. Pre-existing repository media also remains available for auxiliary references. The complete per-file list of imported/excluded/review records is in the inventory, rather than silently assigning uncertain content to a project.

## Red Hot Ball capture gap

The Unity directories under D:/GameDev/Touchstone/RedHotBalls_U6.3 were searched for gameplay videos and screenshots. The RedHotBall_Splash checkout was at ff807eb (10 November) with local edits, which were left untouched. A release AAB dated 6 November exists, but no verified current-build gameplay recording was found. Three external screenshots and a feature graphic dated 9 October have unverified current-build provenance and were not imported. No Android device was connected for fresh captures.

Still needed: current title/key art, menu captures, gameplay covering heat/ice and hazards, and current gameplay video/trailer. Spatial Audio Experience App also needs attributable screenshots or a demo recording.

## Website and deployment changes

- H.264/yuv420p MP4 video, AAC audio when present, maximum 720p/30 fps, progressive playback via faststart. WebP gallery images up to 1920 pixels; lightweight video posters. All output files remain below 24 MiB.
- Gallery pages load posters instead of preloading every video; the native viewer provides playback controls and inline mobile video. Future entries without posters retain the existing video-thumbnail fallback.
- Fixed a detached lazy-image loading issue that prevented homepage covers from appearing. Improved portrait framing, captions, mobile modal layout and horizontal clipping.
- Fixed the Experience page's Projects link to point to the current homepage section and added its missing favicon reference.
- Preserved the Cloudflare Pages workflow, project name, domain/canonical settings, app-ads.txt and auxiliary pages. Corrected .wranglerignore exclusions for projects.normalized.json and experience.normalized.json, which are fetched at runtime. Browser evidence and the inventory are excluded from deployment.

## Verification

File validation passed for all **256 outputs**: every referenced path exists; all WebP images fully decode; all 48 MP4 files fully decode without errors; codecs and pixel format are compatible; moov precedes mdat; output durations match each source segment within 0.5 seconds; no file exceeds 24 MiB; RHB slots contain no outdated media.

Browser verification passed in Chromium using desktop and resized mobile viewports:

- Homepage at 1440, 390 and 320 pixels: eight independent slots; four loaded covers/four RHB placeholders; all 16 project links; heat demo; mobile menu open/navigation/close; no horizontal scrollbar beyond subpixel rounding.
- All 16 project galleries at each width (**48 gallery/viewport checks**): expected counts; expand/collapse; image decoding; modal next/previous, keyboard and Escape; media cleanup; portrait framing and modal/page sizing. Every thumbnail was decoded on desktop; representative thumbnails were decoded again on mobile. No local failed resources or JavaScript page errors.
- **58 browser video checks:** playback advances for all 48 parts at desktop width, plus one video from each of the ten video-bearing projects at mobile width. Every tested video seeks to 60% of its duration within one second, exposes controls, uses inline playback, and is removed on viewer close. Seeking was verified with an HTTP Range-capable local server; the basic Python static server does not provide suitable Range behavior.
- Unknown project handling and the four-entry Experience timeline passed. JavaScript syntax checks and git diff --check passed. app-ads.txt, the Cloudflare workflow, homepage/domain metadata and normalized catalog match the starting revision byte for byte.

Screenshots were inspected for desktop/mobile homepage covers, project galleries and video viewer layout. Tests use Chromium viewport emulation, not a physical phone or Safari. Local evidence is saved in output/playwright (ignored by Git and deployment).

## Deployment

The verified change is intended for origin/main and the existing Cloudflare Pages workflow. Deployment runs after the push; its final run URL, result, live-domain checks and commit SHA are reported in the accompanying chat. No Cloudflare account, DNS or domain settings were modified.
