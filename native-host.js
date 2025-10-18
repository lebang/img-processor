const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Function to send a response to the extension
function sendResponse(message) {
  const messageBuffer = Buffer.from(JSON.stringify(message));
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32LE(messageBuffer.length, 0);
  process.stdout.write(lengthBuffer);
  process.stdout.write(messageBuffer);
}

// Function to handle incoming messages
function onMessage(message) {
  if (message.path) {
    const requestedPath = message.path;

    // Security check: Ensure the path is absolute and exists
    if (!path.isAbsolute(requestedPath)) {
      sendResponse({ success: false, message: 'Path must be absolute.' });
      return;
    }

    fs.stat(requestedPath, (err, stats) => {
      if (err || !stats.isDirectory()) {
        sendResponse({ success: false, message: 'Path does not exist or is not a directory.' });
        return;
      }

      let command;
      switch (process.platform) {
        case 'win32':
          command = `explorer "${requestedPath}"`;
          break;
        case 'darwin':
          command = `open "${requestedPath}"`;
          break;
        default:
          command = `xdg-open "${requestedPath}"`;
          break;
      }

      exec(command, (error, stdout, stderr) => {
        if (error) {
          sendResponse({ success: false, message: error.message });
          return;
        }
        sendResponse({ success: true, message: `Opened ${requestedPath}` });
      });
    });
  } else {
    sendResponse({ success: false, message: 'Invalid message format.' });
  }
}

// Read messages from stdin
let input = '';
process.stdin.on('readable', () => {
  let chunk;
  while ((chunk = process.stdin.read()) !== null) {
    if (input.length === 0 && chunk.length >= 4) {
      const len = chunk.readUInt32LE(0);
      const content = chunk.slice(4).toString();
      if (content.length === len) {
        try {
          onMessage(JSON.parse(content));
        } catch (e) {
          sendResponse({ success: false, message: 'Error parsing JSON.' });
        }
      } else {
        input += chunk.toString();
      }
    } else {
      input += chunk.toString();
      if (input.length >= 4) {
        const len = Buffer.from(input.slice(0, 4), 'binary').readUInt32LE(0);
        if (input.length >= len + 4) {
          const content = input.slice(4, len + 4);
          try {
            onMessage(JSON.parse(content));
          } catch (e) {
            sendResponse({ success: false, message: 'Error parsing JSON.' });
          }
          input = input.slice(len + 4);
        }
      }
    }
  }
});
