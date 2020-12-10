// import 'babel-polyfill'
(async () => {
    'use strict'
    class Lookup {
        _constructor() {
            // this.sources = {};
            this.body = document.body;
            this.html = document.documentElement;
            this.popup = document.createElement('div');
            this.popupSelect = document.createElement('select');
            this.popup.classList.add('lookup-popup');
            this.popupSelect.classList.add('lookup-popup-select');
            this.popupSelect.classList.add('lookup-custom-select');
            this.isAdded = false;
            this.iframe;
            this.panel;
            this.panelSelect = null;
            this.panelQueryForm = null;
            this.panelQueryInput = null;
            this.panelMaximized = false;
            this.selectedText = "";
            this.selectedSource;
            // appending "source-" because StackOverflow has the popup class, so won't work there
            this.createFixedPositionElement()
        }
        async getDataFromLocalStorage() {
            let localStorageDataPromise = async () => {
                return new Promise(resolve => {
                    chrome.storage.sync.get(['sources', "triggerKey", "enableDisable", "showChooseSourceOptions"], result => {
                        resolve(result);
                    })
                })
            }
            this.localStorageData = await localStorageDataPromise();
        }
        createPopup() {
            this.popupSelect.innerHTML = `${(this.sourcesOptionsForSelect())}`;
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
                console.log("removed")
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
        sourcesOptionsForSelect() {
            let options = '<option selected disabled>Choose Source</option>';
            this.localStorageData.sources.forEach(function(source) {
                if (!source.isHidden) {
                    options += `<option data-url="${source.url.replace(/"/g, '&quot;').replace(/'/g, '&#x27;')}">${source.title}</option>`
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
        showChooseSourceOptions() {
            return (this.localStorageData.showChooseSourceOptions == 'yes' ? true : false);
        }
        createPanel(event) {
            this.panel = document.createElement("div");
            this.panel.insertAdjacentHTML("afterbegin", `
              <div class="lookup-panel-extra-options">
                <span class="lookup-panel-back" title="Go back">🠈</span>
                <span class="lookup-panel-forward" title="Go forward">🠊</span>
                <span class="lookup-panel-maximize-restore" title="Maximize">🗖</span>
                <span class="lookup-panel-close" title="Close the panel">🗙</span>
              </div>
              <div class="panel-select-panel-input-container">
                <select class="lookup-panel-select lookup-custom-select">${this.sourcesOptionsForSelect()}</select>
                <form class="lookup-form" title="Type your query and press Enter">
                  <input class="lookup-query-input" placeholder="Type your query and press Enter" value="${this.selectedText.trim()}" autofocus>
                </form>
              </div>
          `);
            this.panel.classList.add("lookup-panel");
            if (this.panelMaximized) {
                this.panel.classList.add('lookup-panel-maximized');
            }
            this.fixedPositionElement.style.display = 'block';
            this.panelSelect = this.panel.querySelector('.lookup-panel-select');
            this.panelQueryForm = this.panel.querySelector('.lookup-form');
            this.panelQueryInput = this.panel.querySelector('.lookup-query-input');
            this.panel.querySelector('.lookup-panel-select')
                .addEventListener('change', this.changeSource());
            this.addEventListenerToPanelExtraOption();
            this.body.appendChild(this.panel);
        }
        createIFrame() {
            let url;
            if (this.showChooseSourceOptions()) {
                this.selectedSource = this.popupSelect.options[this.popupSelect.selectedIndex];
                let selectedSourceUrl = this.selectedSource.dataset.url;
                url = this.createSourceUrlForIFrame(selectedSourceUrl, this.selectedText.trim())
            } else {
                let firstSourceUrl = this.localStorageData.sources[0].url;
                url = this.createSourceUrlForIFrame(firstSourceUrl, this.selectedText.trim())
            }
            this.iframe = document.createElement('iframe');
            this.iframe.classList.add('lookup-iframe');
            this.iframe.src = chrome.runtime.getURL('data/iframe/iframe.html?url=' + encodeURIComponent(url));
            this.panel.appendChild(this.iframe);
        }
        changeSource() {
            if (!this.panel) { return; }
            this.panelSelect.addEventListener("change", () => {
                let query = this.panelQueryInput.value.trim();
                if (!query) { return; }
                let selectedSource = this.panelSelect.options[this.panelSelect.selectedIndex];
                let selectedSourceUrl = selectedSource.dataset.url;
                let url = this.createSourceUrlForIFrame(selectedSourceUrl, query);
                this.iframe.src = chrome.runtime.getURL('data/iframe/iframe.html?url=' + encodeURIComponent(url));
            });

        }
        changeQuery() {
            if (!this.panel) { return; }
            let queryOld = this.panelQueryInput.value.trim();
            this.panelQueryForm.addEventListener("submit", (e) => {
                e.preventDefault();
                let query = this.panelQueryInput.value.trim();
                if (query == "" || query === queryOld) { return; }
                let selectedSource = this.panelSelect.options[this.panelSelect.selectedIndex];
                let selectedSourceUrl = selectedSource.dataset.url;
                if (!selectedSourceUrl) {
                    if (this.showChooseSourceOptions()) {
                        selectedSourceUrl = this.selectedSource.dataset.url;
                    } else {
                        selectedSourceUrl = this.localStorageData.sources[0].url;
                    }
                }
                let url = this.createSourceUrlForIFrame(selectedSourceUrl, query);
                this.iframe.src = chrome.runtime.getURL('data/iframe/iframe.html?url=' + encodeURIComponent(url));
            });
        }
        createSourceUrlForIFrame(url, query) {
            if ((url).includes("%s")) {
                return url.replace("%s", query);
            } else {
                return `${url}/?${query}`;
            }
        }

        addEventListenerToPanelExtraOption() {
            let panelClose = this.panel.querySelector(".lookup-panel-close");
            let panelMaximizeRestore = this.panel.querySelector(".lookup-panel-maximize-restore");
            let panelBack = this.panel.querySelector(".lookup-panel-back");
            let panelForward = this.panel.querySelector(".lookup-panel-forward");

            panelClose.addEventListener('click', () => {
                this.body.removeChild(this.panel) && (this.panel = null);
                this.fixedPositionElement.style.display = 'none';
            });

            panelMaximizeRestore.addEventListener('click', () => {

                this.panel.classList.toggle('lookup-panel-maximized');
                if (this.panel.classList.contains('lookup-panel-maximized')) {
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
    let lookup = new Lookup();
    await lookup.getDataFromLocalStorage();

    if (lookup.isGloballyDisabled()) return;

    if (!lookup.isCurrentWebsiteIsAllowed()) return;

    lookup._constructor();

    document.body.addEventListener('keyup', function keyPress(e) {
        if (e.key === "Escape") {
            lookup.removePopup();
            if (lookup.panel) {
                lookup.body.removeChild(lookup.panel) && (lookup.panel = null);
                lookup.fixedPositionElement.style.display = 'none';
            }
        }
    });

    document.body.addEventListener("mouseup", (mouseupEvent) => {

        if (mouseupEvent.target.classList.contains('lookup-popup-select') ||
            mouseupEvent.target.closest(".lookup-popup-select") ||
            mouseupEvent.target.closest(".lookup-panel")) { return; }
        if (lookup.removePanelWhenClickedOutside(mouseupEvent)) {
            return;
        }
        setTimeout(() => {
            lookup.getSelectedText();
            lookup.removePopup();
            // if triggerKey is not pressed don't execute rest of the code
            if (!lookup.isTriggerKeyPressed(mouseupEvent)) { return; }


            // if no text is selected or clicked element is popup, don't execute the rest of the code
            if (!lookup.isSelectedText(mouseupEvent)) { return; }

            if (!lookup.showChooseSourceOptions()) {
                lookup.createPanel(mouseupEvent);
                lookup.createIFrame();
                lookup.changeQuery();
                return;
            }

            lookup.createPopup();
            lookup.showPopup(mouseupEvent);
            lookup.popupSelect.onchange = (evt) => {
                lookup.removePopup()
                evt.stopPropagation();
                evt.preventDefault();
                lookup.createPanel(mouseupEvent);
                lookup.createIFrame();
                lookup.changeQuery();
            }
        })
    });
})();