class LookupUtility {

    async localStorageDataPromise() {
        return new Promise(resolve => {
            chrome.storage.sync.get(['sources', "triggerKey", "enableDisable", "showChooseSourceOptions"], result => {
                resolve(result);
            })
        })
    }

}

let lookupUtility = new LookupUtility();