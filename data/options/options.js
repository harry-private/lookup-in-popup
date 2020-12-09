const flashMessagesElem = document.querySelector('.flash-messages');
const dictionariesSettingsElem = document.querySelector("#dictionaries-settings");
const saveSettingsElem = document.querySelector("#save-settings");
const triggerKeyElem = document.querySelector("#trigger-key");
const enableDisableGloballyElem = document.querySelector("#enable-disable-globally");

const enableDisableWebsiteWiseElem = document.querySelector("#enable-disable-website-wise");
const listModeElem = document.querySelector("#list-mode");
const listUrlInputElem = document.querySelector("#list-url-input");
const listUrlAddElem = document.querySelector("#list-url-add");
const blacklistElem = document.querySelector("#blacklist");
const whitelistElem = document.querySelector("#whitelist");

const showChooseDictionaryOptionsElem = document.querySelector("#show-choose-dictionary-options");
// document.body.style.height = (screen.height - 120) + "px";

chrome.storage.sync.get(['dictionaries', "triggerKey", "enableDisable", "showChooseDictionaryOptions"], result => {
    console.log('result: ', result);
    // getting values from local storage, creating layout, and adding event listeners
    createDictionariesSettingsLayout(result);
    sortDictionaries();
    addEventListenerToDictionarySideOptions();
    addEventListenerToWhitelistBlacklistRemoveBtn();

});

addNewDictionary();
saveSettings();
addEventListenerToListMode();
addWebsiteInList();

function saveSettings() {
    saveSettingsElem.addEventListener("click", function() {

        const dictionariesElem = dictionariesSettingsElem.querySelectorAll(".dictionary");
        const blacklistWebsiteElem = document.querySelectorAll("#blacklist .website");
        console.log('blacklistWebsiteElem: ', blacklistWebsiteElem);
        const whitelistWebsiteElem = document.querySelectorAll("#whitelist .website");


        let triggerKeyToStore = changeTriggerKey();
        let dictionariesToStore = getDictionariesFromInputs(dictionariesElem);
        let enableDisableGloballyToStore = changeEnableDisableGlobally();
        let blacklistAndWhitelist = getBlacklistAndWhitelist(blacklistWebsiteElem, whitelistWebsiteElem);
        // console.log('blacklistAndWhitelist: ', blacklistAndWhitelist);
        if (dictionariesToStore.error == true)
            return;
        // save the dictionaries to the local storage
        chrome.storage.sync.set({
            dictionaries: dictionariesToStore.dictionariesToStore,
            triggerKey: triggerKeyToStore,
            enableDisable: {
                globally: enableDisableGloballyToStore,
                listMode: listModeElem.value,
                blacklist: blacklistAndWhitelist[0],
                whitelist: blacklistAndWhitelist[1],
            },
            showChooseDictionaryOptions: showChooseDictionaryOptionsElem.value
        });

        showFlashMessages(["Settings Saved!"]);
    });
}

