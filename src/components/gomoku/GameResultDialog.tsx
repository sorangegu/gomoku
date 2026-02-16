'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Frown, Handshake, RotateCcw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
      // 使用 setTimeout 避免在渲染期间设置状态
      const timer = setTimeout(() => setOpen(true), 100)
      return () => clearTimeout(timer)
    }
  }, [status, winner])

  const getResult = () => {
    if (winner === 'draw') {
      return {
        icon: <Handshake className="w-16 h-16 text-amber-500" />,
        title: '平局！',
        description: '势均力敌，难分胜负',
        color: 'text-amber-500',
      }
    }

    const isWin = winner === playerColor
    if (isWin) {
      return {
        icon: <Trophy className="w-16 h-16 text-yellow-500" />,
        title: '恭喜获胜！',
        description: '你展现了出色的棋艺',
        color: 'text-yellow-500',
      }
    } else {
      return {
        icon: <Frown className="w-16 h-16 text-red-400" />,
        title: '很遗憾，你输了',
        description: '胜败乃兵家常事，再来一局？',
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="mb-4"
          >
            {result.icon}
          </motion.div>
          <DialogTitle className={`text-2xl font-bold ${result.color}`}>
            {result.title}
          </DialogTitle>
          <DialogDescription className="text-base">
            {result.description}
          </DialogDescription>
        </DialogHeader>

        {/* 显示获胜方 */}
        <div className="flex justify-center items-center gap-4 py-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2"
          >
            <div
              className="w-8 h-8 rounded-full"
              style={{
                background: winner === 'black'
                  ? 'radial-gradient(circle at 35% 35%, #555 0%, #222 50%, #111 100%)'
                  : 'radial-gradient(circle at 35% 35%, #fff 0%, #eee 50%, #ccc 100%)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}
            />
            <span className="text-lg font-medium">
              {winner === 'black' ? '黑棋' : winner === 'white' ? '白棋' : '双方'}
              {winner !== 'draw' && '获胜'}
            </span>
          </motion.div>
        </div>

        <DialogFooter className="flex-col sm:flex-row sm:justify-center gap-2">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={handleHome}
          >
            <Home className="w-4 h-4 mr-2" />
            返回首页
          </Button>
          <Button
            className="w-full sm:w-auto"
            onClick={handleRestart}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            再来一局
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
