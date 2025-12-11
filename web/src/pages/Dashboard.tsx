import { useEffect, useState } from 'react'
import { wordApi } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Word, OxfordProgress } from '@/types'
import { BookOpen, TrendingUp, Target, Calendar } from 'lucide-react'

export default function Dashboard() {
    const [words, setWords] = useState<Word[]>([])
    const [oxfordProgress, setOxfordProgress] = useState<OxfordProgress | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const [wordsData, progressData] = await Promise.all([
                wordApi.list(),
                wordApi.getOxfordProgress(),
            ])
            setWords(wordsData)
            setOxfordProgress(progressData)
        } catch (error) {
            console.error('加载数据失败:', error)
        } finally {
            setIsLoading(false)
        }
    }

    // 计算今日新增单词数
    const todayWords = words.filter((word) => {
        const today = new Date().toDateString()
        const wordDate = new Date(word.createdAt).toDateString()
        return today === wordDate
    }).length

    // 计算总语境数
    const totalContexts = words.reduce((sum, word) => sum + word.contexts.length, 0)

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-muted-foreground">加载中...</div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">欢迎回来，继续您的学习之旅</p>
            </div>

            {/* 统计卡片 */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">今日新增</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{todayWords}</div>
                        <p className="text-xs text-muted-foreground">个单词</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">累计单词</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{words.length}</div>
                        <p className="text-xs text-muted-foreground">个单词</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">语境总数</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalContexts}</div>
                        <p className="text-xs text-muted-foreground">个例句</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">牛津3000词</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {oxfordProgress?.learned || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            / {oxfordProgress?.total || 3000} 已掌握
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* 牛津3000词进度详情 */}
            {oxfordProgress && (
                <Card>
                    <CardHeader>
                        <CardTitle>牛津3000词进度</CardTitle>
                        <CardDescription>按难度级别统计</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {Object.entries(oxfordProgress.byLevel).map(([level, data]) => (
                                <div key={level} className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium">{level}</span>
                                        <span className="text-muted-foreground">
                                            {data.learned} / {data.total}
                                        </span>
                                    </div>
                                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary transition-all"
                                            style={{
                                                width: `${data.total > 0 ? (data.learned / data.total) * 100 : 0}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
