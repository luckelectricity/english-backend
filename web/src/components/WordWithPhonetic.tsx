import { useState, useEffect } from 'react'
import { Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { speak, getPhonetic } from '@/lib/speech'

import { wordApi } from '@/lib/api'

interface WordWithPhoneticProps {
    wordId?: number
    word: string
    phonetic?: string | null
    showPhonetic?: boolean
}

export default function WordWithPhonetic({ wordId, word, phonetic: initialPhonetic, showPhonetic = true }: WordWithPhoneticProps) {
    const [phonetic, setPhonetic] = useState<string | null>(initialPhonetic || null)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        // 如果已有音标，直接使用
        if (initialPhonetic) {
            setPhonetic(initialPhonetic)
            return
        }

        if (showPhonetic && !phonetic) {
            const loadPhonetic = async () => {
                setIsLoading(true)
                try {
                    const result = await getPhonetic(word)
                    if (result) {
                        setPhonetic(result)
                        // 如果有 wordId，保存到数据库
                        if (wordId) {
                            await wordApi.update(wordId, { phonetic: result })
                        }
                    }
                } catch (error) {
                    console.error('获取音标失败:', error)
                } finally {
                    setIsLoading(false)
                }
            }
            loadPhonetic()
        }
    }, [word, showPhonetic, initialPhonetic, wordId])

    const handleSpeak = () => {
        speak(word, 'en-US')
    }

    return (
        <div className="inline-flex items-center gap-2">
            <span className="font-semibold text-lg">{word}</span>
            {showPhonetic && phonetic && (
                <span className="text-muted-foreground text-sm">{phonetic}</span>
            )}
            {showPhonetic && isLoading && (
                <span className="text-muted-foreground text-sm">...</span>
            )}
            <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleSpeak}
                title="朗读单词"
            >
                <Volume2 className="h-4 w-4" />
            </Button>
        </div>
    )
}
