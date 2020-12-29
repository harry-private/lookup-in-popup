(async () => {
    'use strict'
    class Lookup {
        async _constructor() {
            this.localStorageData = await lookupUtility.localStorageDataPromise();
            this.body = document.body;
            this.html = document.documentElement;

            this.navBar;
            this.select = null;
            this.from = null;
            this.input = null;
            this.run();
        }
        run() {
            this.insertNavbar();
            this.querySubmitted();
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

        insertNavbar() {
            this.navBar = document.createElement("div");
            this.navBar.insertAdjacentHTML("afterbegin", `
              <div class="formContainer">
                <form class="form" title="Type your query and press Enter">
                  <input class="input" placeholder="Type your query and press Enter" autofocus>
                </form>
                <select class="select">${this.sourcesOptionsForSelect()}</select>
              </div>
            `);
            this.navBar.classList.add("navbar");
            this.select = this.navBar.querySelector('.select');
            this.form = this.navBar.querySelector('.form');
            this.input = this.navBar.querySelector('.input');
            this.select.addEventListener('change', this.sourceChanged());
            this.body.appendChild(this.navBar);
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
                    method: 'open-lookup-popup',
                    // url: encodeURIComponent(url)
                    url,
                    query
                });
            }

        }
        querySubmitted() {
            if (!this.navBar) { return; }
            let queryOld = this.input.value.trim();

            this.form.addEventListener("submit", (e) => {
                e.preventDefault();
                let query = this.input.value.trim();
                if (query == "" || query === queryOld) { return; }

                let selectedSource = this.select.options[this.select.selectedIndex];
                let selectedSourceUrl = selectedSource.dataset.url;
                if (!selectedSourceUrl) {
                    selectedSourceUrl = this.selectedSource.dataset.url;
                }
                let url = lookupUtility.createSourceUrlForNewWindow(selectedSourceUrl, query);
                chrome.runtime.sendMessage({
                    method: 'open-lookup-popup',
                    // url: encodeURIComponent(url)
                    url,
                    query
                });
            });
        }


    }

    let lookup = new Lookup();
    await lookup._constructor();
})();