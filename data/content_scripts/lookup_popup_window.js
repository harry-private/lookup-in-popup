chrome.runtime.sendMessage({
    method: 'extend',
}, (res) => {
    if (res) {
        console.log('res: ', res);
        lookupPopupWindowRun(res);
    }
});

let lookupPopupWindowRun = async (res) => {
    'use strict'
    class LookupPopupWindow {


        async _constructor(res) {
            // res comes from background 
            this.res = res;
            this.localStorageData = await lookupUtility.localStorageDataPromise();

            this.navBar;
            this.select = null;
            this.from = null;
            this.input = null;
            this.run();

        }

        run() {
            lookupPopupWindow.closeOnEsc();
            window.addEventListener('DOMContentLoaded', (event) => {
                this.body = document.body;
                this.html = document.documentElement;

                this.insertEmptySpace();
                this.insertNavbar();
                this.querySubmitted();
            });
        }
        closeOnEsc() {
            window.addEventListener('keyup', e => {
                if (e.code === 'Escape') {
                    chrome.runtime.sendMessage({
                        method: 'close-lookup-popup-window'
                    });
                }
            });
        }
        insertEmptySpace() {
            document.body.insertAdjacentHTML('beforeend',
                `
            <div class="lookupPopupWindowEmptySpace"></div>
          `
            );
        }
        insertNavbar() {
            this.navBar = document.createElement("div");

            this.navBar.insertAdjacentHTML('afterbegin',
                `
                  <button class="lookup-popup-window-menu-bar-toggle">❮</button>
                  <!-- ❯ arrow -->
                  <div class="lookup-popup-window-menu-bar-collapse">
                      <div class="lookup-popup-window-menu-bar-extra">
                          <button class="lookup-popup-window-back">🠈</button>
                          <button class="lookup-popup-window-forward">🠊</button>
                          <button class="lookup-popup-window-reload">⭮</button>
                      </div>
                      <div class="lookup-popup-window-menu-bar-form-container">
                          <form class="lookup-popup-window-menu-bar-form"  action="" title="Type your query and press Enter">
                              <input class="lookup-popup-window-menu-bar-input" placeholder="Type your query and press Enter" value="${this.res.query}" autofocus>
                          </form>
                          <select class="lookup-popup-window-menu-bar-select">${this.sourcesOptionsForSelect()}</select>
                      </div>
                    </div>
                `
            );
            this.navBar.classList.add("lookup-popup-window-menu-bar");
            this.select = this.navBar.querySelector('.lookup-popup-window-menu-bar-select');
            this.form = this.navBar.querySelector('.lookup-popup-window-menu-bar-form');
            this.input = this.navBar.querySelector('.lookup-popup-window-menu-bar-input');
            this.select.addEventListener('change', this.sourceChanged());
            this.body.appendChild(this.navBar);

        }
        sourcesOptionsForSelect() {
            let options = '';
            this.localStorageData.sources.forEach(function(source) {
                if (!source.isHidden) {
                    options += `<option data-url="${source.url.replace(/"/g, '&quot;').replace(/'/g, '&#x27;')}">${source.title}</option>`
                }
            });
            return options;
        }

        sourceChanged(e) {
            return () => {
                if (!this.navBar) { return; }
                let query = this.input.value.trim();
                if (!query) { return; }
                let selectedSource = this.select.options[this.select.selectedIndex];
                let selectedSourceUrl = selectedSource.dataset.url;
                let url = lookupUtility.createSourceUrlForNewWindow(selectedSourceUrl, query);
                chrome.runtime.sendMessage({
                    method: 'open-lookup-popup-window',
                    // url: encodeURIComponent(url)
                    url,
                    query
                });
            }

        }
        querySubmitted() {
            if (!this.navBar) { return; }

            console.log('this.form: ', this.form);
            this.form.addEventListener("submit", (e) => {
                e.preventDefault();
                console.log("lkj")
                let query = this.input.value.trim();

                let selectedSource = this.select.options[this.select.selectedIndex];
                let selectedSourceUrl = selectedSource.dataset.url;
                if (!selectedSourceUrl) {
                    selectedSourceUrl = this.selectedSource.dataset.url;
                }
                let url = lookupUtility.createSourceUrlForNewWindow(selectedSourceUrl, query);
                chrome.runtime.sendMessage({
                    method: 'open-lookup-popup-window',
                    // url: encodeURIComponent(url)
                    url,
                    query
                });
            });
        }
    }

    let lookupPopupWindow = new LookupPopupWindow();
    await lookupPopupWindow._constructor(res);

};