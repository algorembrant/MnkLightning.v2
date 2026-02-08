# MnkLightning

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![JavaScript](https://img.shields.io/badge/Language-JavaScript-F7DF1E.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Version](https://img.shields.io/badge/Version-1.0.0-blue.svg)](#)
[![Monkeytype](https://img.shields.io/badge/Target-Monkeytype-orange.svg)](https://monkeytype.com/)

MnkLightning is a performance-oriented utility designed for Monkeytype research and validation. It implements a sophisticated typing simulation that mimics human-like latency and imperfectness to analyze system responses to varied input patterns.

<img width="1358" height="648" alt="Interface Preview" src="https://github.com/user-attachments/assets/f42ba747-a9ca-4f2b-9244-cf60153eda99" />

## Demonstration

The following recording demonstrates the script in action, illustrating the variable typing speed and error simulation:

https://github.com/user-attachments/assets/ec3fa997-6859-400e-8672-d164c526ba7a

## Technical Overview

This repository serves as a validation environment for `script_candidate.js`. The core logic focuses on:
- Human-like latency modeling with randomized inter-keystroke intervals.
- Error injection and correction simulation to emulate natural typing degradation.
- High-efficiency input automation using browser-native state manipulation.

## Usage Instructions

To utilize the validation script:

1. Navigate to the [Monkeytype](https://monkeytype.com/) interface.
2. Open the browser's developer console (F12 or Ctrl+Shift+J).
3. Copy the implementation from [script_candidate.js](./script_candidate.js) and paste it into the console.
4. Execute the script by pressing Enter.
5. Initiate a typing test; the automation will trigger upon manual entry of the first character.

## Disclaimer

This software is provided for educational and research purposes only. The authors do not encourage or condone the use of automation scripts on competitive platforms. Use at your own risk.

## Citation

If you use this research in your work, please cite it as follows:

```bibtex
@software{MnkLightning2026,
  author = {algorembrant},
  title = {MnkLightning: Human-Mimetic Typing Cheat-hack for Monkeytype},
  year = {2026},
  publisher = {GitHub},
  journal = {GitHub Repository},
  howpublished = {\url{https://github.com/algorembrant/MnkLightning}}
}
```

