import {h, render, Component} from 'preact';
import cn from 'classnames';

import * as vox from 'api/voxClient';

import styles from './webchatClient.scss';
import videoChatImg from './img/video-chat.png';
import voiceChatImg from './img/voice-chat.png';
import textChatImg from './img/text-chat.png';

class WebchatClient extends Component {
  constructor() {
    super();
    this.state = {
      isCalling: false,
      isChatBtnsOpen: false
    };

    // This binding is necessary to make `this` work in the callback
    this.toggleChatButtons = this.toggleChatButtons.bind(this);

    this.startVideoChat = this.startVideoChat.bind(this);
    this.startVoiceChat = this.startVoiceChat.bind(this);
    this.stopChat = this.stopChat.bind(this);

    this.getHashParams = this.getHashParams.bind(this);
  }

  toggleChatButtons() {
    this.setState(prevState => ({
      isChatBtnsOpen: !prevState.isChatBtnsOpen
    }));
  }

  startVideoChat() {
    vox.createCall('video');
    this.setState({isCalling: true});
  }

  startVoiceChat() {
    vox.createCall('voice');
    this.setState({isCalling: true});
  }

  stopChat() {
    vox.stopCall();
    this.setState({
      isCalling: false,
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
    if (!this.state.isCalling) {
      return (
        <div className={styles['webchat']}>
          <button
            className={cn(styles['webchat__select-btn'])}
            onClick={this.toggleChatButtons}></button>
          <button
            className={ cn(styles['webchat__chat-btn'], styles['webchat__chat-btn--video'],
              {[styles["webchat__chat-btn--showed"]]: this.state.isChatBtnsOpen})}
            onClick={this.startVideoChat}>
            <img className={styles['webchat__btn-icon']} src={videoChatImg}/>
          </button>
          <button
            className={ cn(styles['webchat__chat-btn'], styles['webchat__chat-btn--voice'],
              {[styles["webchat__chat-btn--showed"]]: this.state.isChatBtnsOpen})}
            onClick={this.startVoiceChat}>
            <img className={styles['webchat__btn-icon']} src={voiceChatImg}/>
          </button>
          <button
            className={ cn(styles['webchat__chat-btn'], styles['webchat__chat-btn--text'],
              {[styles["webchat__chat-btn--showed"]]: this.state.isChatBtnsOpen})}
            onClick={() => console.log('text chat')}>
            <img className={styles['webchat__btn-icon']} src={textChatImg}/>
          </button>
        </div>
      );
    }
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
                onClick={this.stopChat}>
                <img className={styles['webchat__btn-icon']} src={voiceChatImg}/>
              </button>
              <div className={styles['chat__btns-group']}>
                <button className={cn(styles['chat__btn'], styles['chat__btn--small'])}>
                  <img className={styles['webchat__btn-icon']} src={textChatImg} />
                </button>
                <button className={cn(styles['chat__btn'], styles['chat__btn--small'])}>
                  <img className={styles['webchat__btn-icon']} src={textChatImg} />
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
