# MnkLightning

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![JavaScript](https://img.shields.io/badge/Language-JavaScript-F7DF1E.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Version](https://img.shields.io/badge/Version-2.0.0-blue.svg)](#)
[![Monkeytype](https://img.shields.io/badge/Target-Monkeytype-orange.svg)](https://monkeytype.com/)

MonkeyLightning is a performance-oriented automation script designed for Monkeytype. It implements sophisticated human-like typing behavior with extensive imperfection modeling to provide a natural, undetectable typing flow.

<img width="1358" height="648" alt="Interface Preview" src="https://github.com/user-attachments/assets/f42ba747-a9ca-4f2b-9244-cf60153eda99" />

## Demonstration

The following recording demonstrates the script in action, illustrating the variable typing speed and human-like errors.

https://github.com/user-attachments/assets/ec3fa997-6859-400e-8672-d164c526ba7a

## Technical Overview

This repository contains `script_candidate.js`, featuring:
- **Dynamic word fetching** - Continuously reads from DOM, works beyond 100 words
- **Human-like latency modeling** with randomized inter-keystroke intervals
- **12+ imperfection types** to emulate natural typing behavior
- **QWERTY keyboard adjacency map** for realistic typos
- **Fatigue simulation** that gradually slows typing over time

## Human-Like Imperfections

| Behavior | Default Rate | Description |
|----------|--------------|-------------|
| **Wrong Character** | 2.5% | Types a random letter instead of correct one |
| **Adjacent Key Typo** | 2% | Hits a nearby key on QWERTY keyboard (e.g., 'd' → 's') |
| **Double Letter** | 1.5% | Accidentally presses a key twice |
| **Triple Letter** | 0.3% | Accidentally presses a key three times |
| **Skip Letter** | 1% | Finger moves too fast, misses a key |
| **Transposed Letters** | 1.2% | Swaps two adjacent letters (e.g., "teh" → "the") |
| **Ctrl+Backspace** | 0.8% | Deletes whole word when frustrated with errors |
| **Hesitation Pause** | 4% | Random thinking pause (3.5x longer delay) |
| **Burst Typing** | 8% | Fast typing burst for 5 characters |
| **Word Start Slowdown** | Always | First letter of each word typed 1.8x slower |
| **Fatigue** | Gradual | Typing slowly gets slower over time |
| **Post-Mistake Pause** | After errors | 2x longer delay after making a mistake |

## Usage Instructions

1. Navigate to [Monkeytype](https://monkeytype.com/).
2. Open the browser's developer console (`F12` or `Ctrl+Shift+J`).
3. Copy the contents of [script_candidate.js](./script_candidate.js) and paste into the console.
4. Press Enter to execute.
5. Start a typing test — the automation triggers when you type the first character.

## Configuration

Customize the bot by modifying the `CONFIG` object in `script_candidate.js`:

```javascript
const CONFIG = {
    minWPM: 310,              // Minimum expected WPM
    maxWPM: 550,              // Maximum expected WPM
    startDelay: 50,           // Delay before starting to type

    // === HUMAN IMPERFECTION RATES ===
    wrongCharRate: 0.025,     // Random wrong character
    adjacentKeyRate: 0.02,    // Nearby key on keyboard
    doubleLetterRate: 0.015,  // Double key press
    tripleLetterRate: 0.003,  // Triple key press
    skipLetterRate: 0.01,     // Missed key
    transposeRate: 0.012,     // Swapped adjacent letters
    ctrlBackspaceRate: 0.008, // Delete whole word
    hesitationRate: 0.04,     // Random pause
    hesitationMultiplier: 3.5,
    burstTypingRate: 0.08,    // Fast burst mode
    burstSpeedMultiplier: 0.5,
    burstLength: 5,
    wordStartSlowdown: 1.8,   // Slower first letter
    fatigueEnabled: true,
    fatigueRate: 0.0001,
    postMistakePauseMultiplier: 2.0,
};
```

Set any rate to `0` to disable that imperfection type.

## Disclaimer

This software is provided for educational and research purposes only. The authors do not encourage or condone the use of automation scripts on competitive platforms. Use at your own risk.

## Citation

```bibtex
@software{MnkLightning2026,
  author = {algorembrant},
  title = {MnkLightning: Human-Like Typing Automation for Monkeytype},
  year = {2026},
  publisher = {GitHub},
  journal = {GitHub Repository},
  howpublished = {\url{https://github.com/algorembrant/MnkLightning}}
}
```
