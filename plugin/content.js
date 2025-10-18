
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "set_path" && message.path) {
    const inputElement = document.querySelector('input[name="folderPath"]');
    if (inputElement) {
      inputElement.value = message.path;
      // Optional: a visual confirmation for the user
      inputElement.style.backgroundColor = '#e6ffed';
      setTimeout(() => {
        inputElement.style.backgroundColor = '';
      }, 1500);
      sendResponse({status: "success"});
    } else {
      sendResponse({status: "error", reason: "input not found"});
    }
  }
  return true; // Keep the message channel open for async response
});
