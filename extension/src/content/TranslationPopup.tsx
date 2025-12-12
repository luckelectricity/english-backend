import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Loader2, Sparkles, X, Brain } from 'lucide-react';
import { aiApi } from '../lib/api';
import css from '../index.css?inline'; // Import CSS as string

// Shadow DOM Root
const CONTAINER_ID = 'english-assistant-root';

export function mountTranslationPopup() {
    let container = document.getElementById(CONTAINER_ID);
    if (!container) {
        container = document.createElement('div');
        container.id = CONTAINER_ID;
        document.body.appendChild(container); // Append to body, not shadow of another element

        const shadow = container.attachShadow({ mode: 'open' });

        // Inject compiled Tailwind CSS
        const style = document.createElement('style');
        style.textContent = css;
        shadow.appendChild(style);

        // Add container specific overrides
        const customStyle = document.createElement('style');
        customStyle.textContent = `
            :host { all: initial; z-index: 2147483647; position: absolute; top: 0; left: 0; pointer-events: none; }
            .ea-popup-container { pointer-events: auto; font-family: sans-serif; position: relative; }
        `;
        shadow.appendChild(customStyle);

        const rootDiv = document.createElement('div');
        rootDiv.className = 'ea-popup-container';
        shadow.appendChild(rootDiv);
        createRoot(rootDiv).render(<TranslationPopup />);
    }
}

