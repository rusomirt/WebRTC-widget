//

//=============================================================================
// File imports
//=============================================================================

// Load VoxImplant SDK:
import * as VoxImplant from 'voximplant-websdk';
// Load VoxImplant connection parameters:
import connectionParams from './params';

//=============================================================================
// VoxImplant connection parameters
//=============================================================================

const username = connectionParams.client_user,
      password = connectionParams.client_password,
      dest_username = connectionParams.test_emul_user,
      application_name = connectionParams.application_name,
      account_name = connectionParams.account_name;

//=============================================================================
// Call global instances
//=============================================================================

let currentCall = null;

//=============================================================================
// Global VoxImplant instance
//=============================================================================

let voxAPI;   // object for VoxImplant instance

export function init() {
  console.log("------------------------------");
  console.log('init()');

  // Create VoxImplant instance
  voxAPI = VoxImplant.getInstance();

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
  console.log("------------------------------");
  console.log("AuthResult: "+e.result);
  console.log("VI connected: " + voxAPI.connected());
  currentCall = voxAPI.call(dest_username, true, "TEST CUSTOM DATA", {"X-DirectCall": "true"});
  currentCall.addEventListener(VoxImplant.CallEvents.Connected, onCallConnected);
  currentCall.addEventListener(VoxImplant.CallEvents.Disconnected, onCallDisconnected);
  currentCall.addEventListener(VoxImplant.CallEvents.Failed, onCallFailed);
  // currentCall.setVideoSettings({width: 720});
  console.log("voxAPI.call called");
}

//=============================================================================
// VoxImplant functions
//=============================================================================

// Show/hide local video
function showLocalVideo(flag) {
  voxAPI.showLocalVideo(flag);
  // Move local video from camera to container
  const videoOut = document.getElementById('voximplantlocalvideo');
  videoOut.style.width = '100%';    // fit in container with aspect ratio keeping
  videoOut.style.display = 'block'; // remove space under element (initially it is inline)
  document.getElementById('video-out').appendChild(videoOut);
  videoOut.play();
}

// Show/hide remote video
function showRemoteVideo(flag) {
  currentCall.showRemoteVideo(flag);
  const videoIn = document.getElementById(currentCall.getVideoElementId());
  videoIn.style.width = '100%';    // fit in container with aspect ratio keeping
  videoIn.style.display = 'block'; // remove space under element (initially it is inline)
  document.getElementById('video-in').appendChild(videoIn);
  videoIn.play();
}

// Start/stop sending video
function sendVideo(flag) {
  voxAPI.sendVideo(flag);
}

// Create outbound call
export function createVideoCall() {
  console.log("------------------------------");
  console.log('createVideoCall');
  console.log("! currentCall: ");
  console.log(currentCall);
  console.log('before connect in createVideoCall');
  console.log("VI connected: " + voxAPI.connected());
  if (!voxAPI.connected()) {
    voxAPI.connect();
  } else {
    currentCall = voxAPI.call(dest_username, true, "TEST CUSTOM DATA", {"X-DirectCall": "true"});
    currentCall.addEventListener(VoxImplant.CallEvents.Connected, onCallConnected);
    currentCall.addEventListener(VoxImplant.CallEvents.Disconnected, onCallDisconnected);
    currentCall.addEventListener(VoxImplant.CallEvents.Failed, onCallFailed);
    // currentCall.setVideoSettings({width: 720});
    console.log("voxAPI.call called");
  }
  console.log('after connect in createVideoCall');
  console.log("VI connected: " + voxAPI.connected());
  console.log("! currentCall: ");
  console.log(currentCall);
}

// Hangup outbound call
export function stopVideoCall() {
  console.log('---------- stopVideoCall');
  console.log("! currentCall: ");
  console.log(currentCall);
  if (currentCall) {
    currentCall.hangup();
  }
  console.log("! currentCall: ");
  console.log(currentCall);
  console.log("VI connected: " + voxAPI.connected());
}

//=============================================================================
// Call event handlers
//=============================================================================

// Call connected
function onCallConnected(e) {
  console.log("CallConnected: "+currentCall.id());
  sendVideo(true);
  showLocalVideo(true);
  showRemoteVideo(true);
}

// Call disconnected
function onCallDisconnected(e) {
  console.log("------------------------------");
  console.log("CallDisconnected: "+currentCall.id()+" Call state: "+currentCall.state());
  console.log("VI connected: " + voxAPI.connected());
  currentCall = null;
}

// Call failed
function onCallFailed(e) {
  console.log("------------------------------");
  console.log("CallFailed: "+currentCall.id()+" code: "+e.code+" reason: "+e.reason);
  console.log("VI connected: " + voxAPI.connected());
  currentCall = null;
}

