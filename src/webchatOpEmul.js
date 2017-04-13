import {h, render, Component} from 'preact';
import * as vox from 'api/voxOpEmul';

class WebchatOpEmul extends Component {
  componentDidMount() {
    vox.init(this.props.settings);
  }
  componentWillUnmount() {
    vox.uninit();
  }
}

module.exports = function createOpEmul(node, settings) {
  render(<WebchatOpEmul settings={settings} />, node);
};
