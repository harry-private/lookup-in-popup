const flashMessagesElem = document.querySelector('.flash-messages');
const sourcesSettingsElem = document.querySelector("#sources-settings");
const saveSettingsElem = document.querySelector("#save-settings");
const triggerKeyElem = document.querySelector("#trigger-key");
const enableDisableGloballyElem = document.querySelector("#enable-disable-globally");

const enableDisableWebsiteWiseElem = document.querySelector("#enable-disable-website-wise");
const listModeElem = document.querySelector("#list-mode");
const listUrlInputElem = document.querySelector("#list-url-input");
const listUrlAddElem = document.querySelector("#list-url-add");
const blacklistElem = document.querySelector("#blacklist");
const whitelistElem = document.querySelector("#whitelist");

const showChooseSourceOptionsElem = document.querySelector("#show-choose-source-options");
// document.body.style.height = (screen.height - 120) + "px";

chrome.storage.sync.get(['sources', "triggerKey", "enableDisable", "showChooseSourceOptions"], result => {
    console.log('result: ', result);
    // getting values from local storage, creating layout, and adding event listeners
    createSourcesSettingsLayout(result);
    sortSources();
    addEventListenerToSourceSideOptions();
    addEventListenerToWhitelistBlacklistRemoveBtn();

});

addNewSource();
saveSettings();
addEventListenerToListMode();
addWebsiteInList();

function saveSettings() {
    saveSettingsElem.addEventListener("click", function() {

        const sourcesElem = sourcesSettingsElem.querySelectorAll(".source");
        const blacklistWebsiteElem = document.querySelectorAll("#blacklist .website");
        console.log('blacklistWebsiteElem: ', blacklistWebsiteElem);
        const whitelistWebsiteElem = document.querySelectorAll("#whitelist .website");


        let triggerKeyToStore = changeTriggerKey();
        let sourcesToStore = getSourcesFromInputs(sourcesElem);
        let enableDisableGloballyToStore = changeEnableDisableGlobally();
        let blacklistAndWhitelist = getBlacklistAndWhitelist(blacklistWebsiteElem, whitelistWebsiteElem);
        // console.log('blacklistAndWhitelist: ', blacklistAndWhitelist);
        if (sourcesToStore.error == true)
            return;
        // save the sources to the local storage
        chrome.storage.sync.set({
            sources: sourcesToStore.sourcesToStore,
            triggerKey: triggerKeyToStore,
            enableDisable: {
                globally: enableDisableGloballyToStore,
                listMode: listModeElem.value,
                blacklist: blacklistAndWhitelist[0],
                whitelist: blacklistAndWhitelist[1],
            },
            showChooseSourceOptions: showChooseSourceOptionsElem.value
        });

        showFlashMessages(["Settings Saved!"]);
    });
}

