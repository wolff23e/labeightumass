'use strict';
let http = require('http');
let url = require('url');
let fs = require('fs');
let util = require('util');
let level = require('level');

const dbFile = 'counter-db';
const db = level(dbFile);

async function isFound(name) {
    try {
        let v = await db.get(name);
        console.log(v);
        return true;
    } catch (err) {
        return false;
    }
}

async function createCounter(name, response) {
    await db.put(name, 0);
    let resp = {'result' : 'created',
                'name' : name,
                'value' : 0 };
    response.write(JSON.stringify(resp));
    response.end();
}

function errorCounter(name, response) {
    let resp = {'result': 'error'}
    response.write(JSON.stringify(resp));
    response.end();
}

async function readCounter(name, response) {
    let value = await db.get(name);
    let resp = {'result': 'read',
                'name': name,
                'value': value}
    response.write(JSON.stringify(resp));
}

async function updateCounter(name, response) {
    let value = 0;
    value = await db.get(name);
    value = parseInt(value) + 1;
    await db.put(name, value);
    let resp = {'result': 'update',
                'name': name,
                'value': value}
    response.write(JSON.stringify(resp));
}
async function deleteCounter(name, response) {
    await db.del(name);
    let resp = {'result': 'deleted'}
    response.write(JSON.stringify(resp));
}

// const headerText = { "Content-Type": "text/html" };
const headerText = { "Content-Type": "application/json",
                     "Access-Control-Allow-Origin": "*",
                     "Access-Control-Allow-Headers": "*"
                   };
let server = http.createServer();
server.on('request', async (request, response) => {
    response.writeHead(200, headerText);
    let options = url.parse(request.url, true).query;
    // response.write(JSON.stringify(options));

    // Heroku mod start
   if (request.url.endsWith("/index.html")) {
       fs.readFile('static/pcrud-interactive.html', null, function (error, data) {
           if (error) {
               response.writeHead(404);
               response.write('Whoops! File not found!');
           } else {
               response.writeHead(200, {
                   "Content-Type": "text/html"});
               response.write(data);
           }
           response.end();
       });
       return;
   } else if (request.url.endsWith("/pcrud-xhr.js")) {
       fs.readFile('static/pcrud-xhr.js', null, function (error, data) {
           if (error) {
               response.writeHead(404);
               response.write('Whoops! File not found!');
           } else {
               response.writeHead(200, {
                   "Content-Type": "text/javascript"});
               response.write(data);
           }
           response.end();
       });
       return;
   }
// Heroku mod ends

    if (request.url.startsWith("/create")) {
        await createCounter(options.name, response);
        return;
    }
    let found = await isFound(options.name);
    if (!found) {
        errorCounter(options.name, response);
        return;
    }
    if (request.url.startsWith("/read")) {
        await readCounter(options.name, response);
    }
    else if (request.url.startsWith("/update")) {
        await updateCounter(options.name, response);
    }
    else if (request.url.startsWith("/delete")) {
        await deleteCounter(options.name, response);
    }
    else {
        response.write("no command found.");
    }
    response.end();
});
server.listen(process.env.PORT);

