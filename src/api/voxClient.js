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

export let currentConv;

export let voxAPI;                  // object for VoxImplant instance
export let voxChatAPI;              // object for messenger instance

//=============================================================================
// VoxImplant functions
//=============================================================================

// Initialize VoxImplant
export function init(settings) {
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
        console.log('<<<<<<<<<< onSDKReady() >>>>>>>>>>');
        voxAPI.connect();
    });
    voxAPI.addEventListener(VoxImplant.Events.ConnectionEstablished, () => {
        console.log('<<<<<<<<<< onConnectionEstablished() >>>>>>>>>>');
        voxAPI.login(username + '@' + application_name + '.' + account_name + '.voximplant.com', password);
    });
    voxAPI.addEventListener(VoxImplant.Events.ConnectionFailed, () => {
        // Reconnect in 1 second
        setTimeout(function () {
            voxAPI.connect();
        }, 1000);
    });
    voxAPI.addEventListener(VoxImplant.Events.ConnectionClosed, () => {});
    voxAPI.addEventListener(VoxImplant.Events.MicAccessResult, () => {
        console.log('<+++++++++ onMicAccessResult() +++++++++>');
    });

    // Initialize SDK
    voxAPI.init({
        micRequired: true, // initially disable microphone/camera access request
                            // (so it will not be asked if the first chat mode will be text)
        videoSupport: true, // enable video support
        progressTone: true  // play progress tone
    });
}
// Initialize messenger
export function initMessenger() {
    console.log('<<<<<<<<<< initMessenger() begin');

    console.log('currentCall:');
    console.log(currentCall);
    
    // Create messenger instance
    voxChatAPI = VoxImplant.getMessenger();

    voxChatAPI.on(VoxImplant.MessagingEvents.onCreateConversation, (e) => {
        console.log('<<<<<<<<<< onCreateConversation begin');

        currentConv = e.conversation;
        console.log('currentConv:');
        console.log(currentConv);

        console.log('           onCreateConversation end >>>>>>>>>>');
    });
    voxChatAPI.on(VoxImplant.MessagingEvents.onRemoveConversation, (e) => {
        console.log('<<<<<<<<<< onRemoveConversation begin');
        console.log('removed conversation uuid: ' + e.conversation.uuid);
        console.log('           onRemoveConversation end >>>>>>>>>>');
    });
    voxChatAPI.on(VoxImplant.MessagingEvents.onError, (e) => {
        console.log('<<<<<<<<<< onError begin');
        console.log(e);
        console.log('          onError end >>>>>>>>>>');
    });
    voxChatAPI.on(VoxImplant.MessagingEvents.onGetUser, (e) => {
        console.log('<<<<<<<<<< onGetUser begin');
        console.log(e.user);
        console.log('currentConv:');
        console.log(currentConv);

        // If it's local user
        if (e.user.userId === voxChatAPI.getMe()) {
            console.log('My conversations.length:');
            console.log(e.user.conversationsList.length);

            // If there is an unremoved conversation from last messenger launch - remove it.
            // It may happen if chat was not closed correctly (page reload or network disconnect).
            if (e.user.conversationsList.length > 0) {
                console.log('Removing pending conversation ' + e.user.conversationsList[0]);
                voxChatAPI.removeConversation(e.user.conversationsList[0]);
            }

            // Create new conversation
            const participants = [{
                userId: dest_username + '@' + application_name + '.' + account_name,
                canManageParticipants: false, canWrite: true
            }];
            const title = 'Conversation';
            const isDistinct = false;
            const enablePublicJoin = true;
            voxChatAPI.createConversation(participants, title, isDistinct, enablePublicJoin);
        }

        console.log('          onGetUser end >>>>>>>>>>');
    });

    // Check for pending unremoved conversation and create a new one.
    voxChatAPI.getUser(voxChatAPI.getMe());
    
    console.log('           initMessenger() end >>>>>>>>>>');
}
// Deinitialize all
export function uninit() {
    // Clear all instances
    voxAPI = null;
    voxChatAPI = null;
}

// Begin video or voice call
export function beginCall(demandedMode) {
    console.log('<<<<<<<<<< beginCall() begin');
    console.log('callMode = ' + demandedMode);

    let useVideo = true;//(demandedMode === 'video');
    currentCall = voxAPI.call(dest_username, useVideo, 'TEST CUSTOM DATA', {'X-DirectCall': 'true'});

    currentCall.addEventListener(VoxImplant.CallEvents.MediaElementCreated, (e) => {
        console.log('<<<<<<<<<< onMediaElementCreated() begin');
        console.log(e.element);
        e.element.style.display = 'none';
        console.log('           onMediaElementCreated() end >>>>>>>>>>');
    });

    console.log('currentCall.getVideoElementId(): ' + currentCall.getVideoElementId());
    console.log('          beginCall() end >>>>>>>>>>');
}
// Enable/disable call progress tones
export function turnProgressTones(onOff) {
    if (onOff) {
        currentCall.addEventListener(VoxImplant.CallEvents.ProgressToneStart, () => {
            voxAPI.playProgressTone();
        });
        currentCall.addEventListener(VoxImplant.CallEvents.ProgressToneStop, () => {
            voxAPI.stopProgressTone();
        });
    }
}
// Turn the sound on/off
export function turnSound(onOff) {
    console.log('<<<<<<<<<< turnSound() begin');
    console.log('onOff = ' + onOff);

    if (onOff) {
        currentCall.unmutePlayback();
    } else {
        currentCall.mutePlayback();
    }

    console.log('           turnSound() end >>>>>>>>>>');
}
// Turn the microphone on/off
export function turnMic(onOff) {
    console.log('<<<<<<<<<< turnMic() begin');
    console.log('onOff = ' + onOff);

    if (onOff) {
        currentCall.unmuteMicrophone();
    } else {
        currentCall.muteMicrophone();
    }

    console.log('           turnMic() end >>>>>>>>>>');
}

// Hangup outbound chat
export function stopChat(callMode) {
    console.log('<<<<<<<<<< stopChat() begin');
    if (callMode === 'video' || callMode === 'voice') {
        console.log('currentCall before hanging up: ');
        console.log(currentCall);
        if (currentCall) {
            currentCall.hangup();
        }
        console.log('currentCall after hanging up: ');
        console.log(currentCall);
    } else if (callMode === 'text') {
        console.log('stopping text chat');
        console.log('removing conversation with uuid ' + currentConv.uuid);
        voxChatAPI.removeConversation(currentConv.uuid);
        currentConv = null;
        console.log('text chat has been stopped');
    }
    console.log('           stopChat() end >>>>>>>>>>');
}

// Video displaying control
export function videoControl(callMode) {
    console.log('<<<<<<<<<< videoControl() begin');
    console.log('callMode = ' + callMode);

    switch (callMode) {
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
    console.log('          videoControl() end >>>>>>>>>>');
}
// Show/hide local video
function showLocalVideo(onOff) {
    console.log('<<<<<<<<<< showLocalVideo() begin');
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

    console.log('          showLocalVideo() end >>>>>>>>>>');
}
// Show/hide remote video
function showRemoteVideo(onOff) {
    console.log('<<<<<<<<<< showRemoteVideo() begin');
    console.log('onOff = ' + onOff);

    currentCall.showRemoteVideo(onOff);
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

    console.log('          showRemoteVideo() end >>>>>>>>>>');
}
// Start/stop sending video
function sendVideo(onOff) {
    voxAPI.sendVideo(onOff);
}

//
export function sendMessage(text) {
    currentConv.sendMessage(text);
}