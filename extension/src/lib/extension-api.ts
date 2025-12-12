// Helper to send message to background
const sendToBackground = async (type: string, payload?: any) => {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type, payload }, (response) => {
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }
            if (response && response.error) {
                return reject(new Error(response.error));
            }
            resolve(response);
        });
    });
};

export const authApi = {
    getProfile: async () => {
        return sendToBackground('GET_PROFILE') as Promise<{ user: any }>;
    }
};

export const aiApi = {
    expand: async (word: string, contextSentence: string, contextId?: number) => {
        return sendToBackground('AI_EXPAND', { word, sentence: contextSentence, contextId });
    }
};
