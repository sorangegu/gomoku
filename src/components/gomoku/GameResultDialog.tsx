'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Frown, Handshake, RotateCcw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useGomokuStore } from '@/stores/gomoku-store'

interface GameResultDialogProps {
  onRestart?: () => void
  onHome?: () => void
}

export function GameResultDialog({ onRestart, onHome }: GameResultDialogProps) {
  const { status, winner, mode, onlineGame, singleGame, requestRestart } = useGomokuStore()
  const [open, setOpen] = useState(false)
  
  const playerColor = mode === 'online' ? onlineGame.playerColor : singleGame.playerColor

  // 监听游戏结束
  useEffect(() => {
    if (status === 'finished' && winner) {
      const timer = setTimeout(() => setOpen(true), 100)
      return () => clearTimeout(timer)
    }
  }, [status, winner])

  const getResult = () => {
    if (winner === 'draw') {
      return {
        icon: <Handshake className="w-10 h-10 text-amber-500" />,
        title: '平局',
        description: '势均力敌',
        color: 'text-amber-500',
      }
    }

    const isWin = winner === playerColor
    if (isWin) {
      return {
        icon: <Trophy className="w-10 h-10 text-yellow-500" />,
        title: '胜利',
        description: '恭喜获胜',
        color: 'text-yellow-500',
      }
    } else {
      return {
        icon: <Frown className="w-10 h-10 text-red-400" />,
        title: '失败',
        description: '再接再厉',
        color: 'text-red-400',
      }
    }
  }

  const handleRestart = () => {
    setOpen(false)
    if (mode === 'ai') {
      requestRestart()
    } else {
      onRestart?.()
    }
  }

  const handleHome = () => {
    setOpen(false)
    onHome?.()
  }

  if (!winner) return null

  const result = getResult()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-xs p-4 gap-3">
        <DialogHeader className="items-center text-center space-y-2">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            {result.icon}
          </motion.div>
          <DialogTitle className={`text-xl font-bold ${result.color}`}>
            {result.title}
          </DialogTitle>
          <DialogDescription>
            {result.description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center items-center gap-2">
          <div
            className="w-6 h-6 rounded-full shrink-0"
            style={{
              background: winner === 'black'
                ? 'radial-gradient(circle at 35% 35%, #555 0%, #222 50%, #111 100%)'
                : 'radial-gradient(circle at 35% 35%, #fff 0%, #eee 50%, #ccc 100%)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
            }}
          />
          <span className="text-sm text-muted-foreground">
            {winner === 'black' ? '黑棋' : winner === 'white' ? '白棋' : '双方'}
            {winner !== 'draw' && '获胜'}
          </span>
        </div>

        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleHome}
          >
            <Home className="w-4 h-4 mr-1" />
            首页
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={handleRestart}
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            再来一局
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
