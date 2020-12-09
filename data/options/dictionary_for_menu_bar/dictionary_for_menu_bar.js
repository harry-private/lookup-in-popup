(async () => {
    'use strict'
    class Dictionary {
        constructor() {
            this.dictionaries = {};
            this.body = document.body;
            this.html = document.documentElement;

            this.iframe;
            this.panel;
            this.panelSelect = null;
            this.panelQueryFrom = null;
            this.panelQueryInput = null;
        }
        async getDictionariesFromLocalStorage() {
            let dictionariesPromise = async () => {
                return new Promise(resolve => {
                    chrome.storage.sync.get(['dictionaries', "triggerKey", "enable_disable"], result => {
                        resolve(result);
                    })
                })
            }
            this.dictionaries = await dictionariesPromise();
        }
        dictionariesOptionsForSelect() {
            let options = '';
            this.dictionaries.dictionaries.forEach(function(dictionary) {
                if (!dictionary.isHidden) {
                    options += `<option data-url="${dictionary.url.replace(/"/g, '&quot;').replace(/'/g, '&#x27;')}">${dictionary.title}</option>`
                }
            });
            return options;
        }

        createPanel() {
            this.panel = document.createElement("div");
            this.panel.insertAdjacentHTML("afterbegin", `
              <div class="panel-select-panel-input-container ">
                <select class="my-dictionary-panel-select my-dictionary-custom-select">${this.dictionariesOptionsForSelect()}</select>
                <form class="my-dictionary-form" title="Type your query and press Enter">
                  <input class="my-dictionary-query-input" placeholder="Type your query and press Enter" autofocus>
                </form>
              </div>
            `);
            this.panel.classList.add("my-dictionary-panel");
            this.panelSelect = this.panel.querySelector('.my-dictionary-panel-select');
            this.panelQueryForm = this.panel.querySelector('.my-dictionary-form');
            this.panelQueryInput = this.panel.querySelector('.my-dictionary-query-input');
            this.panel.querySelector('.my-dictionary-panel-select')
                .addEventListener('change', this.changeDictionary());
            this.body.appendChild(this.panel);
        }
        createIFrame() {
            this.iframe = document.createElement('iframe');
            this.iframe.classList.add('my-dictionary-iframe');
            this.panel.appendChild(this.iframe);
        }
        changeDictionary(e) {
            if (!this.panel) { return; }
            this.panelSelect.addEventListener("change", () => {
                let query = this.panelQueryInput.value.trim();
                if (!query) { return; }
                let selectedDictionary = this.panelSelect.options[this.panelSelect.selectedIndex];
                let selectedDictionaryUrl = selectedDictionary.dataset.url;
                let url = this.createDictionaryUrlForIFrame(selectedDictionaryUrl, query);
                this.iframe.src = chrome.runtime.getURL('data/iframe/iframe.html?url=' + encodeURIComponent(url));
            });

        }
        changeDictionaryQuery() {
            if (!this.panel) { return; }
            let queryOld = this.panelQueryInput.value.trim();

            this.panelQueryForm.addEventListener("submit", (e) => {
                e.preventDefault();
                let query = this.panelQueryInput.value.trim();
                if (query == "" || query === queryOld) { return; }

                let selectedDictionary = this.panelSelect.options[this.panelSelect.selectedIndex];
                let selectedDictionaryUrl = selectedDictionary.dataset.url;
                if (!selectedDictionaryUrl) {
                    selectedDictionaryUrl = this.selectedDictionary.dataset.url;
                }
                let url = this.createDictionaryUrlForIFrame(selectedDictionaryUrl, query);
                this.iframe.src = chrome.runtime.getURL('data/iframe/iframe.html?url=' + encodeURIComponent(url));
            });
        }
        createDictionaryUrlForIFrame(url, query) {
            if ((url).includes("%s")) {
                return url.replace("%s", query);
            } else {
                return `${url}/?${query}`;
            }
        }

    }

    let dictionary = new Dictionary();
    await dictionary.getDictionariesFromLocalStorage();


    dictionary.createPanel();
    dictionary.createIFrame();
    dictionary.changeDictionaryQuery();
})();