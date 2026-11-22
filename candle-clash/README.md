# Candle Clash

A mobile-friendly, zero-stakes 60-second crypto direction arcade by Touchstone Games. No framework, account system, database, trading, wallet, real-money prizes or build step.

## Play

Serve this directory locally with `python3 -m http.server 8000`, then visit `http://localhost:8000/candle-clash/` if serving the parent folder or `/` if serving this directory.

The app connects to Binance's public market-data-only Spot WebSocket (`data-stream.binance.vision`) and falls back to Coinbase Exchange public ticker WebSocket if the first stream is unavailable. Prices are labeled USDT vs USD according to source. The game never invents simulated market prices or settles rounds when a fresh price is missing. Public endpoints may be blocked in some jurisdictions or fail due to network policies.

Score: +100 points for win, +25 additional points per consecutive win capped at +300, -50 on loss with floor 0; draws score 0. Scores are stored in localStorage, are NOT global rankings, and have no cash value.

## Deployment

The Touchstone Games repo `appym005/personal-website` has a GitHub Actions workflow to deploy the repository root to Cloudflare Pages on each push to `main`. Put these files at `/candle-clash/` in that repo. No existing website file needs changing. After publishing, check both `https://www.touchstonegames.in/candle-clash/` and `https://<Cloudflare Pages project>.pages.dev/candle-clash/` and verify mobile access/live feeds.

## Sponsor setup

`partners.html` contains a transparent pilot campaign offer and a `mailto:` link to the contact email already published on the parent Touchstone website. The sidebar is labeled an available ad slot — there is no actual sponsor yet. No payments, impressions measurement, or advertising SDK have been wired. Do not claim paid sponsors or revenue until verified.

## Privacy & reliability

No player analytics or account system, and no server-side storage of gameplay scores. Browser localStorage holds aggregate score/win stats. IP address and market subscriptions are disclosed to third-party public market-data feed providers when connected. Offline / stale feeds disable starting rounds. If feed is lost or settlement can't be verified in time, the round is void rather than assigning a guessed outcome.

## Verification

Run `node --check candle-clash/game.js` and `python3 candle-clash/tests/check_static.py` from the parent directory. Browser smoke test should cover mobile layout, switching assets, connecting to the feed, prediction lock, settlement, recovery after feed loss, and sponsor email link.
