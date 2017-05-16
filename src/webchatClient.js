// Preact imports
import {h, render, Component} from 'preact';
import classNames from 'classnames/bind';

// NPM package for working with font-awesome icons classes
import 'font-awesome-webpack';

// VoxImplant library
// import * as VoxImplant from 'voximplant-websdk';
import * as VoxImplant from './lib/voximplant.min.js';  // onProgressToneStart event fixed

// VoxImplant API custom functions
import * as vox from 'api/voxClient';

// Working with AJAX
import axios from 'axios';

// Stylesheets for component
import styles from './webchatClient.scss';

// Images
import lukesLogo from './img/lukes-logo.png';
import mewLogo from './img/mew-logo.png';
import oxidoLogo from './img/oxido-logo.png';
import flexMusselsLogo from './img/flex-mussels-logo.png';

// This allows using cn('class1', 'class2')
// instead of cn(styles['class1'], styles['class2'])
let cn = classNames.bind(styles);

// Top-level webchat client component
// Props: settings
class WebchatClient extends Component {
    constructor() {
        super();
        this.state = {
            // Allowed chatMode values:
            // 'invisible', 'idle', 'connectingVideo', 'video', 'connectingVoice',
            // 'voice', 'text', 'endCall', 'notAvailable'.
            chatMode: 'invisible',
            isModeChanged: false,   // checked in componentDidUpdated()
            isFirstCall: true,      // indicates that call is the first from widget init
            isSoundOn: true,
            isMicOn: true,
            messages: [],
            phoneSentDelay: false
        };

        // These bindings are necessary to make `this` work in the callbacks

        this.getHashParams = this.getHashParams.bind(this);

        this.startChat = this.startChat.bind(this);
        this.turnSound = this.turnSound.bind(this);
        this.turnMic = this.turnMic.bind(this);
        this.switchMode = this.switchMode.bind(this);
        this.stopChat = this.stopChat.bind(this);
        this.backToInitial = this.backToInitial.bind(this);
        this.phoneSentChangeMode = this.phoneSentChangeMode.bind(this);

        this.onAuthResult = this.onAuthResult.bind(this);
        this.onMicAccessResult = this.onMicAccessResult.bind(this);
        this.onCallConnected = this.onCallConnected.bind(this);
        this.onCallDisconnected = this.onCallDisconnected.bind(this);
        this.onCallFailed = this.onCallFailed.bind(this);

        this.addMessageToList = this.addMessageToList.bind(this);
        this.onSend = this.onSend.bind(this);
        this.onReceiveMessage = this.onReceiveMessage.bind(this);
        this.getCurrentTimeString = this.getCurrentTimeString.bind(this);
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
        console.log('<========= startChat(): ' + demandedMode);
        console.log('vox.currentCall:');
        console.log(vox.currentCall);

        // Voice/video chat which has not been connected yet
        if (demandedMode !== 'text' && !vox.currentCall) {
            console.log('Voice/video chat which has not been connected yet');

            // If this call is the first from widget init
            if (this.state.isFirstCall) {
                this.setState({isFirstCall: false});
                // Ask about allowing camera & microphone access
                vox.askCamAndMic();
            } else {
                vox.startCall(this.onCallConnected, this.onCallDisconnected, this.onCallFailed);
            }

            // Switch UI to connecting state
            if (demandedMode === 'voice') {
                this.setState({chatMode: 'connectingVoice'});
            } else if (demandedMode === 'video') {
                this.setState({chatMode: 'connectingVideo'});
            }
        } else {    // Text chat or voice/video chat which has already been connected
            this.setState({chatMode: demandedMode});
        }

        this.setState({isModeChanged: true});

        console.log('new chatMode = ' + this.state.chatMode);
        console.log('           startChat() =========>');
    }
    switchMode(demandedMode) {
        console.log('<========= switchMode(): ' + demandedMode);

        this.startChat(demandedMode);

        // If call is connected
        if (vox.currentCall) {
            // In text chat microphone & sound must be disabled,
            // in voice/video chat they are initially enabled.
            this.turnMic(demandedMode !== 'text');
            this.turnSound(demandedMode !== 'text');
        }

        console.log('new chatMode = ' + this.state.chatMode);
        console.log('           switchMode() =========>');
    }
    turnSound(onOff) {
        vox.turnSound(onOff);
        this.setState({isSoundOn: onOff});
    }
    turnMic(onOff) {
        vox.turnMic(onOff);
        this.setState({isMicOn: onOff});
    }
    stopChat() {
        console.log('<========= stopChat() begin');

        // Hangup call
        vox.stopCall();

        // If user stops chat while connecting a call, return to initial idle state.
        // In other cases go to 'end call' screen.
        const isConnectingMode = (this.state.chatMode === 'connectingVoice') ||
            (this.state.chatMode === 'connectingVideo');
        this.setState({
            chatMode: (isConnectingMode) ? 'idle' : 'endCall',
            isModeChanged: true,
        });

        console.log('new chatMode = ' + this.state.chatMode);
        console.log('           stopChat() end =========>');
    }
    backToInitial() {
        console.log('<========= backToInitial() begin');
        this.setState({
            chatMode: 'idle',
            isModeChanged: true,
        });
        console.log('new chatMode = ' + this.state.chatMode);
        console.log('           backToInitial() end =========>');
    }
    // Handle user's phone input submitting (on 'not available' screen)
    phoneSentChangeMode(inputValue) {
        console.log('<========= phoneSentChangeMode()');
        console.log('inputValue = ' + inputValue);

        if (inputValue !== '') {    // User entered the phone number and clicked 'submit' button
            this.setState({phoneSentDelay: true});
            // AJAX request to server
            axios.post('/script',{userPhone: inputValue})
                .then((response) => console.log(response))
                .catch((error) => console.log(error));
            // Show 'Thank you' box for a few moments, then go to 'end call' screen
            setTimeout(() => {
                this.setState({
                    phoneSentDelay: false,
                    chatMode: 'endCall'
                });
            }, 3000);
        } else {                    // User hasn't entered the phone number but clicked 'submit' button
            this.setState({
                chatMode: 'endCall' // Go to 'end call screen'
            });
        }

        console.log('           phoneSentChangeMode() =========>');
    }

