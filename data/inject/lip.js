(async () => {
    'use strict'
    class Lip {
        async _constructor() {
            // this.searchEngines = {};
            this.localStorageData = await lipUtility.localStorageDataPromise();

            if (this.isGloballyDisabled()) return;

            if (!this.isCurrentWebsiteIsAllowed()) return;

            let observer = new MutationObserver(() => {
                if (document.body) {
                    this.body = document.body;
                    this.html = document.documentElement;
                    this.bubble = document.createElement('div');
                    this.bubbleSelect = document.createElement('select');
                    this.bubble.classList.add('lip-bubble');
                    this.bubbleSelect.classList.add('lip-bubble-select');
                    this.isAdded = false;
                    this.selectedText = "";
                    this.selectedSearchEngine;
                    this.run();

                    observer.disconnect();
                }
            });
            observer.observe(document.body || document.documentElement, { childList: true });
        }

        run() {
            this.addKeyupListenerToBody();
            this.addMouseupListenerToBody(); // main
        }

        createBubble() {
            this.bubbleSelect.innerHTML = `${(this.searchEnginesOptionsForSelect())}`;
            this.bubble.appendChild(this.bubbleSelect);
        }

        isTriggerKeyPressed(mouseupEvent) {
            if (this.localStorageData.triggerKey == "none") { return true; }
            return mouseupEvent[this.localStorageData.triggerKey]; // Boolean 
        }

        isGloballyDisabled() {
            return this.localStorageData.enableDisable.globally == "disable"; // Boolean
        }
        isCurrentWebsiteIsAllowed() {
            // website access check
            let isAllowed = true;
            let currentWebsiteUrl = window.location.protocol + "//" + lipUtility.removeWWWBeginningOfHostname(window.location.hostname);
            if (this.localStorageData.enableDisable.websiteAccessMode == "deny-mode") {
                if (this.localStorageData.enableDisable.denyList.includes(currentWebsiteUrl)) {
                    isAllowed = false;
                }
            } else if (this.localStorageData.enableDisable.websiteAccessMode == "allow-mode") {
                if (!this.localStorageData.enableDisable.allowList.includes(currentWebsiteUrl)) {
                    isAllowed = false;
                }
            }
            return isAllowed;
        }


        getSelectedText() {
            this.selectedText = "";
            // this.selectedText = this.selection.toString().replace(/[\.\*\?;!()\+,\[:\]<>^_`\[\]{}~\\\/\"\'=]/g, ' ').trim();
            // this.selectedText = this.selection.toString();
            let activeEl = document.activeElement;
            let activeElTagName = activeEl ? activeEl.tagName.toLowerCase() : null;
            if (
                (activeElTagName == "textarea") || (activeElTagName == "input" &&
                    /^(?:text|search|tel|url|email)$/i.test(activeEl.type)) &&
                (typeof activeEl.selectionStart == "number")
            ) {
                this.selectedText = activeEl.value.slice(activeEl.selectionStart, activeEl.selectionEnd);

            } else if (window.getSelection) {
                this.selectedText = window.getSelection().toString();
            }
        }

        removeBubble() {
            if (this.isAdded) {
                if (this.body.removeChild(this.bubble)) { this.isAdded = false; }
            }
        }
        isSelectedText(event) {
            // if (!this.selectedText || event.target === this.popup || this.selectedText.includes(' ')) {
            //     return false;
            // }
            if (!this.selectedText.trim() || event.target === this.bubble) {
                return false;
            }
            return true;
        }
        searchEnginesOptionsForSelect() {
            let options = '<option selected disabled></option>';
            this.localStorageData.searchEngines.forEach(function(searchEngine) {
                if (!searchEngine.isHidden) {
                    options += `<option data-url="${searchEngine.url.replace(/"/g, '&quot;').replace(/'/g, '&#x27;')}">${searchEngine.title}</option>`
                }
            });
            return options;
        }
        showBubble(event) {
            // unset some of the styles that was set in the narrow width to center the popup
            this.bubble.style.marginLeft = "unset";
            this.bubble.style.position = "absolute";

            let offsetX = 15;
            let offsetY = 10;

            // this width and height represent the width and height defined in the lip.css
            let bubbleWidth = 32;
            let bubbleHeight = 30;
            let scrollWidthX = window.innerHeight - document.documentElement.clientHeight;
            let scrollWidthY = window.innerWidth - document.documentElement.clientWidth;

            this.bubble.style.top = `${event.pageY + offsetY}px`;
            this.bubble.style.left = `${event.pageX + offsetX}px`;

            if ((event.x + bubbleWidth + offsetX + scrollWidthX) >= window.innerWidth) {
                this.bubble.style.left = `${event.pageX - bubbleWidth - offsetX}px`;
            }

            if (event.y + bubbleHeight + offsetY + scrollWidthY >= window.innerHeight) {
                this.bubble.style.top = `${event.pageY - bubbleHeight - offsetY}px`;
            }

            if ((event.x + bubbleWidth + offsetX + scrollWidthX) >= window.innerWidth &&
                (event.x - bubbleWidth - scrollWidthX <= 0)) {
                // center the bubble
                this.bubble.style.top = `${event.y + offsetY}px`;
                this.bubble.style.left = "50%";
                // unset the below 2 styles at top
                this.bubble.style.position = "fixed";
                this.bubble.style.marginLeft = `-${bubbleWidth / 2}px`;

                if (event.y + bubbleHeight + offsetY + scrollWidthY >= window.innerHeight) {
                    this.bubble.style.top = `${event.y - bubbleHeight - offsetY}px`;
                }

            }


            if (this.body.appendChild(this.bubble)) { this.isAdded = true; }
        }

        createLipPopupWindow(event) {
            let url;
            if (this.localStorageData.isShowingBubbleAllowed) {
                this.selectedSearchEngine = this.bubbleSelect.options[this.bubbleSelect.selectedIndex];
                let selectedSearchEnginesUrl = this.selectedSearchEngine.dataset.url;
                url = lipUtility.createSearchEngineUrlForNewWindow(selectedSearchEnginesUrl, this.selectedText.trim())
            } else {
                let firstSearchEngineUrl = this.localStorageData.searchEngines[0].url;
                url = lipUtility.createSearchEngineUrlForNewWindow(firstSearchEngineUrl, this.selectedText.trim())
            }
            chrome.runtime.sendMessage({
                method: 'open-lip-popup-window',
                // url: encodeURIComponent(url)
                url: url,
                query: this.selectedText.trim()
            });
        }

        addMouseupListenerToBody() {
            document.body.addEventListener("mouseup", (mouseupEvent) => {
                if (mouseupEvent.target.classList.contains('lip-bubble-select') ||
                    mouseupEvent.target.closest(".lip-bubble-select")) { return; }

                // setTimeout is important
                setTimeout(() => {

                    this.getSelectedText();
                    this.removeBubble();
                    // if triggerKey is not pressed don't execute rest of the code
                    if (!this.isTriggerKeyPressed(mouseupEvent)) { return; }


                    // if no text is selected or clicked element is bubble, don't execute the rest of the code
                    if (!this.isSelectedText(mouseupEvent)) { return; }

                    if (!this.localStorageData.isShowingBubbleAllowed) {
                        this.createLipPopupWindow(mouseupEvent);
                        return;
                    }

                    this.createBubble();
                    this.showBubble(mouseupEvent);
                    this.bubbleSelect.onchange = (evt) => {
                        this.removeBubble();
                        evt.stopPropagation();
                        evt.preventDefault();
                        this.createLipPopupWindow(mouseupEvent);
                    };
                });
            });
        }

        addKeyupListenerToBody() {
            document.body.addEventListener('keyup', e => {
                if (e.code === 'Escape') {
                    this.removeBubble();

                }
            });
        }


    }
    let lip = new Lip();
    await lip._constructor();
})();