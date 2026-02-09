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
    "min_wpm": 200,
    "max_wpm": 240,
    # Key Hold Time (Seconds)
    "min_key_hold": 0.01,
    "max_key_hold": 0.04,
    
    # Imperfection Rates (0.0 to 1.0)
    "wrong_char_rate": 0.015,     # 1.5% chance
    "adjacent_key_rate": 0.01,    # 1.0% chance
    "double_letter_rate": 0.005,  # 0.5% chance
    "skip_letter_rate": 0.002,    # 0.2% chance
    "transpose_rate": 0.005,      # 0.5% chance
    
    "hesitation_rate": 0.02,      # 2% chance to hesitate
    "burst_rate": 0.15,           # 15% chance to speed up (burst)
    "insane_burst_rate": 0.05,    # 5% chance for fast burst (was causing issues at higher rates)
    
    "permanent_skip_rate": 0,     # Disabled (causes invalid mostly)
    "permanent_multi_skip_rate": 0,
    
    # Timing Multipliers
    "hesitation_multiplier": 2.0, # Reduced from 2.5x to be less jarring
    "burst_speed_multiplier": 0.5, # 0.5x delay (2x speed) during burst
    "post_mistake_pause": 0.3,    # Reduced pause
    "word_start_slowdown": 1.1,   # Subtle slowdown
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
    # Standard formula: 60 seconds / chars per minute = seconds per char
    base_delay = 60 / cpm
    
    if in_burst:
        # Bursts should be FASTER (reduced delay)
        base_delay *= CONFIG["burst_speed_multiplier"]
        
    # Add noise (+/- 20%)
    variance = base_delay * 0.20
    noise = random.uniform(-variance, variance)
    return max(0.005, base_delay + noise)

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

                    # 3. Insane Burst Mode (Type 3-5 chars very quickly)
                    if random.random() < CONFIG["insane_burst_rate"]:
                        # Random 3-5 characters as requested
                        burst_len = random.randint(3, 5)
                        for _ in range(burst_len):
                            if idx >= len(text): break
                            pyautogui.write(text[idx])
                            idx += 1
                            # Delay increased from 0.002 to ~0.025s to smooth out graph
                            # (0.002 was causing "parabolic" spikes and invalid WPM)
                            time.sleep(random.uniform(0.020, 0.030)) 
                        continue

                    # 4. Permanent Skip (Type nothing, effectively skipping the char)
                    if random.random() < CONFIG["permanent_skip_rate"]:
                        idx += 1
                        time.sleep(delay)
                        continue

                    # 4. Permanent Multi-Skip (Skip 2-3 chars)
                    if random.random() < CONFIG["permanent_multi_skip_rate"]:
                        skip_count = random.randint(2, 3)
                        idx += skip_count
                        time.sleep(delay)
                        continue
                        
                    # 5. Wrong Character (Type random, then fix)
                    if random.random() < CONFIG["wrong_char_rate"] and char.isalnum():
                        wrong = random.choice("abcdefghijklmnopqrstuvwxyz")
                        type_char(wrong)
                        time.sleep(delay * 2)
                        simulate_backspace(1)
                        time.sleep(delay)
                        # Don't increment idx, we need to type correct char
                        
                    # 6. Adjacent Key (Type neighbor, then fix)
                    elif random.random() < CONFIG["adjacent_key_rate"] and char.isalpha():
                        adj = get_adjacent_key(char)
                        type_char(adj)
                        time.sleep(delay * 1.5)
                        simulate_backspace(1)
                        time.sleep(delay)
                    
                    # 7. Skip Letter (Type next char, realize, backspace 2, type current)
                    elif random.random() < CONFIG["skip_letter_rate"] and idx + 1 < len(text):
                        next_char = text[idx+1]
                        type_char(next_char)
                        time.sleep(delay * 2.5)
                        simulate_backspace(1)
                        time.sleep(delay)
                        # Now continue loop to type 'char'
                        
                    # 8. Double Letter (Type char twice, delete one)
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
