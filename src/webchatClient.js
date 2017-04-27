import {h, render, Component} from 'preact';
import cn from 'classnames';
// import './font-awesome/css/font-awesome.min.css';
// import fa from 'font-awesome';

import * as vox from 'api/voxClient';

import styles from './webchatClient.scss';
import videoChatImg from './img/video-chat.png';
import voiceChatImg from './img/voice-chat.png';
import textChatImg from './img/text-chat.png';

class WebchatClient extends Component {
  constructor() {
    super();
    this.state = {
      isChatBtnsOpen: false,
      isCalling: false,
      isChatting: false,
      isSoundOn: true,
      isMicOn: true,
    };

    // This binding is necessary to make `this` work in the callback
    this.getHashParams = this.getHashParams.bind(this);

    this.toggleChatButtons = this.toggleChatButtons.bind(this);

    this.startCall = this.startCall.bind(this);
    this.turnSound = this.turnSound.bind(this);
    this.turnMic = this.turnMic.bind(this);
    this.stopCall = this.stopCall.bind(this);
    this.onCallDisconnect = this.onCallDisconnect.bind(this);

    this.startChat = this.startChat.bind(this);
    this.stopChat = this.stopChat.bind(this);
  }

  toggleChatButtons() {
    this.setState(prevState => ({
      isChatBtnsOpen: !prevState.isChatBtnsOpen
    }));
  }

  // callMode values: 'video', 'voice', 'text'
  startCall(callMode) {
    vox.createCall(callMode);
    this.setState({isCalling: true, isChatting: false});

    // console.log('==================== currentCall before polling');
    // console.log(vox.currentCall);

    // Poll currentCall every 500ms until in becomes not null,
    // then assign onCallDisconnect event handler.
    let pollTimer = setInterval(() => {
      // console.log('==================== currentCall while polling');
      // console.log(vox.currentCall);
      if (vox.currentCall !== null) {
        // 'this' works in arrow function only
        vox.currentCall.addEventListener(VoxImplant.CallEvents.Disconnected, this.onCallDisconnect);
        clearInterval(pollTimer);
      }
    }, 500);
  }

  turnSound() {
    vox.turnSound(!this.state.isSoundOn);
    this.setState({isSoundOn: !this.state.isSoundOn});
  }
  
  turnMic() {
    vox.turnMic(!this.state.isMicOn);
    this.setState({isMicOn: !this.state.isMicOn});
  }

  stopCall() {
    vox.stopCall();
    this.setState({
      isCalling: false,
      isChatBtnsOpen: false
    });
  }

  onCallDisconnect() {
    vox.currentCall = null; // clear call instance
    
    this.setState({
      isCalling: false,
      isChatBtnsOpen: false
    });
  }

  startChat() {
    vox.createChat();
    this.setState({isChatting: true, isCalling: false});
  }

  stopChat() {
      vox.stopChat();
      this.setState({
          isChatting: false,
          isChatBtnsOpen: false
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
}

  componentWillUnmount() {
    vox.uninit();
  }

  getHashParams() {
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

  render(props, state) {
    if (!this.state.isCalling && !this.state.isChatting) {
      // Idle mode
      return (
        <div className={styles['webchat']}>
          <button
            className={cn(styles['webchat__select-btn'])}
            onClick={this.toggleChatButtons}></button>
          <button
            className={ cn(styles['webchat__chat-btn'], styles['webchat__chat-btn--video'],
              {[styles["webchat__chat-btn--showed"]]: this.state.isChatBtnsOpen})}
            onClick={() => this.startCall('video')}>
            <img className={styles['webchat__btn-icon']} src={videoChatImg}/>
          </button>
          <button
            className={ cn(styles['webchat__chat-btn'], styles['webchat__chat-btn--voice'],
              {[styles["webchat__chat-btn--showed"]]: this.state.isChatBtnsOpen})}
            onClick={() => this.startCall('voice')}>
            <img className={styles['webchat__btn-icon']} src={voiceChatImg}/>
          </button>
          <button
            className={ cn(styles['webchat__chat-btn'], styles['webchat__chat-btn--text'],
              {[styles["webchat__chat-btn--showed"]]: this.state.isChatBtnsOpen})}
            onClick={() => this.startChat()}>
            <img className={styles['webchat__btn-icon']} src={textChatImg}/>
          </button>
        </div>
      );
    }

    // Chat mode
    let stopFunc = this.state.isCalling ? this.stopCall : this.stopChat;

    return (
      <div className={styles['modal']}>
        <div className={styles['modal__inner']}>
          <div className={styles['chat']}>

            {/*<div className={styles['chat__info']}>*/}
              {/*<div className={styles['chat__status']}>*/}
                {/*<div className={styles['chat__status-txt']}>Connecting</div>*/}
              {/*</div>*/}
              {/*<div className={styles['chat__tips-hdr']}>Two quick tips</div>*/}
              {/*<div className={styles['chat__tips-body']}>*/}
                {/*Luke's rated 4 stars with 159 reviews<br/><br/><br/><br/>*/}
                {/*Don't forget!<br/>15% off for new customers*/}
              {/*</div>*/}
            {/*</div>*/}

            <div id='video-out' className={styles['chat__video-out']}></div>

            <div id='video-in' className={styles['chat__video-in']}></div>

            <div className={styles['chat__panel']}>
              <div className={styles['chat__btns-group']}>
                <button className={cn(styles['chat__btn'], styles['chat__btn--small'])}>
                  <img className={styles['webchat__btn-icon']} src={textChatImg} />
                </button>
              </div>
              <button
                id="callButton"
                className={cn(styles['chat__btn'], styles['chat__btn--big'])}
                onClick={stopFunc}>
                <img className={styles['webchat__btn-icon']} src={voiceChatImg}/>
              </button>
              <div className={styles['chat__btns-group']}>
                <button
                    className={cn(styles['chat__btn'], styles['chat__btn--small'])}
                    onClick={this.turnSound}>
                  sound
                </button>
                <button
                    className={cn(styles['chat__btn'], styles['chat__btn--small'])}
                    onClick={this.turnMic}>
                  mic
                </button>
              </div>
            </div>

          </div>
          <div className={styles['modal__copyright']}>powered by overtok</div>
        </div>
      </div>
    );
  }
}

module.exports = function createWidget(node, settings) {
  render(<WebchatClient settings={settings} />, node);
};
