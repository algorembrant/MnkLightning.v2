// MnkLightning Injector
// Run this in the browser console on Monkeytype.com

(function () {
    console.log("%c MnkLightning Injector Active ", "background: #222; color: #00ff00; font-size: 16px");
    console.log("Press 'Insert' key to copy current words to clipboard for the Python script.");

    function getVisibleText() {
        const words = document.querySelectorAll('.word');
        let textBuffer = [];

        words.forEach(word => {
            let wordText = "";
            word.querySelectorAll('letter').forEach(letter => {
                wordText += letter.textContent;
            });
            textBuffer.push(wordText);
        });

        return textBuffer.join(' ');
    }

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Insert') {
            e.preventDefault();
            const text = getVisibleText();

            // Modern clipboard API
            navigator.clipboard.writeText(text).then(() => {
                console.log(`%c Copied ${text.length} chars to clipboard! `, "color: #00ff00");
                console.log("Now start the Python script and press the trigger key.");

                // Visual feedback
                const notification = document.createElement('div');
                notification.textContent = "MnkLightning: Text Copied!";
                notification.style.cssText = `
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        background: #333;
                        color: #fff;
                        padding: 10px 20px;
                        border-radius: 5px;
                        z-index: 9999;
                        font-family: monospace;
                        transition: opacity 0.5s;
                    `;
                document.body.appendChild(notification);
                setTimeout(() => {
                    notification.style.opacity = '0';
                    setTimeout(() => notification.remove(), 500);
                }, 2000);
            }).catch(err => {
                console.error("Failed to copy text: ", err);
            });
        }
    });

    // Optional: Auto-copy on load if words are present
    // setTimeout(() => {
    //    if (document.querySelector('.word')) console.log("Ready. Press Insert.");
    // }, 1000);

})();
