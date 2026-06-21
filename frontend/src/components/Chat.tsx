import { useEffect, useRef, useState } from "react";
import { generateContent, getLibrary } from "../services/api"; // <- Added getLibrary
import { ContentType, ContentData } from "../types";
import { Copy, Check, Sparkles, ExternalLink, Clock,CloudOff } from "lucide-react";
import "./chat.css";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = {
  role: "user" | "ai";
  text: string;
  id: string;
  chatId: string;
  hash?: string | null;
  txHash?: string | null;
  storage?: '0G_GALILEO' | 'PENDING_0G' | 'FAILED';
  type?: ContentType;
  createdAt?: number;
};

interface ChatProps {
  onNew: (d: ContentData) => void;
  externalMessages: ContentData[];
  chatId: string;
}

export default function Chat({ onNew, externalMessages, chatId }: ChatProps) {
  const [input, setInput] = useState("");
  const [type, setType] = useState<ContentType>("tweet");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const messages: Message[] = externalMessages.flatMap((d) => [
    { role: "user" as const, text: d.prompt, id: `user-${d.id}`, chatId: d.chatId },
    {
      role: "ai" as const,
      text: d.content,
      id: `ai-${d.id}`,
      chatId: d.chatId,
      hash: d.hash,
      txHash: d.txHash,
      storage: d.storage,
      type: d.type,
      createdAt: d.createdAt,
    },
  ]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [input]);

 const send = async () => {
  if (!input.trim() || loading) return;

  const currentPrompt = input;
  setInput("");
  setLoading(true);

  try {
    const res = await generateContent(currentPrompt, type, chatId);
    onNew(res.data);

    // POLLING - increased to 2 minutes
    const pollId = res.data.id;
    let attempts = 0;
    console.log('[POLL] Starting for', pollId);
    
    const pollInterval = setInterval(async () => {
      attempts++;
      try {
        const { data: library } = await getLibrary();
        const updated = library.find((item: ContentData) => item.id === pollId);
        
        console.log('[POLL] Attempt', attempts, 'Found:', updated?.storage, updated?.txHash);
        
        if (updated && updated.storage === '0G_GALILEO' && updated.txHash) {
          console.log('[POLL] Success! TX:', updated.txHash);
          onNew(updated);
          clearInterval(pollInterval);
        }
      } catch (e) {
        console.error('[POLL] Failed', e);
      }
      
      if (attempts > 60) { // 2 minutes now
        console.warn('[POLL] Timeout for', pollId);
        clearInterval(pollInterval);
      }
    }, 2000);

  } catch (e: any) {
    console.error("Generation failed", e);
    alert("Generation failed: " + e.message);
  }
  setLoading(false);
};


  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      send();
    }
  };

  const copyText = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const typeOptions: { value: ContentType; label: string }[] = [
    { value: "tweet", label: "Tweet" },
    { value: "blog", label: "Blog" },
    { value: "linkedin", label: "LinkedIn" },
    { value: "marketing", label: "Marketing" },
  ];

  const renderStorageBadge = (
    storage?: string,
    _hash?: string | null,
    txHash?: string | null
  ) => {
    if (storage === '0G_GALILEO' && txHash) {
      return (
        <a
          href={`https://chainscan-galileo.0g.ai/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hashLink"
        >
          <ExternalLink size={14} />
          TX: {txHash.slice(0, 10)}...
        </a>
      );
    }
    if (storage === 'PENDING_0G') {
      return (
        <span className="hashLink pending">
          <Clock size={14} />
          Saving to 0G...
        </span>
      );
    }
    return (
      <span className="hashLink failed">
        <CloudOff size={14} />
        Local only
      </span>
    );
  };

  return (
    <div className="chat">
      {messages.length === 0? (
        <div className="hero">
          <div className="heroIcon">
            <Sparkles size={32} />
          </div>
          <h1>Build AI Content in Seconds</h1>
          <p>Generate tweets, blogs, LinkedIn posts & marketing copy instantly on 0G</p>
          <div className="heroTags">
            {typeOptions.map((opt) => (
              <button
                key={opt.value}
                className={`heroTag ${type === opt.value? "active" : ""}`}
                onClick={() => setType(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="messages">
          {messages.map((m) => (
            <div key={m.id} className={`message ${m.role}`}>
              <div className="messageAvatar">{m.role === "user"? "You" : "AI"}</div>
              <div className="messageContent">

                <div className="messageText markdown">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {m.text}
                  </ReactMarkdown>
                </div>

                {m.role === "ai" && (
                  <div className="messageActions">
                    <button className="copyBtn" onClick={() => copyText(m.text, m.id)}>
                      {copiedId === m.id? <Check size={14} /> : <Copy size={14} />}
                      {copiedId === m.id? "Copied" : "Copy"}
                    </button>
                    {renderStorageBadge(m.storage, m.hash, m.txHash)}

                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="message ai">
              <div className="messageAvatar">AI</div>
              <div className="messageContent">
                <div className="typingIndicator">
                  <span></span><span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      <div className="inputContainer">
        <div className="inputDock">
          <div className="typeSelector">
            {typeOptions.map((opt) => (
              <button
                key={opt.value}
                className={`typeBtn ${type === opt.value? "active" : ""}`}
                onClick={() => setType(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="inputWrapper">
            <textarea
              ref={textareaRef}
              value={input}
              placeholder="Type your idea... (Cmd+Enter to send)"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <button
              onClick={send}
              disabled={loading ||!input.trim()}
              className="sendBtn"
            >
              {loading? <div className="btnSpinner" /> : "Generate"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
