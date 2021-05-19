### Run the extension

##### Chrome

- `npm run chrome`

##### Firefox

- `npm run firefox`

##### Both Browser

- `run both`



---



### Uploading the extension

##### General

1. Update the extension's version in the `manifest.json` and `package.json`
2. Make changes in the `CHANGELOG.md`
3. Temporary remove the `browser_specific_settings`



##### Chrome

- Steps
  1. run command `npm run build-chrome`
  2. upload to chrome



##### Firefox

- Steps
   1. run command `npm run build-firefox`
   2. upload to Firefox.


##### GitHub

- Steps
  
   1. Readd the `browser_specific_settings`
   2. commit the changes
   3. merge the branch to master
   4. upload to the Github

##### GitHub Release
- Steps
  1. Take the latest version from both `chrome_build` and `firefox_build`
  2. Add both of them to archive(zip)
  3. Change the file name to version (for example `[0.0.1]`)
  4. Go to Github add the zip file to release

---



### Links

- [Chrome extension developer dashboard](https://chrome.google.com/u/1/webstore/devconsole/5d355d47-731e-4269-8a27-1e8479f361ea?hl=en)
- [Firefox addon developer dashboard](https://addons.mozilla.org/en-US/developers/addons)
- [YouTube](https://youtu.be/pX8Q0wE7aJc)
- [Github](https://github.com/harry-private/lookup-in-popup)

