import { createServer } from 'http'
import { Server, Socket } from 'socket.io'

const httpServer = createServer()
const io = new Server(httpServer, {
  path: '/socket.io',
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
  pingInterval: 25000,
})

// 类型定义
interface Position {
  row: number
  col: number
}

interface Player {
  id: string
  color: 'black' | 'white'
  ready: boolean
}

interface GameRoom {
  id: string
  players: Map<string, Player>
  board: (string | null)[][]
  currentTurn: 'black' | 'white'
  moves: Position[]
  history: (string | null)[][][]
  status: 'waiting' | 'playing' | 'finished'
  winner: 'black' | 'white' | 'draw' | null
  blackFirst: boolean // 黑棋先手，一局一换
  undoRequest: string | null // 悔棋请求者ID
  restartRequest: string | null // 重开请求者ID
  createdAt: Date
}

// 房间存储
const rooms = new Map<string, GameRoom>()

// 生成房间ID
const generateRoomId = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// 初始化15x15棋盘
const initBoard = (): (string | null)[][] => {
  return Array(15).fill(null).map(() => Array(15).fill(null))
}

// 检查胜负
const checkWin = (board: (string | null)[][], row: number, col: number, color: string): boolean => {
  const directions = [
    [0, 1],   // 水平
    [1, 0],   // 垂直
    [1, 1],   // 对角线
    [1, -1]   // 反对角线
  ]

  for (const [dr, dc] of directions) {
    let count = 1

    // 正方向
    for (let i = 1; i < 5; i++) {
      const newRow = row + dr * i
      const newCol = col + dc * i
      if (newRow >= 0 && newRow < 15 && newCol >= 0 && newCol < 15 && board[newRow][newCol] === color) {
        count++
      } else {
        break
      }
    }

    // 反方向
    for (let i = 1; i < 5; i++) {
      const newRow = row - dr * i
      const newCol = col - dc * i
      if (newRow >= 0 && newRow < 15 && newCol >= 0 && newCol < 15 && board[newRow][newCol] === color) {
        count++
      } else {
        break
      }
    }

    if (count >= 5) return true
  }

  return false
}

// 检查平局
const checkDraw = (board: (string | null)[][]): boolean => {
  return board.every(row => row.every(cell => cell !== null))
}

// 获取对手
const getOpponent = (socketId: string, room: GameRoom): Player | null => {
  for (const [id, player] of room.players) {
    if (id !== socketId) return player
  }
  return null
}