function TranslationPopup() {
    const [selection, setSelection] = useState<{ text: string, rect: DOMRect } | null>(null);
    const [showButton, setShowButton] = useState(false);
    const [showPanel, setShowPanel] = useState(false);
    const [loading, setLoading] = useState(false);
    const [googleResult, setGoogleResult] = useState<string | null>(null);
    const [aiResult, setAiResult] = useState<any>(null);
    const [aiLoading, setAiLoading] = useState(false);

    useEffect(() => {
        const handleMouseUp = () => {
            const sel = window.getSelection();
            const text = sel?.toString().trim();

            console.log('[TranslationPopup] mouseup', { text, rangeCount: sel?.rangeCount });

            if (text && text.length > 0) {
                const range = sel!.getRangeAt(0);
                const rect = range.getBoundingClientRect();

                console.log('[TranslationPopup] Selection rect:', rect);

                // Only show if selection is not empty and visible
                if (rect.width > 0 && rect.height > 0) {
                    const newSelection = {
                        text: text,
                        rect: {
                            top: rect.top + window.scrollY,
                            left: rect.left + window.scrollX,
                            width: rect.width,
                            height: rect.height,
                            bottom: rect.bottom + window.scrollY,
                            right: rect.right + window.scrollX,
                            x: rect.x + window.scrollX,
                            y: rect.y + window.scrollY,
                            toJSON: rect.toJSON
                        }
                    };
                    console.log('[TranslationPopup] Setting selection:', newSelection);
                    setSelection(newSelection);
                    setShowButton(true);
                    // Do not hide panel immediately to allow selecting new text while panel is open? 
                    // No, usually new selection closes old panel.
                    setShowPanel(false);
                    setGoogleResult(null);
                    setAiResult(null);
                } else {
                    console.log('[TranslationPopup] Rect has 0 width/height');
                }
            } else {
                // Click outside or empty selection
                // We rely on mousedown to handle closing, here just reset button
                console.log('[TranslationPopup] No text selected or text empty');
                setShowButton(false);
            }
        };

        const handleMouseDown = (_: MouseEvent) => {
            // If clicking inside our shadow dom, stop propagation? 
            // We can't easily detect clicks inside shadow DOM from document listener
            // But we can check if the target is our container host?
            // Actually, events inside shadow DOM don't bubble out target as inside elements easily.

            // Simple logic: If click is NOT on the button or panel, close everything.
            // We handle stopPropagation in the component itself.
            setShowButton(false);
            // We will close panel if user clicks away. 
            // Since panel stopPropagation, this listener only fires for outside clicks.
            setShowPanel(false);
        };

        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('mousedown', handleMouseDown);

        return () => {
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('mousedown', handleMouseDown);
        };
    }, []);

    const handleGoogleTranslate = async () => {
        if (!selection) return;

        setShowButton(false);
        setShowPanel(true);
        setLoading(true);

        try {
            // Free Google Translate API (Note: might be rate limited or deprecated, use with caution or backend proxy)
            // Using `translate.googleapis.com` often works for simple extensions.
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=zh-CN&dt=t&q=${encodeURIComponent(selection.text)}`;
            const res = await fetch(url);
            const data = await res.json();
            // data[0] contains array of [translated, original]
            const translatedText = data[0].map((item: any) => item[0]).join('');
            setGoogleResult(translatedText);
        } catch (e) {
            console.error('Google translate failed', e);
            setGoogleResult('翻译失败');
        } finally {
            setLoading(false);
        }
    };

    const handleAiAnalyze = async () => {
        if (!selection) return;
        setAiLoading(true);
        try {
            const data = await aiApi.expand(selection.text, selection.text); // Use text as context
            setAiResult(data);
        } catch (e) {
            console.error(e);
        } finally {
            setAiLoading(false);
        }
    }

    if (!selection) return null;

    // Position calculations
    const buttonStyle = {
        top: selection.rect.top - 40,
        left: selection.rect.left + (selection.rect.width / 2) - 16,
    };

    // Panel position: try below, if not enough space (bottom of screen), put above
    const panelStyle = {
        top: selection.rect.top + selection.rect.height + 10,
        left: selection.rect.left,
    };

    return (
        <>
            {showButton && (
                <button
                    className="absolute bg-white text-blue-600 p-2 rounded-full shadow-lg border border-blue-100 hover:scale-110 transition-transform cursor-pointer flex items-center justify-center z-50 group"
                    style={{
                        ...buttonStyle,
                        position: 'absolute',
                        zIndex: 50,
                        backgroundColor: 'white',
                        borderRadius: '9999px',
                        padding: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    }}
                    onClick={(e) => {
                        e.stopPropagation(); // Stop document mousedown
                        e.preventDefault(); // Prevent text deselection
                        handleGoogleTranslate();
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <img src="https://upload.wikimedia.org/wikipedia/commons/d/d7/Google_Translate_logo.svg" className="w-5 h-5" alt="Translate" />
                </button>
            )}

            {showPanel && (
                <div
                    className="absolute bg-white rounded-xl shadow-2xl border border-slate-200 p-4 w-[360px] text-start animate-in zoom-in-95 duration-200 z-50"
                    style={panelStyle}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-start mb-3 border-b border-slate-100 pb-2">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Google 翻译</span>
                        <button onClick={() => setShowPanel(false)} className="text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer p-0">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-4">
                            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="text-base text-slate-900 font-medium leading-relaxed">
                                {googleResult}
                            </div>

                            {!aiResult && !aiLoading && (
                                <button
                                    onClick={handleAiAnalyze}
                                    className="w-full flex items-center justify-center gap-2 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors border border-blue-200"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    AI 深度解析 & 语境学习
                                </button>
                            )}

                            {aiLoading && (
                                <div className="flex items-center justify-center py-4 bg-slate-50 rounded-lg">
                                    <Loader2 className="w-4 h-4 animate-spin text-blue-600 mr-2" />
                                    <span className="text-sm text-slate-500">AI 正在思考...</span>
                                </div>
                            )}

                            {aiResult && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-300 bg-slate-50 rounded-lg p-3 border border-slate-100">
                                    <div className="flex items-center gap-2 mb-2 text-blue-700 font-medium text-sm">
                                        <Brain className="w-4 h-4" />
                                        AI 详解
                                    </div>
                                    <div className="text-sm text-slate-700 leading-relaxed">
                                        {aiResult.explanation}
                                    </div>
                                    {aiResult.examples?.length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-slate-200/50">
                                            {aiResult.examples.slice(0, 1).map((ex: any, i: number) => (
                                                <div key={i} className="text-xs text-slate-600 italic">
                                                    "{ex.sentence}"
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
