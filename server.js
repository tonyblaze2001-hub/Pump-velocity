'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const ROOT = __dirname;
const EMBEDDED_ASSETS = {"/index.html": "<!doctype html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"utf-8\" />\n  <meta name=\"viewport\" content=\"width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no\" />\n  <meta name=\"theme-color\" content=\"#070a0e\" />\n  <meta name=\"apple-mobile-web-app-capable\" content=\"yes\" />\n  <meta name=\"apple-mobile-web-app-status-bar-style\" content=\"black-translucent\" />\n  <meta name=\"apple-mobile-web-app-title\" content=\"PumpVelocity\" />\n  <link rel=\"manifest\" href=\"/manifest.webmanifest\" />\n  <link rel=\"icon\" href=\"/icon.svg\" />\n  <title>Pump Velocity Lab</title>\n  <link rel=\"stylesheet\" href=\"/styles.css\" />\n</head>\n<body>\n  <div class=\"noise\"></div>\n  <div class=\"shell\">\n    <header class=\"topbar\">\n      <div class=\"brand\">\n        <div class=\"logo\">P</div>\n        <div><div class=\"brand-title\">PUMP VELOCITY LAB</div><div class=\"brand-sub\">50% curve momentum study · iPhone research terminal</div></div>\n      </div>\n      <div class=\"right-head\">\n        <div class=\"status-chip\" id=\"pumpStatus\"><i></i><span>Pump feed</span></div>\n        <div class=\"status-chip\" id=\"rpcStatus\"><i></i><span>On-chain RPC</span></div>\n        <div class=\"clock\" id=\"clock\">--:--:--</div>\n      </div>\n    </header>\n\n    <nav class=\"tabs\">\n      <button class=\"tab active\" data-tab=\"live\">LIVE DETECTOR</button>\n      <button class=\"tab\" data-tab=\"study\">STUDY LAB</button>\n      <button class=\"tab\" data-tab=\"settings\">SETTINGS</button>\n      <a class=\"ghost-link\" href=\"/api/export.csv\">EXPORT CSV ↗</a>\n    </nav>\n\n    <main>\n      <section class=\"view active\" id=\"view-live\">\n        <div class=\"hero-grid\">\n          <div class=\"metric hero\">\n            <div class=\"metric-label\">TRACKED NOW</div><div class=\"metric-value\" id=\"mTracked\">0</div><div class=\"metric-foot\">active bonding curves</div>\n          </div>\n          <div class=\"metric\"><div class=\"metric-label\">50% ENTRIES</div><div class=\"metric-value\" id=\"mEntries\">0</div><div class=\"metric-foot\">study samples</div></div>\n          <div class=\"metric green\"><div class=\"metric-label\">+100% HIT</div><div class=\"metric-value\" id=\"mP100\">0%</div><div class=\"metric-foot\" id=\"mP100n\">0 / 0</div></div>\n          <div class=\"metric purple\"><div class=\"metric-label\">+200% HIT</div><div class=\"metric-value\" id=\"mP200\">0%</div><div class=\"metric-foot\" id=\"mP200n\">0 / 0</div></div>\n          <div class=\"metric gold\"><div class=\"metric-label\">GRADUATED</div><div class=\"metric-value\" id=\"mPGrad\">0%</div><div class=\"metric-foot\" id=\"mPGradn\">0 / 0</div></div>\n        </div>\n\n        <div class=\"panel filter-panel\">\n          <div class=\"panel-title\"><span>Signal board</span><small>sorted by momentum score</small></div>\n          <div class=\"filters\">\n            <button class=\"pill active\" data-filter=\"all\">All</button>\n            <button class=\"pill\" data-filter=\"armed\">Armed</button>\n            <button class=\"pill\" data-filter=\"study\">50% Study</button>\n            <button class=\"pill\" data-filter=\"hot\">Hot</button>\n            <label class=\"toggle\"><input type=\"checkbox\" id=\"onlyFast\"><span></span>Fast only</label>\n          </div>\n        </div>\n\n        <div class=\"token-grid\" id=\"tokenGrid\">\n          <div class=\"empty\">Waiting for Pump.fun launches…</div>\n        </div>\n      </section>\n\n      <section class=\"view\" id=\"view-study\">\n        <div class=\"study-hero\">\n          <div>\n            <div class=\"eyebrow\">CONDITIONAL PROBABILITY</div>\n            <h1>Does fast 50% really continue?</h1>\n            <p>Every token that crosses the configured curve level gets a paper entry. The lab follows price from the on-chain reserves and records +100%, +200%, graduation and drawdown.</p>\n          </div>\n          <div class=\"study-badge\"><span id=\"fastSamples\">0</span><small>FAST SAMPLES</small></div>\n        </div>\n        <div class=\"compare-grid\">\n          <div class=\"compare-card\"><div class=\"compare-title\">ALL 50% ENTRIES</div><div class=\"compare-row\"><span>+100%</span><b id=\"all100\">0%</b></div><div class=\"compare-row\"><span>+200%</span><b id=\"all200\">0%</b></div><div class=\"compare-row\"><span>Graduate</span><b id=\"allGrad\">0%</b></div></div>\n          <div class=\"compare-card glow\"><div class=\"compare-title\">FAST VELOCITY FILTER</div><div class=\"compare-row\"><span>+100%</span><b id=\"fast100\">0%</b></div><div class=\"compare-row\"><span>+200%</span><b id=\"fast200\">0%</b></div><div class=\"compare-row\"><span>Graduate</span><b id=\"fastGrad\">0%</b></div></div>\n        </div>\n        <div class=\"panel table-panel\">\n          <div class=\"panel-title\"><span>Recent study entries</span><small>paper entries only · no wallet connected</small></div>\n          <div class=\"table-wrap\">\n            <table><thead><tr><th>Token</th><th>0→Entry</th><th>V10</th><th>Accel</th><th>Entry MC</th><th>Max Return</th><th>+100</th><th>+200</th><th>Grad</th></tr></thead><tbody id=\"studyRows\"></tbody></table>\n          </div>\n        </div>\n      </section>\n\n      <section class=\"view\" id=\"view-settings\">\n        <div class=\"settings-layout\">\n          <div class=\"panel settings-card\">\n            <div class=\"panel-title\"><span>Detector rules</span><small>saved on the running server</small></div>\n            <div class=\"form-grid\">\n              <label>Study entry curve %<input id=\"cfgEntry\" type=\"number\" min=\"1\" max=\"99\" step=\"1\"></label>\n              <label>Fast: max 0→entry seconds<input id=\"cfgFastTime\" type=\"number\" min=\"1\" step=\"1\"></label>\n              <label>Fast: minimum V10 (%pts/10s)<input id=\"cfgFastV\" type=\"number\" min=\"0\" step=\"0.1\"></label>\n              <label>Hot score threshold<input id=\"cfgHot\" type=\"number\" min=\"1\" max=\"100\" step=\"1\"></label>\n              <label>Chain polling (ms)<input id=\"cfgPoll\" type=\"number\" min=\"1000\" step=\"100\"></label>\n              <label>Max active curves<input id=\"cfgLimit\" type=\"number\" min=\"10\" max=\"500\" step=\"10\"></label>\n            </div>\n            <label class=\"wide-label\">Solana RPC URL<input id=\"cfgRpc\" type=\"text\"></label>\n            <label class=\"wide-label\">Pump frontend bearer token <em>optional; stored on your server</em><input id=\"cfgToken\" type=\"password\" placeholder=\"Leave blank unless Pump endpoint returns 401/403\"></label>\n            <div class=\"action-row\"><button class=\"primary\" id=\"saveCfg\">SAVE SETTINGS</button><button class=\"danger\" id=\"resetStudy\">RESET STUDY DATA</button></div>\n          </div>\n          <div class=\"panel explain-card\">\n            <div class=\"panel-title\"><span>What V10 means</span></div>\n            <div class=\"formula\">V10 = curve progress change over the latest ~10 seconds</div>\n            <p><b>Example:</b> 38% → 50% in 10 sec = <strong>+12.0 V10</strong>.</p>\n            <p><b>Acceleration:</b> latest 10-second V10 minus the prior 10-second V10. Positive means the curve is speeding up.</p>\n            <div class=\"note\">This terminal does not place orders and does not connect a wallet. It is built to collect evidence first.</div>\n            <div class=\"install-note\"><b>iPhone install:</b> Safari → Share → Add to Home Screen. Keep the app open while doing live study unless your server is configured to stay awake continuously.</div>\n          </div>\n        </div>\n      </section>\n    </main>\n  </div>\n  <div id=\"toast\"></div>\n  <script src=\"/app.js\"></script>\n</body>\n</html>\n", "/styles.css": ":root{--bg:#07090c;--panel:#0d1117;--panel2:#111720;--line:#202a36;--text:#eef4f8;--muted:#758393;--green:#53f5a2;--purple:#b58cff;--gold:#ffc85a;--red:#ff667a;--cyan:#70d9ff}*{box-sizing:border-box}html,body{margin:0;background:var(--bg);color:var(--text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;min-height:100%}body{background:radial-gradient(1000px 500px at 40% -10%,rgba(83,245,162,.08),transparent 55%),radial-gradient(900px 500px at 100% 0,rgba(181,140,255,.07),transparent 60%),var(--bg)}.noise{position:fixed;inset:0;pointer-events:none;opacity:.025;background-image:url(\"data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.8'/%3E%3C/svg%3E\")}.shell{max-width:1540px;margin:auto;padding:18px 24px 60px}.topbar{height:74px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #151d27}.brand{display:flex;align-items:center;gap:13px}.logo{width:40px;height:40px;border-radius:12px;background:linear-gradient(145deg,#53f5a2,#25b77a);display:grid;place-items:center;color:#06110c;font-weight:1000;font-size:23px;box-shadow:0 0 35px rgba(83,245,162,.18)}.brand-title{font-size:14px;letter-spacing:.19em;font-weight:900}.brand-sub{font-size:11px;color:var(--muted);margin-top:3px}.right-head{display:flex;align-items:center;gap:10px}.status-chip{height:32px;padding:0 11px;border:1px solid var(--line);border-radius:999px;font-size:11px;color:#9aa7b4;display:flex;align-items:center;gap:7px;background:#0a0e13}.status-chip i{width:7px;height:7px;border-radius:50%;background:#4a5662}.status-chip.online i{background:var(--green);box-shadow:0 0 10px var(--green)}.status-chip.error i{background:var(--red);box-shadow:0 0 10px rgba(255,102,122,.45)}.clock{font-variant-numeric:tabular-nums;font-size:12px;color:#93a0ad;border-left:1px solid var(--line);padding-left:14px}.tabs{display:flex;align-items:center;gap:4px;height:58px}.tab,.ghost-link,.pill{appearance:none;border:0;background:transparent;color:#718091;cursor:pointer;text-decoration:none;font:inherit}.tab{font-size:11px;font-weight:800;letter-spacing:.1em;padding:10px 12px;border-radius:8px}.tab.active{background:#121821;color:#fff}.ghost-link{margin-left:auto;font-size:11px;font-weight:800;color:var(--green);padding:9px 0}.view{display:none}.view.active{display:block}.hero-grid{display:grid;grid-template-columns:1.2fr repeat(4,1fr);gap:12px;margin:5px 0 16px}.metric{min-height:112px;border:1px solid var(--line);border-radius:14px;background:linear-gradient(180deg,rgba(255,255,255,.018),transparent),var(--panel);padding:18px 18px 15px;position:relative;overflow:hidden}.metric:after{content:\"\";position:absolute;inset:auto -10% -60% 20%;height:100px;background:radial-gradient(circle,rgba(112,217,255,.07),transparent 65%)}.metric.green:after{background:radial-gradient(circle,rgba(83,245,162,.11),transparent 65%)}.metric.purple:after{background:radial-gradient(circle,rgba(181,140,255,.12),transparent 65%)}.metric.gold:after{background:radial-gradient(circle,rgba(255,200,90,.1),transparent 65%)}.metric-label{font-size:10px;letter-spacing:.13em;color:#82909f;font-weight:800}.metric-value{font-size:30px;line-height:1.1;font-weight:900;letter-spacing:-.04em;margin-top:12px}.metric-foot{font-size:10px;color:#5f6d7b;margin-top:5px}.panel{border:1px solid var(--line);border-radius:14px;background:rgba(13,17,23,.9)}.filter-panel{display:flex;align-items:center;justify-content:space-between;padding:13px 15px;margin-bottom:12px}.panel-title{display:flex;align-items:baseline;gap:10px;font-size:12px;font-weight:850;letter-spacing:.04em}.panel-title small{font-size:10px;color:#657280;font-weight:500;letter-spacing:0}.filters{display:flex;gap:7px;align-items:center}.pill{font-size:10px;padding:7px 10px;border:1px solid #26313e;border-radius:999px}.pill.active{color:#08100b;background:var(--green);border-color:var(--green);font-weight:900}.toggle{display:flex;align-items:center;gap:8px;font-size:10px;color:#83909d;margin-left:7px;cursor:pointer}.toggle input{display:none}.toggle span{width:30px;height:17px;border-radius:20px;background:#202a35;position:relative}.toggle span:after{content:\"\";position:absolute;width:11px;height:11px;border-radius:50%;background:#718090;left:3px;top:3px;transition:.15s}.toggle input:checked+span{background:#183d2d}.toggle input:checked+span:after{left:16px;background:var(--green)}.token-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.token-card{border:1px solid #1d2732;border-radius:14px;background:linear-gradient(160deg,#10161d,#0a0e13 65%);padding:14px;min-width:0;transition:.15s;position:relative;overflow:hidden}.token-card:hover{border-color:#344353;transform:translateY(-1px)}.token-card.armed{border-color:rgba(255,200,90,.55);box-shadow:inset 0 0 30px rgba(255,200,90,.025)}.token-card.study{border-color:rgba(83,245,162,.5);box-shadow:inset 0 0 30px rgba(83,245,162,.03)}.card-top{display:flex;gap:10px;align-items:center}.coin-img{width:42px;height:42px;border-radius:11px;object-fit:cover;background:#151c25;border:1px solid #222e3a}.coin-placeholder{width:42px;height:42px;border-radius:11px;display:grid;place-items:center;background:#151c25;color:#657381;font-weight:900}.coin-name{font-size:13px;font-weight:850;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.coin-sub{display:flex;gap:7px;font-size:9px;color:#6f7d8b;margin-top:4px}.score{margin-left:auto;text-align:right}.score b{font-size:19px;letter-spacing:-.05em}.score small{display:block;color:#61707e;font-size:8px;letter-spacing:.1em}.status-line{display:flex;align-items:center;justify-content:space-between;margin-top:14px}.tag{font-size:9px;font-weight:900;letter-spacing:.08em;padding:5px 7px;border-radius:6px;background:#19222c;color:#9aa7b4}.tag.ARMED{background:rgba(255,200,90,.12);color:var(--gold)}.tag.HOT{background:rgba(181,140,255,.12);color:var(--purple)}.tag.STUDY,.tag.GRADUATED{background:rgba(83,245,162,.12);color:var(--green)}.progress-num{font-size:17px;font-weight:900;font-variant-numeric:tabular-nums}.progressbar{height:7px;border-radius:99px;background:#18212b;margin:9px 0 12px;overflow:hidden}.progressbar i{height:100%;display:block;background:linear-gradient(90deg,#2cbf7a,#67f6aa);border-radius:99px;box-shadow:0 0 12px rgba(83,245,162,.25);transition:width .35s}.mini-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}.mini{background:#0a0f14;border:1px solid #17202a;border-radius:9px;padding:8px}.mini span{display:block;color:#60707f;font-size:8px;letter-spacing:.08em}.mini b{display:block;margin-top:4px;font-size:11px;font-variant-numeric:tabular-nums}.positive{color:var(--green)!important}.negative{color:var(--red)!important}.spark{height:40px;margin-top:10px;width:100%}.spark polyline{fill:none;stroke:#53f5a2;stroke-width:1.5;vector-effect:non-scaling-stroke}.card-bottom{margin-top:10px;display:flex;align-items:center;justify-content:space-between}.socials{font-size:9px;color:#687786}.open{font-size:9px;color:var(--cyan);text-decoration:none;font-weight:800}.empty{grid-column:1/-1;text-align:center;padding:80px;color:#596776;border:1px dashed #202a35;border-radius:14px}.study-hero{display:flex;justify-content:space-between;align-items:center;padding:34px 4px 28px}.eyebrow{font-size:10px;color:var(--green);font-weight:900;letter-spacing:.17em}.study-hero h1{font-size:34px;margin:8px 0 7px;letter-spacing:-.045em}.study-hero p{color:#7e8b98;max-width:700px;line-height:1.55;font-size:13px}.study-badge{width:140px;height:140px;border:1px solid #2b3a48;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(circle,rgba(83,245,162,.08),transparent 65%)}.study-badge span{font-size:35px;font-weight:950}.study-badge small{font-size:8px;color:#6e7c89;letter-spacing:.13em;margin-top:5px}.compare-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px}.compare-card{padding:18px;border:1px solid var(--line);border-radius:14px;background:var(--panel)}.compare-card.glow{border-color:rgba(83,245,162,.28);background:linear-gradient(120deg,rgba(83,245,162,.035),transparent),var(--panel)}.compare-title{font-size:10px;color:#7d8996;letter-spacing:.12em;font-weight:900;margin-bottom:8px}.compare-row{display:flex;justify-content:space-between;padding:12px 2px;border-top:1px solid #18212a;color:#81909e;font-size:12px}.compare-row b{color:#fff;font-size:15px}.table-panel{overflow:hidden}.table-panel .panel-title{padding:15px 16px;border-bottom:1px solid var(--line)}.table-wrap{overflow:auto}table{width:100%;border-collapse:collapse;font-size:11px}th{text-align:left;color:#62717f;font-size:9px;letter-spacing:.09em;padding:11px 14px;background:#0a0f14;position:sticky;top:0}td{padding:12px 14px;border-top:1px solid #17202a;color:#a6b1bb;font-variant-numeric:tabular-nums}td:first-child{color:#fff;font-weight:750}.yes{color:var(--green);font-weight:900}.no{color:#4f5d69}.settings-layout{display:grid;grid-template-columns:1.4fr .6fr;gap:13px;margin-top:10px}.settings-card,.explain-card{padding:18px}.form-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-top:18px}label{font-size:10px;color:#7e8b98;display:flex;flex-direction:column;gap:7px}input{background:#080c11;border:1px solid #24303c;border-radius:9px;color:#fff;padding:11px 12px;outline:none;font:inherit;font-size:12px}input:focus{border-color:#3b735b}.wide-label{margin-top:12px}.wide-label em{font-weight:400;color:#596674}.action-row{display:flex;gap:9px;margin-top:18px}button.primary,button.danger{border:0;border-radius:9px;padding:11px 15px;font-weight:900;font-size:10px;letter-spacing:.07em;cursor:pointer}.primary{background:var(--green);color:#05110b}.danger{background:#241218;color:#ff8897}.formula{margin-top:18px;padding:15px;border:1px solid #20303a;background:#091016;border-radius:10px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--green);font-size:12px}.explain-card p{font-size:12px;color:#7d8b98;line-height:1.55}.note{margin-top:20px;padding:13px;background:#14151b;border-left:2px solid var(--gold);font-size:11px;color:#8e96a0;line-height:1.5}#toast{position:fixed;right:22px;bottom:22px;background:#152019;border:1px solid #2a6849;color:#bfffdc;padding:11px 14px;border-radius:10px;font-size:11px;opacity:0;transform:translateY(8px);transition:.2s;pointer-events:none}#toast.show{opacity:1;transform:none}@media(max-width:1050px){.hero-grid{grid-template-columns:repeat(2,1fr)}.token-grid{grid-template-columns:repeat(2,1fr)}.settings-layout{grid-template-columns:1fr}}@media(max-width:700px){.shell{padding:12px}.topbar{height:auto;padding:10px 0;align-items:flex-start}.right-head{flex-wrap:wrap;justify-content:flex-end}.brand-sub{display:none}.clock{display:none}.hero-grid,.token-grid,.compare-grid,.form-grid{grid-template-columns:1fr}.filter-panel{align-items:flex-start;gap:12px;flex-direction:column}.filters{flex-wrap:wrap}.study-badge{display:none}.tabs{overflow-x:auto}.tab{white-space:nowrap}}\n.install-note{margin-top:12px;padding:13px;border:1px solid #214333;border-radius:10px;background:rgba(83,245,162,.04);font-size:11px;color:#8fa89b;line-height:1.55}.install-note b{color:var(--green)}\n@media(max-width:700px){\n  body{padding-top:env(safe-area-inset-top);padding-bottom:calc(76px + env(safe-area-inset-bottom));overscroll-behavior-y:none}\n  .shell{padding:10px 10px 18px}\n  .topbar{position:sticky;top:0;z-index:20;background:rgba(7,10,14,.92);backdrop-filter:blur(18px);border-bottom:1px solid rgba(255,255,255,.04)}\n  .logo{width:38px;height:38px;border-radius:11px;font-size:19px}.brand-title{font-size:11px;letter-spacing:.14em}\n  .right-head{gap:6px}.status-chip{height:28px;padding:0 8px;font-size:9px}.status-chip span{max-width:72px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n  .tabs{position:fixed;z-index:40;left:10px;right:10px;bottom:calc(8px + env(safe-area-inset-bottom));height:58px;padding:6px;background:rgba(12,17,23,.96);backdrop-filter:blur(18px);border:1px solid #202a35;border-radius:16px;box-shadow:0 12px 50px rgba(0,0,0,.45);overflow:visible}\n  .tab{flex:1;padding:9px 5px;font-size:8px;text-align:center}.ghost-link{display:none}\n  .hero-grid{grid-template-columns:1.25fr .75fr;gap:8px;margin-top:10px}.metric{min-height:94px;padding:13px}.metric-value{font-size:25px;margin-top:9px}.metric-label{font-size:8px}.metric-foot{font-size:9px}\n  .hero-grid .metric:nth-child(n+3){min-height:88px}.hero-grid .metric:nth-child(5){grid-column:1/-1}\n  .filter-panel{position:sticky;top:59px;z-index:18;margin-bottom:9px;padding:10px;background:rgba(13,17,23,.96);backdrop-filter:blur(16px)}.filters{width:100%;overflow-x:auto;flex-wrap:nowrap;padding-bottom:1px}.pill{white-space:nowrap}.toggle{white-space:nowrap}\n  .token-grid{gap:8px}.token-card{padding:12px;border-radius:13px}.coin-img,.coin-placeholder{width:39px;height:39px}.coin-name{font-size:12px}.score b{font-size:18px}\n  .mini-stats{grid-template-columns:repeat(2,1fr)}.mini{padding:7px}.spark{height:34px}\n  .study-hero{padding:18px 3px}.study-hero h1{font-size:27px}.study-hero p{font-size:12px}.compare-grid{gap:8px}.compare-card{padding:14px}\n  .table-wrap{margin:0 -1px}.table-wrap table{min-width:850px}\n  .settings-card,.explain-card{padding:14px}.action-row{position:sticky;bottom:78px;background:linear-gradient(180deg,transparent,#0d1117 26%);padding-top:18px}.action-row button{flex:1}\n  #toast{left:14px;right:14px;bottom:calc(80px + env(safe-area-inset-bottom));text-align:center}\n}\n", "/app.js": "let currentFilter = 'all';\nlet onlyFast = false;\nlet configLoaded = false;\nconst $ = s => document.querySelector(s);\nconst $$ = s => [...document.querySelectorAll(s)];\nconst fmt = (x,d=1) => Number.isFinite(Number(x)) ? Number(x).toFixed(d) : '—';\nconst age = s => s < 60 ? `${s}s` : s < 3600 ? `${Math.floor(s/60)}m ${s%60}s` : `${Math.floor(s/3600)}h`;\nconst short = s => s ? `${s.slice(0,4)}…${s.slice(-4)}` : '—';\nconst esc = s => String(s ?? '').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#39;'}[m]));\nfunction toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1800)}\nfunction setStatus(el, state, msg){const x=$(el);x.className=`status-chip ${state}`;x.title=msg||'';x.querySelector('span').textContent=state==='online'?(el==='#pumpStatus'?'Pump direct':'On-chain RPC'):(state==='error'?'Feed error':'Connecting')}\nfunction sparkline(snaps){if(!snaps||snaps.length<2)return '<svg class=\"spark\"></svg>';const vals=snaps.map(x=>x.p),min=Math.min(...vals),max=Math.max(...vals),range=max-min||1;const pts=vals.map((v,i)=>`${(i/(vals.length-1)*100).toFixed(1)},${(37-(v-min)/range*32).toFixed(1)}`).join(' ');return `<svg class=\"spark\" viewBox=\"0 0 100 40\" preserveAspectRatio=\"none\"><polyline points=\"${pts}\"/></svg>`}\nfunction tokenCard(t){\n  const fast = t.velocity10 >= 5;\n  const klass = t.status==='ARMED'?' armed':(t.status==='STUDY'||t.status==='GRADUATED'?' study':'');\n  const image = t.image ? `<img class=\"coin-img\" src=\"${esc(t.image)}\" onerror=\"this.outerHTML='<div class=coin-placeholder>${esc((t.symbol||'?')[0])}</div>'\">` : `<div class=\"coin-placeholder\">${esc((t.symbol||'?')[0])}</div>`;\n  const social = [t.twitter?'X':'',t.telegram?'TG':'',t.website?'WEB':''].filter(Boolean).join(' · ') || 'no socials';\n  const accClass=t.acceleration10>0?'positive':t.acceleration10<0?'negative':'';\n  const vClass=t.velocity10>0?'positive':t.velocity10<0?'negative':'';\n  const study = t.study?.reachedEntry ? `${t.study.hit100?'✓ 100%':'· 100%'} ${t.study.hit200?'✓ 200%':'· 200%'} ${t.study.graduated?'✓ GRAD':'· GRAD'}` : '';\n  return `<article class=\"token-card${klass}\" data-status=\"${t.status}\" data-fast=\"${fast}\">\n    <div class=\"card-top\">${image}<div style=\"min-width:0\"><div class=\"coin-name\">${esc(t.name)} <span style=\"color:#6f7d8b\">$${esc(t.symbol)}</span></div><div class=\"coin-sub\"><span>${age(t.ageSec)}</span><span>${short(t.mint)}</span>${t.mayhem?'<span>⚡MAYHEM</span>':''}</div></div><div class=\"score\"><b>${t.score}</b><small>SCORE</small></div></div>\n    <div class=\"status-line\"><span class=\"tag ${t.status}\">${t.status}</span><span class=\"progress-num\">${fmt(t.progress,1)}%</span></div>\n    <div class=\"progressbar\"><i style=\"width:${Math.max(0,Math.min(100,t.progress))}%\"></i></div>\n    <div class=\"mini-stats\"><div class=\"mini\"><span>V10</span><b class=\"${vClass}\">${t.velocity10>=0?'+':''}${fmt(t.velocity10,1)}</b></div><div class=\"mini\"><span>ACCEL</span><b class=\"${accClass}\">${t.acceleration10>=0?'+':''}${fmt(t.acceleration10,1)}</b></div><div class=\"mini\"><span>MC SOL</span><b>${fmt(t.marketCapSol,1)}</b></div><div class=\"mini\"><span>REAL SOL</span><b>${fmt(t.realSol,1)}</b></div></div>\n    ${sparkline(t.snapshots)}\n    <div class=\"card-bottom\"><div class=\"socials\">${study||social}</div><a class=\"open\" target=\"_blank\" href=\"https://pump.fun/coin/${encodeURIComponent(t.mint)}\">OPEN PUMP ↗</a></div>\n  </article>`\n}\nfunction renderTokens(tokens){\n  let xs=tokens;\n  if(currentFilter==='armed') xs=xs.filter(t=>t.status==='ARMED');\n  if(currentFilter==='study') xs=xs.filter(t=>t.study?.reachedEntry);\n  if(currentFilter==='hot') xs=xs.filter(t=>t.status==='HOT');\n  if(onlyFast) xs=xs.filter(t=>t.velocity10>=5);\n  $('#tokenGrid').innerHTML=xs.length?xs.map(tokenCard).join(''):'<div class=\"empty\">No coins match this filter right now.</div>';\n}\nfunction renderStats(s){\n  $('#mEntries').textContent=s.sampleAll; $('#mP100').textContent=`${s.p100All}%`; $('#mP100n').textContent=`${s.hit100All} / ${s.sampleAll}`; $('#mP200').textContent=`${s.p200All}%`; $('#mP200n').textContent=`${s.hit200All} / ${s.sampleAll}`; $('#mPGrad').textContent=`${s.pGradAll}%`; $('#mPGradn').textContent=`${s.gradAll} / ${s.sampleAll}`;\n  $('#fastSamples').textContent=s.sampleFast; $('#all100').textContent=`${s.p100All}%`;$('#all200').textContent=`${s.p200All}%`;$('#allGrad').textContent=`${s.pGradAll}%`;$('#fast100').textContent=`${s.p100Fast}%`;$('#fast200').textContent=`${s.p200Fast}%`;$('#fastGrad').textContent=`${s.pGradFast}%`;\n  $('#studyRows').innerHTML=(s.recent||[]).map(r=>`<tr><td>${esc(r.name)} <span style=\"color:#667584\">$${esc(r.symbol)}</span></td><td>${fmt(r.timeToEntrySec,1)}s</td><td class=\"${r.velocity10AtEntry>0?'positive':''}\">${fmt(r.velocity10AtEntry,1)}</td><td class=\"${r.acceleration10AtEntry>0?'positive':r.acceleration10AtEntry<0?'negative':''}\">${fmt(r.acceleration10AtEntry,1)}</td><td>${fmt(r.marketCapSolAtEntry,1)} SOL</td><td class=\"${r.maxReturnPct>=0?'positive':'negative'}\">${r.maxReturnPct==null?'—':fmt(r.maxReturnPct,1)+'%'}</td><td class=\"${r.hit100?'yes':'no'}\">${r.hit100?'YES':'—'}</td><td class=\"${r.hit200?'yes':'no'}\">${r.hit200?'YES':'—'}</td><td class=\"${r.graduated?'yes':'no'}\">${r.graduated?'YES':'—'}</td></tr>`).join('') || '<tr><td colspan=\"9\" style=\"text-align:center;color:#596776;padding:35px\">No 50% entries yet.</td></tr>';\n}\nasync function refresh(){\n  try{\n    const [sr,tr,st]=await Promise.all([fetch('/api/status'),fetch('/api/tokens'),fetch('/api/stats')]); const status=await sr.json(),tokens=await tr.json(),stats=await st.json();\n    setStatus('#pumpStatus',status.pump,status.pumpMessage);setStatus('#rpcStatus',status.rpc,status.rpcMessage);$('#mTracked').textContent=status.tracked||0;renderTokens(tokens);renderStats(stats);\n    if(!configLoaded){const c=status.config||{};$('#cfgEntry').value=c.entryProgressPct??50;$('#cfgFastTime').value=c.fastTimeToEntrySec??120;$('#cfgFastV').value=c.fastVelocity10PctPoints??5;$('#cfgHot').value=c.hotScoreThreshold??65;$('#cfgPoll').value=c.chainPollIntervalMs??2000;$('#cfgLimit').value=c.activeTrackLimit??120;$('#cfgRpc').value=c.solanaRpcUrl||'';configLoaded=true}\n  }catch(e){setStatus('#pumpStatus','error',e.message)}\n}\n$$('.tab').forEach(b=>b.onclick=()=>{$$('.tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');$$('.view').forEach(x=>x.classList.remove('active'));$(`#view-${b.dataset.tab}`).classList.add('active')});\n$$('.pill').forEach(b=>b.onclick=()=>{$$('.pill').forEach(x=>x.classList.remove('active'));b.classList.add('active');currentFilter=b.dataset.filter;refresh()});\n$('#onlyFast').onchange=e=>{onlyFast=e.target.checked;refresh()};\n$('#saveCfg').onclick=async()=>{const body={entryProgressPct:+$('#cfgEntry').value,fastTimeToEntrySec:+$('#cfgFastTime').value,fastVelocity10PctPoints:+$('#cfgFastV').value,hotScoreThreshold:+$('#cfgHot').value,chainPollIntervalMs:+$('#cfgPoll').value,activeTrackLimit:+$('#cfgLimit').value,solanaRpcUrl:$('#cfgRpc').value.trim()};const tok=$('#cfgToken').value.trim();if(tok)body.pumpBearerToken=tok;const r=await fetch('/api/config',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});if(r.ok)toast('Settings saved locally');else toast('Could not save settings')};\n$('#resetStudy').onclick=async()=>{if(!confirm('Delete all collected study results?'))return;await fetch('/api/reset-study',{method:'POST'});toast('Study data reset');refresh()};\nsetInterval(()=>$('#clock').textContent=new Date().toLocaleTimeString(),1000);setInterval(refresh,2000);refresh();\n\nif('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));}\n", "/manifest.webmanifest": "{\n  \"name\": \"Pump Velocity Lab\",\n  \"short_name\": \"PumpVelocity\",\n  \"description\": \"Live Pump.fun bonding-curve momentum study terminal\",\n  \"start_url\": \"/\",\n  \"scope\": \"/\",\n  \"display\": \"standalone\",\n  \"background_color\": \"#070a0e\",\n  \"theme_color\": \"#070a0e\",\n  \"orientation\": \"portrait-primary\",\n  \"icons\": [\n    {\"src\":\"/icon.svg\",\"sizes\":\"any\",\"type\":\"image/svg+xml\",\"purpose\":\"any maskable\"}\n  ]\n}\n", "/sw.js": "const CACHE='pump-velocity-shell-v1';\nconst ASSETS=['/','/styles.css','/app.js','/manifest.webmanifest','/icon.svg'];\nself.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));\nself.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));\nself.addEventListener('fetch',e=>{\n  if(e.request.method!=='GET') return;\n  const u=new URL(e.request.url);\n  if(u.pathname.startsWith('/api/')) return;\n  e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request)));\n});\n", "/icon.svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\">\n<defs><linearGradient id=\"g\" x1=\"0\" x2=\"1\" y1=\"0\" y2=\"1\"><stop stop-color=\"#66f6ad\"/><stop offset=\"1\" stop-color=\"#25b77a\"/></linearGradient></defs>\n<rect width=\"512\" height=\"512\" rx=\"120\" fill=\"#080c11\"/><rect x=\"54\" y=\"54\" width=\"404\" height=\"404\" rx=\"104\" fill=\"#0e151c\" stroke=\"#26343f\" stroke-width=\"10\"/><path d=\"M154 364V148h119c80 0 128 38 128 105 0 68-49 108-131 108h-48v3h-68zm68-66h49c42 0 63-14 63-44 0-29-21-42-63-42h-49v86z\" fill=\"url(#g)\"/><circle cx=\"394\" cy=\"118\" r=\"24\" fill=\"#66f6ad\"/><circle cx=\"394\" cy=\"118\" r=\"42\" fill=\"none\" stroke=\"#66f6ad\" stroke-opacity=\".2\" stroke-width=\"12\"/></svg>\n"};
const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(ROOT, 'data');
const CONFIG_PATH = path.join(DATA_DIR, 'config.json');
const STUDY_PATH = path.join(DATA_DIR, 'study.json');
const EVENTS_PATH = path.join(DATA_DIR, 'events.jsonl');

