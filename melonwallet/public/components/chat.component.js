import { consultarAssistente } from '../services/ai.service.js';

const CHAT_ID = 'ai-chat-widget';
let isOpen = false;

function injectStyles() {
    if (document.getElementById('ai-chat-styles')) return;

    const style = document.createElement('style');
    style.id = 'ai-chat-styles';
    style.textContent = `
        #${CHAT_ID} {
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 9998;
            font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif;
        }

        #ai-chat-toggle {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            border: none;
            background: linear-gradient(135deg, #f1f193, #ffdb1a);
            color: #000;
            font-size: 24px;
            cursor: pointer;
            box-shadow: 0 8px 24px rgba(241, 240, 147, 0.35);
            transition: transform 0.2s, box-shadow 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        #ai-chat-toggle:hover {
            transform: scale(1.05);
            box-shadow: 0 10px 30px rgba(241, 240, 147, 0.5);
        }

        .ia-btn-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            line-height: 1;
            gap: 1px;
        }

        .ant-icon {
            font-size: 22px;
        }

        .ia-text {
            font-size: 0.6rem;
            font-weight: 700;
            letter-spacing: 0.5px;
            margin-top: 1px;
        }

        #ai-chat-panel {
            display: none;
            position: absolute;
            bottom: 72px;
            right: 0;
            width: 340px;
            max-width: calc(100vw - 48px);
            max-height: 480px;
            background: rgba(18, 18, 18, 0.98);
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 20px;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);
            flex-direction: column;
            overflow: hidden;
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
        }

        #ai-chat-panel.open {
            display: flex;
        }

        .ai-chat-header {
            padding: 14px 18px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .ai-chat-header strong {
            font-size: 0.95rem;
            color: #f5f5f7;
        }

        .ai-chat-header span {
            font-size: 0.75rem;
            color: #86868b;
        }

        .ai-chat-close {
            background: none;
            border: none;
            color: #86868b;
            font-size: 1.2rem;
            cursor: pointer;
            line-height: 1;
            padding: 0 4px;
        }

        .ai-chat-close:hover {
            color: #fff;
        }

        .ai-chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 14px 16px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            min-height: 200px;
            max-height: 320px;
        }

        .ai-chat-msg {
            padding: 10px 14px;
            border-radius: 14px;
            font-size: 0.85rem;
            line-height: 1.45;
            word-wrap: break-word;
            white-space: pre-wrap;
        }

        .ai-chat-msg.user {
            align-self: flex-end;
            background: rgba(241, 240, 147, 0.15);
            color: #f1f09d;
            border-bottom-right-radius: 4px;
            max-width: 85%;
        }

        .ai-chat-msg.assistant {
            align-self: flex-start;
            background: rgba(255, 255, 255, 0.06);
            color: #e5e5e5;
            border-bottom-left-radius: 4px;
            max-width: 90%;
        }

        .ai-chat-input-area {
            padding: 10px 12px;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
            display: flex;
            gap: 8px;
        }

        .ai-chat-input {
            flex: 1;
            padding: 10px 14px;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            background: rgba(255, 255, 255, 0.04);
            color: #fff;
            font-size: 0.85rem;
            outline: none;
        }

        .ai-chat-input:focus {
            border-color: rgba(241, 240, 147, 0.4);
        }

        .ai-chat-send {
            padding: 10px 14px;
            border-radius: 12px;
            border: none;
            background: #f1f193;
            color: #000;
            font-weight: 700;
            cursor: pointer;
            font-size: 0.85rem;
            transition: background 0.2s;
        }

        .ai-chat-send:hover {
            background: #ffdb1a;
        }

        .ai-chat-send:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .ai-chat-typing {
            font-size: 0.75rem;
            color: #86868b;
            padding: 0 16px 8px;
            display: none;
        }

        @media (max-width: 430px) {
            #${CHAT_ID} {
                bottom: 16px;
                right: 16px;
            }
            #ai-chat-panel {
                width: calc(100vw - 32px);
                right: -4px;
            }
        }
    `;
    document.head.appendChild(style);
}

