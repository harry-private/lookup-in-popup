(async () => {
    class LookupBackground {

        async _constructor() {
            this.localStorageData = await lookupUtility.localStorageDataPromise();
            this.run();
        }

        run() {
            // handling the messages 
            this.messagesHandler();
            this.storageOnchange();

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

        onInstalledListener() {
            if (!('sources' in this.localStorageData)) {
                this.firsTime();
            }
        }

        firsTime() {
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

        storageOnchange() {
            chrome.storage.onChanged.addListener((changes, namespace) => {
                this.createLookupContextMenu();
            });
        }

        messagesHandler() {
            chrome.runtime.onMessage.addListener((request, sender, response) => {
                console.log(sender);
                if (request.method === 'open-lookup-popup') {
                    this.openLookupPopup(request.url);
                } else if (request.method === 'lookup-popup-close') {
                    chrome.tabs.remove(sender.tab.id);
                }
            });
        }

        // queryType "linkImage" | "selection"(default)
        openLookupPopup(url, queryType = "selection") {
            chrome.windows.create({
                    // state: "maximized",
                    height: (window.screen.height),
                    width: 600,
                    left: (screen.width / 2) - (600 / 2),
                    type: "popup",
                    url: url,
                    top: 0,
                },
                (win) => {
                    console.log(win);
                    if (/Firefox/.test(navigator.userAgent)) {
                        chrome.windows.update(win.id, {
                            // focused: true,
                            height: (window.screen.height - 30),
                            top: 0
                        });
                    }

                    // this setInterval and all is for firefox
                    let waitForProperUrl = setInterval(function() {
                        chrome.tabs.get(win.tabs[0].id, function(tab) {
                            if (tab.url !== "about:blank") {
                                clearInterval(waitForProperUrl);
                                chrome.tabs.executeScript(win.tabs[0].id, {
                                    code: `
                                  window.lookupPopupQueryType = "${queryType}";
                                `
                                });
                                chrome.tabs.executeScript(win.tabs[0].id, {
                                    file: "/data/content_scripts/extend.js"
                                });
                            }
                        });
                    }, 1000);

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
                                    this.openLookupPopup(url);

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
                    this.openLookupPopup(info.linkUrl, "linkImage");
                },
            });
        }

    }


    let lookupBackground = new LookupBackground();
    await lookupBackground._constructor();
    chrome.runtime.onInstalled.addListener(lookupBackground.onInstalledListener());
})()