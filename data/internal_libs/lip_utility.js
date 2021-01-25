class LipUtility {

    constructor() {
        this._localStorageData = null; //private
    }

    async localStorageDataPromise(forced = false) {
        // one instance per page
        if (!this._localStorageData || this.isObjEmpty(this._localStorageData) || forced) {
            console.trace("Local Storage");
            return this._localStorageData = await new Promise(resolve => {
                chrome.storage.sync.get(['sources', "triggerKey", "enableDisable", "isShowingBubbleAllowed", "popupWindow"], result => {
                    resolve(result);
                })
            });
        }
        console.trace("Already initiated");
        return this._localStorageData;
    }
    removeWWWBeginningOfHostname(hostname) {
        return hostname.replace(/^www\./, '');
    }
    isValidURL(string) {
        let res = string.match(/(http(s)?:\/\/.)(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
        return (res !== null);
    }
    createSourceUrlForNewWindow(url, query) {
        let encodedQuery = encodeURIComponent(query);
        return (url).includes("%s") ? url.replace("%s", encodedQuery) : `${url}/?${encodedQuery}`;
    }
    isObjEmpty(obj) {
        return (Object.entries(obj).length === 0 && obj.constructor === Object);
    }
}

let lipUtility = new LipUtility();
console.log(lipUtility);