import React, { useState, useRef, createRef, useEffect } from 'react'
import anime from 'animejs'
import Chestnut from './Chestnut'
import { app, vid } from './styles/App.scss'

let { pow, sqrt } = Math

function App() {
  let [keys, setKeys] = useState({})
  let [xy, setXy] = useState({})
  let [toConn, setToConn] = useState('')
  /** @type {React.MutableRefObject<Object<string, React.RefObject>>} */
  let vidsRef = useRef({})
  // /** @type {React.MutableRefObject<Boulder>} */
  // let bldrRef = useRef()
  /** @type {React.MutableRefObject<Chestnut>} */
  let chestRef = useRef()

  useEffect(
    () => {
      let chest = new Chestnut()
      chest.OurStream.then(
        (stream) => {
          console.log(`Our stream arrived!`)
        }
      )
      chest.TheirStream.then(
        (stream) => {
          console.log(`Their stream arrived!`)
        }
      )
      chestRef.current = chest

      // let bldr = new Boulder()

      // bldr.ok(
      //   (xy, us, them) => {
      //     let { x: ux, y: uy } = xy[us]
      //     let { x: tx, y: ty } = xy[them]
      //     let dist = sqrt(pow(tx - ux, 2) + pow(ty - uy, 2))
      //     return dist <= 11
      //   },
      //   { xy: __ }
      // )

      // bldr.on(
      //   ({ xy }) => {
      //     for (let uid in xy) {
      //       vidsRef.current[uid] = vidsRef.current[uid] || createRef()
      //     }

      //     setXy(xy || {})

      //     for (let uid in vidsRef.current) {
      //       if (xy[uid]) continue
      //       delete vidsRef.current[uid]
      //       setTimeout(() => setXy(xy => ({ ...xy })), 1)
      //     }
      //   }
      // )

      // bldr.add({ msg: { [bldr.uid]: 'hi~!' } })

      // bldrRef.current = bldr
    },
    []
  )

  useEffect(
    () => {
      console.log('anime\'ing...')

      for (let uid in xy) {
        anime({
          targets: vidsRef.current[uid].current,
          translateX: xy[uid].x * 32,
          translateY: xy[uid].y * 32,
          easing: 'linear',
          duration: 500,

          // changeComplete() {
          //   setKeys({})
          // }

        })
      }
    },
    [xy]
  )

  useEffect(
    () => {
      // let { current: bldr } = bldrRef

      // console.log(`pressing ${JSON.stringify(keys)}`)

      // if (!Object.keys(keys).length && xy[bldr.uid]) return

      // let {
      //   ArrowUp,
      //   ArrowRight,
      //   ArrowDown,
      //   ArrowLeft
      // } = keys

      // let { x, y } = xy[bldr.uid] || { x: 0, y: 0 }

      // if (ArrowUp) y -= 1
      // if (ArrowRight) x += 1
      // if (ArrowDown) y += 1
      // if (ArrowLeft) x -= 1

      // bldr.add({ xy: { [bldr.uid]: { x, y } } })
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
          e.preventDefault()

          let { current: chest } = chestRef

          chest.Call(toConn)

          setToConn('')

          return

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
        Object.keys(xy).map(uid =>
          <video
            key={uid}
            ref={vidsRef.current[uid]}
            id={vid}
            autoPlay
          />
        )
      }

    </div>
  )
}

export default App