    // VoxImplant events handlers

    // When user has been logged in
    onAuthResult(e) {
        console.log('<========= onAuthResult() begin');
        console.log('this.state.chatMode = ' + this.state.chatMode);
        console.log('Auth result: ' + e.result);

        // Initialize text messenger
        vox.initMessenger(this.onReceiveMessage);

        // Make widget available for user
        this.setState({chatMode: 'idle'});

        console.log('           onAuthResult() end =========>');
    }
    // Handling user's response to question about camera & microphone access
    onMicAccessResult(e) {
        console.log('<+++++++++ onMicAccessResult()');
        console.log('e.result: ' + e.result);

        // If user has allowed access to camera & microphone: begin call
        if (e.result) {
            vox.startCall(this.onCallConnected, this.onCallDisconnected, this.onCallFailed);
        }
        
        console.log('currentCall.getVideoElementId(): ' + vox.currentCall.getVideoElementId());

        console.log('           onMicAccessResult() +++++++++>');
    }
    // When call has been connected
    onCallConnected() {
        console.log('<========= onCallConnected() begin');
        console.log('vox.currentCall:');
        console.log(vox.currentCall);
        console.log('currentCall.getVideoElementId(): ' + vox.currentCall.getVideoElementId());

        // Change state from connecting to calling
        if (this.state.chatMode === 'connectingVoice') {
            this.setState({chatMode: 'voice'});
        } else if (this.state.chatMode === 'connectingVideo') {
            this.setState({chatMode: 'video'});
        }
        this.setState({isModeChanged: true});

        // Sound & microphone are disabled in text chat
        this.turnMic(this.state.chatMode !== 'text');
        this.turnSound(this.state.chatMode !== 'text');

        console.log('new chatMode = ' + this.state.chatMode);
        console.log('             onCallConnected() end =========>');
    }
    // When call has been disconnected, change state to endCall or to idle
    // (if call was not connected by the moment of 'stop' button click)
    onCallDisconnected() {
        console.log('<+++++++++ onCallDisconnected()');
        vox.currentCall = null; // clear call instance
        this.setState({
            // If chat has been stopped while call connecting, keep 'idle' state,
            // if chat was connected - go to 'endCall' screen
            chatMode: (this.state.chatMode === 'idle') ? 'idle' : ((this.state.chatMode === 'text') ? 'text' : 'endCall'),
            isModeChanged: true,
        });
        console.log('new chatMode = ' + this.state.chatMode);
        console.log('           onCallDisconnected() end +++++++++>');
    }
    // When call fails - fo to 'not available' screen
    onCallFailed(e) {
        console.log('<========= onCallFailed() begin');
        console.log('Call id: '+vox.currentCall.id()+', code: '+e.code+', reason: '+e.reason);
        vox.currentCall = null;
        this.setState({
                chatMode: 'notAvailable',
                isModeChanged: true,
            });
        console.log('new chatMode = ' + this.state.chatMode);
        console.log('           onCallFailed() end =========>');
    }

