(function () {
    console.log("%c Monkeytype Cheat Initiated ", "background: #222; color: #bada55; font-size: 20px");
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

        // Input event is often required for modern frameworks (React/Vue/etc)
        const inputEvent = new InputEvent('input', {
            data: char,
            inputType: 'insertText',
            bubbles: true,
            cancelable: true
        });
        target.dispatchEvent(inputEvent);

        target.dispatchEvent(new KeyboardEvent('keyup', eventOptions));
    }
    function cheat() {
        // Selector logic based on standard Monkeytype structure
        const activeWord = document.querySelector('#words .word.active');
        const allWords = document.querySelectorAll('#words .word');

        if (!activeWord) {
            console.error("Could not find active word. Is the test started?");
            return;
        }
        let distinctText = "";
        let foundActive = false;
        // Iterate through all words to build the text buffer starting from the current active word
        allWords.forEach(word => {
            if (word === activeWord) {
                foundActive = true;
            }
            if (foundActive) {
                // Extract letters
                const letters = word.querySelectorAll('letter');
                letters.forEach(l => distinctText += l.textContent);
                // Add space between words, but check if it's the last word to avoid trailing space error
                // (Monkeytype usually handles the extra space fine, but let's be safe)
                distinctText += " ";
            }
        });
        // The user has ALREADY typed the first letter to trigger this.
        // So we remove the first character from our buffer.
        const textToType = distinctText.substring(1);
        console.log(`Typing ${textToType.length} characters... Buckle up!`);
        // Synchronous loop for maximum blocking speed
        // This will freeze the UI for a split second but will result in near-infinite WPM
        for (let i = 0; i < textToType.length; i++) {
            typeChar(textToType[i]);
        }
    }
    // Arm the trigger
    const triggerHandler = (e) => {
        const activeWord = document.querySelector('#words .word.active');
        // Check if we are in a valid state to trigger
        if (activeWord && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
            const firstLetterElement = activeWord.querySelector('letter');
            const firstLetter = firstLetterElement ? firstLetterElement.textContent : null;

            // If the user types the CORRECT first letter, fire the cheat
            if (firstLetter && e.key === firstLetter) {
                // Remove listener so it doesn't fire again recursively or on next key
                window.removeEventListener('keydown', triggerHandler);

                // Small timeout to allow the browser to process the user's initial keypress naturally
                // before we blast the rest of the text.
                setTimeout(cheat, 10);
            }
        }
    };
    window.addEventListener('keydown', triggerHandler);

    console.log("READY: Type the first correct letter of the current word to auto-finish.");
})();