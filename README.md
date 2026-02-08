# MnkLightning

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![JavaScript](https://img.shields.io/badge/Language-JavaScript-F7DF1E.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Version](https://img.shields.io/badge/Version-1.0.0-blue.svg)](#)
[![Monkeytype](https://img.shields.io/badge/Target-Monkeytype-orange.svg)](https://monkeytype.com/)

MonkeyLightning is a performance-oriented cheat-hack designed for Monkeytype. It implements sophisticated typing logic that mimics human-like latency and imperfectness to provide a natural typing flow.

<img width="1358" height="648" alt="Interface Preview" src="https://github.com/user-attachments/assets/f42ba747-a9ca-4f2b-9244-cf60153eda99" />

## Demonstration

The following recording demonstrates the script in action, illustrating the variable typing speed and errors.

https://github.com/user-attachments/assets/ec3fa997-6859-400e-8672-d164c526ba7a

## Technical Overview

This repository serves as a validation environment for `script_candidate.js`. The core logic focuses on:
- Human-like latency modeling with randomized inter-keystroke intervals.
- Error injection and correction logic to emulate natural typing degradation.
- High-efficiency input automation using browser-native state manipulation.

## Usage Instructions

To utilize the validation script:

1. Navigate to the [Monkeytype](https://monkeytype.com/) interface.
2. Open the browser's developer console (F12 or Ctrl+Shift+J).
3. Copy the implementation from [script_candidate.js](./script_candidate.js) and paste it into the console.
4. Execute the script by pressing Enter.
5. Initiate a typing test; the automation will trigger upon manual entry of the first character.

## Configuration

You can customize the bot's performance by modifying the `CONFIG` object at the top of `script_candidate.js`:

```javascript
const CONFIG = {
    minWPM: 310,      // Minimum expected WPM
    maxWPM: 550,      // Maximum expected WPM
    errorRate: 0.05,  // Probability of making a mistake (0.0 to 1.0)
    accuracy: 95,     // Target accuracy (affects error correction)
    startDelay: 50,   // Delay in ms before starting to type
};
```

Adjust these values to achieve your desired speed and accuracy profile.

## Disclaimer

This software is provided for educational and research purposes only. The authors do not encourage or condone the use of automation scripts on competitive platforms. Use at your own risk.

## Citation

If you use this research in your work, please cite it as follows:

```bibtex
@software{MnkLightning2026,
  author = {algorembrant},
  title = {MnkLightning: Human-Like Typing Cheat-hack for Monkeytype},
  year = {2026},
  publisher = {GitHub},
  journal = {GitHub Repository},
  howpublished = {\url{https://github.com/algorembrant/MnkLightning}}
}
```

