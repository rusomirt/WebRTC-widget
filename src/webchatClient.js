import {h, render, Component} from 'preact';
import classNames from 'classnames/bind';
import './font-awesome/css/font-awesome.css';
import 'font-awesome-webpack';
// import * as VoxImplant from 'voximplant-websdk';
import * as VoxImplant from './lib/voximplant.min.js';
import * as vox from 'api/voxClient';
import styles from './webchatClient.scss';

import logo from './img/lukes-logo.png';

let cn = classNames.bind(styles);

class WebchatClient extends Component {
    constructor() {
        super();
        this.state = {
            // Allowed chatMode values:
            // 'idle', 'connectingVideo', 'video', 'connectingVoice', 'voice', 'text'.
            chatMode: 'idle',
            isModeChanged: false
        };

        // These bindings are necessary to make `this` work in the callbacks

        this.getHashParams = this.getHashParams.bind(this);

        this.startChat = this.startChat.bind(this);
        this.stopChat = this.stopChat.bind(this);

        this.onAuthResult = this.onAuthResult.bind(this);
        this.onCallConnected = this.onCallConnected.bind(this);
        this.onCallDisconnected = this.onCallDisconnected.bind(this);

        this.switchMode = this.switchMode.bind(this);
    }
    getHashParams() {
        let hashParams = {};
        let e,
            a = /\+/g,  // Regex for replacing addition symbol with a space
            r = /([^&;=]+)=?([^&;]*)/g,
            d = function (s) {
                return decodeURIComponent(s.replace(a, ' '));
            },
            q = window.location.hash.substring(1);

        while (e = r.exec(q))
            hashParams[d(e[1])] = d(e[2]);

        return hashParams;
    }

    startChat(demandedMode) {
        console.log('<========= startChat() begin');

        if (demandedMode === 'voice') {
            this.setState({chatMode: 'connectingVoice'});
        } else if (demandedMode === 'video') {
            this.setState({chatMode: 'connectingVideo'});
        } else if (demandedMode === 'text') {
            this.setState({chatMode: 'text'});
        } else {
            return;
        }

        this.setState({isModeChanged: true});
        // vox.createChat(demandedMode);

        if (!vox.voxAPI.connected()) {      // 1st call
            console.log('connecting');
            vox.voxAPI.connect();
        } else {                            // 2nd and subsequent calls
            if (demandedMode === 'video' || demandedMode === 'voice') {
                vox.beginCall(demandedMode);
                // Assign event handlers here because these events need to be handled in preact component
                vox.currentCall.addEventListener(VoxImplant.CallEvents.Connected, this.onCallConnected);
                vox.currentCall.addEventListener(VoxImplant.CallEvents.Disconnected, this.onCallDisconnected);
            }
            else if (demandedMode === 'text') {
                if (!vox.voxChatAPI) {
                    vox.initMessenger();
                }
                vox.beginChat();
            }
        }
        console.log('           startChat() end =========>');
    }
    switchMode(nextMode) {
        console.log('<========= switchMode() begin');
        console.log('nextMode = ' + nextMode);

        if (this.state.chatMode === 'text') {
            // TODO: Hangup chat correctly

            console.log('starting call');
            this.startChat(nextMode);
        }
        else if (nextMode === 'text') {
            console.log('stopping call');
            vox.stopChat(this.state.chatMode);
            console.log('starting text chat');
            this.startChat(nextMode);
        }

        this.setState({
            chatMode: nextMode,
            isModeChanged: true
        });
        console.log('           switchMode() end =========>');
    }
    stopChat() {
        console.log('<========= stopChat() begin');
        let mode = null;
        if (this.state.chatMode === 'connectingVoice') {
            mode = 'voice';
        } else if (this.state.chatMode === 'connectingVideo') {
            mode = 'video';
        } else {
            mode = this.state.chatMode;
        }
        vox.stopChat(mode);
        this.setState({
            chatMode: 'idle',
            isModeChanged: true,
        });
        console.log('           stopChat() end =========>');
    }

    onAuthResult() {
        console.log('<========= onAuthResult() begin');
        console.log('this.state.chatMode = ' + this.state.chatMode);

        if (this.state.chatMode === 'connectingVideo' || this.state.chatMode === 'connectingVoice') {
            const nextMode = (this.state.chatMode === 'connectingVideo') ? 'video' : 'voice';
            vox.beginCall(nextMode);
            // Assign event handlers here because these events need to be handled in preact component
            vox.currentCall.addEventListener(VoxImplant.CallEvents.Connected, this.onCallConnected);
            vox.currentCall.addEventListener(VoxImplant.CallEvents.Disconnected, this.onCallDisconnected);
        } else if (this.state.chatMode === 'text') {
            vox.initMessenger();
            vox.beginChat();
        }
        console.log('           onAuthResult() end =========>');
    }
    onCallConnected() {
        console.log('<========= onCallConnected() begin');

        if (this.state.chatMode === 'connectingVoice') {
            this.setState({chatMode: 'voice'});
        } else if (this.state.chatMode === 'connectingVideo') {
            this.setState({chatMode: 'video'});
        }
        this.setState({isModeChanged: true});

        console.log('            onCallConnected() end =========>');
    }
    onCallDisconnected() {
        vox.currentCall = null; // clear call instance

        this.setState({
            chatMode: 'idle',
            isModeChanged: true,
        });
    }

