module.exports = {
    // Global options:
    // verbose: true,
    // Command options:
    build: {
        overwriteDest: true,
    },
    run: {
        // firefox: "nightly",
        // target: ['chromium'],
        // browserConsole: true,
        startUrl: [
            "https://en.wikipedia.org/wiki/Main_Page",
            "chrome://extensions/",
        ],
        args: [
            "--auto-open-devtools-for-tabs=true",
            "-start-maximized=true"
        ]
    },
    "artifactsDir": "chrome_build",
    ignoreFiles: [
        ".gitignore",
        "CHANGELOG.md",
        "firefox_config.js",
        "chrome_config.js",
        "HOWTO.md",
        "firefox_build",
        "chrome_build",
        "README.md",
        "package.json",
        "package-lock.json",
        "LICENSE",
        "debug.log"
    ],
};