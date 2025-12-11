import { useState, useEffect } from 'react'
import { Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { speak, getPhonetic } from '@/lib/speech'

interface WordWithPhoneticProps {
    word: string
    showPhonetic?: boolean
}

export default function WordWithPhonetic({ word, showPhonetic = true }: WordWithPhoneticProps) {
    const [phonetic, setPhonetic] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (showPhonetic) {
            const loadPhonetic = async () => {
                setIsLoading(true)
                const result = await getPhonetic(word)
                setPhonetic(result)
                setIsLoading(false)
            }
            loadPhonetic()
        }
    }, [word, showPhonetic])

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
