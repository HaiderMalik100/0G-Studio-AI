import { ContentData } from "../types";
import { Plus, X, Loader2, ExternalLink, Clock, CloudOff } from "lucide-react";

export default function Sidebar({
  items,
  onSelect,
  activeId,
  onNewChat,
  isOpen,
  onClose,
  onLoadMore,
  hasMore,
  loading,
}: {
  items: ContentData[];
  onSelect: (item: ContentData) => void;
  activeId?: string;
  onNewChat: () => void;
  isOpen: boolean;
  onClose: () => void;
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
}) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    if (hours < 168) return `${Math.floor(hours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  // Group by chatId and get latest message per thread
  const threads = Object.values(
    items.reduce((acc, item) => {
      const existing = acc[item.chatId];
      // Keep the item with latest createdAt for each chatId
      if (!existing || item.createdAt > existing.createdAt) {
        acc[item.chatId] = item;
      }
      return acc;
    }, {} as Record<string, ContentData>)
  ).sort((a, b) => b.createdAt - a.createdAt);

  const renderTxBadge = (item: ContentData) => {
    if (item.storage === '0G_GALILEO' && item.txHash) {
      return (
        <a
          href={`https://chainscan-galileo.0g.ai/tx/${item.txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="threadTxBadge success"
          onClick={(e) => e.stopPropagation()}
          title="View on 0G Explorer"
        >
          <ExternalLink size={12} />
        </a>
      );
    }
    if (item.storage === 'PENDING_0G') {
      return (
        <span className="threadTxBadge pending" title="Saving to 0G...">
          <Clock size={12} className="animate-spin" />
        </span>
      );
    }
    if (item.storage === 'FAILED') {
      return (
        <span className="threadTxBadge failed" title="0G upload failed">
          <CloudOff size={12} />
        </span>
      );
    }
    return null;
  };

  return (
    <>
      {isOpen && <div className="sidebarOverlay" onClick={onClose} />}

      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebarHeader">
          <span>History</span>
          <button className="lg:hidden" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <button className="newChatBtn" onClick={onNewChat}>
          <Plus size={18} />
          New Chat
        </button>

        <div className="sidebarContent">
          {threads.length === 0 && !loading ? (
            <p className="empty">No history yet</p>
          ) : (
            <>
              {threads.map((i) => (
                <div
                  key={i.chatId}
                  className={`historyItem ${activeId === i.chatId ? "active" : ""}`}
                  onClick={() => onSelect(i)}
                >
                  <div className="historyMeta">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="tag">{i.type}</span>
                      {renderTxBadge(i)}
                    </div>
                    <span className="historyTime">{formatTime(i.createdAt)}</span>
                  </div>
                  <p className="historyPrompt">{i.prompt}</p>
                </div>
              ))}

              {hasMore && (
                <button 
                  className="loadMoreBtn" 
                  onClick={onLoadMore}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </button>
              )}
            </>
          )}
        </div>

        <div className="sidebarFooter">
          <p>Powered by 0G Chain & Storage</p>
        </div>
      </aside>
    </>
  );
}
