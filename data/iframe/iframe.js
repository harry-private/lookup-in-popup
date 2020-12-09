const args = new URLSearchParams(location.search);
let iframe = document.querySelector('iframe');
iframe.addEventListener('load', () => {
    document.body.dataset.mode = 'ready';
});
iframe.src = decodeURIComponent(args.get('url'));