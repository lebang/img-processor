document.getElementById('select-dir-btn').addEventListener('click', () => {
  // Send a message to the background script to initiate the process
  chrome.runtime.sendMessage({ action: "select_directory" });
});

// Listen for messages from the background script (with the result)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const pathDisplay = document.getElementById('path-display');
  if (message.path) {
    pathDisplay.textContent = `选择的路径: ${message.path}`;

    // Find the iframe and reload it with the new path as a query parameter
    const iframe = document.querySelector('iframe');
    if (iframe) {
      const newUrl = `http://localhost:3000?folderPath=${encodeURIComponent(message.path)}`;
      iframe.src = newUrl;
    }

  } else if (message.error) {
    pathDisplay.textContent = `错误: ${message.error}`;
  }
});