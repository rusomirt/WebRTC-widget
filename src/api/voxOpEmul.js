//

//=============================================================================
// File imports
//=============================================================================

// Load VoxImplant SDK:
// import * as VoxImplant from 'voximplant-websdk';
// import '../lib/voximplant-edge.min.js';
// import '../lib/voximplant.min.js';

//=============================================================================
// VoxImplant globals
//=============================================================================

let username,             // VoxImplant connection parameters
    password,
    application_name,
    account_name;

let currentCall = null;   // call global instances

let voxAPI;               // object for VoxImplant instance

//=============================================================================
// Initialization & deinitialization of VoxImplant API
//=============================================================================

export function init(settings) {
  console.log("------------------------------");
  console.log('init()');
  console.log(settings);

  // Create VoxImplant instance
  voxAPI = VoxImplant.getInstance();

  // VoxImplant connection parameters
  account_name      = settings.account_name;
  application_name  = settings.application_name;
  username          = settings.op_username;
  password          = settings.op_password;

  // Assign handlers
  voxAPI.addEventListener(VoxImplant.Events.SDKReady, onSdkReady);
  voxAPI.addEventListener(VoxImplant.Events.ConnectionEstablished, onConnectionEstablished);
  voxAPI.addEventListener(VoxImplant.Events.ConnectionFailed, onConnectionFailed);
  voxAPI.addEventListener(VoxImplant.Events.ConnectionClosed, onConnectionClosed);
  voxAPI.addEventListener(VoxImplant.Events.AuthResult, onAuthResult);
  voxAPI.addEventListener(VoxImplant.Events.IncomingCall, onIncomingCall);

  // Initialize SDK
  voxAPI.init({
    useFlashOnly: false,
    micRequired: true,  // force microphone/camera access request
    videoSupport: true, // enable video support
    progressTone: true  // play progress tone
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
function onSdkReady(){
  console.log("------------------------------");
  console.log('onSdkReady()');
  console.log("VI connected: " + voxAPI.connected());
  voxAPI.connect();
}

// Connection with VoxImplant established
function onConnectionEstablished() {
  console.log("------------------------------");
  console.log('onConnectionEstablished()');
  console.log("VI connected: " + voxAPI.connected());
  voxAPI.login(username+"@"+application_name+"."+account_name+".voximplant.com", password);
}

// Connection with VoxImplant failed
function onConnectionFailed() {
  console.log("------------------------------");
  console.log('onConnectionFailed(). Reconnect');
  setTimeout(function() {voxAPI.connect();}, 1000);
}

// Connection with VoxImplant closed
function onConnectionClosed() {
  console.log("------------------------------------------------------------");
  console.log('onConnectionClosed()');
  console.log("! currentCall: ");
  console.log(currentCall);
  console.log("VI connected: " + voxAPI.connected());
  // setTimeout(function() {voxAPI.connect();}, 1000);
}

function onAuthResult(e) {
  console.log("AuthResult: " + e.result);
}

// Incoming call
function onIncomingCall(e) {
  currentCall = e.call;
  // Add handlers
  currentCall.addEventListener(VoxImplant.CallEvents.Connected, onCallConnected);
  currentCall.addEventListener(VoxImplant.CallEvents.Disconnected, onCallDisconnected);
  currentCall.addEventListener(VoxImplant.CallEvents.Failed, onCallFailed);
  console.log("Incoming call from: "+currentCall.number());
  // Answer automatically
  setTimeout(function () {
    currentCall.answer();
  }, 5000);

}

//=============================================================================
// VoxImplant functions
//=============================================================================

// Start/stop sending video
function sendVideo(flag) {
  voxAPI.sendVideo(flag);
}

//=============================================================================
// Call event handlers
//=============================================================================

// Call connected
function onCallConnected(e) {
  console.log("CallConnected: "+currentCall.id());
  sendVideo(true);
}

// Call disconnected
function onCallDisconnected(e) {
  console.log("------------------------------");
  console.log("CallDisconnected: "+currentCall.id()+" Call state: "+currentCall.state());
  console.log("VI connected: " + voxAPI.connected());

  console.log('----- video removing');
  const body = document.getElementsByTagName('body')[0];
  console.log(body);
  console.log(currentCall);
  console.log(currentCall.getVideoElementId());
  const video = document.getElementById(currentCall.getVideoElementId());
  console.log(video);
  body.removeChild(video);

  currentCall = null;

}

// Call failed
function onCallFailed(e) {
  console.log("------------------------------");
  console.log("CallFailed: "+currentCall.id()+" code: "+e.code+" reason: "+e.reason);
  console.log("VI connected: " + voxAPI.connected());
  currentCall = null;
}

