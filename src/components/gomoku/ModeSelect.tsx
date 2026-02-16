'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bot, Users, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Slider } from '@/components/ui/slider'
import { useGomokuStore, getPlayerId } from '@/stores/gomoku-store'
import { Player } from '@/lib/gomoku'
import { io, Socket } from 'socket.io-client'

interface ModeSelectProps {
  onStartAI: (playerColor: Player, aiLevel: number) => void
  onStartOnline: () => void
}

export function ModeSelect({ onStartAI, onStartOnline }: ModeSelectProps) {
  const [playerColor, setPlayerColor] = useState<Player>('black')
  const [aiLevel, setAiLevel] = useState(2)

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 bg-clip-text text-transparent">
          五子棋
        </h1>
        <p className="text-muted-foreground text-lg">
          经典策略对战游戏
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* 人机模式 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="h-full hover:shadow-lg transition-shadow border-2 hover:border-primary/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Bot className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle>人机对战</CardTitle>
                  <CardDescription>挑战AI，提升棋艺</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 选择执子颜色 */}
              <div className="space-y-3">
                <Label className="text-base">选择执子</Label>
                <RadioGroup
                  value={playerColor}
                  onValueChange={(value) => setPlayerColor(value as Player)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="black" id="black" />
                    <Label htmlFor="black" className="flex items-center gap-2 cursor-pointer">
                      <div 
                        className="w-5 h-5 rounded-full"
                        style={{
                          background: 'radial-gradient(circle at 35% 35%, #555 0%, #222 50%, #111 100%)',
                        }}
                      />
                      黑棋（先手）
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="white" id="white" />
                    <Label htmlFor="white" className="flex items-center gap-2 cursor-pointer">
                      <div 
                        className="w-5 h-5 rounded-full"
                        style={{
                          background: 'radial-gradient(circle at 35% 35%, #fff 0%, #eee 50%, #ccc 100%)',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        }}
                      />
                      白棋（后手）
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* AI难度 */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-base">AI难度</Label>
                  <span className="text-sm text-muted-foreground">
                    {aiLevel === 1 ? '简单' : aiLevel === 2 ? '中等' : '困难'}
                  </span>
                </div>
                <Slider
                  value={[aiLevel]}
                  onValueChange={([value]) => setAiLevel(value)}
                  min={1}
                  max={3}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>简单</span>
                  <span>中等</span>
                  <span>困难</span>
                </div>
              </div>

              <Button 
                className="w-full" 
                size="lg"
                onClick={() => onStartAI(playerColor, aiLevel)}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                开始游戏
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* 玩家对战 */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="h-full hover:shadow-lg transition-shadow border-2 hover:border-primary/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle>玩家对战</CardTitle>
                  <CardDescription>创建房间，邀请好友</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col justify-between min-h-[240px]">
              <div className="space-y-4 text-muted-foreground">
                <p className="text-sm">
                  创建一个游戏房间，分享链接给好友，双方点击准备后即可开始对局。
                </p>
                <ul className="text-sm space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    实时对战，同步棋盘状态
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    悔棋和重新开始需双方确认
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    黑棋先手，一局一换
                  </li>
                </ul>
              </div>
              <Button 
                className="w-full mt-4" 
                size="lg"
                onClick={onStartOnline}
              >
                <Users className="w-4 h-4 mr-2" />
                创建房间
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
