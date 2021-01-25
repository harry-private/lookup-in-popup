(async () => {
    'use strict'
    class LipFromToolbar {
        async _constructor() {
            this.localStorageData = await lipUtility.localStorageDataPromise();
            console.log(this.localStorageData);
            this.body = document.body;
            this.html = document.documentElement;

            this.navBar;
            this.select = null;
            this.from = null;
            this.run();
        }
        run() {
            this.insertNavbar();
            this.querySubmitted();
        }
        searchEnginesOptionsForSelect() {
            let options = '';
            this.localStorageData.searchEngines.forEach(function(searchEngine) {
                if (!searchEngine.isHidden) {
                    options += `<option data-url="${searchEngine.url.replace(/"/g, '&quot;').replace(/'/g, '&#x27;')}">${searchEngine.title}</option>`
                }
            });
            return options;
        }

        insertNavbar() {
            this.navBar = document.createElement("div");
            this.navBar.insertAdjacentHTML("afterbegin", `
              <div class="formContainer">
                <form class="form">
                  <input name="query" class="query-input" placeholder="Type your query here..." autofocus>
                  <select class="select">${this.searchEnginesOptionsForSelect()}</select>
                  <button class="submit"></button>
                </form>
              </div>
            `);
            this.navBar.classList.add("navbar");
            this.select = this.navBar.querySelector('.select');
            this.form = this.navBar.querySelector('.form');
            this.body.appendChild(this.navBar);
        }


        querySubmitted() {
            if (!this.navBar) { return; }

            this.form.addEventListener("submit", (e) => {
                e.preventDefault();
                let query = this.form["query"].value.trim();
                if (query == "") { return; }
                let selectedSearchEngine = this.select.options[this.select.selectedIndex];
                let selectedSearchEngineUrl = selectedSearchEngine.dataset.url;
                if (!selectedSearchEngineUrl) {
                    selectedSearchEngineUrl = this.selectedSearchEngine.dataset.url;
                }
                let url = lipUtility.createSearchEngineUrlForNewWindow(selectedSearchEngineUrl, query);
                chrome.runtime.sendMessage({
                    method: 'open-lip-popup-window',
                    // url: encodeURIComponent(url)
                    url,
                    query
                });
            });
        }


    }

    let lipFromToolbar = new LipFromToolbar();
    await lipFromToolbar._constructor();
})();