function createWidget() {
    if (document.getElementById(CHAT_ID)) return;

    const widget = document.createElement('div');
    widget.id = CHAT_ID;
    widget.innerHTML = `
        <div id="ai-chat-panel">
            <div class="ai-chat-header">
                <div>
                    <strong>Assistente Financeiro</strong>
                    <div>Melon Wallet IA</div>
                </div>
                <button class="ai-chat-close" id="ai-chat-close">×</button>
            </div>
            <div class="ai-chat-messages" id="ai-chat-messages">
                <div class="ai-chat-msg assistant">Olá! Sou seu assistente financeiro. Como posso ajudar você hoje?</div>
            </div>
            <div class="ai-chat-typing" id="ai-chat-typing">Digitando...</div>
            <div class="ai-chat-input-area">
                <input type="text" class="ai-chat-input" id="ai-chat-input" placeholder="Ex: Onde gastei mais esse mês?" />
                <button class="ai-chat-send" id="ai-chat-send">Enviar</button>
            </div>
        </div>
        <button id="ai-chat-toggle">
            <div class="ia-btn-content">
                <span class="ant-icon">🐜</span>
                <span class="ia-text">IA</span>
            </div>
        </button>
    `;
    document.body.appendChild(widget);

    document.getElementById('ai-chat-toggle').addEventListener('click', toggleChat);
    document.getElementById('ai-chat-close').addEventListener('click', toggleChat);

    const sendBtn = document.getElementById('ai-chat-send');
    const input = document.getElementById('ai-chat-input');

    sendBtn.addEventListener('click', async () => {
        const pergunta = input.value.trim();
        if (!pergunta) return;
        await enviarPergunta(pergunta);
        input.value = '';
    });

    input.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
            const pergunta = input.value.trim();
            if (!pergunta) return;
            await enviarPergunta(pergunta);
            input.value = '';
        }
    });
}

async function enviarPergunta(pergunta) {
    const messagesContainer = document.getElementById('ai-chat-messages');
    const typing = document.getElementById('ai-chat-typing');
    const sendBtn = document.getElementById('ai-chat-send');
    const input = document.getElementById('ai-chat-input');

    const userMsg = document.createElement('div');
    userMsg.className = 'ai-chat-msg user';
    userMsg.textContent = pergunta;
    messagesContainer.appendChild(userMsg);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    sendBtn.disabled = true;
    input.disabled = true;
    typing.style.display = 'block';

    try {
        const todasSimulacoes = window.todasSimulacoes || [];
        const resposta = await consultarAssistente(todasSimulacoes, pergunta);

        const assistantMsg = document.createElement('div');
        assistantMsg.className = 'ai-chat-msg assistant';
        assistantMsg.textContent = resposta || 'Não recebi uma resposta válida da IA.';
        messagesContainer.appendChild(assistantMsg);
    } catch (error) {
        const errorMsg = document.createElement('div');
        errorMsg.className = 'ai-chat-msg assistant';
        errorMsg.textContent = 'Erro ao processar sua pergunta. Verifique se a GEMINI_API_KEY está configurada.';
        messagesContainer.appendChild(errorMsg);
    } finally {
        typing.style.display = 'none';
        sendBtn.disabled = false;
        input.disabled = false;
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        input.focus();
    }
}

function toggleChat() {
    const panel = document.getElementById('ai-chat-panel');
    const toggle = document.getElementById('ai-chat-toggle');
    isOpen = !isOpen;
    if (isOpen) {
        panel.classList.add('open');
        toggle.style.transform = 'scale(0.9)';
        const input = document.getElementById('ai-chat-input');
        if (input) input.focus();
    } else {
        panel.classList.remove('open');
        toggle.style.transform = 'scale(1)';
    }
}

export function initChatWidget() {
    injectStyles();
    createWidget();
}