    // Functions from Messenger

    // Send text from input field and add it in the messages list
    onSend(messageText) {
        // console.log('<========= onSend() in Messenger');
        // console.log('messageText = ' + messageText);

        const messageTime = this.getCurrentTimeString();

        const message = {
            fromMe: true,
            text: messageText,
            timeStamp: messageTime
        };
        // console.log('message:');
        // console.log(message);

        this.addMessageToList(message);

        // console.log('new state:');
        // console.log(this.state);

        vox.sendMessage(messageText);

        // console.log('          onSend() in Messenger =========>');
    }
    // Append the message to the component state
    addMessageToList(message) {
        const messages = this.state.messages;
        messages.push(message);
        this.setState({ messages });
    }
    onReceiveMessage(e) {
        console.log('<========= onReceiveMessage');
        console.log('e.message:');
        console.log(e.message);
        console.log(e.message.sender);
        console.log(e.message.text);

        // If this message has been sent by other user
        if (e.message.sender !== vox.username + '@' + vox.application_name + '.' + vox.account_name) {
            const messageTime = this.getCurrentTimeString();

            const message = {
                fromMe: false,
                text: e.message.text,
                timeStamp: messageTime
            };
            // console.log('message:');
            // console.log(message);

            this.addMessageToList(message);
        }

        console.log('this.state.messages:');
        console.log(this.state.messages);
        console.log('           onReceiveMessage =========>');
    }
    // Get current timestamp in format (h)h:mm + am/pm
    getCurrentTimeString() {
        const now = new Date();
        const nowHours = (now.getHours() <= 12) ? ((now.getHours() === 0) ? 12 : now.getHours()) : (now.getHours() - 12);
        const dayTime = (now.getHours() < 12) ? 'am' : 'pm';
        const nowMinutes = ((now.getMinutes() < 10) ? '0' : '') + now.getMinutes();
        return nowHours + ':' + nowMinutes + dayTime;
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
        vox.init(voxParams, this.onAuthResult, this.onMicAccessResult);
    }
    componentDidUpdate() {
        if (this.state.isModeChanged) {
            console.log(`<========= componentDidUpdate()`);
            console.log(`Mode has just been changed to  \'${this.state.chatMode}\'`);

            this.setState({
                isModeChanged: false,
                messages: []
            });

            // If component rerender was caused by state change from connecting to calling
            // or by switching between call modes
            if (this.state.chatMode === 'voice' || this.state.chatMode === 'video') {
                console.log(document.getElementById('video-in'));
                console.log(document.getElementById('video-out'));
                vox.videoControl(this.state.chatMode);
            }
            if (this.state.chatMode === 'text') {
                // Behavior of these elements is not clear: local video is suddenly placed
                // in some elements of UI after switching from video call to text chat.
                // So manual hiding of local video is needed.
                console.log(document.getElementById('video-in'));
                console.log(document.getElementById('video-out'));
                const videoIn = document.getElementById('voximplantlocalvideo');
                console.log(videoIn);
                if (videoIn) {
                    videoIn.style.display = 'none';
                }
            }

            console.log('this.state.messages:');
            console.log(this.state.messages);
            console.log('           componentDidUpdate() =========>');
        }
    }
    componentWillUnmount() {
        vox.uninit();
    }

