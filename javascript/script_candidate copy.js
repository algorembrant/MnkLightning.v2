(function () {
    console.log("%c Monkeytype Command Typer (execCommand) ", "background: #222; color: #ff0000; font-size: 20px");

    const CONFIG = {
        minWPM: 250,      // Minimum expected WPM
        maxWPM: 350,      // Maximum expected WPM
        errorRate: 0.15,  // 15% chance to make a mistake
        accuracy: 90,     // Target accuracy (affects error correction)
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

    async function autoType(text) {
        console.log(`Typing ${text.length} chars (Human-Like Method)...`);

        for (let i = 0; i < text.length; i++) {
            const char = text[i];

            // Check for mistake opportunity (only on alpha characters, not spaces)
            if (/[a-zA-Z]/.test(char) && Math.random() < CONFIG.errorRate) {
                // Determine if we should correct it immediately (high accuracy simulation)
                // For now, always correct immediately
                await simulateMistake(char);
            }

            typeChar(char);

            let delay = getKeystrokeDelay();

            // Pause longer on word boundaries (spaces)
            if (char === ' ') {
                delay *= 1.3;
            }

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

                // Fetch text similar to before
                const allWords = document.querySelectorAll('#words .word');
                let fullBuffer = "";
                let foundActive = false;

                allWords.forEach(word => {
                    if (word === activeWord) {
                        foundActive = true;
                        const letters = word.querySelectorAll('letter');
                        for (let i = 1; i < letters.length; i++) {
                            fullBuffer += letters[i].textContent;
                        }
                        fullBuffer += " ";
                    } else if (foundActive) {
                        const letters = word.querySelectorAll('letter');
                        letters.forEach(l => fullBuffer += l.textContent);
                        fullBuffer += " ";
                    }
                });

                if (fullBuffer.endsWith(" ")) {
                    fullBuffer = fullBuffer.slice(0, -1);
                }

                window.removeEventListener('keydown', triggerHandler);

                console.log("Trigger detected. Starting Command Typer...");
                setTimeout(() => {
                    autoType(fullBuffer);
                }, CONFIG.startDelay);
            }
        }
    };

    window.addEventListener('keydown', triggerHandler);
    console.log("READY! Type the first letter to test Command Mode.");
})();
