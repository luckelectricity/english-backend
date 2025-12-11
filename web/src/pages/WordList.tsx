import { useEffect, useState } from 'react'
import { wordApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Word } from '@/types'
import { Plus, Trash2, ChevronDown, ChevronUp, Search } from 'lucide-react'

export default function WordList() {
    const [words, setWords] = useState<Word[]>([])
    const [filteredWords, setFilteredWords] = useState<Word[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [expandedWordId, setExpandedWordId] = useState<number | null>(null)

    // 添加单词对话框状态
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [newWord, setNewWord] = useState({
        word: '',
        sentence: '',
        meaning: '',
        sourceUrl: '',
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

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

    const handleDelete = async (id: number) => {
        if (!confirm('确定要删除这个单词吗？')) return

        try {
            await wordApi.delete(id)
            await loadWords()
        } catch (error) {
            alert('删除失败，请稍后重试')
        }
    }

    const toggleExpand = (wordId: number) => {
        setExpandedWordId(expandedWordId === wordId ? null : wordId)
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

            {/* 单词列表 */}
            <Card>
                <CardHeader>
                    <CardTitle>单词列表</CardTitle>
                    <CardDescription>点击单词查看所有语境</CardDescription>
                </CardHeader>
                <CardContent>
                    {filteredWords.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            {searchQuery ? '没有找到匹配的单词' : '还没有添加单词，点击上方按钮开始添加'}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>单词</TableHead>
                                    <TableHead>语境数量</TableHead>
                                    <TableHead>添加时间</TableHead>
                                    <TableHead className="text-right">操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredWords.map((word) => (
                                    <>
                                        <TableRow key={word.id} className="cursor-pointer hover:bg-muted/50">
                                            <TableCell
                                                className="font-medium"
                                                onClick={() => toggleExpand(word.id)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {expandedWordId === word.id ? (
                                                        <ChevronUp className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronDown className="h-4 w-4" />
                                                    )}
                                                    {word.text}
                                                </div>
                                            </TableCell>
                                            <TableCell>{word.contexts.length} 个</TableCell>
                                            <TableCell>
                                                {new Date(word.createdAt).toLocaleDateString('zh-CN')}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(word.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                        {expandedWordId === word.id && (
                                            <TableRow>
                                                <TableCell colSpan={4} className="bg-muted/30">
                                                    <div className="space-y-3 py-2">
                                                        <div className="font-semibold text-sm">语境列表：</div>
                                                        {word.contexts.map((ctx) => (
                                                            <div
                                                                key={ctx.id}
                                                                className="pl-4 border-l-2 border-primary space-y-1"
                                                            >
                                                                <div className="text-sm">{ctx.sentence}</div>
                                                                <div className="text-sm text-muted-foreground">
                                                                    释义：{ctx.meaning}
                                                                </div>
                                                                {ctx.sourceUrl && (
                                                                    <div className="text-xs text-muted-foreground">
                                                                        来源：
                                                                        <a
                                                                            href={ctx.sourceUrl}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="text-primary hover:underline"
                                                                        >
                                                                            {ctx.sourceUrl}
                                                                        </a>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

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
        </div>
    )
}