    render(props, state) {
        if (this.state.chatMode === 'invisible') {      // Widget is invisible until VoxImplant init finished.
            return (null);
        } else if (this.state.chatMode === 'idle') {    // Init completed, user may choose needed chat mode.
            return (
                <SelectMode
                    clientAppInstalled={this.props.settings.client_app_installed}
                    startChat={this.startChat}
                />
            );
        } else {                                        // User has chosen chat mode
            return (
                <div className={cn('modal')}>
                    <div className={cn('modal__inner')}>
                        <Chat
                            clientAppInstalled={this.props.settings.client_app_installed}
                            chatMode={this.state.chatMode}
                            stopChat={this.stopChat}
                            switchMode={this.switchMode}
                            backToInitial={this.backToInitial}
                            onSend={this.onSend}
                            messages={this.state.messages}
                            phoneSentDelay={this.state.phoneSentDelay}
                            phoneSentChangeMode={this.phoneSentChangeMode}
                            isSoundOn={this.state.isSoundOn}
                            turnSound={this.turnSound}
                            isMicOn={this.state.isMicOn}
                            turnMic={this.turnMic}
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

// Shown in initial mode and allows to select chat mode (voice/video/text)
// Props: clientAppInstalled, startChat()
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
        if (this.props.clientAppInstalled) {
            return (
                <div className={cn('webchat')}>
                    <button
                        className={cn('webchat__launch-btn')}
                        onClick={this.toggleChatButtons}>
                        <span className={cn('fa fa-phone', 'icon', 'icon--white', 'icon--md')}></span>
                    </button>
                    <button
                        className={ cn('webchat__chat-btn', 'webchat__chat-btn--video',
                            {'webchat__chat-btn--hidden': !this.state.isChatBtnsOpen})}
                        onClick={() => props.startChat('video')}>
                        <span className={cn('fa fa-video-camera', 'icon', 'icon--white', 'icon--sm')}></span>
                    </button>
                    <button
                        className={ cn('webchat__chat-btn', 'webchat__chat-btn--voice',
                            {'webchat__chat-btn--hidden': !this.state.isChatBtnsOpen})}
                        onClick={() => props.startChat('voice')}>
                        <span className={cn('fa fa-phone', 'icon', 'icon--white', 'icon--sm')}></span>
                    </button>
                    <button
                        className={ cn('webchat__chat-btn', 'webchat__chat-btn--text',
                            {'webchat__chat-btn--hidden': !this.state.isChatBtnsOpen})}
                        onClick={() => props.startChat('text')}>
                        <span className={cn('fa fa-comments', 'icon', 'icon--white', 'icon--sm')}></span>
                    </button>
                </div>
            );
        } else {
            return (
                <div className={cn('webchat')}>
                    <button
                        className={cn('webchat__launch-btn')}
                        onClick={() => props.startChat('voice')}>
                        <span className={cn('fa fa-phone', 'icon', 'icon--white', 'icon--md')}></span>
                    </button>
                </div>
            );
        }
    }
}

// Chat block
// Props: clientAppInstalled, chatMode, stopChat(), switchMode(), backToInitial(), onSend(), messages,
//        phoneSentDelay, phoneSentChangeMode(), isSoundOn, turnSound(), isMicOn, turnMic().
const Chat = (props) => {

    let chatInfo = null;
    let videoContainer = null;
    let messenger= null;
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
                <ConnectingAnimation />
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
                <ConnectingAnimation />
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
            // Hidden videoContainer is necessary for switching to video mode
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
                        {/* Hidden timer is needed to continue time count in text mode */}
                        <div className={cn('chat__timer-wrapper', 'chat__timer-wrapper--hidden')}>
                            <Timer/>
                        </div>
                    </div>
                </div>;
            messenger = <Messenger onSend={props.onSend} messages={props.messages} />;
            // Hidden videoContainer is necessary for switching to video mode
            videoContainer =
                <div className={cn('chat__video-container', 'chat__video-container--hidden')}>
                    <div id='video-in' className={cn('chat__video-in')}></div>
                    <div id='video-out' className={cn('chat__video-out')}></div>
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
                    <Subscribe />
                </div>;
                break;
        case 'notAvailable':
            const restaurants = [
                {
                    logo: mewLogo,
                    name: 'MEW',
                    desc: 'Sushi Bars, Izakaya Cocktail Bars',
                    rating: 3.7,
                    ratingMax: 5,
                    callHandler: () => {alert('restaurant #1')}
                },
                {
                    logo: oxidoLogo,
                    name: 'Oxido',
                    desc: 'Mexican, Cocktail Bars',
                    rating: 4.1,
                    ratingMax: 5,
                    callHandler: () => {alert('restaurant #2')}
                },
                {
                    logo: flexMusselsLogo,
                    name: 'Flex Mussels',
                    desc: 'Seafood, Bars',
                    rating: 4.5,
                    ratingMax: 5,
                    callHandler: () => {alert('restaurant #3')}
                },
            ];
            const chatStatus =
                props.phoneSentDelay
                ?
                <div className={cn('chat__status', 'chat__status--fail')}>
                    <div className={cn('chat__status-hdr')}>
                        <span className={cn('fa fa-check', 'icon', 'icon--white', 'icon--xs', 'icon--shifted')}></span>
                        We sent a message to Luke's
                    </div>
                </div>
                :
                <div className={cn('chat__status', 'chat__status--fail')}>
                    <div className={cn('chat__status-hdr', 'chat__status-hdr--margined')}>
                        <span className={cn('fa fa-times', 'icon', 'icon--white', 'icon--xs', 'icon--shifted')}></span>
                        Luke's is not available
                    </div>
                    <div className={cn('chat__status-txt')}>
                        Please fill your number and<br/>Luke's will call you back
                    </div>
                    <InlineForm action='index.php' method='post' placeholder='Phone' bordered={false}
                                onSubmit={props.phoneSentChangeMode} />
                </div>;

            chatInfo =
                <div className={cn('chat__info', 'chat__info--short')}>
                    {chatStatus}
                    <RestaurantsList restaurants={restaurants} />
                </div>;
            break;
    }

    let chatPanel =
        <ChatPanel
            clientAppInstalled={props.clientAppInstalled}
            chatMode={props.chatMode}
            stopChat={props.stopChat}
            switchMode={props.switchMode}
            isSoundOn={props.isSoundOn}
            turnSound={props.turnSound}
            isMicOn={props.isMicOn}
            turnMic={props.turnMic}
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
            {messenger}
            {chatPanel}
            {toYelpBtn}
        </div>
    );
};

