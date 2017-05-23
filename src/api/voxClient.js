//

//=============================================================================
// Modules & files imports
//=============================================================================

// Load VoxImplant SDK from npm module:
// import * as VoxImplant from 'voximplant-websdk';
import * as VoxImplant from '../lib/voximplant.min.js';

//=============================================================================
// VoxImplant globals
//=============================================================================

export let username,                       // VoxImplant connection parameters
    password,
    dest_username,
    application_name,
    account_name;

// currentCall is exported for onCallDisconnected event handler
// assigning in Preact component
export let currentCall = null;      // call global instances

export let voxAPI;                  // object for VoxImplant instance

//=============================================================================
// VoxImplant functions
//=============================================================================

// Initialize VoxImplant
export function init(settings, onAuthResult, onMicAccessResult) {
    console.log('<<<<<<<<<< init()');
    console.log('settings:');
    console.log(settings);

    // Create VoxImplant instance
    voxAPI = VoxImplant.getInstance();

    // VoxImplant connection parameters
    account_name = settings.account_name;
    application_name = settings.application_name;
    username = settings.client_username;
    password = settings.client_password;
    dest_username = settings.op_username;

    // Assign handlers
    voxAPI.addEventListener(VoxImplant.Events.SDKReady, () => {
        voxAPI.connect();
    });
    voxAPI.addEventListener(VoxImplant.Events.ConnectionEstablished, () => {
        voxAPI.login(username + '@' + application_name + '.' + account_name + '.voximplant.com', password);
    });
    voxAPI.addEventListener(VoxImplant.Events.ConnectionFailed, () => {
        // Reconnect in 1 second
        setTimeout(function () {
            voxAPI.connect();
        }, 1000);
    });
    // These event listeners get callbacks from Preact because they influence to UI
    voxAPI.addEventListener(VoxImplant.Events.AuthResult, onAuthResult);
    voxAPI.addEventListener(VoxImplant.Events.MicAccessResult, onMicAccessResult);

    const videoSupport = settings.client_app_installed;
    console.log('videoSupport: ' + videoSupport);

    // Initialize SDK
    voxAPI.init({
        micRequired: false, // initially disable microphone/camera access request
                            // (so it will not be asked if the first chat mode will be text)
        videoSupport: videoSupport,
        progressTone: true
    });

    console.log('           init() >>>>>>>>>>');
}
// Deinitialize all
export function uninit() {
    // voxAPI = null;
}

// Ask about allowing camera & microphone access
export function askCamAndMic() {
    voxAPI.attachRecordingDevice().then();
}
// Begin video or voice call
export function startCall(demandedMode, firstMsg, onCallConnected,
                          onCallDisconnected, onCallFailed, onMessageReceived) {
    console.log('<<<<<<<<<< startCall()');

    console.log('demandedMode = ' + demandedMode);
    const useVideo = (demandedMode === 'video');
    console.log('useVideo = ' + useVideo);
    let extraHeaders = {'X-CallMode': demandedMode};
    if (demandedMode === 'text') {
        extraHeaders['X-FirstMsg'] = firstMsg;
    }
    currentCall = voxAPI.call(dest_username, useVideo, 'customData', extraHeaders);

    if (demandedMode !== 'text') {
        currentCall.addEventListener(VoxImplant.CallEvents.ProgressToneStart, () => {
            voxAPI.playProgressTone();
        });
        currentCall.addEventListener(VoxImplant.CallEvents.ProgressToneStop, () => {
            voxAPI.stopProgressTone();
        });
    }
    currentCall.addEventListener(VoxImplant.CallEvents.Updated, (e) => {
        console.log('<<<<<<<<<< call.onUpdated()');
        console.log(e);
        console.log('           call.onUpdated() >>>>>>>>>>');
    });
    currentCall.addEventListener(VoxImplant.CallEvents.MediaElementCreated, (e) => {
        // console.log('<<<<<<<<<< onMediaElementCreated() begin');
        // console.log(e.element);
        e.element.style.display = 'none';
        // console.log('           onMediaElementCreated() end >>>>>>>>>>');
    });
    // These event listeners get callbacks from Preact because they influence to UI
    currentCall.addEventListener(VoxImplant.CallEvents.Connected, onCallConnected);
    currentCall.addEventListener(VoxImplant.CallEvents.Disconnected, onCallDisconnected);
    currentCall.addEventListener(VoxImplant.CallEvents.Failed, onCallFailed);
    currentCall.addEventListener(VoxImplant.CallEvents.MessageReceived, onMessageReceived);

    console.log('currentCall:');
    console.log(currentCall);
    console.log('           startCall() >>>>>>>>>>');
}
// Turn the sound on/off
export function turnSound(onOff) {
    if (onOff) {
        currentCall.unmutePlayback();
    } else {
        currentCall.mutePlayback();
    }
}
// Turn the microphone on/off
export function turnMic(onOff) {
    if (onOff) {
        currentCall.unmuteMicrophone();
    } else {
        currentCall.muteMicrophone();
    }
}

