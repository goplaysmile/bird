import React, { useState, useRef, useEffect } from 'react'
import anime from 'animejs'
import Boulder from './Boulder'
import { app, vid } from './styles/App.scss'

function App() {
  let [keys, setKeys] = useState({})
  let [xy, setXy] = useState([0, 0])
  let [toConn, setToConn] = useState('')
  let vidRef = useRef()
  /** @type {React.MutableRefObject<Boulder>} */
  let bldrRef = useRef()

  useEffect(
    () => {
      let bldr = new Boulder()
      bldr.Broad({ [bldr.UID]: 'hi~!' })
      bldrRef.current = bldr
    },
    []
  )

  useEffect(
    () => {
      console.log('anime\'ing...')
      let [x, y] = xy

      anime({
        targets: vidRef.current,
        translateX: x * 32,
        translateY: y * 32,
        easing: 'linear',
        duration: 500,

        // changeComplete() {
        //   setKeys({})
        // }

      })

    },
    [xy]
  )

  useEffect(
    () => {
      console.log(`pressing ${JSON.stringify(keys)}`)

      let {
        ArrowUp,
        ArrowRight,
        ArrowDown,
        ArrowLeft
      } = keys

      if (ArrowUp) setXy(([x, y]) => [x, y - 1])
      if (ArrowRight) setXy(([x, y]) => [x + 1, y])
      if (ArrowDown) setXy(([x, y]) => [x, y + 1])
      if (ArrowLeft) setXy(([x, y]) => [x - 1, y])
    },
    [keys]
  )

  return (
    <div
      id={app}
      tabIndex="0"

      onKeyDown={({ key }) => {
        if (!keys[key]) setKeys(keys => ({ ...keys, [key]: true }))
      }}

      onKeyUp={({ key }) => {
        setKeys(keys => {
          delete keys[key]
          return { ...keys }
        })
      }}
    >
      <form
        onSubmit={e => {
          let { current: bldr } = bldrRef

          e.preventDefault()
          bldr.Connect(toConn)
          setToConn('')
        }}

      >
        <input
          value={toConn}
          onChange={({ target: { value } }) => setToConn(value)}
        />
      </form>

      <video
        ref={vidRef}
        id={vid}
        autoPlay
      />

    </div>
  )
}

let pseudoUid = () =>
  Math.random()
    .toString(36)
    .substr(2, 5)

export default App
