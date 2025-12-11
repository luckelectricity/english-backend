/**
 * 文本转语音工具函数
 */
let voices: SpeechSynthesisVoice[] = []

const loadVoices = () => {
    voices = window.speechSynthesis.getVoices()
}

if ('speechSynthesis' in window) {
    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices
}

const getBestVoice = (lang: string) => {
    // 优先选择的高质量语音关键字
    const preferredVoices = [
        'Google US English',
        'Microsoft Zira',
        'Samantha',
        'Google UK English Female',
        'Google UK English Male'
    ]

    // 1. 尝试匹配首选语音
    for (const name of preferredVoices) {
        const voice = voices.find(v => v.name.includes(name))
        if (voice) return voice
    }

    // 2. 尝试匹配语言 (例如 en-US)
    const langVoice = voices.find(v => v.lang === lang)
    if (langVoice) return langVoice

    // 3. 尝试匹配语言前缀 (例如 en)
    const prefixVoice = voices.find(v => v.lang.startsWith(lang.split('-')[0]))
    if (prefixVoice) return prefixVoice

    return null
}

export const speak = (text: string, lang: string = 'en-US') => {
    if (!('speechSynthesis' in window)) {
        console.error('浏览器不支持语音合成')
        return
    }

    // 停止当前正在播放的语音
    window.speechSynthesis.cancel()

    // 确保语音已加载
    if (voices.length === 0) {
        loadVoices()
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = 0.9 // 语速稍慢一点
    utterance.pitch = 1 // 音调
    utterance.volume = 1 // 音量

    const voice = getBestVoice(lang)
    if (voice) {
        console.log('Using voice:', voice.name)
        utterance.voice = voice
    }

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
