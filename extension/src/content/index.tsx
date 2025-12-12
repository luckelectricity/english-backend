import './styles.css';
import { mountTranslationPopup } from './TranslationPopup';

console.log('[English Assistant] Content script loaded');

interface Word {
    id: number;
    text: string;
    status: number; // 0: learning, 1: mastered
    contexts?: { meaning: string }[];
}

let words: Word[] = [];

// Initialize
init();

async function init() {
    await loadWords();
    highlightPage();
    mountTranslationPopup();

    // Listen for updates
    chrome.runtime.onMessage.addListener((message: any, _sender: any, _sendResponse: any) => {
        if (message.type === 'WORDS_UPDATED') {
            console.log('[English Assistant] Words updated, re-highlighting...');
            loadWords().then(highlightPage);
        }
    });
}

async function loadWords() {
    try {
        const result = await chrome.storage.local.get('learning_words');
        if (result.learning_words) {
            // Filter out mastered words (status === 1)
            const allWords = result.learning_words as Word[];
            words = allWords.filter(w => w.status !== 1);
            console.log(`[English Assistant] Loaded ${words.length} learning words (filtered ${allWords.length - words.length} mastered)`);
        }
    } catch (e) {
        console.error('Failed to load words:', e);
    }
}

function highlightPage() {
    if (!words.length) return;

    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: (node) => {
                // Skip script/style/input tags and already highlighted nodes
                const parent = node.parentElement;
                if (!parent) return NodeFilter.FILTER_REJECT;

                const tagName = parent.tagName.toLowerCase();
                if (['script', 'style', 'input', 'textarea', 'select', 'noscript'].includes(tagName)) {
                    return NodeFilter.FILTER_REJECT;
                }
                if (parent.classList.contains('english-learning-highlight') || parent.classList.contains('english-learning-note')) {
                    return NodeFilter.FILTER_REJECT;
                }
                return NodeFilter.FILTER_ACCEPT;
            }
        }
    );

    const nodesToProcess: Text[] = [];
    let node;
    while (node = walker.nextNode()) {
        if (node.nodeValue && node.nodeValue.trim().length > 0) {
            nodesToProcess.push(node as Text);
        }
    }

    // Process matching to avoid disrupting tree walker during modification
    nodesToProcess.forEach(processNode);
}

function processNode(node: Text) {
    const text = node.nodeValue;
    if (!text) return;

    // 1. English Matching
    // Sort words by length desc to match longest first
    // Filter words that look like they might be in the text (simple includes check first for perf)

    // Strategy: We can't do multiple passes easily on the same text node without splitting it.
    // For simplicity, we prioritize English matching first, then Chinese.

    // Actually, to handle both correctly without collisions is complex.
    // Let's iterate all words and find the *earliest* match in the string, split, wrap, and recurse on the rest.

    // Optimization: Build a regex for all English words?
    // English words are easy: /\b(apple|banana|...)\b/gi

    // Chinese meanings are harder because they can be substrings.
    // "苹果" -> match "苹果"

    // Let's try a combined approach. FInd first match of ANY keyword.

    let bestMatch = { index: Infinity, word: null as Word | null, type: 'none', length: 0 };

    for (const w of words) {
        // English Match
        const engRegex = new RegExp(`\\b${escapeRegExp(w.text)}\\b`, 'i');
        const engMatch = engRegex.exec(text);
        if (engMatch && engMatch.index < bestMatch.index) {
            bestMatch = { index: engMatch.index, word: w, type: 'english', length: engMatch[0].length };
        }

        // Chinese Match (Check meanings)
        if (w.contexts) {
            for (const ctx of w.contexts) {
                // Extract pure Chinese meaning if possible? Usually "meaning" field is the definition.
                // Assuming `ctx.meaning` is the Chinese definition.
                // Simple string match
                const cnIdx = text.indexOf(ctx.meaning);
                if (cnIdx !== -1 && cnIdx < bestMatch.index) {
                    bestMatch = { index: cnIdx, word: w, type: 'chinese', length: ctx.meaning.length };
                }
            }
        }
    }

    if (bestMatch.word && bestMatch.index !== Infinity) {
        // Found a match!

        // Split node: [Before] [Match] [After]
        const afterNode = node.splitText(bestMatch.index); // node is now [Before], afterNode is [Match][After]
        const remainingNode = afterNode.splitText(bestMatch.length); // afterNode is [Match], remainingNode is [After]

        // Replacement Logic
        const wrapper = document.createElement('span');

        if (bestMatch.type === 'english') {
            wrapper.className = 'english-learning-highlight';
            wrapper.textContent = afterNode.nodeValue;
            afterNode.parentNode?.replaceChild(wrapper, afterNode);
        } else {
            // Chinese: Highligh Chinese + Append English
            const container = document.createDocumentFragment();

            // 1. Chinese Highlight
            const cnSpan = document.createElement('span');
            cnSpan.className = 'english-learning-highlight';
            cnSpan.textContent = afterNode.nodeValue;
            container.appendChild(cnSpan);

            // 2. English Note
            const enSpan = document.createElement('span');
            enSpan.className = 'english-learning-note';
            enSpan.textContent = `(${bestMatch.word.text})`;
            container.appendChild(enSpan);

            afterNode.parentNode?.replaceChild(container, afterNode);
        }

        // Recurse on remaining part
        processNode(remainingNode);
    }
}

function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
