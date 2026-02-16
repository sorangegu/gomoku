'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { io, Socket } from 'socket.io-client'
import { GomokuBoard } from '@/components/gomoku/GomokuBoard'
import { GameInfo } from '@/components/gomoku/GameInfo'
import { GameControls } from '@/components/gomoku/GameControls'
import { ModeSelect } from '@/components/gomoku/ModeSelect'
import { OnlineLobby } from '@/components/gomoku/OnlineLobby'
import { GameResultDialog } from '@/components/gomoku/GameResultDialog'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useGomokuStore, getPlayerId } from '@/stores/gomoku-store'
import { Player } from '@/lib/gomoku'
import { toast, Toaster } from 'sonner'

type GameScreen = 'menu' | 'ai' | 'online-lobby' | 'online-game'

export default function HomePage() {
  const [socket, setSocket] = useState<Socket | null>(null)

  const {
    mode,
    startSingleGame,
    startOnlineGame,
    makeMove,
    updateFromServer,
    setPlayerReady,
    status,
    winner,
    onlineGame,
    board,
    currentTurn,
    moves,
    requestRestart,
  } = useGomokuStore()

  // 检查URL参数，决定初始屏幕
  const initialScreen = useMemo<GameScreen>(() => {
    if (typeof window === 'undefined') return 'menu'
    const params = new URLSearchParams(window.location.search)
    const roomId = params.get('room')
    return roomId ? 'online-lobby' : 'menu'
  }, [])

  const [screen, setScreen] = useState<GameScreen>(initialScreen)

  // 开始AI游戏
  const handleStartAI = useCallback((playerColor: Player, aiLevel: number) => {
    startSingleGame(playerColor, aiLevel)
    setScreen('ai')
  }, [startSingleGame])

  // 开始在线游戏
  const handleStartOnline = useCallback(() => {
    setScreen('online-lobby')
  }, [])

  // 在线游戏开始
  const handleOnlineGameStart = useCallback((newSocket: Socket) => {
    setSocket(newSocket)
    setScreen('online-game')
  }, [])

  // 返回菜单
  const handleBackToMenu = useCallback(() => {
    if (socket) {
      socket.disconnect()
      setSocket(null)
    }
    setScreen('menu')
  }, [socket])

  // 在线模式发送落子
  const handleOnlineMove = useCallback((row: number, col: number) => {
    if (socket && onlineGame.roomId) {
      socket.emit('move', { roomId: onlineGame.roomId, row, col }, (response: any) => {
        if (!response.success) {
          toast.error(response.error)
        }
      })
    }
  }, [socket, onlineGame.roomId])

  // 处理在线悔棋
  const handleOnlineUndo = useCallback(() => {
    if (socket && onlineGame.roomId) {
      socket.emit('request-undo', { roomId: onlineGame.roomId })
    }
  }, [socket, onlineGame.roomId])

  // 处理在线重新开始
  const handleOnlineRestart = useCallback(() => {
    if (socket && onlineGame.roomId) {
      socket.emit('request-restart', { roomId: onlineGame.roomId })
    }
  }, [socket, onlineGame.roomId])

  // 设置Socket事件监听
  useEffect(() => {
    if (!socket) return

    socket.on('move', (data: any) => {
      // 更新本地棋盘
      const newBoard = board.map(row => [...row])
      newBoard[data.row][data.col] = data.color
      updateFromServer({
        board: newBoard,
        currentTurn: data.currentTurn,
        status: data.status,
        winner: data.winner,
      })
    })

    socket.on('undo-requested', (data: any) => {
      // 显示悔棋请求对话框
      toast.info('对手请求悔棋', {
        action: {
          label: '同意',
          onClick: () => {
            socket.emit('respond-undo', { roomId: onlineGame.roomId, accept: true })
          },
        },
        cancel: {
          label: '拒绝',
          onClick: () => {
            socket.emit('respond-undo', { roomId: onlineGame.roomId, accept: false })
          },
        },
        duration: 30000,
      })
    })

    socket.on('undo-accepted', (data: any) => {
      updateFromServer({
        board: data.board,
        currentTurn: data.currentTurn,
        moves: data.moves,
        status: 'playing',
        winner: null,
      })
      toast.success('悔棋成功')
    })

    socket.on('undo-rejected', () => {
      toast.error('对手拒绝了悔棋请求')
    })

    socket.on('restart-requested', (data: any) => {
      toast.info('对手请求重新开始', {
        action: {
          label: '同意',
          onClick: () => {
            socket.emit('respond-restart', { roomId: onlineGame.roomId, accept: true })
          },
        },
        cancel: {
          label: '拒绝',
          onClick: () => {
            socket.emit('respond-restart', { roomId: onlineGame.roomId, accept: false })
          },
        },
        duration: 30000,
      })
    })

    socket.on('restart-accepted', (data: any) => {
      updateFromServer({
        board: data.room.board,
        currentTurn: data.room.currentTurn,
        moves: [],
        history: [],
        status: 'waiting',
        winner: null,
      })
      setPlayerReady(false)
      toast.success('游戏已重置')
    })

    socket.on('restart-rejected', () => {
      toast.error('对手拒绝了重新开始请求')
    })

    return () => {
      socket.off('move')
      socket.off('undo-requested')
      socket.off('undo-accepted')
      socket.off('undo-rejected')
      socket.off('restart-requested')
      socket.off('restart-accepted')
      socket.off('restart-rejected')
    }
  }, [socket, board, onlineGame.roomId, updateFromServer, setPlayerReady])

  return (
    <main className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
        <div className="container flex h-14 items-center justify-between px-4">
          <motion.h1 
            className="text-xl font-bold bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 bg-clip-text text-transparent cursor-pointer"
            onClick={handleBackToMenu}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            五子棋
          </motion.h1>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <AnimatePresence mode="wait">
          {screen === 'menu' && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full flex items-center justify-center"
            >
              <ModeSelect
                onStartAI={handleStartAI}
                onStartOnline={handleStartOnline}
              />
            </motion.div>
          )}

          {(screen === 'ai' || screen === 'online-game') && (
            <motion.div
              key="game"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-2xl flex flex-col items-center gap-6"
            >
              <GameInfo />
              <GomokuBoard 
                isOnline={screen === 'online-game'} 
                socket={socket}
                onMove={handleOnlineMove}
              />
              <GameControls
                onHome={handleBackToMenu}
                onUndo={screen === 'online-game' ? handleOnlineUndo : undefined}
                onRestart={screen === 'online-game' ? handleOnlineRestart : undefined}
              />
              <GameResultDialog
                onRestart={screen === 'online-game' ? handleOnlineRestart : undefined}
                onHome={handleBackToMenu}
              />
            </motion.div>
          )}

          {screen === 'online-lobby' && (
            <motion.div
              key="lobby"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full flex items-center justify-center"
            >
              <OnlineLobby onGameStart={handleOnlineGameStart} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <footer className="sticky bottom-0 border-t bg-background/80 backdrop-blur-sm py-4">
        <div className="container text-center text-sm text-muted-foreground">
          <p>经典五子棋对战 · 人机与在线模式</p>
        </div>
      </footer>

      <Toaster position="top-center" />
    </main>
  )
}
