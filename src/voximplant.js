// // Load VoxImplant SDK:
// import * as VoxImplant from 'voximplant-websdk';
// create VoxImplant instance
let voxAPI = VoxImplant.getInstance();

// Waiting for full document loading
function ready(fn) {
 if (document.readyState !== 'loading'){
   fn();
 } else {
   document.addEventListener('DOMContentLoaded', fn);
 }
}

function getHashParams() {
  let hashParams = {};
  let e,
    a = /\+/g,  // Regex for replacing addition symbol with a space
    r = /([^&;=]+)=?([^&;]*)/g,
    d = function (s) { return decodeURIComponent(s.replace(a, " ")); },
    q = window.location.hash.substring(1);

  while (e = r.exec(q))
    hashParams[d(e[1])] = d(e[2]);

  return hashParams;
}

const hashparams = getHashParams(),
      username = hashparams.username,
      password = 'qwerty',
      application_name = 'videochat',
      account_name = 'xlucidity';

let currentCall = null,
    outboundCall = null;


ready(function() {

  try {

    // assign handlers
    voxAPI.addEventListener(VoxImplant.Events.SDKReady, onSdkReady);
    voxAPI.addEventListener(VoxImplant.Events.ConnectionEstablished, onConnectionEstablished);
    voxAPI.addEventListener(VoxImplant.Events.ConnectionFailed, onConnectionFailed);
    voxAPI.addEventListener(VoxImplant.Events.ConnectionClosed, onConnectionClosed);
    voxAPI.addEventListener(VoxImplant.Events.AuthResult, onAuthResult);
    voxAPI.addEventListener(VoxImplant.Events.IncomingCall, onIncomingCall);
    voxAPI.addEventListener(VoxImplant.Events.MicAccessResult, onMicAccessResult);
    voxAPI.addEventListener(VoxImplant.Events.SourcesInfoUpdated, onSourcesInfoUpdated);

    // initialize SDK
    voxAPI.init({
      useFlashOnly: false,
      micRequired: true,  // force microphone/camera access request
      videoSupport: true, // enable video support
      progressTone: true  // play progress tone
    });


  } catch (e) {
    console.log('---------- ---------- caught error: -------------');
    console.log(e.message);
    console.log('---------- ---------------------------------------');
  }

});

// SDK ready - functions can be called now
function onSdkReady(){
  voxAPI.connect();
}

// Connection with VoxImplant established
function onConnectionEstablished() {
  voxAPI.login(username+"@"+application_name+"."+account_name+".voximplant.com", password);
}

// Connection with VoxImplant failed
function onConnectionFailed() {
  setTimeout(function() {voxAPI.connect();}, 1000);
}

// Connection with VoxImplant closed
function onConnectionClosed() {
  setTimeout(function() {voxAPI.connect();}, 1000);
}

// Handle authorization result
function onAuthResult(e) {}

// Camera/mic access result
function onMicAccessResult(e) {}

// Audio & video sources info available
function onSourcesInfoUpdated() {
  let audioSources = voxAPI.audioSources(),
      videoSources = voxAPI.videoSources();
}

// Incoming call
function onIncomingCall(e) {
  currentCall = e.call;
  // Add handlers
  currentCall.addEventListener(VoxImplant.CallEvents.Connected, onCallConnected);
  currentCall.addEventListener(VoxImplant.CallEvents.Disconnected, onCallDisconnected);
  currentCall.addEventListener(VoxImplant.CallEvents.Failed, onCallFailed);
  console.log("---------- Incoming call from: "+currentCall.number());
  // Answer automatically
  currentCall.answer();
}

// Progress tone play start
function onProgressToneStart(e) {
  console.log("---------- ProgessToneStart for call id: "+currentCall.id());
}

// Progres tone play stop
function onProgressToneStop(e) {
  console.log("---------- ProgessToneStop for call id: "+currentCall.id());
}

// Disconnect current call
function disconnectCall() {
  if (currentCall != null) {
    console.log("---------- Disconnect");
    currentCall.hangup();
  }
}

// Close connection with VoxImplant
function closeConnection() {
  voxAPI.disconnect();
}

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
export function createVideoCallTo2nd() {

  console.log('---------- createVideoCall to 2nd');

  ready(function() {
    window.stop();
    console.log(document.getElementById('callButton'));
    document.getElementById('callButton').addEventListener('click', function () {
      currentCall.hangup();
    });
  });

  outboundCall = currentCall = voxAPI.call('skalatskyalexey-2nd', true, "TEST CUSTOM DATA", {"X-DirectCall": "true"});
  currentCall.addEventListener(VoxImplant.CallEvents.Connected, onCallConnected);
  currentCall.addEventListener(VoxImplant.CallEvents.Disconnected, onCallDisconnected);
  currentCall.addEventListener(VoxImplant.CallEvents.Failed, onCallFailed);
  currentCall.setVideoSettings({width: 720});
}

// Call connected
function onCallConnected(e) {
  console.log("---------- CallConnected: "+currentCall.id());
  sendVideo(true);
  showLocalVideo(true);
  showRemoteVideo(true);
}

// Call disconnected
function onCallDisconnected(e) {
  console.log("---------- CallDisconnected: "+currentCall.id()+" Call state: "+currentCall.state());
  currentCall = null;
}

// Call failed
function onCallFailed(e) {
  console.log("---------- CallFailed: "+currentCall.id()+" code: "+e.code+" reason: "+e.reason);
}

