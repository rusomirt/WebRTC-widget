import { h, render, Component } from 'preact';
import cn from 'classnames';

import styles from './index.scss';
import videoChatImg from './img/video-chat.png';
import voiceChatImg from './img/voice-chat.png';
import textChatImg from './img/text-chat.png';

class Webchat extends Component {
  constructor() {
    super();
    this.state.isChatBtnsOpen = false;

    // This binding is necessary to make `this` work in the callback
    this.toggleChatButtons = this.toggleChatButtons.bind(this);
  }

  toggleChatButtons() {
    this.setState(prevState => ({
      isChatBtnsOpen: !prevState.isChatBtnsOpen
    }));
  }

  render(props, state) {

    return(
      <div className={styles['webchat']}>
        <button
          className={cn(styles['webchat__start-btn'])}
          onClick={this.toggleChatButtons}
        ></button>
        <button
          className={ cn(styles['webchat__chat-btn'], styles['webchat__chat-btn--video'],
            {[styles["webchat__chat-btn--showed"]]: this.state.isChatBtnsOpen} )}
        >
          <img className={styles['webchat__start-img']} src={videoChatImg} />
        </button>
        <button
          className={ cn(styles['webchat__chat-btn'], styles['webchat__chat-btn--voice'],
            {[styles["webchat__chat-btn--showed"]]: this.state.isChatBtnsOpen} )}
        >
          <img className={styles['webchat__start-img']} src={voiceChatImg} />
        </button>
        <button
          className={ cn(styles['webchat__chat-btn'], styles['webchat__chat-btn--text'],
            {[styles["webchat__chat-btn--showed"]]: this.state.isChatBtnsOpen} )}
        >
          <img className={styles['webchat__start-img']} src={textChatImg} />
        </button>
      </div>
    );
  }
}

// render an instance of Clock into <body>:
render(<Webchat />, document.body);
