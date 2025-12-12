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
        // Returns the user object directly
        return sendToBackground('GET_PROFILE') as Promise<any>;
    }
};

export const aiApi = {
    expand: async (word: string, contextSentence: string, contextId?: number) => {
        return sendToBackground('AI_EXPAND', { word, sentence: contextSentence, contextId });
    }
};

export const wordApi = {
    check: async (text: string) => {
        return sendToBackground('CHECK_WORD', { text }) as Promise<{ oxfordLevel: string | null, isCollected: boolean }>;
    },
    add: async (dto: { text: string; sentence: string; meaning: string; sourceUrl: string }) => {
        return sendToBackground('ADD_WORD', dto);
    }
};
