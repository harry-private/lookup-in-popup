(async () => {
    class LipBackground {


        async _constructor() {
            // I think it does not work if I put it after "await"
            this.onInstalled();

            this.localStorageData = await lipUtility.localStorageDataPromise();
            this.run();

            /**
             * Stores data related to opened popup windows
             * @example
             * [[6(WindowId) = {
             *    windowId: 6,
             *    tabId: 8,
             *    query: "",
             *    navbarState: "visible|hidden|removed" 
             * }]]
             */
            this.openedLipPopupWindows = {};

        }

        run() {
            // handling the messages 
            this.onMessages();
            this.onStorageChange();
            this.onWindowRemoved();

            // I am creating it, because the first time this id("lip-popup") won't exist,
            // and it will cause an error, when removing it, because the function which creates it,
            // first remove context menu with this id
            chrome.contextMenus.create({
                id: "lip-popup",
                title: 'Lookup In Popup',
                contexts: ["selection"]
            });
            this.createLipContextMenu();
            this.createLipContextMenuForLink();
        }





        onStorageChange() {
            chrome.storage.onChanged.addListener(async (changes, namespace) => {
                this.createLipContextMenu();
                this.localStorageData = await lipUtility.localStorageDataPromise(true);
                console.log("storage change");
            });
        }

        onMessages() {
            chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
                if (request.method === 'open-lip-popup-window') {
                    this.openLipPopupWindow(request.url, request.query);
                } else if (request.method === 'update_opened_lip_popup_window_data') {
                    this.updateOpenedLipPopupWindowData(request.changeData, sender.tab.windowId)
                } else if (request.method === 'close-lip-popup-window') {
                    chrome.tabs.remove(sender.tab.id);
                } else if (request.method === "extend") {
                    if (sender.tab.windowId in this.openedLipPopupWindows) {
                        sendResponse({
                            isLipPopupWindow: true,
                            currentLipPopupWindowData: this.openedLipPopupWindows[sender.tab.windowId]
                        });
                    } else { sendResponse({ isLipPopupWindow: false }); }
                }
                return true;

            });
        }

        openLipPopupWindow(url, query = "") {
            // windowCreateOptions


            let windowOptionsObj = this.windowCreateOptions(url);

            if (!this.localStorageData.popupWindow.isMultipleAllowed) {
                let openedWindow;
                if (!lipUtility.isObjEmpty(this.openedLipPopupWindows)) {
                    openedWindow = this.openedLipPopupWindows[Object.keys(this.openedLipPopupWindows)[0]];
                    this.updateOpenedLipPopupWindowData(['query', query], openedWindow.windowId);
                    chrome.tabs.update(openedWindow.tabId, { url: url }, () => {});
                    chrome.windows.update(openedWindow.windowId, { focused: true }, () => {});

                    return;
                }
            }

            console.log(windowOptionsObj);
            chrome.windows.create(
                windowOptionsObj,
                (win) => {
                    console.log(win);
                    this.openedLipPopupWindows[win.id] = {
                        windowId: win.tabs[0].windowId,
                        tabId: win.tabs[0].id,
                        query: query,
                        navbarState: "visible"
                    }

                    // if state is "maximized" don't run the firefox specific update
                    if (!(this.localStorageData.popupWindow.state == "maximized") && (/Firefox/.test(navigator.userAgent))) {
                        chrome.windows.update(win.id, {
                            // focused: true,
                            height: windowOptionsObj.height - 30,
                            /* top is ignored in firefox (bug in firefox) in windows.create,
                                that's why updating it here
                            */
                            top: windowOptionsObj.top
                        });
                    }


                });
        }

        windowCreateOptions(url) {
            let windowOptionsObj = {};
            let defaultWidth = 600;
            let commonOptions = {
                url: url,
                type: "popup",
            }

            if ((this.localStorageData.popupWindow.state == "maximized")) {
                windowOptionsObj = {
                    ...commonOptions,
                    state: this.localStorageData.popupWindow.state
                }
            } else {
                windowOptionsObj = {
                    ...commonOptions,
                    state: "normal",
                    height: (!Number.isInteger(parseInt(this.localStorageData.popupWindow.height)) ? (window.screen.height) : this.localStorageData.popupWindow.height),
                    width: (!Number.isInteger(parseInt(this.localStorageData.popupWindow.width)) ? defaultWidth : this.localStorageData.popupWindow.width),
                    top: (!Number.isInteger(parseInt(this.localStorageData.popupWindow.fromTop)) ? 0 : this.localStorageData.popupWindow.fromTop),
                    left: (!Number.isInteger(parseInt(this.localStorageData.popupWindow.fromLeft)) ? ((screen.width / 2) - (defaultWidth / 2)) : this.localStorageData.popupWindow.fromLeft)
                }
            }
            return windowOptionsObj;
        }
        updateOpenedLipPopupWindowData(changeData, windowId) {
            if (changeData[0] == 'query') {
                this.openedLipPopupWindows[windowId]["query"] = changeData[1];
            }
            if (changeData[0] == 'navbarState') {
                this.openedLipPopupWindows[windowId]["navbarState"] = changeData[1];

            }
        }
        onWindowRemoved() {
            chrome.windows.onRemoved.addListener((windowId) => {
                delete this.openedLipPopupWindows[windowId];
            });

        }
        createLipContextMenu() {

            chrome.contextMenus.remove('lip-popup', async () => {
                chrome.contextMenus.create({
                    // parentId: 'open-lip',
                    id: "lip-popup",
                    title: "Lookup In Popup \"%s\"",
                    contexts: ["selection"],
                    onclick: (info, tab) => {},
                });


                if (('sources' in this.localStorageData)) {
                    this.localStorageData.sources.forEach((source) => {
                        if (!source.isHidden) {
                            // options += `<option data-url="${source.url.replace(/"/g, '&quot;').replace(/'/g, '&#x27;')}">${source.title}</option>`
                            chrome.contextMenus.create({
                                parentId: 'lip-popup',
                                title: source.title,
                                contexts: ["selection"],
                                onclick: (info, tab) => {
                                    let url = lipUtility.createSourceUrlForNewWindow(source.url, info.selectionText);
                                    this.openLipPopupWindow(url, info.selectionText.trim());

                                },
                            });
                        }
                    });
                }
            });


        }

        createLipContextMenuForLink() {
            chrome.contextMenus.create({
                // parentId: 'open-lip',
                // id: "lip-popup",
                title: "Open link popup",
                contexts: ["link", "image", "video", "audio"],
                onclick: (info, tab) => {
                    this.openLipPopupWindow(info.linkUrl);
                },
            });
        }
        onInstalled() {
            chrome.runtime.onInstalled.addListener(async (details) => {
                console.log(details);
                if (details.reason == "install") {
                    this.firstTime();
                }
            });
        }

        firstTime() {
            chrome.storage.sync.set({
                sources: [{
                        "isPreInstalled": true,
                        "isHidden": false,
                        "id": "googleTranslate",
                        "title": "Google Translate",
                        "from": "auto", //default
                        "to": "en", //default
                        "url": lipPreInstalledSourcesData.googleTranslate.generateUrl("auto", "en")
                    },
                    {
                        "isPreInstalled": false, //it's true, but I will have to make so much effort to make it work, that's why I'm leaving it like this.
                        "isHidden": false,
                        "id": "google",
                        "title": "Google",
                        "url": "https://www.google.com/search?q=%s"

                    }, {
                        "isPreInstalled": true,
                        "isHidden": false,
                        "id": "cambridge",
                        "title": "Cambridge",
                        "fromTo": "english",
                        "url": lipPreInstalledSourcesData.cambridge.generateUrl("english")
                    }, {
                        "isPreInstalled": true,
                        "isHidden": false,
                        "id": "oxford",
                        "title": "Oxford",
                        "fromTo": "en",
                        "url": lipPreInstalledSourcesData.oxford.generateUrl("en")
                    }, {
                        "isPreInstalled": true,
                        "isHidden": false,
                        "id": "collins",
                        "title": "Collins",
                        "fromTo": "english",
                        "url": lipPreInstalledSourcesData.collins.generateUrl("english")
                    }, {
                        "isPreInstalled": true,
                        "isHidden": false,
                        "id": "longman",
                        "title": "Longman",
                        "fromTo": "english",
                        "url": lipPreInstalledSourcesData.longman.generateUrl("english")
                    },
                    {
                        "isPreInstalled": true,
                        "isHidden": false,
                        "id": "wikipedia",
                        "title": "Wikipedia",
                        "fromTo": "english",
                        "url": lipPreInstalledSourcesData.wikipedia.generateUrl("en")
                    },

                ],
                triggerKey: "none", // none|altKey|shiftKey|ctrlKey
                enableDisable: {
                    globally: "enable", //disable|enable
                    websiteAccessMode: "deny-mode", // deny-mode|allow-mode
                    denyList: [], // ["someUrl", "anotherUrl", "sommeAnotherUrl"]
                    allowList: [] // ["someUrl", "anotherUrl", "sommeAnotherUrl"]
                },
                popupWindow: {
                    isCloseOnEscAllowed: true,
                    isMultipleAllowed: true,
                    state: "normal", // normal|maximized (maximized cannot be combined with 'left', 'top', 'width', or 'height')
                    height: "", // integer|"" in px. empty means default
                    width: "", // integer|"" in px. empty means default
                    fromLeft: "", // integer|"" in px. empty means default
                    fromTop: "", // integer|"" in px. empty means default
                    isShowingNavbarAllowed: true
                },
                isShowingBubbleAllowed: true,
            }, async function() {
                // let lipBackground = new LipBackground();
                lipBackground.localStorageData = await lipUtility.localStorageDataPromise();

            });
        }
    }

    let lipBackground = new LipBackground();
    lipBackground._constructor();


})()