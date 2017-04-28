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
let conversations = [];

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
    // console.log("------------------------------");
    // console.log('onConnectionEstablished()');
    // console.log("VI connected: " + voxAPI.connected());
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
    console.log("<---------- onAuthResult() begin");
    console.log("AuthResult: " + e.result);

    if (currentCallMode === 'video' || currentCallMode === 'voice') {
        beginCall();
    } else if (currentCallMode === 'text') {
        initMessenger();
        beginChat();
    }
    console.log("           onAuthResult() end ---------->");
}

//=============================================================================
// VoxImplant functions
//=============================================================================

function initMessenger() {
    console.log('<---------- initMessenger() begin');
    console.log('voxChatAPI:');
    console.log(voxChatAPI);

    // Create messenger instance
    voxChatAPI = VoxImplant.getMessenger();

    voxChatAPI.on(VoxImplant.MessagingEvents.onCreateConversation, (e) => {
        console.log('<--------- onCreateConversation begin');
        console.log('conversations:');
        console.log(conversations);

        conversations.push(e.conversation);

        console.log('conversations:');
        console.log(conversations);

        currentConv = conversations[0];
        console.log('currentConv:');
        console.log(currentConv);
        currentConv.sendMessage("Hello!");

        console.log('           onCreateConversation end ---------->');
    });
    voxChatAPI.on(VoxImplant.MessagingEvents.onSendMessage, (e) => {
        console.log(e.message);
        console.log(e.message.sender);
        console.log(e.message.text);
    });
    voxChatAPI.on(VoxImplant.MessagingEvents.onRemoveConversation, (e) => {
        console.log('<--------- onRemoveConversation begin');
        console.log(e);
        console.log('conversations:');
        console.log(conversations);
        console.log('           onRemoveConversation end ---------->');
    });
    voxChatAPI.on(VoxImplant.MessagingEvents.onError, (e) => {
        console.log('<--------- onError begin');
        console.log(e);
        console.log('          onError end ---------->');
    });

    console.log('voxChatAPI:');
    console.log(voxChatAPI);
    console.log('           initMessenger() end ---------->');
}

// Outbound chat
export function createChat(mode) {
    console.log('<--------- createChat() begin');
    currentCallMode = mode;

    if (!voxAPI.connected()) {    // 1st call
        console.log('connecting');
        voxAPI.connect();
    } else {                      // 2nd and subsequent calls
        if (mode === 'video' || mode === 'voice') {
            beginCall();
        }
        else if (mode === 'text') {
            if (!voxChatAPI) {
                initMessenger();
            }
            beginChat();
        }
    }
    console.log('           createChat() end ---------->');
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

function beginChat() {
    try {
        console.log('<--------- beginChat() begin');
        const participants = [{
            userId: dest_username + "@" + application_name + "." + account_name,
            canManageParticipants: false, canWrite: true
        }];
        const title = "Test text chat";
        const isDistinct = false;
        const enablePublicJoin = true;
        voxChatAPI.createConversation(participants, title, isDistinct, enablePublicJoin);

        console.log('conversations:');
        console.log(conversations);
    } catch (e) {
        console.log('! CAUGHT ERROR !');
        console.log(e);
    }
    console.log('           beginChat() end ---------->');
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
    const videoIn = document.getElementById(currentCall.getVideoElementId());
    if (flag) {
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

// Turn the sound on/off
export function turnSound(flag) {
    console.log('<--------- turnSound() begin');
    console.log('flag = ' + flag);

    if (flag) {
        currentCall.unmutePlayback();
    } else {
        currentCall.mutePlayback();
    }

    console.log('           turnSound() end --------->');
}

// Turn the microphone on/off
export function turnMic(flag) {
    console.log('<--------- turnMic() begin');
    console.log('flag = ' + flag);

    if (flag) {
        currentCall.unmuteMicrophone();
    } else {
        currentCall.muteMicrophone();
    }

    console.log('           turnMic() end --------->');
}

// Hangup outbound chat
export function stopChat() {
    console.log('<---------- stopChat() begin');
    if (currentCallMode === 'video' || currentCallMode === 'voice') {
        console.log('stopping call');
        // console.log("! currentCall: ");
        // console.log(currentCall);
        if (currentCall) {
            currentCall.hangup();
        }
        console.log('call has been stopped');
        // console.log("! currentCall: ");
        // console.log(currentCall);
    } else if (currentCallMode === 'text') {
        console.log('stopping text chat');
        conversations = [];
        console.log('text chat has been stopped');
    }
    console.log('           stopChat() end ---------->');
}

//=============================================================================
// Call event handlers
//=============================================================================

// Call connected
function onCallConnected(e) {
    console.log("========== CallConnected: " + currentCall.id());

    switch (currentCallMode) {
        case 'video':
            sendVideo(true);
            showLocalVideo(true);
            showRemoteVideo(true);
            break;
        case 'voice':
            sendVideo(false);
            showRemoteVideo(false);
            // showLocalVideo(false);
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
