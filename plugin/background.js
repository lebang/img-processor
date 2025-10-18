// This script acts as a bridge between the popup and the native application.

// Listen for messages from the popup script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "select_directory") {
    // The name of the native messaging host
    const hostName = "com.lebang.img_processor";

    // Send a message to the native application
    chrome.runtime.sendNativeMessage(hostName, 
      { text: "get_path" }, 
      (response) => {
        if (chrome.runtime.lastError) {
          // If there's an error, send it back to the popup
          chrome.runtime.sendMessage({ error: chrome.runtime.lastError.message });
        } else {
          // If successful, send the response (path) back to the popup
          chrome.runtime.sendMessage({ path: response.path });
        }
      }
    );
  }
  return true; // Indicates that the response will be sent asynchronously
});
