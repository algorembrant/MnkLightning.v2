(function () {
    console.log("%c Monkeytype Cheat Initiated (Human 100 WPM + Fixes) ", "background: #222; color: #bada55; font-size: 20px");

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

        // Determine properties
        let key = char;
        let code, keyCode;

        if (keyMap[char]) {
            code = keyMap[char].code;
            keyCode = keyMap[char].keyCode;
        } else {
            // Fallback for letters/numbers
            code = `Key${char.toUpperCase()}`;
            keyCode = char.toUpperCase().charCodeAt(0);
        }

        const eventOptions = {
            key: key,
            code: code,
            keyCode: keyCode, // Important for legacy checks
            which: keyCode,
            bubbles: true,
            cancelable: true,
            isTrusted: true // Ignored by browser but good for consistency
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
        // ~100 WPM
        const baseDelay = 120;
        const variance = (Math.random() * 60) - 30;
        return baseDelay + variance;
    }

    async function cheat() {
        const activeWord = document.querySelector('#words .word.active');
        const allWords = document.querySelectorAll('#words .word');

        if (!activeWord) {
            console.error("Could not find active word. Is the test running?");
            return;
        }

        let distinctText = "";
        let foundActive = false;

        allWords.forEach(word => {
            if (word === activeWord) {
                foundActive = true;
            }
            if (foundActive) {
                const letters = word.querySelectorAll('letter');
                letters.forEach(l => distinctText += l.textContent);
                distinctText += " ";
            }
        });

        // The first char was typed by user.
        // We trim it.
        const textToType = distinctText.substring(1);
        console.log(`Typing ${textToType.length} characters...`);

        for (let i = 0; i < textToType.length; i++) {
            typeChar(textToType[i]);
            await new Promise(resolve => setTimeout(resolve, getDelay()));
        }
    }

    const triggerHandler = (e) => {
        const activeWord = document.querySelector('#words .word.active');
        if (activeWord && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
            const firstLetterElement = activeWord.querySelector('letter');
            const firstLetter = firstLetterElement ? firstLetterElement.textContent : null;

            if (firstLetter && e.key === firstLetter) {
                window.removeEventListener('keydown', triggerHandler);
                // Increased delay to 150ms to prevent race condition with React state updates
                console.log("Trigger detected. Starting in 150ms...");
                setTimeout(cheat, 150);
            }
        }
    };

    window.addEventListener('keydown', triggerHandler);
    console.log("READY: Type the first letter to start.");
})();