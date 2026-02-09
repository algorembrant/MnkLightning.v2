import pyautogui
import keyboard
import time
import random
import pyperclip
import sys

# Remove default 0.1s pause after every PyAutoGUI call
pyautogui.PAUSE = 0

# === CONFIGURATION ===
CONFIG = {
    "min_wpm": 390,
    "max_wpm": 450,
    # Key Hold Time (Seconds)
    "min_key_hold": 0.01,
    "max_key_hold": 0.03,
    
    # Imperfection Rates (0.0 to 1.0)
    "wrong_char_rate": 0.0025,
    "adjacent_key_rate": 0.002,
    "double_letter_rate": 0.0015,
    "skip_letter_rate": 0.01,
    "transpose_rate": 0.0012,
    "hesitation_rate": 0.04,
    "burst_rate": 0.08,
    
    # Timing Multipliers
    "hesitation_multiplier": 3.5,
    "burst_speed_multiplier": 0.5,
    "post_mistake_pause": 2.0,
    "word_start_slowdown": 1.5,
}

# QWERTY Adjacency Map
ADJACENT_KEYS = {
    'a': 'qwsz', 'b': 'vghn', 'c': 'xdfv', 'd': 'serfcx', 'e': 'wsdr',
    'f': 'drtgvc', 'g': 'ftyhbv', 'h': 'gyujnb', 'i': 'ujko', 'j': 'huikmn',
    'k': 'jiolm', 'l': 'kop', 'm': 'njk', 'n': 'bhjm', 'o': 'iklp',
    'p': 'ol', 'q': 'wa', 'r': 'edft', 's': 'awedxz', 't': 'rfgy',
    'u': 'yhji', 'v': 'cfgb', 'w': 'qase', 'x': 'zsdc', 'y': 'tghu',
    'z': 'asx'
}

def get_keystroke_delay(wpm, in_burst=False):
    """Calculates delay between keystrokes based on WPM."""
    cpm = wpm * 5
    base_delay = 10 / cpm
    
    if in_burst:
        base_delay *= CONFIG["burst_speed_multiplier"]
        
    # Add noise (+/- 25%)
    variance = base_delay * 0.25
    noise = random.uniform(-variance, variance)
    return max(0.008, base_delay + noise)

def get_adjacent_key(char):
    """Returns a key adjacent to the given char on QWERTY layout."""
    char_lower = char.lower()
    if char_lower in ADJACENT_KEYS:
        adj = random.choice(ADJACENT_KEYS[char_lower])
        return adj.upper() if char.isupper() else adj
    return char

def type_char(char):
    """Types a single character with human-like key hold duration."""
    # Handle special characters or shift needs
    try:
        pyautogui.keyDown(char)
        time.sleep(random.uniform(CONFIG["min_key_hold"], CONFIG["max_key_hold"]))
        pyautogui.keyUp(char)
    except:
        # Fallback for complex chars
        pyautogui.write(char)

def simulate_backspace(count=1):
    """Simulates pressing backspace with hold time."""
    for _ in range(count):
        pyautogui.keyDown('backspace')
        time.sleep(random.uniform(CONFIG["min_key_hold"], CONFIG["max_key_hold"]))
        pyautogui.keyUp('backspace')
        time.sleep(random.uniform(0.05, 0.1))

def mnk_typer():
    print("=== MnkLightning Python Automation ===")
    print("1. Copy text from Monkeytype using injector.js (Press Insert in browser)")
    print("2. Focus the browser window")
    print("3. Press 'Insert' to START typing")
    print("4. Press 'Esc' to STOP")
    print("Waiting for trigger...")

    while True:
        if keyboard.is_pressed('esc'):
            print("\nExiting...")
            sys.exit()
            
        if keyboard.is_pressed('insert'):
            # Debounce
            time.sleep(0.5)
            
            # Get text from clipboard
            text = pyperclip.paste()
            if not text:
                print("Clipboard empty! extraction failed?")
                continue
                
            print(f"Typing {len(text)} characters...")
            
            wpm = random.randint(CONFIG["min_wpm"], CONFIG["max_wpm"])
            print(f"Target WPM: {wpm}")
            
            # State
            idx = 0
            burst_remaining = 0
            
            try:
                while idx < len(text):
                    if keyboard.is_pressed('esc'):
                        return

                    char = text[idx]
                    delay = get_keystroke_delay(wpm, burst_remaining > 0)
                    
                    if burst_remaining > 0:
                        burst_remaining -= 1

                    # === IMPERFECTIONS ===
                    
                    # 1. Hesitation
                    if random.random() < CONFIG["hesitation_rate"]:
                        delay *= CONFIG["hesitation_multiplier"]
                        
                    # 2. Burst Mode
                    if burst_remaining == 0 and random.random() < CONFIG["burst_rate"]:
                        burst_remaining = 5
                        
                    # 3. Wrong Character (Type random, then fix)
                    if random.random() < CONFIG["wrong_char_rate"] and char.isalnum():
                        wrong = random.choice("abcdefghijklmnopqrstuvwxyz")
                        type_char(wrong)
                        time.sleep(delay * 2)
                        simulate_backspace(1)
                        time.sleep(delay)
                        # Don't increment idx, we need to type correct char
                        
                    # 4. Adjacent Key (Type neighbor, then fix)
                    elif random.random() < CONFIG["adjacent_key_rate"] and char.isalpha():
                        adj = get_adjacent_key(char)
                        type_char(adj)
                        time.sleep(delay * 1.5)
                        simulate_backspace(1)
                        time.sleep(delay)
                    
                    # 5. Skip Letter (Type next char, realize, backspace 2, type current)
                    elif random.random() < CONFIG["skip_letter_rate"] and idx + 1 < len(text):
                        next_char = text[idx+1]
                        type_char(next_char)
                        time.sleep(delay * 2.5)
                        simulate_backspace(1)
                        time.sleep(delay)
                        # Now continue loop to type 'char'
                        
                    # 6. Double Letter (Type char twice, delete one)
                    elif random.random() < CONFIG["double_letter_rate"] and char.isalpha():
                        type_char(char)
                        time.sleep(0.05)
                        type_char(char) # Double
                        time.sleep(delay * 2)
                        simulate_backspace(1)
                        idx += 1 # We kept one valid char
                        time.sleep(delay)
                        continue

                    # === TYPING ===
                    type_char(char)
                    idx += 1
                    
                    # Word boundary pause
                    if char == ' ':
                        delay *= CONFIG["word_start_slowdown"]
                        
                    time.sleep(delay)
                    
            except KeyboardInterrupt:
                pass
                
            print("\nTyping complete.")
            time.sleep(1) # Prevent double trigger

if __name__ == "__main__":
    try:
        mnk_typer()
    except KeyboardInterrupt:
        sys.exit()
