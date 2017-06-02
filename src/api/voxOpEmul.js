//

//=============================================================================
// Modules & files imports
//=============================================================================

// Load VoxImplant SDK:
// import * as VoxImplant from 'voximplant-websdk';
import * as VoxImplant from '../lib/voximplant.min.js';

//=============================================================================
// VoxImplant globals
//=============================================================================

let username,             // VoxImplant connection parameters
    password,
    application_name,
    account_name;

let currentCall = null;   // call global instances

let voxAPI;               // object for VoxImplant instance

let receivedMessage = null;

//=============================================================================
// VoxImplant functions
//=============================================================================

// Initialize VoxImplant
export function init(settings) {
    console.log('<<<<<<<<<< init()');
    console.log('settings:');
    console.log(settings);

    // Create VoxImplant instance
    voxAPI = VoxImplant.getInstance();

    // VoxImplant connection parameters
    account_name = settings.account_name;
    application_name = settings.application_name;
    username = settings.op_username;
    password = settings.op_password;

    // Assign handlers
    voxAPI.addEventListener(VoxImplant.Events.SDKReady, onSdkReady);
    voxAPI.addEventListener(VoxImplant.Events.ConnectionEstablished, onConnectionEstablished);
    voxAPI.addEventListener(VoxImplant.Events.ConnectionFailed, onConnectionFailed);
    voxAPI.addEventListener(VoxImplant.Events.ConnectionClosed, onConnectionClosed);
    voxAPI.addEventListener(VoxImplant.Events.AuthResult, onAuthResult);
    voxAPI.addEventListener(VoxImplant.Events.IncomingCall, onIncomingCall);

    // Initialize SDK
    voxAPI.init({
        micRequired: true, // initially disable microphone/camera access request
        videoSupport: true  // enable video support
    });

    console.log('           init() >>>>>>>>>>');
}
// Deinitialize all
export function uninit() {
    // Clear VoxImplant instance
    voxAPI = null;
}

// Hangup incoming call
export function stopCall() {
    console.log('<<<<<<<<<< stopCall()');
    if (currentCall) {
        currentCall.hangup();
    }
    console.log('          stopCall() >>>>>>>>>>');
}

//
function sendMessage(text) {
    currentCall.sendMessage(text);
}

//=============================================================================
// Global VoxImplant instance event handlers
//=============================================================================

// SDK ready - functions can be called now
function onSdkReady() {
    // console.log('<<<<<<<<<< onSdkReady() begin');
    // console.log('VI connected: ' + voxAPI.connected());
    voxAPI.connect();
    // console.log('           onSdkReady() end >>>>>>>>>>');
}

// Connection with VoxImplant established
function onConnectionEstablished() {
    // console.log('<<<<<<<<<< onConnectionEstablished() begin');
    // console.log('VI connected: ' + voxAPI.connected());
    voxAPI.login(username + '@' + application_name + '.' + account_name + '.voximplant.com', password);
    // console.log('           onConnectionEstablished() end >>>>>>>>>>');
}
// Connection with VoxImplant failed
function onConnectionFailed() {
    console.log('------------------------------');
    console.log('onConnectionFailed(). Reconnect');
    setTimeout(function () {
        voxAPI.connect();
    }, 1000);
}
// Connection with VoxImplant closed
function onConnectionClosed() {
    console.log('<<<<<<<<<< onConnectionClosed()');
    console.log('! currentCall: ');
    console.log(currentCall);
    console.log('VI connected: ' + voxAPI.connected());
    // setTimeout(function() {voxAPI.connect();}, 1000);
    console.log('          onConnectionClosed() >>>>>>>>>>');
}

function onAuthResult(e) {
    console.clear();
    console.log('<<<<<<<<<< onAuthResult(): ' + e.result);
    console.log('EMULATOR IS READY');
    console.log('          onAuthResult() >>>>>>>>>>');
}

// Incoming call
function onIncomingCall(e) {
    console.clear();
    console.log('<<<<<<<<<< onIncomingCall()');
    console.log("e.headers['X-CallMode']: " + e.headers['X-CallMode']);
    console.log("e.headers['X-FirstMsg']: " + e.headers['X-FirstMsg']);

    currentCall = e.call;
    // Add handlers
    currentCall.addEventListener(VoxImplant.CallEvents.Connected, onCallConnected);
    currentCall.addEventListener(VoxImplant.CallEvents.Disconnected, onCallDisconnected);
    currentCall.addEventListener(VoxImplant.CallEvents.Failed, onCallFailed);
    currentCall.addEventListener(VoxImplant.CallEvents.MessageReceived, onMessageReceived);
    console.log('Incoming call from: ' + currentCall.number());
    // Answer automatically
    setTimeout(function () {
        currentCall.answer();
    }, 1000);

    switch (e.headers['X-CallMode']) {
        case 'voice':

            break;
        case 'video':

            break;
        case 'text':

            break;
    }

    console.log('          onIncomingCall() >>>>>>>>>>');
}

//=============================================================================
// Call event handlers
//=============================================================================

// Call connected
function onCallConnected(e) {
    console.log('<<<<<<<<<< onCallConnected()');
    console.log(e);

    if (e.call._headers['X-CallMode'] === 'text') {
        console.log('Sending 1st message back');
        sendMessage(e.call._headers['X-FirstMsg']);
    }
    // voxAPI.sendVideo(true);

    console.log('          onCallConnected() >>>>>>>>>>');
}

// Call disconnected
function onCallDisconnected() {
    console.log('<<<<<<<<<< onCallDisconnected()');
    console.log('Call id: ' + currentCall.id() + ' Call state: ' + currentCall.state());

    console.log('----- video removing');
    const body = document.getElementsByTagName('body')[0];
    console.log(body);
    console.log(currentCall);
    console.log(currentCall.getVideoElementId());
    const video = document.getElementById(currentCall.getVideoElementId());
    console.log(video);
    body.removeChild(video);

    currentCall = null;

    console.log('          onCallDisconnected() >>>>>>>>>>');
}

// Call failed
function onCallFailed(e) {
    console.log('<<<<<<<<<< onCallFailed()');
    console.log('Call id: ' + currentCall.id() + ' code: ' + e.code + ' reason: ' + e.reason);
    console.log('VI connected: ' + voxAPI.connected());
    currentCall = null;
    console.log('          onCallFailed() >>>>>>>>>>');
}

//
function onMessageReceived(e) {
    console.log('<<<<<<<<<< onMessageReceived');
    console.log('e.text: ' + e.text);

    const parsedMessage = JSON.parse(e.text);
    if (parsedMessage.op === 'call-request') {
        const msg = {
            "op": 'call-response',
            "id": parsedMessage.id,
            "response": true
        };
        console.log('Response message:');
        console.log(JSON.stringify(msg));
        sendMessage(JSON.stringify(msg));

    } else {
        sendMessage(e.text);
    }
    console.log('           onMessageReceived >>>>>>>>>>');
}