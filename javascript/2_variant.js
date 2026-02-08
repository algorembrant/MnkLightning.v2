(function () {
    console.log("%c Monkeytype Cheat Initiated (Human 100 WPM) ", "background: #222; color: #bada55; font-size: 20px");

    function typeChar(char) {
        const target = document.activeElement || document.body;
        const key = char;
        const code = `Key${char.toUpperCase()}`;
        const eventOptions = {
            key: key,
            code: code,
            charCode: char.charCodeAt(0),
            keyCode: char.toUpperCase().charCodeAt(0),
            which: char.toUpperCase().charCodeAt(0),
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

    // Standard WPM: 1 word = 5 chars. 100 WPM = 500 CPM.
    // 60000ms / 500 = 120ms per char.
    // We add randomness to make it look human.
    function getDelay() {
        // Base delay for 100 WPM
        const baseDelay = 120;
        // Random variance between -30ms and +30ms
        const variance = (Math.random() * 60) - 30;
        return baseDelay + variance;
    }

    async function cheat() {
        const activeWord = document.querySelector('#words .word.active');
        const allWords = document.querySelectorAll('#words .word');

        if (!activeWord) {
            console.error("Could not find active word. Is the test started?");
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

        const textToType = distinctText.substring(1);
        console.log(`Typing ${textToType.length} characters at ~100 WPM...`);

        for (let i = 0; i < textToType.length; i++) {
            typeChar(textToType[i]);
            // Wait for a human-like delay
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
                setTimeout(cheat, 10);
            }
        }
    };

    window.addEventListener('keydown', triggerHandler);

    console.log("READY: Type the first correct letter of the current word to start human-like typing.");
})();