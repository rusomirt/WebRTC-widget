import {h, render, Component} from 'preact';
import classNames from 'classnames/bind';
import './font-awesome/css/font-awesome.css';
import 'font-awesome-webpack';
// import * as VoxImplant from 'voximplant-websdk';
import * as VoxImplant from './lib/voximplant.min.js';

import * as vox from 'api/voxClient';
import styles from './webchatClient.scss';

import lukesLogo from './img/lukes-logo.png';
import mewLogo from './img/mew-logo.png';
import oxidoLogo from './img/oxido-logo.png';
import flexMusselsLogo from './img/flex-mussels-logo.png';

// This allows using cn('class1', 'class2')
// instead of cn(styles['class1'], styles['class2'])
let cn = classNames.bind(styles);

class WebchatClient extends Component {
    constructor() {
        super();
        this.state = {
            // Allowed chatMode values:
            // 'idle', 'connectingVideo', 'video', 'connectingVoice',
            // 'voice', 'text', 'endCall', 'notAvailable'.
            chatMode: 'idle',
            isModeChanged: false    // checked in componentDidUpdated()
        };

        // These bindings are necessary to make `this` work in the callbacks

        this.getHashParams = this.getHashParams.bind(this);

        this.startChat = this.startChat.bind(this);
        this.switchMode = this.switchMode.bind(this);
        this.stopChat = this.stopChat.bind(this);
        this.backToInitial = this.backToInitial.bind(this);

        this.onAuthResult = this.onAuthResult.bind(this);
        this.onCallConnected = this.onCallConnected.bind(this);
        this.onCallDisconnected = this.onCallDisconnected.bind(this);
        this.onCallFailed = this.onCallFailed.bind(this);
    }
    // Get values from URL hash
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

