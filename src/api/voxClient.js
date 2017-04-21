//

//=============================================================================
// Modules & files imports
//=============================================================================

import $scriptjs from 'scriptjs';   // Script.js - for loading VoxImplant CDN

//=============================================================================
// VoxImplant globals
//=============================================================================

let username,               // VoxImplant connection parameters
    password,
    dest_username,
    application_name,
    account_name;

// currentCall is exported for onCallDisconnected event handler
// assigning in Preact component
export let currentCall = null;  // call global instances
let currentCallMode = null;     // Video, voice or text.

let currentConv;

let voxAPI;                     // object for VoxImplant instance
let voxChatAPI;

//=============================================================================
// Initialization & deinitialization of VoxImplant API
//=============================================================================

export function init(settings) {
    // console.log("------------------------------");
    // console.log('init()');
    // console.log(settings);

    $scriptjs("//cdn.voximplant.com/edge/voximplant.min.js", function () {
        // Create VoxImplant instance
        voxAPI = VoxImplant.getInstance();

        // VoxImplant connection parameters
        account_name = settings.account_name;
        application_name = settings.application_name;
        username = settings.client_username;
        password = settings.client_password;
        dest_username = settings.op_username;

        // Assign handlers
        voxAPI.addEventListener(VoxImplant.Events.SDKReady, onSdkReady);
        voxAPI.addEventListener(VoxImplant.Events.ConnectionEstablished, onConnectionEstablished);
        voxAPI.addEventListener(VoxImplant.Events.ConnectionFailed, onConnectionFailed);
        voxAPI.addEventListener(VoxImplant.Events.ConnectionClosed, onConnectionClosed);
        voxAPI.addEventListener(VoxImplant.Events.AuthResult, onAuthResult);

        // Initialize SDK
        voxAPI.init({
            useFlashOnly: false,
            micRequired: true,  // force microphone/camera access request
            videoSupport: true, // enable video support
            progressTone: true  // play progress tone
        });
    });
}

export function uninit() {
    // Clear VoxImplant instance
    voxAPI = null;
}

//=============================================================================
// Global VoxImplant instance event handlers
//=============================================================================

// SDK ready - functions can be called now
function onSdkReady() {
    // console.log("------------------------------");
    // console.log('onSdkReady()');
    // console.log("VI connected: " + voxAPI.connected());
}

// Connection with VoxImplant established
function onConnectionEstablished() {
    console.log("------------------------------");
    console.log('onConnectionEstablished()');
    console.log("VI connected: " + voxAPI.connected());
    voxAPI.login(username + "@" + application_name + "." + account_name + ".voximplant.com", password);
}

// Connection with VoxImplant failed
function onConnectionFailed() {
    // console.log("------------------------------");
    // console.log('onConnectionFailed(). Reconnect');
    setTimeout(function () {
        voxAPI.connect();
    }, 1000);
}

// Connection with VoxImplant closed
function onConnectionClosed() {
    // console.log("------------------------------------------------------------");
    // console.log('onConnectionClosed()');
    // console.log("! currentCall: ");
    // console.log(currentCall);
    // console.log("VI connected: " + voxAPI.connected());
}

// Result of authorization
function onAuthResult(e) {
    console.log("------------------------------");
    console.log("AuthResult: "+e.result);
    console.log("VI connected: " + voxAPI.connected());

    if (currentCallMode === 'video' || currentCallMode === 'voice') {
        beginCall();
    } else if (currentCallMode === 'text') {
        beginChat();
    }
}

//=============================================================================
// VoxImplant functions
//=============================================================================

// Create outbound call
export function createCall(callMode) {
    // console.log("------------------------------");
    // console.log('createVideoCall');
    // console.log("! currentCall: ");
    // console.log(currentCall);
    // console.log('before connect in createVideoCall');
    // console.log("VI connected: " + voxAPI.connected());

    if (callMode !== 'video' && callMode !== 'voice' && callMode !== 'text') {
        return false;
    }
    currentCallMode = callMode;

    if (!voxAPI.connected()) {    // 1st call
        voxAPI.connect();
    } else {                      // 2nd and subsequent calls
        beginCall();
    }

    // console.log('after connect in createVideoCall');
    // console.log("VI connected: " + voxAPI.connected());
    // console.log("! currentCall: ");
    // console.log(currentCall);
}

function beginCall() {
    console.log('---------- beginCall() begin ----------');
    console.log('currentCallMode = ' + currentCallMode);

    let useVideo = (currentCallMode === 'video');
    currentCall = voxAPI.call(dest_username, useVideo, "TEST CUSTOM DATA", {"X-DirectCall": "true"});

    currentCall.addEventListener(VoxImplant.CallEvents.Connected, onCallConnected);
    // currentCall.addEventListener(VoxImplant.CallEvents.Disconnected, onCallDisconnected);
    currentCall.addEventListener(VoxImplant.CallEvents.Failed, onCallFailed);
    currentCall.addEventListener(VoxImplant.CallEvents.ProgressToneStart, onProgressToneStart);
    currentCall.addEventListener(VoxImplant.CallEvents.ProgressToneStop, onProgressToneStop);
    // currentCall.setVideoSettings({width: 720});

    console.log('---------- beginCall() end ----------');
}

