'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Copy, Check, Loader2, Users, Crown, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useGomokuStore, getPlayerId } from '@/stores/gomoku-store'
import { io, Socket } from 'socket.io-client'
import { toast } from 'sonner'

interface OnlineLobbyProps {
  onGameStart: (socket: Socket) => void
}

export function OnlineLobby({ onGameStart }: OnlineLobbyProps) {
  const { startOnlineGame } = useGomokuStore()
  const [step, setStep] = useState<'create' | 'waiting'>('create')
  const [roomId, setRoomId] = useState('')
  const [joinRoomId, setJoinRoomId] = useState('')
  const [copied, setCopied] = useState(false)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [playerColor, setPlayerColor] = useState<'black' | 'white'>('black')
  const [playerReady, setPlayerReady] = useState(false)
  const [opponentConnected, setOpponentConnected] = useState(false)
  const [opponentReady, setOpponentReady] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  // 检查URL参数，自动加入房间
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const roomFromUrl = params.get('room')
    if (roomFromUrl && roomFromUrl.length === 6) {
      // 清除URL参数，避免刷新时重复加入
      window.history.replaceState({}, '', window.location.pathname)
      setJoinRoomId(roomFromUrl.toUpperCase())
      
      // 直接在这里处理加入房间，避免闭包问题
      const playerId = getPlayerId()
      
      const newSocket = io({
        path: '/socket.io/',
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        timeout: 10000,
      })

      // 存储当前 socket id 用于过滤事件
      let currentSocketId: string = ''

      newSocket.on('connect', () => {
        currentSocketId = newSocket.id || ''
        console.log('Connected to server, joining room:', roomFromUrl.toUpperCase())
        newSocket.emit('join-room', { roomId: roomFromUrl.toUpperCase(), persistentId: playerId }, (data: any) => {
          console.log('Join room response:', data)
          if (data.success) {
            setRoomId(roomFromUrl.toUpperCase())
            setPlayerColor(data.color as 'black' | 'white')
            setStep('waiting')
            startOnlineGame(roomFromUrl.toUpperCase(), playerId, data.color as 'black' | 'white')
            setOpponentConnected(true)
            setIsConnecting(false)
            setSocket(newSocket)
          } else {
            setConnectionError(data.error || '加入房间失败')
            setIsConnecting(false)
            toast.error(data.error || '加入房间失败')
            newSocket.disconnect()
          }
        })
      })

      newSocket.on('connect_error', (error) => {
        console.error('Connection error:', error)
        setConnectionError('连接服务器失败，请检查网络')
        setIsConnecting(false)
        toast.error('连接服务器失败')
      })

      newSocket.on('player-joined', (data: { player: any; room: any }) => {
        console.log('Player joined:', data)
        setOpponentConnected(true)
        toast.success('对手已加入房间！')
      })

      newSocket.on('player-ready', (data: { playerId: string; room: any }) => {
        console.log('Player ready:', data, 'currentSocketId:', currentSocketId)
        // 只更新对手的准备状态，忽略自己的
        if (data.playerId !== currentSocketId) {
          setOpponentReady(true)
        }
      })

      newSocket.on('game-start', (data: any) => {
        console.log('Game started:', data)
        toast.success('游戏开始！')
        useGomokuStore.getState().updateFromServer({
          status: 'playing',
          currentTurn: data.currentTurn || 'black',
        })
        onGameStart(newSocket)
      })

      newSocket.on('player-left', (data: any) => {
        console.log('Player left:', data)
        setOpponentConnected(false)
        setOpponentReady(false)
        toast.error('对手已离开房间')
      })

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server')
      })

      setIsConnecting(true)
    }
  }, [startOnlineGame, onGameStart])

  // 设置Socket事件监听
  const setupSocketListeners = useCallback((newSocket: Socket, isCreator: boolean) => {
    newSocket.on('connect', () => {
      console.log('Connected to server')
      setConnectionError(null)
      setIsConnecting(false)
    })

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error)
      setConnectionError('连接服务器失败，请检查网络')
      setIsConnecting(false)
      toast.error('连接服务器失败')
    })

    newSocket.on('player-joined', (data: { player: any; room: any }) => {
      console.log('Player joined:', data)
      setOpponentConnected(true)
      toast.success('对手已加入房间！')
    })

    newSocket.on('player-ready', (data: { playerId: string; room: any }) => {
      console.log('Player ready:', data, 'my socket id:', newSocket.id)
      // 只更新对手的准备状态，忽略自己的
      if (data.playerId !== newSocket.id) {
        setOpponentReady(true)
      }
    })

    newSocket.on('game-start', (data: any) => {
      console.log('Game started:', data)
      toast.success('游戏开始！')
      // 更新游戏状态
      useGomokuStore.getState().updateFromServer({
        status: 'playing',
        currentTurn: data.currentTurn || 'black',
      })
      onGameStart(newSocket)
    })

    newSocket.on('player-left', (data: any) => {
      console.log('Player left:', data)
      setOpponentConnected(false)
      setOpponentReady(false)
      toast.error('对手已离开房间')
    })

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server')
    })
  }, [onGameStart])

  // 创建房间
  const handleCreateRoom = useCallback(() => {
    setIsConnecting(true)
    setConnectionError(null)
    const playerId = getPlayerId()
    
    const newSocket = io({
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      timeout: 10000,
    })

    setupSocketListeners(newSocket, true)

    newSocket.on('connect', () => {
      newSocket.emit('create-room', { persistentId: playerId }, (data: { roomId: string; color: string }) => {
        console.log('Room created:', data)
        setRoomId(data.roomId)
        setPlayerColor(data.color as 'black' | 'white')
        setStep('waiting')
        startOnlineGame(data.roomId, playerId, data.color as 'black' | 'white')
        setIsConnecting(false)
      })
    })

    setSocket(newSocket)
  }, [startOnlineGame, setupSocketListeners])

  // 加入房间
  const handleJoinRoom = useCallback((roomCode?: string) => {
    const targetRoomId = roomCode || joinRoomId
    if (!targetRoomId || targetRoomId.length !== 6) {
      toast.error('请输入6位房间号')
      return
    }

    setIsConnecting(true)
    setConnectionError(null)
    const playerId = getPlayerId()
    
    const newSocket = io({
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      timeout: 10000,
    })

    setupSocketListeners(newSocket, false)

    newSocket.on('connect', () => {
      newSocket.emit('join-room', { roomId: targetRoomId.toUpperCase(), persistentId: playerId }, (data: any) => {
        console.log('Join room response:', data)
        if (data.success) {
          setRoomId(targetRoomId.toUpperCase())
          setPlayerColor(data.color as 'black' | 'white')
          setStep('waiting')
          startOnlineGame(targetRoomId.toUpperCase(), playerId, data.color as 'black' | 'white')
          setOpponentConnected(true)
          setIsConnecting(false)
        } else {
          setConnectionError(data.error || '加入房间失败')
          setIsConnecting(false)
          toast.error(data.error || '加入房间失败')
          newSocket.disconnect()
        }
      })
    })

    setSocket(newSocket)
  }, [joinRoomId, startOnlineGame, setupSocketListeners])

  // 准备游戏
  const handleReady = useCallback(() => {
    if (socket && roomId) {
      socket.emit('ready', { roomId })
      setPlayerReady(true)
    }
  }, [socket, roomId])

  // 复制房间链接
  const copyRoomLink = useCallback(() => {
    const link = `${window.location.origin}?room=${roomId}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    toast.success('链接已复制！')
    setTimeout(() => setCopied(false), 2000)
  }, [roomId])

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <h2 className="text-2xl font-bold mb-2">玩家对战</h2>
        <p className="text-muted-foreground">
          {step === 'create' && '创建房间或加入已有房间'}
          {step === 'waiting' && '等待对手加入'}
        </p>
      </motion.div>

      {/* 连接错误提示 */}
      {connectionError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-center"
        >
          <WifiOff className="w-5 h-5 mx-auto mb-2" />
          {connectionError}
        </motion.div>
      )}

      {step === 'create' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">创建新房间</CardTitle>
              <CardDescription>创建房间后分享链接给好友</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                onClick={handleCreateRoom}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    连接中...
                  </>
                ) : (
                  <>
                    <Crown className="w-4 h-4 mr-2" />
                    创建房间
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                或者
              </span>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">加入房间</CardTitle>
              <CardDescription>输入6位房间号加入游戏</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="输入房间号"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                maxLength={6}
                className="text-center text-lg tracking-widest"
              />
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => handleJoinRoom()}
                disabled={joinRoomId.length !== 6 || isConnecting}
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    连接中...
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4 mr-2" />
                    加入房间
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {step === 'waiting' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                房间号
                <Badge variant="secondary" className="text-lg tracking-widest">
                  {roomId}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Input
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}?room=${roomId}`}
                  readOnly
                  className="text-sm"
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={copyRoomLink}
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                分享链接或房间号给好友
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">玩家状态</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-6 h-6 rounded-full"
                    style={{
                      background: playerColor === 'black'
                        ? 'radial-gradient(circle at 35% 35%, #555 0%, #222 50%, #111 100%)'
                        : 'radial-gradient(circle at 35% 35%, #fff 0%, #eee 50%, #ccc 100%)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    }}
                  />
                  <span>你 ({playerColor === 'black' ? '黑棋' : '白棋'})</span>
                </div>
                <Badge variant={playerReady ? 'default' : 'secondary'}>
                  {playerReady ? '已准备' : '未准备'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-6 h-6 rounded-full"
                    style={{
                      background: playerColor === 'white'
                        ? 'radial-gradient(circle at 35% 35%, #555 0%, #222 50%, #111 100%)'
                        : 'radial-gradient(circle at 35% 35%, #fff 0%, #eee 50%, #ccc 100%)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    }}
                  />
                  <span>对手 ({playerColor === 'white' ? '黑棋' : '白棋'})</span>
                </div>
                <Badge variant={opponentConnected ? (opponentReady ? 'default' : 'secondary') : 'outline'}>
                  {!opponentConnected ? '等待加入...' : opponentReady ? '已准备' : '未准备'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Button
            className="w-full"
            size="lg"
            onClick={handleReady}
            disabled={playerReady || !opponentConnected}
          >
            {playerReady ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                等待对手准备...
              </>
            ) : (
              '准备就绪'
            )}
          </Button>

          {!opponentConnected && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              等待对手加入...
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
