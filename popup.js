document.getElementById("downloadButton").addEventListener("click", () => {
  chrome.runtime.sendMessage({ command: "saveHAR" });
});