function createSourcesSettingsLayout(result) {

    result.sources.forEach(function(source) {
        let fromTo;
        let preInstalled = (source.preInstalled == 'true') ? true : false;
        let isHidden = (source.isHidden == 'true') ? true : false;


        if (preInstalled) {
            if (source.isGoogleTranslate) {
                let optionFrom = '';
                let optionTo = '';
                sourcesData[source.id].from.forEach(function(language) {
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
                sourcesData[source.id].fromTo.forEach(function(language) {
                    let selectedFromTo = (source.fromTo == language[1]) ? "selected" : "";
                    optionFromTo += `<option value="${language[1]}" ${selectedFromTo}>${language[0]}</option>`;
                });
                fromTo = `<label><strong>Select Language</strong> </label><br><select class="source-from-to">${optionFromTo}</select>`;
            }
        }

        let template = templateForSource({
            isGoogleTranslate: source.isGoogleTranslate,
            preInstalled,
            isHidden,
            fromTo,
            title: source.title,
            url: source.url,
            id: source.id
        })
        sourcesSettingsElem.insertAdjacentHTML('beforeend', template);
    });
    changeUrlOfPreInstalledSources();

    result.enableDisable.blacklist.forEach(function(blacklist) {
        const websiteTemplate = templateForBlacklistWhitelist(blacklist);
        blacklistElem.querySelector('.main').insertAdjacentHTML('afterbegin', websiteTemplate);
    });
    result.enableDisable.whitelist.forEach(function(whitelist) {
        const websiteTemplate = templateForBlacklistWhitelist(whitelist);
        whitelistElem.querySelector('.main').insertAdjacentHTML('afterbegin', websiteTemplate);
    });
    // set default selected option the gotten from storage
    triggerKeyElem.value = result.triggerKey;
    enableDisableGloballyElem.value = result.enableDisable.globally;
    listModeElem.value = result.enableDisable.listMode;
    changeList();
    showChooseSourceOptionsElem.value = result.showChooseSourceOptions.toLowerCase();
}

function getSourcesFromInputs(sources) {
    let sourcesToStore = [];
    let error = false;
    [...sources].forEach(function(source) {
        let sourcesToStoreObj = {};
        let sourceTitle = source.querySelector(".source-title").value;
        let sourceId = source.querySelector(".source-id").value;
        let sourceUrl = source.querySelector(".source-url").value;
        if ((sourceTitle.length >= 30) || (sourceTitle.length <= 0)) {
            let invalidTitleLength = `The title you edited must be between 1 to 30`;
            showFlashMessages([invalidTitleLength], "red");
            console.log('invalidTitleLength: ', invalidTitleLength);
            error = true;
        } else if (!isValidURL(sourceUrl)) {
            let invalidUrl = `The URL you edited must be valid`;
            showFlashMessages([invalidUrl], "red");
            // console.log('invalidUrl: ', invalidUrl);
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
                    let sourceFromSelected = getSelectedOption(sourceFrom)
                    let sourceToSelected = getSelectedOption(sourceTo)
                    sourcesToStoreObj.from = sourceFromSelected
                    sourcesToStoreObj.to = sourceToSelected
                    sourcesToStoreObj.isGoogleTranslate = true;
                } else {
                    let sourceFromTo = source.querySelector(".source-from-to");
                    let sourceFromToSelected = getSelectedOption(sourceFromTo);
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

function addNewSource() {
    let addNewSourceBtnElem = document.querySelector("#add-new-source-btn");
    let sourceTitle = document.querySelector('.add-new-source .source-title');
    let sourceUrl = document.querySelector('.add-new-source .source-url');
    addNewSourceBtnElem.addEventListener('click', function(e) {
        let error = {};
        // let id = ('_' + Math.random().toString(36).substr(2, 9));

        let title = (sourceTitle.value).trim();
        let url = sourceUrl.value;

        if ((title.length >= 30) || (title.length <= 0)) {
            error.invalidTitleLength = 'Title length should be between 1 to 30';
            showFlashMessages([error.invalidTitleLength], "red")
        } else if (!isValidURL(url)) {
            error.invalidUrl = "URL must be valid";
            showFlashMessages([error.invalidUrl], "red")
        } else {
            let newSourceTemplate = templateForSource({
                title,
                url,
            });
            sourcesSettingsElem.insertAdjacentHTML('afterbegin', newSourceTemplate);
            showFlashMessages(["New source is added, please save the changes."]);
            sourceTitle.value = "";
            sourceUrl.value = "";
            // add eventListener to newly created source
            addEventListenerToSourceSideOptions(true)

        }

        if (!isObjEmpty(error)) {
            // console.log(error)

        }

    })
}

function changeTriggerKey() {
    let allowedTriggerKeys = ["none", "ctrlKey", "shiftKey", "altKey"];
    let triggerKeySelectedElem = getSelectedOption(triggerKeyElem);
    const isAllowedTriggerKey = (allowedTriggerKeys.indexOf(triggerKeySelectedElem) > -1);
    // if the selected option is not allowed, or the user has edit the code
    // no need to show the error message, and set the trigger key to "none"
    return (isAllowedTriggerKey ? triggerKeySelectedElem : "none");

}

function changeEnableDisableGlobally() {
    let allowedOptions = ["enable", "disable"];
    let enableDisableGloballySelectedElem = getSelectedOption(enableDisableGloballyElem);
    const isAllowedOption = (allowedOptions.indexOf(enableDisableGloballySelectedElem) > -1);
    return (isAllowedOption ? enableDisableGloballySelectedElem : "enable");

}


// list == blacklist or whitelist
function addEventListenerToListMode() {
    listModeElem.addEventListener("change", changeList)
}

function changeList() {

    if (listModeElem.value == "blacklist-mode") {
        blacklistElem.style.display = "block";
        whitelistElem.style.display = "none";
    } else if (listModeElem.value == "whitelist-mode") {
        whitelistElem.style.display = "block";
        blacklistElem.style.display = "none";
    }

}

function addWebsiteInList() {
    listUrlAddElem.addEventListener("click", () => {

        if (!isValidURL(listUrlInputElem.value)) {
            let invalidUrl = `The URL is invalid.`;
            showFlashMessages([invalidUrl], "red");
        } else {
            const websiteTemplate = templateForBlacklistWhitelist(listUrlInputElem.value);
            if (listModeElem.value == "blacklist-mode") {
                blacklistElem.querySelector('.main').insertAdjacentHTML('afterbegin', websiteTemplate);
            } else if (listModeElem.value == "whitelist-mode") {
                whitelistElem.querySelector('.main').insertAdjacentHTML('afterbegin', websiteTemplate);
            }
            addEventListenerToWhitelistBlacklistRemoveBtn(true);
            showFlashMessages(["New website is added, please save the changes."]);

        }
    });

}



function getBlacklistAndWhitelist(blacklist, whitelist) {
    let blacklistWebsites = [];
    let whitelistWebsites = [];

    let blacklistWebsite;
    let whitelistWebsite;
    blacklist.forEach(function(website) {
        blacklistWebsite = new URL(website.innerText);
        blacklistWebsite = blacklistWebsite.protocol + '//' + removeWWWBeginningOfHostname(blacklistWebsite.hostname);
        blacklistWebsites.push(blacklistWebsite.toLowerCase());
    });
    whitelist.forEach(function(website) {
        whitelistWebsite = new URL(website.innerText);
        whitelistWebsite = whitelistWebsite.protocol + '//' + removeWWWBeginningOfHostname(whitelistWebsite.hostname);

        whitelistWebsites.push(removeWWWBeginningOfHostname(whitelistWebsite.toLowerCase()));
    });
    // remove duplicates 
    uniqueBlacklistWebsites = [...new Set(blacklistWebsites)];
    uniqueWhitelistWebsite = [...new Set(whitelistWebsites)];

    return [uniqueBlacklistWebsites.reverse(), uniqueWhitelistWebsite.reverse()];

}

function templateForBlacklistWhitelist(url) {
    return (`
            <div class="website-wrapper flex-container nowrap" style="justify-content: space-between">
              <div class="website column">${url}</div>
              <div class="column" style="text-align: right;">
                <span class="website-remove-from-list" style="font-size: 25px;cursor: pointer;margin-right: 10px;" title="Remove the website"><strong><i class="material-icons">delete_forever</i></strong></span>
              </div>
            </div>
        `);
}

function templateForSource({
    isGoogleTranslate = false,
    preInstalled = false,
    isHidden = false,
    fromTo,
    title,
    url,
    id = ('_' + Math.random().toString(36).substr(2, 9))
} = {}) {


    // alert(('_' + Math.random().toString(36).substr(2, 9)))
    return `
  <div ${isGoogleTranslate ? 'id="google-translate"' : ''} class="source" style="">
  <div class="flex-container nowrap" style="justify-content: space-between">
    <div class="column" title="${sanitize(title)}">${sanitize(title)}</div>
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
  <input type="text" class="source-title" placeholder="Title" value="${title}" ${(preInstalled ? "disabled" : '')}> <br><br>
  <input type="hidden" class="source-id" value="${id}" ${(preInstalled ? "disabled" : '')}>
  <!-- <label><strong>URL </strong></label><br> -->
  <input type="text" class="source-url" placeholder="https://somewebsite/search/%s" value="${url.replace(/"/g, '&quot;').replace(/'/g, '&#x27;')}" ${(preInstalled ? "disabled" : '')}> <br><br>
  <input type="hidden" class="source-preinstalled" value="${preInstalled}">
  <input type="hidden" class="source-is-hidden" value="${isHidden}">
  ${( preInstalled ? fromTo + '<br><br>' : '' )}
  <button class="source-done">Done</button><br>
  </div>
  </div>`;
}

function addEventListenerToSourceSideOptions(onJustFirstElement = false) {
    if (!onJustFirstElement) {
        allSourcesElem = sourcesSettingsElem.querySelectorAll(".source");
        [...allSourcesElem].forEach(eventListenerForSideOptions());
    } else if (onJustFirstElement) {
        let firstSourceElem = sourcesSettingsElem.querySelector('.source');
        (eventListenerForSideOptions())(firstSourceElem);
    }
}

function eventListenerForSideOptions() {
    return function(source) {
        const sourceEditElem = source.querySelector(".source-edit");
        const sourceHideElem = source.querySelector(".source-hide");
        const sourceHideIconElem = sourceHideElem.querySelector('.source-hide-icon');
        const sourceRemoveElem = source.querySelector(".source-remove");
        const sourceDoneElem = source.querySelector(".source-done");

        sourceEditElem.addEventListener('click', function(e) {
            let sourceEditedElem = source.querySelector(".source-edited");
            if (sourceEditedElem.style.display === 'none') {
                sourceEditedElem.style.display = ""
            } else {
                sourceEditedElem.style.display = "none"
            }
        });
        sourceHideElem.addEventListener('click', function(e) {
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
            sourceRemoveElem.addEventListener('click', function(e) {
                source.parentNode.removeChild(source);

            });
        }
        sourceDoneElem.addEventListener('click', function(e) {
            let sourceEditedElem = source.querySelector(".source-edited");
            sourceEditedElem.style.display = "none"
        });

    }
}

function addEventListenerToWhitelistBlacklistRemoveBtn(onJustFirstElement = false) {
    if (!onJustFirstElement) {
        allWebsiteElem = enableDisableWebsiteWiseElem.querySelectorAll(".website-wrapper");
        [...allWebsiteElem].forEach(eventListenerForWhitelistBlacklistRemoveBtn());
    } else if (onJustFirstElement) {
        let firstWebsiteElem = enableDisableWebsiteWiseElem.querySelector(".website-wrapper");
        (eventListenerForWhitelistBlacklistRemoveBtn())(firstWebsiteElem);
    }
}

function eventListenerForWhitelistBlacklistRemoveBtn() {
    return function(websiteWrapper) {
        const websiteRemoveBtnElem = websiteWrapper.querySelector(".website-remove-from-list");
        websiteRemoveBtnElem.addEventListener('click', function(e) {
            websiteWrapper.parentNode.removeChild(websiteWrapper);
        });
    }
}

function changeUrlOfPreInstalledSources() {
    allSourcesElem = sourcesSettingsElem.querySelectorAll(".source");

    [...allSourcesElem].forEach(function(source) {
        let sourcePreinstalledElem = source.querySelector('.source-preinstalled')
        if (sourcePreinstalledElem.value == 'true') {
            let sourceId = source.querySelector('.source-id').value;
            let sourceUrl = source.querySelector('.source-url');
            if (source.getAttribute("id") == 'google-translate') {
                let sourceFromElem = source.querySelector('.source-from');
                let sourceToElem = source.querySelector('.source-to');
                sourceFromElem.addEventListener('change', function(e) {
                    let selectedSourceFrom = getSelectedOption(sourceFromElem);
                    let selectedSourceTo = getSelectedOption(sourceToElem);
                    let newUrl = sourcesData[sourceId].generateUrl(selectedSourceFrom, selectedSourceTo)
                    sourceUrl.value = newUrl;
                })
                sourceToElem.addEventListener('change', function(e) {
                    let selectedSourceFrom = getSelectedOption(sourceFromElem);
                    let selectedSourceTo = getSelectedOption(sourceToElem);
                    let newUrl = sourcesData[sourceId].generateUrl(selectedSourceFrom, selectedSourceTo)
                    sourceUrl.value = newUrl;
                })
            } else {
                let sourceFromToElem = source.querySelector('.source-from-to');
                sourceFromToElem.addEventListener('change', function(e) {
                    let selectedSourceFromTo = getSelectedOption(sourceFromToElem);
                    let newUrl = sourcesData[sourceId].generateUrl(selectedSourceFromTo)
                    sourceUrl.value = newUrl;
                })
            }
        }
    });

    // fromToElem.addEventListener('change', function(e) {alert("You are disgusting!")})
}

///////// utilities 

function removeWWWBeginningOfHostname(hostname) {
    // console.log(hostname);
    return hostname.replace(/^www\./, '');
}

function isValidURL(string) {
    // http(s) is optional in first regex
    // let res = string.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
    let res = string.match(/(http(s)?:\/\/.)(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
    return (res !== null);
};

function isObjEmpty(obj) {
    // if (Object.entries(obj).length === 0 && obj.constructor === Object) {
    //   return true;
    // }
    // return false;
    return (Object.entries(obj).length === 0 && obj.constructor === Object) ? true : false
}

function showFlashMessages(messages = [], BGColor = "rgb(34,187,51)") {

    flashMessagesElem.style.backgroundColor = BGColor;
    flashMessagesElem.style.display = 'block';
    flashMessagesElem.innerHTML = "";

    messages.forEach(function(message) {
        flashMessagesElem.insertAdjacentHTML('beforeend', `<strong>${message}</strong>`)
    })

    setTimeout(function() {
        flashMessagesElem.style.display = 'none';
    }, 2000);

}

function sortSources() {
    Sortable.create(sourcesSettingsElem, {
        handle: '.source-drag',
        animation: 150
    });
}


function getSelectedOption(e) {
    return e.options[e.selectedIndex].value
}

function sanitize(string) {
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