// Props: none
const ConnectingAnimation = () => {
    return (
        <div className={cn('ballsWaveG')}>
            <div className={cn('ballsWaveG__ball', 'ballsWaveG__ball--1')}></div>
            <div className={cn('ballsWaveG__ball', 'ballsWaveG__ball--2')}></div>
            <div className={cn('ballsWaveG__ball', 'ballsWaveG__ball--3')}></div>
            <div className={cn('ballsWaveG__ball', 'ballsWaveG__ball--4')}></div>
            <div className={cn('ballsWaveG__ball', 'ballsWaveG__ball--5')}></div>
            <div className={cn('ballsWaveG__ball', 'ballsWaveG__ball--6')}></div>
            <div className={cn('ballsWaveG__ball', 'ballsWaveG__ball--7')}></div>
            <div className={cn('ballsWaveG__ball', 'ballsWaveG__ball--8')}></div>
        </div>
    );
};

// Props:
class Subscribe extends Component {
    constructor() {
        super();
        this.state = {subscribed: false};
        this.onSubmit = this.onSubmit.bind(this);
    }
    onSubmit(inputValue) {
        console.log('<========= Subscribe onSubmit()');
        console.log('inputValue = ' + inputValue);

        this.setState({subscribed: true});
        // AJAX request to server
        axios.post('/script',{userEmail: inputValue})
            .then((response) => console.log(response))
            .catch((error) => console.log(error));

        console.log('           Subscribe onSubmit() =========>');
    }
    render(props, state) {
        if (this.state.subscribed === false) {
            return (
                <div className={cn('subscribe-wrapper')}>
                    <div>Join & get 5$ coupon</div>
                    <InlineForm bordered={true} action='index.php' method='post'
                                placeholder='E-mail' onSubmit={this.onSubmit} />
                </div>
            );
        } else {
            return (
                <div className={cn('subscribe-wrapper')}>
                    <div className={cn('subscribe')}>
                        <span className={cn('fa fa-envelope', 'icon', 'icon--color', 'icon--xs')}></span><br/>
                        Great!<br/>
                        Check your mail
                    </div>
                </div>
            );
        }
    }
}

