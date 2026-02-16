'use client'

import { motion } from 'framer-motion'
import { useGomokuStore } from '@/stores/gomoku-store'
import { cn } from '@/lib/utils'

interface GameInfoProps {
  className?: string
}

export function GameInfo({ className }: GameInfoProps) {
  const { 
    currentTurn, 
    status, 
    winner, 
    mode,
    onlineGame,
    singleGame,
    moves 
  } = useGomokuStore()

  const playerColor = mode === 'online' ? onlineGame.playerColor : singleGame.playerColor
  const isMyTurn = currentTurn === playerColor

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      {/* 当前回合指示 */}
      <div className="flex items-center gap-3">
        <motion.div
          animate={{ 
            scale: currentTurn === 'black' ? 1.1 : 1,
            boxShadow: currentTurn === 'black' 
              ? '0 0 20px rgba(0, 0, 0, 0.5)' 
              : '0 2px 8px rgba(0, 0, 0, 0.3)'
          }}
          className={cn(
            "w-8 h-8 rounded-full",
            currentTurn === 'black' && "ring-2 ring-yellow-400 ring-offset-2 ring-offset-background"
          )}
          style={{
            background: 'radial-gradient(circle at 35% 35%, #555 0%, #222 50%, #111 100%)',
          }}
        />
        <span className="text-lg font-medium">
          {status === 'playing' 
            ? (isMyTurn ? '你的回合' : '对手回合')
            : status === 'waiting' 
            ? '等待对手...' 
            : status === 'finished' 
            ? (winner === 'draw' ? '平局！' : winner === playerColor ? '你赢了！' : '你输了')
            : '准备开始'}
        </span>
        <motion.div
          animate={{ 
            scale: currentTurn === 'white' ? 1.1 : 1,
            boxShadow: currentTurn === 'white' 
              ? '0 0 20px rgba(255, 255, 255, 0.5)' 
              : '0 2px 8px rgba(0, 0, 0, 0.3)'
          }}
          className={cn(
            "w-8 h-8 rounded-full",
            currentTurn === 'white' && "ring-2 ring-yellow-400 ring-offset-2 ring-offset-background"
          )}
          style={{
            background: 'radial-gradient(circle at 35% 35%, #fff 0%, #eee 50%, #ccc 100%)',
          }}
        />
      </div>

      {/* 步数 */}
      <div className="text-sm text-muted-foreground">
        第 {moves.length} 步
      </div>
    </div>
  )
}
