(async () => {
    'use strict'
    class LookupExtend {

        closeOnEsc() {
            window.addEventListener('keyup', e => {
                if (e.code === 'Escape') {
                    chrome.runtime.sendMessage({
                        method: 'lookup-popup-close'
                    });
                }
            });
        }
    }

    if (window.lookupPopupExtend && window.lookupPopupExtend.lookupPopupWindow) {
        let lookupExtend = new LookupExtend();

        lookupExtend.closeOnEsc();

        console.log(lookupUtility.isValidURL("https://test.vom"));
        console.log(window.lookupPopupExtend);
    }
})();