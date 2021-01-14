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

- Update the extension's version in the `manifesto.json`and `package.json`
- Make changes in the `CHANGELOG.md`



##### Chrome

- Steps
  1. remove the `browser_specific_settings`
  2. ~~zip the data and manifest.json~~
  3. run command `npm run build-chrome`
  4. upload to chrome
  5. ~~change the changelog~~ 



##### Firefox

- Steps
   1. keep the browser_specific setting
   2. ~~zip the data and manifest.json~~
   3. run command `npm run build-firefox`
   4. upload to Firefox.
   5. ~~change the change log.~~



##### GitHub

- Steps
   1. commit the changes

   2. merge the branch to master
   3. upload to the Github.com

