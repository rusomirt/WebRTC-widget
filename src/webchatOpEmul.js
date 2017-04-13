import {h, render, Component} from 'preact';
import * as vox from 'api/voxOpEmul';

class WebchatOpEmul extends Component {
  constructor() {
    super();
    // This binding is necessary to make `this` work in the callback
    this.getHashParams = this.getHashParams.bind(this);
  }
  componentDidMount() {
    const hashParams = this.getHashParams();
    console.log(hashParams);
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
      d = function (s) { return decodeURIComponent(s.replace(a, " ")); },
      q = window.location.hash.substring(1);

    while (e = r.exec(q))
      hashParams[d(e[1])] = d(e[2]);

    return hashParams;
  }
}

module.exports = function createOpEmul(node, settings) {
  render(<WebchatOpEmul settings={settings} />, node);
};
