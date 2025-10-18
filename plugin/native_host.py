#!/usr/bin/env python3

import sys
import json
import struct
import tkinter as tk
from tkinter import filedialog

def get_message():
    raw_length = sys.stdin.buffer.read(4)
    if len(raw_length) == 0:
        sys.exit(0)
    message_length = struct.unpack('@I', raw_length)[0]
    message = sys.stdin.buffer.read(message_length).decode('utf-8')
    return json.loads(message)

def send_message(message_content):
    encoded_content = json.dumps(message_content).encode('utf-8')
    message_length = struct.pack('@I', len(encoded_content))
    sys.stdout.buffer.write(message_length)
    sys.stdout.buffer.write(encoded_content)
    sys.stdout.buffer.flush()

try:
    # Wait for a message from the extension
    received_message = get_message()

    if received_message.get("text") == "get_path":
        # Use Tkinter to open a directory selection dialog
        root = tk.Tk()
        root.withdraw()  # Hide the main window
        root.wm_attributes('-topmost', 1) # Make the window stay on top
        directory_path = filedialog.askdirectory()
        # root.destroy() # Clean up the root window
        
        if directory_path:
            send_message({"path": directory_path})
        else:
            # User cancelled the dialog
            send_message({"path": None})

except Exception as e:
    # It's a good practice to log errors, but for native messaging,
    # sending a message back is one way to debug.
    send_message({"error": str(e)})