    // Chat control functions
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
                vox.currentCall.addEventListener(VoxImplant.CallEvents.Failed, this.onCallFailed);
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
        const isConnectingMode = (this.state.chatMode === 'connectingVoice') ||
            (this.state.chatMode === 'connectingVideo');
        this.setState({
            chatMode: (isConnectingMode) ? 'idle' : 'endCall',
            isModeChanged: true,
        });
        console.log('           stopChat() end =========>');
    }
    backToInitial() {
        this.setState({
            chatMode: 'idle',
            isModeChanged: true,
        });
    }

    // Events from VoxImplant
    onAuthResult(e) {
        console.log('<========= onAuthResult() begin');
        console.log('this.state.chatMode = ' + this.state.chatMode);
        console.log('Auth result: ' + e.result);

        if (this.state.chatMode === 'connectingVideo' || this.state.chatMode === 'connectingVoice') {
            const nextMode = (this.state.chatMode === 'connectingVideo') ? 'video' : 'voice';
            vox.beginCall(nextMode);
            // Assign event handlers here because these events need to be handled in preact component
            vox.currentCall.addEventListener(VoxImplant.CallEvents.Connected, this.onCallConnected);
            vox.currentCall.addEventListener(VoxImplant.CallEvents.Disconnected, this.onCallDisconnected);
            vox.currentCall.addEventListener(VoxImplant.CallEvents.Failed, this.onCallFailed);
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
        console.log('<========= onCallDisconnected() begin');
        vox.currentCall = null; // clear call instance
        this.setState({
            chatMode: 'endCall',
            isModeChanged: true,
        });
        console.log('           onCallDisconnected() end =========>');
    }
    onCallFailed(e) {
        console.log('<========= onCallFailed() begin');
        console.log('Call id: '+vox.currentCall.id()+', code: '+e.code+', reason: '+e.reason);
        vox.currentCall = null;
        this.setState({
                chatMode: 'notAvailable',
                isModeChanged: true,
            });
        console.log('           onCallFailed() end =========>');
    }

    // Component events
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

    // Render to HTML
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
                            backToInitial={this.backToInitial}
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
                <span className={cn('fa fa-video-camera', 'icon', 'icon--white', 'icon--sm')}></span>
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
            <div className={cn('chat__info', 'chat__info--bordered')}>
                <div className={cn('chat__status', 'chat__status--high')}>
                    <div className={cn('chat__status-txt-wrapper')}>
                        <span className={cn('chat__status-hdr')}>
                            <span className={cn('fa fa-phone', 'icon', 'icon--color', 'icon--xs', 'icon--shifted')}></span>
                            Connecting to voice call
                        </span>
                    </div>
                </div>
                <div className={cn('chat__circles')}>
                    <div className={cn('chat__circle')}></div>
                    <div className={cn('chat__circle')}></div>
                    <div className={cn('chat__circle')}></div>
                    <div className={cn('chat__circle')}></div>
                    <div className={cn('chat__circle')}></div>
                </div>
                <img className={cn('chat__logo')} src={lukesLogo}/>
                <div className={cn('chat__tips')}>
                    Don't forget!<br/>
                    15% off for new customers<br/>
                    <span className={cn('fa fa-tag', 'icon', 'icon--color-scnd', 'icon--xs')}></span>
                </div>
            </div>;
            break;
        case 'connectingVideo': chatInfo =
            <div className={cn('chat__info', 'chat__info--bordered')}>
                <div className={cn('chat__status', 'chat__status--high')}>
                    <div className={cn('chat__status-txt-wrapper')}>
                        <span className={cn('chat__status-hdr')}>
                            <span className={cn('fa fa-video-camera', 'icon', 'icon--color', 'icon--xs', 'icon--shifted')}></span>
                            Connecting to video call
                        </span>
                    </div>
                </div>
                <div className={cn('chat__circles')}>
                    <div className={cn('chat__circle')}></div>
                    <div className={cn('chat__circle')}></div>
                    <div className={cn('chat__circle')}></div>
                    <div className={cn('chat__circle')}></div>
                    <div className={cn('chat__circle')}></div>
                </div>
                <img className={cn('chat__logo')} src={lukesLogo}/>
                <div className={cn('chat__tips')}>
                    Don't forget!<br/>
                    15% off for new customers<br/>
                    <span className={cn('fa fa-tag', 'icon', 'icon--color-scnd', 'icon--xs')}></span>
                </div>
            </div>;
            break;
        case 'voice': chatInfo =
            <div className={cn('chat__info', 'chat__info--bordered')}>
                <div className={cn('chat__status', 'chat__status--high')}>
                    <div className={cn('chat__status-txt-wrapper')}>
                        <span className={cn('chat__status-hdr')}>
                            <span className={cn('fa fa-phone', 'icon', 'icon--color', 'icon--xs', 'icon--shifted')}></span>
                            Voice call connected
                        </span>
                    </div>
                    <div className={cn('chat__timer-wrapper')}>
                        <Timer/>
                    </div>
                </div>
                <img className={cn('chat__logo')} src={lukesLogo}/>
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
                <div className={cn('chat__info', 'chat__info--bordered', 'chat__info--short')}>
                    <img className={cn('chat__logo')} src={lukesLogo}/>
                    <div className={cn('chat__status')}>
                        <div className={cn('chat__status-txt-wrapper')}>
                            <span className={cn('chat__status-hdr')}>
                                <span className={cn('fa fa-video-camera', 'icon', 'icon--color', 'icon--xs', 'icon--shifted')}></span>
                                Video call connected
                            </span>
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
                <div className={cn('chat__info', 'chat__info--bordered', 'chat__info--short')}>
                    <img className={cn('chat__logo')} src={lukesLogo}/>
                    <div className={cn('chat__status')}>
                        <div className={cn('chat__status-txt-wrapper')}>
                            <span className={cn('chat__status-hdr')}>
                                <span className={cn('fa fa-comments', 'icon', 'icon--color', 'icon--xs', 'icon--shifted')}></span>
                                Chat connected
                            </span>
                        </div>
                    </div>
                </div>;
            messengerContainer =
                <div className={cn('chat__msg-container')}>
                </div>;
            break;
        case 'endCall':
            chatInfo =
                <div className={cn('chat__info', 'chat__info--short')}>
                    <div className={cn('chat__status', 'chat__status--success')}>
                        <span className={cn('fa fa-check', 'icon', 'icon--white', 'icon--xs', 'icon--shifted')}></span>
                        Thanks for calling Luke's
                    </div>
                    <div className={cn('feedback')}>
                        <div className={cn('feedback__hdr')}>
                            <span className={cn('fa fa-yelp', 'icon', 'icon--white', 'icon--xs', 'icon--circled', 'icon--shifted')}></span>
                            Rate Luke's Lobster
                        </div>
                        <Rating clickable={true} starsNum={5} initValue={0} starSize={'20px'} inputName='name0'/>
                        <input className={cn('feedback__review')} placeholder='Write a review'/>
                    </div>
                    <div className={cn('subscribe')}>
                        <span className={cn('fa fa-envelope', 'icon', 'icon--color', 'icon--xs')}></span><br/>
                        Great!<br/>
                        Check your mail
                    </div>
                </div>;
                break;
        case 'notAvailable':
            chatInfo =
                <div className={cn('chat__info', 'chat__info--short')}>
                    <div className={cn('chat__status', 'chat__status--fail')}>
                        <div className={cn('chat__status-hdr', 'chat__status-hdr--margined')}>
                            <span className={cn('fa fa-times', 'icon', 'icon--white', 'icon--xs', 'icon--shifted')}></span>
                            Luke's is not available
                        </div>
                        <div className={cn('chat__status-txt')}>
                            Please fill your number and<br/>Luke's will call you back
                        </div>
                        <div className={cn('chat__phone-input-wrapper')}>
                            <input className={cn('chat__phone-input')} placeholder='Phone'/>
                            <button className={cn('chat__phone-input-btn')}>
                                <span className={cn('fa fa-chevron-right')}></span>
                            </button>
                        </div>
                    </div>
                    <div className={cn('similar')}>
                        <div className={cn('similar__hdr')}>Try similar restaurants in your area</div>
                        <div className={cn('similar__item')}>
                            <img className={cn('similar__logo')} src={mewLogo}/>
                            <div className={cn('similar__info')}>
                                <div className={cn('similar__name')}>
                                    MEW <span className={cn('fa fa-info-circle')}></span>
                                </div>
                                <div className={cn('similar__desc')}>
                                    Sushi Bars, Izakaya Cocktail Bars
                                </div>
                                <Rating clickable={false} starsNum={5} initValue={3.5} starSize={'14px'} inputName='name2'/>
                            </div>
                            <div className={cn('similar__call')}>
                                <button className={cn('similar__call-btn')}>
                                    <span className={cn('fa fa-phone', 'icon', 'icon--white', 'icon--md')}></span>
                                </button>
                            </div>
                        </div>
                        <div className={cn('similar__item')}>
                            <img className={cn('similar__logo')} src={oxidoLogo}/>
                            <div className={cn('similar__info')}>
                                <div className={cn('similar__name')}>
                                    MEW <span className={cn('fa fa-info-circle')}></span>
                                </div>
                                <div className={cn('similar__desc')}>
                                    Mexican, Cocktail Bars
                                </div>
                                <Rating clickable={false} starsNum={5} initValue={4} starSize={'14px'} inputName='name3'/>
                            </div>
                            <div className={cn('similar__call')}>
                                <button className={cn('similar__call-btn')}>
                                    <span className={cn('fa fa-phone', 'icon', 'icon--white', 'icon--md')}></span>
                                </button>
                            </div>
                        </div>
                        <div className={cn('similar__item')}>
                            <img className={cn('similar__logo')} src={flexMusselsLogo}/>
                            <div className={cn('similar__info')}>
                                <div className={cn('similar__name')}>
                                    MEW <span className={cn('fa fa-info-circle')}></span>
                                </div>
                                <div className={cn('similar__desc')}>
                                    Seafood, Bars
                                </div>
                                <Rating clickable={false} starsNum={5} initValue={4.5} starSize={'14px'} inputName='name4'/>
                            </div>
                            <div className={cn('similar__call')}>
                                <button className={cn('similar__call-btn')}>
                                    <span className={cn('fa fa-phone', 'icon', 'icon--white', 'icon--md')}></span>
                                </button>
                            </div>
                        </div>

                    </div>
                </div>;
            break;
    }

    let chatPanel =
        <ChatPanel
            chatMode={props.chatMode}
            stopChat={props.stopChat}
            switchMode={props.switchMode}
        />;
    let toYelpBtn = null;
    if (props.chatMode === 'endCall' || props.chatMode === 'notAvailable') {
        chatPanel = null;
        toYelpBtn =
            <button
                className={cn('back-btn')}
                onClick={props.backToInitial}
            >Back to Yelp</button>;
    }

    return (
        <div className={cn('chat')}>
            {chatInfo}
            {videoContainer}
            {messengerContainer}
            {chatPanel}
            {toYelpBtn}
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
        return (n > 9) ? ("" + n) : ('0' + n);
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

const Rating = (props) => {
    let starsArray = [];
    // Each star is represented by full star input (hidden), full star label,
    // half star input (hidden) and half star label.
    // And the stars must follow in inverse order.
    for (let i = props.starsNum; i > 0; i--) {
        // Full star
        const fullId = props.inputName + '_star_' + i + '_0';
        const fullValue = i;
        const fullChecked = ((props.initValue - fullValue) >= 0) && ((props.initValue - fullValue) < 0.5);
        const fullTitle = (props.clickable) ? (i + ' stars') : (props.initValue + ' stars');
        const inputFull = <input type='radio' id={fullId} name={props.inputName} value={fullValue}
                   defaultChecked={fullChecked} disabled={!props.clickable}/>;
        const labelFull = <label className={cn('rating__full-star')} htmlFor={fullId} title={fullTitle}></label>;

        // Half star
        const halfId = props.inputName + '_star_' + (i - 1) + '_5';
        const halfValue = i - 0.5;
        const halfChecked = ((props.initValue - halfValue) >= 0) && ((props.initValue - halfValue) < 0.5);
        const halfTitle = (props.clickable) ? ((i - 0.5) + ' stars') : (props.initValue + ' stars');
        const inputHalf = <input type='radio' id={halfId} name={props.inputName} value={halfValue}
                   defaultChecked={halfChecked} disabled={!props.clickable}/>;
        const labelHalf = <label className={cn('rating__half-star')} htmlFor={halfId} title={halfTitle}></label>;

        // Add in array
        starsArray.push(inputFull);
        starsArray.push(labelFull);
        starsArray.push(inputHalf);
        starsArray.push(labelHalf);
    }

    return (
        <fieldset
            className={cn('rating', {'hoverable': props.clickable})}
            style={{fontSize: props.starSize}}
        >
            {starsArray}
        </fieldset>
    );
};

module.exports = function createWidget(node, settings) {
    render(<WebchatClient settings={settings}/>, node);
};
