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
let voxChatAPI;

let receivedMessage = null;

//=============================================================================
// VoxImplant functions
//=============================================================================

// Initialize VoxImplant
export function init(settings) {
    // console.log('<<<<<<<<<< init() begin');
    // console.log('settings:');
    // console.log(settings);

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
        micRequired: true,  // force microphone/camera access request
        videoSupport: true, // enable video support
        progressTone: true  // play progress tone
    });
    // console.log('           init() end >>>>>>>>>>');
}
// Initialize messenger
export function initMessenger() {
    console.log('<<<<<<<<<< initMessenger() begin');
    // Create messenger instance
    voxChatAPI = VoxImplant.getMessenger();

    voxChatAPI.on(VoxImplant.MessagingEvents.onCreateConversation, () => { console.log('<<<<<<<<<< onCreateConversation() >>>>>>>>>>'); });
    voxChatAPI.on(VoxImplant.MessagingEvents.onGetConversation, (e) => {
        console.log('<<<<<<<<<< onGetConversation()');
        console.log(e.conversation);

        // Send received message text back
        e.conversation.sendMessage(receivedMessage);
        receivedMessage = null;
        console.log('message retranslated');

        console.log('           onGetConversation() >>>>>>>>>>');
    });
    voxChatAPI.on(VoxImplant.MessagingEvents.onError, (e) => {
        console.log('<<<<<<<<<< onError begin');
        console.log(e);
        console.log('          onError end >>>>>>>>>>');
    });
    voxChatAPI.on(VoxImplant.MessagingEvents.onRemoveConversation, () => {console.log('<<<<<<<<<< onRemoveConversation() >>>>>>>>>>')});
    voxChatAPI.on(VoxImplant.MessagingEvents.onSendMessage, (e) => {
        console.log('<<<<<<<<<< onSendMessage()');

        console.log('e.message:');
        console.log(e.message);
        console.log('sender: ' + e.message.sender);
        console.log('text: ' + e.message.text);
        console.log('conversation uuid: ' + e.message.conversation);

        // If this message has been sent by other user
        if (e.message.sender !== username + '@' + application_name + '.' + account_name) {
            // Save message text
            receivedMessage = e.message.text;
            // Get the conversation holding received message
            voxChatAPI.getConversation(e.message.conversation);
        }

        console.log('           onSendMessage() >>>>>>>>>>');
    });

    console.log('voxChatAPI:');
    console.log(voxChatAPI);
    console.log('           initMessenger() end >>>>>>>>>>');
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
    console.log('<<<<<<<<<< onAuthResult()');
    console.log('AuthResult: ' + e.result);
    initMessenger();
    console.log('          onAuthResult() >>>>>>>>>>');
}

// Incoming call
function onIncomingCall(e) {
    console.log('<<<<<<<<<< onIncomingCall()');
    console.log(e);

    console.log('e.call._peerConnection.videoEnabled: ' + e.call._peerConnection.videoEnabled);

    currentCall = e.call;
    // Add handlers
    currentCall.addEventListener(VoxImplant.CallEvents.Connected, onCallConnected);
    currentCall.addEventListener(VoxImplant.CallEvents.Disconnected, onCallDisconnected);
    currentCall.addEventListener(VoxImplant.CallEvents.Failed, onCallFailed);
    console.log('Incoming call from: ' + currentCall.number());
    // Answer automatically
    setTimeout(function () {
        currentCall.answer();
    }, 1000);
    console.log('          onIncomingCall() >>>>>>>>>>');
}

//=============================================================================
// Call event handlers
//=============================================================================

// Call connected
function onCallConnected(e) {
    console.log('<<<<<<<<<< onCallConnected()');
    voxAPI.sendVideo(true);
    console.log('          onCallConnected() >>>>>>>>>>');
}

// Call disconnected
function onCallDisconnected(e) {
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
