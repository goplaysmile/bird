import React, { useState, useRef, createRef, useEffect } from 'react'
import anime from 'animejs'
import Boulder, { __ } from './Boulder'
import { app, vid } from './styles/App.scss'

function App() {
  let [keys, setKeys] = useState({})
  let [db, setDb] = useState({})
  let [toConn, setToConn] = useState('')
  /** @type {React.MutableRefObject<Object<string, React.RefObject>>} */
  let vidsRef = useRef({})
  /** @type {React.MutableRefObject<Boulder>} */
  let bldrRef = useRef()

  useEffect(
    () => {
      let bldr = new Boulder()

      bldr.on(
        db => {
          for (let uid in db.xy) {
            vidsRef.current[uid] = vidsRef.current[uid] || createRef()
          }

          setDb(db)
        }
      )

      bldr.add({ msg: { [bldr.uid]: 'hi~!' } })

      bldrRef.current = bldr
    },
    []
  )

  useEffect(
    () => {
      console.log('anime\'ing...')

      for (let uid in db.xy) {
        anime({
          targets: vidsRef.current[uid],
          translateX: db.xy[uid].x * 32,
          translateY: db.xy[uid].y * 32,
          easing: 'linear',
          duration: 500,

          // changeComplete() {
          //   setKeys({})
          // }

        })
      }
    },
    [db.xy]
  )

  useEffect(
    () => {
      let { current: bldr } = bldrRef

      // console.log(`pressing ${JSON.stringify(keys)}`)

      let {
        ArrowUp,
        ArrowRight,
        ArrowDown,
        ArrowLeft
      } = keys

      let { x, y } = (db.xy || {})[bldr.uid] || { x: 0, y: 0 }

      if (ArrowUp) y -= 1
      if (ArrowRight) x += 1
      if (ArrowDown) y += 1
      if (ArrowLeft) x -= 1

      bldr.add({ xy: { [bldr.uid]: { x, y } } })
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

          if (bldr.isConnected(toConn)) {
            bldr.disconnect(toConn)
          } else {
            bldr.connect(toConn)
          }

          setToConn('')
        }}

      >
        <input
          value={toConn}
          onChange={({ target: { value } }) => setToConn(value)}
        />
      </form>

      {
        Object.keys(db.xy || {}).map(uid => {
          <video
            ref={vidsRef.current[uid]}
            id={vid}
            autoPlay
          />
        })
      }

    </div>
  )
}

let pseudoUid = () =>
  Math.random()
    .toString(36)
    .substr(2, 5)

export default App