// Props: action, method, placeholder, onSubmit(), bordered
class InlineForm extends Component {
    constructor() {
        super();
        this.state = {inputValue: ''};
        this.onSubmit = this.onSubmit.bind(this);
        this.onTextChange = this.onTextChange.bind(this);
    }
    onSubmit(e) {
        e.preventDefault();
        const trimmedText = this.state.inputValue.trim();
        this.props.onSubmit(trimmedText);
    }
    onTextChange(e) {
        this.setState({ inputValue: e.target.value });
    }
    render(props, state) {
        return(
            <form className={cn('inline-form', {'inline-form--bordered': this.props.bordered})} onSubmit={this.onSubmit}
                  action={this.props.action} method={this.props.method}>
                <input className={cn('inline-form__input')} onInput={this.onTextChange}
                       placeholder={this.props.placeholder}/>
                <button className={cn('inline-form__btn')}>
                    <span className={cn('fa fa-chevron-right')}></span>
                </button>
            </form>
        );
    }
}

// Text messenger
// Props: messages, onSend()
class Messenger extends Component {
    constructor(props) {
        super(props);
        this.state = {};
    }
    componentDidMount() {
        console.log('<========= Messenger componentDidMount() =========>');
    }
    componentDidUpdate() {
        console.log('<========= Messenger componentDidUpdate() =========>');
    }
    render(props, state) {
        return (
            <div className={cn('msgr')}>
                <Messages messages={props.messages} />
                <ChatInput onSend={props.onSend} />
            </div>
        );
    }
}
// Text messenger: messages
// Props: messages
class Messages extends Component {
    constructor() {
        super();
        this.state = {scrollbarWidth: 0};
    }
    componentDidMount() {
        console.log('<========= Messages componentDidMount()');
        console.log('this.props.messages:');
        console.log(this.props.messages);
        // Hide the scrollbar:
        // expand element by the scrollbar width and the scrollbar will be hidden
        // due to overflow:hidden of parent wrapper.
        const nodeList = this.nodeList;
        // const nodeList = document.getElementById('msgrList');
        console.log('nodeList:');
        console.log(nodeList);
        console.log('nodeList.offsetWidth = ' + nodeList.offsetWidth);
        console.log('nodeList.clientWidth = ' + nodeList.clientWidth);
        let scrollbarWidth = nodeList.offsetWidth - nodeList.clientWidth;
        console.log('scrollbarWidth = ' + scrollbarWidth);
        this.setState({scrollbarWidth: scrollbarWidth});
        if (nodeList) {
            // nodeList.setAttribute('style', 'width: calc(100% + ' + scrollbarWidth + 'px); background: red;');
            // nodeList.setAttribute('style', '');
            // nodeList.style.background = 'red';
            console.log(nodeList);
        }
        console.log('           Messages componentDidMount() =========>');
    }

