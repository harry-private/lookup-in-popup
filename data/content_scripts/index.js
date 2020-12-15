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
            this.selectedText = "";
            this.selectedSource;
            // appending "source-" because StackOverflow has the popup class, so won't work there
            this.createFixedPositionElement()
        }
        async getDataFromLocalStorage() {
            this.localStorageData = await lookupUtility.localStorageDataPromise();
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
            let currentWebsiteUrl = window.location.protocol + "//" + lookupUtility.removeWWWBeginningOfHostname(window.location.hostname);
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


        createWindowPopup(event) {
            let url;
            if (this.showChooseSourceOptions()) {
                this.selectedSource = this.popupSelect.options[this.popupSelect.selectedIndex];
                let selectedSourceUrl = this.selectedSource.dataset.url;
                url = lookupUtility.createSourceUrlForNewWindow(selectedSourceUrl, this.selectedText.trim())
            } else {
                let firstSourceUrl = this.localStorageData.sources[0].url;
                url = lookupUtility.createSourceUrlForNewWindow(firstSourceUrl, this.selectedText.trim())
            }
            chrome.runtime.sendMessage({
                method: 'open-lookup-popup',
                // url: encodeURIComponent(url)
                url: url
            });
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

        }
    });

    document.body.addEventListener("mouseup", (mouseupEvent) => {

        if (mouseupEvent.target.classList.contains('lookup-popup-select') ||
            mouseupEvent.target.closest(".lookup-popup-select")) { return; }

        setTimeout(() => {
            lookup.getSelectedText();
            lookup.removePopup();
            // if triggerKey is not pressed don't execute rest of the code
            if (!lookup.isTriggerKeyPressed(mouseupEvent)) { return; }


            // if no text is selected or clicked element is popup, don't execute the rest of the code
            if (!lookup.isSelectedText(mouseupEvent)) { return; }

            if (!lookup.showChooseSourceOptions()) {
                lookup.createWindowPopup(mouseupEvent);
                return;
            }

            lookup.createPopup();
            lookup.showPopup(mouseupEvent);
            lookup.popupSelect.onchange = (evt) => {
                lookup.removePopup()
                evt.stopPropagation();
                evt.preventDefault();
                lookup.createWindowPopup(mouseupEvent);
            }
        })
    });
})();