'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bot, Users, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Slider } from '@/components/ui/slider'
import { Player } from '@/lib/gomoku'

interface ModeSelectProps {
  onStartAI: (playerColor: Player, aiLevel: number) => void
  onStartOnline: () => void
}

export function ModeSelect({ onStartAI, onStartOnline }: ModeSelectProps) {
  const [playerColor, setPlayerColor] = useState<Player>('black')
  const [aiLevel, setAiLevel] = useState(2)

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-6"
      >
        <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 bg-clip-text text-transparent">
          五子棋
        </h1>
        <p className="text-muted-foreground">经典策略对战游戏</p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* 人机模式 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="h-full hover:shadow-lg transition-shadow border-2 hover:border-primary/50 flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">人机对战</CardTitle>
                  <CardDescription>挑战AI，提升棋艺</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="flex-1 space-y-4">
                {/* 选择执子颜色 */}
                <div className="space-y-2">
                  <Label className="text-sm">选择执子</Label>
                  <RadioGroup
                    value={playerColor}
                    onValueChange={(value) => setPlayerColor(value as Player)}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="black" id="black" />
                      <Label htmlFor="black" className="flex items-center gap-2 cursor-pointer text-sm">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{
                            background: 'radial-gradient(circle at 35% 35%, #555 0%, #222 50%, #111 100%)',
                          }}
                        />
                        黑棋先手
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="white" id="white" />
                      <Label htmlFor="white" className="flex items-center gap-2 cursor-pointer text-sm">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{
                            background: 'radial-gradient(circle at 35% 35%, #fff 0%, #eee 50%, #ccc 100%)',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                          }}
                        />
                        白棋后手
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* AI难度 */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm">AI难度</Label>
                    <span className="text-xs text-muted-foreground">
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
                </div>
              </div>

              <Button 
                className="w-full mt-4" 
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
          <Card className="h-full hover:shadow-lg transition-shadow border-2 hover:border-primary/50 flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">玩家对战</CardTitle>
                  <CardDescription>创建房间，邀请好友</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="flex-1 text-muted-foreground text-sm">
                <p className="mb-3">创建房间后分享链接给好友，双方准备后即可开始。</p>
                <ul className="space-y-1.5">
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-primary" />
                    实时同步棋盘状态
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-primary" />
                    支持悔棋和重开
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-primary" />
                    黑棋先手轮流
                  </li>
                </ul>
              </div>
              <Button 
                className="w-full mt-4" 
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
