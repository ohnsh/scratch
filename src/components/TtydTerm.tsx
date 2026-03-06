import { Component } from 'react'
import { Xterm, type XtermOptions as Props } from '@/vendor/ttyd/terminal'

import '@xterm/xterm/css/xterm.css'

export default class TtydTerm extends Component<Props> {
  private container: HTMLDivElement | null = null
  private xterm: Xterm

  constructor(props: Props) {
    super(props)
    this.xterm = new Xterm(props, () => {} /*this.showModal*/)
  }

  async componentDidMount() {
    await this.xterm.refreshToken()
    this.xterm.open(this.container!)
    this.xterm.connect()
  }

  componentWillUnmount() {
    this.xterm.dispose()
  }

  render() {
    return (
      <div
        ref={(el) => {
          this.container = el
        }}
      ></div>
    )
  }
}
