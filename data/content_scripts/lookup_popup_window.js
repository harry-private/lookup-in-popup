chrome.runtime.sendMessage({
    method: 'extend',
}, (res) => {
    if (res) {
        console.log('res: ', res);
        lookupPopupWindowRun(res);
    }
});

let lookupPopupWindowRun = async (res) => {
    'use strict';
    class LookupPopupWindow {


        async _constructor(res) {
            // res comes from background 
            this.res = res;
            this.localStorageData = await lookupUtility.localStorageDataPromise();

            this.navbar = null;
            this.select = null;
            this.from = null;
            this.input = null;
            this.toggleMenuBtn = null;
            this.isMenuHidden = false;
            this.backBtn = null;
            this.forwardBtn = null;
            this.reloadBtn = null;
            this.run();

        }

        run() {
            lookupPopupWindow.closeOnEsc();
            // TODO Remove or Show navbar based on user preference. Can change the value from settings

            if (this.res.navbarState == "removed") { return; }
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
                        method: 'close-lookup-popup-window'
                    });
                }
            });
        }
        insertEmptySpace() {
            document.body.insertAdjacentHTML('beforeend',
                `
            <div class="lookup-popup-window-empty-space"></div>
          `
            );
        }
        insertNavbar() {
            this.navbar = document.createElement("div");

            this.navbar.insertAdjacentHTML('afterbegin',
                `
                  <button class="lookup-popup-window-menu-bar-toggle">
                  <span>❮</span>
                  </button>
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
                              <select class="lookup-popup-window-menu-bar-select">${this.sourcesOptionsForSelect()}</select>
                              <button class="lookup-popup-window-menu-bar-submit"></button>
                          </form>
                      </div>
                    </div>
                    <button class="lookup-popup-window-menu-bar-remove">
                    <span>✖</span>
                    </button>
                `
            );
            this.navbar.classList.add("lookup-popup-window-menu-bar");
            this.select = this.navbar.querySelector('.lookup-popup-window-menu-bar-select');
            this.form = this.navbar.querySelector('.lookup-popup-window-menu-bar-form');
            this.input = this.navbar.querySelector('.lookup-popup-window-menu-bar-input');
            this.toggleMenuBtn = this.navbar.querySelector('.lookup-popup-window-menu-bar-toggle');
            this.removeMenuBtn = this.navbar.querySelector('.lookup-popup-window-menu-bar-remove');
            this.toggleMenuBtnIcon = this.toggleMenuBtn.querySelector('span');
            this.backBtn = this.navbar.querySelector('.lookup-popup-window-back');
            this.forwardBtn = this.navbar.querySelector('.lookup-popup-window-forward');
            this.reloadBtn = this.navbar.querySelector('.lookup-popup-window-reload');
            this.menuBarCollapse = this.navbar.querySelector('.lookup-popup-window-menu-bar-collapse');


            if (this.res.navbarState == "hidden") {
                this.isMenuHidden = true;
                this.toggleMenuBtnIcon.style.transform = 'rotate(180deg)';
                this.menuBarCollapse.classList.add('hide');
                this.removeMenuBtn.classList.add('hide');
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
                let query = this.input.value.trim();
                if (query == "") { return; }

                let selectedSource = this.select.options[this.select.selectedIndex];
                let selectedSourceUrl = selectedSource.dataset.url;
                if (!selectedSourceUrl) {
                    selectedSourceUrl = this.selectedSource.dataset.url;
                }
                let url = lookupUtility.createSourceUrlForNewWindow(selectedSourceUrl, query);
                location.href = url;
                // return;
                chrome.runtime.sendMessage({
                    method: 'update_opened_lookup_popup_window_data',
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
                    this.menuBarCollapse.classList.add('hide');
                    this.removeMenuBtn.classList.add('hide');
                    chrome.runtime.sendMessage({
                        method: 'update_opened_lookup_popup_window_data',
                        changeData: ['navbarState', "hidden"]
                    });
                } else {
                    this.isMenuHidden = false;
                    this.toggleMenuBtnIcon.style.transform = 'rotate(0deg)';
                    this.menuBarCollapse.classList.remove('hide');
                    this.removeMenuBtn.classList.remove('hide');
                    chrome.runtime.sendMessage({
                        method: 'update_opened_lookup_popup_window_data',
                        changeData: ['navbarState', "visible"]
                    });
                }
            });

        }
        addEventListenerToRemoveMenuBtn() {
            this.removeMenuBtn.addEventListener('click', (e) => {
                this.navbar.remove();
                chrome.runtime.sendMessage({
                    method: 'update_opened_lookup_popup_window_data',
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

    let lookupPopupWindow = new LookupPopupWindow();
    await lookupPopupWindow._constructor(res);

};