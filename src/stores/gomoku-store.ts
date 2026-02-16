import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { 
  Board, 
  Player, 
  GameStatus, 
  GameMode, 
  Move, 
  Position,
  initBoard, 
  checkWin, 
  checkDraw, 
  getAIMove,
  getWinningLine,
  BOARD_SIZE 
} from '@/lib/gomoku'

interface SingleGameState {
  board: Board
  currentTurn: Player
  moves: Move[]
  history: { board: Board; turn: Player }[]
  status: GameStatus
  winner: Player | 'draw' | null
  playerColor: Player
  aiLevel: number
  winningLine: Position[]
  undoRequest: boolean
  restartRequest: boolean
}

interface OnlineGameState {
  roomId: string | null
  playerId: string | null
  playerColor: Player | null
  opponentConnected: boolean
  opponentReady: boolean
  playerReady: boolean
  blackFirst: boolean
  undoRequestFrom: string | null
  restartRequestFrom: string | null
}

interface GomokuState {
  // 游戏模式
  mode: GameMode | null
  
  // 单机游戏状态
  singleGame: SingleGameState
  
  // 在线游戏状态
  onlineGame: OnlineGameState
  
  // 共享游戏状态
  board: Board
  currentTurn: Player
  moves: Move[]
  history: { board: Board; turn: Player }[]
  status: GameStatus
  winner: Player | 'draw' | null
  winningLine: Position[]
  
  // Actions
  setMode: (mode: GameMode) => void
  startSingleGame: (playerColor: Player, aiLevel: number) => void
  startOnlineGame: (roomId: string, playerId: string, playerColor: Player) => void
  makeMove: (row: number, col: number) => boolean
  undoMove: () => void
  requestUndo: () => void
  respondUndo: (accept: boolean) => void
  requestRestart: () => void
  respondRestart: (accept: boolean) => void
  resetGame: () => void
  updateFromServer: (data: Partial<GomokuState>) => void
  setOnlineBoard: (board: Board, currentTurn: Player, moves: Move[]) => void
  setPlayerReady: (ready: boolean) => void
  setOnlineStatus: (status: GameStatus) => void
}

const initialSingleGame: SingleGameState = {
  board: initBoard(),
  currentTurn: 'black',
  moves: [],
  history: [],
  status: 'idle',
  winner: null,
  playerColor: 'black',
  aiLevel: 2,
  winningLine: [],
  undoRequest: false,
  restartRequest: false,
}

const initialOnlineGame: OnlineGameState = {
  roomId: null,
  playerId: null,
  playerColor: null,
  opponentConnected: false,
  opponentReady: false,
  playerReady: false,
  blackFirst: true,
  undoRequestFrom: null,
  restartRequestFrom: null,
}