    componentDidMount() {
        const hashParams = this.getHashParams();
        const voxParams = {
            account_name: hashParams.account_name ?
                hashParams.account_name : this.props.settings.account_name,
            application_name: hashParams.application_name ?
                hashParams.application_name : this.props.settings.application_name,
            client_username: hashParams.client_username ?
                hashParams.client_username : this.props.settings.client_username,
            client_password: hashParams.client_password ?
                hashParams.client_password : this.props.settings.client_password,
            op_username: hashParams.op_username ?
                hashParams.op_username : this.props.settings.op_username
        };
        vox.init(voxParams);
        // Assign event handler here because this event needs to be handled in preact component
        vox.voxAPI.addEventListener(VoxImplant.Events.AuthResult, this.onAuthResult);
    }
    componentDidUpdate() {
        if (this.state.isModeChanged) {
            this.setState({isModeChanged: false});

            // Mode changed to 'voice' or 'video'
            if (this.state.chatMode === 'voice' || this.state.chatMode === 'video') {
                console.log('<========= componentDidUpdate() begin');
                console.log(document.getElementById('video-in'));
                console.log(document.getElementById('video-out'));
                vox.videoControl(this.state.chatMode);
                console.log('           componentDidUpdate() end =========>');
            }
        }
    }
    componentWillUnmount() {
        vox.uninit();
    }

    render(props, state) {
        if (this.state.chatMode === 'idle') {
            return (
                <SelectMode
                    toggleChatButtons={this.toggleChatButtons}
                    startChat={this.startChat}
                />
            );
        } else {
            return (
                <div className={cn('modal')}>
                    <div className={cn('modal__inner')}>
                        <Chat
                            chatMode={this.state.chatMode}
                            stopChat={this.stopChat}
                            switchMode={this.switchMode}
                        />
                        <div className={cn('copyright')}>
                            <div className={cn('copyright__sign')}></div>
                            <div className={cn('copyright__text')}>powered by overtok</div>
                        </div>
                    </div>
                </div>
            );
        }
    }
}

class SelectMode extends Component {
    constructor() {
        super();
        this.state = {isChatBtnsOpen: false};
        this.toggleChatButtons = this.toggleChatButtons.bind(this);
    }
    toggleChatButtons() {
        this.setState(
            prevState => ({
                isChatBtnsOpen: !prevState.isChatBtnsOpen
            })
        );
    }
    render(props, state) {
        return (
            <div className={cn('webchat')}>
                <button
                    className={cn('webchat__launch-btn')}
                    onClick={this.toggleChatButtons}>
                    <span className={cn('fa fa-phone', 'icon', 'icon--white', 'icon--md')}></span>
                </button>
                <button
                    className={ cn('webchat__chat-btn', 'webchat__chat-btn--video',
                        {'webchat__chat-btn--showed': this.state.isChatBtnsOpen})}
                    onClick={() => props.startChat('video')}>
                <span
                    className={cn('fa fa-video-camera', 'icon', 'icon--white', 'icon--sm')}></span>
                </button>
                <button
                    className={ cn('webchat__chat-btn', 'webchat__chat-btn--voice',
                        {'webchat__chat-btn--showed': this.state.isChatBtnsOpen})}
                    onClick={() => props.startChat('voice')}>
                    <span className={cn('fa fa-phone', 'icon', 'icon--white', 'icon--sm')}></span>
                </button>
                <button
                    className={ cn('webchat__chat-btn', 'webchat__chat-btn--text',
                        {'webchat__chat-btn--showed': this.state.isChatBtnsOpen})}
                    onClick={() => props.startChat('text')}>
                    <span className={cn('fa fa-comments', 'icon', 'icon--white', 'icon--sm')}></span>
                </button>
            </div>
        );
    }
}

class ChatPanel extends Component {
    constructor() {
        super();
        this.state = {
            isSoundOn: true,
            isMicOn: true,
        };
        this.turnSound = this.turnSound.bind(this);
        this.turnMic = this.turnMic.bind(this);
    }

