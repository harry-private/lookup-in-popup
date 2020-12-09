// import 'babel-polyfill'
(async () => {
    'use strict'
    class Dictionary {
        _constructor() {
            // this.dictionaries = {};
            this.body = document.body;
            this.html = document.documentElement;
            this.popup = document.createElement('div');
            this.popupSelect = document.createElement('select');
            this.popup.classList.add('my-dictionary-popup');
            this.popupSelect.classList.add('my-dictionary-popup-select');
            this.popupSelect.classList.add('my-dictionary-custom-select');
            this.isAdded = false;
            this.iframe;
            this.panel;
            this.panelSelect = null;
            this.panelQueryForm = null;
            this.panelQueryInput = null;
            this.panelMaximized = false;
            this.selectedText = "";
            this.selectedDictionary;
            // appending "my-dictionary-" because StackOverflow has the popup class, so won't work there
            this.createFixedPositionElement()
        }
        async getDataFromLocalStorage() {
            let localStorageDataPromise = async () => {
                return new Promise(resolve => {
                    chrome.storage.sync.get(['dictionaries', "triggerKey", "enableDisable", "showChooseDictionaryOptions"], result => {
                        resolve(result);
                    })
                })
            }
            this.localStorageData = await localStorageDataPromise();
        }
        createPopup() {
            this.popupSelect.innerHTML = `${(this.dictionariesOptionsForSelect())}`;
            this.popup.appendChild(this.popupSelect);
        }

        isTriggerKeyPressed(mouseupEvent) {
            let triggerKeysNotNone = ["ctrlKey", "shiftKey", "altKey"];
            // storage triggerKey
            let isStorageTriggerKeyNotNone = (triggerKeysNotNone.indexOf(this.localStorageData.triggerKey) > -1);
            // check if set triggerKey is not "none"
            if (isStorageTriggerKeyNotNone) {
                return (mouseupEvent[this.localStorageData.triggerKey]) ? true : false;
            } else { return true; }
        }

        isGloballyDisabled() {
            return (this.localStorageData.enableDisable.globally === "disable") ? true : false;
        }
        isCurrentWebsiteIsAllowed() {
            // blacklist/whitelist check
            let allowed = true;
            let currentWebsiteUrl = window.location.protocol + "//" + this.removeWWWBeginningOfHostName(window.location.hostname);
            if (this.localStorageData.enableDisable.listMode == "blacklist-mode") {
                if (this.localStorageData.enableDisable.blacklist.includes(currentWebsiteUrl)) {
                    allowed = false;
                }
            } else if (this.localStorageData.enableDisable.listMode == "whitelist-mode") {
                if (!this.localStorageData.enableDisable.whitelist.includes(currentWebsiteUrl)) {
                    allowed = false;
                }
            }
            return allowed;
        }

        // this element will be used for black background
        createFixedPositionElement() {
            this.fixedPositionElement = document.createElement('div');
            this.fixedPositionElement.classList.add('create-fixed-Position-element');
            this.body.appendChild(this.fixedPositionElement);
        }
        removePanelWhenClickedOutside(event) {
            if (this.panel && event.target !== this.panel && !this.panel.contains(event.target)) {
                this.body.removeChild(this.panel) && (this.panel = null);
                this.fixedPositionElement.style.display = 'none';
                return true;
            }
            return false;
        }

        getSelectedText() {
            // this.selectedText = this.selection.toString().replace(/[\.\*\?;!()\+,\[:\]<>^_`\[\]{}~\\\/\"\'=]/g, ' ').trim();
            // this.selectedText = this.selection.toString();
            let activeEl = document.activeElement;
            let activeElTagName = activeEl ? activeEl.tagName.toLowerCase() : null;
            if (
                (activeElTagName == "textarea") || (activeElTagName == "input" &&
                    /^(?:text|search|tel|url)$/i.test(activeEl.type)) &&
                (typeof activeEl.selectionStart == "number")
            ) {
                this.selectedText = activeEl.value.slice(activeEl.selectionStart, activeEl.selectionEnd);

            } else if (window.getSelection) {
                this.selectedText = window.getSelection().toString();
            }
        }

        removePopup() {
            if (this.isAdded) {
                if (this.body.removeChild(this.popup)) { this.isAdded = false; }
            }
        }
        isSelectedText(event) {
            // if (!this.selectedText || event.target === this.popup || this.selectedText.includes(' ')) {
            //     return false;
            // }
            if (!this.selectedText.trim() || event.target === this.popup) {
                return false;
            }
            return true;
        }
        dictionariesOptionsForSelect() {
            let options = '<option selected disabled>Choose Dictionary</option>';
            this.localStorageData.dictionaries.forEach(function(dictionary) {
                if (!dictionary.isHidden) {
                    options += `<option data-url="${dictionary.url.replace(/"/g, '&quot;').replace(/'/g, '&#x27;')}">${dictionary.title}</option>`
                }
            });
            return options;
        }
        showPopup(event) {

            // unset some of the styles that was set in the narrow width to center the popup
            this.popup.style.marginLeft = "unset";
            this.popup.style.position = "absolute";

            let offsetX = 15;
            let offsetY = 10;

            // this width and height represent the width and height defined in the index.css
            let popupWidth = 182;
            let popupHeight = 30;
            let scrollWidthX = window.innerHeight - document.documentElement.clientHeight;
            let scrollWidthY = window.innerWidth - document.documentElement.clientWidth;

            this.popup.style.top = `${event.pageY + offsetY}px`;
            this.popup.style.left = `${event.pageX + offsetX}px`;

            if ((event.x + popupWidth + offsetX + scrollWidthX) >= window.innerWidth) {
                this.popup.style.left = `${event.pageX - popupWidth - offsetX}px`;
            }

            if (event.y + popupHeight + offsetY + scrollWidthY >= window.innerHeight) {
                this.popup.style.top = `${event.pageY - popupHeight - offsetY}px`;
            }

            if ((event.x + popupWidth + offsetX + scrollWidthX) >= window.innerWidth &&
                (event.x - popupWidth - scrollWidthX <= 0)) {
                // center the popup
                this.popup.style.top = `${event.y + offsetY}px`;
                this.popup.style.left = "50%";
                // unset the below 2 styles at top
                this.popup.style.position = "fixed";
                this.popup.style.marginLeft = `-${popupWidth / 2}px`; // -91px

                if (event.y + popupHeight + offsetY + scrollWidthY >= window.innerHeight) {
                    this.popup.style.top = `${event.y - popupHeight - offsetY}px`;
                }

            }


            if (this.body.appendChild(this.popup)) { this.isAdded = true; }
        }
        showChooseDictionaryOptions() {
            return (this.localStorageData.showChooseDictionaryOptions == 'yes' ? true : false);
        }
        createPanel(event) {
            this.panel = document.createElement("div");
            this.panel.insertAdjacentHTML("afterbegin", `
              <div class="my-dictionary-panel-extra-options">
                <span class="my-dictionary-panel-back" title="Go back">🠈</span>
                <span class="my-dictionary-panel-forward" title="Go forward">🠊</span>
                <span class="my-dictionary-panel-maximize-restore" title="Maximize">🗖</span>
                <span class="my-dictionary-panel-close" title="Close the panel">🗙</span>
              </div>
              <div class="panel-select-panel-input-container">
                <select class="my-dictionary-panel-select my-dictionary-custom-select">${this.dictionariesOptionsForSelect()}</select>
                <form class="my-dictionary-form" title="Type your query and press Enter">
                  <input class="my-dictionary-query-input" placeholder="Type your query and press Enter" value="${this.selectedText.trim()}" autofocus>
                </form>
              </div>
          `);
            this.panel.classList.add("my-dictionary-panel");
            if (this.panelMaximized) {
                this.panel.classList.add('my-dictionary-panel-maximized');
            }
            this.fixedPositionElement.style.display = 'block';
            this.panelSelect = this.panel.querySelector('.my-dictionary-panel-select');
            this.panelQueryForm = this.panel.querySelector('.my-dictionary-form');
            this.panelQueryInput = this.panel.querySelector('.my-dictionary-query-input');
            this.panel.querySelector('.my-dictionary-panel-select')
                .addEventListener('change', this.changeDictionary());
            this.addEventListenerToPanelExtraOption();
            this.body.appendChild(this.panel);
        }
        createIFrame() {
            let url;
            if (this.showChooseDictionaryOptions()) {
                this.selectedDictionary = this.popupSelect.options[this.popupSelect.selectedIndex];
                let selectedDictionaryUrl = this.selectedDictionary.dataset.url;
                url = this.createDictionaryUrlForIFrame(selectedDictionaryUrl, this.selectedText.trim())
            } else {
                let firstDictionaryUrl = this.localStorageData.dictionaries[0].url;
                url = this.createDictionaryUrlForIFrame(firstDictionaryUrl, this.selectedText.trim())
            }
            this.iframe = document.createElement('iframe');
            this.iframe.classList.add('my-dictionary-iframe');
            this.iframe.src = chrome.runtime.getURL('data/iframe/iframe.html?url=' + encodeURIComponent(url));
            this.panel.appendChild(this.iframe);
        }
        changeDictionary() {
            if (!this.panel) { return; }
            this.panelSelect.addEventListener("change", () => {
                let query = this.panelQueryInput.value.trim();
                if (!query) { return; }
                let selectedDictionary = this.panelSelect.options[this.panelSelect.selectedIndex];
                let selectedDictionaryUrl = selectedDictionary.dataset.url;
                let url = this.createDictionaryUrlForIFrame(selectedDictionaryUrl, query);
                this.iframe.src = chrome.runtime.getURL('data/iframe/iframe.html?url=' + encodeURIComponent(url));
            });

        }
        changeDictionaryQuery() {
            if (!this.panel) { return; }
            let queryOld = this.panelQueryInput.value.trim();
            this.panelQueryForm.addEventListener("submit", (e) => {
                e.preventDefault();
                let query = this.panelQueryInput.value.trim();
                if (query == "" || query === queryOld) { return; }
                let selectedDictionary = this.panelSelect.options[this.panelSelect.selectedIndex];
                let selectedDictionaryUrl = selectedDictionary.dataset.url;
                if (!selectedDictionaryUrl) {
                    if (this.showChooseDictionaryOptions()) {
                        selectedDictionaryUrl = this.selectedDictionary.dataset.url;
                    } else {
                        selectedDictionaryUrl = this.localStorageData.dictionaries[0].url;
                    }
                }
                let url = this.createDictionaryUrlForIFrame(selectedDictionaryUrl, query);
                this.iframe.src = chrome.runtime.getURL('data/iframe/iframe.html?url=' + encodeURIComponent(url));
            });
        }
        createDictionaryUrlForIFrame(url, query) {
            if ((url).includes("%s")) {
                return url.replace("%s", query);
            } else {
                return `${url}/?${query}`;
            }
        }

        addEventListenerToPanelExtraOption() {
            let panelClose = this.panel.querySelector(".my-dictionary-panel-close");
            let panelMaximizeRestore = this.panel.querySelector(".my-dictionary-panel-maximize-restore");
            let panelBack = this.panel.querySelector(".my-dictionary-panel-back");
            let panelForward = this.panel.querySelector(".my-dictionary-panel-forward");

            panelClose.addEventListener('click', () => {
                this.body.removeChild(this.panel) && (this.panel = null);
                this.fixedPositionElement.style.display = 'none';
            });

            panelMaximizeRestore.addEventListener('click', () => {

                this.panel.classList.toggle('my-dictionary-panel-maximized');
                if (this.panel.classList.contains('my-dictionary-panel-maximized')) {
                    this.panelMaximized = true;
                    panelMaximizeRestore.innerHTML = '🗗';
                    panelMaximizeRestore.setAttribute('title', 'Restore to default');
                } else {
                    this.panelMaximized = false;
                    panelMaximizeRestore.innerHTML = '🗖';
                    panelMaximizeRestore.setAttribute('title', 'Maximize');

                }

            });
            panelBack.addEventListener('click', () => {
                history.back();
            })
            panelForward.addEventListener('click', () => {
                history.forward();
            })

        }

        removeWWWBeginningOfHostName(hostname) {
            // console.log(hostname);
            return hostname.replace(/^www\./, '');
        }
    }
    let dictionary = new Dictionary();
    await dictionary.getDataFromLocalStorage();

    if (dictionary.isGloballyDisabled()) return;

    if (!dictionary.isCurrentWebsiteIsAllowed()) return;

    dictionary._constructor();

    document.body.addEventListener('keyup', function keyPress(e) {
        if (e.key === "Escape") {
            dictionary.removePopup();
            if (dictionary.panel) {
                dictionary.body.removeChild(dictionary.panel) && (dictionary.panel = null);
                dictionary.fixedPositionElement.style.display = 'none';
            }
        }
    });

    document.body.addEventListener("mouseup", (mouseupEvent) => {

        if (mouseupEvent.target.classList.contains('my-dictionary-popup-select') ||
            mouseupEvent.target.closest(".my-dictionary-popup-select") ||
            mouseupEvent.target.closest(".my-dictionary-panel")) { return; }
        if (dictionary.removePanelWhenClickedOutside(mouseupEvent)) {
            return;
        }
        setTimeout(() => {
            dictionary.getSelectedText();
            dictionary.removePopup();
            // if triggerKey is not pressed don't execute rest of the code
            if (!dictionary.isTriggerKeyPressed(mouseupEvent)) { return; }


            // if no text is selected or clicked element is popup, don't execute the rest of the code
            if (!dictionary.isSelectedText(mouseupEvent)) { return; }

            if (!dictionary.showChooseDictionaryOptions()) {
                dictionary.createPanel(mouseupEvent);
                dictionary.createIFrame();
                dictionary.changeDictionaryQuery();
                return;
            }

            dictionary.createPopup()
            dictionary.showPopup(mouseupEvent);
            dictionary.popupSelect.onchange = (evt) => {
                dictionary.removePopup()
                evt.stopPropagation();
                evt.preventDefault();
                dictionary.createPanel(mouseupEvent);
                dictionary.createIFrame();
                dictionary.changeDictionaryQuery();
            }
        })
    });
})();