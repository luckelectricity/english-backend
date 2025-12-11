/**
 * 文本转语音工具函数
 */
export const speak = (text: string, lang: string = 'en-US') => {
    if (!('speechSynthesis' in window)) {
        console.error('浏览器不支持语音合成')
        return
    }

    // 停止当前正在播放的语音
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = 0.9 // 语速稍慢一点
    utterance.pitch = 1 // 音调
    utterance.volume = 1 // 音量

    window.speechSynthesis.speak(utterance)
}

/**
 * 停止语音播放
 */
export const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
    }
}

/**
 * 获取单词音标（简化版，使用常见单词的音标映射）
 * 实际项目中可以调用第三方 API 如 Free Dictionary API
 */
export const getPhonetic = async (word: string): Promise<string | null> => {
    try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
        if (!response.ok) return null

        const data = await response.json()
        if (data && data[0] && data[0].phonetic) {
            return data[0].phonetic
        }

        // 尝试从 phonetics 数组中获取
        if (data && data[0] && data[0].phonetics && data[0].phonetics.length > 0) {
            for (const phonetic of data[0].phonetics) {
                if (phonetic.text) {
                    return phonetic.text
                }
            }
        }

        return null
    } catch (error) {
        console.error('获取音标失败:', error)
        return null
    }
}