function createDictionariesSettingsLayout(result) {

    result.dictionaries.forEach(function(dictionary) {
        let fromTo;
        let preInstalled = (dictionary.preInstalled == 'true') ? true : false;
        let isHidden = (dictionary.isHidden == 'true') ? true : false;


        if (preInstalled) {
            if (dictionary.isGoogleTranslate) {
                let optionFrom = '';
                let optionTo = '';
                dictionariesData[dictionary.id].from.forEach(function(language) {
                    let selectedFrom = (dictionary.from == language[1]) ? "selected" : "";
                    let selectedTo = (dictionary.to == language[1]) ? "selected" : "";
                    optionFrom += `<option ${selectedFrom}  value="${language[1]}">${language[0]}</option>`;
                    optionTo += `<option ${selectedTo} value="${language[1]}">${language[0]}</option>`;
                });
                fromTo = `<label> <strong>Select Language (From)</strong> </label><br><select class="dictionary-from">${optionFrom}</select><br><br>
                <label> <strong>Select Language (To)</strong> </label><br><select class="dictionary-to">${optionTo}</select>`;
            } else {
                let optionFromTo = '';

                // dictionariesData is from dictionaries_data.js
                dictionariesData[dictionary.id].fromTo.forEach(function(language) {
                    let selectedFromTo = (dictionary.fromTo == language[1]) ? "selected" : "";
                    optionFromTo += `<option value="${language[1]}" ${selectedFromTo}>${language[0]}</option>`;
                });
                fromTo = `<label><strong>Select Language</strong> </label><br><select class="dictionary-from-to">${optionFromTo}</select>`;
            }
        }

        let template = templateForDictionary({
            isGoogleTranslate: dictionary.isGoogleTranslate,
            preInstalled,
            isHidden,
            fromTo,
            title: dictionary.title,
            url: dictionary.url,
            id: dictionary.id
        })
        dictionariesSettingsElem.insertAdjacentHTML('beforeend', template);
    });
    changeUrlOfPreInstalledDictionaries();

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
    showChooseDictionaryOptionsElem.value = result.showChooseDictionaryOptions.toLowerCase();
}

function getDictionariesFromInputs(dictionaries) {
    let dictionariesToStore = [];
    let error = false;
    [...dictionaries].forEach(function(dictionary) {
        let dictionariesToStoreObj = {};
        let dictionaryTitle = dictionary.querySelector(".dictionary-title").value;
        let dictionaryId = dictionary.querySelector(".dictionary-id").value;
        let dictionaryUrl = dictionary.querySelector(".dictionary-url").value;
        if ((dictionaryTitle.length >= 30) || (dictionaryTitle.length <= 0)) {
            let invalidTitleLength = `The title you edited must be between 1 to 30`;
            showFlashMessages([invalidTitleLength], "red");
            console.log('invalidTitleLength: ', invalidTitleLength);
            error = true;
        } else if (!isValidURL(dictionaryUrl)) {
            let invalidUrl = `The URL you edited must be valid`;
            showFlashMessages([invalidUrl], "red");
            // console.log('invalidUrl: ', invalidUrl);
            error = true;
        } else {
            let dictionaryPreInstalled = dictionary.querySelector(".dictionary-preinstalled").value;
            let dictionaryIsHidden = dictionary.querySelector('.dictionary-is-hidden');
            if (dictionaryIsHidden) {
                if (dictionaryIsHidden.value === "true") {
                    dictionariesToStoreObj.isHidden = "true";
                }
            }
            if (dictionaryPreInstalled === 'true') {
                if (dictionary.id == 'google-translate') {
                    let dictionaryFrom = dictionary.querySelector(".dictionary-from");
                    let dictionaryTo = dictionary.querySelector(".dictionary-to");
                    let dictionaryFromSelected = getSelectedOption(dictionaryFrom)
                    let dictionaryToSelected = getSelectedOption(dictionaryTo)
                    dictionariesToStoreObj.from = dictionaryFromSelected
                    dictionariesToStoreObj.to = dictionaryToSelected
                    dictionariesToStoreObj.isGoogleTranslate = true;
                } else {
                    let dictionaryFromTo = dictionary.querySelector(".dictionary-from-to");
                    let dictionaryFromToSelected = getSelectedOption(dictionaryFromTo);
                    dictionariesToStoreObj.fromTo = dictionaryFromToSelected;
                }
            }



            dictionariesToStoreObj.title = dictionaryTitle;
            dictionariesToStoreObj.id = dictionaryId;
            dictionariesToStoreObj.url = dictionaryUrl;
            dictionariesToStoreObj.preInstalled = dictionaryPreInstalled;
            dictionariesToStore.push(dictionariesToStoreObj);
        }
    });
    return { error, dictionariesToStore };
}

