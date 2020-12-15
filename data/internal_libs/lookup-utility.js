class LookupUtility {

    async localStorageDataPromise() {
        console.log("Local Storage");
        return new Promise(resolve => {
            chrome.storage.sync.get(['sources', "triggerKey", "enableDisable", "showChooseSourceOptions"], result => {
                resolve(result);
            })
        })
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
        if ((url).includes("%s")) {
            return url.replace("%s", query);
        } else {
            return `${url}/?${query}`;
        }
    }
}

let lookupUtility = new LookupUtility();