var websocket = require('ws');

var wss = new websocket.Server({ port: 4283 });

const admin = require('firebase-admin');
const { parse } = require('dotenv');

require('dotenv').config();

// Initialize Firebase
admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // replace `\` and `n` character pairs w/ single `\n` character
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
});

const db = admin.database();

wss.on('connection', function connection(ws) {
    ws.on('message', function(message) {
        var parsedData = JSON.parse(message);
        if(parsedData.type === 'getCountdown') {
            db.ref(`countdowns/${parsedData.id}`).once('value', function(snapshot) {
                if(snapshot.val()) {
                    ws.send(JSON.stringify({
                        type: 'countdown',
                        data: snapshot.val()
                    }));
                } else {
                    ws.send(JSON.stringify({
                        type: 'notCountdown',
                    }));
                }
            });
        } else if(parsedData.type === 'createCountdown') {
            //Create the id: First, change all spaces to dashes and change the string to lowercase
            //Next, remove all non-alphanumeric characters. 
            //Finally, if the id already exists, add a number to the end of the id.

            var id = parsedData.data.name;
            id = id.toLowerCase();
            id = id.replace(/\s+/g, '-');
            id = id.replace(/[^a-zA-Z0-9]/g, '');

            iterateAgain(id, ws, parsedData);
        }
    });
});

function iterateAgain(id, ws, parsedData) {
    idRef = db.ref(`countdowns/${id}`);
    idNum = id.match(/\d+$/);

    idRef.once('value', function(snapshot) {
        if(snapshot.val() !== null) {
            //Get the number at the end of the id
            if(idNum !== null) {
                idNum = parseInt(idNum) + 1;
                id = id.replace(/\d+$/, idNum);
            } else {
                id = id + '2';
            }
            iterateAgain(id, ws, parsedData);
        } else {
            finishIterating(id, ws, parsedData);
        }
    });
}

function finishIterating(id, ws, parsedData) {
    idRef.set(parsedData.data);

    ws.send(JSON.stringify({
        type: 'countdownCreated',
        id: id
    }));
}

console.log('Server started');