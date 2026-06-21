import { useState, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAuth } from "./hooks/useAuth";
import Chat from "./components/Chat";
import Sidebar from "./components/SidebarHistory";
import { ContentData } from "./types";
import { Menu } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import "./styles/app.css";
import { getLibrary } from "./services/api";

export default function App() {
  const { token, address, isConnected } = useAuth();
  const [history, setHistory] = useState<ContentData[]>([]);
  const [activeChatId, setActiveChatId] = useState<string>(() => uuidv4());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load history on login
  useEffect(() => {
    if (token) {
      getLibrary()
       .then(({ data }) => {
          setHistory(data || []);
        })
       .catch((err) => console.error("Library load failed:", err));
    } else {
      setHistory([]);
    }
  }, [token]);

  const addHistory = (data: ContentData) => {
  setHistory((p) => {
    const exists = p.find(item => item.id === data.id);
    if (exists) {
      // Update existing: replace "Saving..." with final TX
      return p.map(item => item.id === data.id ? data : item);
    }
    // New item
    return [...p, data];
  });
  setActiveChatId(data.chatId);
};


  const openHistory = (item: ContentData) => {
    setActiveChatId(item.chatId);
    setSidebarOpen(false);
  };

  const handleNewChat = () => {
  const newId = uuidv4();
  setActiveChatId(newId);
  setSidebarOpen(false);
  // Force clear any cached render
  setHistory(prev => [...prev]); // trigger rerender
};

  const activeMessages = history.filter((h) => h.chatId === activeChatId);

  if (!isConnected) {
    return (
      <div className="authScreen">
        <div className="authBgGrid"></div>
        <div className="authCard">
          <div className="authBadge">0G Zero Cup Hackathon</div>
          <h1>0G Studio AI</h1>
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
      />

      <main className="main">
        <header className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              className="mobileMenuBtn"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={16} />
            </button>
            <div className="brand">0G Studio AI</div>
          </div>

          <div className="topbarRight">
            <span className="wallet">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
            <ConnectButton />
          </div>
        </header>

        <Chat
  key={activeChatId}  // <- Add this line
  onNew={addHistory}
  externalMessages={activeMessages}
  chatId={activeChatId}
/>

      </main>

    </div>
    
  );
}
