var wsc = new WebSocket((window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host + '/ws');
// var wsc = new WebSocket((window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host.split(':')[0] + ':4283');

var msUpdateInterval = 10;

var timerType = null;
var startDate = null;

setInterval(function() {
    updateTimer();
}, msUpdateInterval);

wsc.onopen = function() {
    console.log('Connected to server');

    var id = getURLParameter('id');

    if(id) {
        wsc.send(JSON.stringify({
            type: 'getCountdown',
            id: id
        }));
    } else {
        console.log('No id specified');
    }
};

wsc.onmessage = function(message) {
    var parsedData = JSON.parse(message.data);
    if(parsedData.type === 'countdown') {
        console.log(parsedData.data);

        var countdownType = parsedData.data.countdownType;

        var title = parsedData.data.name;
        var description = parsedData.data.description;

        var countdownTitle = document.getElementById('countdownTitle');
        var countdownDescription = document.getElementById('countdownDescription');

        countdownTitle.innerHTML = title;
        countdownDescription.innerHTML = description;

        var countdownTimerDescription = document.getElementById('countdownTimerDescription');

        if(countdownType === 'milliseconds') {
            countdownTimerDescription.innerHTML = 'Milliseconds';

            timerType = 'milliseconds';
            startDate = parsedData.data.date;

            updateTimer();
        } else {
            countdownTimerDescription.innerHTML = '';

            timerType = 'humanReadable';
            startDate = parsedData.data.date;

            updateTimer();
        }
    } else if(parsedData.type === 'notCountdown') {
        var body = document.getElementById("body");
        body.innerHTML = '<h1>No countdown found</h1>';
    }
}

function updateTimer() {
    var currentDate = new Date();
    var timeDifference = startDate - currentDate.getTime();

    if(timerType === 'milliseconds') {
        var countdownTimer = document.getElementById('countdownTimer');
        countdownTimer.innerHTML = timeDifference;
    } else if(timerType === 'humanReadable') {
        var countdownTimer = document.getElementById('countdownTimer');

        var years = Math.floor(timeDifference / (1000 * 60 * 60 * 24 * 365));
        var days = Math.floor((timeDifference % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24));
        var hours = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        var minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);

        countdownTimer.innerHTML = `
            <div class="countdown-human-readable">
                <div class="countdown-item">
                    <div class="countdown-value">${years}</div>
                    years
                </div>
                <div class="countdown-item">
                    <div class="countdown-value">${days}</div>
                    days
                </div>
                <div class="countdown-item">
                    <div class="countdown-value">${hours}</div>
                    hours
                </div>
                <div class="countdown-item">
                    <div class="countdown-value">${minutes}</div>
                    minutes
                </div>
                <div class="countdown-item">
                    <div class="countdown-value">${seconds}</div>
                    seconds
                </div>
            </div>
        `;
    }
}

function getURLParameter(name) {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null;
}