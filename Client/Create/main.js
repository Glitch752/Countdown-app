// var wsc = new WebSocket((window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host + '/ws');
var wsc = new WebSocket((window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host.split(':')[0] + ':4283');

var msUpdateInterval = 10;

var timerType = "humanReadable";
var startDate = null;

setInterval(function() {
    updateTimer();
}, msUpdateInterval);

wsc.onopen = function() {
    console.log('Connected to server');
};

wsc.onmessage = function(message) {
    console.log(message.data);
    var parsedData = JSON.parse(message.data);
    if(parsedData.type === 'countdownCreated') {
        var newHref = window.location.href.split('?')[0].split('/').slice(0, -2).join('/') + '/?id=' + parsedData.id;
        window.location.href = newHref;
    }
}

window.onload = function() {
    var documentElement = document.documentElement;
    documentElement.style.setProperty('--background', '#ffffff');
    documentElement.style.setProperty('--text-primary', '#000000');
    documentElement.style.setProperty('--text-secondary', '#222222');

    var backgroundColor = document.getElementById('backgroundColor');
    var textColorPrimary = document.getElementById('textColorPrimary');
    var textColorSecondary = document.getElementById('textColorSecondary');

    backgroundColor.addEventListener('change', function() {
        documentElement.style.setProperty('--background', backgroundColor.value);
    });

    textColorPrimary.addEventListener('change', function() {
        documentElement.style.setProperty('--text-primary', textColorPrimary.value);
    });

    textColorSecondary.addEventListener('change', function() {
        documentElement.style.setProperty('--text-secondary', textColorSecondary.value);
    });
}

document.addEventListener("click", function(evt) {
    var changeDateMenuContainer = document.getElementById('changeDateMenuContainer');
    if(changeDateMenuContainer.classList.contains('active') && !changeDateMenuContainer.classList.contains('cant-close')) {
        let changeDateMenu = document.getElementById('changeDateMenu'),
            targetEl = evt.target; // clicked element      
        do {
            if(targetEl == changeDateMenu) {
                return;
            }
            targetEl = targetEl.parentNode;
        } while (targetEl);
        changeDateMenuContainer.classList.remove('active');
    }
});

function changeDate() {
    var changeDateMenuContainer = document.getElementById('changeDateMenuContainer');
    changeDateMenuContainer.classList.toggle('active');
    changeDateMenuContainer.classList.add('cant-close');
    setTimeout(function() {
        changeDateMenuContainer.classList.remove('cant-close');
    }, 100);
}

function changeDateConfirm() {
    var changeDateDate = document.getElementById('changeDateDate');
    var changeDateTime = document.getElementById('changeDateTime');
    var changeDateType = document.getElementById('changeDateType');

    var unixTimestamp = new Date(changeDateDate.value + ' ' + changeDateTime.value).getTime();

    if(unixTimestamp.toString() === 'NaN') {
        var changeDateMenuContainer = document.getElementById('changeDateMenuContainer');
        changeDateMenuContainer.classList.remove('active');

        return;
    }

    startDate = unixTimestamp;
    timerType = changeDateType.value;

    var countdownTimerDescription = document.getElementById('countdownTimerDescription');

    if(timerType === 'milliseconds') {
        countdownTimerDescription.innerHTML = 'Milliseconds';
    } else {
        countdownTimerDescription.innerHTML = '';
    }

    var countdownTimerReal = document.getElementById('countdownTimerReal');
    countdownTimerReal.innerHTML = new Date(startDate).toLocaleString();

    console.log(startDate);

    updateTimer();

    var changeDateMenuContainer = document.getElementById('changeDateMenuContainer');
    changeDateMenuContainer.classList.remove('active');
}

function publishCountdown() {
    var title = document.getElementById('countdownTitle').value.trim();
    var description = document.getElementById('countdownDescription').value.trim();
    var time = startDate;
    var type = timerType;

    if(title === '') {
        shakeElement(document.getElementById('countdownTitle'));
        return;
    }

    if(description === '') {
        shakeElement(document.getElementById('countdownDescription'));
        return;
    }

    if(time === null) {
        shakeElement(document.getElementById('countdownTimer'));
        return;
    }

    //Add color data and selection
    var data = {
        type: 'createCountdown',
        data: {
            name: title,
            description: description,
            date: time.toString(),
            countdownType: type,
            backgroundColor: document.documentElement.style.getPropertyValue('--background'),
            fontColorPrimary: document.documentElement.style.getPropertyValue('--text-primary'),
            fontColorSecondary: document.documentElement.style.getPropertyValue('--text-secondary')
        }
    };

    wsc.send(JSON.stringify(data));
}

function shakeElement(element) {
    element.classList.add('shake');
    setTimeout(function() {
        element.classList.remove('shake');
    }, 1000);
}

function updateTimer() {
    if(startDate === null) return;

    var currentDate = new Date();
    var timeDifference = startDate - currentDate.getTime();

    if(timeDifference > 0) {
        var countdownTime = document.getElementById('countdownTime');
        countdownTime.innerHTML = "Time until";
    } else {
        var countdownTime = document.getElementById('countdownTime');
        countdownTime.innerHTML = "Time since";
        timeDifference = -timeDifference;
    }

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