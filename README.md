# MnkLightning

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Language-Python-blue.svg)](https://www.python.org/)
[![JavaScript](https://img.shields.io/badge/Language-JavaScript-F7DF1E.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Version](https://img.shields.io/badge/Version-3.0.0-red.svg)](#)
[![Monkeytype](https://img.shields.io/badge/Target-Monkeytype-orange.svg)](https://monkeytype.com/)

MonkeyLightning is a performance-oriented automation script designed for Monkeytype. It implements sophisticated human-like typing behavior with real OS-level keyboard events to bypass bot detection.

## Technical Overview

This v3.0 release shifts from client-side JavaScript to **Python-based automation (PyAutoGUI)**. This creates "trusted" keyboard events that are indistinguishable from real human input to the browser.

- **`mnk_typer.py`**: Python script that simulates real keyboard input.
- **`injector.js`**: Helper script to bridge text from browser to Python.
- **Human-like Imperfections**: Full suite of 12+ imperfection types (typos, hesitations, fatigue).

## Usage Instructions (Bypass Method)

The new bypass method uses a 2-step process:

### Step 1: Setup

1. Install Python (if not installed).
2. Install required packages:
   ```bash
   pip install -r requirements.txt
   ```

### Step 2: Run the Bot

1. **Open Monkeytype** in your browser.
2. **Open Developer Console** (`F12` or `Ctrl+Shift+J`).
3. **Paste & Run** the contents of [`injector.js`](./injector.js) into the console.
   - You should see a message: "MnkLightning Injector Active".
4. **Run the Python script** in a terminal:
   ```bash
   python mnk_typer.py
   ```
5. **Trigger the Bot**:
   - Focus the Monkeytype window.
   - Press **`Insert`** key to copy current words to clipboard.
   - Press **`Insert`** key again to START typing.
   - Press **`Esc`** to stop at any time.

## Configuration

You can customize the bot's behavior in `mnk_typer.py`:

```python
CONFIG = {
    "min_wpm": 310,
    "max_wpm": 550,
    
    # Imperfections (0.0 - 1.0)
    "wrong_char_rate": 0.025,
    "adjacent_key_rate": 0.02,
    "hesitation_rate": 0.04,
    "burst_rate": 0.08,
    
    # Timing
    "hesitation_multiplier": 3.5,
    "burst_speed_multiplier": 0.5,
}
```

## Disclaimer

This software is provided for educational and research purposes only. The authors do not encourage or condone the use of automation scripts on competitive platforms. Use at your own risk.
