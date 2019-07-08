import React, { useState, useRef, useEffect } from 'react'
import anime from 'animejs'
import Peer from 'peerjs'
import merge from 'deepmerge'
import { app, vid } from './styles/App.scss'

function App() {
  let [keys, setKeys] = useState({})
  let [xy, setXy] = useState([0, 0])
  let [toConn, setToConn] = useState('')
  let [conns, setConns] = useState({})
  let [db, setDb] = useState({})
  let vidRef = useRef()
  let peerRef = useRef()

  useEffect(
    () => {
      navigator.mediaDevices.getUserMedia({
        audio: true
      })
    },
    []
  )

  let updateDb = diff => {
    console.log(`db ← ${JSON.stringify(diff)}`)
    setDb(db => merge(db, diff))
  }

  let updateConns = conn => {
    console.log(`conns ← ${conn.peer}`)

    setConns(conns => {
      if (conns[conn.peer]) return conns

      let onData = diff => {
        console.log(`⇜ ${JSON.stringify(diff)} // ${conn.peer}`)
        updateDb(diff)
      }

      let c = {
        ...conns,

        [conn.peer]: {
          conn,
          onData
        }
      }

      conn.on('data', onData)

      return c
    })
  }

  let onOpen = conn => {
    console.log(`✰ ${conn.peer}; ${Date.now()}`)
    updateConns(conn)
  }

  useEffect(
    () => {
      let peer = new Peer(genRandId())

      peer.on('connection', conn => {
        conn.on('open', () => onOpen(conn))
      })

      console.log(`You → """ ${peer.id} """`)
      alert(`You → """ ${peer.id} """`)

      peerRef.current = peer

      updateDb({ [peer.id]: 'hi~!' })
    },
    []
  )

  let broad = diff => {
    updateDb(diff)

    Object.values(conns).forEach(({ conn }) => {
      console.log(`${JSON.stringify(diff)} ⇝ ${conn.peer}`)
      conn.send(diff)
    })
  }

  useEffect(
    () => {
      let ids = Object.keys(conns)

      console.log(`conns: ${JSON.stringify(ids)}`)

      // ids.forEach(id => {
      //   let {
      //     conn,
      //     onData
      //   } = conns[id]

      //   conn.on('data', onData)
      // })

      broad(db)
    },
    [conns]
  )

  useEffect(
    () => {
      console.log(`db: ${JSON.stringify(db, null, 2)}`)
    },
    [db]
  )

  let connect = toConn => {
    let conn = peerRef.current.connect(toConn)
    conn.on('open', () => onOpen(conn))
  }

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
          e.preventDefault()
          connect(toConn)
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

let genRandId = () =>
  Date.now()
    .toString()
    .split('')
    .map(n => String.fromCharCode(97 + Number(n)))
    .join('')
    .slice(-5)
    .toUpperCase()

export default App
