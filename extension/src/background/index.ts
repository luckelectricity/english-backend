const API_URL = 'http://localhost:3000/api';

// Sync words every 10 minutes
const ALARM_NAME = 'sync_words';
const SYNC_INTERVAL_MINUTES = 10;

chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
    chrome.alarms.create(ALARM_NAME, {
        periodInMinutes: SYNC_INTERVAL_MINUTES
    });
    // Initial sync
    syncWords();
});

chrome.alarms.onAlarm.addListener((alarm: any) => {
    if (alarm.name === ALARM_NAME) {
        syncWords();
    }
});

// Listen for login message from popup
chrome.runtime.onMessage.addListener((message: any, _sender: any, sendResponse: any) => {
    if (message.type === 'LOGIN_SUCCESS') {
        syncWords();
        sendResponse({ success: true });
        return true; // Keep channel open
    }

    if (message.type === 'GET_PROFILE') {
        handleGetProfile().then(sendResponse).catch(err => sendResponse({ error: err.message }));
        return true; // Async response
    }

    if (message.type === 'AI_EXPAND') {
        handleAiExpand(message.payload).then(sendResponse).catch(err => sendResponse({ error: err.message }));
        return true; // Async response
    }
});

async function handleGetProfile() {
    const { token } = await chrome.storage.local.get('token');
    if (!token) throw new Error('Not logged in');

    const response = await fetch(`${API_URL}/auth/profile`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) throw new Error('Failed to fetch profile');
    const data = await response.json();
    return data.data; // { user: ... }
}

async function handleAiExpand(payload: any) {
    const { token } = await chrome.storage.local.get('token');
    if (!token) throw new Error('Not logged in');

    const response = await fetch(`${API_URL}/ai/expand`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error('AI request failed');
    const data = await response.json();
    return data.data;
}

async function syncWords() {
    try {
        const { token } = await chrome.storage.local.get('token');
        if (!token) {
            console.log('No token found, skipping sync');
            return;
        }

        console.log('Syncing words...');
        const response = await fetch(`${API_URL}/words`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Sync failed: ${response.status}`);
        }

        const data = await response.json();
        // Backend returns standard response { code, data, ... } or just array?
        // Checked WordController: returns this.wordService.getUserWords() directly.
        // Wait, main.ts has global interceptor: app.useGlobalInterceptors(new TransformInterceptor());
        // So it likely returns { code: 200, data: [...] }

        let words = [];
        if (data.data && Array.isArray(data.data)) {
            words = data.data;
        } else if (Array.isArray(data)) {
            words = data;
        }

        await chrome.storage.local.set({
            learning_words: words,
            last_sync: Date.now()
        });

        console.log(`Synced ${words.length} words`);

        // Notify active tabs to update highlighting if needed
        const tabs = await chrome.tabs.query({ active: true });
        tabs.forEach(tab => {
            if (tab.id) {
                chrome.tabs.sendMessage(tab.id, { type: 'WORDS_UPDATED' }).catch(() => { });
            }
        });

    } catch (error) {
        console.error('Word sync error:', error);
    }
}
