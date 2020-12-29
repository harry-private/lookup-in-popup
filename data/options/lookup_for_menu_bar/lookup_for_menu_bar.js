(async () => {
    'use strict'

    // CONSIDER Changing panel to navbar
    // CONSIDER changing createPanel() to insetNavbar()
    // CONSIDER changing changeQuery() to querySubmit()
    class Lookup {
        async _constructor() {
            this.localStorageData = await lookupUtility.localStorageDataPromise();
            this.body = document.body;
            this.html = document.documentElement;

            this.panel;
            this.panelSelect = null;
            this.panelQueryFrom = null;
            this.panelQueryInput = null;
            this.run();
        }
        run() {
            this.createPanel();
            this.changeQuery();
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

        createPanel() {
            this.panel = document.createElement("div");
            // CONSIDER Changing panel-select-panel-input-container class name to panel-form-container, or something similar
            this.panel.insertAdjacentHTML("afterbegin", `
              <div class="panel-select-panel-input-container">
                <form class="lookup-form" title="Type your query and press Enter">
                  <input class="lookup-query-input" placeholder="Type your query and press Enter" autofocus>
                </form>
                <select class="lookup-panel-select lookup-custom-select">${this.sourcesOptionsForSelect()}</select>
              </div>
            `);
            this.panel.classList.add("lookup-panel");
            this.panelSelect = this.panel.querySelector('.lookup-panel-select');
            this.panelQueryForm = this.panel.querySelector('.lookup-form');
            this.panelQueryInput = this.panel.querySelector('.lookup-query-input');
            this.panelSelect.addEventListener('change', this.changeSource());
            this.body.appendChild(this.panel);
        }

        changeSource(e) {
            return () => {
                if (!this.panel) { return; }
                let query = this.panelQueryInput.value.trim();
                if (!query) { return; }
                let selectedSource = this.panelSelect.options[this.panelSelect.selectedIndex];
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