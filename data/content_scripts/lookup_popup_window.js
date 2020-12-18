(async () => {
    'use strict'
    class LookupPopupWindow {

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

    if (window.lookupPopupWindow && window.lookupPopupWindow.popupWindow) {
        let lookupPopWindow = new LookupPopupWindow();

        lookupPopWindow.closeOnEsc();

        console.log(lookupUtility.isValidURL("https://test.vom"));
        console.log(window.lookupPopupWindow);
    }
})();