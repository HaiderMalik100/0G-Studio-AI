import { useState, useEffect, useCallback } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAuth } from "./hooks/useAuth";
import Chat from "./components/Chat";
import Sidebar from "./components/SidebarHistory";
import { ContentData } from "./types";
import { Menu } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { getLibrary } from "./services/api";
import { useTxHashPoller } from "./hooks/useTxHashPoller";
import "./styles/app.css";

export default function App() {
  const { token, isConnected } = useAuth();
  const [history, setHistory] = useState<ContentData[]>([]);
  const [activeChatId, setActiveChatId] = useState<string>(() => uuidv4());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  // Load history with pagination
  useEffect(() => {
    if (!token) {
      setHistory([]);
      setPage(0);
      setHasMore(true);
      return;
    }
    
    setLoading(true);
    getLibrary({ limit: 20, offset: page * 20 })
      .then(({ data, hasMore }) => {
        setHistory(p => page === 0 ? data : [...p, ...data]);
        setHasMore(hasMore);
      })
      .catch((err) => console.error("Library load failed:", err))
      .finally(() => setLoading(false));
  }, [token, page]);

  // FIX: Match useTxHashPoller signature - (id, data: Partial<ContentData>)
  const handleTxHashUpdate = useCallback((id: string, update: Partial<ContentData>) => {
    setHistory(p => p.map(h => 
      h.id === id 
        ? { ...h, ...update, updatedAt: Date.now() } 
        : h
    ));
  }, []);

  useTxHashPoller(history, handleTxHashUpdate);

  const addHistory = (data: ContentData) => {
    setHistory((p) => [...p, data]); // Add to top
    setActiveChatId(data.chatId);
  };

  const openHistory = (item: ContentData) => {
    setActiveChatId(item.chatId);
    setSidebarOpen(false);
  };

  const handleNewChat = () => {
    setActiveChatId(uuidv4());
    setSidebarOpen(false);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(p => p + 1);
    }
  };

const activeMessages = history
  .filter((h) => h.chatId === activeChatId)
  .sort((a, b) => a.createdAt - b.createdAt); // oldest first
  
  if (!isConnected) {
    return (
      <div className="authScreen">
        <div className="authBgGrid"></div>
        <div className="authCard">
          <div className="authBadge">0G Zero Cup Hackathon</div>
          <h1>Nexus AI</h1>
          <p>
            Create tweets, blogs, LinkedIn posts & marketing copy.
            Every generation is stored permanently on 0G decentralized storage.
          </p>
          <div className="authConnectWrapper">
            <ConnectButton />
          </div>
          <a
            href="https://0g.ai/arena/zero-cup"
            target="_blank"
            rel="noopener noreferrer"
            className="authLink"
          >
            Learn about Zero Cup
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="layout">
      <Sidebar
        items={history}
        onSelect={openHistory}
        activeId={activeChatId}
        onNewChat={handleNewChat}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLoadMore={loadMore}
        hasMore={hasMore}
        loading={loading}
      />

      <main className="main">
        <header className="topbar">
          <div className="topbarLeft">
            <button
              className="mobileMenuBtn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open history"
            >
              <Menu size={20} />
            </button>
            <div className="brand">Nexus AI</div>
          </div>

          <div className="topbarRight">
            <ConnectButton
              accountStatus={{
                smallScreen: 'avatar',
                largeScreen: 'full'
              }}
              chainStatus={{
                smallScreen: 'none',
                largeScreen: 'full'
              }}
              showBalance={false}
            />
          </div>
        </header>

        <Chat
          onNew={addHistory}
          externalMessages={activeMessages}
          chatId={activeChatId}
        />
      </main>
    </div>
  );
}
