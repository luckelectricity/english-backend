import { useEffect, useState } from 'react'
import { wordApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Word, Context } from '@/types'
import { ChevronLeft, ChevronRight, RotateCcw, Shuffle } from 'lucide-react'

interface ReviewCard {
    word: string
    context: Context
}

export default function Review() {
    const [cards, setCards] = useState<ReviewCard[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isFlipped, setIsFlipped] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

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
                        word: word.text,
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
        setIsFlipped(false)
    }

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1)
            setIsFlipped(false)
        }
    }

    const handleNext = () => {
        if (currentIndex < cards.length - 1) {
            setCurrentIndex(currentIndex + 1)
            setIsFlipped(false)
        }
    }

    const handleFlip = () => {
        setIsFlipped(!isFlipped)
    }

    // 挖空句子：将单词替换为下划线
    const getBlankSentence = (sentence: string, word: string): string => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi')
        return sentence.replace(regex, '______')
    }

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

    const currentCard = cards[currentIndex]

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
                <Card
                    className={`min-h-[400px] cursor-pointer transition-all duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''
                        }`}
                    onClick={handleFlip}
                    style={{
                        transformStyle: 'preserve-3d',
                        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    }}
                >
                    {!isFlipped ? (
                        // 正面：挖空的句子
                        <CardContent className="flex flex-col items-center justify-center min-h-[400px] p-8 backface-hidden">
                            <div className="text-center space-y-6">
                                <div className="text-sm text-muted-foreground uppercase tracking-wide">
                                    填空题
                                </div>
                                <div className="text-2xl leading-relaxed">
                                    {getBlankSentence(currentCard.context.sentence, currentCard.word)}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    点击查看答案
                                </div>
                            </div>
                        </CardContent>
                    ) : (
                        // 背面：单词 + 释义
                        <CardContent
                            className="flex flex-col items-center justify-center min-h-[400px] p-8 backface-hidden"
                            style={{
                                transform: 'rotateY(180deg)',
                            }}
                        >
                            <div className="text-center space-y-6">
                                <div className="text-sm text-muted-foreground uppercase tracking-wide">
                                    答案
                                </div>
                                <div className="text-5xl font-bold text-primary">{currentCard.word}</div>
                                <div className="text-xl text-muted-foreground">
                                    {currentCard.context.meaning}
                                </div>
                                <div className="pt-4 border-t">
                                    <div className="text-sm text-muted-foreground mb-2">完整句子：</div>
                                    <div className="text-lg">{currentCard.context.sentence}</div>
                                </div>
                            </div>
                        </CardContent>
                    )}
                </Card>
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
                <Button variant="outline" size="lg" onClick={handleFlip}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    翻转
                </Button>
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
