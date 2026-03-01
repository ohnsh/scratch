import { useRef, useEffect } from 'react'
import { Terminal } from '@xterm/xterm'
import * as Demo from '@/vendor/xterm-demo.js'

export default function Term() {
    const { current: term } = useRef(new Terminal(Demo.demoOptions))
    const container = useRef<HTMLDivElement>(null)

    useEffect(() => {
        term.open(container.current!)
        Demo.setTerm(term)
        Demo.setupTerm(term)
        Demo.runFakeTerminal(term)
        return () => term.dispose()
    }, [])

    return <div ref={container}></div>
}