export const useGomokuStore = create<GomokuState>()(
  persist(
    (set, get) => ({
      mode: null,
      singleGame: { ...initialSingleGame },
      onlineGame: { ...initialOnlineGame },
      board: initBoard(),
      currentTurn: 'black',
      moves: [],
      history: [],
      status: 'idle',
      winner: null,
      winningLine: [],

      setMode: (mode) => {
        set({ 
          mode, 
          status: mode === 'online' ? 'waiting' : 'idle' 
        })
      },

      startSingleGame: (playerColor, aiLevel) => {
        const state: SingleGameState = {
          board: initBoard(),
          currentTurn: 'black',
          moves: [],
          history: [],
          status: 'playing',
          winner: null,
          playerColor,
          aiLevel,
          winningLine: [],
          undoRequest: false,
          restartRequest: false,
        }
        
        set({
          mode: 'ai',
          singleGame: state,
          board: state.board,
          currentTurn: state.currentTurn,
          moves: state.moves,
          history: state.history,
          status: state.status,
          winner: state.winner,
          winningLine: state.winningLine,
        })

        // 如果AI先手，让AI走一步
        if (playerColor === 'white') {
          setTimeout(() => {
            const aiMove = getAIMove(initBoard(), 'black', aiLevel)
            if (aiMove) {
              get().makeMove(aiMove.row, aiMove.col)
            }
          }, 500)
        }
      },

      startOnlineGame: (roomId, playerId, playerColor) => {
        set({
          mode: 'online',
          onlineGame: {
            ...initialOnlineGame,
            roomId,
            playerId,
            playerColor,
          },
          board: initBoard(),
          currentTurn: 'black',
          moves: [],
          history: [],
          status: 'waiting',
          winner: null,
          winningLine: [],
        })
      },

      makeMove: (row, col) => {
        const state = get()
        
        if (state.status !== 'playing') return false
        if (state.board[row][col] !== null) return false

        // 在线模式检查是否轮到自己
        if (state.mode === 'online' && state.onlineGame.playerColor !== state.currentTurn) {
          return false
        }

        // 单机模式检查是否轮到玩家
        if (state.mode === 'ai' && state.singleGame.playerColor !== state.currentTurn) {
          return false
        }

        const newBoard = state.board.map(r => [...r])
        newBoard[row][col] = state.currentTurn
        
        const newMove: Move = {
          row,
          col,
          player: state.currentTurn,
          timestamp: Date.now(),
        }

        const newHistory = [...state.history, { 
          board: state.board.map(r => [...r]), 
          turn: state.currentTurn 
        }]

        const won = checkWin(newBoard, row, col, state.currentTurn)
        const draw = checkDraw(newBoard)
        
        let newStatus = state.status
        let newWinner = state.winner
        let newWinningLine: Position[] = []
        
        if (won) {
          newStatus = 'finished'
          newWinner = state.currentTurn
          newWinningLine = getWinningLine(newBoard, row, col, state.currentTurn)
        } else if (draw) {
          newStatus = 'finished'
          newWinner = 'draw'
        }

        const nextTurn = state.currentTurn === 'black' ? 'white' : 'black'

        set({
          board: newBoard,
          currentTurn: nextTurn,
          moves: [...state.moves, newMove],
          history: newHistory,
          status: newStatus,
          winner: newWinner,
          winningLine: newWinningLine,
        })

        // 单机模式下，如果游戏未结束且轮到AI，让AI走
        if (state.mode === 'ai' && newStatus === 'playing') {
          const aiColor = state.singleGame.playerColor === 'black' ? 'white' : 'black'
          if (nextTurn === aiColor) {
            setTimeout(() => {
              const currentState = get()
              const aiMove = getAIMove(currentState.board, aiColor, state.singleGame.aiLevel)
              if (aiMove && currentState.status === 'playing') {
                // AI落子
                const aiBoard = currentState.board.map(r => [...r])
                aiBoard[aiMove.row][aiMove.col] = aiColor
                
                const aiMoveRecord: Move = {
                  row: aiMove.row,
                  col: aiMove.col,
                  player: aiColor,
                  timestamp: Date.now(),
                }

                const aiHistory = [...currentState.history, { 
                  board: currentState.board.map(r => [...r]), 
                  turn: aiColor 
                }]

                const aiWon = checkWin(aiBoard, aiMove.row, aiMove.col, aiColor)
                const aiDraw = checkDraw(aiBoard)
                
                let aiStatus = currentState.status
                let aiWinner = currentState.winner
                let aiWinningLine: Position[] = []
                
                if (aiWon) {
                  aiStatus = 'finished'
                  aiWinner = aiColor
                  aiWinningLine = getWinningLine(aiBoard, aiMove.row, aiMove.col, aiColor)
                } else if (aiDraw) {
                  aiStatus = 'finished'
                  aiWinner = 'draw'
                }

                set({
                  board: aiBoard,
                  currentTurn: aiColor === 'black' ? 'white' : 'black',
                  moves: [...currentState.moves, aiMoveRecord],
                  history: aiHistory,
                  status: aiStatus,
                  winner: aiWinner,
                  winningLine: aiWinningLine,
                })
              }
            }, 300)
          }
        }

        return true
      },

      undoMove: () => {
        const state = get()
        
        if (state.mode !== 'ai') return
        if (state.history.length < 2) return // 至少需要两步才能悔棋（双方各一步）
        
        // 单机模式：撤销玩家的最后一步和AI的最后一步
        const aiColor = state.singleGame.playerColor === 'black' ? 'white' : 'black'
        const playerColor = state.singleGame.playerColor
        
        // 找到玩家的最后一步
        let playerLastMoveIndex = -1
        let aiLastMoveIndex = -1
        
        for (let i = state.moves.length - 1; i >= 0; i--) {
          if (state.moves[i].player === playerColor && playerLastMoveIndex === -1) {
            playerLastMoveIndex = i
          }
          if (state.moves[i].player === aiColor && aiLastMoveIndex === -1) {
            aiLastMoveIndex = i
          }
          if (playerLastMoveIndex !== -1 && aiLastMoveIndex !== -1) break
        }
        
        if (playerLastMoveIndex === -1) return
        
        // 计算撤销后的状态
        const keepMoves = Math.min(playerLastMoveIndex, aiLastMoveIndex === -1 ? state.moves.length : aiLastMoveIndex)
        const newMoves = state.moves.slice(0, keepMoves)
        
        // 重建棋盘
        const newBoard = initBoard()
        for (const move of newMoves) {
          newBoard[move.row][move.col] = move.player
        }
        
        set({
          board: newBoard,
          currentTurn: playerColor,
          moves: newMoves,
          history: state.history.slice(0, keepMoves),
          status: 'playing',
          winner: null,
          winningLine: [],
        })
      },

      requestUndo: () => {
        const state = get()
        if (state.mode === 'ai') {
          get().undoMove()
        } else {
          set((s) => ({
            onlineGame: { ...s.onlineGame, undoRequestFrom: s.onlineGame.playerId }
          }))
        }
      },

      respondUndo: (accept) => {
        if (accept) {
          get().undoMove()
        }
        set((s) => ({
          onlineGame: { ...s.onlineGame, undoRequestFrom: null }
        }))
      },

      requestRestart: () => {
        const state = get()
        if (state.mode === 'ai') {
          get().startSingleGame(state.singleGame.playerColor, state.singleGame.aiLevel)
        } else {
          set((s) => ({
            onlineGame: { ...s.onlineGame, restartRequestFrom: s.onlineGame.playerId }
          }))
        }
      },

      respondRestart: (accept) => {
        if (accept) {
          get().resetGame()
        }
        set((s) => ({
          onlineGame: { ...s.onlineGame, restartRequestFrom: null }
        }))
      },

      resetGame: () => {
        set({
          board: initBoard(),
          currentTurn: 'black',
          moves: [],
          history: [],
          status: 'idle',
          winner: null,
          winningLine: [],
        })
      },

      updateFromServer: (data) => {
        set(data)
      },

      setOnlineBoard: (board, currentTurn, moves) => {
        set({ board, currentTurn, moves })
      },

      setPlayerReady: (ready) => {
        set((s) => ({
          onlineGame: { ...s.onlineGame, playerReady: ready }
        }))
      },

      setOnlineStatus: (status) => {
        set({ status })
      },
    }),
    {
      name: 'gomoku-storage',
      partialize: (state) => ({
        mode: state.mode,
        singleGame: state.singleGame,
        onlineGame: state.onlineGame,
        board: state.board,
        currentTurn: state.currentTurn,
        moves: state.moves,
        history: state.history,
        status: state.status,
        winner: state.winner,
        winningLine: state.winningLine,
      }),
    }
  )
)

// 生成唯一玩家ID
export const generatePlayerId = (): string => {
  return `player_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

// 获取或创建玩家ID
export const getPlayerId = (): string => {
  if (typeof window === 'undefined') return ''
  let playerId = localStorage.getItem('gomoku-player-id')
  if (!playerId) {
    playerId = generatePlayerId()
    localStorage.setItem('gomoku-player-id', playerId)
  }
  return playerId
}