    turnSound() {
        vox.turnSound(!this.state.isSoundOn);
        this.setState({isSoundOn: !this.state.isSoundOn});
    }
    turnMic() {
        vox.turnMic(!this.state.isMicOn);
        this.setState({isMicOn: !this.state.isMicOn});
    }

    render(props, state) {
        const stopBtn =
            <button
                className={cn('chat__btn--stop')}
                onClick={props.stopChat}>
                <span className={cn('fa fa-phone', 'icon', 'icon--white', 'icon--lg')}></span>
            </button>;

        let switchVideoMode = () => {
            if (props.chatMode === 'video') {
                props.switchMode('voice');
            } else {
                props.switchMode('video');
            }
        };

        const videoBtn =
            <button className={cn('chat__btn--small')}
                    onClick={switchVideoMode}>
                <span className={cn('fa fa-video-camera', {'icon--crossed': props.chatMode === 'video'},
                    'icon', 'icon--color', 'icon--xs')}></span>
            </button>;

        const voiceBtn =
            <button className={cn('chat__btn--small')}
                    onClick={() => props.switchMode('voice')}>
                <span className={cn('fa fa-phone', 'icon--arrowed', 'icon', 'icon--color', 'icon--xs')}></span>
            </button>;

        const textBtn =
            <button className={cn('chat__btn--small')}
                    onClick={() => props.switchMode('text')}>
                <span className={cn('fa fa-comments', 'icon', 'icon--color', 'icon--sm')}></span>
            </button>;

        const soundBtn =
            <button className={cn('chat__btn--small')}
                    onClick={this.turnSound}>
                <span className={cn('fa', {'fa-volume-off': this.state.isSoundOn}, {'fa-volume-up': !this.state.isSoundOn},
                    'icon', 'icon--color', 'icon--sm')}></span>
            </button>;

        const micBtn =
            <button className={cn('chat__btn--small')}
                    onClick={this.turnMic}>
                <span className={cn('fa', {'fa-microphone-slash': this.state.isMicOn}, {'fa-microphone': !this.state.isMicOn},
                    'icon', 'icon--color', 'icon--sm')}></span>
            </button>;

        let leftGroup = null;
        let rightGroup = null;
        switch (props.chatMode) {
            case 'connectingVideo':
            case 'connectingVoice':
            case 'voice':
                leftGroup =
                    <div className={cn('chat__btns-group')}>
                        {videoBtn}
                        {textBtn}
                    </div>;
                rightGroup =
                    <div className={cn('chat__btns-group')}>
                        {soundBtn}
                        {micBtn}
                    </div>;
                break;
            case 'video':
                leftGroup =
                    <div className={cn('chat__btns-group')}>
                        {videoBtn}
                    </div>;
                rightGroup =
                    <div className={cn('chat__btns-group')}>
                        {textBtn}
                        {micBtn}
                    </div>;
                break;
            case 'text':
                leftGroup =
                    <div className={cn('chat__btns-group')}>
                        {videoBtn}
                    </div>;
                rightGroup =
                    <div className={cn('chat__btns-group')}>
                        {voiceBtn}
                    </div>;
                break;
        }

        return (
            <div className={cn('chat__panel')}>
                {leftGroup}
                {stopBtn}
                {rightGroup}
            </div>
        );
    }
}

