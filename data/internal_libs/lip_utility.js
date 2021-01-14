class LipUtility {

    constructor() {
        this._localStorageData = null; //private
    }

    async localStorageDataPromise() {
        // one instance per page
        if (!this._localStorageData) {
            console.log("Local Storage");
            return this._localStorageData = await new Promise(resolve => {
                chrome.storage.sync.get(['sources', "triggerKey", "enableDisable", "isShowingBubbleAllowed"], result => {
                    console.log(result);
                    resolve(result);
                })
            });
        } else {
            return this._localStorageData;
        }
    }
    removeWWWBeginningOfHostname(hostname) {
        // console.log(hostname);
        return hostname.replace(/^www\./, '');
    }
    isValidURL(string) {
        // http(s) is optional in first regex
        // let res = string.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
        let res = string.match(/(http(s)?:\/\/.)(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
        return (res !== null);
    }
    createSourceUrlForNewWindow(url, query) {
        let encodedQuery = encodeURIComponent(query);
        if ((url).includes("%s")) {
            return url.replace("%s", encodedQuery);
        } else {
            return `${url}/?${encodedQuery}`;
        }
    }
    isObjEmpty(obj) {
        return (Object.entries(obj).length === 0 && obj.constructor === Object) ? true : false
    }
}

let lipUtility = new LipUtility();
console.log(lipUtility);