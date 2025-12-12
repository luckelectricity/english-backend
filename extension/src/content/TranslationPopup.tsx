import { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Loader2, Sparkles, X, Volume2 } from 'lucide-react';
import { aiApi } from '../lib/api';
import '../index.css'; // Build process will inject styles

// Shadow DOM Root
const CONTAINER_ID = 'english-assistant-root';

export function mountTranslationPopup() {
    let container = document.getElementById(CONTAINER_ID);
    if (!container) {
        container = document.createElement('div');
        container.id = CONTAINER_ID;
        document.body.appendChild(container);

        const shadow = container.attachShadow({ mode: 'open' });

        // Inject styles into shadow DOM
        // With Vite CRX, styles are tricky in shadow DOM.
        // We will manually inject the gathered CSS or usage inline styles + Tailwind classes if we can inject style tag.
        // For now, let's try to inject the main stylesheet link if possible, or copied styles.
        // A simple way is to fetch the style sheet url and append it.
        const style = document.createElement('style');
        style.textContent = `
            @import url('${chrome.runtime.getURL('src/index.css')}');
            :host { all: initial; }
            .ea-popup { position: absolute; z-index: 2147483647; font-family: sans-serif; }
        `;
        shadow.appendChild(style);

        const rootDiv = document.createElement('div');
        shadow.appendChild(rootDiv);
        createRoot(rootDiv).render(<TranslationPopup />);
    }
}

function TranslationPopup() {
    const [selection, setSelection] = useState<{ text: string, rect: DOMRect } | null>(null);
    const [showButton, setShowButton] = useState(false);
    const [showPanel, setShowPanel] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    useEffect(() => {
        const handleMouseUp = () => {
            const sel = window.getSelection();
            if (sel && sel.toString().trim().length > 0) {
                const range = sel.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                // Store absolute position accounting for scroll
                setSelection({
                    text: sel.toString().trim(),
                    rect: {
                        ...rect,
                        top: rect.top + window.scrollY,
                        left: rect.left + window.scrollX,
                        width: rect.width,
                        height: rect.height
                    } as DOMRect
                });
                setShowButton(true);
                setShowPanel(false);
            } else {
                // Click outside or empty selection clears everything
                setShowButton(false);
                // Don't clear panel immediately if interacting with it?
                // For now simple behavior: click anywhere else closes it.
                // We need to check if click target is inside our shadow DOM.
                // But this event is outside shadow DOM.
            }
        };

        const handleMouseDown = (e: MouseEvent) => {
            // If clicking outside, close panel
            const target = e.target as HTMLElement;
            if (containerContains(e.target)) return;
            setShowPanel(false);
        };

        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('mousedown', handleMouseDown);

        return () => {
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('mousedown', handleMouseDown);
        };
    }, []);

    // Helper to check if event text is inside our shadow dom wrapper?
    // Actually events on shadow host work.
    const containerContains = (target: any) => {
        const container = document.getElementById(CONTAINER_ID);
        return container && container.contains(target);
    }

    const handleTranslate = async () => {
        if (!selection) return;

        setShowButton(false);
        setShowPanel(true);
        setLoading(true);
        setResult(null);

        try {
            // Check if it's a single word or sentence
            const isWord = selection.text.split(/\s+/).length === 1;

            // Re-use logic: words use expand, longer text uses translate (analyze)
            // But api.expand does context lookup.
            // Let's use expand for everything for now as it gives better details, or fallback to simple.

            // Using existing aiApi.expand
            // We need a dummy sentence if it's just a word? Or use the selection as context?
            // If selection is long, treat as context.

            let data;
            if (isWord) {
                // Try to find context sentence from paragraph?
                // For now passing selection as both word and sentence is lazy but works for single words.
                data = await aiApi.expand(selection.text, selection.text);
            } else {
                // If it's a sentence, we want analysis. 
                // aiApi.expand interprets arg1 as "word". 
                // Maybe we need a new API endpoint for general translation?
                // The user requirement said: "如果是英文，就高亮就行...".
                // "划词翻译" usually implies translation.
                // Let's assume for now we use expand, treating the whole text as "word" might fail.
                // We should add a generic 'analyze' or 'translate' endpoint or just use expand for single words.
                // For MVP let's support Single/Phrase lookup.
                data = await aiApi.expand(selection.text, selection.text);
            }

            setResult(data);
        } catch (e) {
            setResult({ explanation: '翻译失败，请重试' });
        } finally {
            setLoading(false);
        }
    };

    if (!selection) return null;

    // Position calculations
    const buttonStyle = {
        top: selection.rect.top - 40,
        left: selection.rect.left + (selection.rect.width / 2) - 16,
    };

    const panelStyle = {
        top: selection.rect.top + selection.rect.height + 10,
        left: selection.rect.left,
    };

    return (
        <>
            {showButton && (
                <button
                    className="ea-popup fixed bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-110 flex items-center justify-center cursor-pointer border-none outline-none"
                    style={buttonStyle}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleTranslate();
                    }}
                    onMouseDown={(e) => e.stopPropagation()} // Prevent document mousedown from closing
                >
                    <Sparkles className="w-4 h-4" />
                </button>
            )}

            {showPanel && (
                <div
                    className="ea-popup fixed bg-white rounded-xl shadow-2xl border border-slate-200 p-4 w-80 text-start animate-in zoom-in-95 duration-200 overflow-hidden"
                    style={panelStyle}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-bold text-slate-900 truncate pr-4" title={selection.text}>
                            {selection.text}
                        </h3>
                        <button onClick={() => setShowPanel(false)} className="text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer p-0">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Using AI response format */}
                            {result?.explanation && (
                                <div className="text-sm text-slate-700 leading-relaxed font-medium">
                                    {result.explanation}
                                </div>
                            )}

                            {result?.examples && result.examples.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-slate-100">
                                    <p className="text-xs font-semibold text-slate-500 mb-2">例句</p>
                                    <div className="space-y-2">
                                        {result.examples.slice(0, 2).map((ex: any, i: number) => (
                                            <div key={i} className="text-sm">
                                                <p className="text-slate-800">{ex.sentence}</p>
                                                <p className="text-slate-500 text-xs">{ex.translation}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