// Show/hide local video
function showLocalVideo(flag) {
    console.log('---------- showLocalVideo() begin ----------');
    console.log('flag = ' + flag);

    voxAPI.showLocalVideo(flag);
    if (flag) {
        // Move local video from camera to container
        const videoOut = document.getElementById('voximplantlocalvideo');
        console.log(videoOut);
        videoOut.style.width = '100%';    // fit in container with aspect ratio keeping
        videoOut.style.display = 'block'; // remove space under element (initially it is inline)

        document.getElementById('video-out').appendChild(videoOut);
        videoOut.play();
    }

    console.log('---------- showLocalVideo() end ----------');
}

// Show/hide remote video
function showRemoteVideo(flag) {
    console.log('---------- showRemoteVideo() begin ----------');
    console.log('flag = ' + flag);

    currentCall.showRemoteVideo(flag);
    if (flag) {
        const videoIn = document.getElementById(currentCall.getVideoElementId());
        console.log(videoIn);
        videoIn.style.width = '100%';    // fit in container with aspect ratio keeping
        videoIn.style.display = 'block'; // remove space under element (initially it is inline)
        document.getElementById('video-in').appendChild(videoIn);
        videoIn.play();
    } else {
        videoIn.style.display = 'none';   // hide remote video
    }
    console.log('---------- showRemoteVideo() end ----------');
}

// Start/stop sending video
function sendVideo(flag) {
    voxAPI.sendVideo(flag);
}

export function turnSound(flag) {
    console.log('<--------- turnSound() begin');
    console.log('flag = ' + flag);

    if (flag) {
        currentCall.unmutePlayback();
    } else {
        currentCall.mutePlayback();
    }
    console.log('currentCall: ');
    console.log(currentCall);

    console.log('           turnSound() end --------->');
}

export function createChat() {
    console.log('<--------- createChat() begin');
    currentCallMode = 'text';

    if (!voxAPI.connected()) {    // 1st call
        console.log('connecting');
        voxAPI.connect();
    } else {                      // 2nd and subsequent calls
        beginChat();
    }
    console.log('           createChat() end ---------->');
}

function beginChat() {
    try {
        console.log('<--------- beginChat() begin');
        // Create messenger instance
        voxChatAPI = VoxImplant.getMessenger();
        console.log(voxChatAPI);

        voxChatAPI.on(VoxImplant.MessagingEvents.onCreateConversation, (e) => {
            console.log('<--------- onCreateConversation begin');
            console.log(e);
            console.log(e.conversation);

            // currentConv = e.conversation;
            // currentConv.sendMessage("Hello");
            console.log('           onCreateConversation end ---------->');
        });

        voxChatAPI.on(VoxImplant.MessagingEvents.onError, (e) => {
            console.log('<--------- onError begin');
            console.log(e);
            console.log('          onError end ---------->');
        });

        // const participants = [{user_id: 'skalatskyalexey-2nd@videochat.xlucidity'}];
        // const participants = [{user_id: 'skalatskyalexey@videochat.xlucidity'},
        //                       {user_id: 'skalatskyalexey-2nd@videochat.xlucidity'}];
        const participants = [{userId: username + "@" + application_name + "." + account_name},
                              {userId: dest_username + "@" + application_name + "." + account_name}];
        // const participants = [{user_id:"pavel_b@bar.foo"}];
        console.log('participants:');
        console.log(participants);

        voxChatAPI.createConversation(
            [
                {userId: username + "@" + application_name + "." + account_name},
                {userId: dest_username + "@" + application_name + "." + account_name}
            ],
            "Test text chat",
            true,
            false
        );

        // console.log('currentConv:');
        // console.log(currentConv);
    } catch(e) {
        console.log('! CAUGHT ERROR !');
        console.log(e);
    }

    console.log('           beginChat() end ---------->');
}

// Hangup outbound call
export function stopCall() {
    // console.log('---------- stopVideoCall');
    // console.log("! currentCall: ");
    // console.log(currentCall);
    if (currentCall) {
        currentCall.hangup();
    }
    // console.log("! currentCall: ");
    // console.log(currentCall);
    // console.log("VI connected: " + voxAPI.connected());
}

//=============================================================================
// Call event handlers
//=============================================================================

// Call connected
function onCallConnected(e) {
    console.log("========== CallConnected: "+currentCall.id());
    
    switch (currentCallMode) {
        case 'video':
            sendVideo(true);
            showLocalVideo(true);
            showRemoteVideo(true);
            break;
        case 'voice':
            sendVideo(false);
            // showLocalVideo(false);
            showRemoteVideo(false);
            break;
    }
}

// // Call disconnected
// function onCallDisconnected(e) {
//   console.log("------------------------------");
//   console.log("CallDisconnected: "+currentCall.id()+" Call state: "+currentCall.state());
//   console.log("VI connected: " + voxAPI.connected());
//   currentCall = null;
// }

// Call failed
function onCallFailed(e) {
    // console.log("------------------------------");
    // console.log("CallFailed: "+currentCall.id()+" code: "+e.code+" reason: "+e.reason);
    // console.log("VI connected: " + voxAPI.connected());
    currentCall = null;
}

function onProgressToneStart() {
    // console.log('===============================================================');
    // console.log('onProgressToneStart()');
    // console.log(currentCall.getVideoElementId());
}

function onProgressToneStop() {
    // console.log('===============================================================');
    // console.log('onProgressToneStop()');
    // console.log(currentCall.getVideoElementId());
}