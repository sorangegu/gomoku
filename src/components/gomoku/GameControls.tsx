'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Undo2, RotateCcw, Home, Bot, Users } from 'lucide-react'
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

interface GameControlsProps {
  onHome?: () => void
  onUndo?: () => void
  onRestart?: () => void
  showHome?: boolean
}

export function GameControls({ onHome, onUndo, onRestart, showHome = true }: GameControlsProps) {
  const { 
    status, 
    mode, 
    moves,
    history,
    requestUndo,
    requestRestart,
  } = useGomokuStore()

  const [showUndoDialog, setShowUndoDialog] = useState(false)
  const [showRestartDialog, setShowRestartDialog] = useState(false)

  const canUndo = status === 'playing' && history.length >= 2
  const canRestart = status !== 'waiting'

  const handleUndo = () => {
    if (mode === 'ai') {
      requestUndo()
    } else {
      setShowUndoDialog(true)
    }
  }

  const handleRestart = () => {
    if (mode === 'ai') {
      requestRestart()
    } else {
      setShowRestartDialog(true)
    }
  }

  const confirmUndo = () => {
    onUndo?.()
    setShowUndoDialog(false)
  }

  const confirmRestart = () => {
    onRestart?.()
    setShowRestartDialog(false)
  }

  return (
    <>
      <div className="flex items-center justify-center gap-3">
        {showHome && (
          <Button
            variant="outline"
            size="lg"
            onClick={onHome}
            className="gap-2"
          >
            <Home className="w-4 h-4" />
            返回首页
          </Button>
        )}

        <Button
          variant="outline"
          size="lg"
          onClick={handleUndo}
          disabled={!canUndo}
          className="gap-2"
        >
          <Undo2 className="w-4 h-4" />
          悔棋
        </Button>

        <Button
          variant="outline"
          size="lg"
          onClick={handleRestart}
          disabled={!canRestart}
          className="gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          重新开始
        </Button>
      </div>

      {/* 悔棋确认对话框 */}
      <Dialog open={showUndoDialog} onOpenChange={setShowUndoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>请求悔棋</DialogTitle>
            <DialogDescription>
              悔棋需要双方确认，确定要发送悔棋请求吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUndoDialog(false)}>
              取消
            </Button>
            <Button onClick={confirmUndo}>
              确认请求
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 重新开始确认对话框 */}
      <Dialog open={showRestartDialog} onOpenChange={setShowRestartDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>请求重新开始</DialogTitle>
            <DialogDescription>
              重新开始需要双方确认，确定要发送重新开始请求吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRestartDialog(false)}>
              取消
            </Button>
            <Button onClick={confirmRestart}>
              确认请求
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
