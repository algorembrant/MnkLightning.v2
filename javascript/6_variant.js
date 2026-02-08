(function () {
    console.log("%c Monkeytype Cheat Initiated (Persistent Mode) ", "background: #222; color: #bada55; font-size: 20px");

    const keyMap = {
        ' ': { code: 'Space', keyCode: 32 },
        '\n': { code: 'Enter', keyCode: 13 },
    };

    let isArmed = false;

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
        return 100 + (Math.random() * 60 - 30);
    }

    async function cheat(textToType) {
        console.log(`Typing ${textToType.length} chars...`);
        for (let i = 0; i < textToType.length; i++) {
            // Check if test was reset mid-run
            if (!document.querySelector('#words .word.active')) {
                console.log("Test reset detected. Stopping current run.");
                return;
            }
            typeChar(textToType[i]);
            await new Promise(r => setTimeout(r, getDelay()));
        }
    }

    function getFullText() {
        const words = document.querySelectorAll('#words .word');
        let fullBuffer = "";
        words.forEach((word, index) => {
            const letters = word.querySelectorAll('letter');
            letters.forEach(l => fullBuffer += l.textContent);
            if (index < words.length - 1) fullBuffer += " ";
        });
        return fullBuffer;
    }

    const triggerHandler = (e) => {
        if (!isArmed) return;

        if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
            const targetText = getFullText();
            if (!targetText) return;

            const firstChar = targetText[0];
            if (firstChar && e.key === firstChar) {
                isArmed = false; // Disarm to prevent double trigger
                const remainingText = targetText.substring(1);
                console.log("Triggered! Starting...");
                setTimeout(() => cheat(remainingText), 150);
            }
        }
    };

    function armCheat() {
        // Debounce slightly to ensure DOM is ready
        setTimeout(() => {
            const text = getFullText();
            if (text.length > 0) {
                isArmed = true;
                console.log("Cheat RE-ARMED. Waiting for first key...");
            } else {
                console.log("Training ended or no words found.");
            }
        }, 500);
    }

    // LISTENER: Watch for Keydown (Trigger)
    // We add this ONCE and keep it capable of firing whenever 'isArmed' is true.
    window.addEventListener('keydown', triggerHandler);

    // MUTATION OBSERVER: Watch for "Restart Test"
    // When #words changes (new words added), we re-arm.
    const wordsContainer = document.querySelector('#words');
    if (wordsContainer) {
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                // If words are added/removed, it means test reset/changed
                if (mutation.type === 'childList') {
                    // Check if we have new words
                    const words = document.querySelectorAll('#words .word');
                    if (words.length > 5) { // Arbitrary threshold to ensure it's a real set of words
                        armCheat();
                        // We break to avoid calling armCheat multiple times per batch update
                        break;
                    }
                }
            }
        });

        observer.observe(wordsContainer, { childList: true });
        console.log("Observer attached. Auto-restart enabled.");

        // Initial Arm
        armCheat();
    } else {
        console.error("Container #words not found. Is the page loaded?");
    }
})();