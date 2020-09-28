if(!navigator.getDisplayMedia && !navigator.mediaDevices.getDisplayMedia) {
    var error = 'Your browser does NOT supports getDisplayMedia API.';
    document.querySelector('h1').innerHTML = error;

    document.querySelector('video').style.display = 'none';
    document.getElementById('btn-start-recording').style.display = 'none';
    document.getElementById('btn-stop-recording').style.display = 'none';
    throw new Error(error);
}
const startElem = document.getElementById("start");
const stopElem = document.getElementById("stop");

function invokeGetDisplayMedia(success, error) {
    var displaymediastreamconstraints = {
        video: {
            // displaySurface: 'monitor', // monitor, window, application, browser
            logicalSurface: true,
            cursor: 'always' // never, always, motion
        }
    };

    // above constraints are NOT supported YET
    // that's why overridnig them
    displaymediastreamconstraints = {
        video: true
    };

    if(navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices.getDisplayMedia(displaymediastreamconstraints).then(success).catch(error);
    }
    else {
        navigator.getDisplayMedia(displaymediastreamconstraints).then(success).catch(error);
    }
}

function captureScreen(callback) {
    invokeGetDisplayMedia(function(screen) {
        addStreamStopListener(screen, function() {
            if(window.stopCallback) {
                window.stopCallback();
            }

        });
        callback(screen);
    }, function(error) {
        console.error(error);
        alert('Unable to capture your screen. Please check console logs.\n' + error);
    });
}

function captureCamera(cb) {
    navigator.mediaDevices.getUserMedia({audio: true, video: true}).then(cb);
}

function keepStreamActive(stream) {
    var video = document.createElement('video');
    video.muted = true;
    video.srcObject = stream;
    video.style.display = 'none';
    (document.body || document.documentElement).appendChild(video);
}
startElem.addEventListener("click", function(evt) {
    captureScreen(function(screen) {
        keepStreamActive(screen);
        captureCamera(function(camera) {
            keepStreamActive(camera);
    
            screen.width = window.screen.width;
            screen.height = window.screen.height;
            screen.fullcanvas = true;
            
            camera.width = 0;
            camera.height = 0;
            camera.top = screen.height - camera.height;
            camera.left = screen.width - camera.width;
            
            var recorder = RecordRTC([screen, camera], {
                type: 'video',
                mimeType: 'video/webm',
                previewStream: function(s) {
                    document.querySelector('video').muted = false;
                    document.querySelector('video').srcObject = s;
                }
            });
    
            recorder.startRecording();
            var blob1 = recorder.getBlob();
            document.querySelector('video').srcObject = null;
            document.querySelector('video').src = URL.createObjectURL(blob1);
            document.querySelector('video').muted = false;
            setInterval(function(){
            document.querySelector('videoplay').src = URL.createObjectURL(blob1);
            },1000)
            // window.stopCallback = function() {
            //     window.stopCallback = null;
    
            //     recorder.stopRecording(function() {
            //         var blob = recorder.getBlob();
            //         document.querySelector('video').srcObject = null;
            //         document.querySelector('video').src = URL.createObjectURL(blob);
            //         document.querySelector('video').muted = false;
                    
            //         [screen, camera].forEach(function(stream) {
            //             stream.getTracks().forEach(function(track) {
            //                 track.stop();
            //             });
            //         });
            //     });
            // };
    
            // window.timeout = setTimeout(window.stopCallback, 10 * 1000);
        });
    });
  }, false);
  
stopElem.addEventListener("click", function(evt) {
    if(window.stopCallback) {
        window.stopCallback();
    }
  }, false);

function addStreamStopListener(stream, callback) {
    stream.addEventListener('ended', function() {
        callback();
        callback = function() {};
    }, false);
    stream.addEventListener('inactive', function() {
        callback();
        callback = function() {};
    }, false);
    stream.getTracks().forEach(function(track) {
        track.addEventListener('ended', function() {
            callback();
            callback = function() {};
        }, false);
        track.addEventListener('inactive', function() {
            callback();
            callback = function() {};
        }, false);
    });
}
