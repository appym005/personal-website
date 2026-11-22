"""Local browser smoke test with mocked public trade messages, never fake live claims in production."""
from playwright.sync_api import sync_playwright
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
STYLE=(ROOT/'style.css').read_text().replace((ROOT/'style.css').read_text().splitlines()[0], '')
JS=(ROOT/'game.js').read_text()
mock = r'''
(() => {
  const actualNow = Date.now.bind(Date);
  window.__clockShift=0;
  Date.now = () => actualNow() + window.__clockShift;
  window.__fakePrice={BTC:62000,ETH:3100,SOL:170};
  window.__feedStop=false;
  class FakeSocket {
    constructor(url) {
      this.url=url;this.readyState=0;window.__fakeSocket=this;
      this.id=setInterval(() => {
        if (this.readyState!==1||window.__feedStop) return;
        for(const asset of ['BTC','ETH','SOL']){
          this.onmessage?.({data:JSON.stringify({stream:asset.toLowerCase()+'usdt@trade', data:{e:'trade',s:asset+'USDT',p:String(window.__fakePrice[asset]),T:Date.now()}})});
        }
      },100);
      setTimeout(()=>{this.readyState=1;this.onopen?.()},20);
    }
    send() {}
    close(){clearInterval(this.id);this.readyState=3;this.onclose?.()}
  }
  window.WebSocket=FakeSocket;
  window.__pushTick=() => {
    for(const asset of ['BTC','ETH','SOL']){
      window.__fakeSocket.onmessage?.({data:JSON.stringify({stream:asset.toLowerCase()+'usdt@trade',data:{e:'trade',s:asset+'USDT',p:String(window.__fakePrice[asset]),T:Date.now()}})});
    }
  };
})();
'''
with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    for device, viewport in [('desktop',{'width':1440,'height':980}),('mobile',{'width':390,'height':844})]:
        page=browser.new_page(viewport=viewport, device_scale_factor=1)
        errors=[]
        page.on('pageerror',lambda e: errors.append(str(e)))
        html=(ROOT/'index.html').read_text().replace('<link rel="stylesheet" href="./style.css">', '<style>'+STYLE+'</style>').replace('<script src="./game.js" defer></script>', '').replace('</head>','<script>'+mock+'</script></head>').replace('</body>', '<script>'+JS+'</script></body>')
        page.set_content(html,wait_until='domcontentloaded')
        page.wait_for_function("document.getElementById('feed-label').textContent==='MARKET LIVE'",timeout=4000)
        assert page.locator('#live-price').inner_text().startswith('$62,000')
        assert page.locator('#call-up').is_enabled()
        width=page.evaluate('document.documentElement.scrollWidth')
        assert width <= viewport['width'] + 2, (device,'horizontal overflow',width)
        if device=='desktop':
            page.screenshot(path='/mnt/data/candle-clash-preview-desktop.png',full_page=True)
        else:
            page.screenshot(path='/mnt/data/candle-clash-preview-mobile.png',full_page=True)
        page.locator('#call-up').click()
        assert page.locator('#call-up').is_disabled()
        page.evaluate("window.__fakePrice.BTC=62100")
        page.wait_for_timeout(250)
        page.evaluate('window.__clockShift+=60100;window.__pushTick()')
        page.wait_for_timeout(400)
        assert page.locator('#result-title').inner_text()=='YOU BEAT THE CANDLE!', (device,page.locator('#round-message').inner_text())
        assert page.locator('#score-value').inner_text()=='100'
        page.locator('#play-again').click()
        assert page.locator('#call-up').is_enabled()
        page.locator('#call-up').click()
        page.evaluate("window.__fakePrice.BTC=61900")
        page.wait_for_timeout(250)
        page.evaluate('window.__clockShift+=60100;window.__pushTick()')
        page.wait_for_timeout(400)
        assert page.locator('#result-title').inner_text()=='THE CANDLE WON THIS ONE'
        assert page.locator('#score-value').inner_text()=='50'
        page.locator('#play-again').click()
        page.locator('.coin[data-asset="ETH"]').click()
        assert page.locator('#live-price').inner_text().startswith('$3,100')
        page.locator('#call-down').click()
        page.evaluate('window.__feedStop=true; window.__clockShift+=11000')
        page.wait_for_timeout(400)
        assert 'voided' in page.locator('#round-message').inner_text().lower()
        assert page.locator('#score-value').inner_text()=='50'
        partner=(ROOT/'partners.html').read_text().replace('<link rel="stylesheet" href="./style.css">', '<style>'+STYLE+'</style>')
        page.set_content(partner,wait_until='domcontentloaded')
        assert page.locator('.partner-contact').get_attribute('href').startswith('mailto:')
        assert not errors, (device,errors)
        page.close()
        print(device, 'PASS: responsive, feed, win, loss, void round, sponsor email')
    browser.close()
