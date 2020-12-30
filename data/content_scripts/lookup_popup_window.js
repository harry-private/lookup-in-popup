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
            document.body.insertAdjacentHTML('afterbegin',
                `
                  <div class="lookup-popup-window-menu-bar">
                  <button class="lookup-popup-window-menu-bar-toggle">❮</button>
                  <!-- ❯ arrow -->
                  <div class="lookup-popup-window-menu-bar-collapse">
                      <div class="lookup-popup-window-menu-bar-extra">
                          <button class="lookup-popup-window-back">🠈</button>
                          <button class="lookup-popup-window-forward">🠊</button>
                          <button class="lookup-popup-window-reload">⭮</button>
                      </div>
                      <div class="lookup-popup-window-menu-bar-form-container">
                          <form class="lookup-popup-window-menu-bar-form" title="Type your query and press Enter">
                              <input class="lookup-popup-window-menu-bar-input" placeholder="Type your query and press Enter" value="${this.res.query}" autofocus>
                          </form>
                          <select class="lookup-popup-window-menu-bar-select">${this.sourcesOptionsForSelect()}</select>
                      </div>
                    </div>
                  </div>
                `
            );
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
    }

    let lookupPopupWindow = new LookupPopupWindow();
    lookupPopupWindow.closeOnEsc();
    await lookupPopupWindow._constructor(res);
    window.addEventListener('DOMContentLoaded', (event) => {
        lookupPopupWindow.insertEmptySpace();
        lookupPopupWindow.insertNavbar();
    });
};