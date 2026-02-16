// 五子棋核心逻辑

export const BOARD_SIZE = 15

export type Cell = 'black' | 'white' | null
export type Board = Cell[][]
export type Player = 'black' | 'white'
export type GameStatus = 'idle' | 'waiting' | 'playing' | 'finished'
export type GameMode = 'ai' | 'online'

export interface Position {
  row: number
  col: number
}

export interface Move extends Position {
  player: Player
  timestamp: number
}

// 初始化棋盘
export const initBoard = (): Board => {
  return Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null))
}

// 检查是否在棋盘范围内
export const isValidPosition = (row: number, col: number): boolean => {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE
}

// 检查胜负
export const checkWin = (board: Board, row: number, col: number, player: Player): boolean => {
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
      if (isValidPosition(newRow, newCol) && board[newRow][newCol] === player) {
        count++
      } else {
        break
      }
    }

    // 反方向
    for (let i = 1; i < 5; i++) {
      const newRow = row - dr * i
      const newCol = col - dc * i
      if (isValidPosition(newRow, newCol) && board[newRow][newCol] === player) {
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
export const checkDraw = (board: Board): boolean => {
  return board.every(row => row.every(cell => cell !== null))
}

// AI评估函数 - 评估某个位置对于某个玩家的价值
const evaluatePosition = (board: Board, row: number, col: number, player: Player): number => {
  const opponent = player === 'black' ? 'white' : 'black'
  const directions = [[0, 1], [1, 0], [1, 1], [1, -1]]
  let score = 0

  for (const [dr, dc] of directions) {
    // 统计连续棋子数
    let count = 1
    let block = 0
    let empty = 0

    // 正方向
    for (let i = 1; i < 5; i++) {
      const newRow = row + dr * i
      const newCol = col + dc * i
      if (!isValidPosition(newRow, newCol)) {
        block++
        break
      }
      if (board[newRow][newCol] === player) {
        count++
      } else if (board[newRow][newCol] === null) {
        empty++
        break
      } else {
        block++
        break
      }
    }

    // 反方向
    for (let i = 1; i < 5; i++) {
      const newRow = row - dr * i
      const newCol = col - dc * i
      if (!isValidPosition(newRow, newCol)) {
        block++
        break
      }
      if (board[newRow][newCol] === player) {
        count++
      } else if (board[newRow][newCol] === null) {
        empty++
        break
      } else {
        block++
        break
      }
    }

    // 根据连子数和封堵情况评分
    if (count >= 5) {
      score += 100000
    } else if (count === 4) {
      if (block === 0) score += 10000
      else if (block === 1) score += 1000
    } else if (count === 3) {
      if (block === 0) score += 1000
      else if (block === 1) score += 100
    } else if (count === 2) {
      if (block === 0) score += 100
      else if (block === 1) score += 10
    } else if (count === 1) {
      score += 10
    }
  }

  // 如果位置在中心附近，加分
  const centerDistance = Math.abs(row - 7) + Math.abs(col - 7)
  score += Math.max(0, 14 - centerDistance) * 2

  return score
}

// AI计算最佳落子位置
export const getAIMove = (board: Board, player: Player, level: number = 2): Position | null => {
  const opponent = player === 'black' ? 'white' : 'black'
  let bestScore = -Infinity
  let bestMove: Position | null = null

  // 获取所有可能的落子位置（在已有棋子周围的空位）
  const candidates: Position[] = []
  const checked = new Set<string>()

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col] !== null) {
        // 检查周围2格范围
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const newRow = row + dr
            const newCol = col + dc
            const key = `${newRow},${newCol}`
            if (isValidPosition(newRow, newCol) && board[newRow][newCol] === null && !checked.has(key)) {
              candidates.push({ row: newRow, col: newCol })
              checked.add(key)
            }
          }
        }
      }
    }
  }

  // 如果棋盘为空，下在中心
  if (candidates.length === 0) {
    return { row: 7, col: 7 }
  }

  // 评估每个候选位置
  for (const pos of candidates) {
    // 进攻分数
    const attackScore = evaluatePosition(board, pos.row, pos.col, player)
    // 防守分数
    const defendScore = evaluatePosition(board, pos.row, pos.col, opponent)
    
    // 根据难度调整权重
    let score: number
    if (level >= 3) {
      score = attackScore + defendScore * 1.1 // 高难度更注重防守
    } else if (level >= 2) {
      score = attackScore + defendScore
    } else {
      score = attackScore * 0.8 + defendScore * 0.6 + Math.random() * 50 // 低难度有随机性
    }

    if (score > bestScore) {
      bestScore = score
      bestMove = pos
    }
  }

  return bestMove
}

// 获取获胜的五个棋子位置（用于高亮显示）
export const getWinningLine = (board: Board, row: number, col: number, player: Player): Position[] => {
  const directions = [
    [0, 1],   // 水平
    [1, 0],   // 垂直
    [1, 1],   // 对角线
    [1, -1]   // 反对角线
  ]

  for (const [dr, dc] of directions) {
    const line: Position[] = [{ row, col }]

    // 正方向
    for (let i = 1; i < 5; i++) {
      const newRow = row + dr * i
      const newCol = col + dc * i
      if (isValidPosition(newRow, newCol) && board[newRow][newCol] === player) {
        line.push({ row: newRow, col: newCol })
      } else {
        break
      }
    }

    // 反方向
    for (let i = 1; i < 5; i++) {
      const newRow = row - dr * i
      const newCol = col - dc * i
      if (isValidPosition(newRow, newCol) && board[newRow][newCol] === player) {
        line.unshift({ row: newRow, col: newCol })
      } else {
        break
      }
    }

    if (line.length >= 5) {
      return line.slice(0, 5)
    }
  }

  return []
}
