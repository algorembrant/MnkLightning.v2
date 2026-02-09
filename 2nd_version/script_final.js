(function () {
    console.log("%c Monkeytype Command Typer (Human-Like/Anti-Detect) v4 ", "background: #222; color: #00ff00; font-size: 20px");

    // === CONFIGURATION ===
    // Lowered WPM to realistic human levels to avoid server-side flagging.
    const CONFIG = {
        min_wpm: 120, // Reduced from 300
        max_wpm: 160, // Reduced from 340
        // Key Hold Time (Seconds)
        min_key_hold: 0.02,
        max_key_hold: 0.05,

        // Imperfection Rates (0.0 to 1.0)
        wrong_char_rate: 0.015, // Slightly higher for realism
        adjacent_key_rate: 0.01,
        double_letter_rate: 0.005,
        skip_letter_rate: 0.002,

        hesitation_rate: 0.05, // More frequent small hesitations
        burst_rate: 0.1,
        insane_burst_rate: 0.005,

        // Timing Multipliers
        hesitation_multiplier: 2.0,
        burst_speed_multiplier: 0.7,
        post_mistake_pause: 0.5, // Seconds
        word_start_slowdown: 1.3,
    };

    // QWERTY Adjacency Map
    const ADJACENT_KEYS = {
        'a': ['q', 'w', 's', 'z'], 'b': ['v', 'g', 'h', 'n'], 'c': ['x', 'd', 'f', 'v'],
        'd': ['s', 'e', 'r', 'f', 'c', 'x'], 'e': ['w', 's', 'd', 'r'], 'f': ['d', 'r', 't', 'g', 'v', 'c'],
        'g': ['f', 't', 'y', 'h', 'b', 'v'], 'h': ['g', 'y', 'u', 'j', 'n', 'b'], 'i': ['u', 'j', 'k', 'o'],
        'j': ['h', 'u', 'i', 'k', 'm', 'n'], 'k': ['j', 'i', 'o', 'l', 'm'], 'l': ['k', 'o', 'p'],
        'm': ['n', 'j', 'k'], 'n': ['b', 'h', 'j', 'm'], 'o': ['i', 'k', 'l', 'p'], 'p': ['o', 'l'],
        'q': ['w', 'a'], 'r': ['e', 'd', 'f', 't'], 's': ['a', 'w', 'e', 'd', 'x', 'z'],
        't': ['r', 'f', 'g', 'y'], 'u': ['y', 'h', 'j', 'i'], 'v': ['c', 'f', 'g', 'b'],
        'w': ['q', 'a', 's', 'e'], 'x': ['z', 's', 'd', 'c'], 'y': ['t', 'g', 'h', 'u'],
        'z': ['a', 's', 'x'],
    };

    // Attempt to spoof isTrusted property (Best Effort, defensive)
    try {
        const originalDispatch = EventTarget.prototype.dispatchEvent;
        // This might fail in strict environments or recent browsers, but worth a try
        Object.defineProperty(KeyboardEvent.prototype, 'isTrusted', { get: () => true, configurable: true });
        Object.defineProperty(InputEvent.prototype, 'isTrusted', { get: () => true, configurable: true });
        Object.defineProperty(MouseEvent.prototype, 'isTrusted', { get: () => true, configurable: true });
    } catch (e) {
        // Silently fail if blocked
    }

    let isArmed = true;
    let inBurstMode = false;
    let inInsaneBurstMode = false;
    let burstCharsRemaining = 0;
    let totalCharsTyped = 0;
    let recentMistake = false;

    // Box-Muller transform for Gaussian distribution
    function randomNormal(mean, stdev) {
        let u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        num = num / 10.0 + 0.5; // Translate to 0 -> 1
        if (num > 1 || num < 0) return gaussianRandom(mean, stdev); // resample between 0 and 1
        // Simplified Logic:
        return mean + (Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)) * stdev;
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    const KEY_CODES = {
        ' ': 32, 'Enter': 13, 'Backspace': 8,
        'a': 65, 'b': 66, 'c': 67, 'd': 68, 'e': 69, 'f': 70, 'g': 71, 'h': 72, 'i': 73, 'j': 74, 'k': 75, 'l': 76, 'm': 77,
        'n': 78, 'o': 79, 'p': 80, 'q': 81, 'r': 82, 's': 83, 't': 84, 'u': 85, 'v': 86, 'w': 87, 'x': 88, 'y': 89, 'z': 90
    };

    function getKeyCode(char) {
        const lower = char.toLowerCase();
        return KEY_CODES[lower] || char.toUpperCase().charCodeAt(0);
    }

    // Type a single character with simulated events including legacy properties
    async function typeChar(char) {
        const target = document.activeElement || document.body;
        const keyCode = getKeyCode(char);
        const code = char === ' ' ? 'Space' : `Key${char.toUpperCase()}`;

        const keyConfig = {
            key: char,
            code: code,
            bubbles: true,
            cancelable: true,
            view: window,
            which: keyCode,
            keyCode: keyCode,
            charCode: char.charCodeAt(0),
            location: 0
        };

        // 1. Keydown
        const keyDownEvent = new KeyboardEvent('keydown', keyConfig);
        // Manually define legacy properties if constructor doesn't set them (browser dependent)
        Object.defineProperty(keyDownEvent, 'keyCode', { get: () => keyCode });
        Object.defineProperty(keyDownEvent, 'which', { get: () => keyCode });
        target.dispatchEvent(keyDownEvent);

        // 2. Keypress
        const keyPressEvent = new KeyboardEvent('keypress', keyConfig);
        Object.defineProperty(keyPressEvent, 'keyCode', { get: () => char.charCodeAt(0) }); // Keypress uses char code for printable
        Object.defineProperty(keyPressEvent, 'which', { get: () => char.charCodeAt(0) });
        target.dispatchEvent(keyPressEvent);

        // 3. Input / execCommand or Text Insertion
        // Using execCommand is sometimes safer if site blocks untrusted InputEvents
        // But let's try dispatching InputEvent first as it's cleaner
        const inputEvent = new InputEvent('input', {
            data: char,
            inputType: 'insertText',
            isComposing: false,
            bubbles: true,
            cancelable: true,
            view: window
        });
        target.dispatchEvent(inputEvent);

        // Simulate key hold (Gaussian)
        const meanHold = (CONFIG.min_key_hold + CONFIG.max_key_hold) / 2 * 1000;
        const stdevHold = (CONFIG.max_key_hold - CONFIG.min_key_hold) * 1000 / 6;
        const holdTime = Math.max(10, randomNormal(meanHold, stdevHold));
        await sleep(holdTime);

        // 4. Keyup
        const keyUpEvent = new KeyboardEvent('keyup', keyConfig);
        Object.defineProperty(keyUpEvent, 'keyCode', { get: () => keyCode });
        Object.defineProperty(keyUpEvent, 'which', { get: () => keyCode });
        target.dispatchEvent(keyUpEvent);

        totalCharsTyped++;
    }

    async function typeBackspace() {
        const target = document.activeElement || document.body;
        const keyCode = 8;
        const bsConfig = {
            key: 'Backspace',
            code: 'Backspace',
            bubbles: true,
            cancelable: true,
            view: window,
            which: keyCode,
            keyCode: keyCode
        };

        const down = new KeyboardEvent('keydown', bsConfig);
        Object.defineProperty(down, 'keyCode', { get: () => keyCode });
        Object.defineProperty(down, 'which', { get: () => keyCode });
        target.dispatchEvent(down);

        // Backspace Input Event
        const inputEvent = new InputEvent('input', {
            inputType: 'deleteContentBackward',
            bubbles: true,
            cancelable: true,
            view: window
        });
        target.dispatchEvent(inputEvent);

        const holdTime = randomNormal(30, 5); // Short hold for backspace
        await sleep(Math.max(10, holdTime));

        const up = new KeyboardEvent('keyup', bsConfig);
        Object.defineProperty(up, 'keyCode', { get: () => keyCode });
        Object.defineProperty(up, 'which', { get: () => keyCode });
        target.dispatchEvent(up);
    }

    function getAdjacentKey(char) {
        const lowerChar = char.toLowerCase();
        const adjacent = ADJACENT_KEYS[lowerChar];
        if (adjacent && adjacent.length > 0) {
            const randomAdj = adjacent[Math.floor(Math.random() * adjacent.length)];
            return char === char.toUpperCase() ? randomAdj.toUpperCase() : randomAdj;
        }
        return char;
    }

    function getRandomChar() {
        const chars = "abcdefghijklmnopqrstuvwxyz";
        return chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // New Gaussian Delay Calculation
    function getKeystrokeDelay() {
        // Calculate Target WPM for this keystroke (vary it per stroke slightly)
        const meanWPM = (CONFIG.min_wpm + CONFIG.max_wpm) / 2;
        // Use narrower range for consistency but still random
        const currentTargetWPM = randomNormal(meanWPM, (CONFIG.max_wpm - CONFIG.min_wpm) / 6);

        let baseDelay = 60000 / (Math.max(10, currentTargetWPM) * 5);

        // Burst Mode
        if (inBurstMode && burstCharsRemaining > 0) {
            let multiplier = CONFIG.burst_speed_multiplier;
            if (inInsaneBurstMode) multiplier *= 0.6;
            baseDelay *= multiplier;

            burstCharsRemaining--;
            if (burstCharsRemaining === 0) {
                inBurstMode = false;
                inInsaneBurstMode = false;
            }
        }

        // Add Gaussian Noise (Standard Deviation approx 15-18% of base delay)
        const delay = randomNormal(baseDelay, baseDelay * 0.18);
        return Math.max(10, delay);
    }

    function getCurrentWordText() {
        // Try multiple selectors for robustness
        const activeWord = document.querySelector('#words .word.active') || document.querySelector('.word.active');
        if (!activeWord) return null;

        const letters = activeWord.querySelectorAll('letter');
        let text = "";
        let foundUntyped = false;

        for (const letter of letters) {
            if (!letter.classList.contains('correct') && !letter.classList.contains('incorrect')) {
                foundUntyped = true;
            }
            if (foundUntyped) {
                text += letter.textContent;
            }
        }
        return text;
    }

    function isWordStart() {
        const activeWord = document.querySelector('#words .word.active');
        if (!activeWord) return false;
        const typed = activeWord.querySelectorAll('letter.correct, letter.incorrect');
        return typed.length === 0;
    }

    // === MISTAKE SIMULATION ===
    async function simulateWrongChar(correctChar) {
        const wrongChar = getRandomChar();
        await typeChar(wrongChar);
        await sleep(getKeystrokeDelay() * 2.5); // Pause to "realize" mistake
        await typeBackspace();
        await sleep(getKeystrokeDelay() * 1.5); // Recovery
        recentMistake = true;
    }

    async function simulateAdjacentKeyTypo(correctChar) {
        const adjacentChar = getAdjacentKey(correctChar);
        if (adjacentChar !== correctChar) {
            await typeChar(adjacentChar);
            await sleep(getKeystrokeDelay() * 2.2);
            await typeBackspace();
            await sleep(getKeystrokeDelay() * 1.3);
            recentMistake = true;
        }
    }

    async function simulateDoubleLetter(char) {
        await typeChar(char);
        await sleep(getKeystrokeDelay() * 0.3); // Fast double tap
        await typeChar(char);
        await sleep(getKeystrokeDelay() * 2.0);
        await typeBackspace();
        await sleep(getKeystrokeDelay() * 1.2);
        recentMistake = true;
    }

    async function autoTypeLoop() {
        console.log("Starting human-like auto-type loop v4...");
        let wordCount = 0;

        while (true) {
            const currentWordText = getCurrentWordText();

            if (currentWordText === null) {
                console.log(`Auto-type complete! Typed ${wordCount} words.`);
                break;
            }

            if (currentWordText.length === 0) {
                // Determine next word existence
                const activeWord = document.querySelector('#words .word.active');
                if (!activeWord) {
                    // Try waiting briefly, maybe DOM update lag
                    await sleep(50);
                    if (!document.querySelector('#words .word.active')) {
                        break;
                    }
                    continue;
                }
                const nextWord = activeWord.nextElementSibling;
                if (!nextWord || !nextWord.classList.contains('word')) {
                    // Check if there are words in a new line or block?
                    // If no next sibling, likely end of test or line break
                    // Monkeytype usually keeps all words in DOM or lazy loads
                    await sleep(100);
                    if (!document.querySelector('#words .word.active')) {
                        break;
                    }
                    // If still active word is empty and no next sibling, maybe just finished last word?
                    // Let's break to be safe
                    break;
                }

                await typeChar(' ');
                wordCount++;

                // Pause between words (Gaussian)
                const wordPauseBase = getKeystrokeDelay() * 1.4;
                const wordPause = Math.max(20, randomNormal(wordPauseBase, wordPauseBase * 0.3));
                await sleep(wordPause);
                continue;
            }

            const char = currentWordText[0];
            const nextChar = currentWordText.length > 1 ? currentWordText[1] : null;
            let delay = getKeystrokeDelay();

            if (isWordStart()) delay *= CONFIG.word_start_slowdown;
            if (Math.random() < CONFIG.hesitation_rate) delay *= CONFIG.hesitation_multiplier;
            if (recentMistake) {
                await sleep(CONFIG.post_mistake_pause * 1000);
                recentMistake = false;
            }

            // Burst Logic
            if (!inBurstMode && Math.random() < CONFIG.insane_burst_rate) {
                inBurstMode = true;
                inInsaneBurstMode = true;
                burstCharsRemaining = 12;
            } else if (!inBurstMode && Math.random() < CONFIG.burst_rate) {
                inBurstMode = true;
                burstCharsRemaining = 5;
            }

            // Imperfections
            if (/[a-zA-Z]/.test(char) && Math.random() < CONFIG.skip_letter_rate && nextChar) {
                await typeChar(nextChar);
                await sleep(getKeystrokeDelay() * 2.5);
                await typeBackspace();
                await sleep(getKeystrokeDelay() * 1.3);
                recentMistake = true;
                await typeChar(char);
                await sleep(delay);
                continue;
            }
            if (/[a-zA-Z]/.test(char) && Math.random() < CONFIG.double_letter_rate) {
                await simulateDoubleLetter(char);
                await sleep(delay);
                continue;
            }
            if (/[a-zA-Z]/.test(char) && Math.random() < CONFIG.adjacent_key_rate) {
                await simulateAdjacentKeyTypo(char);
                // After typo logic, we still need to type the correct char?
                // Logic: simulateAdjacentKeyTypo types wrong char then backspaces.
                // So now we fall through to type correct char.
            } else if (/[a-zA-Z]/.test(char) && Math.random() < CONFIG.wrong_char_rate) {
                await simulateWrongChar(char);
                // Fall through to type correct char
            }

            await typeChar(char);
            await sleep(delay);
        }
    }

    const triggerHandler = (e) => {
        if (!isArmed) return;
        // Trigger on single letter key press (no modifiers)
        if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
            const activeWord = document.querySelector('#words .word.active');
            if (activeWord) {
                const firstLetter = activeWord.querySelector('letter')?.textContent;
                if (firstLetter && e.key === firstLetter) {
                    isArmed = false;
                    window.removeEventListener('keydown', triggerHandler);
                    console.log("Trigger detected. Starting...");
                    // Small delay to let the first real keypress register naturally
                    setTimeout(autoTypeLoop, 150);
                }
            }
        }
    };

    window.addEventListener('keydown', triggerHandler);
    console.log("READY! Type the first letter to activate Human-Like Mode v4 (Low WPM).");
})();
