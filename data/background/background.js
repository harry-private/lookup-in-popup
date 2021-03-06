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
       *    navbarState: "visible"|"hidden"|"removed", 
       *    popupFor: "textSelection"|"link"|"media"
       * }]]
       */
      this.openedLipPopupWindows = {};

    }

    run() {
      // handling the messages 
      this.onMessages();
      this.onStorageChange();
      this.onWindowRemoved();


      this.createLipContextMenus();
    }






    onStorageChange() {
      chrome.storage.onChanged.addListener(async (changes, namespace) => {
        this.localStorageData = await lipUtility.localStorageDataPromise(true);
        this.createLipContextMenus();
      });
    }

    onMessages() {
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.method === 'open-lip-popup-window') {
          this.openLipPopupWindow(request.url, request.query, "textSelection");
        } else if (request.method === 'update_opened_lip_popup_window_data') {
          this.updateOpenedLipPopupWindowData(request.change, sender.tab.windowId)
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
    /**
     * Open popup window
     * @param {String} url 
     * @param {Sting} query 
     * @param {"textSelection"|"link"|"media"} popupFor
     */
    openLipPopupWindow(url, query = "", popupFor) {
      // windowCreateOptions

      let windowOptionsObj = this.windowCreateOptions(url);

      if (!this.localStorageData.popupWindow.isMultipleAllowed) {
        let openedWindow;
        if (!lipUtility.isObjEmpty(this.openedLipPopupWindows)) {
          openedWindow = this.openedLipPopupWindows[Object.keys(this.openedLipPopupWindows)[0]];
          this.updateOpenedLipPopupWindowData({ type: 'query', data: query }, openedWindow.windowId);
          this.updateOpenedLipPopupWindowData({ type: 'popupFor', data: popupFor }, openedWindow.windowId);
          chrome.tabs.update(openedWindow.tabId, { url: url }, () => { });
          chrome.windows.update(openedWindow.windowId, { focused: true }, () => { });

          return;
        }
      }

      chrome.windows.create(
        windowOptionsObj,
        (win) => {
          this.openedLipPopupWindows[win.id] = {
            windowId: win.tabs[0].windowId,
            tabId: win.tabs[0].id,
            query: query,
            navbarState: "visible",
            popupFor: popupFor
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
          height: parseInt(!Number.isInteger(parseInt(this.localStorageData.popupWindow.height)) ? (window.screen.height) : this.localStorageData.popupWindow.height),
          width: parseInt(!Number.isInteger(parseInt(this.localStorageData.popupWindow.width)) ? defaultWidth : this.localStorageData.popupWindow.width),
          top: parseInt(!Number.isInteger(parseInt(this.localStorageData.popupWindow.fromTop)) ? 0 : this.localStorageData.popupWindow.fromTop),
          left: parseInt(!Number.isInteger(parseInt(this.localStorageData.popupWindow.fromLeft)) ? ((screen.width / 2) - (defaultWidth / 2)) : this.localStorageData.popupWindow.fromLeft)
        }
      }
      return windowOptionsObj;
    }
    updateOpenedLipPopupWindowData(change, windowId) {
      if (change.type == 'query') {
        this.openedLipPopupWindows[windowId]["query"] = change.data;
      } else if (change.type == 'navbarState') {
        this.openedLipPopupWindows[windowId]["navbarState"] = change.data;
      } else if (change.type == 'popupFor') {
        this.openedLipPopupWindows[windowId]['popupFor'] = change.data;
      }
    }
    onWindowRemoved() {
      chrome.windows.onRemoved.addListener((windowId) => {
        delete this.openedLipPopupWindows[windowId];
      });

    }

    createLipContextMenus() {
      chrome.contextMenus.removeAll(() => {
        this.createLipContextMenu();
        this.createLipContextMenuForLink();
        /* // Disabling this feature, I may enable it in future
            this.createLipContextMenuForMedia();
        */
      });

    }

    createLipContextMenu() {

      chrome.contextMenus.create({
        id: "lip-popup",
        title: "Lookup in popup \"%s\"",
        contexts: ["selection"],
        onclick: (info, tab) => { },
      });


      if (('searchEngines' in this.localStorageData)) {
        this.localStorageData.searchEngines.forEach((searchEngine) => {
          if (!searchEngine.isHidden) {
            chrome.contextMenus.create({
              parentId: 'lip-popup',
              title: searchEngine.title,
              contexts: ["selection"],
              onclick: (info, tab) => {
                let url = lipUtility.createSearchEngineUrlForNewWindow(searchEngine.url, info.selectionText);
                this.openLipPopupWindow(url, info.selectionText.trim(), "textSelection");

              },
            });
          }
        });
      }


    }

    createLipContextMenuForLink() {
      chrome.contextMenus.create({
        title: "Open link in popup",
        contexts: ["link"],
        onclick: (info, tab) => {
          this.openLipPopupWindow(info.linkUrl, "", "link");
        },
      });
    }
    /*         // Disabling this feature, I may enable it in future
            createLipContextMenuForMedia() {
                chrome.contextMenus.create({
                    title: "Open media in popup",
                    contexts: ["image", "video", "audio"],
                    onclick: (info, tab) => {
                        this.openLipPopupWindow(info.srcUrl, "", "media");
                    },
                });
            } */

    onInstalled() {
      chrome.runtime.onInstalled.addListener(async (details) => {
        if (details.reason == "install") {
          this.firstTime();
        }
      });
    }

    firstTime() {
      chrome.storage.sync.set({
        searchEngines: [{
          "isPreInstalled": true,
          "isHidden": false,
          "id": "googleTranslate",
          "title": "Google Translate",
          "from": "auto", //default
          "to": "en", //default
          "url": lipPreInstalledSearchEnginesData.googleTranslate.generateUrl("auto", "en")
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
          "url": lipPreInstalledSearchEnginesData.cambridge.generateUrl("english")
        }, {
          "isPreInstalled": true,
          "isHidden": false,
          "id": "oxford",
          "title": "Oxford",
          "fromTo": "en",
          "url": lipPreInstalledSearchEnginesData.oxford.generateUrl("en")
        }, {
          "isPreInstalled": true,
          "isHidden": false,
          "id": "collins",
          "title": "Collins",
          "fromTo": "english",
          "url": lipPreInstalledSearchEnginesData.collins.generateUrl("english")
        }, {
          "isPreInstalled": true,
          "isHidden": false,
          "id": "longman",
          "title": "Longman",
          "fromTo": "english",
          "url": lipPreInstalledSearchEnginesData.longman.generateUrl("english")
        },
        {
          "isPreInstalled": true,
          "isHidden": false,
          "id": "wikipedia",
          "title": "Wikipedia",
          "fromTo": "english",
          "url": lipPreInstalledSearchEnginesData.wikipedia.generateUrl("en")
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
          isShowingNavbarAllowed: true,
          isShowingNavbarForLinkAllowed: false
        },
        isShowingBubbleAllowed: true,
      }, async () => {
        this.localStorageData = await lipUtility.localStorageDataPromise();
        // On Firefox sometimes onStorageChange-listener does not work when the extension
        // is first installed, that is why creating context menu here too,
        // I don't why, but without setTimeout, searchEngines items are added multiple
        // times, or an error is occurred "duplicate id" 
        setTimeout(() => { this.createLipContextMenus(); }, 1000);
      });
    }
  }

  let lipBackground = new LipBackground();
  lipBackground._constructor();


})()