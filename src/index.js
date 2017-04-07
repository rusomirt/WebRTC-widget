import {h, render, Component} from 'preact';
import cn from 'classnames';

import * as vox from './voximplant';

import styles from './index.scss';
import videoChatImg from './img/video-chat.png';
import voiceChatImg from './img/voice-chat.png';
import textChatImg from './img/text-chat.png';

const initBtns = () => (
  <div className={styles['webchat']}>
    <button
      className={cn(styles['webchat__select-btn'])}
      onClick={this.toggleChatButtons}
    ></button>
    <button
      className={ cn(styles['webchat__chat-btn'], styles['webchat__chat-btn--video'],
        {[styles["webchat__chat-btn--showed"]]: this.state.isChatBtnsOpen})}
      onClick={vox.createCall}
    >
      <img className={styles['webchat__btn-icon']} src={videoChatImg}/>
    </button>
    <button
      className={ cn(styles['webchat__chat-btn'], styles['webchat__chat-btn--voice'],
        {[styles["webchat__chat-btn--showed"]]: this.state.isChatBtnsOpen})}
      onClick={() => console.log('voice chosen!')}
    >
      <img className={styles['webchat__btn-icon']} src={voiceChatImg}/>
    </button>
    <button
      className={ cn(styles['webchat__chat-btn'], styles['webchat__chat-btn--text'],
        {[styles["webchat__chat-btn--showed"]]: this.state.isChatBtnsOpen})}
      onClick={console.log('text chosen!')}
    >
      <img className={styles['webchat__btn-icon']} src={textChatImg}/>
    </button>
  </div>
);

class callWindow extends Component {
  render(props, state) {
    return (
      <div className={styles['modal']}>
        <div className={styles['modal__inner']}></div>
      </div>
    );
  }
}

class Webchat extends Component {
  constructor() {
    super();
    this.state = {
      isCalling: true,
      isChatBtnsOpen: false
    };

    // This binding is necessary to make `this` work in the callback
    this.toggleChatButtons = this.toggleChatButtons.bind(this);
    this.startVideoChat = this.startVideoChat.bind(this);
    this.exitChat = this.exitChat.bind(this);
  }

  toggleChatButtons() {
    this.setState(prevState => ({
      isChatBtnsOpen: !prevState.isChatBtnsOpen
    }));
  }

  startVideoChat() {
    console.log('video chat');
    this.setState({isCalling: true});
  }

  exitChat() {
    this.setState({isCalling: false});
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
            onClick={() => console.log('voice chat')}>
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

            <div className={styles['chat__info']}>
              <div className={styles['chat__status']}>
                <div className={styles['chat__status-txt']}>Connecting</div>
              </div>
              <div className={styles['chat__tips-hdr']}>Two quick tips</div>
              <div className={styles['chat__tips-body']}>
                Luke's rated 4 stars with 159 reviews<br/><br/><br/><br/>
                Don't forget!<br/>15% off for new customers
              </div>
            </div>

            {/*<div className={styles['chat__video-out']}></div>*/}

            {/*<div className={styles['chat__video-in']}></div>*/}

            <div className={styles['chat__panel']}>
              <div className={styles['chat__btns-group']}>
                <button className={cn(styles['chat__btn'], styles['chat__btn--small'])}>
                  <img className={styles['webchat__btn-icon']} src={textChatImg} />
                </button>
              </div>
              <button
                className={cn(styles['chat__btn'], styles['chat__btn--big'])}
                onClick={this.exitChat}>
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

render(<Webchat />, document.body);
