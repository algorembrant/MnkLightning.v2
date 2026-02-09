(function () {
    console.log("%c Monkeytype Command Typer (Human-Like) ", "background: #222; color: #ff0000; font-size: 20px");

    const CONFIG = {
        minWPM: 310,              // Minimum expected WPM
        maxWPM: 550,              // Maximum expected WPM
        startDelay: 50,           // Delay before starting to type

        // === HUMAN IMPERFECTION RATES ===
        // Wrong character (random letter instead of correct one)
        wrongCharRate: 0.025,

        // Adjacent key typo (hit a nearby key on keyboard)
        adjacentKeyRate: 0.02,

        // Double/triple letter (accidentally press key multiple times)
        doubleLetterRate: 0.015,
        tripleLetterRate: 0.003,

        // Skip letter (finger moved too fast, missed a key)
        skipLetterRate: 0.01,

        // Transposed letters (swap two adjacent letters like "teh" instead of "the")
        transposeRate: 0.012,

        // Ctrl+Backspace (delete whole word when frustrated)
        ctrlBackspaceRate: 0.008,

        // Hesitation/thinking pause (longer pause before difficult letters)
        hesitationRate: 0.04,
        hesitationMultiplier: 3.5,  // How much longer the pause is

        // Burst typing (fast typing followed by slowdown)
        burstTypingRate: 0.08,
        burstSpeedMultiplier: 0.5,  // Faster during burst
        burstLength: 5,             // Characters in burst

        // Slow start to words (first letter of word typed slower)
        wordStartSlowdown: 1.8,

        // Fatigue simulation (gradually slow down over time)
        fatigueEnabled: true,
        fatigueRate: 0.0001,        // How much to slow down per character

        // Recovery pause after mistakes (humans pause after making errors)
        postMistakePauseMultiplier: 2.0,
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
    let burstCharsRemaining = 0;
    let totalCharsTyped = 0;
    let recentMistake = false;

    // Type a single character
    function typeChar(char) {
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
        target.dispatchEvent(new KeyboardEvent('keyup', keyConfig));

        totalCharsTyped++;
    }

    // Single backspace
    function typeBackspace() {
        const target = document.activeElement || document.body;
        const bsConfig = { key: 'Backspace', code: 'Backspace', bubbles: true, cancelable: true, view: window };
        target.dispatchEvent(new KeyboardEvent('keydown', bsConfig));
        document.execCommand('delete', false, null);
        target.dispatchEvent(new KeyboardEvent('keyup', bsConfig));
    }

    // Ctrl+Backspace to delete whole word
    function typeCtrlBackspace() {
        const target = document.activeElement || document.body;
        const ctrlBsConfig = {
            key: 'Backspace',
            code: 'Backspace',
            ctrlKey: true,
            bubbles: true,
            cancelable: true,
            view: window
        };

        target.dispatchEvent(new KeyboardEvent('keydown', ctrlBsConfig));

        // Delete characters until we hit a space or beginning
        const activeWord = document.querySelector('#words .word.active');
        if (activeWord) {
            const incorrectLetters = activeWord.querySelectorAll('letter.incorrect, letter.extra');
            incorrectLetters.forEach(() => {
                document.execCommand('delete', false, null);
            });
        }

        target.dispatchEvent(new KeyboardEvent('keyup', ctrlBsConfig));
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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

    // Calculate keystroke delay with fatigue and burst mode
    function getKeystrokeDelay() {
        const currentWPM = Math.floor(Math.random() * (CONFIG.maxWPM - CONFIG.minWPM + 1)) + CONFIG.minWPM;
        let baseDelay = 60000 / (currentWPM * 5);

        // Apply fatigue (gradually slow down)
        if (CONFIG.fatigueEnabled) {
            baseDelay *= (1 + totalCharsTyped * CONFIG.fatigueRate);
        }

        // Apply burst mode (faster typing)
        if (inBurstMode && burstCharsRemaining > 0) {
            baseDelay *= CONFIG.burstSpeedMultiplier;
            burstCharsRemaining--;
            if (burstCharsRemaining === 0) {
                inBurstMode = false;
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

    // Count how many incorrect letters we've typed in current word
    function getIncorrectCount() {
        const activeWord = document.querySelector('#words .word.active');
        if (!activeWord) return 0;
        return activeWord.querySelectorAll('letter.incorrect, letter.extra').length;
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
        typeChar(wrongChar);
        await sleep(getKeystrokeDelay() * 2.5);
        typeBackspace();
        await sleep(getKeystrokeDelay() * 1.5);
        recentMistake = true;
    }

    // Type adjacent key typo and correct it
    async function simulateAdjacentKeyTypo(correctChar) {
        const adjacentChar = getAdjacentKey(correctChar);
        if (adjacentChar !== correctChar) {
            typeChar(adjacentChar);
            await sleep(getKeystrokeDelay() * 2.2);
            typeBackspace();
            await sleep(getKeystrokeDelay() * 1.3);
            recentMistake = true;
        }
    }

    // Double or triple letter mistake
    async function simulateDoubleLetter(char, count = 2) {
        // Type the correct char first, then extra(s)
        for (let i = 1; i < count; i++) {
            typeChar(char);
            await sleep(getKeystrokeDelay() * 0.3); // Very fast double tap
        }
        // Pause to realize mistake
        await sleep(getKeystrokeDelay() * 2.0);
        // Delete the extras
        for (let i = 1; i < count; i++) {
            typeBackspace();
            await sleep(getKeystrokeDelay() * 0.5);
        }
        await sleep(getKeystrokeDelay() * 1.2);
        recentMistake = true;
    }

    // Skip a letter (will be detected as wrong, then backspace and fix)
    async function simulateSkipLetter() {
        // The letter gets skipped - we don't type it
        // The next letter will be typed in its place
        // This creates a natural error that gets corrected
        return true; // Signal that we should skip
    }

    // Transpose two letters (type in wrong order, then fix)
    async function simulateTranspose(char1, char2) {
        // Type second char first
        typeChar(char2);
        await sleep(getKeystrokeDelay() * 0.4);
        // Type first char second
        typeChar(char1);
        await sleep(getKeystrokeDelay() * 2.5);
        // Delete both
        typeBackspace();
        await sleep(getKeystrokeDelay() * 0.4);
        typeBackspace();
        await sleep(getKeystrokeDelay() * 1.5);
        recentMistake = true;
        // Return true so main loop knows we handled these chars
        return true;
    }

    // Use Ctrl+Backspace to clear word and retype
    async function simulateCtrlBackspace() {
        const incorrectCount = getIncorrectCount();
        if (incorrectCount > 2) {
            await sleep(getKeystrokeDelay() * 3); // Frustration pause
            typeCtrlBackspace();
            await sleep(getKeystrokeDelay() * 2);
            recentMistake = true;
            return true;
        }
        return false;
    }

    // Main typing loop with all human imperfections
    async function autoTypeLoop() {
        console.log("Starting human-like auto-type loop...");
        console.log("Active imperfections: wrong char, adjacent key, double/triple letter, skip, transpose, Ctrl+Backspace, hesitation, burst typing, fatigue");

        let wordCount = 0;
        let skipNext = false;

        while (true) {
            const currentWordText = getCurrentWordText();

            if (currentWordText === null) {
                console.log(`Auto-type complete! Typed ${wordCount} words, ${totalCharsTyped} characters.`);
                break;
            }

            // Check if we should use Ctrl+Backspace (when frustrated with errors)
            if (Math.random() < CONFIG.ctrlBackspaceRate) {
                const didCtrlBackspace = await simulateCtrlBackspace();
                if (didCtrlBackspace) continue;
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

                typeChar(' ');
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
                delay *= CONFIG.wordStartSlowdown;
            }

            // Random hesitation (thinking pause)
            if (Math.random() < CONFIG.hesitationRate) {
                delay *= CONFIG.hesitationMultiplier;
            }

            // Post-mistake recovery pause
            if (recentMistake) {
                delay *= CONFIG.postMistakePauseMultiplier;
                recentMistake = false;
            }

            // Trigger burst mode randomly
            if (!inBurstMode && Math.random() < CONFIG.burstTypingRate) {
                inBurstMode = true;
                burstCharsRemaining = CONFIG.burstLength;
            }

            // Skip letter imperfection (handled by typing next char instead, creating error)
            if (/[a-zA-Z]/.test(char) && Math.random() < CONFIG.skipLetterRate && nextChar) {
                // Skip this char - type next char instead (creates transposition-like error)
                typeChar(nextChar);
                await sleep(getKeystrokeDelay() * 2.5);
                typeBackspace();
                await sleep(getKeystrokeDelay() * 1.3);
                recentMistake = true;
                // Now type correct char
                typeChar(char);
                await sleep(delay);
                continue;
            }

            // Transpose letters
            if (/[a-zA-Z]/.test(char) && nextChar && /[a-zA-Z]/.test(nextChar) && Math.random() < CONFIG.transposeRate) {
                await simulateTranspose(char, nextChar);
                // Type both chars correctly now
                typeChar(char);
                await sleep(getKeystrokeDelay());
                typeChar(nextChar);
                await sleep(delay);
                // Skip the next character in main loop since we already typed it
                skipNext = true;
                continue;
            }

            // Triple letter (rarer)
            if (/[a-zA-Z]/.test(char) && Math.random() < CONFIG.tripleLetterRate) {
                typeChar(char); // Type the correct one first
                await simulateDoubleLetter(char, 3);
                await sleep(delay);
                continue;
            }

            // Double letter
            if (/[a-zA-Z]/.test(char) && Math.random() < CONFIG.doubleLetterRate) {
                typeChar(char); // Type the correct one first
                await simulateDoubleLetter(char, 2);
                await sleep(delay);
                continue;
            }

            // Adjacent key typo
            if (/[a-zA-Z]/.test(char) && Math.random() < CONFIG.adjacentKeyRate) {
                await simulateAdjacentKeyTypo(char);
            }

            // Wrong character
            if (/[a-zA-Z]/.test(char) && Math.random() < CONFIG.wrongCharRate) {
                await simulateWrongChar(char);
            }

            // Type the correct character
            typeChar(char);
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

                console.log("Trigger detected. Starting Human-Like Command Typer...");
                console.log("Config:", CONFIG);
                setTimeout(() => {
                    autoTypeLoop();
                }, CONFIG.startDelay);
            }
        }
    };

    window.addEventListener('keydown', triggerHandler);
    console.log("READY! Type the first letter to activate Human-Like Mode.");
    console.log("Imperfections enabled: wrong char, adjacent key typo, double/triple letter, skip, transpose, Ctrl+Backspace, hesitation, burst typing, fatigue, word-start slowdown");
})();
