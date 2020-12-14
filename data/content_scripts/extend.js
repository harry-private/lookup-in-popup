window.addEventListener('keyup', e => {
    if (e.code === 'Escape') {
        chrome.runtime.sendMessage({
            method: 'lookup-popup-close'
        });
    }
});