    // There is a new message in the nodeList
    componentDidUpdate() {
        const nodeList = this.nodeList;
        // Scroll to bottom of nodeList
        nodeList.scrollTop = nodeList.scrollHeight;
    }
    componentDidUnmount() {
        console.log('<========= Messages componentDidUnmount()');
    }
    render(props, state) {
        let scrollbarWidth = this.state.scrollbarWidth;
        // If the style is applied in componentDidMount(), there is a strange behavior:
        // after mode switching from text to other some elements have `width: calc(100% + ${scrollbarWidth}px)`
        const listStyle = {width: `calc(100% + ${scrollbarWidth}px)`};

        // Loop through all the messages in the state and create a Message component for each
        const messages = this.props.messages.map((message, i) => {
            return (
                <Message
                    key={i}
                    text={message.text}
                    fromMe={message.fromMe}
                    timeStamp={message.timeStamp}/>
            );
        });
        return (
            <div className={cn('msgr__list-wrapper')}>
                <div className={cn('msgr__list')} style={listStyle} ref={node => this.nodeList = node} id='msgrList'>
                    { messages }
                </div>
            </div>
        );
    }
}
// Text messenger: message
// Props: fromMe, timeStamp, text
class Message extends Component {
    render(props, state) {
        // Was the message sent by the current user. If so, add a css class
        const msgClassModifier = this.props.fromMe ? 'msgr__msg--out' : 'msgr__msg--in';
        const msgBodyClassModifier = this.props.fromMe ? 'msgr__msg-body--out' : 'msgr__msg-body--in';
        const msgInfoClassModifier = this.props.fromMe ? 'msgr__msg-info--out' : 'msgr__msg-info--in';
        const msgAuthor = this.props.fromMe ? 'me' : 'Luke\'s';
        const msgTime = this.props.timeStamp;

        return (
            <div className={cn('msgr__msg', `${msgClassModifier}`)}>
                <div className={cn('msgr__msg-body', `${msgBodyClassModifier}`)}>
                    { this.props.text }
                </div>
                <div className={cn('msgr__msg-info', `${msgInfoClassModifier}`)}>
                    { msgAuthor + ' ' + msgTime }
                </div>
            </div>
        );
    }
}
// Text messenger: input
// Props: onSend()
class ChatInput extends Component {
    constructor(props) {
        super(props);
        this.state = { chatInput: '' };

        this.onSubmit = this.onSubmit.bind(this);
        this.textChangeHandler = this.textChangeHandler.bind(this);
    }
    onSubmit(event) {
        // console.log('<========= onSubmit() in ChatInput');
        // console.log('this.state.chatInput:');
        // console.log('\"' + this.state.chatInput + '\"');
        const trimmedText = this.state.chatInput.trim();
        // console.log('\"' + trimmedText + '\"');

        event.preventDefault();     // Stop the form from refreshing the page on submit

        if (trimmedText !== '') {
            // Call the onSend callback with the chatInput message
            this.props.onSend(trimmedText);
            // Clear the input box
            this.setState({chatInput: ''});
        }

        // console.log('        onSubmit() in ChatInput ======>');
    }
    // Every symbol typing changes the state
    textChangeHandler(event)  {
        // console.log('<========= ChatInput textChangeHandler()');
        // console.log('this.state.chatInput old = ' + this.state.chatInput);
        this.setState({ chatInput: event.target.value });
        // console.log('this.state.chatInput new = ' + this.state.chatInput);
        // console.log('           ChatInput textChangeHandler() =========>');
    }
    render(props, state) {
        return (
            <form className={cn('msgr__input-form')} onSubmit={this.onSubmit}>
                <input type="text"
                       className={cn('msgr__input')}
                       // onChange works only on focus loosing in Preact so use onInput instead
                       onInput={this.textChangeHandler}
                       placeholder="Write a message..."
                       value={this.state.chatInput}
                />
            </form>
        );
    }
}