const Chat = (props) => {

    let chatInfo = null;
    let videoContainer = null;
    let messengerContainer = null;
    switch (props.chatMode) {
        case 'connectingVoice': chatInfo =
            <div className={cn('chat__info')}>
                <div className={cn('chat__status')}>
                    <div className={cn('chat__status-txt-wrapper')}>
                        <span className={cn('fa fa-phone', 'icon', 'icon--color', 'icon--xs', 'icon--lowered')}></span>
                        <span className={cn('chat__status-txt')}>Connecting to voice call</span>
                    </div>
                </div>
                <div className={cn('chat__circles')}>
                    <div className={cn('chat__circle')}></div>
                    <div className={cn('chat__circle')}></div>
                    <div className={cn('chat__circle')}></div>
                    <div className={cn('chat__circle')}></div>
                    <div className={cn('chat__circle')}></div>
                </div>
                <img className={cn('chat__logo')} src={logo}/>
                <div className={cn('chat__tips')}>
                    Don't forget!<br/>
                    15% off for new customers<br/>
                    <span className={cn('fa fa-tag', 'icon', 'icon--color-scnd', 'icon--xs')}></span>
                </div>
            </div>;
            break;
        case 'connectingVideo': chatInfo =
            <div className={cn('chat__info')}>
                <div className={cn('chat__status')}>
                    <div className={cn('chat__status-txt-wrapper')}>
                        <span className={cn('fa fa-video-camera', 'icon', 'icon--color', 'icon--xs', 'icon--lowered')}></span>
                        <span className={cn('chat__status-txt')}>Connecting to video call</span>
                    </div>
                </div>
                <div className={cn('chat__circles')}>
                    <div className={cn('chat__circle')}></div>
                    <div className={cn('chat__circle')}></div>
                    <div className={cn('chat__circle')}></div>
                    <div className={cn('chat__circle')}></div>
                    <div className={cn('chat__circle')}></div>
                </div>
                <img className={cn('chat__logo')} src={logo}/>
                <div className={cn('chat__tips')}>
                    Don't forget!<br/>
                    15% off for new customers<br/>
                    <span className={cn('fa fa-tag', 'icon', 'icon--color-scnd', 'icon--xs')}></span>
                </div>
            </div>;
            break;
        case 'voice': chatInfo =
            <div className={cn('chat__info')}>
                <div className={cn('chat__status')}>
                    <div className={cn('chat__status-txt-wrapper')}>
                        <span className={cn('fa fa-phone', 'icon', 'icon--color', 'icon--xs', 'icon--lowered')}></span>
                        <span className={cn('chat__status-txt')}>Voice call connected</span>
                    </div>
                    <div className={cn('chat__timer-wrapper')}>
                        <Timer/>
                    </div>
                </div>
                <img className={cn('chat__logo')} src={logo}/>
                <div className={cn('chat__tips')}>
                    Don't forget!<br/>
                    15% off for new customers<br/>
                    <span className={cn('fa fa-tag', 'icon', 'icon--color-scnd', 'icon--xs')}></span>
                </div>
            </div>;
            // Hidden videoContainer is necessary for switching from voice call to video call
            // (it's created on video call init and if it's removed in voice call,
            // then video call has no remote video after switching from voice call)
            videoContainer =
                <div className={cn('chat__video-container', 'chat__video-container--hidden')}>
                    <div id='video-in' className={cn('chat__video-in')}></div>
                    <div id='video-out' className={cn('chat__video-out')}></div>
                </div>;
            break;
        case 'video':
            chatInfo =
                <div className={cn('chat__info', 'chat__info--short')}>
                    <img className={cn('chat__logo')} src={logo}/>
                    <div className={cn('chat__status')}>
                        <div className={cn('chat__status-txt-wrapper')}>
                            <span className={cn('fa fa-video-camera', 'icon', 'icon--color', 'icon--xs', 'icon--lowered')}></span>
                            <span className={cn('chat__status-txt')}>Video call connected</span>
                        </div>
                        <div className={cn('chat__timer-wrapper')}>
                            <Timer />
                        </div>
                    </div>
                </div>;
            videoContainer =
                <div className={cn('chat__video-container')}>
                    <div id='video-in' className={cn('chat__video-in')}></div>
                    <div id='video-out' className={cn('chat__video-out')}></div>
                </div>;
            break;
        case 'text':
            chatInfo =
                <div className={cn('chat__info', 'chat__info--short')}>
                    <img className={cn('chat__logo')} src={logo}/>
                    <div className={cn('chat__status')}>
                        <div className={cn('chat__status-txt-wrapper')}>
                            <span className={cn('fa fa-comments', 'icon', 'icon--color', 'icon--xs', 'icon--lowered')}></span>
                            <span className={cn('chat__status-txt')}>Chat connected</span>
                        </div>
                    </div>
                </div>;
            messengerContainer =
                <div className={cn('chat__msg-container')}>
                </div>;
            break;
    }

    return (
        <div className={cn('chat')}>

            {chatInfo}
            {videoContainer}
            {messengerContainer}
            <ChatPanel
                chatMode={props.chatMode}
                stopChat={props.stopChat}
                switchMode={props.switchMode}
            />

        </div>
    );
};

class Timer extends Component {
    constructor() {
        super();
        this.state = {
            min: 0,
            sec: 0
        };
        this.tick = this.tick.bind(this);
        this.format = this.format.bind(this);
    }
    tick() {
        this.setState(
            prevState => ({
                sec: (prevState.sec < 59) ? (prevState.sec + 1) : 0,
                min: (prevState.sec < 59) ? prevState.min : (prevState.min + 1)
            })
        );
    }
    format(n){
        return (n > 9) ? ("" + n) : ("0" + n);
    }
    componentDidMount() {
        // Ticks every second
        this.intervalID = setInterval(this.tick, 1000);
    }
    componentWillUnmount() {
        clearInterval(this.intervalID);
    }
    render() {
        return (
            <span className={cn('timer')}>
                {this.format(this.state.min)}:{this.format(this.state.sec)}
            </span>
        );
    }
}

module.exports = function createWidget(node, settings) {
    render(<WebchatClient settings={settings}/>, node);
};
