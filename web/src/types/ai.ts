export interface AiExpandResponse {
    explanation: string
    examples: {
        sentence: string
        translation: string
    }[]
}
