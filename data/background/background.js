(async () => {
    chrome.runtime.onInstalled.addListener(async () => {
        let localStorageData = await lookupUtility.localStorageDataPromise();
        if (!('sources' in localStorageData)) {
            firstTime();
        }
    });

    function firstTime() {
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
        }, function() {
            // createLookupContextMenu();
        });
    }
    class LookupBackground {


        async _constructor() {
            this.localStorageData = await lookupUtility.localStorageDataPromise();

            this.tempSettings = {
                popupWindowMultipleAllowed: false,
                popupWindowState: "", // maximized, or fullscreen (these two cannot be combined with 'left', 'top', 'width', or 'height')
                popupWindowHeight: "", // in px. empty means default
                popupWindowWidth: "", // in px. empty means default
                popupWindowTop: "", // in px. empty means default
                popupWindowLeft: "", // in px. empty means default

            }

            this.run();

            /*[[WindId = { windowId: 6, tabId: 8, query: "", navbarState: "visible|hidden|removed" }]]*/
            this.openedLookupPopupWindows = {};

        }

        run() {
            // handling the messages 
            this.onMessages();
            this.onStorageChange();
            this.onWindowRemoved();

            // I am creating it, because the first time this id("lookup-popup") won't exist,
            // and it will cause an error, when removing it, because the function which creates it,
            // first remove context menu with this id
            chrome.contextMenus.create({
                id: "lookup-popup",
                title: 'Lookup',
                contexts: ["selection"]
            });
            this.createLookupContextMenu();
            this.createLookupContextMenuForLinkImage();
        }




        onStorageChange() {
            chrome.storage.onChanged.addListener((changes, namespace) => {
                this.createLookupContextMenu();
            });
        }

        onMessages() {
            chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
                if (request.method === 'open-lookup-popup-window') {
                    this.openLookupPopupWindow(request.url, request.query);
                } else if (request.method === 'update_opened_lookup_popup_window_data') {
                    this.updateOpenedLookupPopupWindowData(request.changeData, sender.tab.windowId)
                } else if (request.method === 'close-lookup-popup-window') {
                    chrome.tabs.remove(sender.tab.id);
                } else if (request.method === "extend") {
                    if (sender.tab.windowId in this.openedLookupPopupWindows) {
                        sendResponse(this.openedLookupPopupWindows[sender.tab.windowId]);

                    }
                }
            });
        }

        openLookupPopupWindow(url, query = "") {
            // windowCreateOptions


            let windowOptionsObj = this.windowCreateOptions(url);

            if (!this.tempSettings.popupWindowMultipleAllowed) {
                let openedWindow;
                if (!lookupUtility.isObjEmpty(this.openedLookupPopupWindows)) {
                    openedWindow = this.openedLookupPopupWindows[Object.keys(this.openedLookupPopupWindows)[0]];
                    this.updateOpenedLookupPopupWindowData(['query', query], openedWindow.windowId);
                    chrome.tabs.update(openedWindow.tabId, { url: url }, () => {});
                    chrome.windows.update(openedWindow.windowId, { focused: true }, () => {});

                    return;
                }
            }

            console.log(windowOptionsObj);
            chrome.windows.create(
                windowOptionsObj,
                (win) => {
                    this.openedLookupPopupWindows[win.id] = {
                        windowId: win.tabs[0].windowId,
                        tabId: win.tabs[0].id,
                        query: query,
                        navbarState: "visible"
                    }

                    // if state is "maximized", or "fullscreen" don't run the firefox specific update
                    if (!(this.tempSettings.popupWindowState == "maximized") || (this.tempSettings.popupWindowState == "fullscreen")) {
                        if (/Firefox/.test(navigator.userAgent)) {
                            chrome.windows.update(win.id, {
                                // focused: true,
                                height: windowOptionsObj.height - 30,
                                top: 0
                            });
                        }
                    }


                });
        }

        windowCreateOptions(url) {
            let windowOptionsObj = {};
            let defaultWidth = 600;
            windowOptionsObj.url = url;
            windowOptionsObj.type = "popup";
            if ((this.tempSettings.popupWindowState == "maximized") || (this.tempSettings.popupWindowState == "fullscreen")) {
                windowOptionsObj.state = this.tempSettings.popupWindowState;
            } else {

                windowOptionsObj.state = "normal";

                if ((this.tempSettings.popupWindowHeight || this.tempSettings.popupWindowHeight.length !== 0) && !isNaN(this.tempSettings.popupWindowHeight)) {
                    windowOptionsObj.height = parseInt(this.tempSettings.popupWindowHeight);
                } else {
                    windowOptionsObj.height = (window.screen.height);
                }

                if ((this.tempSettings.popupWindowWidth || this.tempSettings.popupWindowWidth.length !== 0) && !isNaN(this.tempSettings.popupWindowWidth)) {
                    windowOptionsObj.width = parseInt(this.tempSettings.popupWindowWidth);
                } else {
                    windowOptionsObj.width = defaultWidth;
                }

                if ((this.tempSettings.popupWindowTop || this.tempSettings.popupWindowTop.length !== 0) && !isNaN(this.tempSettings.popupWindowTop)) {
                    windowOptionsObj.top = parseInt(this.tempSettings.popupWindowTop);
                } else {
                    windowOptionsObj.top = 0;
                }

                if ((this.tempSettings.popupWindowLeft || this.tempSettings.popupWindowLeft.length !== 0) && !isNaN(this.tempSettings.popupWindowLeft)) {
                    windowOptionsObj.left = parseInt(this.tempSettings.popupWindowLeft);
                } else {
                    windowOptionsObj.left = (screen.width / 2) - (defaultWidth / 2);
                }
            }
            return windowOptionsObj;
        }

        updateOpenedLookupPopupWindowData(changeData, windowId) {
            if (changeData[0] == 'query') {
                this.openedLookupPopupWindows[windowId]["query"] = changeData[1];
            }
            if (changeData[0] == 'navbarState') {
                this.openedLookupPopupWindows[windowId]["navbarState"] = changeData[1];

            }
        }
        onWindowRemoved() {
            chrome.windows.onRemoved.addListener((windowId) => {
                delete this.openedLookupPopupWindows[windowId];
            });

        }
        createLookupContextMenu() {

            chrome.contextMenus.remove('lookup-popup', async () => {
                chrome.contextMenus.create({
                    // parentId: 'open-lookup',
                    id: "lookup-popup",
                    title: "Lookup \"%s\"",
                    contexts: ["selection"],
                    onclick: (info, tab) => {},
                });


                if (('sources' in this.localStorageData)) {
                    this.localStorageData.sources.forEach((source) => {
                        if (!source.isHidden) {
                            // options += `<option data-url="${source.url.replace(/"/g, '&quot;').replace(/'/g, '&#x27;')}">${source.title}</option>`
                            chrome.contextMenus.create({
                                parentId: 'lookup-popup',
                                title: source.title,
                                contexts: ["selection"],
                                onclick: (info, tab) => {
                                    let url = lookupUtility.createSourceUrlForNewWindow(source.url, info.selectionText);
                                    this.openLookupPopupWindow(url, info.selectionText.trim());

                                },
                            });
                        }
                    });
                }
            });


        }

        createLookupContextMenuForLinkImage() {
            chrome.contextMenus.create({
                // parentId: 'open-lookup',
                // id: "lookup-popup",
                title: "Lookup in popup",
                contexts: ["link", "image", "video", "audio"],
                onclick: (info, tab) => {
                    this.openLookupPopupWindow(info.linkUrl);
                },
            });
        }

    }


    let lookupBackground = new LookupBackground();
    await lookupBackground._constructor();

})()