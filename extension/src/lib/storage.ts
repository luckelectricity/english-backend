export const storage = {
    get: async (key: string) => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            const result = await chrome.storage.local.get([key]);
            return result[key];
        } else {
            return localStorage.getItem(key);
        }
    },
    set: async (key: string, value: any) => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            await chrome.storage.local.set({ [key]: value });
        } else {
            localStorage.setItem(key, value);
        }
    },
    remove: async (key: string) => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            await chrome.storage.local.remove([key]);
        } else {
            localStorage.removeItem(key);
        }
    }
};
