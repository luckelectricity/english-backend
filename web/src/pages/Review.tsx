import { useEffect, useState } from 'react'
import { wordApi } from '@/lib/api'
import { speak } from '@/lib/speech'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import WordWithPhonetic from '@/components/WordWithPhonetic'
import type { Context } from '@/types'
import { ChevronLeft, ChevronRight, RotateCcw, Shuffle, Volume2, Check, X } from 'lucide-react'

interface ReviewCard {
    wordId: number
    word: string
    phonetic?: string | null
    context: Context
}

// 检测是否为移动设备
const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        window.innerWidth < 768
}

export default function Review() {
    const [cards, setCards] = useState<ReviewCard[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isFlipped, setIsFlipped] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [isMobileDevice] = useState(isMobile())

    // 拼写测试相关状态（仅PC端）
    const [userInput, setUserInput] = useState('')
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
    const [showAnswer, setShowAnswer] = useState(false)

    useEffect(() => {
        loadCards()
    }, [])

    const loadCards = async () => {
        try {
            const words = await wordApi.list()
            const reviewCards: ReviewCard[] = []

            // 将每个单词的每个语境都转换为一张卡片
            words.forEach((word) => {
                word.contexts.forEach((context) => {
                    reviewCards.push({
                        wordId: word.id,
                        word: word.text,
                        phonetic: word.phonetic,
                        context,
                    })
                })
            })

            // 随机打乱
            shuffleArray(reviewCards)
            setCards(reviewCards)
        } catch (error) {
            console.error('加载复习卡片失败:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const shuffleArray = <T,>(array: T[]) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
                ;[array[i], array[j]] = [array[j], array[i]]
        }
    }

    const handleShuffle = () => {
        const newCards = [...cards]
        shuffleArray(newCards)
        setCards(newCards)
        setCurrentIndex(0)
        resetCardState()
    }

    const resetCardState = () => {
        setIsFlipped(false)
        setUserInput('')
        setIsCorrect(null)
        setShowAnswer(false)
    }

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1)
            resetCardState()
        }
    }

    const handleNext = () => {
        if (currentIndex < cards.length - 1) {
            setCurrentIndex(currentIndex + 1)
            resetCardState()
        }
    }

    const handleFlip = () => {
        if (isMobileDevice) {
            setIsFlipped(!isFlipped)
        }
    }

    // PC端：检查拼写
    const handleCheckSpelling = () => {
        const correct = userInput.trim().toLowerCase() === currentCard.word.toLowerCase()
        setIsCorrect(correct)
        setShowAnswer(true)
    }

    // PC端：按Enter键提交
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && userInput.trim() && !showAnswer) {
            handleCheckSpelling()
        }
    }

    // 挖空句子：将单词替换为下划线
    const getBlankSentence = (sentence: string, word: string): string => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi')
        return sentence.replace(regex, '______')
    }

    const currentCard = cards[currentIndex]

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-muted-foreground">加载中...</div>
            </div>
        )
    }

    if (cards.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-96 space-y-4">
                <div className="text-muted-foreground">还没有可复习的单词</div>
                <Button onClick={() => (window.location.href = '/words')}>去添加单词</Button>
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">复习模式</h1>
                    <p className="text-muted-foreground">翻卡片学习单词</p>
                </div>
                <Button variant="outline" onClick={handleShuffle}>
                    <Shuffle className="mr-2 h-4 w-4" />
                    随机打乱
                </Button>
            </div>

            {/* 进度指示器 */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                    卡片 {currentIndex + 1} / {cards.length}
                </span>
                <span>点击卡片翻转</span>
            </div>

            {/* 翻卡片 */}
            <div className="perspective-1000">
                {isMobileDevice ? (
                    // 移动端：翻卡片模式
                    <Card
                        className="min-h-[400px] cursor-pointer transition-all duration-500"
                        onClick={handleFlip}
                        style={{
                            transformStyle: 'preserve-3d',
                            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                        }}
                    >
                        {!isFlipped ? (
                            <CardContent className="flex flex-col items-center justify-center min-h-[400px] p-8">
                                <div className="text-center space-y-6">
                                    <div className="text-sm text-muted-foreground uppercase tracking-wide">
                                        填空题
                                    </div>
                                    <div className="text-2xl leading-relaxed">
                                        {getBlankSentence(currentCard.context.sentence, currentCard.word)}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            speak(currentCard.context.sentence, 'en-US')
                                        }}
                                    >
                                        <Volume2 className="mr-2 h-4 w-4" />
                                        朗读句子
                                    </Button>
                                    <div className="text-sm text-muted-foreground">
                                        点击查看答案
                                    </div>
                                </div>
                            </CardContent>
                        ) : (
                            <CardContent
                                className="flex flex-col items-center justify-center min-h-[400px] p-8"
                                style={{ transform: 'rotateY(180deg)' }}
                            >
                                <div className="text-center space-y-6">
                                    <div className="text-sm text-muted-foreground uppercase tracking-wide">
                                        答案
                                    </div>
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <WordWithPhonetic
                                            wordId={currentCard.wordId}
                                            word={currentCard.word}
                                            phonetic={currentCard.phonetic}
                                        />
                                    </div>
                                    <div className="text-xl text-muted-foreground">
                                        {currentCard.context.meaning}
                                    </div>
                                    <div className="pt-4 border-t w-full">
                                        <div className="text-sm text-muted-foreground mb-2">完整句子：</div>
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="text-lg flex-1 text-center">
                                                {currentCard.context.sentence}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 flex-shrink-0"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    speak(currentCard.context.sentence, 'en-US')
                                                }}
                                                title="朗读句子"
                                            >
                                                <Volume2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        )}
                    </Card>
                ) : (
                    // PC端：拼写测试模式
                    <Card className="min-h-[400px]">
                        <CardContent className="flex flex-col items-center justify-center min-h-[400px] p-8">
                            <div className="text-center space-y-6 w-full max-w-md">
                                <div className="text-sm text-muted-foreground uppercase tracking-wide">
                                    拼写测试
                                </div>
                                <div className="text-2xl leading-relaxed">
                                    {getBlankSentence(currentCard.context.sentence, currentCard.word)}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => speak(currentCard.context.sentence, 'en-US')}
                                >
                                    <Volume2 className="mr-2 h-4 w-4" />
                                    朗读句子
                                </Button>

                                {!showAnswer ? (
                                    // 输入阶段
                                    <div className="space-y-4">
                                        <div className="text-sm text-muted-foreground">
                                            请输入缺失的单词：
                                        </div>
                                        <div className="flex gap-2">
                                            <Input
                                                value={userInput}
                                                onChange={(e) => setUserInput(e.target.value)}
                                                onKeyPress={handleKeyPress}
                                                placeholder="输入单词..."
                                                className="text-center text-lg"
                                                autoFocus
                                            />
                                            <Button
                                                onClick={handleCheckSpelling}
                                                disabled={!userInput.trim()}
                                            >
                                                <Check className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    // 答案显示阶段
                                    <div className="space-y-4">
                                        {isCorrect ? (
                                            <div className="flex items-center justify-center gap-2 text-green-600">
                                                <Check className="h-6 w-6" />
                                                <span className="text-lg font-semibold">正确！</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center gap-2 text-red-600">
                                                <X className="h-6 w-6" />
                                                <span className="text-lg font-semibold">
                                                    错误，你输入的是：{userInput}
                                                </span>
                                            </div>
                                        )}
                                        <div className="pt-4 border-t">
                                            <div className="text-sm text-muted-foreground mb-2">正确答案：</div>
                                            <WordWithPhonetic
                                                wordId={currentCard.wordId}
                                                word={currentCard.word}
                                                phonetic={currentCard.phonetic}
                                            />
                                            <div className="text-lg text-muted-foreground mt-2">
                                                {currentCard.context.meaning}
                                            </div>
                                        </div>
                                        <div className="pt-4 border-t">
                                            <div className="text-sm text-muted-foreground mb-2">完整句子：</div>
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="text-base flex-1 text-center">
                                                    {currentCard.context.sentence}
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => speak(currentCard.context.sentence, 'en-US')}
                                                    title="朗读句子"
                                                >
                                                    <Volume2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* 导航按钮 */}
            <div className="flex items-center justify-center gap-4">
                <Button
                    variant="outline"
                    size="lg"
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    上一个
                </Button>
                {isMobileDevice && (
                    <Button variant="outline" size="lg" onClick={handleFlip}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        翻转
                    </Button>
                )}
                <Button
                    variant="outline"
                    size="lg"
                    onClick={handleNext}
                    disabled={currentIndex === cards.length - 1}
                >
                    下一个
                    <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
            </div>

            {/* 进度条 */}
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                    className="h-full bg-primary transition-all"
                    style={{
                        width: `${((currentIndex + 1) / cards.length) * 100}%`,
                    }}
                />
            </div>
        </div>
    )
}