const DEFAULT_CONFIG = {
  port: 4173,
  pumpBaseUrl: 'https://frontend-api-v3.pump.fun',
  solanaRpcUrl: 'https://api.mainnet-beta.solana.com',
  discoveryIntervalMs: 3000,
  chainPollIntervalMs: 2000,
  activeTrackLimit: 120,
  entryProgressPct: 50,
  fastTimeToEntrySec: 120,
  fastVelocity10PctPoints: 5,
  hotScoreThreshold: 65,
  retireAfterMinutes: 30,
  pumpBearerToken: ''
};

const DEFAULT_GLOBAL = {
  initialVirtualTokenReserves: 1073000000000000n,
  initialVirtualSolReserves: 30000000000n,
  initialRealTokenReserves: 793100000000000n,
  tokenTotalSupply: 1000000000000000n,
  source: 'official-default'
};
const PUMP_GLOBAL_ACCOUNT = '4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf';

fs.mkdirSync(DATA_DIR, { recursive: true });

let config = { ...DEFAULT_CONFIG, ...loadJson(CONFIG_PATH, {}) };
if (process.env.SOLANA_RPC_URL) config.solanaRpcUrl = process.env.SOLANA_RPC_URL;
if (process.env.PUMP_BEARER_TOKEN) config.pumpBearerToken = process.env.PUMP_BEARER_TOKEN;
if (process.env.PORT) config.port = Number(process.env.PORT);
let study = loadJson(STUDY_PATH, { version: 1, records: {}, startedAt: Date.now() });
let tokens = new Map();
let globalCurve = { ...DEFAULT_GLOBAL };
let status = {
  startedAt: Date.now(),
  pump: 'starting',
  rpc: 'starting',
  pumpMessage: '',
  rpcMessage: '',
  latestDiscoveryAt: null,
  latestChainAt: null,
  discovered: 0,
  tracked: 0,
  globalConfigSource: globalCurve.source
};
let discoveryBusy = false;
let chainBusy = false;
let persistTimer = null;

function loadJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}
function saveStudySoon() {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    fs.writeFileSync(STUDY_PATH, JSON.stringify(study, null, 2));
  }, 500);
}
function logEvent(type, payload = {}) {
  fs.appendFile(EVENTS_PATH, JSON.stringify({ ts: Date.now(), type, ...payload }) + '\n', () => {});
}
function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
function n(v, fallback = 0) { const x = Number(v); return Number.isFinite(x) ? x : fallback; }
function ts(v) {
  const x = n(v, Date.now());
  return x < 1e12 ? x * 1000 : x;
}
function readU64LE(buf, offset) {
  if (!buf || buf.length < offset + 8) return 0n;
  return buf.readBigUInt64LE(offset);
}
function decodeGlobal(base64) {
  const b = Buffer.from(base64, 'base64');
  // Anchor discriminator: 0..7; initialized bool: 8; authority: 9..40; fee recipient: 41..72
  if (b.length < 105) throw new Error('Global account too short');
  return {
    initialVirtualTokenReserves: readU64LE(b, 73),
    initialVirtualSolReserves: readU64LE(b, 81),
    initialRealTokenReserves: readU64LE(b, 89),
    tokenTotalSupply: readU64LE(b, 97),
    source: 'on-chain-global'
  };
}
function decodeCurve(base64) {
  const b = Buffer.from(base64, 'base64');
  // Anchor discriminator then five u64 fields + bool.
  if (b.length < 49) throw new Error('Bonding curve account too short');
  return {
    virtualTokenReserves: readU64LE(b, 8),
    virtualSolReserves: readU64LE(b, 16),
    realTokenReserves: readU64LE(b, 24),
    realSolReserves: readU64LE(b, 32),
    tokenTotalSupply: readU64LE(b, 40),
    complete: b[48] === 1
  };
}
function progressPct(curve) {
  if (curve.complete) return 100;
  const initial = Number(globalCurve.initialRealTokenReserves);
  const current = Number(curve.realTokenReserves);
  if (!initial || current < 0) return 0;
  return clamp((1 - current / initial) * 100, 0, 100);
}
function priceSol(curve) {
  const vSol = Number(curve.virtualSolReserves) / 1e9;
  const vTok = Number(curve.virtualTokenReserves) / 1e6;
  return vTok > 0 ? vSol / vTok : 0;
}
function marketCapSol(curve) {
  const supply = Number(curve.tokenTotalSupply || globalCurve.tokenTotalSupply) / 1e6;
  return priceSol(curve) * supply;
}
function nearestSnapshot(snaps, targetTs) {
  let best = null;
  for (const s of snaps) {
    if (s.t <= targetTs && (!best || s.t > best.t)) best = s;
  }
  return best;
}
function velocity(snaps, seconds) {
  if (snaps.length < 2) return 0;
  const now = snaps[snaps.length - 1];
  const old = nearestSnapshot(snaps, now.t - seconds * 1000) || snaps[0];
  const dt = (now.t - old.t) / 1000;
  return dt > 0 ? ((now.p - old.p) / dt) * seconds : 0; // pct-points per window
}
function acceleration10(snaps) {
  if (snaps.length < 3) return 0;
  const now = snaps[snaps.length - 1];
  const s10 = nearestSnapshot(snaps, now.t - 10000);
  const s20 = nearestSnapshot(snaps, now.t - 20000);
  if (!s10 || !s20 || now.t === s10.t || s10.t === s20.t) return 0;
  const recent = (now.p - s10.p) / ((now.t - s10.t) / 1000) * 10;
  const prior = (s10.p - s20.p) / ((s10.t - s20.t) / 1000) * 10;
  return recent - prior;
}
function scoreToken(t) {
  const p = t.progress || 0;
  const v10 = t.velocity10 || 0;
  const accel = t.acceleration10 || 0;
  const age = Math.max(1, (Date.now() - t.createdAt) / 1000);
  const speedToNow = p / age * 60;
  let score = 0;
  score += clamp(p / 50 * 24, 0, 24);
  score += clamp(v10 / Math.max(1, config.fastVelocity10PctPoints) * 24, 0, 28);
  score += clamp((accel + 5) / 10 * 14, 0, 14);
  score += clamp(speedToNow / 30 * 20, 0, 20);
  if (t.twitter) score += 4;
  if (t.telegram) score += 5;
  if (t.website) score += 3;
  if (t.complete) score += 2;
  return Math.round(clamp(score, 0, 100));
}