function addNewDictionary() {
    let addNewDictionaryBtnElem = document.querySelector("#add-new-dictionary-btn");
    let dictionaryTitle = document.querySelector('.add-new-dictionary .dictionary-title');
    let dictionaryUrl = document.querySelector('.add-new-dictionary .dictionary-url');
    addNewDictionaryBtnElem.addEventListener('click', function(e) {
        let error = {};
        // let id = ('_' + Math.random().toString(36).substr(2, 9));

        let title = (dictionaryTitle.value).trim();
        let url = dictionaryUrl.value;

        if ((title.length >= 30) || (title.length <= 0)) {
            error.invalidTitleLength = 'Title length should be between 1 to 30';
            showFlashMessages([error.invalidTitleLength], "red")
        } else if (!isValidURL(url)) {
            error.invalidUrl = "URL must be valid";
            showFlashMessages([error.invalidUrl], "red")
        } else {
            let newDictionaryTemplate = templateForDictionary({
                title,
                url,
            });
            dictionariesSettingsElem.insertAdjacentHTML('afterbegin', newDictionaryTemplate);
            showFlashMessages(["New dictionary is added, please save the changes."]);
            dictionaryTitle.value = "";
            dictionaryUrl.value = "";
            // add eventListener to newly created dictionary
            addEventListenerToDictionarySideOptions(true)

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

function templateForDictionary({
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
  <div ${isGoogleTranslate ? 'id="google-translate"' : ''} class="dictionary" style="">
  <div class="flex-container nowrap" style="justify-content: space-between">
    <div class="column" title="${sanitize(title)}">${sanitize(title)}</div>
    <div class="column" style="text-align: right">
    <span class="dictionary-edit" style="font-size: 25px; cursor: pointer; margin-right: 10px" title="Edit the dictionary"><strong><i class="material-icons">edit</i></strong></span>
    <span class="dictionary-hide" style="font-size: 25px; cursor: pointer; margin-right: 10px" title="Hide the dictionary"><strong><i class="material-icons dictionary-hide-icon">${(isHidden ? 'visibility_off': 'visibility')}</i></strong></span>
    ${(preInstalled ? '' : '<span class="dictionary-remove" style="font-size: 25px; cursor: pointer; margin-right: 10px;" title="Remove the dictionary"><strong><i class="material-icons">delete_forever</i></strong></span>')}
    <span class="dictionary-drag" style="font-size: 25px; cursor: grab" title="Sort by dragging and dropping"><strong><i class="material-icons">menu</i></strong></span>
    </div>
  </div>
  <div class="dictionary-edited" style="display:none">
  <br>
  <!-- <label><strong>Title </strong></label><br> -->
  <input type="text" class="dictionary-title" placeholder="Title" value="${title}" ${(preInstalled ? "disabled" : '')}> <br><br>
  <input type="hidden" class="dictionary-id" value="${id}" ${(preInstalled ? "disabled" : '')}>
  <!-- <label><strong>URL </strong></label><br> -->
  <input type="text" class="dictionary-url" placeholder="https://somewebsite/search/%s" value="${url.replace(/"/g, '&quot;').replace(/'/g, '&#x27;')}" ${(preInstalled ? "disabled" : '')}> <br><br>
  <input type="hidden" class="dictionary-preinstalled" value="${preInstalled}">
  <input type="hidden" class="dictionary-is-hidden" value="${isHidden}">
  ${( preInstalled ? fromTo + '<br><br>' : '' )}
  <button class="dictionary-done">Done</button><br>
  </div>
  </div>`;
}

function addEventListenerToDictionarySideOptions(onJustFirstElement = false) {
    if (!onJustFirstElement) {
        allDictionariesElem = dictionariesSettingsElem.querySelectorAll(".dictionary");
        [...allDictionariesElem].forEach(eventListenerForSideOptions());
    } else if (onJustFirstElement) {
        let firstDictionaryElem = dictionariesSettingsElem.querySelector('.dictionary');
        (eventListenerForSideOptions())(firstDictionaryElem);
    }
}

function eventListenerForSideOptions() {
    return function(dictionary) {
        const dictionaryEditElem = dictionary.querySelector(".dictionary-edit");
        const dictionaryHideElem = dictionary.querySelector(".dictionary-hide");
        const dictionaryHideIconElem = dictionaryHideElem.querySelector('.dictionary-hide-icon');
        const dictionaryRemoveElem = dictionary.querySelector(".dictionary-remove");
        const dictionaryDoneElem = dictionary.querySelector(".dictionary-done");

        dictionaryEditElem.addEventListener('click', function(e) {
            let dictionaryEditedElem = dictionary.querySelector(".dictionary-edited");
            if (dictionaryEditedElem.style.display === 'none') {
                dictionaryEditedElem.style.display = ""
            } else {
                dictionaryEditedElem.style.display = "none"
            }
        });
        dictionaryHideElem.addEventListener('click', function(e) {
            let dictionaryIsHiddenElem = dictionary.querySelector('.dictionary-is-hidden');

            if (dictionaryIsHiddenElem.value === "true") {
                dictionaryIsHiddenElem.value = "false"
                dictionaryHideIconElem.innerText = "visibility";
                // dictionaryHideElem.style.textDecoration = '';
            } else {
                dictionaryIsHiddenElem.value = "true"
                // dictionaryHideElem.style.textDecoration = 'line-through';
                dictionaryHideIconElem.innerText = "visibility_off";

            }
        });
        if (dictionaryRemoveElem) {
            dictionaryRemoveElem.addEventListener('click', function(e) {
                dictionary.parentNode.removeChild(dictionary);

            });
        }
        dictionaryDoneElem.addEventListener('click', function(e) {
            let dictionaryEditedElem = dictionary.querySelector(".dictionary-edited");
            dictionaryEditedElem.style.display = "none"
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

function changeUrlOfPreInstalledDictionaries() {
    allDictionariesElem = dictionariesSettingsElem.querySelectorAll(".dictionary");

    [...allDictionariesElem].forEach(function(dictionary) {
        let dictionaryPreinstalledElem = dictionary.querySelector('.dictionary-preinstalled')
        if (dictionaryPreinstalledElem.value == 'true') {
            let dictionaryId = dictionary.querySelector('.dictionary-id').value;
            let dictionaryUrl = dictionary.querySelector('.dictionary-url');
            if (dictionary.getAttribute("id") == 'google-translate') {
                let dictionaryFromElem = dictionary.querySelector('.dictionary-from');
                let dictionaryToElem = dictionary.querySelector('.dictionary-to');
                dictionaryFromElem.addEventListener('change', function(e) {
                    let selectedDictionaryFrom = getSelectedOption(dictionaryFromElem);
                    let selectedDictionaryTo = getSelectedOption(dictionaryToElem);
                    let newUrl = dictionariesData[dictionaryId].generateUrl(selectedDictionaryFrom, selectedDictionaryTo)
                    dictionaryUrl.value = newUrl;
                })
                dictionaryToElem.addEventListener('change', function(e) {
                    let selectedDictionaryFrom = getSelectedOption(dictionaryFromElem);
                    let selectedDictionaryTo = getSelectedOption(dictionaryToElem);
                    let newUrl = dictionariesData[dictionaryId].generateUrl(selectedDictionaryFrom, selectedDictionaryTo)
                    dictionaryUrl.value = newUrl;
                })
            } else {
                let dictionaryFromToElem = dictionary.querySelector('.dictionary-from-to');
                dictionaryFromToElem.addEventListener('change', function(e) {
                    let selectedDictionaryFromTo = getSelectedOption(dictionaryFromToElem);
                    let newUrl = dictionariesData[dictionaryId].generateUrl(selectedDictionaryFromTo)
                    dictionaryUrl.value = newUrl;
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

function sortDictionaries() {
    Sortable.create(dictionariesSettingsElem, {
        handle: '.dictionary-drag',
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