// Panel providing chat actions
// Props: clientAppInstalled, chatMode, stopChat(), switchMode(),
//        isSoundOn, turnSound(), isMicOn, turnMic().
const ChatPanel = (props) => {
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
                onClick={() => props.turnSound(!props.isSoundOn)}>
            <span className={cn('fa', {'fa-volume-off': props.isSoundOn}, {'fa-volume-up': !props.isSoundOn},
                'icon', 'icon--color', 'icon--sm')}></span>
        </button>;

    const micBtn =
        <button className={cn('chat__btn--small')}
                onClick={() => props.turnMic(!props.isMicOn)}>
            <span className={cn('fa', {'fa-microphone-slash': props.isMicOn}, {'fa-microphone': !props.isMicOn},
                'icon', 'icon--color', 'icon--sm')}></span>
        </button>;

    let leftGroup = null;
    let rightGroup = null;
    switch (props.chatMode) {
        case 'connectingVideo':
        case 'connectingVoice':
        case 'voice':
            if(props.clientAppInstalled) {
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
            } else {
                // If client has no ClientApp installed, video call and text chat are unavailable
                leftGroup =
                    <div className={cn('chat__btns-group')}>
                        {soundBtn}
                    </div>;
                rightGroup =
                    <div className={cn('chat__btns-group')}>
                        {micBtn}
                    </div>;
            }
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
        <div className={cn('chat__panel', {'chat__panel--low': props.chatMode === 'text'})}>
            {leftGroup}
            {stopBtn}
            {rightGroup}
        </div>
    );
}

// Timer of call duration
// Props: none
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

// Star rating
// Props: starsNum, initValue, inputName, clickable
const Rating = (props) => {
    // Total number of stars: drop a fractional part
    const starsNum = Math.floor(props.starsNum);
    // Number of initially selected stars: round to nearest lower 0.5 gradation
    const initValue = ( Math.floor((props.initValue * 10)/5) * 5)/10;
    let starsArray = [];
    // Each star is represented by full star input (hidden), full star label,
    // half star input (hidden) and half star label.
    // And the stars must follow in inverse order.
    for (let i = starsNum; i > 0; i--) {
        // Full star
        const fullId = props.inputName + '_star_' + i + '_0';
        const fullValue = i;
        const fullChecked = initValue === fullValue;
        const fullTitle = (props.clickable) ? (fullValue + ' stars') : (initValue + ' stars');
        const inputFull = <input type='radio' id={fullId} name={props.inputName} value={fullValue}
                   defaultChecked={fullChecked} disabled={!props.clickable}/>;
        const labelFull = <label className={cn('rating__full-star')} htmlFor={fullId} title={fullTitle}></label>;

        // Half star
        const halfId = props.inputName + '_star_' + (i - 1) + '_5';
        const halfValue = i - 0.5;
        const halfChecked = initValue === halfValue;
        const halfTitle = (props.clickable) ? (halfValue + ' stars') : (initValue + ' stars');
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

// List of similar restaurants
// Props: restaurants
const RestaurantsList = (props) => {
    const restaurants = props.restaurants.map( (restaurant, i) => {
        return (
            <Restaurant
                key={i}
                logo={restaurant.logo}
                name={restaurant.name}
                desc={restaurant.desc}
                rating={restaurant.rating}
                ratingMax={restaurant.ratingMax}
                callHandler={restaurant.callHandler}
            />
        );
    });
    return (
        <div className={cn('similar')}>
            <div className={cn('similar__hdr')}>Try similar restaurants in your area</div>
            {restaurants}
        </div>
    );
};
// One restaurant in a list
// Props: key, logo, name, desc, rating, ratingMax, callHandler()
const Restaurant = (props) => {
    return (
        <div className={cn('similar__item')}>
            <img className={cn('similar__logo')} src={props.logo}/>
            <div className={cn('similar__info')}>
                <div className={cn('similar__name')}>
                    {props.name} <span className={cn('fa fa-info-circle')}></span>
                </div>
                <div className={cn('similar__desc')}>
                    {props.desc}
                </div>
                <Rating clickable={false} starsNum={props.ratingMax} initValue={props.rating} starSize={'14px'} inputName=''/>
            </div>
            <div className={cn('similar__call')}>
                <button className={cn('similar__call-btn')} onClick={props.callHandler}>
                    <span className={cn('fa fa-phone', 'icon', 'icon--white', 'icon--md')}></span>
                </button>
            </div>
        </div>
    );
};

// Parameterized render to HTML
module.exports = function createWidget(node, settings) {
    render(<WebchatClient settings={settings}/>, node);
};
