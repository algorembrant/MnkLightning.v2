(function () {
    console.log("%c Monkeytype Cheat Initiated (Reactive/Smart Mode) ", "background: #222; color: #bada55; font-size: 20px");

    const keyMap = {
        ' ': { code: 'Space', keyCode: 32 },
        '\n': { code: 'Enter', keyCode: 13 },
        '.': { code: 'Period', keyCode: 190 },
        ',': { code: 'Comma', keyCode: 188 },
        ';': { code: 'Semicolon', keyCode: 186 },
        '\'': { code: 'Quote', keyCode: 222 },
        '/': { code: 'Slash', keyCode: 191 },
        '\\': { code: 'Backslash', keyCode: 220 },
        '-': { code: 'Minus', keyCode: 189 },
        '=': { code: 'Equal', keyCode: 187 },
        '[': { code: 'BracketLeft', keyCode: 219 },
        ']': { code: 'BracketRight', keyCode: 221 }
    };

    function typeChar(char) {
        const target = document.activeElement || document.body;
        let key = char;
        let code, keyCode;

        if (keyMap[char]) {
            code = keyMap[char].code;
            keyCode = keyMap[char].keyCode;
        } else {
            code = `Key${char.toUpperCase()}`;
            keyCode = char.toUpperCase().charCodeAt(0);
        }

        const eventOptions = {
            key: key,
            code: code,
            keyCode: keyCode,
            which: keyCode,
            bubbles: true,
            cancelable: true,
            isTrusted: true
        };

        target.dispatchEvent(new KeyboardEvent('keydown', eventOptions));
        target.dispatchEvent(new KeyboardEvent('keypress', eventOptions));

        const inputEvent = new InputEvent('input', {
            data: char,
            inputType: 'insertText',
            bubbles: true,
            cancelable: true
        });
        target.dispatchEvent(inputEvent);

        target.dispatchEvent(new KeyboardEvent('keyup', eventOptions));
    }

    function getDelay() {
        return 100 + (Math.random() * 60 - 30); // ~100-120ms average
    }

    async function cheat() {
        console.log("Cheat running... Press Escape to stop.");

        while (true) {
            // 1. Find the active word
            const activeWord = document.querySelector('#words .word.active');

            // If no active word, we might be done or loading.
            if (!activeWord) {
                // Check if test is over (result page usually covers #words or removes .active)
                const isResult = document.querySelector('#result');
                if (isResult && isResult.checkVisibility && isResult.checkVisibility()) {
                    console.log("Test finished.");
                    break;
                }
                // Check if we just haven't started (shouldn't happen since we trigger on key)
                // Safety break
                await new Promise(r => setTimeout(r, 500));
                continue;
            }

            // 2. Find the next pending letter in this word
            // Monkeytype uses classes 'correct'/'incorrect' for typed letters.
            // We want the first letter that DOES NOT have these classes.
            const nextLetterNode = activeWord.querySelector('letter:not(.correct):not(.incorrect)');

            if (nextLetterNode) {
                // We have a letter to type
                typeChar(nextLetterNode.textContent);
            } else {
                // No letters left in this word. It's done.
                // We need to type SPACE to move to next word.
                // UNLESS it's the very last word.
                const nextWord = activeWord.nextElementSibling;
                if (nextWord && nextWord.classList.contains('word')) {
                    typeChar(' ');
                } else {
                    console.log("Last word finished.");
                    break;
                }
            }

            // 3. Wait human delay
            await new Promise(r => setTimeout(r, getDelay()));
        }
    }

    // Trigger Logic
    const triggerHandler = (e) => {
        // Only trigger on single char keys, no modifiers
        if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
            const activeWord = document.querySelector('#words .word.active');
            if (activeWord) {
                const firstLetter = activeWord.querySelector('letter');
                // If user types correct first letter
                if (firstLetter && e.key === firstLetter.textContent) {
                    window.removeEventListener('keydown', triggerHandler);
                    console.log("Triggered! Taking over in 100ms...");
                    // Small delay to let the user's key register fully
                    setTimeout(cheat, 100);
                }
            }
        }
    };

    window.addEventListener('keydown', triggerHandler);
    console.log("READY: Reactive Mode. Type the first letter.");
})();