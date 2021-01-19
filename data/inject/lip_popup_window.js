chrome.runtime.sendMessage({
    method: 'extend',
}, (response) => {
    if (response && response.isLipPopupWindow) {
        console.log('currentLipPopupWindowData: ', response.currentLipPopupWindowData);
        lipPopupWindowRun(response.currentLipPopupWindowData);
    }
});

let lipPopupWindowRun = async (currentLipPopupWindowData) => {
    'use strict';
    class LipPopupWindow {


        async _constructor(currentLipPopupWindowData) {
            // response comes from background 
            this.currentLipPopupWindowData = currentLipPopupWindowData;
            this.localStorageData = await lipUtility.localStorageDataPromise();

            this.navbar = null;
            this.select = null;
            this.from = null;
            this.toggleMenuBtn = null;
            this.isMenuHidden = false;
            this.backBtn = null;
            this.forwardBtn = null;
            this.reloadBtn = null;
            this.run();

        }

        run() {

            if (this.localStorageData.popupWindow.isCloseOnEscAllowed) {
                this.closeOnEsc();
            }


            if (!this.localStorageData.popupWindow.isShowingNavbarAllowed || this.currentLipPopupWindowData.navbarState == "removed") { return; }

            let observer = new MutationObserver(() => {
                if (document.body) {
                    this.body = document.body;
                    this.html = document.documentElement;

                    this.insertEmptySpace();
                    this.insertNavbar();
                    this.querySubmitted();
                    this.addEventListenerToToggleMenuBtn();
                    this.addEventListenerToRemoveMenuBtn();
                    this.addEventListenerToBackBtn();
                    this.addEventListenerToForwardBtn();
                    this.addEventListenerToReloadBtn();

                    observer.disconnect();
                }
            });
            observer.observe(document.body || document.documentElement, { childList: true });
        }
        closeOnEsc() {
            window.addEventListener('keyup', e => {
                if (e.code === 'Escape') {
                    chrome.runtime.sendMessage({
                        method: 'close-lip-popup-window'
                    });
                }
            });
        }
        insertEmptySpace() {
            document.body.insertAdjacentHTML('beforeend', `<div class="lip-popup-window-empty-space"></div>`);
        }
        insertNavbar() {
            this.navbar = document.createElement("div");

            this.navbar.insertAdjacentHTML('afterbegin',
                `
                  <button class="lip-popup-window-menu-bar-toggle">
                  <span>❮</span>
                  </button>
                  <div class="lip-popup-window-menu-bar-collapse">
                      <div class="lip-popup-window-menu-bar-extra">
                          <button class="lip-popup-window-back">🠈</button>
                          <button class="lip-popup-window-forward">🠊</button>
                          <button class="lip-popup-window-reload">⭮</button>
                      </div>
                      <div class="lip-popup-window-menu-bar-form-container">
                          <form class="lip-popup-window-menu-bar-form"  action="">
                              <input name="query" class="lip-popup-window-menu-bar-query-input" placeholder="Type your query here..." value="${this.currentLipPopupWindowData.query}" autofocus>
                              <select class="lip-popup-window-menu-bar-select">${this.sourcesOptionsForSelect()}</select>
                              <button class="lip-popup-window-menu-bar-submit"></button>
                          </form>
                      </div>
                    </div>
                    <button class="lip-popup-window-menu-bar-remove">
                    <span>✖</span>
                    </button>
                `
            );
            this.navbar.classList.add("lip-popup-window-menu-bar");
            this.select = this.navbar.querySelector('.lip-popup-window-menu-bar-select');
            this.form = this.navbar.querySelector('.lip-popup-window-menu-bar-form');
            this.toggleMenuBtn = this.navbar.querySelector('.lip-popup-window-menu-bar-toggle');
            this.removeMenuBtn = this.navbar.querySelector('.lip-popup-window-menu-bar-remove');
            this.toggleMenuBtnIcon = this.toggleMenuBtn.querySelector('span');
            this.backBtn = this.navbar.querySelector('.lip-popup-window-back');
            this.forwardBtn = this.navbar.querySelector('.lip-popup-window-forward');
            this.reloadBtn = this.navbar.querySelector('.lip-popup-window-reload');
            this.menuBarCollapse = this.navbar.querySelector('.lip-popup-window-menu-bar-collapse');


            if (this.currentLipPopupWindowData.navbarState == "hidden") {
                this.isMenuHidden = true;
                this.toggleMenuBtnIcon.style.transform = 'rotate(180deg)';
                this.menuBarCollapse.classList.add('hidden');
                this.removeMenuBtn.classList.add('hidden');
            }


            this.body.appendChild(this.navbar);


        }
        sourcesOptionsForSelect() {
            let options = '';
            this.localStorageData.sources.forEach(function(source) {
                if (!source.isHidden) {
                    options += `<option data-url="${source.url.replace(/"/g, '&quot;').replace(/'/g, '&#x27;')}">${source.title}</option>`;
                }
            });
            return options;
        }


        querySubmitted() {
            if (!this.navbar) { return; }

            this.form.addEventListener("submit", (e) => {
                e.preventDefault();
                let query = this.form['query'].value.trim();
                if (query == "") { return; }

                let selectedSource = this.select.options[this.select.selectedIndex];
                let selectedSourceUrl = selectedSource.dataset.url;
                if (!selectedSourceUrl) {
                    selectedSourceUrl = this.selectedSource.dataset.url;
                }
                let url = lipUtility.createSourceUrlForNewWindow(selectedSourceUrl, query);
                location.href = url;
                // return;
                chrome.runtime.sendMessage({
                    method: 'update_opened_lip_popup_window_data',
                    changeData: ['query', query]
                });
            });
        }

        addEventListenerToToggleMenuBtn() {
            this.toggleMenuBtn.addEventListener('click', (e) => {
                if (!this.isMenuHidden) {
                    this.isMenuHidden = true;
                    this.toggleMenuBtnIcon.style.transform = 'rotate(180deg)';
                    console.log(this.toggleMenuBtnIcon);
                    this.menuBarCollapse.classList.add('hidden');
                    this.removeMenuBtn.classList.add('hidden');
                    chrome.runtime.sendMessage({
                        method: 'update_opened_lip_popup_window_data',
                        changeData: ['navbarState', "hidden"]
                    });
                } else {
                    this.isMenuHidden = false;
                    this.toggleMenuBtnIcon.style.transform = 'rotate(0deg)';
                    this.menuBarCollapse.classList.remove('hidden');
                    this.removeMenuBtn.classList.remove('hidden');
                    chrome.runtime.sendMessage({
                        method: 'update_opened_lip_popup_window_data',
                        changeData: ['navbarState', "visible"]
                    });
                }
            });

        }
        addEventListenerToRemoveMenuBtn() {
            this.removeMenuBtn.addEventListener('click', (e) => {
                this.navbar.remove();
                chrome.runtime.sendMessage({
                    method: 'update_opened_lip_popup_window_data',
                    changeData: ['navbarState', "removed"]
                });

            });
        }

        addEventListenerToBackBtn() {
            this.backBtn.addEventListener("click", (e) => {
                window.history.back();
            });
        }
        addEventListenerToForwardBtn() {
            this.forwardBtn.addEventListener("click", (e) => {
                window.history.forward();
            });
        }
        addEventListenerToReloadBtn() {
            this.reloadBtn.addEventListener("click", (e) => {
                location.reload();
            });
        }
    }

    let lipPopupWindow = new LipPopupWindow();
    await lipPopupWindow._constructor(currentLipPopupWindowData);

};