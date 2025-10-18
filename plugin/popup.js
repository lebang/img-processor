document.getElementById('select-dir-btn').addEventListener('click', () => {
  // Send a message to the background script to initiate the process
  chrome.runtime.sendMessage({ action: "select_directory" });
});

// Listen for messages from the background script (with the result)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const pathDisplay = document.getElementById('path-display');
  if (message.path) {
    pathDisplay.textContent = `选择的路径: ${message.path}`;

    // Send the path to the content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "set_path", path: message.path });
      }
    });

  } else if (message.error) {
    pathDisplay.textContent = `错误: ${message.error}`;
  }
});