io.on('connection', (socket: Socket) => {
  console.log(`User connected: ${socket.id}`)

  // 创建房间
  socket.on('create-room', (callback: (data: { roomId: string; color: string }) => void) => {
    const roomId = generateRoomId()
    const room: GameRoom = {
      id: roomId,
      players: new Map([[socket.id, { id: socket.id, color: 'black', ready: false }]]),
      board: initBoard(),
      currentTurn: 'black',
      moves: [],
      history: [],
      status: 'waiting',
      winner: null,
      blackFirst: true,
      undoRequest: null,
      restartRequest: null,
      createdAt: new Date()
    }
    rooms.set(roomId, room)
    socket.join(roomId)
    console.log(`Room created: ${roomId} by ${socket.id}`)
    callback({ roomId, color: 'black' })
  })

  // 重新加入房间（刷新页面后恢复状态）
  socket.on('rejoin-room', (data: { roomId: string; playerId: string }, callback: (data: { success: boolean; error?: string; room?: GameRoom; player?: Player }) => void) => {
    const { roomId, playerId } = data
    const room = rooms.get(roomId)

    if (!room) {
      callback({ success: false, error: '房间不存在或已过期' })
      return
    }

    // 查找玩家（可能 socket id 已变化）
    let player: Player | null = null
    let oldSocketId: string | null = null
    
    for (const [id, p] of room.players) {
      // 通过 playerId 匹配（存储在 player 对象中）
      if (p.id === playerId || id === playerId) {
        player = p
        oldSocketId = id
        break
      }
    }

    if (!player) {
      callback({ success: false, error: '你不在该房间中' })
      return
    }

    // 更新 socket id
    if (oldSocketId && oldSocketId !== socket.id) {
      room.players.delete(oldSocketId)
      player.id = socket.id
      room.players.set(socket.id, player)
    }
    socket.join(roomId)

    // 恢复棋盘状态
    const roomData = {
      ...room,
      board: room.board,
      currentTurn: room.currentTurn,
      status: room.status,
      players: Object.fromEntries(room.players)
    }

    callback({ success: true, room: roomData, player })
    
    // 通知对手玩家已重连
    socket.to(roomId).emit('player-rejoined', { playerId: socket.id })
  })

  // 加入房间
  socket.on('join-room', (data: { roomId: string }, callback: (data: { success: boolean; error?: string; color?: string; room?: GameRoom }) => void) => {
    const { roomId } = data
    const room = rooms.get(roomId)

    if (!room) {
      callback({ success: false, error: '房间不存在' })
      return
    }

    if (room.players.size >= 2) {
      callback({ success: false, error: '房间已满' })
      return
    }

    if (room.status !== 'waiting') {
      callback({ success: false, error: '游戏已开始' })
      return
    }

    const player: Player = { id: socket.id, color: 'white', ready: false }
    room.players.set(socket.id, player)
    socket.join(roomId)
    
    console.log(`Player ${socket.id} joined room ${roomId}`)
    
    // 通知房间内所有人
    io.to(roomId).emit('player-joined', {
      player,
      room: { ...room, players: Object.fromEntries(room.players) }
    })
    
    callback({ success: true, color: 'white', room: { ...room, players: Object.fromEntries(room.players) } })
  })

  // 重新加入房间（刷新页面后恢复状态）
  socket.on('rejoin-room', (data: { roomId: string; playerId: string }, callback: (data: { success: boolean; error?: string; room?: GameRoom; player?: Player }) => void) => {
    const { roomId, playerId } = data
    const room = rooms.get(roomId)

    if (!room) {
      callback({ success: false, error: '房间不存在' })
      return
    }

    const player = room.players.get(playerId)
    if (!player) {
      callback({ success: false, error: '玩家不在房间中' })
      return
    }

    // 更新socket id
    room.players.delete(playerId)
    player.id = socket.id
    room.players.set(socket.id, player)
    socket.join(roomId)

    callback({ success: true, room: { ...room, players: Object.fromEntries(room.players) }, player })
  })

  // 准备游戏
  socket.on('ready', (data: { roomId: string }) => {
    const { roomId } = data
    const room = rooms.get(roomId)

    if (!room) return

    const player = room.players.get(socket.id)
    if (!player) return

    player.ready = true

    // 检查是否所有玩家都准备好了
    const allReady = Array.from(room.players.values()).every(p => p.ready)

    if (allReady && room.players.size === 2) {
      room.status = 'playing'
      // 切换先手（一局一换）
      room.blackFirst = !room.blackFirst
      room.currentTurn = room.blackFirst ? 'black' : 'white'
      io.to(roomId).emit('game-start', {
        blackFirst: room.blackFirst,
        currentTurn: room.currentTurn,
        room: { ...room, players: Object.fromEntries(room.players) }
      })
    } else {
      io.to(roomId).emit('player-ready', {
        playerId: socket.id,
        room: { ...room, players: Object.fromEntries(room.players) }
      })
    }
  })

  // 落子
  socket.on('move', (data: { roomId: string; row: number; col: number }, callback: (data: { success: boolean; error?: string }) => void) => {
    const { roomId, row, col } = data
    const room = rooms.get(roomId)

    if (!room) {
      callback({ success: false, error: '房间不存在' })
      return
    }

    if (room.status !== 'playing') {
      callback({ success: false, error: '游戏未开始' })
      return
    }

    const player = room.players.get(socket.id)
    if (!player) {
      callback({ success: false, error: '玩家不在房间中' })
      return
    }

    if (player.color !== room.currentTurn) {
      callback({ success: false, error: '不是你的回合' })
      return
    }

    if (room.board[row][col] !== null) {
      callback({ success: false, error: '该位置已有棋子' })
      return
    }

    // 保存历史状态用于悔棋
    const boardCopy = room.board.map(row => [...row])
    room.history.push(boardCopy)

    // 落子
    room.board[row][col] = player.color
    room.moves.push({ row, col })

    // 检查胜负
    const won = checkWin(room.board, row, col, player.color)
    const draw = checkDraw(room.board)

    if (won) {
      room.status = 'finished'
      room.winner = player.color
    } else if (draw) {
      room.status = 'finished'
      room.winner = 'draw'
    } else {
      // 切换回合
      room.currentTurn = room.currentTurn === 'black' ? 'white' : 'black'
    }

    // 清除悔棋和重开请求
    room.undoRequest = null
    room.restartRequest = null

    // 广播落子
    io.to(roomId).emit('move', {
      row,
      col,
      color: player.color,
      currentTurn: room.currentTurn,
      status: room.status,
      winner: room.winner,
      room: { ...room, players: Object.fromEntries(room.players) }
    })

    callback({ success: true })
  })

  // 请求悔棋
  socket.on('request-undo', (data: { roomId: string }) => {
    const { roomId } = data
    const room = rooms.get(roomId)

    if (!room || room.status !== 'playing') return

    const player = room.players.get(socket.id)
    if (!player) return

    if (room.history.length === 0) return

    // 设置悔棋请求
    room.undoRequest = socket.id

    // 通知对手
    const opponent = getOpponent(socket.id, room)
    if (opponent) {
      socket.to(roomId).emit('undo-requested', {
        requesterId: socket.id,
        requesterColor: player.color
      })
    }
  })

  // 响应悔棋请求
  socket.on('respond-undo', (data: { roomId: string; accept: boolean }) => {
    const { roomId, accept } = data
    const room = rooms.get(roomId)

    if (!room || room.status !== 'playing') return

    if (!room.undoRequest) return

    if (accept) {
      // 执行悔棋 - 撤销最后两步（双方各一步）
      if (room.history.length >= 2) {
        room.history.pop() // 移除当前状态
        const prevState = room.history.pop() // 移除上一步状态
        if (prevState) {
          room.board = prevState
          room.moves.pop()
          room.moves.pop()
          // 切换回合
          room.currentTurn = room.currentTurn === 'black' ? 'white' : 'black'
        }
      } else if (room.history.length === 1) {
        // 只有一方落子，撤销一步
        room.board = room.history.pop()!
        room.moves.pop()
        room.currentTurn = room.currentTurn === 'black' ? 'white' : 'black'
      }

      io.to(roomId).emit('undo-accepted', {
        board: room.board,
        currentTurn: room.currentTurn,
        moves: room.moves
      })
    } else {
      io.to(roomId).emit('undo-rejected')
    }

    room.undoRequest = null
  })

  // 请求重新开始
  socket.on('request-restart', (data: { roomId: string }) => {
    const { roomId } = data
    const room = rooms.get(roomId)

    if (!room) return

    const player = room.players.get(socket.id)
    if (!player) return

    room.restartRequest = socket.id

    // 通知对手
    socket.to(roomId).emit('restart-requested', {
      requesterId: socket.id,
      requesterColor: player.color
    })
  })

  // 响应重新开始请求
  socket.on('respond-restart', (data: { roomId: string; accept: boolean }) => {
    const { roomId, accept } = data
    const room = rooms.get(roomId)

    if (!room) return

    if (!room.restartRequest) return

    if (accept) {
      // 重置游戏
      room.board = initBoard()
      room.moves = []
      room.history = []
      room.status = 'waiting'
      room.winner = null
      room.undoRequest = null
      room.restartRequest = null
      
      // 重置准备状态
      for (const player of room.players.values()) {
        player.ready = false
      }

      io.to(roomId).emit('restart-accepted', {
        room: { ...room, players: Object.fromEntries(room.players) }
      })
    } else {
      io.to(roomId).emit('restart-rejected')
    }

    room.restartRequest = null
  })

  // 离开房间
  socket.on('leave-room', (data: { roomId: string }) => {
    const { roomId } = data
    const room = rooms.get(roomId)

    if (!room) return

    const player = room.players.get(socket.id)
    if (player) {
      room.players.delete(socket.id)
      socket.leave(roomId)
      
      // 通知对手
      socket.to(roomId).emit('player-left', {
        playerId: socket.id,
        playerColor: player.color
      })

      // 如果房间空了，删除房间
      if (room.players.size === 0) {
        rooms.delete(roomId)
      }
    }
  })

  // 断开连接
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`)
    
    // 查找该玩家所在的所有房间
    for (const [roomId, room] of rooms) {
      const player = room.players.get(socket.id)
      if (player) {
        room.players.delete(socket.id)
        socket.to(roomId).emit('player-left', {
          playerId: socket.id,
          playerColor: player.color
        })

        // 如果房间空了，删除房间
        if (room.players.size === 0) {
          rooms.delete(roomId)
        }
      }
    }
  })
})

const PORT = 3003
httpServer.listen(PORT, () => {
  console.log(`Gomoku WebSocket server running on port ${PORT}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM signal, shutting down server...')
  httpServer.close(() => {
    console.log('WebSocket server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('Received SIGINT signal, shutting down server...')
  httpServer.close(() => {
    console.log('WebSocket server closed')
    process.exit(0)
  })
})