// Hangup call
export function stopCall() {
    console.log('<<<<<<<<<< stopCall()');

    if (currentCall) {
        console.log('currentCall.stateValue: ');
        console.log(currentCall.stateValue);

        if (currentCall.stateValue !== 'ENDED') {
            currentCall.hangup();
            // currentCall = null;
            console.log('Hang up the call');

            console.log('currentCall.stateValue after hanging up: ');
            console.log(currentCall.stateValue);
        }
    }

    console.log('           stopChat() end >>>>>>>>>>');
}

// Video displaying control
export function videoControl(callMode) {
    console.log('<<<<<<<<<< videoControl() begin');
    console.log('callMode = ' + callMode);

    switch (callMode) {
        case 'video':
            showRemoteVideo(true);
            showLocalVideo(true);
            sendVideo(true);
            break;
        default:
            showRemoteVideo(false);
            // showLocalVideo(false);
            sendVideo(false);
            break;
    }
    console.log('          videoControl() end >>>>>>>>>>');
}
// Show/hide local video
function showLocalVideo(onOff) {
    console.log('<<<<<<<<<< showLocalVideo(' + onOff + ')');
    console.log('onOff = ' + onOff);

    voxAPI.showLocalVideo(onOff);
    if (onOff) {
        // Move local video from camera to container
        const videoOut = document.getElementById('voximplantlocalvideo');
        console.log(videoOut);
        videoOut.style.width = '100%';    // fit in container with aspect ratio keeping
        videoOut.style.display = 'block'; // remove space under element (initially it is inline)
        document.getElementById('video-out').appendChild(videoOut);
        // videoOut.play();
    }

    console.log('          showLocalVideo(' + onOff + ') >>>>>>>>>>');
}
// Show/hide remote video
function showRemoteVideo(onOff) {
    console.log('<<<<<<<<<< showRemoteVideo(' + onOff + ')');

    console.log('currentCall:');
    console.log(currentCall);

    // currentCall.showRemoteVideo(onOff);
    console.log('currentCall.getVideoElementId():');
    console.log(currentCall.getVideoElementId());
    const videoIn = document.getElementById(currentCall.getVideoElementId());
    if (onOff) {
        console.log(videoIn);
        videoIn.style.height = '100%';      // fit in container with aspect ratio keeping
        videoIn.style.display = 'block';    // remove space under element (initially it is inline)
        document.getElementById('video-in').appendChild(videoIn);
        videoIn.play();
    }

    console.log('          showRemoteVideo(' + onOff + ') >>>>>>>>>>');
}
// Start/stop sending video
function sendVideo(onOff) {
    currentCall.sendVideo(onOff);
}

// Send text message within call
export function sendMessage(text) {
    currentCall.sendMessage(text);
}