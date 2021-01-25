(async () => {

    class LipOptions {

        async _constructor() {

            this.localStorageData = await lipUtility.localStorageDataPromise();
            this.flashMessagesElem = document.querySelector('.flash-messages');
            this.searchEnginesSettingsElem = document.querySelector("#search-engines-settings");
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
            this.websiteAccessFormElem = document.querySelector("#website-access-form");
            this.denyListElem = document.querySelector("#deny-list");
            this.allowListElem = document.querySelector("#allow-list");

            this.isShowingBubbleAllowedElem = document.querySelector("#is-showing-bubble-allowed");
            // document.body.style.height = (screen.height - 120) + "px";

            this.run();
        }

        run() {

            this.createSettingsLayout();
            this.sortSearchEngines();
            this.tooltip();
            this.toggleNextSibling();
            this.searchEngineSideOptions();
            this.searchEngineEditForm();
            this.websiteRemoveBtn();
            this.addNewSearchEngine();

            this.addWebsiteToWebsiteAccess();
            this.websiteAccessMode();

            this.saveSettings();
        }
        saveSettings() {
            this.saveSettingsElem.addEventListener("click", () => {

                const searchEngineEditFormElems = this.searchEnginesSettingsElem.querySelectorAll(".search-engine-edit-form");
                const denyListWebsiteElems = document.querySelectorAll("#deny-list .website");
                const allowListWebsiteElems = document.querySelectorAll("#allow-list .website");

                // values from inputs
                let searchEnginesToStore = this.getSearchEnginesFromInputs(searchEngineEditFormElems);
                let triggerKeyToStore = ((["none", "ctrlKey", "shiftKey", "altKey"].includes(this.triggerKeyElem.value)) ? this.triggerKeyElem.value : "none");
                let enableDisableGloballyToStore = ((this.enableDisableGloballyElem.value == "disable") ? "disable" : "enable");
                let websiteAccessModeToStore = ((this.websiteAccessFormElem['mode'].value == "allow-mode") ? "allow-mode" : "deny-mode");
                let websiteAccessWebsitesToStore = this.getWebsiteAccessWebsites(denyListWebsiteElems, allowListWebsiteElems);
                let isShowingBubbleAllowedToStore = (this.isShowingBubbleAllowedElem.value == "true");

                let popupWindowIsCloseOnEscAllowedToStore = (this.popupWindowIsCloseOnEscAllowedElem.value == "true");
                let popupWindowIsMultipleAllowedToStore = (this.popupWindowIsMultipleAllowedElem.value == "true");
                let popupWindowSateToStore = (["normal", "maximized"].includes(this.popupWindowStateElem.value) ? this.popupWindowStateElem.value : "normal");
                let popupWindowWidthToStore = (!Number.isInteger(parseInt(this.popupWindowWidthElem.value)) ? "" : parseInt(this.popupWindowWidthElem.value));
                let popupWindowHeightToStore = (!Number.isInteger(parseInt(this.popupWindowHeightElem.value)) ? "" : parseInt(this.popupWindowHeightElem.value));
                let popupWindowFromLeftToStore = (!Number.isInteger(parseInt(this.popupWindowFromLeftElem.value)) ? "" : parseInt(this.popupWindowFromLeftElem.value));
                let popupWindowFromTopToStore = (!Number.isInteger(parseInt(this.popupWindowFromTopElem.value)) ? "" : parseInt(this.popupWindowFromTopElem.value));
                let popupWindowIsShowingNavbarAllowedToStore = (this.popupWindowIsShowingNavbarAllowedElem.value == "true");

                if (searchEnginesToStore.error) { return; }

                // save the SearchEngines to the local storage
                chrome.storage.sync.set({
                    searchEngines: searchEnginesToStore.searchEnginesToStore,
                    triggerKey: triggerKeyToStore,
                    enableDisable: {
                        globally: enableDisableGloballyToStore,
                        websiteAccessMode: websiteAccessModeToStore,
                        denyList: websiteAccessWebsitesToStore[0],
                        allowList: websiteAccessWebsitesToStore[1],
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

        /**
         * - Create layout for "Added Search Engines" 
         * - Update form values based on local storage
         * - Create layout for "Allow list and Deny list "
         */
        createSettingsLayout() {
            this.localStorageData.searchEngines.forEach((storedSearchEngine) => {
                let fromTo;

                if (storedSearchEngine.isPreInstalled) {
                    if (storedSearchEngine.id === "googleTranslate") {
                        let optionFrom = '';
                        let optionTo = '';
                        lipPreInstalledSearchEnginesData[storedSearchEngine.id].from.forEach((language) => {
                            let selectedFrom = (storedSearchEngine.from == language[1]) ? "selected" : "";
                            let selectedTo = (storedSearchEngine.to == language[1]) ? "selected" : "";
                            optionFrom += `<option ${selectedFrom}  value="${language[1]}">${language[0]}</option>`;
                            optionTo += `<option ${selectedTo} value="${language[1]}">${language[0]}</option>`;
                        });
                        fromTo = `
                          <label> <strong>Select Language (From)</strong> </label><br>
                          <select class="search-engine-from">${optionFrom}</select><br><br>
                          <label> <strong>Select Language (To)</strong> </label><br>
                          <select class="search-engine-to">${optionTo}</select>
                        `;
                    } else {
                        let optionFromTo = '';

                        // lipPreInstalledSearchEnginesData is from lip_pre_installed_search_engines_data.js
                        lipPreInstalledSearchEnginesData[storedSearchEngine.id].fromTo.forEach((language) => {
                            let selectedFromTo = (storedSearchEngine.fromTo == language[1]) ? "selected" : "";
                            optionFromTo += `<option value="${language[1]}" ${selectedFromTo}>${language[0]}</option>`;
                        });
                        fromTo = `
                          <label><strong>Select Language</strong> </label><br>
                          <select class="search-engine-from-to">${optionFromTo}</select>
                        `;
                    }
                }

                let template = this.templateForSearchEngine({
                    isPreInstalled: storedSearchEngine.isPreInstalled,
                    isHidden: storedSearchEngine.isHidden,
                    fromTo: fromTo,
                    title: storedSearchEngine.title,
                    url: storedSearchEngine.url,
                    id: storedSearchEngine.id
                })
                this.searchEnginesSettingsElem.insertAdjacentHTML('beforeend', template);
            });
            this.updateUrlOfPreInstalledSearchEngines();

            this.localStorageData.enableDisable.denyList.forEach((denyList) => {
                const websiteTemplate = this.templateForWebsiteAccessWebsites(denyList);
                this.denyListElem.querySelector('.main').insertAdjacentHTML('afterbegin', websiteTemplate);
            });
            this.localStorageData.enableDisable.allowList.forEach((allowList) => {
                const websiteTemplate = this.templateForWebsiteAccessWebsites(allowList);
                this.allowListElem.querySelector('.main').insertAdjacentHTML('afterbegin', websiteTemplate);
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
            this.websiteAccessFormElem['mode'].value = this.localStorageData.enableDisable.websiteAccessMode;
            this.changeListBasedOnWebsiteAccessMode();
            this.isShowingBubbleAllowedElem.value = this.localStorageData.isShowingBubbleAllowed;
        }

        getSearchEnginesFromInputs(searchEngineEditFormElems) {
            let searchEnginesToStore = [];
            let error = false;
            [...searchEngineEditFormElems].forEach((searchEngineEditForm) => {
                let searchEnginesToStoreObj = {};
                let searchEngineTitle = searchEngineEditForm["title"].value.trim();
                let searchEngineUrl = searchEngineEditForm["url"].value.trim();

                let searchEngineId = searchEngineEditForm.dataset.id;
                if ((searchEngineTitle.length >= 30) || (searchEngineTitle.length <= 0)) {
                    let invalidTitleLength = `The title you edited must be between 1 to 30`;
                    this.showFlashMessages([invalidTitleLength], "red");
                    error = true;
                } else if (!lipUtility.isValidURL(searchEngineUrl)) {
                    let invalidUrl = `The URL you edited must be valid`;
                    this.showFlashMessages([invalidUrl], "red");
                    error = true;
                } else {
                    let searchEngineIsPreInstalled = (searchEngineEditForm.dataset.isPreInstalled == 'true');
                    let searchEngineIsHidden = (searchEngineEditForm.dataset.isHidden == 'true');



                    if (searchEngineIsPreInstalled) {
                        if (searchEngineId == 'googleTranslate') {
                            let searchEngineFrom = searchEngineEditForm.querySelector(".search-engine-from");
                            let searchEngineTo = searchEngineEditForm.querySelector(".search-engine-to");
                            let searchEngineFromSelected = searchEngineFrom.value;
                            let searchEngineToSelected = searchEngineTo.value;
                            searchEnginesToStoreObj.from = searchEngineFromSelected;
                            searchEnginesToStoreObj.to = searchEngineToSelected;
                        } else {
                            let searchEngineFromTo = searchEngineEditForm.querySelector(".search-engine-from-to");
                            let searchEngineFromToSelected = searchEngineFromTo.value;
                            searchEnginesToStoreObj.fromTo = searchEngineFromToSelected;
                        }
                    }



                    searchEnginesToStoreObj.title = searchEngineTitle;
                    searchEnginesToStoreObj.id = searchEngineId;
                    searchEnginesToStoreObj.url = searchEngineUrl;
                    searchEnginesToStoreObj.isPreInstalled = searchEngineIsPreInstalled;
                    searchEnginesToStoreObj.isHidden = searchEngineIsHidden;
                    searchEnginesToStore.push(searchEnginesToStoreObj);
                }
            });
            return { error, searchEnginesToStore: searchEnginesToStore };
        }

        addNewSearchEngine() {
            let addNewSearchEngineFormElem = document.querySelector("#add-new-search-engine-form");

            addNewSearchEngineFormElem.addEventListener('submit', (e) => {
                e.preventDefault();
                let error = {};
                // let id = ('_' + Math.random().toString(36).substr(2, 9));

                let title = addNewSearchEngineFormElem['title'].value.trim();
                let url = addNewSearchEngineFormElem['url'].value.trim();

                if ((title.length >= 30) || (title.length <= 0)) {
                    error.invalidTitleLength = 'Title length should be between 1 to 30';
                    this.showFlashMessages([error.invalidTitleLength], "red")
                } else if (!lipUtility.isValidURL(url)) {
                    error.invalidUrl = "URL must be valid";
                    this.showFlashMessages([error.invalidUrl], "red")
                } else {
                    addNewSearchEngineFormElem.reset();
                    let newSearchEngineTemplate = this.templateForSearchEngine({ title, url, });
                    this.searchEnginesSettingsElem.insertAdjacentHTML('afterbegin', newSearchEngineTemplate);
                    this.showFlashMessages(["New search engine is added, please save the changes."]);

                    // add eventListener to newly created search engine
                    this.searchEngineSideOptions(true);
                    this.searchEngineEditForm(true);

                }

                if (!lipUtility.isObjEmpty(error)) {
                    // console.log(error)

                }

            })
        }


        /**
         * Add event listener to website access mode **select**
         */
        websiteAccessMode() {
            this.websiteAccessFormElem["mode"].addEventListener("change", this.changeListBasedOnWebsiteAccessMode.bind(this))
        }

        /**
         *  Change list (allow or deny) based on selected website access mode
         */
        changeListBasedOnWebsiteAccessMode(e) {
            // this will decide which list will be visible, and which list will be hidden
            if (this.websiteAccessFormElem['mode'].value == "deny-mode") {
                this.denyListElem.style.display = "block";
                this.allowListElem.style.display = "none";
            } else if (this.websiteAccessFormElem['mode'].value == "allow-mode") {
                this.allowListElem.style.display = "block";
                this.denyListElem.style.display = "none";
            }

        }

        addWebsiteToWebsiteAccess() {
            this.websiteAccessFormElem.addEventListener("submit", (e) => {
                e.preventDefault();
                if (!lipUtility.isValidURL(this.websiteAccessFormElem['url'].value)) {
                    let invalidUrl = `The URL is invalid.`;
                    this.showFlashMessages([invalidUrl], "red");
                } else {
                    const websiteTemplate = this.templateForWebsiteAccessWebsites(this.websiteAccessFormElem['url'].value);
                    if (this.websiteAccessFormElem['mode'].value == "deny-mode") {
                        this.denyListElem.querySelector('.main').insertAdjacentHTML('afterbegin', websiteTemplate);
                    } else if (this.websiteAccessFormElem['mode'].value == "allow-mode") {
                        this.allowListElem.querySelector('.main').insertAdjacentHTML('afterbegin', websiteTemplate);
                    }
                    this.websiteRemoveBtn(true);
                    this.websiteAccessFormElem['url'].value = "";
                    this.showFlashMessages(["New website is added, please save the changes."]);

                }
            });

        }



        getWebsiteAccessWebsites(denyListWebsiteElems, allowListWebsiteElems) {
            let denyListWebsites = [];
            let allowListWebsites = [];

            let denyListWebsite;
            let allowListWebsite;
            denyListWebsiteElems.forEach((website) => {
                denyListWebsite = new URL(website.innerText);
                denyListWebsite = denyListWebsite.protocol + '//' + lipUtility.removeWWWBeginningOfHostname(denyListWebsite.hostname);
                denyListWebsites.push(denyListWebsite.toLowerCase());
            });
            allowListWebsiteElems.forEach((website) => {
                allowListWebsite = new URL(website.innerText);
                allowListWebsite = allowListWebsite.protocol + '//' + lipUtility.removeWWWBeginningOfHostname(allowListWebsite.hostname);

                allowListWebsites.push(lipUtility.removeWWWBeginningOfHostname(allowListWebsite.toLowerCase()));
            });
            // remove duplicates 
            let uniqueDenyListWebsites = [...new Set(denyListWebsites)];
            let uniqueAllowListWebsite = [...new Set(allowListWebsites)];

            return [uniqueDenyListWebsites.reverse(), uniqueAllowListWebsite.reverse()];

        }

        templateForWebsiteAccessWebsites(url) {
            let urlTrimmed = url.trim();
            let newUrl = new URL(urlTrimmed);
            return (`
              <div class="website-access-website-wrapper flex-container nowrap" style="justify-content: space-between">
                <div class="website column"><img style="width: 16px; height: 16px; margin-right: 10px; margin-top: 6px;" src="https://external-content.duckduckgo.com/ip3/${newUrl["hostname"]}.ico">${urlTrimmed}</div>
                <div class="column" style="text-align: right;">
                  <span class="website-remove-from-website-access" style="font-size: 25px;cursor: pointer;margin-right: 10px;" title="Remove the website"><strong><span class="material-icons">delete_forever</span></strong></span>
                </div>
              </div>
          `);
        }

        templateForSearchEngine({
            isPreInstalled = false,
            isHidden = false,
            fromTo,
            title,
            url,
            id = ('_' + Math.random().toString(36).substr(2, 9))
        } = {}) {

            let newUrl = new URL(url);
            return `
              <div class="search-engine" style="">
                
                  <div class="flex-container nowrap" style="justify-content: space-between">
                      <div class="visible-title column" title="${this.sanitize(title)}"><img style="width: 16px; height: 16px; margin-right: 10px;" src="https://external-content.duckduckgo.com/ip3/${newUrl["hostname"]}.ico">${this.sanitize(title)}</div>
                      <div class="search-engine-side-options column">
                          <span class="search-engine-edit" title="Edit the search engine"><strong><span class="material-icons">edit</span></strong></span>
                          <span class="search-engine-hide" title="Hide the search engine"><strong><span class="material-icons search-engine-hide-icon">${(isHidden ? 'visibility_off': 'visibility')}</span></strong></span>
                          ${(isPreInstalled ? '' : '<span class="search-engine-remove" title="Remove the search engine"><strong><span class="material-icons">delete_forever</span></strong></span>')}
                          <span class="search-engine-drag" title="Sort by dragging and dropping"><strong><span class="material-icons">menu</span></strong></span>
                      </div>
                  </div>
                  <form
                       class="search-engine-edit-form"
                       style="display:none"
                       data-is-pre-installed="${isPreInstalled}"
                       data-is-hidden="${isHidden}"
                       data-id="${id}"
                  >
                      <br>
                      <!-- <label><strong>Title </strong></label><br> -->
                      <input name="title" type="text" class="search-engine-title" placeholder="Title" value="${this.sanitize(title)}" ${(isPreInstalled ? "disabled" : '' )}> <br><br>
                      <!-- <label><strong>URL </strong></label><br> -->
                      <input name="url" type="text" class="search-engine-url" placeholder="https://somewebsite/search/%s" value="${url.replace(/"/g, '&quot;' ).replace(/'/g, '&#x27;' )}" ${(isPreInstalled ? "disabled" : '' )}> <br><br>
                      ${( isPreInstalled ? fromTo + '<br><br>' : '' )}
                      <button class="search-engine-done">Done</button><br>
                  </form>
              </div>
            `;
        }

        /**
         * Add event listeners and handlers to search engines side options
         * @param {boolean} onJustFirstElement 
         */
        searchEngineSideOptions(onJustFirstElement = false) {
            const addEventListenerToSearchEngineSideOptions = () => {
                return function(searchEngine) {
                    const searchEngineEditFormElem = searchEngine.querySelector(".search-engine-edit-form");
                    const searchEngineEditElem = searchEngine.querySelector(".search-engine-edit");
                    const searchEngineHideElem = searchEngine.querySelector(".search-engine-hide");
                    const searchEngineHideIconElem = searchEngineHideElem.querySelector('.search-engine-hide-icon');
                    const searchEngineRemoveElem = searchEngine.querySelector(".search-engine-remove");
                    const searchEngineDoneElem = searchEngine.querySelector(".search-engine-done");
                    searchEngineEditElem.addEventListener('click', (e) => {
                        searchEngineEditFormElem.style.display = searchEngineEditFormElem.style.display === 'none' ? "" : "none";
                    });
                    searchEngineHideElem.addEventListener('click', (e) => {
                        let searchEngineIsHidden = searchEngineEditFormElem.dataset.isHidden;

                        if (searchEngineIsHidden == "true") {
                            searchEngineEditFormElem.dataset.isHidden = "false";
                            searchEngineHideIconElem.innerText = "visibility";
                            // searchEngineHideElem.style.textDecoration = '';
                        } else {
                            searchEngineEditFormElem.dataset.isHidden = "true";
                            // searchEngineHideElem.style.textDecoration = 'line-through';
                            searchEngineHideIconElem.innerText = "visibility_off";

                        }
                    });
                    if (searchEngineRemoveElem) {
                        searchEngineRemoveElem.addEventListener('click', (e) => {
                            searchEngine.parentNode.removeChild(searchEngine);

                        });
                    }
                    searchEngineDoneElem.addEventListener('click', (e) => {
                        // let searchEngineEditedElem = searchEngine.querySelector(".search-engine-edit-form");
                        searchEngineEditFormElem.style.display = "none"
                    });

                    // This is not one of the side options, but I am putting it here to
                    // skip writing too many duplicate codes
                    searchEngineEditFormElem["title"].addEventListener("keyup", (e) => {
                        let visibleTitle = searchEngine.querySelector(".visible-title");
                        visibleTitle.innerText = searchEngineEditFormElem["title"].value;
                    });
                };
            };

            if (onJustFirstElement) {
                let searchEngineElem = this.searchEnginesSettingsElem.querySelector('.search-engine');
                (addEventListenerToSearchEngineSideOptions())(searchEngineElem);
            } else {
                let searchEngineElems = this.searchEnginesSettingsElem.querySelectorAll(".search-engine");
                [...searchEngineElems].forEach(addEventListenerToSearchEngineSideOptions());
            }
        }



        /**
         * Add submit listener and handler to search engine edit form
         * @param {boolean} onJustFirstElement 
         */
        searchEngineEditForm(onJustFirstElement = false) {
            if (onJustFirstElement) {
                let searchEngineEditFormElem = this.searchEnginesSettingsElem.querySelector('.search-engine-edit-form');
                searchEngineEditFormElem.addEventListener("submit", (e) => { e.preventDefault(); });
            } else {
                let searchEngineEditFormElems = this.searchEnginesSettingsElem.querySelectorAll(".search-engine-edit-form");
                [...searchEngineEditFormElems].forEach((searchEngineEditForm) => {
                    searchEngineEditForm.addEventListener("submit", (e) => { e.preventDefault(); })
                });

            }
        }


        /**
         * Add event listener and handler to **allow list** and **deny list** websites' remove button
         * @param {boolean} onJustFirstElement 
         */
        websiteRemoveBtn(onJustFirstElement = false) {
            const addEventListenerToWebsiteRemoveBtn = () => {
                return function(websiteAccessWebsiteWrapperElem) {
                    const websiteRemoveBtnElem = websiteAccessWebsiteWrapperElem.querySelector(".website-remove-from-website-access");
                    websiteRemoveBtnElem.addEventListener('click', (e) => {
                        websiteAccessWebsiteWrapperElem.parentNode.removeChild(websiteAccessWebsiteWrapperElem);
                    });
                }
            };

            if (onJustFirstElement) {
                let websiteAccessWebsiteWrapperElems = this.enableDisableWebsiteWiseElem.querySelector(".website-access-website-wrapper");
                (addEventListenerToWebsiteRemoveBtn())(websiteAccessWebsiteWrapperElems);
            } else {
                let websiteAccessWebsiteWrapperElems = this.enableDisableWebsiteWiseElem.querySelectorAll(".website-access-website-wrapper");
                [...websiteAccessWebsiteWrapperElems].forEach(addEventListenerToWebsiteRemoveBtn());
            }
        }



        /**
         * Update url of pre-installed search engine on its option changes
         */
        updateUrlOfPreInstalledSearchEngines() {
            let searchEngineEditFormElems = this.searchEnginesSettingsElem.querySelectorAll(".search-engine-edit-form");

            [...searchEngineEditFormElems].forEach((searchEngineEditForm) => {
                let searchEngineIsPreInstalled = (searchEngineEditForm.dataset.isPreInstalled == 'true');
                if (searchEngineIsPreInstalled) {
                    let searchEngineId = searchEngineEditForm.dataset.id;
                    let searchEngineUrl = searchEngineEditForm["url"];
                    if (searchEngineEditForm.dataset.id == 'googleTranslate') {
                        let searchEngineFromElem = searchEngineEditForm.querySelector('.search-engine-from');
                        let searchEngineToElem = searchEngineEditForm.querySelector('.search-engine-to');
                        searchEngineFromElem.addEventListener('change', (e) => {
                            let selectedSearchEngineFrom = searchEngineFromElem.value;
                            let selectedSearchEngineTo = searchEngineToElem.value;
                            let newUrl = lipPreInstalledSearchEnginesData[searchEngineId].generateUrl(selectedSearchEngineFrom, selectedSearchEngineTo)
                            searchEngineUrl.value = newUrl;
                        })
                        searchEngineToElem.addEventListener('change', (e) => {
                            let selectedSearchEngineFrom = searchEngineFromElem.value;
                            let selectedSearchEngineTo = searchEngineToElem.value;
                            let newUrl = lipPreInstalledSearchEnginesData[searchEngineId].generateUrl(selectedSearchEngineFrom, selectedSearchEngineTo)
                            searchEngineUrl.value = newUrl;
                        })
                    } else {
                        let searchEngineFromToElem = searchEngineEditForm.querySelector('.search-engine-from-to');
                        searchEngineFromToElem.addEventListener('change', (e) => {
                            let selectedSearchEngineFromTo = searchEngineFromToElem.value;
                            let newUrl = lipPreInstalledSearchEnginesData[searchEngineId].generateUrl(selectedSearchEngineFromTo)
                            searchEngineUrl.value = newUrl;
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

        sortSearchEngines() {
            Sortable.create(this.searchEnginesSettingsElem, {
                handle: '.search-engine-drag',
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