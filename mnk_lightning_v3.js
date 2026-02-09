// MnkLightning v3 - Browser-Based Human Typer
// Merges logic from Python script and JS injector into a single userscript/console script.

(function () {
    console.log("%c MnkLightning v3 Active ", "background: #222; color: #00ff00; font-size: 16px");

    // === CONFIGURATION ===
    const CONFIG = {
        min_wpm: 100,
        max_wpm: 140,
        // Key Hold Time (Seconds)
        min_key_hold: 0.01,
        max_key_hold: 0.04,

        // Imperfection Rates (0.0 to 1.0)
        wrong_char_rate: 0.005, // reduced for stability
        adjacent_key_rate: 0.005,
        double_letter_rate: 0.001,
        skip_letter_rate: 0.001,

        hesitation_rate: 0.02,
        burst_rate: 0.08,
        insane_burst_rate: 0.001,

        // Timing Multipliers
        hesitation_multiplier: 2.5,
        burst_speed_multiplier: 0.6,
        post_mistake_pause: 0.4,
        word_start_slowdown: 1.2,
    };

    // QWERTY Adjacency Map
    const ADJACENT_KEYS = {
        'a': 'qwsz', 'b': 'vghn', 'c': 'xdfv', 'd': 'serfcx', 'e': 'wsdr',
        'f': 'drtgvc', 'g': 'ftyhbv', 'h': 'gyujnb', 'i': 'ujko', 'j': 'huikmn',
        'k': 'jiolm', 'l': 'kop', 'm': 'njk', 'n': 'bhjm', 'o': 'iklp',
        'p': 'ol', 'q': 'wa', 'r': 'edft', 's': 'awedxz', 't': 'rfgy',
        'u': 'yhji', 'v': 'cfgb', 'w': 'qase', 'x': 'zsdc', 'y': 'tghu',
        'z': 'asx'
    };

    // Global State
    let isTyping = false;
    let abortTyping = false;

    // === HELPERS ===

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    const randomUniform = (min, max) => Math.random() * (max - min) + min;
    const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const randomChar = () => "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)];

    function getKeystrokeDelay(wpm, inBurst = false) {
        const cpm = wpm * 5;
        let baseDelay = 60 / cpm;

        if (inBurst) {
            baseDelay *= CONFIG.burst_speed_multiplier;
        }

        const variance = baseDelay * 0.20;
        const noise = randomUniform(-variance, variance);
        return Math.max(0.005, baseDelay + noise) * 1000;
    }

    function getAdjacentKey(char) {
        const charLower = char.toLowerCase();
        if (ADJACENT_KEYS[charLower]) {
            const adj = randomChoice(ADJACENT_KEYS[charLower]);
            return char === char.toUpperCase() ? adj.toUpperCase() : adj;
        }
        return char;
    }

    // === INPUT SIMULATION ===

    function dispatchKey(key, type) {
        let code;
        if (key === ' ') code = 'Space';
        else if (key === 'Backspace') code = 'Backspace';
        else if (key.length === 1 && /[a-zA-Z]/.test(key)) code = `Key${key.toUpperCase()}`;
        else code = key; // Fallback logic

        const event = new KeyboardEvent(type, {
            key: key,
            code: code,
            bubbles: true, // Important for React/Frameworks
            cancelable: true,
            view: window,
            which: key.charCodeAt(0), // Legacy support
            keyCode: key.charCodeAt(0) // Legacy
        });

        const target = document.activeElement || document.body;
        target.dispatchEvent(event);
    }

    async function typeChar(char) {
        dispatchKey(char, 'keydown');
        dispatchKey(char, 'keypress');

        const holdTime = randomUniform(CONFIG.min_key_hold, CONFIG.max_key_hold) * 1000;
        await sleep(holdTime);
        dispatchKey(char, 'keyup');
    }

    async function simulateBackspace(count = 1) {
        for (let i = 0; i < count; i++) {
            dispatchKey('Backspace', 'keydown');
            await sleep(randomUniform(CONFIG.min_key_hold, CONFIG.max_key_hold) * 1000);
            dispatchKey('Backspace', 'keyup');
            await sleep(randomUniform(50, 100));
        }
    }

    // === CORE LOGIC ===

    function getVisibleText() {
        // Try standard Monkeytype structure
        // <div class="word active"><letter>h</letter>...</div>
        const words = document.querySelectorAll('.word');
        if (words.length === 0) return null;

        let text = "";
        words.forEach((word) => {
            word.querySelectorAll('letter').forEach(letter => {
                text += letter.textContent;
            });
            text += " ";
        });
        return text.trim();
    }

    async function startTyping() {
        if (isTyping) return;

        const text = getVisibleText();
        if (!text) {
            console.error("MnkLightning: No text found! Are you in a test?");
            return;
        }

        isTyping = true;
        abortTyping = false;

        // Use user configured WPM range or default
        const wpm = randomInt(CONFIG.min_wpm, CONFIG.max_wpm);
        console.log(`MnkLightning: Starting... Target WPM: ${wpm}, Length: ${text.length}`);

        let idx = 0;
        let burstRemaining = 0;

        try {
            while (idx < text.length) {
                if (abortTyping) break;

                const char = text[idx];
                let delay = getKeystrokeDelay(wpm, burstRemaining > 0);

                if (burstRemaining > 0) burstRemaining--;

                // === IMPERFECTIONS (Ported Logic) ===

                if (Math.random() < CONFIG.hesitation_rate) {
                    delay *= CONFIG.hesitation_multiplier;
                }

                if (burstRemaining === 0 && Math.random() < CONFIG.burst_rate) {
                    burstRemaining = 5;
                }

                // Insane Burst
                if (Math.random() < CONFIG.insane_burst_rate) {
                    const burstLen = randomInt(4, 5);
                    for (let i = 0; i < burstLen; i++) {
                        if (idx >= text.length || abortTyping) break;
                        dispatchKey(text[idx], 'keydown');
                        dispatchKey(text[idx], 'keyup');
                        idx++;
                        await sleep(2);
                    }
                    continue;
                }

                // Mistakes
                if (Math.random() < CONFIG.wrong_char_rate && /[a-zA-Z0-9]/.test(char)) {
                    const wrong = randomChar();
                    await typeChar(wrong);
                    await sleep(delay * 2);
                    await simulateBackspace(1);
                    await sleep(delay);
                }

                await typeChar(char);
                idx++;

                if (char === ' ') {
                    delay *= CONFIG.word_start_slowdown;
                }

                await sleep(delay);
            }
        } catch (e) {
            console.error(e);
        }

        console.log("MnkLightning: Finished.");
        isTyping = false;
    }

    // === LISTENERS ===

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Insert') {
            e.preventDefault();
            if (isTyping) {
                console.log("MnkLightning: Already running!");
                return;
            }
            startTyping();
        }
        if (e.key === 'Escape') {
            // Abort if running
            abortTyping = true;
            if (isTyping) {
                console.log("MnkLightning: Aborting...");
                isTyping = false;
            }
        }
    });

})();
