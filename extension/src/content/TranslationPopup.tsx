import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Loader2, Sparkles, X, Brain, Lock, Check, Plus } from 'lucide-react';
import { aiApi, authApi, wordApi } from '../lib/extension-api';
// import css from '../index.css?inline'; // Removed unused css

// Shadow DOM Root
const CONTAINER_ID = 'english-assistant-root';

const POPUP_STYLES = `
  :host {
    all: initial;
    z-index: 2147483647;
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
  
  .ea-popup-container {
    pointer-events: auto;
    position: absolute;
  }

  /* Button Styles */
  .ea-trans-btn {
    position: absolute;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: white;
    box-shadow: 0 4px 12px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08);
    border: 1px solid rgba(0,0,0,0.04);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    outline: none;
    z-index: 50;
  }
  .ea-trans-btn:hover {
    transform: scale(1.1);
    box-shadow: 0 8px 20px rgba(0,0,0,0.15);
  }
  .ea-trans-btn:active {
    transform: scale(0.95);
  }
  .ea-trans-btn img {
    width: 20px;
    height: 20px;
    display: block;
  }

  /* Panel Styles */
  .ea-panel {
    position: absolute;
    width: 340px;
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-radius: 16px;
    box-shadow: 
      0 10px 40px -10px rgba(0,0,0,0.15),
      0 2px 10px -2px rgba(0,0,0,0.05),
      0 0 0 1px rgba(0,0,0,0.04);
    padding: 16px;
    animation: ea-fade-in 0.2s ease-out;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 12px;
    color: #1e293b;
    z-index: 50;
  }

  .ea-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(0,0,0,0.06);
    padding-bottom: 10px;
    margin-bottom: 2px;
  }
  
  .ea-header-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .ea-header-right {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .ea-title {
    font-size: 11px;
    font-weight: 700;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }
  
  .ea-badge {
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 700;
    line-height: 1;
    letter-spacing: 0.5px;
  }
  .ea-badge-a1, .ea-badge-a2 { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
  .ea-badge-b1, .ea-badge-b2 { background: #fef9c3; color: #a16207; border: 1px solid #fde047; }
  .ea-badge-c1, .ea-badge-c2 { background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }

  .ea-icon-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 6px;
    border-radius: 6px;
    color: #94a3b8;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }
  .ea-icon-btn:hover {
    background: rgba(0,0,0,0.04);
    color: #475569;
  }
  .ea-icon-btn.active {
    background: #f0fdf4;
    color: #16a34a;
  }
  .ea-icon-btn:disabled {
    cursor: default;
    opacity: 0.6;
  }

  .ea-content {
    font-size: 15px;
    line-height: 1.6;
    color: #0f172a;
  }

  /* AI Section */
  .ea-ai-section {
    margin-top: 8px;
    padding-top: 12px;
    border-top: 1px solid rgba(0,0,0,0.06);
  }
  .ea-ai-btn {
    width: 100%;
    border: none;
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    padding: 10px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: all 0.2s;
    box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
  }
  .ea-ai-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(37, 99, 235, 0.3);
  }
  .ea-ai-btn:disabled {
    opacity: 0.7;
    cursor: wait;
  }
  
  .ea-ai-locked {
    background: #f1f5f9;
    color: #64748b;
    cursor: not-allowed;
    box-shadow: none;
  }
  .ea-ai-locked:hover {
    transform: none;
  }

  .ea-ai-result {
    background: #f8fafc;
    border-radius: 8px;
    padding: 12px;
    font-size: 14px;
    color: #334155;
    border: 1px solid #e2e8f0;
    animation: ea-slide-up 0.3s ease-out;
  }

  @keyframes ea-fade-in {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  @keyframes ea-slide-up {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

export function mountTranslationPopup() {
    let container = document.getElementById(CONTAINER_ID);
    if (!container) {
        container = document.createElement('div');
        container.id = CONTAINER_ID;
        document.body.appendChild(container);

        const shadow = container.attachShadow({ mode: 'open' });

        // Inject Styles
        const style = document.createElement('style');
        style.textContent = POPUP_STYLES;
        shadow.appendChild(style);

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
    const [user, setUser] = useState<any>(null); // { role: 'user' | 'vip' ... }
    const [wordStatus, setWordStatus] = useState<{ oxfordLevel: string | null, isCollected: boolean } | null>(null);
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        // Fetch user profile on mount
        checkUser();

        const handleMouseUp = () => {
            const sel = window.getSelection();
            const text = sel?.toString().trim();

            if (text && text.length > 0) {
                const range = sel!.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    setSelection({
                        text,
                        rect: {
                            top: rect.top + window.scrollY,
                            left: rect.left + window.scrollX,
                            width: rect.width,
                            height: rect.height,
                            toJSON: rect.toJSON
                        } as any
                    });
                    setShowButton(true);
                    setShowPanel(false);
                    setGoogleResult(null);
                    setAiResult(null);
                }
            } else {
                setShowButton(false);
            }
        };

        const handleMouseDown = (_e: MouseEvent) => {
            // Close if clicking outside is handled by stopsPropagation in elements
            // Here we just listen for general clicks to close
            setShowButton(false);
            setShowPanel(false);
        };

        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('mousedown', handleMouseDown);

        return () => {
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('mousedown', handleMouseDown);
        };
    }, []);

    const checkUser = async () => {
        try {
            const u = await authApi.getProfile();
            console.log('[TranslationPopup] User profile fetched:', u);
            setUser(u);
        } catch (e) {
            console.log('[TranslationPopup] Not logged in or failed to fetch profile', e);
            setUser(null);
        }
    };

    const handleGoogleTranslate = async () => {
        if (!selection) return;

        setShowButton(false);
        setShowPanel(true);
        setLoading(true);

        // Check word status in parallel
        wordApi.check(selection.text).then(res => {
            console.log('[TranslationPopup] Check result:', res);
            setWordStatus(res);
        }).catch(err => console.error('[TranslationPopup] Check failed:', err));

        try {
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=zh-CN&dt=t&q=${encodeURIComponent(selection.text)}`;
            const res = await fetch(url);
            const data = await res.json();
            const translatedText = data[0].map((item: any) => item[0]).join('');
            setGoogleResult(translatedText);
        } catch (e) {
            setGoogleResult('翻译失败');
        } finally {
            setLoading(false);
        }
    };

    const handleAddWord = async () => {
        console.log('[TranslationPopup] handleAddWord clicked');
        if (!selection) return;

        const meaning = googleResult || 'Wait for translation...';
        // Or we could just proceed if we want to save user input. 
        // For now, let's allow saving even if translation failed or is pending, 
        // to avoid "invalid" click feeling.

        setAdding(true);
        try {
            console.log('[TranslationPopup] Adding word:', selection.text);
            await wordApi.add({
                text: selection.text,
                sentence: selection.text, // Could be improved to capture surrounding sentence
                meaning: meaning,
                sourceUrl: window.location.href
            });
            console.log('[TranslationPopup] Word added successfully');
            setWordStatus(prev => prev ? { ...prev, isCollected: true } : { oxfordLevel: null, isCollected: true });
        } catch (e) {
            console.error('[TranslationPopup] Failed to add word', e);
        } finally {
            setAdding(false);
        }
    };

    const handleAiAnalyze = async () => {
        if (!selection) return;
        setAiLoading(true);
        try {
            const data = await aiApi.expand(selection.text, selection.text);
            setAiResult(data);
        } catch (e) {
            console.error(e);
        } finally {
            setAiLoading(false);
        }
    }

    if (!selection) return null;

    const buttonStyle = {
        top: selection.rect.top - 48, // slightly higher
        left: selection.rect.left + (selection.rect.width / 2) - 16,
    };

    const panelStyle = {
        top: selection.rect.top + selection.rect.height + 12,
        left: selection.rect.left,
    };

    // Boundary check for panel (simple)
    if (panelStyle.left + 320 > window.innerWidth) {
        panelStyle.left = window.innerWidth - 340;
    }

    const isVip = user && ['vip', 'vvip', 'admin'].includes(user.role);
    console.log('[TranslationPopup] Render - isVip:', isVip, 'User:', user);

    return (
        <>
            {showButton && (
                <button
                    className="ea-trans-btn"
                    style={buttonStyle}
                    onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleGoogleTranslate();
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                >
                    <img src="https://upload.wikimedia.org/wikipedia/commons/d/d7/Google_Translate_logo.svg" alt="Translate" />
                </button>
            )}

            {showPanel && (
                <div
                    className="ea-panel"
                    style={panelStyle}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="ea-header">
                        <div className="ea-header-left">
                            <span className="ea-title">Google 翻译</span>
                            {wordStatus?.oxfordLevel && (
                                <span className={`ea-badge ea-badge-${wordStatus.oxfordLevel.toLowerCase()}`}>
                                    {wordStatus.oxfordLevel}
                                </span>
                            )}
                        </div>
                        <div className="ea-header-right">
                            {wordStatus && (
                                <button
                                    onClick={handleAddWord}
                                    disabled={wordStatus.isCollected || adding}
                                    className={`ea-icon-btn ${wordStatus.isCollected ? 'active' : ''}`}
                                    title={wordStatus.isCollected ? "Saved to Wordbook" : "Add to Wordbook"}
                                >
                                    {adding ? <Loader2 size={16} className="animate-spin" /> : (
                                        wordStatus.isCollected ? <Check size={16} /> : <Plus size={18} />
                                    )}
                                </button>
                            )}
                            <button onClick={() => setShowPanel(false)} className="ea-icon-btn">
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="ea-content">
                        {loading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px' }}>
                                <Loader2 className="animate-spin" size={20} color="#3b82f6" />
                            </div>
                        ) : (
                            googleResult
                        )}
                    </div>

                    {!loading && (
                        <div className="ea-ai-section">
                            {!aiResult ? (
                                <button
                                    onClick={isVip ? handleAiAnalyze : undefined}
                                    disabled={aiLoading}
                                    className={`ea-ai-btn ${!isVip ? 'ea-ai-locked' : ''}`}
                                    title={!isVip ? "Upgrade to VIP to use AI features" : ""}
                                >
                                    {aiLoading ? (
                                        <>
                                            <Loader2 className="animate-spin" size={14} />
                                            AI 思考中...
                                        </>
                                    ) : (
                                        <>
                                            {!isVip ? <Lock size={14} /> : <Sparkles size={14} />}
                                            {isVip ? "AI 深度解析" : "VIP 专属 AI 解析"}
                                        </>
                                    )}
                                </button>
                            ) : (
                                <div className="ea-ai-result">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2563eb', fontWeight: 600, marginBottom: '8px' }}>
                                        <Brain size={14} /> AI 详解
                                    </div>
                                    <div>{aiResult.explanation}</div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
