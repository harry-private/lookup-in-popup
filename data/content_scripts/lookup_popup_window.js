chrome.runtime.sendMessage({
    method: 'extend',
    // url: encodeURIComponent(url)
    // url: url
}, (res) => {
    if (res === "lookupPopupWindow") {
        lookupPopupWindowRun();
    }
});

let lookupPopupWindowRun = async (lookupPopupWindowOptions) => {
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
        insertNavbar() {
            // create a div 
            // insert it on top

            document.body.insertAdjacentHTML('afterbegin',
                `
                  <div style="background:White; position:fixed; z-index:9999; left:40%; top:0">
                    <p>
                      Inserted HTML
                    </p>
                  </div>
                `
            );
        }
    }

    let lookupPopWindow = new LookupPopupWindow();

    lookupPopWindow.closeOnEsc();
    window.addEventListener('DOMContentLoaded', (event) => {
        // console.log('DOM fully loaded and parsed');
        lookupPopWindow.insertNavbar();
    });

    // console.log(lookupUtility.isValidURL("https://test.vom"));

};

// console.log(openedWithExecuteScript);