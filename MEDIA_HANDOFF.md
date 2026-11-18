# Touchstone Games — local media handoff for Codex

## Goal
The new homepage is deployed from this **same** repository on Cloudflare Pages. Replace designed media placeholders with real, reviewed game screenshots and Wix-exported media. Do not recreate the site, change the Cloudflare Pages project, alter DNS, or replace the existing deploy workflow.

Repository: https://github.com/appym005/personal-website
Cloudflare Pages project: personal-website
Live domain: https://www.touchstonegames.in/
Main page: index.html
Styles: game-site.css
Behavior/media loader: game-site.js
Media map: site-media.json

## What to do on the user's computer
1. Pull the latest main branch after confirming the homepage redesign has merged.
2. Locate the Wix media download locally. Do not assume where it lives. Ask the user to locate it only if discovery is impossible.
3. Inspect and inventory source files. Associate each image/video with the correct project based on visual content, not just filenames.
4. **Red Hot Ball must use NEW current-build R1/R2 screenshots / key art**, supplied separately by the user or exported from their current build. Do not reuse the obsolete Wix Red Hot Ball gameplay screens. If current captures are unavailable, keep RHB slots null and report what is needed.
5. Choose crops appropriate to the slots, resize/encode as WEBP/AVIF where practical (preserve image quality), and place under media/site/<project>/.
6. Update site-media.json values to paths like "./media/site/rhb/hero.webp" and "./media/site/rhb/01.webp". The loader fills slots automatically when files exist. Leave unfilled slots null.
7. Check mobile and desktop aspect ratios, cover framing, alt text, download sizes, and all links. Large images should usually target under 400 KB; use judgment for quality and source material.
8. Commit image files + manifest (no unrelated changes), push to main, verify GitHub Actions "Deploy to Cloudflare Pages" succeeded and that the domain now shows them.
9. Preserve app-ads.txt, existing privacy/deep link resources, and the GitHub Actions workflow.

## Slots and intended assets

| Manifest key | Content | Approximate crop |
|---|---|---|
| rhb-cover | **New** Red Hot Ball hero/key art or attractive current gameplay | portrait-ish 1:1 |
| rhb-shot-1 | **New** RHB screenshot: temperature / meltable ice | landscape 4:3 |
| rhb-shot-2 | **New** RHB screenshot: impact-breakable ice / physics | landscape 4:3 |
| rhb-shot-3 | **New** RHB screenshot: moving hazards / piston timing | landscape 4:3 |
| kai-cover | Kai's Dream image from Wix media | landscape 16:10 |
| rokeya-cover | Rokeya's Garden image from Wix media | landscape 16:10 |
| word-zenith-cover | Word Zenith game screenshot from Wix media | landscape 16:10 |
| imho-cover | IMHO app image from Wix media | landscape 16:10 |

The placeholders are intentional polished illustrations (not representations of actual game footage). Do not describe placeholder art as screenshots. Avoid inventing store-launch status, review metrics, testimonials, or availability. The RHB Google Play listing has not been verified as publicly available, so no live "Download now" button is present.

## Suggested Codex task to paste locally

> In the current repo appym005/personal-website, inspect MEDIA_HANDOFF.md and site-media.json. Discover the Wix media I've downloaded locally, identify the best assets for Kai's Dream, Rokeya's Garden, Word Zenith and IMHO, optimize and copy them to media/site/, then update their manifest slots. For Red Hot Ball, never use outdated Wix screenshots: find current screenshots I provide from the latest game build, or leave those slots untouched and tell me exactly which captures to supply. Test the page locally at desktop and mobile widths, preserve app-ads.txt and existing deployment configuration, and commit/push the media-only changes once verified.
