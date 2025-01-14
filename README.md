# LCT-Sisters

PWA code based on:
[Give Users Control Over App Updates in Vue CLI 3 PWAs](https://medium.com/@dougallrich/give-users-control-over-app-updates-in-vue-cli-3-pwas-20453aedc1f2)

## Description

Local Contact Tracing - Sisters is the first implementation of a Progressinve Web App designed from small communities and large organizations to minimize the time between exposure to COVID-19 and testing for the virus.

## Usage

The application is a simple example app, using a node-socket.io server to add a specified client to  all connected clients. The node server is located in `index.js`.

### Run

First Build the vue source code:
Choose the `build` option in the NPM Scripts Explorer or in a terminal enter:

`npm run build`

Start the server with the `start` option in the NPM Scripts Explorer or in a terminal enter:

`node index`

Either ctrl-click the link rendered in the termal:

<http://localhost:3003>

or open a browser of your choice using that URL.

### Debug

Be sure you have the latest bits in the /dist folder.

Select the VS Code Debug Explorer, and choose the `Launch index.js` option from the toolbar dropdown. Server is running on port *3003*

Next, select the `3003 vuejs: chrome` option from the same dropdown. Chrome will open on port 3003.

Set breakpoints, as necessary, in one or both debuggers.

## Deploy to Heroku

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/mcorning/lct-sisters.git)

or manually create a new Heroku application and add the `heroku/nodejs` and `https://github.com/heroku/heroku-buildpack-static` buildpacks.

Note that the node server runs from the path specified in the [Procfile](https://heroku-vue-socket-test.herokuapp.com/).

