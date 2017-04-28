import {h, render, Component} from 'preact';
import cn from 'classnames';
import './font-awesome/css/font-awesome.css';
import 'font-awesome-webpack';
import * as vox from 'api/voxClient';
import styles from './webchatClient.scss';

class WebchatClient extends Component {
    constructor() {
        super();
        this.state = {
            // Allowed values: 'idle', 'connectingVideo', 'video', 'connectingVoice', 'voice', 'text'.
            chatMode: 'idle',
            isChatBtnsOpen: false,
            isSoundOn: true,
            isMicOn: true,
        };

        // This binding is necessary to make `this` work in the callback
        this.getHashParams = this.getHashParams.bind(this);

        this.toggleChatButtons = this.toggleChatButtons.bind(this);

        this.startChat = this.startChat.bind(this);
        this.stopChat = this.stopChat.bind(this);
        this.onCallDisconnect = this.onCallDisconnect.bind(this);

        this.turnSound = this.turnSound.bind(this);
        this.turnMic = this.turnMic.bind(this);
    }

    toggleChatButtons() {
        this.setState(prevState => ({
            isChatBtnsOpen: !prevState.isChatBtnsOpen
        }));
    }

    // mode values: 'video', 'voice', 'text'
    startChat(mode) {
        this.setState({chatMode: mode});
        vox.createChat(mode);

        if (mode === 'video' || mode === 'voice') {
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
    }

    onCallDisconnect() {
        vox.currentCall = null; // clear call instance

        this.setState({
            isCalling: false,
            isChatBtnsOpen: false
        });
    }

    stopChat() {
        vox.stopChat();
        this.setState({
            chatMode: 'idle',
            isChatBtnsOpen: false
        });
    }

    turnSound() {
        vox.turnSound(!this.state.isSoundOn);
        this.setState({isSoundOn: !this.state.isSoundOn});
    }

    turnMic() {
        vox.turnMic(!this.state.isMicOn);
        this.setState({isMicOn: !this.state.isMicOn});
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
            d = function (s) {
                return decodeURIComponent(s.replace(a, " "));
            },
            q = window.location.hash.substring(1);

        while (e = r.exec(q))
            hashParams[d(e[1])] = d(e[2]);

        return hashParams;
    }

    render(props, state) {
        switch (this.state.chatMode) {
            case 'idle':
                return (
                    <SelectMode
                        toggleChatButtons={this.toggleChatButtons}
                        startChat={this.startChat}
                        isChatBtnsOpen={this.state.isChatBtnsOpen}
                    />
                );
            case 'connectingVideo':
            case 'connectingVoice':
            case 'video':

                const soundIconClass = cn('fa', {'fa-volume-off': this.state.isSoundOn}, {'fa-volume-up': !this.state.isSoundOn},
                    styles['icon'], styles['icon--green'], styles['icon--sm']);

                const micIconClass = cn('fa', {'fa-microphone-slash': this.state.isMicOn}, {'fa-microphone': !this.state.isMicOn},
                    styles['icon'], styles['icon--green'], styles['icon--sm']);

                return (
                    <div className={styles['modal']}>
                        <div className={styles['modal__inner']}>
                            <div className={styles['chat']}>

                                <div id='video-out' className={styles['chat__video-out']}></div>

                                <div id='video-in' className={styles['chat__video-in']}></div>

                                <div className={styles['chat__panel']}>
                                    <div className={styles['chat__btns-group']}>
                                        <button className={cn(styles['chat__btn--small'])}>
                                            <span className={cn("fa fa-video-camera", styles['icon'], styles['icon--green'], styles['icon--xs'])}></span>
                                        </button>
                                        <button className={cn(styles['chat__btn--small'])}>
                                            <span className={cn("fa fa-comments", styles['icon'], styles['icon--green'], styles['icon--sm'])}></span>
                                        </button>
                                    </div>
                                    <button
                                        id="callButton"
                                        className={cn(styles['chat__btn--stop'])}
                                        onClick={this.stopChat}>
                                        <span className={cn("fa fa-phone", styles['icon'], styles['icon--white'], styles['icon--lg'])}></span>
                                    </button>
                                    <div className={styles['chat__btns-group']}>
                                        <button
                                            className={cn(styles['chat__btn--small'])}
                                            onClick={this.turnSound}>
                                            <span className={soundIconClass}></span>
                                        </button>
                                        <button
                                            className={cn(styles['chat__btn--small'])}
                                            onClick={this.turnMic}>
                                            <span className={micIconClass}></span>
                                        </button>
                                    </div>
                                </div>

                            </div>
                            <div className={styles['modal__copyright']}>powered by overtok</div>
                        </div>
                    </div>
                );

            case 'voice':
            case 'text':
        }
        //
        // // Chatting mode
        //
        // const soundIconClass = this.state.isSoundOn ?
        //     cn("fa fa-volume-off", styles['icon'], styles['icon--green'], styles['icon--sm']) :
        //     cn("fa fa-volume-up", styles['icon'], styles['icon--green'], styles['icon--sm']);
        //
        // const micIconClass = this.state.isMicOn ?
        //     cn("fa fa-microphone-slash", styles['icon'], styles['icon--green'], styles['icon--sm']) :
        //     cn("fa fa-microphone", styles['icon'], styles['icon--green'], styles['icon--sm']);
        //
        // return (
        //     <div className={styles['modal']}>
        //         <div className={styles['modal__inner']}>
        //             <div className={styles['chat']}>
        //
        //                 {/*<div className={styles['chat__info']}>*/}
        //                 {/*<div className={styles['chat__status']}>*/}
        //                 {/*<div className={styles['chat__status-txt']}>Connecting</div>*/}
        //                 {/*</div>*/}
        //                 {/*<div className={styles['chat__tips-hdr']}>Two quick tips</div>*/}
        //                 {/*<div className={styles['chat__tips-body']}>*/}
        //                 {/*Luke's rated 4 stars with 159 reviews<br/><br/><br/><br/>*/}
        //                 {/*Don't forget!<br/>15% off for new customers*/}
        //                 {/*</div>*/}
        //                 {/*</div>*/}
        //
        //                 <div id='video-out' className={styles['chat__video-out']}></div>
        //
        //                 <div id='video-in' className={styles['chat__video-in']}></div>
        //
        //                 <div className={styles['chat__panel']}>
        //                     <div className={styles['chat__btns-group']}>
        //                         <button className={cn(styles['chat__btn--small'])}>
        //                             <span className={cn("fa fa-video-camera", styles['icon'], styles['icon--green'], styles['icon--xs'])}></span>
        //                         </button>
        //                         <button className={cn(styles['chat__btn--small'])}>
        //                             <span className={cn("fa fa-comments", styles['icon'], styles['icon--green'], styles['icon--sm'])}></span>
        //                         </button>
        //                     </div>
        //                     <button
        //                         id="callButton"
        //                         className={cn(styles['chat__btn--stop'])}
        //                         onClick={this.stopChat}>
        //                         <span className={cn("fa fa-phone", styles['icon'], styles['icon--white'], styles['icon--lg'])}></span>
        //                     </button>
        //                     <div className={styles['chat__btns-group']}>
        //                         <button
        //                             className={cn(styles['chat__btn--small'])}
        //                             onClick={this.turnSound}>
        //                             <span className={soundIconClass}></span>
        //                         </button>
        //                         <button
        //                             className={cn(styles['chat__btn--small'])}
        //                             onClick={this.turnMic}>
        //                             <span className={micIconClass}></span>
        //                         </button>
        //                     </div>
        //                 </div>
        //
        //             </div>
        //             <div className={styles['modal__copyright']}>powered by overtok</div>
        //         </div>
        //     </div>
        // );
    }
}

const SelectMode = (props) => (
    <div className={styles['webchat']}>
        <button
            className={cn(styles['webchat__launch-btn'])}
            onClick={props.toggleChatButtons}>
            <span className={cn("fa fa-phone", styles['icon'], styles['icon--white'], styles['icon--md'])}></span>
        </button>
        <button
            className={ cn(styles['webchat__chat-btn'], styles['webchat__chat-btn--video'],
                {[styles["webchat__chat-btn--showed"]]: props.isChatBtnsOpen})}
            onClick={() => props.startChat('video')}>
            <span
                className={cn("fa fa-video-camera", styles['icon'], styles['icon--white'], styles['icon--sm'])}></span>
        </button>
        <button
            className={ cn(styles['webchat__chat-btn'], styles['webchat__chat-btn--voice'],
                {[styles["webchat__chat-btn--showed"]]: props.isChatBtnsOpen})}
            onClick={() => props.startChat('voice')}>
            <span className={cn("fa fa-phone", styles['icon'], styles['icon--white'], styles['icon--sm'])}></span>
        </button>
        <button
            className={ cn(styles['webchat__chat-btn'], styles['webchat__chat-btn--text'],
                {[styles["webchat__chat-btn--showed"]]: props.isChatBtnsOpen})}
            onClick={() => props.startChat('text')}>
            <span className={cn("fa fa-comments", styles['icon'], styles['icon--white'], styles['icon--sm'])}></span>
        </button>
    </div>
);

module.exports = function createWidget(node, settings) {
    render(<WebchatClient settings={settings}/>, node);
};
