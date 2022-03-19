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
        }
    });
});

console.log('Server started');