async function rpc(method, params) {
  const r = await fetch(config.solanaRpcUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })
  });
  if (!r.ok) throw new Error(`RPC HTTP ${r.status}`);
  const j = await r.json();
  if (j.error) throw new Error(j.error.message || JSON.stringify(j.error));
  return j.result;
}
async function refreshGlobal() {
  try {
    const res = await rpc('getAccountInfo', [PUMP_GLOBAL_ACCOUNT, { encoding: 'base64', commitment: 'processed' }]);
    if (res?.value?.data?.[0]) {
      const parsed = decodeGlobal(res.value.data[0]);
      if (parsed.initialRealTokenReserves > 0n) globalCurve = parsed;
      status.globalConfigSource = globalCurve.source;
    }
  } catch (e) {
    status.globalConfigSource = 'official-default (RPC global read failed)';
  }
}
function pumpHeaders() {
  const h = { 'accept': 'application/json', 'user-agent': 'Mozilla/5.0 PumpVelocityLab/1.0' };
  if (config.pumpBearerToken) h.authorization = `Bearer ${config.pumpBearerToken}`;
  return h;
}
async function pumpGet(urlPath) {
  const r = await fetch(config.pumpBaseUrl + urlPath, { headers: pumpHeaders() });
  if (!r.ok) throw new Error(`Pump API HTTP ${r.status}`);
  return r.json();
}
function normalizeCoin(x) {
  const c = x?.data && !x.mint ? x.data : x;
  if (!c || !c.mint) return null;
  return {
    mint: c.mint,
    name: c.name || 'Unknown',
    symbol: c.symbol || '???',
    image: c.image_uri || '',
    creator: c.creator || '',
    bondingCurve: c.bonding_curve || '',
    createdAt: ts(c.created_timestamp || Date.now()),
    marketCapApi: n(c.market_cap),
    usdMarketCap: n(c.usd_market_cap),
    completeApi: !!c.complete,
    twitter: c.twitter || '',
    telegram: c.telegram || '',
    website: c.website || '',
    replyCount: n(c.reply_count),
    mayhem: !!(c.is_mayhem_mode || c.mayhem_mode)
  };
}
function upsertCoin(c) {
  if (!c || !c.mint) return;
  const prev = tokens.get(c.mint);
  if (prev) Object.assign(prev, c);
  else {
    tokens.set(c.mint, {
      ...c,
      firstSeenAt: Date.now(),
      lastSeenAt: Date.now(),
      snapshots: [],
      progress: 0,
      velocity10: 0,
      velocity30: 0,
      acceleration10: 0,
      score: 0,
      status: 'NEW',
      complete: !!c.completeApi,
      marketCapSol: c.marketCapApi || 0,
      priceSol: 0
    });
    status.discovered++;
    logEvent('discovered', { mint: c.mint, symbol: c.symbol, createdAt: c.createdAt });
  }
}
async function discover() {
  if (discoveryBusy) return;
  discoveryBusy = true;
  try {
    let found = [];
    // Primary: newest list. This is an internal Pump.fun frontend endpoint and may change.
    const q = '/coins?offset=0&limit=50&sort=created_timestamp&order=DESC&includeNsfw=false';
    try {
      const data = await pumpGet(q);
      found = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
    } catch (e1) {
      // Fallback: latest single coin.
      const data = await pumpGet('/coins/latest');
      found = Array.isArray(data) ? data : [data];
    }
    for (const x of found) upsertCoin(normalizeCoin(x));
    status.pump = 'online';
    status.pumpMessage = `Pump direct feed OK • ${found.length} rows`;
    status.latestDiscoveryAt = Date.now();
  } catch (e) {
    status.pump = 'error';
    status.pumpMessage = `${e.message}. Pump frontend endpoints can require auth/change; add local bearer token in Settings if needed.`;
  } finally { discoveryBusy = false; }
}
function activeCoins() {
  const now = Date.now();
  const retireMs = n(config.retireAfterMinutes, 30) * 60_000;
  return [...tokens.values()]
    .filter(t => t.bondingCurve && (!t.complete || (now - (t.graduatedAt || now)) < 120000) && now - t.createdAt < retireMs)
    .sort((a,b) => b.createdAt - a.createdAt)
    .slice(0, n(config.activeTrackLimit, 120));
}
async function pollChain() {
  if (chainBusy) return;
  chainBusy = true;
  try {
    const arr = activeCoins();
    if (!arr.length) { status.tracked = 0; return; }
    const now = Date.now();
    for (let start = 0; start < arr.length; start += 100) {
      const batch = arr.slice(start, start + 100);
      const res = await rpc('getMultipleAccounts', [batch.map(t => t.bondingCurve), { encoding: 'base64', commitment: 'processed' }]);
      const vals = res?.value || [];
      vals.forEach((v, i) => {
        if (!v?.data?.[0]) return;
        const t = batch[i];
        try {
          const c = decodeCurve(v.data[0]);
          const p = progressPct(c);
          const px = priceSol(c);
          t.complete = c.complete;
          t.progress = p;
          t.priceSol = px;
          t.marketCapSol = marketCapSol(c);
          t.realSol = Number(c.realSolReserves) / 1e9;
          t.lastSeenAt = now;
          t.snapshots.push({ t: now, p, px, mc: t.marketCapSol });
          const cutoff = now - 5 * 60_000;
          t.snapshots = t.snapshots.filter(s => s.t >= cutoff).slice(-180);
          t.velocity10 = velocity(t.snapshots, 10);
          t.velocity30 = velocity(t.snapshots, 30);
          t.acceleration10 = acceleration10(t.snapshots);
          t.score = scoreToken(t);
          updateStudy(t);
          if (t.complete && !t.graduatedAt) {
            t.graduatedAt = now;
            logEvent('graduated', { mint: t.mint, symbol: t.symbol });
          }
          const entry = study.records[t.mint];
          if (entry?.entryAt) t.status = t.complete ? 'GRADUATED' : 'STUDY';
          else if (p >= config.entryProgressPct - 5 && t.velocity10 >= config.fastVelocity10PctPoints) t.status = 'ARMED';
          else if (t.score >= config.hotScoreThreshold) t.status = 'HOT';
          else t.status = p > 0 ? 'TRACKING' : 'NEW';
        } catch {}
      });
    }
    status.rpc = 'online';
    status.rpcMessage = `On-chain curve state OK • ${arr.length} tracked`;
    status.latestChainAt = now;
    status.tracked = arr.length;
  } catch (e) {
    status.rpc = 'error';
    status.rpcMessage = e.message;
  } finally { chainBusy = false; }
}
function updateStudy(t) {
  let r = study.records[t.mint];
  if (!r) {
    r = study.records[t.mint] = {
      mint: t.mint, name: t.name, symbol: t.symbol, creator: t.creator,
      createdAt: t.createdAt, firstSeenAt: t.firstSeenAt,
      reachedEntry: false, entryAt: null, entryProgress: null, entryPriceSol: null,
      timeToEntrySec: null, velocity10AtEntry: null, velocity30AtEntry: null, acceleration10AtEntry: null,
      scoreAtEntry: null, marketCapSolAtEntry: null, fastAtEntry: false,
      hit100: false, hit100At: null, hit200: false, hit200At: null,
      graduated: false, graduatedAt: null, maxReturnPct: null, maxDrawdownPct: null,
      lastProgress: 0, lastPriceSol: 0, lastUpdatedAt: Date.now()
    };
  }
  r.name = t.name; r.symbol = t.symbol; r.lastProgress = t.progress; r.lastPriceSol = t.priceSol; r.lastUpdatedAt = Date.now();
  const entryThreshold = n(config.entryProgressPct, 50);
  if (!r.reachedEntry && t.progress >= entryThreshold && t.priceSol > 0) {
    r.reachedEntry = true;
    r.entryAt = Date.now();
    r.entryProgress = t.progress;
    r.entryPriceSol = t.priceSol;
    r.timeToEntrySec = Math.max(0, (r.entryAt - t.createdAt) / 1000);
    r.velocity10AtEntry = t.velocity10;
    r.velocity30AtEntry = t.velocity30;
    r.acceleration10AtEntry = t.acceleration10;
    r.scoreAtEntry = t.score;
    r.marketCapSolAtEntry = t.marketCapSol;
    r.fastAtEntry = r.timeToEntrySec <= n(config.fastTimeToEntrySec, 120) && t.velocity10 >= n(config.fastVelocity10PctPoints, 5);
    logEvent('study_entry', { mint: t.mint, symbol: t.symbol, progress: t.progress, priceSol: t.priceSol, timeToEntrySec: r.timeToEntrySec, velocity10: t.velocity10 });
  }
  if (r.reachedEntry && r.entryPriceSol > 0 && t.priceSol > 0) {
    const ret = (t.priceSol / r.entryPriceSol - 1) * 100;
    r.maxReturnPct = r.maxReturnPct == null ? ret : Math.max(r.maxReturnPct, ret);
    r.maxDrawdownPct = r.maxDrawdownPct == null ? ret : Math.min(r.maxDrawdownPct, ret);
    if (!r.hit100 && ret >= 100) { r.hit100 = true; r.hit100At = Date.now(); logEvent('tp100', { mint: t.mint, symbol: t.symbol, returnPct: ret }); }
    if (!r.hit200 && ret >= 200) { r.hit200 = true; r.hit200At = Date.now(); logEvent('tp200', { mint: t.mint, symbol: t.symbol, returnPct: ret }); }
  }
  if (t.complete && !r.graduated) { r.graduated = true; r.graduatedAt = Date.now(); }
  saveStudySoon();
}
function publicToken(t) {
  const snaps = t.snapshots.slice(-30).map(s => ({ t: s.t, p: +s.p.toFixed(3), px: s.px }));
  const r = study.records[t.mint];
  return {
    mint: t.mint, name: t.name, symbol: t.symbol, image: t.image, creator: t.creator,
    createdAt: t.createdAt, ageSec: Math.max(0, Math.round((Date.now()-t.createdAt)/1000)),
    progress: +n(t.progress).toFixed(2), velocity10: +n(t.velocity10).toFixed(2), velocity30: +n(t.velocity30).toFixed(2),
    acceleration10: +n(t.acceleration10).toFixed(2), score: t.score || 0, status: t.status,
    complete: !!t.complete, marketCapSol: +n(t.marketCapSol).toFixed(2), usdMarketCap: t.usdMarketCap || 0,
    realSol: +n(t.realSol).toFixed(3), priceSol: t.priceSol || 0, replyCount: t.replyCount || 0,
    twitter: !!t.twitter, telegram: !!t.telegram, website: !!t.website, mayhem: !!t.mayhem,
    study: r ? { reachedEntry: r.reachedEntry, fastAtEntry: r.fastAtEntry, hit100: r.hit100, hit200: r.hit200, graduated: r.graduated, maxReturnPct: r.maxReturnPct } : null,
    snapshots: snaps
  };
}
function summaryStats() {
  const rs = Object.values(study.records);
  const entries = rs.filter(r => r.reachedEntry);
  const fast = entries.filter(r => r.fastAtEntry);
  const pct = (a,b) => b ? +(a/b*100).toFixed(1) : 0;
  return {
    sampleAll: entries.length,
    sampleFast: fast.length,
    hit100All: entries.filter(r=>r.hit100).length,
    hit200All: entries.filter(r=>r.hit200).length,
    gradAll: entries.filter(r=>r.graduated).length,
    hit100Fast: fast.filter(r=>r.hit100).length,
    hit200Fast: fast.filter(r=>r.hit200).length,
    gradFast: fast.filter(r=>r.graduated).length,
    p100All: pct(entries.filter(r=>r.hit100).length, entries.length),
    p200All: pct(entries.filter(r=>r.hit200).length, entries.length),
    pGradAll: pct(entries.filter(r=>r.graduated).length, entries.length),
    p100Fast: pct(fast.filter(r=>r.hit100).length, fast.length),
    p200Fast: pct(fast.filter(r=>r.hit200).length, fast.length),
    pGradFast: pct(fast.filter(r=>r.graduated).length, fast.length)
  };
}
function csvEscape(v) { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? '"'+s.replace(/"/g,'""')+'"' : s; }
function exportCsv() {
  const cols = ['mint','name','symbol','createdAt','entryAt','entryProgress','entryPriceSol','timeToEntrySec','velocity10AtEntry','velocity30AtEntry','acceleration10AtEntry','scoreAtEntry','marketCapSolAtEntry','fastAtEntry','hit100','hit100At','hit200','hit200At','graduated','graduatedAt','maxReturnPct','maxDrawdownPct','lastProgress'];
  const rows = [cols.join(',')];
  for (const r of Object.values(study.records).filter(x=>x.reachedEntry)) rows.push(cols.map(c=>csvEscape(r[c])).join(','));
  return rows.join('\n');
}
function sendJson(res, obj, code=200) { const body=JSON.stringify(obj); res.writeHead(code, {'content-type':'application/json','cache-control':'no-store'}); res.end(body); }
function serveStatic(req, res, pathname) {
  const key = pathname === '/' ? '/index.html' : pathname;
  const body = EMBEDDED_ASSETS[key];
  if (body == null) return false;
  const ext = path.extname(key);
  const types = {
    '.html':'text/html; charset=utf-8',
    '.css':'text/css; charset=utf-8',
    '.js':'application/javascript; charset=utf-8',
    '.svg':'image/svg+xml',
    '.webmanifest':'application/manifest+json; charset=utf-8'
  };
  res.writeHead(200, {
    'content-type': types[ext] || 'application/octet-stream',
    'cache-control': key === '/sw.js' ? 'no-cache' : 'public, max-age=300'
  });
  res.end(body);
  return true;
}
async function readBody(req) { return new Promise((resolve,reject)=>{let d=''; req.on('data',c=>{d+=c;if(d.length>1e6)req.destroy();}); req.on('end',()=>{try{resolve(d?JSON.parse(d):{});}catch(e){reject(e);}});}); }

const server = http.createServer(async (req,res)=>{
  const u = new URL(req.url, 'http://localhost');
  try {
    if (u.pathname === '/api/status') return sendJson(res, { ...status, config: { ...config, pumpBearerToken: config.pumpBearerToken ? '••••••saved locally••••••' : '' }, global: { initialRealTokenReserves: globalCurve.initialRealTokenReserves.toString(), source: globalCurve.source } });
    if (u.pathname === '/api/tokens') {
      const list = [...tokens.values()].filter(t => Date.now()-t.createdAt < n(config.retireAfterMinutes,30)*60000).sort((a,b)=>b.score-a.score || b.createdAt-a.createdAt).slice(0,150).map(publicToken);
      return sendJson(res, list);
    }
    if (u.pathname === '/api/stats') return sendJson(res, { ...summaryStats(), recent: Object.values(study.records).filter(r=>r.reachedEntry).sort((a,b)=>(b.entryAt||0)-(a.entryAt||0)).slice(0,100) });
    if (u.pathname === '/api/export.csv') { const body=exportCsv(); res.writeHead(200, {'content-type':'text/csv; charset=utf-8','content-disposition':'attachment; filename="pumpfun-study.csv"'}); return res.end(body); }
    if (u.pathname === '/api/config' && req.method === 'POST') {
      const body = await readBody(req);
      const allowed = ['solanaRpcUrl','discoveryIntervalMs','chainPollIntervalMs','activeTrackLimit','entryProgressPct','fastTimeToEntrySec','fastVelocity10PctPoints','hotScoreThreshold','retireAfterMinutes','pumpBearerToken'];
      for (const k of allowed) if (Object.prototype.hasOwnProperty.call(body,k)) config[k]=body[k];
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(config,null,2));
      await refreshGlobal();
      return sendJson(res, {ok:true});
    }
    if (u.pathname === '/api/reset-study' && req.method === 'POST') {
      study = { version: 1, records: {}, startedAt: Date.now() }; fs.writeFileSync(STUDY_PATH, JSON.stringify(study,null,2)); logEvent('study_reset'); return sendJson(res,{ok:true});
    }
    if (serveStatic(req,res,u.pathname)) return;
    res.writeHead(404); res.end('Not found');
  } catch (e) { sendJson(res,{error:e.message},500); }
});

async function boot() {
  await refreshGlobal();
  discover();
  pollChain();
  setInterval(discover, Math.max(1500, n(config.discoveryIntervalMs,3000)));
  setInterval(pollChain, Math.max(1000, n(config.chainPollIntervalMs,2000)));
  const port = n(process.env.PORT || config.port, 4173);
  const host = process.env.HOST || '0.0.0.0';
  server.listen(port, host, ()=>{
    console.log(`\n  Pump Velocity Mobile is running`);
    console.log(`  http://${host}:${port}\n`);
  });
}
boot();
