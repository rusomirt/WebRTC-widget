import {h, render, Component} from 'preact';
import uuid from 'uuid/v4';
import * as vox from 'api/voxOpEmul';

class WebchatOpEmul extends Component {
    constructor() {
        super();
        // This binding is necessary to make `this` work in the callback
        this.getHashParams = this.getHashParams.bind(this);
        this.stopChat = this.stopChat.bind(this);
        this.switchFromTextRequest = this.switchFromTextRequest.bind(this);
    }

    componentDidMount() {
        const hashParams = this.getHashParams();
        const voxParams = {
            account_name: hashParams.account_name ?
                hashParams.account_name : this.props.settings.account_name,
            application_name: hashParams.application_name ?
                hashParams.application_name : this.props.settings.application_name,
            op_username: hashParams.op_username ?
                hashParams.op_username : this.props.settings.op_username,
            op_password: hashParams.op_password ?
                hashParams.op_password : this.props.settings.op_password
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

    switchFromTextRequest(demandedMode) {
        console.log('SWITCHING FROM INITIAL TEXT MODE. SEND REQUEST');

        const requestId = uuid();
        console.log('requestId = ' + requestId);
        const msg = {"op": "call-request",
            "id": requestId,
            "type": demandedMode};
        console.log('Request call message:');
        console.log(JSON.stringify(msg));
        vox.sendMessage(JSON.stringify(msg));
    }
    stopChat() {
        vox.stopCall();
    }

    render(props, state) {
        return (
            <div>
                <button onClick={this.stopChat}>CANCEL</button>
                <button onClick={() => this.switchFromTextRequest('video')}>Switch from initial text to video</button>
                <button onClick={() => this.switchFromTextRequest('voice')}>Switch from initial text to voice</button>
            </div>
        )
    }
}

module.exports = function createOpEmul(node, settings) {
    render(<WebchatOpEmul settings={settings}/>, node);
};
