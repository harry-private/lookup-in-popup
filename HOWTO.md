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
   4. upload to the Github.com

