'use client'

import { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGomokuStore } from '@/stores/gomoku-store'
import { BOARD_SIZE, Position } from '@/lib/gomoku'
import { cn } from '@/lib/utils'

interface GomokuBoardProps {
  onMove?: (row: number, col: number) => void
  isOnline?: boolean
  socket?: any
}

export function GomokuBoard({ onMove, isOnline, socket }: GomokuBoardProps) {
  const { 
    board, 
    currentTurn, 
    status, 
    winner, 
    winningLine, 
    moves,
    mode,
    onlineGame,
    singleGame,
    makeMove 
  } = useGomokuStore()

  const boardRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState(400)
  const [hoverPos, setHoverPos] = useState<Position | null>(null)

  // 计算容器尺寸
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const size = Math.min(containerRef.current.clientWidth, 560)
        setContainerSize(size)
      }
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  // 最后一步
  const lastMove = useMemo<Position | null>(() => {
    return moves.length > 0 ? moves[moves.length - 1] : null
  }, [moves])

  // 棋盘参数：15条线，14个格子
  // 边距为一个格子宽度
  const cellCount = BOARD_SIZE - 1 // 14个格子
  const padding = containerSize / (cellCount + 2) // 边距
  const cellSize = padding // 每个格子的大小等于边距
  const boardInnerSize = cellSize * cellCount // 内部绘制区域

  // 计算交叉点位置（相对于容器左上角）
  const getIntersectionPosition = (row: number, col: number) => ({
    x: padding + col * cellSize,
    y: padding + row * cellSize,
  })

  // 判断是否可以落子
  const canPlace = useCallback((row: number, col: number) => {
    if (status !== 'playing') return false
    if (board[row][col] !== null) return false

    if (mode === 'online') {
      return onlineGame.playerColor === currentTurn
    } else if (mode === 'ai') {
      return singleGame.playerColor === currentTurn
    }
    return false
  }, [status, board, mode, onlineGame.playerColor, currentTurn, singleGame.playerColor])

  // 点击落子
  const handleClick = useCallback((row: number, col: number) => {
    if (!canPlace(row, col)) return

    if (isOnline && socket && onMove) {
      onMove(row, col)
    } else {
      makeMove(row, col)
    }
  }, [canPlace, isOnline, socket, onMove, makeMove])

  // 计算鼠标悬停位置
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!boardRef.current || status !== 'playing') {
      setHoverPos(null)
      return
    }

    const rect = boardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // 计算最近的交叉点
    const col = Math.round((x - padding) / cellSize)
    const row = Math.round((y - padding) / cellSize)

    if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
      if (canPlace(row, col)) {
        setHoverPos({ row, col })
      } else {
        setHoverPos(null)
      }
    } else {
      setHoverPos(null)
    }
  }, [status, padding, cellSize, canPlace])

  const handleMouseLeave = useCallback(() => {
    setHoverPos(null)
  }, [])

  // 判断是否在获胜线中
  const isInWinningLine = (row: number, col: number) => {
    return winningLine.some(pos => pos.row === row && pos.col === col)
  }

  // 棋子半径
  const pieceRadius = cellSize * 0.42

  return (
    <div ref={containerRef} className="w-full max-w-[560px] mx-auto">
      <div 
        ref={boardRef}
        className="relative select-none rounded-lg overflow-hidden"
        style={{
          width: containerSize,
          height: containerSize,
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* 棋盘背景 */}
        <div 
          className="absolute inset-0 rounded-lg"
          style={{
            background: 'linear-gradient(145deg, #DEB887 0%, #D2A66A 50%, #C8995A 100%)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.2)',
          }}
        />
        
        {/* 棋盘网格 - 使用 SVG */}
        <svg 
          className="absolute inset-0"
          width={containerSize}
          height={containerSize}
          viewBox={`0 0 ${containerSize} ${containerSize}`}
        >
          {/* 横线 */}
          {Array.from({ length: BOARD_SIZE }).map((_, i) => {
            const y = padding + i * cellSize
            return (
              <line
                key={`h-${i}`}
                x1={padding}
                y1={y}
                x2={padding + cellCount * cellSize}
                y2={y}
                stroke="#8B6914"
                strokeWidth={1.5}
                opacity={0.7}
              />
            )
          })}
          {/* 竖线 */}
          {Array.from({ length: BOARD_SIZE }).map((_, i) => {
            const x = padding + i * cellSize
            return (
              <line
                key={`v-${i}`}
                x1={x}
                y1={padding}
                x2={x}
                y2={padding + cellCount * cellSize}
                stroke="#8B6914"
                strokeWidth={1.5}
                opacity={0.7}
              />
            )
          })}
          {/* 星位点 */}
          {[3, 7, 11].map(row =>
            [3, 7, 11].map(col => {
              const pos = getIntersectionPosition(row, col)
              return (
                <circle
                  key={`star-${row}-${col}`}
                  cx={pos.x}
                  cy={pos.y}
                  r={cellSize * 0.12}
                  fill="#8B6914"
                  opacity={0.9}
                />
              )
            })
          )}
        </svg>

        {/* 悬停提示 */}
        <AnimatePresence>
          {hoverPos && status === 'playing' && (
            <motion.div
              key={`hover-${hoverPos.row}-${hoverPos.col}`}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 0.4, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.1 }}
              className="absolute pointer-events-none"
              style={{
                left: getIntersectionPosition(hoverPos.row, hoverPos.col).x - pieceRadius,
                top: getIntersectionPosition(hoverPos.row, hoverPos.col).y - pieceRadius,
                width: pieceRadius * 2,
                height: pieceRadius * 2,
                borderRadius: '50%',
                background: currentTurn === 'black' 
                  ? 'radial-gradient(circle at 30% 30%, #555, #111)' 
                  : 'radial-gradient(circle at 30% 30%, #fff, #ccc)',
              }}
            />
          )}
        </AnimatePresence>

        {/* 棋子 */}
        <AnimatePresence>
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              if (!cell) return null
              
              const pos = getIntersectionPosition(rowIndex, colIndex)
              const isLast = lastMove?.row === rowIndex && lastMove?.col === colIndex
              const isWinning = isInWinningLine(rowIndex, colIndex)
              
              return (
                <motion.div
                  key={`piece-${rowIndex}-${colIndex}`}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    type: 'spring', 
                    stiffness: 400, 
                    damping: 20,
                  }}
                  className={cn(
                    "absolute pointer-events-none",
                    isWinning && "z-10"
                  )}
                  style={{
                    left: pos.x - pieceRadius,
                    top: pos.y - pieceRadius,
                    width: pieceRadius * 2,
                    height: pieceRadius * 2,
                    borderRadius: '50%',
                    background: cell === 'black'
                      ? 'radial-gradient(circle at 35% 35%, #555 0%, #222 50%, #111 100%)'
                      : 'radial-gradient(circle at 35% 35%, #fff 0%, #eee 50%, #ccc 100%)',
                    boxShadow: cell === 'black'
                      ? '2px 3px 8px rgba(0, 0, 0, 0.6), inset 0 -2px 4px rgba(0, 0, 0, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.1)'
                      : '2px 3px 8px rgba(0, 0, 0, 0.4), inset 0 -2px 4px rgba(0, 0, 0, 0.1), inset 0 2px 4px rgba(255, 255, 255, 0.8)',
                  }}
                >
                  {/* 最后落子标记 */}
                  {isLast && !isWinning && (
                    <div
                      className="absolute"
                      style={{
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: cellSize * 0.2,
                        height: cellSize * 0.2,
                        borderRadius: '50%',
                        background: cell === 'black' ? '#ff6b6b' : '#e74c3c',
                        boxShadow: '0 0 6px rgba(231, 76, 60, 0.8)',
                      }}
                    />
                  )}
                  {/* 获胜线高亮 */}
                  {isWinning && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: 'transparent',
                        border: `3px solid ${cell === 'black' ? '#f1c40f' : '#f39c12'}`,
                        boxShadow: '0 0 12px rgba(241, 196, 15, 0.8)',
                      }}
                    />
                  )}
                </motion.div>
              )
            })
          )}
        </AnimatePresence>

        {/* 点击区域 */}
        <div className="absolute inset-0">
          {Array.from({ length: BOARD_SIZE }).map((_, row) =>
            Array.from({ length: BOARD_SIZE }).map((_, col) => {
              const pos = getIntersectionPosition(row, col)
              return (
                <div
                  key={`click-${row}-${col}`}
                  className="absolute cursor-pointer"
                  style={{
                    left: pos.x - cellSize * 0.5,
                    top: pos.y - cellSize * 0.5,
                    width: cellSize,
                    height: cellSize,
                  }}
                  onClick={() => handleClick(row, col)}
                />
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
