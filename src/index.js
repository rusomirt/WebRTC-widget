import { h, render, Component } from 'preact';

class Clock extends Component {
  constructor() {
    super();
    // Set initial time:
    this.state.time = Date.now();
  }
  componentDidMount() {
    this.timer1 = setInterval(() => {
      this.setState({time: Date.now()});
    }, 1000);
  }
  componentWillUnmount() {
    clearInterval(this.timer1);
  }
  render(props, state) {
    let time = new Date(state.time).toLocaleTimeString();
    return <span>{ time }</span>;
  }
}

render(<Clock/>, document.body);
