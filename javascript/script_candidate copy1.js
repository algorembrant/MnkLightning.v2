(function () {
    console.log("%c Monkeytype Command Typer (execCommand) ", "background: #222; color: #ff0000; font-size: 20px");

    const CONFIG = {
        minWPM: 310,      // Minimum expected WPM
        maxWPM: 550,      // Maximum expected WPM
        errorRate: 0.05,  // 15% chance to make a mistake
        accuracy: 95,     // Target accuracy (affects error correction)
        startDelay: 50,   // Delay before starting to type
    };

    let isArmed = true;

    // EXECCOMMAND METHOD
    // This often bypasses "isTrusted" checks because it simulates a browser action (paste/insert)
    // rather than a raw key event.
    function typeChar(char) {
        const target = document.activeElement || document.body;
        const keyConfig = {
            key: char,
            code: char === ' ' ? 'Space' : `Key${char.toUpperCase()}`,
            bubbles: true,
            cancelable: true,
            view: window
        };

        // Dispatch keydown
        target.dispatchEvent(new KeyboardEvent('keydown', keyConfig));

        // Dispatch keypress (typical for character input)
        target.dispatchEvent(new KeyboardEvent('keypress', keyConfig));

        // We use insertText which is a powerful way to simulate user input
        document.execCommand('insertText', false, char);

        // Dispatch input event (execCommand usually triggers this, but to be safe)
        // target.dispatchEvent(new InputEvent('input', { data: char, inputType: 'insertText', bubbles: true }));

        // Dispatch keyup
        target.dispatchEvent(new KeyboardEvent('keyup', keyConfig));
    }

    // Helper to sleep for a random duration
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Calculate dynamic delay based on WPM
    // Standard word length is 5 chars. WPM = (Chars / 5) / (Time_min)
    // Time_char_ms = (60000 / (WPM * 5))
    function getKeystrokeDelay() {
        // Pick a random WPM between min and max
        const currentWPM = Math.floor(Math.random() * (CONFIG.maxWPM - CONFIG.minWPM + 1)) + CONFIG.minWPM;
        const baseDelay = 60000 / (currentWPM * 5);

        // Add some noise: +/- 20% variance per keystroke
        const variance = baseDelay * 0.2;
        const noise = (Math.random() * variance * 2) - variance;

        return Math.max(10, baseDelay + noise); // Ensure delay is at least 10ms
    }

    async function simulateMistake(correctChar) {
        const possibleMistakes = "abcdefghijklmnopqrstuvwxyz";
        const distinctMistake = possibleMistakes.charAt(Math.floor(Math.random() * possibleMistakes.length));

        // Type wrong char
        typeChar(distinctMistake);

        // Realization reaction time (slower than typing)
        await sleep(getKeystrokeDelay() * 2.5);

        // Backspace - simulate by selecting and deleting or execCommand delete?
        // execCommand 'delete' works well for single char deletion
        // Dispatch Backspace events
        const target = document.activeElement || document.body;
        const bsConfig = { key: 'Backspace', code: 'Backspace', bubbles: true, cancelable: true, view: window };

        target.dispatchEvent(new KeyboardEvent('keydown', bsConfig));
        document.execCommand('delete', false, null);
        target.dispatchEvent(new KeyboardEvent('keyup', bsConfig));

        // Correction pause
        await sleep(getKeystrokeDelay() * 1.5);
    }

    // Get the current word text that needs to be typed (remaining letters)
    function getCurrentWordText() {
        const activeWord = document.querySelector('#words .word.active');
        if (!activeWord) return null;

        const letters = activeWord.querySelectorAll('letter');
        let text = "";
        let foundUntyped = false;

        for (const letter of letters) {
            // Check if this letter hasn't been typed yet (no 'correct' or 'incorrect' class)
            if (!letter.classList.contains('correct') && !letter.classList.contains('incorrect')) {
                foundUntyped = true;
            }
            if (foundUntyped) {
                text += letter.textContent;
            }
        }

        return text;
    }

    // Main typing loop - continuously fetches words from DOM
    async function autoTypeLoop() {
        console.log("Starting continuous auto-type loop...");

        let wordCount = 0;
        while (true) {
            // Get current word's remaining text
            const currentWordText = getCurrentWordText();

            if (currentWordText === null) {
                // No active word found - test might be complete
                console.log(`Auto-type complete! Typed ${wordCount} words.`);
                break;
            }

            if (currentWordText.length === 0) {
                // Current word is fully typed, need to press space
                // But first check if there's another word coming
                const activeWord = document.querySelector('#words .word.active');
                const nextWord = activeWord ? activeWord.nextElementSibling : null;

                if (!nextWord || !nextWord.classList.contains('word')) {
                    // Might be at the end, wait a bit and check again
                    await sleep(50);
                    const stillActive = document.querySelector('#words .word.active');
                    if (!stillActive) {
                        console.log(`Auto-type complete! Typed ${wordCount} words.`);
                        break;
                    }
                    continue;
                }

                // Type space to move to next word
                typeChar(' ');
                wordCount++;

                let delay = getKeystrokeDelay() * 1.3; // Longer pause between words
                await sleep(delay);
                continue;
            }

            // Type the next character
            const char = currentWordText[0];

            // Check for mistake opportunity (only on alpha characters)
            if (/[a-zA-Z]/.test(char) && Math.random() < CONFIG.errorRate) {
                await simulateMistake(char);
            }

            typeChar(char);

            let delay = getKeystrokeDelay();
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

                console.log("Trigger detected. Starting Command Typer...");
                setTimeout(() => {
                    autoTypeLoop();
                }, CONFIG.startDelay);
            }
        }
    };

    window.addEventListener('keydown', triggerHandler);
    console.log("READY! Type the first letter to test Command Mode.");
})();
