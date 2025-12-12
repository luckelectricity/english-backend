import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Loader2, Sparkles, X, Brain, Lock } from 'lucide-react';
import { aiApi, authApi } from '../lib/extension-api';
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
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: white;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    border: 1px solid rgba(0,0,0,0.05);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    outline: none;
  }
  .ea-trans-btn:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 16px rgba(0,0,0,0.2);
  }
  .ea-trans-btn:active {
    transform: scale(0.95);
  }
  .ea-trans-btn img {
    width: 18px;
    height: 18px;
    display: block;
  }

  /* Panel Styles */
  .ea-panel {
    position: absolute;
    width: 320px;
    background: rgba(255, 255, 255, 0.96);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-radius: 16px;
    box-shadow: 
      0 10px 40px -10px rgba(0,0,0,0.2),
      0 0 0 1px rgba(0,0,0,0.05);
    padding: 16px;
    animation: ea-fade-in 0.2s ease-out;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 12px;
    color: #1e293b;
  }

  .ea-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(0,0,0,0.06);
    padding-bottom: 12px;
    margin-bottom: 4px;
  }
  .ea-title {
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .ea-close {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    color: #94a3b8;
    display: flex;
    transition: all 0.2s;
  }
  .ea-close:hover {
    background: rgba(0,0,0,0.05);
    color: #475569;
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
            const { user: u } = await authApi.getProfile();
            console.log('[TranslationPopup] User:', u);
            setUser(u);
        } catch (e) {
            console.log('[TranslationPopup] Not logged in or failed to fetch profile');
            setUser(null);
        }
    };

    const handleGoogleTranslate = async () => {
        if (!selection) return;

        setShowButton(false);
        setShowPanel(true);
        setLoading(true);

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
                >
                    <img src="https://upload.wikimedia.org/wikipedia/commons/d/d7/Google_Translate_logo.svg" alt="Translate" />
                </button>
            )}

            {showPanel && (
                <div
                    className="ea-panel"
                    style={panelStyle}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="ea-header">
                        <span className="ea-title">Google 翻译</span>
                        <button onClick={() => setShowPanel(false)} className="ea-close">
                            <X size={16} />
                        </button>
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
