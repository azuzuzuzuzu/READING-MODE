//small update
(function () {
    'use strict';

    const STORAGE_KEY = 'tm_reading_v2';

    const DEFAULTS = {
        dark:    { on: true,  val: 0.45 },
        eye:     { on: false, val: 0.30 },
        focus:   false,
        uiOpen:  true,
        pos:     { x: 20, y: 20 }
    };

    function load() {
        try { return Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(STORAGE_KEY))); }
        catch { return { ...DEFAULTS }; }
    }
    function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(S)); }

    let S = load();

    /* ─────────────────────────────────────────
       STYLES
    ───────────────────────────────────────── */
    GM_addStyle(`
        #rm-dark, #rm-eye {
            position: fixed; inset: 0;
            pointer-events: none; z-index: 999990;
            transition: opacity .25s;
        }
        #rm-dark { background: #000; }
        #rm-eye  { background: rgb(255,200,80); mix-blend-mode: multiply; }

        /* FAB — cố định góc dưới phải, không phụ thuộc panel */
        #rm-fab {
            position: fixed;
            bottom: 20px; right: 20px;
            width: 36px; height: 36px;
            border-radius: 50%;
            background: linear-gradient(135deg,#2a2a2a,#444);
            color: #fff; font-size: 18px;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer;
            box-shadow: 0 3px 10px rgba(0,0,0,.55);
            z-index: 1000001;
            user-select: none;
            transition: transform .15s, box-shadow .15s;
        }
        #rm-fab:hover { transform: scale(1.1); box-shadow: 0 5px 14px rgba(0,0,0,.65); }

        /* PANEL */
        #rm-panel {
            position: fixed;
            width: 188px;
            background: #1a1a1e;
            border: 1px solid #333;
            border-radius: 12px;
            padding: 10px 10px 8px;
            font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
            font-size: 11.5px;
            color: #ddd;
            box-shadow: 0 8px 24px rgba(0,0,0,.6);
            z-index: 1000000;
            user-select: none;
            /* width is FIXED — slider won't shift the panel */
            box-sizing: border-box;

            opacity: 0;
            pointer-events: none;
            transform: scale(.92) translateY(6px);
            transition: opacity .2s, transform .2s;
            transform-origin: top left;
        }
        #rm-panel.open {
            opacity: 1;
            pointer-events: auto;
            transform: scale(1) translateY(0);
        }

        /* Drag handle */
        #rm-handle {
            display: flex; align-items: center; justify-content: space-between;
            margin-bottom: 8px;
            cursor: grab;
            padding-bottom: 7px;
            border-bottom: 1px solid #2e2e2e;
        }
        #rm-handle:active { cursor: grabbing; }
        #rm-handle .rm-title {
            font-size: 11px; font-weight: 700;
            letter-spacing: .06em; text-transform: uppercase;
            color: #888;
        }
        #rm-handle .rm-close {
            font-size: 14px; color: #555; cursor: pointer;
            line-height: 1; padding: 0 2px;
            transition: color .15s;
        }
        #rm-handle .rm-close:hover { color: #aaa; }

        /* Section */
        .rm-section { margin-bottom: 8px; }
        .rm-section:last-child { margin-bottom: 0; }

        .rm-row {
            display: flex; align-items: center; gap: 6px;
            margin-bottom: 5px;
        }
        .rm-label {
            flex: 1; font-size: 11.5px; color: #bbb;
        }

        /* Toggle pill */
        .rm-pill {
            display: flex; border-radius: 20px; overflow: hidden;
            border: 1px solid #3a3a3a; flex-shrink: 0;
        }
        .rm-pill button {
            padding: 3px 7px;
            background: transparent; border: none;
            color: #666; font-size: 10px; font-weight: 600;
            cursor: pointer; transition: background .15s, color .15s;
            line-height: 1.4;
        }
        .rm-pill button.active-on  { background: #3a7bd5; color: #fff; }
        .rm-pill button.active-off { background: #3a3a3a; color: #aaa; }

        /* Slider row */
        .rm-slider-row {
            display: flex; align-items: center; gap: 6px; margin-bottom: 4px;
        }
        .rm-slider-row input[type=range] {
            flex: 1; height: 3px;
            -webkit-appearance: none; appearance: none;
            background: #333; border-radius: 2px; outline: none;
            cursor: pointer;
        }
        .rm-slider-row input[type=range]::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 12px; height: 12px;
            border-radius: 50%; background: #3a7bd5;
            border: 2px solid #1a1a1e;
            cursor: pointer;
        }
        .rm-pct {
            width: 28px; text-align: right;
            font-size: 10.5px; color: #666;
            flex-shrink: 0;
        }

        /* Focus toggle */
        .rm-focus-btn {
            width: 100%; padding: 5px 0;
            background: #252528; border: 1px solid #333;
            border-radius: 7px; color: #aaa;
            font-size: 11px; font-weight: 600;
            cursor: pointer; letter-spacing: .03em;
            transition: background .15s, color .15s, border-color .15s;
            display: flex; align-items: center; justify-content: center; gap: 5px;
        }
        .rm-focus-btn.on {
            background: #1e3a1e; border-color: #3a7a3a; color: #7fd47f;
        }

        /* Divider */
        .rm-div { height: 1px; background: #2a2a2a; margin: 7px 0; }

        .rm-nosel { user-select: none !important; }
    `);

    /* ─────────────────────────────────────────
       DOM
    ───────────────────────────────────────── */
    // Overlays
    const ovDark = el('div', { id: 'rm-dark' });
    const ovEye  = el('div', { id: 'rm-eye'  });
    document.body.append(ovDark, ovEye);

    // FAB
    const fab = el('div', { id: 'rm-fab' }, '🌘');
    document.body.appendChild(fab);

    // Panel
    const panel = el('div', { id: 'rm-panel' });
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
            <button class="rm-focus-btn" id="rm-focus-btn">
                <span id="rm-focus-ico">🚫</span>
                <span id="rm-focus-txt">Tập trung: TẮT</span>
            </button>
        </div>
    `;
    document.body.appendChild(panel);

    /* ─────────────────────────────────────────
       SHORTCUTS TO ELEMENTS
    ───────────────────────────────────────── */
    const $ = id => document.getElementById(id);
    const darkRange = $('rm-dark-range');
    const darkPct   = $('rm-dark-pct');
    const darkOn    = $('rm-dark-on');
    const darkOff   = $('rm-dark-off');
    const eyeRange  = $('rm-eye-range');
    const eyePct    = $('rm-eye-pct');
    const eyeOn     = $('rm-eye-on');
    const eyeOff    = $('rm-eye-off');
    const focusBtn  = $('rm-focus-btn');
    const focusIco  = $('rm-focus-ico');
    const focusTxt  = $('rm-focus-txt');
    const handle    = $('rm-handle');
    const closeBtn  = $('rm-close-btn');

    /* ─────────────────────────────────────────
       RENDER — chỉ cập nhật từng phần, KHÔNG
       đụng vào panel.style.left/top ở đây
    ───────────────────────────────────────── */
    function renderDark() {
        ovDark.style.opacity = S.dark.on ? S.dark.val : 0;
        ovDark.style.pointerEvents = 'none';
        darkRange.value = S.dark.val;
        darkPct.textContent = pct(S.dark.val);
        setActive(darkOn, darkOff, S.dark.on);
    }
    function renderEye() {
        ovEye.style.opacity = S.eye.on ? S.eye.val : 0;
        ovEye.style.pointerEvents = 'none';
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
    function renderPanel() {
        panel.classList.toggle('open', S.uiOpen);
        // vị trí chỉ set một lần khi cần (drag)
    }
    function renderAll() {
        renderDark();
        renderEye();
        renderFocus();
        renderPanel();
    }

    function setActive(btnOn, btnOff, isOn) {
        btnOn.className  = isOn ? 'active-on'  : '';
        btnOff.className = isOn ? '' : 'active-off';
    }
    function pct(v) { return Math.round(v * 100) + '%'; }

    /* position — chỉ đặt khi drag hoặc init */
    function setPos(x, y) {
        // clamp trong viewport
        const pw = panel.offsetWidth  || 188;
        const ph = panel.offsetHeight || 200;
        S.pos.x = Math.max(0, Math.min(x, window.innerWidth  - pw));
        S.pos.y = Math.max(0, Math.min(y, window.innerHeight - ph));
        panel.style.left = S.pos.x + 'px';
        panel.style.top  = S.pos.y + 'px';
        // FAB cố định góc dưới phải — không cần cập nhật
    }
    // Init position
    setPos(S.pos.x, S.pos.y);

    /* ─────────────────────────────────────────
       FOCUS MODE
    ───────────────────────────────────────── */
    const HIDE_SEL = 'header,footer,nav,aside,[class*="sidebar"],[class*="ads"],[id*="ads"],[class*="banner"]';
    function applyFocus(on) {
        document.querySelectorAll(HIDE_SEL).forEach(e => {
            e.style.setProperty('display', on ? 'none' : '', 'important');
        });
    }

    /* ─────────────────────────────────────────
       EVENTS
    ───────────────────────────────────────── */
    // FAB toggle
    fab.addEventListener('click', () => {
        S.uiOpen = !S.uiOpen;
        save();
        renderPanel();
    });

    // Close btn inside panel
    closeBtn.addEventListener('click', e => {
        e.stopPropagation();
        S.uiOpen = false;
        save();
        renderPanel();
    });

    // Dark
    darkOn.addEventListener('click',  () => { S.dark.on = true;  save(); renderDark(); });
    darkOff.addEventListener('click', () => { S.dark.on = false; save(); renderDark(); });
    darkRange.addEventListener('input', () => {
        S.dark.val = parseFloat(darkRange.value);
        // Chỉ cập nhật overlay + nhãn, KHÔNG gọi setPos
        ovDark.style.opacity = S.dark.on ? S.dark.val : 0;
        darkPct.textContent  = pct(S.dark.val);
        save();
    });

    // Eye
    eyeOn.addEventListener('click',  () => { S.eye.on = true;  save(); renderEye(); });
    eyeOff.addEventListener('click', () => { S.eye.on = false; save(); renderEye(); });
    eyeRange.addEventListener('input', () => {
        S.eye.val = parseFloat(eyeRange.value);
        ovEye.style.opacity = S.eye.on ? S.eye.val : 0;
        eyePct.textContent  = pct(S.eye.val);
        save();
    });

    // Focus
    focusBtn.addEventListener('click', () => {
        S.focus = !S.focus;
        save();
        renderFocus();
    });

    /* ─────────────────────────────────────────
       DRAG (handle only, không dính slider)
    ───────────────────────────────────────── */
    let drag = false, dox = 0, doy = 0;

    handle.addEventListener('mousedown', e => {
        if (e.target === closeBtn) return;
        drag = true;
        dox = e.clientX - S.pos.x;
        doy = e.clientY - S.pos.y;
        document.body.classList.add('rm-nosel');
        e.preventDefault();
    });
    document.addEventListener('mousemove', e => {
        if (!drag) return;
        setPos(e.clientX - dox, e.clientY - doy);
        save();
    });
    document.addEventListener('mouseup', () => {
        drag = false;
        document.body.classList.remove('rm-nosel');
    });

    // Touch drag
    handle.addEventListener('touchstart', e => {
        if (e.target === closeBtn) return;
        drag = true;
        const t = e.touches[0];
        dox = t.clientX - S.pos.x;
        doy = t.clientY - S.pos.y;
        e.preventDefault();
    }, { passive: false });
    document.addEventListener('touchmove', e => {
        if (!drag) return;
        const t = e.touches[0];
        setPos(t.clientX - dox, t.clientY - doy);
        save();
        e.preventDefault();
    }, { passive: false });
    document.addEventListener('touchend', () => { drag = false; });

    /* ─────────────────────────────────────────
       INIT
    ───────────────────────────────────────── */
    renderAll();

    /* ─────────────────────────────────────────
       UTIL
    ───────────────────────────────────────── */
    function el(tag, attrs = {}, text = '') {
        const e = document.createElement(tag);
        Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
        if (text) e.textContent = text;
        return e;
    }
})();
