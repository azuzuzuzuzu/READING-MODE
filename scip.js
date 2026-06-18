(function () {
    'use strict';

    // Chỉ chạy ở frame trên cùng — tránh nạp UI lần nữa trong iframe
    // (vd: trang có khung quảng cáo, video nhúng, comment nhúng...)
    if (window.top !== window.self) return;

    /* ═══════════════════════════════════════════
       CẤU HÌNH PHÍM TẮT — chỉnh ở đây
       ───────────────────────────────────────────
       Dùng giá trị event.key (phân biệt hoa/thường
       sẽ được bỏ qua, chỉ cần ghi 1 ký tự).
       Ví dụ: 's', 'arrowdown', ' ' (phím cách), 'p'...
       Đặt '' để tắt một phím tắt.
    ═══════════════════════════════════════════ */
    const KEYS = {
        toggleScroll: '`',   // bật/tắt auto-scroll
        speedUp:      ']',   // tăng tốc độ
        speedDown:    '['    // giảm tốc độ
    };

    const STORAGE_KEY = 'tm_reading_v3';
    const SCROLL_MIN = 10, SCROLL_MAX = 600, SCROLL_STEP = 20;

    const DEFAULTS = {
        dark:    { on: true,  val: 0.45 },
        eye:     { on: false, val: 0.30 },
        focus:   false,
        scroll:  { on: false, speed: 60 },
        uiOpen:  true,
        pos:     { x: 20, y: 20 }
    };

    function load() {
        try {
            const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
            const s = Object.assign({}, DEFAULTS, raw);
            s.dark   = Object.assign({}, DEFAULTS.dark,   s.dark);
            s.eye    = Object.assign({}, DEFAULTS.eye,    s.eye);
            s.scroll = Object.assign({}, DEFAULTS.scroll, s.scroll);
            s.pos    = Object.assign({}, DEFAULTS.pos,    s.pos);
            return s;
        } catch { return JSON.parse(JSON.stringify(DEFAULTS)); }
    }
    function save() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(S)); } catch {} }

    let S = load();

    GM_addStyle(`
        #rm-dark, #rm-eye {
            position: fixed; inset: 0;
            pointer-events: none; z-index: 999990;
            transition: opacity .25s;
        }
        #rm-dark { background: #000; }
        #rm-eye  { background: rgb(255,200,80); mix-blend-mode: multiply; }

        #rm-fab {
            position: fixed; bottom: 20px; right: 20px;
            width: 36px; height: 36px; border-radius: 50%;
            background: linear-gradient(135deg,#2a2a2a,#444);
            color: #fff; font-size: 18px;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; box-shadow: 0 3px 10px rgba(0,0,0,.55);
            z-index: 1000001; user-select: none;
            transition: transform .15s, box-shadow .15s;
        }
        #rm-fab:hover { transform: scale(1.1); box-shadow: 0 5px 14px rgba(0,0,0,.65); }

        #rm-panel {
            position: fixed; width: 200px;
            background: #1a1a1e; border: 1px solid #333;
            border-radius: 12px; padding: 10px 10px 8px;
            font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
            font-size: 11.5px; color: #ddd;
            box-shadow: 0 8px 24px rgba(0,0,0,.6);
            z-index: 1000000; user-select: none; box-sizing: border-box;
            opacity: 0; pointer-events: none;
            transform: scale(.92) translateY(6px);
            transition: opacity .2s, transform .2s;
            transform-origin: top left;
        }
        #rm-panel.open { opacity: 1; pointer-events: auto; transform: scale(1) translateY(0); }

        #rm-handle {
            display: flex; align-items: center; justify-content: space-between;
            margin-bottom: 8px; cursor: grab;
            padding-bottom: 7px; border-bottom: 1px solid #2e2e2e;
        }
        #rm-handle:active { cursor: grabbing; }
        #rm-handle .rm-title {
            font-size: 11px; font-weight: 700; letter-spacing: .06em;
            text-transform: uppercase; color: #888;
        }
        #rm-handle .rm-close {
            font-size: 14px; color: #555; cursor: pointer;
            line-height: 1; padding: 0 2px; transition: color .15s;
        }
        #rm-handle .rm-close:hover { color: #aaa; }

        .rm-section { margin-bottom: 8px; }
        .rm-section:last-child { margin-bottom: 0; }
        .rm-row { display: flex; align-items: center; gap: 6px; margin-bottom: 5px; }
        .rm-label { flex: 1; font-size: 11.5px; color: #bbb; }

        .rm-pill {
            display: flex; border-radius: 20px; overflow: hidden;
            border: 1px solid #3a3a3a; flex-shrink: 0;
        }
        .rm-pill button {
            padding: 3px 7px; background: transparent; border: none;
            color: #666; font-size: 10px; font-weight: 600;
            cursor: pointer; transition: background .15s, color .15s; line-height: 1.4;
        }
        .rm-pill button.active-on  { background: #3a7bd5; color: #fff; }
        .rm-pill button.active-off { background: #3a3a3a; color: #aaa; }

        .rm-slider-row { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
        .rm-slider-row input[type=range] {
            flex: 1; height: 3px; -webkit-appearance: none; appearance: none;
            background: #333; border-radius: 2px; outline: none; cursor: pointer;
        }
        .rm-slider-row input[type=range]::-webkit-slider-thumb {
            -webkit-appearance: none; width: 12px; height: 12px;
            border-radius: 50%; background: #3a7bd5; border: 2px solid #1a1a1e; cursor: pointer;
        }
        .rm-pct { width: 28px; text-align: right; font-size: 10.5px; color: #666; flex-shrink: 0; }
        .rm-pct.wide { width: 48px; }

        .rm-focus-btn {
            width: 100%; padding: 5px 0; background: #252528;
            border: 1px solid #333; border-radius: 7px; color: #aaa;
            font-size: 11px; font-weight: 600; cursor: pointer; letter-spacing: .03em;
            transition: background .15s, color .15s, border-color .15s;
            display: flex; align-items: center; justify-content: center; gap: 5px;
        }
        .rm-focus-btn.on { background: #1e3a1e; border-color: #3a7a3a; color: #7fd47f; }
        .rm-focus-btn.scroll-on { background: #1e2e3a; border-color: #3a6a8a; color: #7fbfe0; }

        .rm-hint {
            font-size: 9.5px; color: #666; text-align: center; margin-top: 5px; line-height: 1.5;
        }
        .rm-hint kbd {
            background: #2e2e33; border: 1px solid #444; border-radius: 4px;
            padding: 0 4px; font-family: monospace; color: #bbb;
        }

        .rm-div { height: 1px; background: #2a2a2a; margin: 7px 0; }
        .rm-nosel { user-select: none !important; }
    `);

    const fab    = el('div', { id: 'rm-fab' }, '🌘');
    const ovDark = el('div', { id: 'rm-dark' });
    const ovEye  = el('div', { id: 'rm-eye'  });
    const panel  = el('div', { id: 'rm-panel' });

    let drag = false, dox = 0, doy = 0;

    function boot() {
        if (!document.body) { requestAnimationFrame(boot); return; }

        document.body.append(ovDark, ovEye, fab, panel);

        panel.innerHTML = `
            <div id="rm-handle">
                <span class="rm-title">⚡ Reading Mode</span>
                <span class="rm-close" id="rm-close-btn">✕</span>
            </div>

            <div class="rm-section">
                <div class="rm-row">
                    <span class="rm-label">🌙 Chế độ tối</span>
                    <div class="rm-pill">
                        <button id="rm-dark-on">BẬT</button>
                        <button id="rm-dark-off">TẮT</button>
                    </div>
                </div>
                <div class="rm-slider-row">
                    <input type="range" id="rm-dark-range" min="0" max="0.9" step="0.05">
                    <span class="rm-pct" id="rm-dark-pct"></span>
                </div>
            </div>

            <div class="rm-div"></div>

            <div class="rm-section">
                <div class="rm-row">
                    <span class="rm-label">🟡 Lọc ánh sáng</span>
                    <div class="rm-pill">
                        <button id="rm-eye-on">BẬT</button>
                        <button id="rm-eye-off">TẮT</button>
                    </div>
                </div>
                <div class="rm-slider-row">
                    <input type="range" id="rm-eye-range" min="0" max="1" step="0.05">
                    <span class="rm-pct" id="rm-eye-pct"></span>
                </div>
            </div>

            <div class="rm-div"></div>

            <div class="rm-section">
                <button class="rm-focus-btn" id="rm-scroll-btn">
                    <span id="rm-scroll-ico">⏸️</span>
                    <span id="rm-scroll-txt">Auto-scroll: TẮT</span>
                </button>
                <div class="rm-slider-row" style="margin-top:6px;">
                    <input type="range" id="rm-scroll-range" min="10" max="600" step="10">
                    <span class="rm-pct wide" id="rm-scroll-pct"></span>
                </div>
                <div class="rm-hint" id="rm-hint"></div>
            </div>

            <div class="rm-div"></div>

            <div class="rm-section">
                <button class="rm-focus-btn" id="rm-focus-btn">
                    <span id="rm-focus-ico">🚫</span>
                    <span id="rm-focus-txt">Tập trung: TẮT</span>
                </button>
            </div>
        `;

        wireUp();
        renderAll();
        setPos(S.pos.x, S.pos.y);
        ensureFocusObserver();
        renderHint();

        // Nếu state lưu là đang cuộn, khởi động lại vòng auto-scroll sau reload
        if (S.scroll.on) setScroll(true);
    }

    /* Hiển thị tên phím cho dễ đọc trong phần hint */
    function keyLabel(k) {
        if (!k) return '—';
        const map = {
            ' ': 'Space', 'arrowup': '↑', 'arrowdown': '↓',
            'arrowleft': '←', 'arrowright': '→',
            'enter': 'Enter', 'escape': 'Esc', 'tab': 'Tab'
        };
        const low = k.toLowerCase();
        if (map[low]) return map[low];
        return k.length === 1 ? k.toUpperCase() : k;
    }

    function renderHint() {
        const hint = document.getElementById('rm-hint');
        if (!hint) return;
        const parts = [];
        if (KEYS.toggleScroll) parts.push(`<kbd>${keyLabel(KEYS.toggleScroll)}</kbd> bật/tắt`);
        if (KEYS.speedDown)    parts.push(`<kbd>${keyLabel(KEYS.speedDown)}</kbd> chậm`);
        if (KEYS.speedUp)      parts.push(`<kbd>${keyLabel(KEYS.speedUp)}</kbd> nhanh`);
        hint.innerHTML = parts.join(' · ');
    }

    let darkRange, darkPct, darkOn, darkOff,
        eyeRange, eyePct, eyeOn, eyeOff,
        focusBtn, focusIco, focusTxt,
        scrollBtn, scrollIco, scrollTxt, scrollRange, scrollPct,
        handle, closeBtn;

    function wireUp() {
        const $ = id => document.getElementById(id);
        darkRange = $('rm-dark-range'); darkPct = $('rm-dark-pct');
        darkOn = $('rm-dark-on'); darkOff = $('rm-dark-off');
        eyeRange = $('rm-eye-range'); eyePct = $('rm-eye-pct');
        eyeOn = $('rm-eye-on'); eyeOff = $('rm-eye-off');
        focusBtn = $('rm-focus-btn'); focusIco = $('rm-focus-ico'); focusTxt = $('rm-focus-txt');
        scrollBtn = $('rm-scroll-btn'); scrollIco = $('rm-scroll-ico'); scrollTxt = $('rm-scroll-txt');
        scrollRange = $('rm-scroll-range'); scrollPct = $('rm-scroll-pct');
        handle = $('rm-handle'); closeBtn = $('rm-close-btn');

        fab.addEventListener('click', () => { S.uiOpen = !S.uiOpen; save(); renderPanel(); });
        closeBtn.addEventListener('click', e => { e.stopPropagation(); S.uiOpen = false; save(); renderPanel(); });

        darkOn.addEventListener('click',  () => { S.dark.on = true;  save(); renderDark(); });
        darkOff.addEventListener('click', () => { S.dark.on = false; save(); renderDark(); });
        darkRange.addEventListener('input', () => {
            S.dark.val = parseFloat(darkRange.value);
            ovDark.style.opacity = S.dark.on ? S.dark.val : 0;
            darkPct.textContent  = pct(S.dark.val);
            save();
        });

        eyeOn.addEventListener('click',  () => { S.eye.on = true;  save(); renderEye(); });
        eyeOff.addEventListener('click', () => { S.eye.on = false; save(); renderEye(); });
        eyeRange.addEventListener('input', () => {
            S.eye.val = parseFloat(eyeRange.value);
            ovEye.style.opacity = S.eye.on ? S.eye.val : 0;
            eyePct.textContent  = pct(S.eye.val);
            save();
        });

        focusBtn.addEventListener('click', () => { S.focus = !S.focus; save(); renderFocus(); });

        scrollBtn.addEventListener('click', () => setScroll(!S.scroll.on));
        scrollRange.addEventListener('input', () => {
            S.scroll.speed = clampSpeed(parseFloat(scrollRange.value));
            scrollPct.textContent = S.scroll.speed + ' px/s';
            save();
        });

        handle.addEventListener('mousedown', e => {
            if (e.target === closeBtn) return;
            drag = true; dox = e.clientX - S.pos.x; doy = e.clientY - S.pos.y;
            document.body.classList.add('rm-nosel'); e.preventDefault();
        });
        handle.addEventListener('touchstart', e => {
            if (e.target === closeBtn) return;
            drag = true; const t = e.touches[0];
            dox = t.clientX - S.pos.x; doy = t.clientY - S.pos.y; e.preventDefault();
        }, { passive: false });
    }

    function renderDark() {
        ovDark.style.opacity = S.dark.on ? S.dark.val : 0;
        darkRange.value = S.dark.val;
        darkPct.textContent = pct(S.dark.val);
        setActive(darkOn, darkOff, S.dark.on);
    }
    function renderEye() {
        ovEye.style.opacity = S.eye.on ? S.eye.val : 0;
        eyeRange.value = S.eye.val;
        eyePct.textContent = pct(S.eye.val);
        setActive(eyeOn, eyeOff, S.eye.on);
    }
    function renderFocus() {
        const on = S.focus;
        focusBtn.className = 'rm-focus-btn' + (on ? ' on' : '');
        focusIco.textContent = on ? '🧘' : '🚫';
        focusTxt.textContent = 'Tập trung: ' + (on ? 'BẬT' : 'TẮT');
        applyFocus(on);
    }
    function renderScroll() {
        const on = S.scroll.on;
        scrollBtn.className = 'rm-focus-btn' + (on ? ' scroll-on' : '');
        scrollIco.textContent = on ? '▶️' : '⏸️';
        scrollTxt.textContent = 'Auto-scroll: ' + (on ? 'BẬT' : 'TẮT');
        scrollRange.value = S.scroll.speed;
        scrollPct.textContent = S.scroll.speed + ' px/s';
    }
    function renderPanel() { panel.classList.toggle('open', S.uiOpen); }
    function renderAll() { renderDark(); renderEye(); renderFocus(); renderScroll(); renderPanel(); }

    function setActive(btnOn, btnOff, isOn) {
        btnOn.className  = isOn ? 'active-on'  : '';
        btnOff.className = isOn ? '' : 'active-off';
    }
    function pct(v) { return Math.round(v * 100) + '%'; }
    function clampSpeed(v) { return Math.max(SCROLL_MIN, Math.min(SCROLL_MAX, Math.round(v))); }

    function setPos(x, y) {
        const pw = panel.offsetWidth  || 200;
        const ph = panel.offsetHeight || 220;
        S.pos.x = Math.max(0, Math.min(x, window.innerWidth  - pw));
        S.pos.y = Math.max(0, Math.min(y, window.innerHeight - ph));
        panel.style.left = S.pos.x + 'px';
        panel.style.top  = S.pos.y + 'px';
    }

    const HIDE_SEL = 'header,footer,nav,aside,[class*="sidebar"],[class*="ads"],[id*="ads"],[class*="banner"]';
    function applyFocus(on) {
        document.querySelectorAll(HIDE_SEL).forEach(e => {
            if (panel && (e === panel || panel.contains(e) || e.contains(panel))) return;
            if (e === fab || e === ovDark || e === ovEye) return;
            e.style.setProperty('display', on ? 'none' : '', 'important');
        });
    }
    let focusObserver = null;
    function ensureFocusObserver() {
        if (focusObserver) return;
        focusObserver = new MutationObserver(() => { if (S.focus) applyFocus(true); });
        focusObserver.observe(document.documentElement, { childList: true, subtree: true });
    }

    let rafId = null, lastTs = 0, scrollRemainder = 0;

    function scrollStep(ts) {
        if (!S.scroll.on) { rafId = null; lastTs = 0; return; }
        if (!lastTs) lastTs = ts;
        const dt = Math.min((ts - lastTs) / 1000, 0.1);
        lastTs = ts;

        scrollRemainder += S.scroll.speed * dt;
        const px = Math.floor(scrollRemainder);
        if (px > 0) {
            scrollRemainder -= px;
            const before = window.scrollY;
            window.scrollBy(0, px);
            if (window.scrollY === before) { setScroll(false); return; }
        }
        rafId = requestAnimationFrame(scrollStep);
    }

    function setScroll(on) {
        S.scroll.on = on;
        save();
        renderScroll();
        if (on) {
            if (!rafId) { lastTs = 0; scrollRemainder = 0; rafId = requestAnimationFrame(scrollStep); }
        } else if (rafId) {
            cancelAnimationFrame(rafId); rafId = null; lastTs = 0;
        }
    }
    function bumpSpeed(delta) {
        S.scroll.speed = clampSpeed(S.scroll.speed + delta);
        save();
        renderScroll();
    }

    document.addEventListener('mousemove', e => {
        if (!drag) return;
        setPos(e.clientX - dox, e.clientY - doy);
        save();
    });
    document.addEventListener('mouseup', () => {
        drag = false;
        if (document.body) document.body.classList.remove('rm-nosel');
    });
    document.addEventListener('touchmove', e => {
        if (!drag) return;
        const t = e.touches[0];
        setPos(t.clientX - dox, t.clientY - doy);
        save();
        e.preventDefault();
    }, { passive: false });
    document.addEventListener('touchend', () => { drag = false; });

    function isTyping(t) {
        if (!t) return false;
        const tag = t.tagName;
        return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t.isContentEditable;
    }
    document.addEventListener('keydown', e => {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if (isTyping(e.target)) return;

        const k = e.key.toLowerCase();

        if (KEYS.toggleScroll && k === KEYS.toggleScroll.toLowerCase()) {
            e.preventDefault();
            setScroll(!S.scroll.on);
        } else if (KEYS.speedUp && k === KEYS.speedUp.toLowerCase()) {
            e.preventDefault();
            bumpSpeed(SCROLL_STEP);
        } else if (KEYS.speedDown && k === KEYS.speedDown.toLowerCase()) {
            e.preventDefault();
            bumpSpeed(-SCROLL_STEP);
        }
    });

    window.addEventListener('resize', () => setPos(S.pos.x, S.pos.y));

    function el(tag, attrs = {}, text = '') {
        const e = document.createElement(tag);
        Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
        if (text) e.textContent = text;
        return e;
    }

    boot();
})();
