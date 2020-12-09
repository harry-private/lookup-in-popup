module.exports = {
    // Global options:
    // verbose: true,
    // Command options:
    build: {
        overwriteDest: true,
    },
    // run: {
    //     firefox: "nightly",
    // },
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
        "LICENSE"
    ],
};