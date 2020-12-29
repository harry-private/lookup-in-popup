module.exports = {
    // Global options:
    // verbose: true,
    // Command options:
    build: {
        overwriteDest: true,
    },
    run: {
        // browserConsole: true,
        startUrl: [
            "https://en.wikipedia.org/wiki/Main_Page",
            "about:debugging#/runtime/this-firefox"
        ]
    },
    "artifactsDir": "firefox_build",
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