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

const username = connectionParams.test_emul_user,
      password = connectionParams.test_emul_password,
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

(function init() {
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
  voxAPI.addEventListener(VoxImplant.Events.IncomingCall, onIncomingCall);

  // Initialize SDK
  voxAPI.init({
    useFlashOnly: false,
    micRequired: true,  // force microphone/camera access request
    videoSupport: true, // enable video support
    progressTone: true  // play progress tone
  });
})();


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
  currentCall.answer();
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
  currentCall = null;
}

// Call failed
function onCallFailed(e) {
  console.log("------------------------------");
  console.log("CallFailed: "+currentCall.id()+" code: "+e.code+" reason: "+e.reason);
  console.log("VI connected: " + voxAPI.connected());
  currentCall = null;
}

