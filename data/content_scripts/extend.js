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

    let lookupExtend = new LookupExtend();

    console.log(window.lookupPopupQueryType);
    lookupExtend.closeOnEsc();

})();