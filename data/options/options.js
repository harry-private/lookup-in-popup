(async () => {

    class LookupOptions {

        async _constructor() {

            this.localStorageData = await lookupUtility.localStorageDataPromise();
            this.flashMessagesElem = document.querySelector('.flash-messages');
            this.sourcesSettingsElem = document.querySelector("#sources-settings");
            this.saveSettingsElem = document.querySelector("#save-settings");
            this.triggerKeyElem = document.querySelector("#trigger-key");
            this.enableDisableGloballyElem = document.querySelector("#enable-disable-globally");

            this.enableDisableWebsiteWiseElem = document.querySelector("#enable-disable-website-wise");
            this.blackWhiteListFormElem = document.querySelector("#black-white-list-form");
            this.blacklistElem = document.querySelector("#blacklist");
            this.whitelistElem = document.querySelector("#whitelist");

            this.showChooseSourceOptionsElem = document.querySelector("#show-choose-source-options");
            // document.body.style.height = (screen.height - 120) + "px";

            this.run();
        }

        run() {

            this.createSourcesSettingsLayout();
            this.sortSources();
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


                let triggerKeyToStore = this.changeTriggerKey();
                let sourcesToStore = this.getSourcesFromInputs(sourceEditFormElems);
                let enableDisableGloballyToStore = this.changeEnableDisableGlobally();
                let blackWhiteList = this.getBlackWhiteList(blacklistWebsiteElems, whitelistWebsiteElems);
                if (sourcesToStore.error == true) { return; }
                // save the sources to the local storage
                chrome.storage.sync.set({
                    sources: sourcesToStore.sourcesToStore,
                    triggerKey: triggerKeyToStore,
                    enableDisable: {
                        globally: enableDisableGloballyToStore,
                        blackWhiteListMode: this.blackWhiteListFormElem['mode'].value,
                        blacklist: blackWhiteList[0],
                        whitelist: blackWhiteList[1],
                    },
                    showChooseSourceOptions: this.showChooseSourceOptionsElem.value
                });

                this.showFlashMessages(["Settings Saved!"]);
            });
        }

        createSourcesSettingsLayout() {
            this.localStorageData.sources.forEach((storedSource) => {
                let fromTo;
                let isPreInstalled = (storedSource.isPreInstalled == 'true') ? true : false;
                let isHidden = (storedSource.isHidden == 'true') ? true : false;

                if (isPreInstalled) {
                    if (storedSource.id === "googleTranslate") {
                        let optionFrom = '';
                        let optionTo = '';
                        sourcesData[storedSource.id].from.forEach((language) => {
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

                        // sourcesData is from sources_data.js
                        sourcesData[storedSource.id].fromTo.forEach((language) => {
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
                    isPreInstalled: isPreInstalled,
                    isHidden: isHidden,
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
            this.triggerKeyElem.value = this.localStorageData.triggerKey;
            this.enableDisableGloballyElem.value = this.localStorageData.enableDisable.globally;
            this.blackWhiteListFormElem['mode'].value = this.localStorageData.enableDisable.blackWhiteListMode;
            this.changeBlackWhiteList();
            this.showChooseSourceOptionsElem.value = this.localStorageData.showChooseSourceOptions.toLowerCase();
        }

        getSourcesFromInputs(sourceEditFormElems) {
            let sourcesToStore = [];
            let error = false;
            [...sourceEditFormElems].forEach((sourceEditForm) => {
                let sourcesToStoreObj = {};
                let sourceTitle = sourceEditForm["title"].value;
                let sourceUrl = sourceEditForm["url"].value;

                let sourceId = sourceEditForm.dataset.id;
                if ((sourceTitle.length >= 30) || (sourceTitle.length <= 0)) {
                    let invalidTitleLength = `The title you edited must be between 1 to 30`;
                    this.showFlashMessages([invalidTitleLength], "red");
                    error = true;
                } else if (!lookupUtility.isValidURL(sourceUrl)) {
                    let invalidUrl = `The URL you edited must be valid`;
                    this.showFlashMessages([invalidUrl], "red");
                    error = true;
                } else {
                    let sourceIsPreInstalled = sourceEditForm.dataset.isPreInstalled;
                    let sourceIsHidden = sourceEditForm.dataset.isHidden;

                    if (sourceIsHidden == "true") {
                        sourcesToStoreObj.isHidden = "true";
                    }

                    if (sourceIsPreInstalled == 'true') {
                        if (sourceId == 'googleTranslate') {
                            let sourceFrom = sourceEditForm.querySelector(".source-from");
                            let sourceTo = sourceEditForm.querySelector(".source-to");
                            let sourceFromSelected = this.getSelectedOption(sourceFrom);
                            let sourceToSelected = this.getSelectedOption(sourceTo);
                            sourcesToStoreObj.from = sourceFromSelected;
                            sourcesToStoreObj.to = sourceToSelected;
                        } else {
                            let sourceFromTo = sourceEditForm.querySelector(".source-from-to");
                            let sourceFromToSelected = this.getSelectedOption(sourceFromTo);
                            sourcesToStoreObj.fromTo = sourceFromToSelected;
                        }
                    }



                    sourcesToStoreObj.title = sourceTitle;
                    sourcesToStoreObj.id = sourceId;
                    sourcesToStoreObj.url = sourceUrl;
                    sourcesToStoreObj.isPreInstalled = sourceIsPreInstalled;
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
                } else if (!lookupUtility.isValidURL(url)) {
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

                if (!lookupUtility.isObjEmpty(error)) {
                    // console.log(error)

                }

            })
        }

        changeTriggerKey() {
            let allowedTriggerKeys = ["none", "ctrlKey", "shiftKey", "altKey"];
            let triggerKeySelected = this.getSelectedOption(this.triggerKeyElem);
            const isAllowedTriggerKey = (allowedTriggerKeys.indexOf(triggerKeySelected) > -1);
            // if the selected option is not allowed, or the user has edit the code
            // no need to show the error message, and set the trigger key to "none"
            return (isAllowedTriggerKey ? triggerKeySelected : "none");

        }

        changeEnableDisableGlobally() {
            let allowedOptions = ["enable", "disable"];
            let enableDisableGloballySelectedElem = this.getSelectedOption(this.enableDisableGloballyElem);
            const isAllowedOption = (allowedOptions.indexOf(enableDisableGloballySelectedElem) > -1);
            return (isAllowedOption ? enableDisableGloballySelectedElem : "enable");

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
                if (!lookupUtility.isValidURL(this.blackWhiteListFormElem['url'].value)) {
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
                    this.blackWhiteListFormElem['url'] = "";
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
                blacklistWebsite = blacklistWebsite.protocol + '//' + lookupUtility.removeWWWBeginningOfHostname(blacklistWebsite.hostname);
                blacklistWebsites.push(blacklistWebsite.toLowerCase());
            });
            whitelistWebsiteElems.forEach((website) => {
                whitelistWebsite = new URL(website.innerText);
                whitelistWebsite = whitelistWebsite.protocol + '//' + lookupUtility.removeWWWBeginningOfHostname(whitelistWebsite.hostname);

                whitelistWebsites.push(lookupUtility.removeWWWBeginningOfHostname(whitelistWebsite.toLowerCase()));
            });
            // remove duplicates 
            let uniqueBlacklistWebsites = [...new Set(blacklistWebsites)];
            let uniqueWhitelistWebsite = [...new Set(whitelistWebsites)];

            return [uniqueBlacklistWebsites.reverse(), uniqueWhitelistWebsite.reverse()];

        }

        templateForBlackWhitelist(url) {
            return (`
              <div class="black-white-list-website-wrapper flex-container nowrap" style="justify-content: space-between">
                <div class="website column">${url}</div>
                <div class="column" style="text-align: right;">
                  <span class="website-remove-from-black-white-list" style="font-size: 25px;cursor: pointer;margin-right: 10px;" title="Remove the website"><strong><i class="material-icons">delete_forever</i></strong></span>
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



            return (
                `
                  <div class="source" style="">
                    
                      <div class="flex-container nowrap" style="justify-content: space-between">
                          <div class="column" title="${this.sanitize(title)}">${this.sanitize(title)}</div>
                          <div class="source-side-options column">
                              <span class="source-edit" title="Edit the source"><strong><i class="material-icons">edit</i></strong></span>
                              <span class="source-hide" title="Hide the source"><strong><i class="material-icons source-hide-icon">${(isHidden ? 'visibility_off': 'visibility')}</i></strong></span>
                              ${(isPreInstalled ? '' : '<span class="source-remove" title="Remove the source"><strong><i class="material-icons">delete_forever</i></strong></span>')}
                              <span class="source-drag" title="Sort by dragging and dropping"><strong><i class="material-icons">menu</i></strong></span>
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
                          <input name="title" type="text" class="source-title" placeholder="Title" value="${title}" ${(isPreInstalled ? "disabled" : '' )}> <br><br>
                          <!-- <label><strong>URL </strong></label><br> -->
                          <input name="url" type="text" class="source-url" placeholder="https://somewebsite/search/%s" value="${url.replace(/"/g, '&quot;' ).replace(/'/g, '&#x27;' )}" ${(isPreInstalled ? "disabled" : '' )}> <br><br>
                          ${( isPreInstalled ? fromTo + '<br><br>' : '' )}
                          <button class="source-done">Done</button><br>
                      </form>
                  </div>
                `
            );
        }

        addEventListenerToSourceSideOptions(onJustFirstElement = false) {
            if (!onJustFirstElement) {
                let sourceElems = this.sourcesSettingsElem.querySelectorAll(".source");
                [...sourceElems].forEach(this.eventListenerForSideOptions());
            } else if (onJustFirstElement) {
                let sourceElem = this.sourcesSettingsElem.querySelector('.source');
                (this.eventListenerForSideOptions())(sourceElem);
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
                    // let sourceEditedElem = source.querySelector(".source-edit-form");
                    if (sourceEditFormElem.style.display === 'none') {
                        sourceEditFormElem.style.display = ""
                    } else {
                        sourceEditFormElem.style.display = "none"
                    }
                });
                sourceHideElem.addEventListener('click', (e) => {
                    let sourceIsHidden = sourceEditFormElem.dataset.isHidden;

                    if (sourceIsHidden === "true") {
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
                    // TODO change title
                    // let sourceEditedElem = source.querySelector(".source-edit-form");
                    sourceEditFormElem.style.display = "none"
                });

            }
        }

        addEventListenerToSourceEditForm(onJustFirstElement = false) {
            if (!onJustFirstElement) {
                let sourceEditFormElems = this.sourcesSettingsElem.querySelectorAll(".source-edit-form");
                [...sourceEditFormElems].forEach((sourceEditForm) => {
                    sourceEditForm.addEventListener("submit", (e) => { e.preventDefault(); })
                });

            } else if (onJustFirstElement) {
                let sourceEditFormElem = this.sourcesSettingsElem.querySelector('.source-edit-form');
                sourceEditFormElem.addEventListener("submit", (e) => { e.preventDefault(); })

            }
        }


        addEventListenerToBlackWhiteListRemoveBtn(onJustFirstElement = false) {
            if (!onJustFirstElement) {
                let blackWhiteListWebsiteWrapperElems = this.enableDisableWebsiteWiseElem.querySelectorAll(".black-white-list-website-wrapper");
                [...blackWhiteListWebsiteWrapperElems].forEach(this.eventListenerForBlackWhitelistRemoveBtn());
            } else if (onJustFirstElement) {
                let blackWhiteListWebsiteWrapperElem = this.enableDisableWebsiteWiseElem.querySelector(".black-white-list-website-wrapper");
                (this.eventListenerForBlackWhitelistRemoveBtn())(blackWhiteListWebsiteWrapperElem);
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
                let sourceIsPreInstalled = sourceEditForm.dataset.isPreInstalled;
                if (sourceIsPreInstalled == 'true') {
                    let sourceId = sourceEditForm.dataset.id;
                    let sourceUrl = sourceEditForm["url"];
                    if (sourceEditForm.dataset.id == 'googleTranslate') {
                        let sourceFromElem = sourceEditForm.querySelector('.source-from');
                        let sourceToElem = sourceEditForm.querySelector('.source-to');
                        sourceFromElem.addEventListener('change', (e) => {
                            let selectedSourceFrom = this.getSelectedOption(sourceFromElem);
                            let selectedSourceTo = this.getSelectedOption(sourceToElem);
                            let newUrl = sourcesData[sourceId].generateUrl(selectedSourceFrom, selectedSourceTo)
                            sourceUrl.value = newUrl;
                        })
                        sourceToElem.addEventListener('change', (e) => {
                            let selectedSourceFrom = this.getSelectedOption(sourceFromElem);
                            let selectedSourceTo = this.getSelectedOption(sourceToElem);
                            let newUrl = sourcesData[sourceId].generateUrl(selectedSourceFrom, selectedSourceTo)
                            sourceUrl.value = newUrl;
                        })
                    } else {
                        let sourceFromToElem = sourceEditForm.querySelector('.source-from-to');
                        sourceFromToElem.addEventListener('change', (e) => {
                            let selectedSourceFromTo = this.getSelectedOption(sourceFromToElem);
                            let newUrl = sourcesData[sourceId].generateUrl(selectedSourceFromTo)
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


        getSelectedOption(e) {
            return e.options[e.selectedIndex].value
        }

        sanitize(string) {
            const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', "/": '&#x2F;', };
            const reg = /[&<>"'/]/ig;
            return string.replace(reg, (match) => (map[match]));
        }
    }


    let lookupOptions = new LookupOptions();
    await lookupOptions._constructor();


})();