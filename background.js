const HAR_VERSION = "1.2";

let requests = [];
let requestIdMap = new Map();

chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    let request = {
      startedDateTime: new Date().toISOString(),
      time: 0,
      request: {
        method: details.method,
        url: details.url,
        headers: details.requestHeaders,
      },
      response: {
        status: 0,
        statusText: "",
        headers: [],
      },
      cache: {},
      timings: {
        blocked: -1,
        dns: -1,
        connect: -1,
        send: -1,
        wait: -1,
        receive: -1,
      },
    };
    requestIdMap.set(details.requestId, request);
    requests.push(request);
  },
  { urls: ["<all_urls>"] },
  ["requestHeaders"]
);

chrome.webRequest.onCompleted.addListener(
  (details) => {
    let request = requestIdMap.get(details.requestId);
    if (request) {
      request.response.status = details.statusCode;
      request.response.statusText = details.statusLine;
      request.response.headers = details.responseHeaders;
      requestIdMap.delete(details.requestId);
    }
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders"]
);

chrome.webRequest.onErrorOccurred.addListener(
  (details) => {
    requestIdMap.delete(details.requestId);
  },
  { urls: ["<all_urls>"] }
);

function saveHAR(format) {
  let har = {
    log: {
      version: HAR_VERSION,
      creator: {
        name: "HAR Saver Extension",
        version: "1.0",
      },
      entries: requests,
    },
  };
  let harString = JSON.stringify(har, null, 2);
  let blob = new Blob([harString], { type: "application/json" });
  let reader = new FileReader();
  reader.onloadend = function () {
    let dataUrl = reader.result;
    chrome.downloads.download({
      url: dataUrl,
      filename: `network-data.${format}`,
      conflictAction: "overwrite",
      saveAs: false,
    });
  };
  reader.readAsDataURL(blob);
}

chrome.commands.onCommand.addListener((command) => {
  if (command === "saveHAR") {
    saveHAR("json");
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.command === "saveHAR") {
    saveHAR(message.format);
  }
});
