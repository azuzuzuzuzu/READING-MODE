(function () {
    'use strict';

    const STORAGE_KEY = 'tm_reading_settings_md_icontext';

    function load() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
                dark: { enabled: true, opacity: 0.45 },
                eyeCare: { enabled: false, strength: 0.3 },
                focus: false,
                uiVisible: true,
                pos: { x: 30, y: 30 }
            };
        } catch {
            return {
                dark: { enabled: true, opacity: 0.45 },
                eyeCare: { enabled: false, strength: 0.3 },
                focus: false,
                uiVisible: true,
                pos: { x: 30, y: 30 }
            };
        }
    }
    function save(s) { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }

    let settings = load();

    /* ================================
       CSS
    ================================= */
    GM_addStyle(`
        #md-overlay-dark, #md-overlay-eyecare {
            position: fixed; inset: 0; pointer-events: none; z-index: 999997; transition: all 0.3s;
        }
        #md-overlay-dark { background: #000; }
        #md-overlay-eyecare { background: rgba(255,220,140,1); mix-blend-mode: multiply; }

        #md-panel {
            position: fixed;
            width: 180px; background: rgba(30,30,30,0.95);
            color: #fff; font-family: system-ui; font-size: 14px;
            border-radius: 14px; padding: 12px;
            box-shadow: 0 8px 20px rgba(0,0,0,0.35);
            z-index: 999999; transition: opacity 0.3s ease;
            opacity: 0; pointer-events: none;
            user-select: none;
        }
        #md-panel.show {
            opacity: 1; pointer-events: auto;
        }

        #md-panel h3 { margin: 6px 0; font-weight: 600; }
        #md-panel input[type="range"] { width: 100%; margin: 4px 0; }

        #md-panel button {
            width: 100%; padding: 8px; margin-top: 6px;
            border: none; border-radius: 8px; font-weight: bold;
            cursor: pointer; background: #555; color: #fff;
            display: flex; align-items: center; justify-content: space-between;
            transition: background 0.2s;
        }
        #md-panel button.off { background: #aaa; color: #222; }
        #md-panel button:hover { background: #777; }

        #md-toggle-ui {
            position: fixed;
            width: 36px; height: 36px;
            background: #555; color: #fff;
            border-radius: 50%; display: flex;
            justify-content: center; align-items: center;
            cursor: pointer; font-size: 18px;
            z-index: 1000000; transition: background 0.2s;
        }
        #md-toggle-ui:hover { background: #777; }

        /* Prevent text selection during drag */
        .md-no-select { user-select: none !important; }
    `);

    /* ================================
       Create overlays
    ================================= */
    const overlayDark = document.createElement('div'); overlayDark.id = 'md-overlay-dark';
    const overlayEye = document.createElement('div'); overlayEye.id = 'md-overlay-eyecare';
    document.body.appendChild(overlayDark);
    document.body.appendChild(overlayEye);

    /* ================================
       Toggle UI button
    ================================= */
    const toggleUI = document.createElement('div');
    toggleUI.id = 'md-toggle-ui';
    toggleUI.textContent = '≡';
    document.body.appendChild(toggleUI);

    /* ================================
       Panel
    ================================= */
    const panel = document.createElement('div'); panel.id = 'md-panel';
    panel.innerHTML = `
        <h3>Chế độ tối</h3>
        <input type="range" id="md-dark-range" min="0" max="0.9" step="0.05">
        <div id="md-dark-val"></div>
        <button id="md-dark-toggle"><span class="icon"></span><span class="text"></span></button>

        <h3>Bảo vệ mắt</h3>
        <input type="range" id="md-eye-range" min="0" max="1" step="0.05">
        <div id="md-eye-val"></div>
        <button id="md-eye-toggle"><span class="icon"></span><span class="text"></span></button>

        <h3>Chế độ Tập trung</h3>
        <button id="md-focus-toggle"><span class="icon"></span><span class="text"></span></button>
    `;
    document.body.appendChild(panel);

    /* ================================
       Element references
    ================================= */
    const darkRange = panel.querySelector('#md-dark-range');
    const darkVal = panel.querySelector('#md-dark-val');
    const darkBtn = panel.querySelector('#md-dark-toggle');
    const eyeRange = panel.querySelector('#md-eye-range');
    const eyeVal = panel.querySelector('#md-eye-val');
    const eyeBtn = panel.querySelector('#md-eye-toggle');
    const focusBtn = panel.querySelector('#md-focus-toggle');

    /* ================================
       Update UI states
    ================================= */
    function update() {
        overlayDark.style.display = settings.dark.enabled ? 'block' : 'none';
        overlayDark.style.opacity = settings.dark.opacity;
        darkRange.value = settings.dark.opacity;
        darkVal.textContent = Math.round(settings.dark.opacity * 100) + '%';
        darkBtn.querySelector('.icon').textContent = settings.dark.enabled ? '🌙' : '☀️';
        darkBtn.querySelector('.text').textContent = settings.dark.enabled ? 'Bật' : 'Tắt';
        darkBtn.className = settings.dark.enabled ? '' : 'off';

        overlayEye.style.display = settings.eyeCare.enabled ? 'block' : 'none';
        overlayEye.style.opacity = settings.eyeCare.strength;
        eyeRange.value = settings.eyeCare.strength;
        eyeVal.textContent = Math.round(settings.eyeCare.strength * 100) + '%';
        eyeBtn.querySelector('.icon').textContent = settings.eyeCare.enabled ? '🌕' : '🌑';
        eyeBtn.querySelector('.text').textContent = settings.eyeCare.enabled ? 'Bật' : 'Tắt';
        eyeBtn.className = settings.eyeCare.enabled ? '' : 'off';

        focusBtn.querySelector('.icon').textContent = settings.focus ? '🧘' : '🚫';
        focusBtn.querySelector('.text').textContent = settings.focus ? 'Bật' : 'Tắt';
        focusBtn.className = settings.focus ? '' : 'off';
        applyFocus();

        panel.style.left = settings.pos.x + 'px';
        panel.style.top = settings.pos.y + 'px';

        panel.classList.toggle('show', settings.uiVisible);
    }

    /* ================================
       Focus Mode
    ================================= */
    function applyFocus() {
        if (settings.focus) {
            document.querySelectorAll('header, footer, nav, aside, [class*="sidebar"], [class*="ads"]').forEach(e => {
                e.style.display = 'none';
            });
        } else {
            document.querySelectorAll('header, footer, nav, aside, [class*="sidebar"], [class*="ads"]').forEach(e => {
                e.style.display = '';
            });
        }
    }

    /* ================================
       DRAG TO MOVE PANEL
    ================================= */
    let dragging = false;
    let offsetX = 0, offsetY = 0;

    panel.addEventListener('mousedown', e => {
        dragging = true;
        offsetX = e.clientX - panel.getBoundingClientRect().left;
        offsetY = e.clientY - panel.getBoundingClientRect().top;
        panel.classList.add('md-no-select');
    });

    document.addEventListener('mousemove', e => {
        if (!dragging) return;
        settings.pos.x = e.clientX - offsetX;
        settings.pos.y = e.clientY - offsetY;
        save(settings);
        update();
    });

    document.addEventListener('mouseup', () => {
        dragging = false;
        panel.classList.remove('md-no-select');
    });

    /* ================================
       Events
    ================================= */
    toggleUI.onclick = () => {
        settings.uiVisible = !settings.uiVisible;
        save(settings);
        update();
    };

    darkRange.oninput = () => {
        settings.dark.opacity = parseFloat(darkRange.value);
        settings.dark.enabled = true;
        save(settings);
        update();
    };
    darkBtn.onclick = () => {
        settings.dark.enabled = !settings.dark.enabled;
        save(settings);
        update();
    };

    eyeRange.oninput = () => {
        settings.eyeCare.strength = parseFloat(eyeRange.value);
        settings.eyeCare.enabled = true;
        save(settings);
        update();
    };
    eyeBtn.onclick = () => {
        settings.eyeCare.enabled = !settings.eyeCare.enabled;
        save(settings);
        update();
    };

    focusBtn.onclick = () => {
        settings.focus = !settings.focus;
        save(settings);
        update();
    };

    /* ================================
       INIT
    ================================= */
    update();

})();
