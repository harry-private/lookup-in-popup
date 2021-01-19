(async () => {

    class LipOptions {

        async _constructor() {

            this.localStorageData = await lipUtility.localStorageDataPromise();
            this.flashMessagesElem = document.querySelector('.flash-messages');
            this.sourcesSettingsElem = document.querySelector("#sources-settings");
            this.saveSettingsElem = document.querySelector("#save-settings");
            this.triggerKeyElem = document.querySelector("#trigger-key");
            this.enableDisableGloballyElem = document.querySelector("#enable-disable-globally");

            this.popupWindowIsCloseOnEscAllowedElem = document.querySelector("#popup-window-is-close-on-esc-allowed");
            this.popupWindowIsMultipleAllowedElem = document.querySelector("#popup-window-is-multiple-allowed");
            this.popupWindowStateElem = document.querySelector("#popup-window-state");
            this.popupWindowWidthElem = document.querySelector("#popup-window-width");
            this.popupWindowHeightElem = document.querySelector("#popup-window-height");
            this.popupWindowFromLeftElem = document.querySelector("#popup-window-from-left");
            this.popupWindowFromTopElem = document.querySelector("#popup-window-from-top");
            this.popupWindowIsShowingNavbarAllowedElem = document.querySelector("#popup-window-is-showing-navbar-allowed");

            this.enableDisableWebsiteWiseElem = document.querySelector("#enable-disable-website-wise");
            this.blackWhiteListFormElem = document.querySelector("#black-white-list-form");
            this.blacklistElem = document.querySelector("#blacklist");
            this.whitelistElem = document.querySelector("#whitelist");

            this.isShowingBubbleAllowedElem = document.querySelector("#is-showing-bubble-allowed");
            // document.body.style.height = (screen.height - 120) + "px";

            this.run();
        }

        run() {

            this.createSourcesSettingsLayout();
            this.sortSources();
            this.tooltip();
            this.toggleNextSibling();
            this.addEventListenerToSourceSideOptions();
            this.addEventListenerToSourceEditForm();
            this.addEventListenerToBlackWhiteListRemoveBtn();
            this.addNewSource();

            this.saveSettings();
            this.addEventListenerToBlackWhiteListMode();
            this.addWebsiteToBlackWhiteList();
        }
        saveSettings() {
            this.saveSettingsElem.addEventListener("click", () => {

                const sourceEditFormElems = this.sourcesSettingsElem.querySelectorAll(".source-edit-form");
                const blacklistWebsiteElems = document.querySelectorAll("#blacklist .website");
                const whitelistWebsiteElems = document.querySelectorAll("#whitelist .website");

                // values from inputs
                let sourcesToStore = this.getSourcesFromInputs(sourceEditFormElems);
                let triggerKeyToStore = ((["none", "ctrlKey", "shiftKey", "altKey"].includes(this.triggerKeyElem.value)) ? this.triggerKeyElem.value : "none");
                let enableDisableGloballyToStore = ((this.enableDisableGloballyElem.value == "disable") ? "disable" : "enable");
                let blackWhiteListModeToStore = ((this.blackWhiteListFormElem['mode'].value == "whitelist-mode") ? "whitelist-mode" : "blacklist-mode");
                let blackWhiteListToStore = this.getBlackWhiteList(blacklistWebsiteElems, whitelistWebsiteElems);
                let isShowingBubbleAllowedToStore = (this.isShowingBubbleAllowedElem.value == "true");

                let popupWindowIsCloseOnEscAllowedToStore = (this.popupWindowIsCloseOnEscAllowedElem.value == "true");
                let popupWindowIsMultipleAllowedToStore = (this.popupWindowIsMultipleAllowedElem.value == "true");
                let popupWindowSateToStore = (["normal", "maximized"].includes(this.popupWindowStateElem.value) ? this.popupWindowStateElem.value : "normal");
                let popupWindowWidthToStore = (!Number.isInteger(parseInt(this.popupWindowWidthElem.value)) ? "" : parseInt(this.popupWindowWidthElem.value));
                let popupWindowHeightToStore = (!Number.isInteger(parseInt(this.popupWindowHeightElem.value)) ? "" : parseInt(this.popupWindowHeightElem.value));
                let popupWindowFromLeftToStore = (!Number.isInteger(parseInt(this.popupWindowFromLeftElem.value)) ? "" : parseInt(this.popupWindowFromLeftElem.value));
                let popupWindowFromTopToStore = (!Number.isInteger(parseInt(this.popupWindowFromTopElem.value)) ? "" : parseInt(this.popupWindowFromTopElem.value));
                let popupWindowIsShowingNavbarAllowedToStore = (this.popupWindowIsShowingNavbarAllowedElem.value == "true");

                if (sourcesToStore.error) { return; }

                // save the sources to the local storage
                chrome.storage.sync.set({
                    sources: sourcesToStore.sourcesToStore,
                    triggerKey: triggerKeyToStore,
                    enableDisable: {
                        globally: enableDisableGloballyToStore,
                        blackWhiteListMode: blackWhiteListModeToStore,
                        blacklist: blackWhiteListToStore[0],
                        whitelist: blackWhiteListToStore[1],
                    },
                    popupWindow: {

                        isCloseOnEscAllowed: popupWindowIsCloseOnEscAllowedToStore,
                        isMultipleAllowed: popupWindowIsMultipleAllowedToStore,
                        state: popupWindowSateToStore,
                        height: popupWindowHeightToStore,
                        width: popupWindowWidthToStore,
                        fromLeft: popupWindowFromLeftToStore,
                        fromTop: popupWindowFromTopToStore,
                        isShowingNavbarAllowed: popupWindowIsShowingNavbarAllowedToStore,
                    },
                    isShowingBubbleAllowed: isShowingBubbleAllowedToStore

                });

                this.showFlashMessages(["Settings Saved!"]);
            });
        }

        // CONSIDER Changing the name to "createSettingsLayout()"
        createSourcesSettingsLayout() {
            this.localStorageData.sources.forEach((storedSource) => {
                let fromTo;

                if (storedSource.isPreInstalled) {
                    if (storedSource.id === "googleTranslate") {
                        let optionFrom = '';
                        let optionTo = '';
                        lipPreInstalledSourcesData[storedSource.id].from.forEach((language) => {
                            let selectedFrom = (storedSource.from == language[1]) ? "selected" : "";
                            let selectedTo = (storedSource.to == language[1]) ? "selected" : "";
                            optionFrom += `<option ${selectedFrom}  value="${language[1]}">${language[0]}</option>`;
                            optionTo += `<option ${selectedTo} value="${language[1]}">${language[0]}</option>`;
                        });
                        fromTo = `
                          <label> <strong>Select Language (From)</strong> </label><br>
                          <select class="source-from">${optionFrom}</select><br><br>
                          <label> <strong>Select Language (To)</strong> </label><br>
                          <select class="source-to">${optionTo}</select>
                        `;
                    } else {
                        let optionFromTo = '';

                        // lipPreInstalledSourcesData is from lip_pre_installed_sources_data.js
                        lipPreInstalledSourcesData[storedSource.id].fromTo.forEach((language) => {
                            let selectedFromTo = (storedSource.fromTo == language[1]) ? "selected" : "";
                            optionFromTo += `<option value="${language[1]}" ${selectedFromTo}>${language[0]}</option>`;
                        });
                        fromTo = `
                          <label><strong>Select Language</strong> </label><br>
                          <select class="source-from-to">${optionFromTo}</select>
                        `;
                    }
                }

                let template = this.templateForSource({
                    isPreInstalled: storedSource.isPreInstalled,
                    isHidden: storedSource.isHidden,
                    fromTo: fromTo,
                    title: storedSource.title,
                    url: storedSource.url,
                    id: storedSource.id
                })
                this.sourcesSettingsElem.insertAdjacentHTML('beforeend', template);
            });
            this.changeUrlOfPreInstalledSources();

            this.localStorageData.enableDisable.blacklist.forEach((blacklist) => {
                const blackWhiteListTemplate = this.templateForBlackWhitelist(blacklist);
                this.blacklistElem.querySelector('.main').insertAdjacentHTML('afterbegin', blackWhiteListTemplate);
            });
            this.localStorageData.enableDisable.whitelist.forEach((whitelist) => {
                const websiteTemplate = this.templateForBlackWhitelist(whitelist);
                this.whitelistElem.querySelector('.main').insertAdjacentHTML('afterbegin', websiteTemplate);
            });
            // set default selected option that gotten from storage

            console.log(this.localStorageData.popupWindow);
            this.popupWindowIsCloseOnEscAllowedElem.value = this.localStorageData.popupWindow.isCloseOnEscAllowed;
            this.popupWindowIsMultipleAllowedElem.value = this.localStorageData.popupWindow.isMultipleAllowed;
            this.popupWindowStateElem.value = this.localStorageData.popupWindow.state;
            this.popupWindowWidthElem.value = this.localStorageData.popupWindow.width;
            this.popupWindowHeightElem.value = this.localStorageData.popupWindow.height;
            this.popupWindowFromLeftElem.value = this.localStorageData.popupWindow.fromLeft;
            this.popupWindowFromTopElem.value = this.localStorageData.popupWindow.fromTop;
            this.popupWindowIsShowingNavbarAllowedElem.value = this.localStorageData.popupWindow.isShowingNavbarAllowed;

            this.triggerKeyElem.value = this.localStorageData.triggerKey;
            this.enableDisableGloballyElem.value = this.localStorageData.enableDisable.globally;
            this.blackWhiteListFormElem['mode'].value = this.localStorageData.enableDisable.blackWhiteListMode;
            this.changeBlackWhiteList();
            this.isShowingBubbleAllowedElem.value = this.localStorageData.isShowingBubbleAllowed;
        }

        getSourcesFromInputs(sourceEditFormElems) {
            let sourcesToStore = [];
            let error = false;
            [...sourceEditFormElems].forEach((sourceEditForm) => {
                let sourcesToStoreObj = {};
                // TODO Trim the values
                let sourceTitle = sourceEditForm["title"].value;
                let sourceUrl = sourceEditForm["url"].value;

                let sourceId = sourceEditForm.dataset.id;
                if ((sourceTitle.length >= 30) || (sourceTitle.length <= 0)) {
                    let invalidTitleLength = `The title you edited must be between 1 to 30`;
                    this.showFlashMessages([invalidTitleLength], "red");
                    error = true;
                } else if (!lipUtility.isValidURL(sourceUrl)) {
                    let invalidUrl = `The URL you edited must be valid`;
                    this.showFlashMessages([invalidUrl], "red");
                    error = true;
                } else {
                    let sourceIsPreInstalled = (sourceEditForm.dataset.isPreInstalled == 'true');
                    let sourceIsHidden = (sourceEditForm.dataset.isHidden == 'true');



                    if (sourceIsPreInstalled) {
                        if (sourceId == 'googleTranslate') {
                            let sourceFrom = sourceEditForm.querySelector(".source-from");
                            let sourceTo = sourceEditForm.querySelector(".source-to");
                            let sourceFromSelected = sourceFrom.value;
                            let sourceToSelected = sourceTo.value;
                            sourcesToStoreObj.from = sourceFromSelected;
                            sourcesToStoreObj.to = sourceToSelected;
                        } else {
                            let sourceFromTo = sourceEditForm.querySelector(".source-from-to");
                            let sourceFromToSelected = sourceFromTo.value;
                            sourcesToStoreObj.fromTo = sourceFromToSelected;
                        }
                    }



                    sourcesToStoreObj.title = sourceTitle;
                    sourcesToStoreObj.id = sourceId;
                    sourcesToStoreObj.url = sourceUrl;
                    sourcesToStoreObj.isPreInstalled = sourceIsPreInstalled;
                    sourcesToStoreObj.isHidden = sourceIsHidden;
                    sourcesToStore.push(sourcesToStoreObj);
                }
            });
            return { error, sourcesToStore: sourcesToStore };
        }

        addNewSource() {
            let addNewSourceFormElem = document.querySelector("#add-new-source-form");

            addNewSourceFormElem.addEventListener('submit', (e) => {
                e.preventDefault();
                let error = {};
                // let id = ('_' + Math.random().toString(36).substr(2, 9));

                let title = addNewSourceFormElem['title'].value.trim();
                let url = addNewSourceFormElem['url'].value.trim();

                if ((title.length >= 30) || (title.length <= 0)) {
                    error.invalidTitleLength = 'Title length should be between 1 to 30';
                    this.showFlashMessages([error.invalidTitleLength], "red")
                } else if (!lipUtility.isValidURL(url)) {
                    error.invalidUrl = "URL must be valid";
                    this.showFlashMessages([error.invalidUrl], "red")
                } else {
                    addNewSourceFormElem.reset();
                    let newSourceTemplate = this.templateForSource({ title, url, });
                    this.sourcesSettingsElem.insertAdjacentHTML('afterbegin', newSourceTemplate);
                    this.showFlashMessages(["New source is added, please save the changes."]);

                    // add eventListener to newly created source
                    this.addEventListenerToSourceSideOptions(true);
                    this.addEventListenerToSourceEditForm(true);

                }

                if (!lipUtility.isObjEmpty(error)) {
                    // console.log(error)

                }

            })
        }



        addEventListenerToBlackWhiteListMode() {
            this.blackWhiteListFormElem["mode"].addEventListener("change", this.changeBlackWhiteList.bind(this))
        }

        changeBlackWhiteList(e) {
            // this will decide which list will be visible, and which list will be hidden
            if (this.blackWhiteListFormElem['mode'].value == "blacklist-mode") {
                this.blacklistElem.style.display = "block";
                this.whitelistElem.style.display = "none";
            } else if (this.blackWhiteListFormElem['mode'].value == "whitelist-mode") {
                this.whitelistElem.style.display = "block";
                this.blacklistElem.style.display = "none";
            }

        }

        addWebsiteToBlackWhiteList() {
            this.blackWhiteListFormElem.addEventListener("submit", (e) => {
                e.preventDefault();
                if (!lipUtility.isValidURL(this.blackWhiteListFormElem['url'].value)) {
                    let invalidUrl = `The URL is invalid.`;
                    this.showFlashMessages([invalidUrl], "red");
                } else {
                    const blackWhiteListTemplate = this.templateForBlackWhitelist(this.blackWhiteListFormElem['url'].value);
                    if (this.blackWhiteListFormElem['mode'].value == "blacklist-mode") {
                        this.blacklistElem.querySelector('.main').insertAdjacentHTML('afterbegin', blackWhiteListTemplate);
                    } else if (this.blackWhiteListFormElem['mode'].value == "whitelist-mode") {
                        this.whitelistElem.querySelector('.main').insertAdjacentHTML('afterbegin', blackWhiteListTemplate);
                    }
                    this.addEventListenerToBlackWhiteListRemoveBtn(true);
                    this.blackWhiteListFormElem['url'].value = "";
                    this.showFlashMessages(["New website is added, please save the changes."]);

                }
            });

        }



        getBlackWhiteList(blacklistWebsiteElems, whitelistWebsiteElems) {
            let blacklistWebsites = [];
            let whitelistWebsites = [];

            let blacklistWebsite;
            let whitelistWebsite;
            blacklistWebsiteElems.forEach((website) => {
                blacklistWebsite = new URL(website.innerText);
                blacklistWebsite = blacklistWebsite.protocol + '//' + lipUtility.removeWWWBeginningOfHostname(blacklistWebsite.hostname);
                blacklistWebsites.push(blacklistWebsite.toLowerCase());
            });
            whitelistWebsiteElems.forEach((website) => {
                whitelistWebsite = new URL(website.innerText);
                whitelistWebsite = whitelistWebsite.protocol + '//' + lipUtility.removeWWWBeginningOfHostname(whitelistWebsite.hostname);

                whitelistWebsites.push(lipUtility.removeWWWBeginningOfHostname(whitelistWebsite.toLowerCase()));
            });
            // remove duplicates 
            let uniqueBlacklistWebsites = [...new Set(blacklistWebsites)];
            let uniqueWhitelistWebsite = [...new Set(whitelistWebsites)];

            return [uniqueBlacklistWebsites.reverse(), uniqueWhitelistWebsite.reverse()];

        }

        /* Popup window start */

        /* Popup window end */
        templateForBlackWhitelist(url) {
            let newUrl = new URL(url);
            return (`
              <div class="black-white-list-website-wrapper flex-container nowrap" style="justify-content: space-between">
                <div class="website column"><img style="width: 16px; height: 16px; margin-right: 10px; margin-top: 6px;" src="https://external-content.duckduckgo.com/ip3/${newUrl["hostname"]}.ico">${url}</div>
                <div class="column" style="text-align: right;">
                  <span class="website-remove-from-black-white-list" style="font-size: 25px;cursor: pointer;margin-right: 10px;" title="Remove the website"><strong><span class="material-icons">delete_forever</span></strong></span>
                </div>
              </div>
          `);
        }

        templateForSource({
            isPreInstalled = false,
            isHidden = false,
            fromTo,
            title,
            url,
            id = ('_' + Math.random().toString(36).substr(2, 9))
        } = {}) {

            let newUrl = new URL(url);
            return (`
              <div class="source" style="">
                
                  <div class="flex-container nowrap" style="justify-content: space-between">
                      <div class="visible-title column" title="${this.sanitize(title)}"><img style="width: 16px; height: 16px; margin-right: 10px;" src="https://external-content.duckduckgo.com/ip3/${newUrl["hostname"]}.ico">${this.sanitize(title)}</div>
                      <div class="source-side-options column">
                          <span class="source-edit" title="Edit the source"><strong><span class="material-icons">edit</span></strong></span>
                          <span class="source-hide" title="Hide the source"><strong><span class="material-icons source-hide-icon">${(isHidden ? 'visibility_off': 'visibility')}</span></strong></span>
                          ${(isPreInstalled ? '' : '<span class="source-remove" title="Remove the source"><strong><span class="material-icons">delete_forever</span></strong></span>')}
                          <span class="source-drag" title="Sort by dragging and dropping"><strong><span class="material-icons">menu</span></strong></span>
                      </div>
                  </div>
                  <form
                       class="source-edit-form"
                       style="display:none"
                       data-is-pre-installed="${isPreInstalled}"
                       data-is-hidden="${isHidden}"
                       data-id="${id}"
                  >
                      <br>
                      <!-- <label><strong>Title </strong></label><br> -->
                      <input name="title" type="text" class="source-title" placeholder="Title" value="${this.sanitize(title)}" ${(isPreInstalled ? "disabled" : '' )}> <br><br>
                      <!-- <label><strong>URL </strong></label><br> -->
                      <input name="url" type="text" class="source-url" placeholder="https://somewebsite/search/%s" value="${url.replace(/"/g, '&quot;' ).replace(/'/g, '&#x27;' )}" ${(isPreInstalled ? "disabled" : '' )}> <br><br>
                      ${( isPreInstalled ? fromTo + '<br><br>' : '' )}
                      <button class="source-done">Done</button><br>
                  </form>
              </div>
            `);
        }

        addEventListenerToSourceSideOptions(onJustFirstElement = false) {

            if (onJustFirstElement) {
                let sourceElem = this.sourcesSettingsElem.querySelector('.source');
                (this.eventListenerForSideOptions())(sourceElem);
            } else {
                let sourceElems = this.sourcesSettingsElem.querySelectorAll(".source");
                [...sourceElems].forEach(this.eventListenerForSideOptions());
            }
        }

        eventListenerForSideOptions() {
            return function(source) {
                const sourceEditFormElem = source.querySelector(".source-edit-form");
                const sourceEditElem = source.querySelector(".source-edit");
                const sourceHideElem = source.querySelector(".source-hide");
                const sourceHideIconElem = sourceHideElem.querySelector('.source-hide-icon');
                const sourceRemoveElem = source.querySelector(".source-remove");
                const sourceDoneElem = source.querySelector(".source-done");
                sourceEditElem.addEventListener('click', (e) => {
                    sourceEditFormElem.style.display = sourceEditFormElem.style.display === 'none' ? "" : "none";
                });
                sourceHideElem.addEventListener('click', (e) => {
                    let sourceIsHidden = sourceEditFormElem.dataset.isHidden;

                    if (sourceIsHidden == "true") {
                        sourceEditFormElem.dataset.isHidden = "false";
                        sourceHideIconElem.innerText = "visibility";
                        // sourceHideElem.style.textDecoration = '';
                    } else {
                        sourceEditFormElem.dataset.isHidden = "true";
                        // sourceHideElem.style.textDecoration = 'line-through';
                        sourceHideIconElem.innerText = "visibility_off";

                    }
                });
                if (sourceRemoveElem) {
                    sourceRemoveElem.addEventListener('click', (e) => {
                        source.parentNode.removeChild(source);

                    });
                }
                sourceDoneElem.addEventListener('click', (e) => {
                    // let sourceEditedElem = source.querySelector(".source-edit-form");
                    sourceEditFormElem.style.display = "none"
                });

                // This is not one of the side options, but I am putting it here to
                // skip writing too many duplicate codes
                sourceEditFormElem["title"].addEventListener("keyup", (e) => {
                    let visibleTitle = source.querySelector(".visible-title");
                    visibleTitle.innerText = sourceEditFormElem["title"].value;
                });
            };
        }

        addEventListenerToSourceEditForm(onJustFirstElement = false) {
            if (onJustFirstElement) {
                let sourceEditFormElem = this.sourcesSettingsElem.querySelector('.source-edit-form');
                sourceEditFormElem.addEventListener("submit", (e) => { e.preventDefault(); });
            } else {
                let sourceEditFormElems = this.sourcesSettingsElem.querySelectorAll(".source-edit-form");
                [...sourceEditFormElems].forEach((sourceEditForm) => {
                    sourceEditForm.addEventListener("submit", (e) => { e.preventDefault(); })
                });

            }
        }


        addEventListenerToBlackWhiteListRemoveBtn(onJustFirstElement = false) {
            if (onJustFirstElement) {
                let blackWhiteListWebsiteWrapperElem = this.enableDisableWebsiteWiseElem.querySelector(".black-white-list-website-wrapper");
                (this.eventListenerForBlackWhitelistRemoveBtn())(blackWhiteListWebsiteWrapperElem);
            } else {
                let blackWhiteListWebsiteWrapperElems = this.enableDisableWebsiteWiseElem.querySelectorAll(".black-white-list-website-wrapper");
                [...blackWhiteListWebsiteWrapperElems].forEach(this.eventListenerForBlackWhitelistRemoveBtn());
            }
        }

        eventListenerForBlackWhitelistRemoveBtn() {
            return function(blackWhiteListWebsiteWrapperElem) {
                const websiteRemoveBtnElem = blackWhiteListWebsiteWrapperElem.querySelector(".website-remove-from-black-white-list");
                websiteRemoveBtnElem.addEventListener('click', (e) => {
                    blackWhiteListWebsiteWrapperElem.parentNode.removeChild(blackWhiteListWebsiteWrapperElem);
                });
            }
        }

        changeUrlOfPreInstalledSources() {
            let sourceEditFormElems = this.sourcesSettingsElem.querySelectorAll(".source-edit-form");

            [...sourceEditFormElems].forEach((sourceEditForm) => {
                let sourceIsPreInstalled = (sourceEditForm.dataset.isPreInstalled == 'true');
                if (sourceIsPreInstalled) {
                    let sourceId = sourceEditForm.dataset.id;
                    let sourceUrl = sourceEditForm["url"];
                    if (sourceEditForm.dataset.id == 'googleTranslate') {
                        let sourceFromElem = sourceEditForm.querySelector('.source-from');
                        let sourceToElem = sourceEditForm.querySelector('.source-to');
                        sourceFromElem.addEventListener('change', (e) => {
                            let selectedSourceFrom = sourceFromElem.value;
                            let selectedSourceTo = sourceToElem.value;
                            let newUrl = lipPreInstalledSourcesData[sourceId].generateUrl(selectedSourceFrom, selectedSourceTo)
                            sourceUrl.value = newUrl;
                        })
                        sourceToElem.addEventListener('change', (e) => {
                            let selectedSourceFrom = sourceFromElem.value;
                            let selectedSourceTo = sourceToElem.value;
                            let newUrl = lipPreInstalledSourcesData[sourceId].generateUrl(selectedSourceFrom, selectedSourceTo)
                            sourceUrl.value = newUrl;
                        })
                    } else {
                        let sourceFromToElem = sourceEditForm.querySelector('.source-from-to');
                        sourceFromToElem.addEventListener('change', (e) => {
                            let selectedSourceFromTo = sourceFromToElem.value;
                            let newUrl = lipPreInstalledSourcesData[sourceId].generateUrl(selectedSourceFromTo)
                            sourceUrl.value = newUrl;
                        })
                    }
                }
            });

        }

        showFlashMessages(messages = [], BGColor = "rgb(34,187,51)") {

            this.flashMessagesElem.style.backgroundColor = BGColor;
            this.flashMessagesElem.style.display = 'block';
            this.flashMessagesElem.innerHTML = "";

            messages.forEach((message) => {
                this.flashMessagesElem.insertAdjacentHTML('beforeend', `<strong>${message}</strong>`)
            })

            setTimeout(() => {
                this.flashMessagesElem.style.display = 'none';
            }, 2000);

        }

        sortSources() {
            Sortable.create(this.sourcesSettingsElem, {
                handle: '.source-drag',
                animation: 200,
                ghostClass: "sortable-ghost", // Class name for the drop placeholder
                chosenClass: "sortable-chosen", // Class name for the chosen item
                dragClass: "sortable-drag", // Class name for the dragging item
            });
        }

        tooltip() {
            const showEvents = ['mouseenter', 'focus'];
            const hideEvents = ['mouseleave', 'blur'];
            let tooltipBtnElems = document.querySelectorAll('[data-tooltip-btn]');

            [...tooltipBtnElems].forEach((tooltipBtn) => {

                let tooltip = document.querySelector(`[data-tooltip-for=${tooltipBtn.dataset.tooltipBtn}]`);
                let popperInstance = null;

                function create() {
                    popperInstance = Popper.createPopper(tooltipBtn, tooltip, {
                        modifiers: [{ name: 'offset', options: { offset: [0, 8], }, }, ],
                        placement: 'auto',
                    });
                }

                function destroy() {
                    if (popperInstance) {
                        popperInstance.destroy();
                        popperInstance = null;
                    }
                }



                showEvents.forEach(event => {
                    tooltipBtn.addEventListener(event, () => {
                        tooltip.setAttribute('data-show', '');
                        create();
                    });
                });

                hideEvents.forEach(event => {
                    tooltipBtn.addEventListener(event, () => {
                        tooltip.removeAttribute('data-show');
                        destroy();
                    });
                });
            });
        }

        toggleNextSibling() {
            let hideNextSiblingBtnElems = document.querySelectorAll(".hide-next-sibling");
            [...hideNextSiblingBtnElems].forEach((hideNextSiblingBtn) => {
                let nextSibling = hideNextSiblingBtn.nextElementSibling;
                hideNextSiblingBtn.addEventListener("click", (e) => {
                    hideNextSiblingBtn.classList.toggle("next-sibling-is-hidden");
                    nextSibling.classList.toggle("hidden");
                });

            });
        }


        sanitize(string) {
            const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', "/": '&#x2F;', };
            const reg = /[&<>"'/]/ig;
            return string.replace(reg, (match) => (map[match]));
        }
    }


    let lipOptions = new LipOptions();
    await lipOptions._constructor();


})();