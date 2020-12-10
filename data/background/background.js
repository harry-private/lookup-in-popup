chrome.webRequest.onBeforeSendHeaders.addListener(
    function(details) {
        return { requestHeaders: details.requestHeaders };
    }, { urls: ["<all_urls>"] },
    ["blocking", "requestHeaders"]
);



chrome.webRequest.onHeadersReceived.addListener(function(info) {
        let initiator = (info.initiator || info.originUrl);
        if (
            (initiator == "https://twitter.com/sw.js" && info.type == "xmlhttprequest") ||
            (initiator == "https://twitter.com" && info.type == "xmlhttprequest") ||
            (initiator == 'https://github.com') ||
            (info.type == 'sub_frame')
        ) {
            var headers = info.responseHeaders;
            for (var i = headers.length - 1; i >= 0; --i) {
                var header = headers[i].name.toLowerCase();
                if (header == 'x-frame-options' || header == 'frame-options') {
                    headers.splice(i, 1); // Remove header
                }
                if (header == 'content-security-policy') {
                    headers.splice(i, 1); // Remove header
                }
            }
            return {
                responseHeaders: headers
            };
        }
    }, {
        urls: ["<all_urls>"], // Pattern to match all http(s) pages
        // types: ["sub_frame", 'xmlhttprequest', "script", "websocket"]
    },
    ['blocking', 'responseHeaders']
);
// chrome.webRequest.onCompleted(function() {
//     alert();
// })

chrome.runtime.onInstalled.addListener(function() {
    chrome.storage.sync.get(['sources', 'triggerKey', 'enableDisable'], result => {
        if (!('sources' in result)) {
            firsTime();
        }
    });
});


function firsTime() {
    chrome.storage.sync.set({
        sources: [{
                "preInstalled": "true",
                "id": "googleTranslate",
                "title": "Google Translate",
                "isGoogleTranslate": true,
                "from": "auto", //default
                "to": "en", //default
                "url": sourcesData.googleTranslate.generateUrl("auto", "en")
            },
            {
                "preInstalled": false, //it's true, but I will have to make so much effort to make it work, that's why I'm leaving it like this.
                "id": "google",
                "title": "Google",
                "url": "https://www.google.com/search?q=%s"

            }, {
                "preInstalled": "true",
                "id": "cambridge",
                "title": "Cambridge",
                "fromTo": "english",
                "url": sourcesData.cambridge.generateUrl("english")
            }, {
                "preInstalled": "true",
                "id": "oxford",
                "title": "Oxford",
                "fromTo": "en",
                "url": sourcesData.oxford.generateUrl("en")
            }, {
                "preInstalled": "true",
                "id": "collins",
                "title": "Collins",
                "fromTo": "english",
                "url": sourcesData.collins.generateUrl("english")
            }, {
                "preInstalled": "true",
                "id": "longman",
                "title": "Longman",
                "fromTo": "english",
                "url": sourcesData.longman.generateUrl("english")
            },
            {
                "preInstalled": "true",
                "id": "wikipedia",
                "title": "Wikipedia",
                "fromTo": "english",
                "url": sourcesData.wikipedia.generateUrl("en")
            },

        ],
        sourcesHidden: [],
        triggerKey: "none",
        enableDisable: {
            globally: "enable", //disabled|enabled
            listMode: "blacklist-mode", //blacklist-mode|whitelist-mode
            blacklist: [], //["someUrl", "anotherUrl", "sommeAnotherUrl"]
            whitelist: [] //["someUrl", "anotherUrl", "sommeAnotherUrl"]
        },
        showChooseSourceOptions: 'yes'
    });
}