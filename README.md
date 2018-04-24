# README #



## Live Demo ##

[Customer](https://www.cronj.com:8082/)

[Admin](https://www.cronj.com:8082/adminURL)

(username : admin , password : password)

## [Click Here for Complete Details](https://www.cronj.com/blog/build-a-live-customer-support-chat/) ##

## Features ##

* Chat with admin for quick response
* Chat session is maintained across tabs, page refreshes and browser restarts
* Chat history has ‘infinite scrolling’
* Shows ‘typing’ status
* Lightweight and fast
* Integrates seamlessly
* Stores chat history and sends email after a chat
* Properly handles disconnection and re-connection
* Audio and browser notifications when a user comes online
* Clean and unobtrusive interface

## Setup and Configuration ##

### Try the app locally ###

**Install the dependencies** 

```
#!javascript

npm install
```
**
Start the redis server** 

```
#!python

redis-server
```

**Start the node server**

```
#!python

node app.js (or npm start )
```

**Open the URLs**

 [Customer page](http://localhost:8080/)

 [Admin page](http://localhost:8080/adminURL)

Setting up and integrating this app into your website is very easy and can be done in 3 simple steps.

**Set up the config file** : Add all the parameters to set up the application.

**Host the app** : Set up the redis endpoint and start the server.

**Add chat.js** : Add the domain name and port to the js file and include it in all the pages where you want the chat to appear.

And that is it! The chat is up and running.

Note : The code to send emails is inititally commented. This is because, you will need the ‘refresh token’ of the senders account. ( See : http://goo.gl/vA9l4F ). The token needs be added in mail.js