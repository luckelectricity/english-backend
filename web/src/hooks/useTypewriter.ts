import { useState, useEffect } from 'react'

/**
 * 打字机效果 Hook
 * @param text 要显示的文本
 * @param speed 打字速度（毫秒/字符）
 * @param enabled 是否启用打字机效果
 */
export function useTypewriter(text: string, speed: number = 50, enabled: boolean = true) {
    const [displayedText, setDisplayedText] = useState('')
    const [isComplete, setIsComplete] = useState(false)

    useEffect(() => {
        if (!enabled) {
            setDisplayedText(text)
            setIsComplete(true)
            return
        }

        setDisplayedText('')
        setIsComplete(false)
        let currentIndex = 0

        const timer = setInterval(() => {
            if (currentIndex < text.length) {
                setDisplayedText(text.slice(0, currentIndex + 1))
                currentIndex++
            } else {
                setIsComplete(true)
                clearInterval(timer)
            }
        }, speed)

        return () => clearInterval(timer)
    }, [text, speed, enabled])

    return { displayedText, isComplete }
}
