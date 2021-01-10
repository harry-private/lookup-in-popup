// TODO Instead of hidden inputs use data-*
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
            this.addEventListenerToBlackWhiteListRemoveBtn();
            this.addNewSource();
            this.saveSettings();
            this.addEventListenerToBlackWhiteListMode();
            this.addWebsiteToBlackWhiteList();
        }
        saveSettings() {
            this.saveSettingsElem.addEventListener("click", () => {

                const sourceElems = this.sourcesSettingsElem.querySelectorAll(".source");
                const blacklistWebsiteElems = document.querySelectorAll("#blacklist .website");
                const whitelistWebsiteElems = document.querySelectorAll("#whitelist .website");


                let triggerKeyToStore = this.changeTriggerKey();
                let sourcesToStore = this.getSourcesFromInputs(sourceElems);
                let enableDisableGloballyToStore = this.changeEnableDisableGlobally();
                let blackWhiteList = this.getBlackWhiteList(blacklistWebsiteElems, whitelistWebsiteElems);
                if (sourcesToStore.error == true)
                    return;
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
            let result = this.localStorageData;
            result.sources.forEach((source) => {
                let fromTo;
                let preInstalled = (source.preInstalled == 'true') ? true : false;
                let isHidden = (source.isHidden == 'true') ? true : false;


                if (preInstalled) {
                    if (source.isGoogleTranslate) {
                        let optionFrom = '';
                        let optionTo = '';
                        sourcesData[source.id].from.forEach((language) => {
                            let selectedFrom = (source.from == language[1]) ? "selected" : "";
                            let selectedTo = (source.to == language[1]) ? "selected" : "";
                            optionFrom += `<option ${selectedFrom}  value="${language[1]}">${language[0]}</option>`;
                            optionTo += `<option ${selectedTo} value="${language[1]}">${language[0]}</option>`;
                        });
                        fromTo = `<label> <strong>Select Language (From)</strong> </label><br><select class="source-from">${optionFrom}</select><br><br>
                  <label> <strong>Select Language (To)</strong> </label><br><select class="source-to">${optionTo}</select>`;
                    } else {
                        let optionFromTo = '';

                        // sourcesData is from dictionaries_data.js
                        sourcesData[source.id].fromTo.forEach((language) => {
                            let selectedFromTo = (source.fromTo == language[1]) ? "selected" : "";
                            optionFromTo += `<option value="${language[1]}" ${selectedFromTo}>${language[0]}</option>`;
                        });
                        fromTo = `<label><strong>Select Language</strong> </label><br><select class="source-from-to">${optionFromTo}</select>`;
                    }
                }

                let template = this.templateForSource({
                    isGoogleTranslate: source.isGoogleTranslate,
                    preInstalled,
                    isHidden,
                    fromTo,
                    title: source.title,
                    url: source.url,
                    id: source.id
                })
                this.sourcesSettingsElem.insertAdjacentHTML('beforeend', template);
            });
            this.changeUrlOfPreInstalledSources();

            result.enableDisable.blacklist.forEach((blacklist) => {
                const blackWhiteListTemplate = this.templateForBlackWhitelist(blacklist);
                this.blacklistElem.querySelector('.main').insertAdjacentHTML('afterbegin', blackWhiteListTemplate);
            });
            result.enableDisable.whitelist.forEach((whitelist) => {
                const websiteTemplate = this.templateForBlackWhitelist(whitelist);
                this.whitelistElem.querySelector('.main').insertAdjacentHTML('afterbegin', websiteTemplate);
            });
            // set default selected option the gotten from storage
            this.triggerKeyElem.value = result.triggerKey;
            this.enableDisableGloballyElem.value = result.enableDisable.globally;
            this.blackWhiteListFormElem['mode'].value = result.enableDisable.blackWhiteListMode;
            this.changeBlackWhiteList();
            this.showChooseSourceOptionsElem.value = result.showChooseSourceOptions.toLowerCase();
        }

        getSourcesFromInputs(sources) {
            let sourcesToStore = [];
            let error = false;
            [...sources].forEach((source) => {
                let sourcesToStoreObj = {};
                let sourceTitle = source.querySelector(".source-title").value;
                let sourceId = source.querySelector(".source-id").value;
                let sourceUrl = source.querySelector(".source-url").value;
                if ((sourceTitle.length >= 30) || (sourceTitle.length <= 0)) {
                    let invalidTitleLength = `The title you edited must be between 1 to 30`;
                    this.showFlashMessages([invalidTitleLength], "red");
                    error = true;
                } else if (!lookupUtility.isValidURL(sourceUrl)) {
                    let invalidUrl = `The URL you edited must be valid`;
                    this.showFlashMessages([invalidUrl], "red");
                    error = true;
                } else {
                    let sourcePreInstalled = source.querySelector(".source-preinstalled").value;
                    let sourceIsHidden = source.querySelector('.source-is-hidden');
                    if (sourceIsHidden) {
                        if (sourceIsHidden.value === "true") {
                            sourcesToStoreObj.isHidden = "true";
                        }
                    }
                    if (sourcePreInstalled === 'true') {
                        if (source.id == 'google-translate') {
                            let sourceFrom = source.querySelector(".source-from");
                            let sourceTo = source.querySelector(".source-to");
                            let sourceFromSelected = this.getSelectedOption(sourceFrom)
                            let sourceToSelected = this.getSelectedOption(sourceTo)
                            sourcesToStoreObj.from = sourceFromSelected
                            sourcesToStoreObj.to = sourceToSelected
                            sourcesToStoreObj.isGoogleTranslate = true;
                        } else {
                            let sourceFromTo = source.querySelector(".source-from-to");
                            let sourceFromToSelected = this.getSelectedOption(sourceFromTo);
                            sourcesToStoreObj.fromTo = sourceFromToSelected;
                        }
                    }



                    sourcesToStoreObj.title = sourceTitle;
                    sourcesToStoreObj.id = sourceId;
                    sourcesToStoreObj.url = sourceUrl;
                    sourcesToStoreObj.preInstalled = sourcePreInstalled;
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
                    let newSourceTemplate = this.templateForSource({ title, url, });
                    this.sourcesSettingsElem.insertAdjacentHTML('afterbegin', newSourceTemplate);
                    this.showFlashMessages(["New source is added, please save the changes."]);
                    addNewSourceFormElem.reset();

                    // add eventListener to newly created source
                    this.addEventListenerToSourceSideOptions(true)

                }

                if (!lookupUtility.isObjEmpty(error)) {
                    // console.log(error)

                }

            })
        }

        changeTriggerKey() {
            let allowedTriggerKeys = ["none", "ctrlKey", "shiftKey", "altKey"];
            let triggerKeySelectedElem = this.getSelectedOption(this.triggerKeyElem);
            const isAllowedTriggerKey = (allowedTriggerKeys.indexOf(triggerKeySelectedElem) > -1);
            // if the selected option is not allowed, or the user has edit the code
            // no need to show the error message, and set the trigger key to "none"
            return (isAllowedTriggerKey ? triggerKeySelectedElem : "none");

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
            isGoogleTranslate = false,
            preInstalled = false,
            isHidden = false,
            fromTo,
            title,
            url,
            id = ('_' + Math.random().toString(36).substr(2, 9))
        } = {}) {



            return (`
                    <div ${isGoogleTranslate ? 'id="google-translate"' : ''} class="source" style="">
                    <div class="flex-container nowrap" style="justify-content: space-between">
                      <div class="column" title="${this.sanitize(title)}">${this.sanitize(title)}</div>
                      <div class="column" style="text-align: right">
                      <span class="source-edit" style="font-size: 25px; cursor: pointer; margin-right: 10px" title="Edit the source"><strong><i class="material-icons">edit</i></strong></span>
                      <span class="source-hide" style="font-size: 25px; cursor: pointer; margin-right: 10px" title="Hide the source"><strong><i class="material-icons source-hide-icon">${(isHidden ? 'visibility_off': 'visibility')}</i></strong></span>
                      ${(preInstalled ? '' : '<span class="source-remove" style="font-size: 25px; cursor: pointer; margin-right: 10px;" title="Remove the source"><strong><i class="material-icons">delete_forever</i></strong></span>')}
                      <span class="source-drag" style="font-size: 25px; cursor: grab" title="Sort by dragging and dropping"><strong><i class="material-icons">menu</i></strong></span>
                      </div>
                    </div>
                    <div class="source-edited" style="display:none">
                    <br>
                    <!-- <label><strong>Title </strong></label><br> -->
                    <input type="text" data-preinstalled="${preInstalled}" class="source-title" placeholder="Title" value="${title}" ${(preInstalled ? "disabled" : '')}> <br><br>
                    <input type="hidden" class="source-id" value="${id}" ${(preInstalled ? "disabled" : '')}>
                    <!-- <label><strong>URL </strong></label><br> -->
                    <input type="text" class="source-url" placeholder="https://somewebsite/search/%s" value="${url.replace(/"/g, '&quot;').replace(/'/g, '&#x27;')}" ${(preInstalled ? "disabled" : '')}> <br><br>
                    <input type="hidden" class="source-preinstalled" value="${preInstalled}">
                    <input type="hidden" class="source-is-hidden" value="${isHidden}">
                    ${( preInstalled ? fromTo + '<br><br>' : '' )}
                    <button class="source-done">Done</button><br>
                    </div>
                  </div>
                  `);
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
                const sourceEditElem = source.querySelector(".source-edit");
                const sourceHideElem = source.querySelector(".source-hide");
                const sourceHideIconElem = sourceHideElem.querySelector('.source-hide-icon');
                const sourceRemoveElem = source.querySelector(".source-remove");
                const sourceDoneElem = source.querySelector(".source-done");

                sourceEditElem.addEventListener('click', (e) => {
                    let sourceEditedElem = source.querySelector(".source-edited");
                    if (sourceEditedElem.style.display === 'none') {
                        sourceEditedElem.style.display = ""
                    } else {
                        sourceEditedElem.style.display = "none"
                    }
                });
                sourceHideElem.addEventListener('click', (e) => {
                    let sourceIsHiddenElem = source.querySelector('.source-is-hidden');

                    if (sourceIsHiddenElem.value === "true") {
                        sourceIsHiddenElem.value = "false"
                        sourceHideIconElem.innerText = "visibility";
                        // sourceHideElem.style.textDecoration = '';
                    } else {
                        sourceIsHiddenElem.value = "true"
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
                    let sourceEditedElem = source.querySelector(".source-edited");
                    sourceEditedElem.style.display = "none"
                });

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
            let sourceElems = this.sourcesSettingsElem.querySelectorAll(".source");

            [...sourceElems].forEach((source) => {
                let sourcePreinstalledElem = source.querySelector('.source-preinstalled')
                if (sourcePreinstalledElem.value == 'true') {
                    let sourceId = source.querySelector('.source-id').value;
                    let sourceUrl = source.querySelector('.source-url');
                    if (source.getAttribute("id") == 'google-translate') {
                        let sourceFromElem = source.querySelector('.source-from');
                        let sourceToElem = source.querySelector('.source-to');
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
                        let sourceFromToElem = source.querySelector('.source-from-to');
                        sourceFromToElem.addEventListener('change', (e) => {
                            let selectedSourceFromTo = this.getSelectedOption(sourceFromToElem);
                            let newUrl = sourcesData[sourceId].generateUrl(selectedSourceFromTo)
                            sourceUrl.value = newUrl;
                        })
                    }
                }
            });

            // fromToElem.addEventListener('change', function(e) {alert("You are disgusting!")})
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
                animation: 150
            });
        }


        getSelectedOption(e) {
            return e.options[e.selectedIndex].value
        }

        sanitize(string) {
            const map = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#x27;',
                "/": '&#x2F;',
            };
            const reg = /[&<>"'/]/ig;
            return string.replace(reg, (match) => (map[match]));
        }
    }


    let lookupOptions = new LookupOptions();
    await lookupOptions._constructor();


})();