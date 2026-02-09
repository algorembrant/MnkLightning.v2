(function () {
    console.log("%c Monkeytype Command Typer (Human-Like) v2 ", "background: #222; color: #00ff00; font-size: 20px");

    const CONFIG = {
        min_wpm: 300,
        max_wpm: 340,
        // Key Hold Time (Seconds)
        min_key_hold: 0.01,
        max_key_hold: 0.04,

        // Imperfection Rates (0.0 to 1.0)
        wrong_char_rate: 0.005,
        adjacent_key_rate: 0.005,
        double_letter_rate: 0.001,
        skip_letter_rate: 0.001,

        hesitation_rate: 0.02,
        burst_rate: 0.08,
        insane_burst_rate: 0.001,

        // Timing Multipliers
        hesitation_multiplier: 2.5,
        burst_speed_multiplier: 0.6,
        post_mistake_pause: 0.4, // Seconds
        word_start_slowdown: 1.2,
    };

    // QWERTY keyboard adjacency map for realistic typos
    const ADJACENT_KEYS = {
        'a': ['q', 'w', 's', 'z'],
        'b': ['v', 'g', 'h', 'n'],
        'c': ['x', 'd', 'f', 'v'],
        'd': ['s', 'e', 'r', 'f', 'c', 'x'],
        'e': ['w', 's', 'd', 'r'],
        'f': ['d', 'r', 't', 'g', 'v', 'c'],
        'g': ['f', 't', 'y', 'h', 'b', 'v'],
        'h': ['g', 'y', 'u', 'j', 'n', 'b'],
        'i': ['u', 'j', 'k', 'o'],
        'j': ['h', 'u', 'i', 'k', 'm', 'n'],
        'k': ['j', 'i', 'o', 'l', 'm'],
        'l': ['k', 'o', 'p'],
        'm': ['n', 'j', 'k'],
        'n': ['b', 'h', 'j', 'm'],
        'o': ['i', 'k', 'l', 'p'],
        'p': ['o', 'l'],
        'q': ['w', 'a'],
        'r': ['e', 'd', 'f', 't'],
        's': ['a', 'w', 'e', 'd', 'x', 'z'],
        't': ['r', 'f', 'g', 'y'],
        'u': ['y', 'h', 'j', 'i'],
        'v': ['c', 'f', 'g', 'b'],
        'w': ['q', 'a', 's', 'e'],
        'x': ['z', 's', 'd', 'c'],
        'y': ['t', 'g', 'h', 'u'],
        'z': ['a', 's', 'x'],
    };

    let isArmed = true;
    let inBurstMode = false;
    let inInsaneBurstMode = false;
    let burstCharsRemaining = 0;
    let totalCharsTyped = 0;
    let recentMistake = false;

    function randomRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Type a single character with key hold simulation
    async function typeChar(char) {
        const target = document.activeElement || document.body;
        const keyConfig = {
            key: char,
            code: char === ' ' ? 'Space' : `Key${char.toUpperCase()}`,
            bubbles: true,
            cancelable: true,
            view: window
        };

        target.dispatchEvent(new KeyboardEvent('keydown', keyConfig));
        target.dispatchEvent(new KeyboardEvent('keypress', keyConfig));
        document.execCommand('insertText', false, char);

        // Simulate key hold
        const holdTime = randomRange(CONFIG.min_key_hold, CONFIG.max_key_hold) * 1000;
        await sleep(holdTime);

        target.dispatchEvent(new KeyboardEvent('keyup', keyConfig));

        totalCharsTyped++;
    }

    // Single backspace with key hold simulation
    async function typeBackspace() {
        const target = document.activeElement || document.body;
        const bsConfig = { key: 'Backspace', code: 'Backspace', bubbles: true, cancelable: true, view: window };

        target.dispatchEvent(new KeyboardEvent('keydown', bsConfig));
        document.execCommand('delete', false, null);

        const holdTime = randomRange(CONFIG.min_key_hold, CONFIG.max_key_hold) * 1000;
        await sleep(holdTime);

        target.dispatchEvent(new KeyboardEvent('keyup', bsConfig));
    }

    // Get adjacent key for realistic typo
    function getAdjacentKey(char) {
        const lowerChar = char.toLowerCase();
        const adjacent = ADJACENT_KEYS[lowerChar];
        if (adjacent && adjacent.length > 0) {
            const randomAdj = adjacent[Math.floor(Math.random() * adjacent.length)];
            return char === char.toUpperCase() ? randomAdj.toUpperCase() : randomAdj;
        }
        return char; // Fallback to same char if no adjacent found
    }

    // Get random wrong character
    function getRandomChar() {
        const chars = "abcdefghijklmnopqrstuvwxyz";
        return chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Calculate keystroke delay
    function getKeystrokeDelay() {
        const currentWPM = Math.floor(Math.random() * (CONFIG.max_wpm - CONFIG.min_wpm + 1)) + CONFIG.min_wpm;
        let baseDelay = 60000 / (currentWPM * 5);

        // Apply burst mode (faster typing)
        if (inBurstMode && burstCharsRemaining > 0) {
            let multiplier = CONFIG.burst_speed_multiplier;
            if (inInsaneBurstMode) {
                multiplier *= 0.6; // Even faster for insane burst
            }
            baseDelay *= multiplier;

            burstCharsRemaining--;
            if (burstCharsRemaining === 0) {
                inBurstMode = false;
                inInsaneBurstMode = false;
            }
        }

        // Add variance
        const variance = baseDelay * 0.25;
        const noise = (Math.random() * variance * 2) - variance;

        return Math.max(8, baseDelay + noise);
    }

    // Get current word's remaining untyped text
    function getCurrentWordText() {
        const activeWord = document.querySelector('#words .word.active');
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

    // Check if we're at the start of a word
    function isWordStart() {
        const activeWord = document.querySelector('#words .word.active');
        if (!activeWord) return false;
        const typed = activeWord.querySelectorAll('letter.correct, letter.incorrect');
        return typed.length === 0;
    }

    // === MISTAKE SIMULATION FUNCTIONS ===

    // Type wrong character and correct it
    async function simulateWrongChar(correctChar) {
        const wrongChar = getRandomChar();
        await typeChar(wrongChar);
        await sleep(getKeystrokeDelay() * 2.5);
        await typeBackspace();
        await sleep(getKeystrokeDelay() * 1.5);
        recentMistake = true;
    }

    // Type adjacent key typo and correct it
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

    // Double letter mistake
    async function simulateDoubleLetter(char) {
        // Type the correct char first (assumed done by caller loop usually, but here we do it)
        // Actually, the main loop calls this INSTEAD of typing normally if it hits. 
        // But logic in main loop: if we match doubleLetterRate, we want to type char + char.

        await typeChar(char);
        await sleep(getKeystrokeDelay() * 0.3); // Very fast double tap
        await typeChar(char);

        // Pause to realize mistake
        await sleep(getKeystrokeDelay() * 2.0);
        // Delete the extra
        await typeBackspace();

        await sleep(getKeystrokeDelay() * 1.2);
        recentMistake = true;
    }

    // Main typing loop with human imperfections
    async function autoTypeLoop() {
        console.log("Starting human-like auto-type loop v2...");

        let wordCount = 0;

        while (true) {
            const currentWordText = getCurrentWordText();

            if (currentWordText === null) {
                console.log(`Auto-type complete! Typed ${wordCount} words, ${totalCharsTyped} characters.`);
                break;
            }

            if (currentWordText.length === 0) {
                const activeWord = document.querySelector('#words .word.active');
                const nextWord = activeWord ? activeWord.nextElementSibling : null;

                if (!nextWord || !nextWord.classList.contains('word')) {
                    await sleep(50);
                    const stillActive = document.querySelector('#words .word.active');
                    if (!stillActive) {
                        console.log(`Auto-type complete! Typed ${wordCount} words.`);
                        break;
                    }
                    continue;
                }

                await typeChar(' ');
                wordCount++;

                // Longer pause between words
                let delay = getKeystrokeDelay() * 1.4;
                await sleep(delay);
                continue;
            }

            const char = currentWordText[0];
            const nextChar = currentWordText.length > 1 ? currentWordText[1] : null;
            let delay = getKeystrokeDelay();

            // === APPLY HUMAN IMPERFECTIONS ===

            // Slow start to words
            if (isWordStart()) {
                delay *= CONFIG.word_start_slowdown;
            }

            // Random hesitation (thinking pause)
            if (Math.random() < CONFIG.hesitation_rate) {
                delay *= CONFIG.hesitation_multiplier;
            }

            // Post-mistake recovery pause
            if (recentMistake) {
                await sleep(CONFIG.post_mistake_pause * 1000); // Fixed pause in seconds
                recentMistake = false;
            }

            // Trigger burst mode
            // Insane Burst (Higher priority / check first or separate?)
            if (!inBurstMode && Math.random() < CONFIG.insane_burst_rate) {
                inBurstMode = true;
                inInsaneBurstMode = true;
                burstCharsRemaining = 12; // Longer burst
            } else if (!inBurstMode && Math.random() < CONFIG.burst_rate) {
                inBurstMode = true;
                burstCharsRemaining = 5;
            }

            // Skip letter imperfection
            if (/[a-zA-Z]/.test(char) && Math.random() < CONFIG.skip_letter_rate && nextChar) {
                // Type next char instead
                await typeChar(nextChar);
                await sleep(getKeystrokeDelay() * 2.5);
                await typeBackspace();
                await sleep(getKeystrokeDelay() * 1.3);
                recentMistake = true;
                // Now type correct char
                await typeChar(char);
                await sleep(delay);
                continue;
            }

            // Double letter
            if (/[a-zA-Z]/.test(char) && Math.random() < CONFIG.double_letter_rate) {
                await simulateDoubleLetter(char);
                await sleep(delay);
                continue;
            }

            // Adjacent key typo
            if (/[a-zA-Z]/.test(char) && Math.random() < CONFIG.adjacent_key_rate) {
                await simulateAdjacentKeyTypo(char);
                // After fixing, we still need to type the correct char, which is handled at end of loop?
                // Wait, simulateAdjacentKeyTypo fixes it but doesn't type the correct one? 
                // Let's check original logic.
                // Original: simulateAdjacentKeyTypo types wrong, deletes. Main loop falls through to type correct char.
            }

            // Wrong character
            if (/[a-zA-Z]/.test(char) && Math.random() < CONFIG.wrong_char_rate) {
                await simulateWrongChar(char);
                // Same pattern: types wrong, deletes. Main loop falls through.
            }

            // Type the correct character
            await typeChar(char);
            await sleep(delay);
        }
    }

    const triggerHandler = (e) => {
        if (!isArmed) return;

        if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
            const activeWord = document.querySelector('#words .word.active');
            if (!activeWord) return;

            const firstLetterElement = activeWord.querySelector('letter');
            const firstLetter = firstLetterElement ? firstLetterElement.textContent : null;

            if (firstLetter && e.key === firstLetter) {
                isArmed = false;
                window.removeEventListener('keydown', triggerHandler);

                console.log("Trigger detected. Starting Human-Like Command Typer v2...");
                console.log("Config:", CONFIG);

                // Start delay? Original had CONFIG.startDelay. New config doesn't have it.
                // We'll default to a small delay or 0.
                setTimeout(() => {
                    autoTypeLoop();
                }, 100);
            }
        }
    };

    window.addEventListener('keydown', triggerHandler);
    console.log("READY! Type the first letter to activate Human-Like Mode v2.");
})();
