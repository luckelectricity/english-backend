import { useEffect, useState } from 'react'
import { wordApi, aiApi } from '@/lib/api'
import { speak } from '@/lib/speech'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import WordWithPhonetic from '@/components/WordWithPhonetic'
import type { Word } from '@/types'
import { Plus, Trash2, ChevronDown, ChevronUp, Search, Volume2, Sparkles, RotateCw, ArrowLeft } from 'lucide-react'

export default function WordList() {
    const [words, setWords] = useState<Word[]>([])
    const [filteredWords, setFilteredWords] = useState<Word[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [isLoading, setIsLoading] = useState(true)


    // 添加单词对话框状态
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [newWord, setNewWord] = useState({
        word: '',
        sentence: '',
        meaning: '',
        sourceUrl: '',
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    // 删除确认对话框
    const [wordToDelete, setWordToDelete] = useState<number | null>(null)

    // 翻转卡片和 AI 内容状态
    const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({}) // key: wordId-contextId
    const [aiContent, setAiContent] = useState<Record<string, import('@/types').AiExpandResponse>>({})
    const [loadingAi, setLoadingAi] = useState<Record<string, boolean>>({})

    useEffect(() => {
        loadWords()
    }, [])

    useEffect(() => {
        // 搜索过滤
        if (searchQuery.trim() === '') {
            setFilteredWords(words)
        } else {
            const query = searchQuery.toLowerCase()
            setFilteredWords(
                words.filter(
                    (word) =>
                        word.text.toLowerCase().includes(query) ||
                        word.contexts.some((ctx) => ctx.meaning.toLowerCase().includes(query))
                )
            )
        }
    }, [searchQuery, words])

    const loadWords = async () => {
        try {
            const data = await wordApi.list()
            setWords(data)
            setFilteredWords(data)
        } catch (error) {
            console.error('加载单词失败:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleAddWord = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            await wordApi.create(newWord)
            setIsAddDialogOpen(false)
            setNewWord({ word: '', sentence: '', meaning: '', sourceUrl: '' })
            await loadWords()
        } catch (error: any) {
            alert(error.response?.data?.message || '添加失败，请稍后重试')
        } finally {
            setIsSubmitting(false)
        }
    }

    const confirmDelete = async () => {
        if (!wordToDelete) return

        try {
            await wordApi.delete(wordToDelete)
            await loadWords()
            setWordToDelete(null)
        } catch (error) {
            alert('删除失败，请稍后重试')
        }
    }

    const handleFlip = async (wordId: number, contextId: number, word: string, sentence: string) => {
        const key = `${wordId}-${contextId}`
        const isFlipping = !flippedCards[key]

        setFlippedCards(prev => ({ ...prev, [key]: isFlipping }))

        // 如果翻转到背面且没有 AI 内容，则请求 AI
        if (isFlipping && !aiContent[key] && !loadingAi[key]) {
            setLoadingAi(prev => ({ ...prev, [key]: true }))
            try {
                const data = await aiApi.expand(word, sentence)
                setAiContent(prev => ({ ...prev, [key]: data }))
            } catch (error) {
                console.error('AI 分析失败:', error)
                // 出错时翻转回来并在之后显示错误提示（这里简化处理）
                setFlippedCards(prev => ({ ...prev, [key]: false }))
                alert('获取 AI 解析失败，请稍后重试')
            } finally {
                setLoadingAi(prev => ({ ...prev, [key]: false }))
            }
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-muted-foreground">加载中...</div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">生词本</h1>
                    <p className="text-muted-foreground">管理您的学习单词</p>
                </div>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    添加单词
                </Button>
            </div>

            {/* 搜索框 */}
            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="搜索单词或释义..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <span className="text-sm text-muted-foreground">
                    共 {filteredWords.length} 个单词
                </span>
            </div>

            {/* 单词列表 - 卡片网格视图 */}
            {filteredWords.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    {searchQuery ? '没有找到匹配的单词' : '还没有添加单词，点击上方按钮开始添加'}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredWords.map((word) =>
                        word.contexts.map((ctx) => {
                            const cardKey = `${word.id}-${ctx.id}`
                            const isFlipped = flippedCards[cardKey]
                            const aiData = aiContent[cardKey]
                            const isLoading = loadingAi[cardKey]

                            return (
                                <div key={cardKey} className="relative h-[400px] w-full perspective-1000 group">
                                    <div
                                        className={`relative w-full h-full transition-all duration-500 transform-style-3d shadow-sm rounded-xl border bg-card text-card-foreground ${isFlipped ? 'rotate-y-180' : ''
                                            }`}
                                    >
                                        {/* 正面 */}
                                        <div className="absolute w-full h-full backface-hidden flex flex-col p-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <WordWithPhonetic
                                                    wordId={word.id}
                                                    word={word.text}
                                                    phonetic={word.phonetic}
                                                />
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                        onClick={() => handleFlip(word.id, ctx.id, word.text, ctx.sentence)}
                                                        title="AI 详解"
                                                    >
                                                        <Sparkles className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setWordToDelete(word.id)
                                                        }}
                                                        title="删除单词"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="flex-1 flex flex-col justify-center space-y-6">
                                                <div className="space-y-2 text-center">
                                                    <div className="text-lg font-medium leading-relaxed">
                                                        {ctx.sentence}
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 text-muted-foreground"
                                                        onClick={() => speak(ctx.sentence, 'en-US')}
                                                    >
                                                        <Volume2 className="h-3 w-3 mr-1" />
                                                        朗读
                                                    </Button>
                                                </div>

                                                <div className="text-center">
                                                    <div className="text-sm text-muted-foreground uppercase tracking-wider mb-1">
                                                        释义
                                                    </div>
                                                    <div className="text-base">
                                                        {ctx.meaning}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-auto pt-4 border-t flex justify-between items-center text-xs text-muted-foreground">
                                                <span>{new Date(word.createdAt).toLocaleDateString('zh-CN')}</span>
                                                {ctx.sourceUrl && (
                                                    <a
                                                        href={ctx.sourceUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="hover:underline truncate max-w-[150px]"
                                                    >
                                                        来源链接
                                                    </a>
                                                )}
                                            </div>
                                        </div>

                                        {/* 背面 (AI 内容) */}
                                        <div className="absolute w-full h-full backface-hidden rotate-y-180 flex flex-col p-6 bg-secondary/10 overflow-hidden">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2 text-primary font-medium">
                                                    <Sparkles className="h-4 w-4" />
                                                    AI 详解
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => handleFlip(word.id, ctx.id, word.text, ctx.sentence)}
                                                >
                                                    <ArrowLeft className="h-4 w-4" />
                                                </Button>
                                            </div>

                                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                                {isLoading ? (
                                                    <div className="flex flex-col items-center justify-center h-full space-y-3 text-muted-foreground">
                                                        <RotateCw className="h-6 w-6 animate-spin" />
                                                        <span className="text-sm">AI 正在思考中...</span>
                                                    </div>
                                                ) : aiData ? (
                                                    <div className="space-y-4 text-sm">
                                                        <div className="bg-background rounded-lg p-3 shadow-sm">
                                                            <div className="font-semibold mb-1 text-primary">核心讲解</div>
                                                            <p className="leading-relaxed text-muted-foreground">
                                                                {aiData.explanation}
                                                            </p>
                                                        </div>

                                                        <div className="space-y-3">
                                                            <div className="font-semibold text-primary">拓展例句</div>
                                                            {aiData.examples.map((ex, idx) => (
                                                                <div key={idx} className="bg-background rounded-lg p-3 shadow-sm space-y-1">
                                                                    <div className="text-foreground">{ex.sentence}</div>
                                                                    <div className="text-xs text-muted-foreground">{ex.translation}</div>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-5 w-5 ml-auto -mt-6"
                                                                        onClick={() => speak(ex.sentence, 'en-US')}
                                                                    >
                                                                        <Volume2 className="h-3 w-3" />
                                                                    </Button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-center h-full text-muted-foreground">
                                                        加载失败
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            )}

            {/* 添加单词对话框 */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>添加新单词</DialogTitle>
                        <DialogDescription>手动添加一个新的学习单词</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddWord}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="word">单词 *</Label>
                                <Input
                                    id="word"
                                    placeholder="例如：service"
                                    value={newWord.word}
                                    onChange={(e) => setNewWord({ ...newWord, word: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sentence">例句 *</Label>
                                <Input
                                    id="sentence"
                                    placeholder="包含该单词的完整句子"
                                    value={newWord.sentence}
                                    onChange={(e) => setNewWord({ ...newWord, sentence: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="meaning">释义 *</Label>
                                <Input
                                    id="meaning"
                                    placeholder="在该语境下的中文释义"
                                    value={newWord.meaning}
                                    onChange={(e) => setNewWord({ ...newWord, meaning: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sourceUrl">来源 URL（可选）</Label>
                                <Input
                                    id="sourceUrl"
                                    type="url"
                                    placeholder="https://example.com"
                                    value={newWord.sourceUrl}
                                    onChange={(e) => setNewWord({ ...newWord, sourceUrl: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsAddDialogOpen(false)}
                            >
                                取消
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? '添加中...' : '添加'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* 删除确认对话框 */}
            <Dialog open={!!wordToDelete} onOpenChange={(open) => !open && setWordToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>确认删除</DialogTitle>
                        <DialogDescription>
                            您确定要删除这个单词吗？此操作无法撤销。
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setWordToDelete(null)}
                        >
                            取消
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDelete}
                        >
                            删除
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
