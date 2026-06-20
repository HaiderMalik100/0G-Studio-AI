import { ContentData } from "../types";
import { Plus, X } from "lucide-react";

export default function Sidebar({
  items,
  onSelect,
  activeId,
  onNewChat,
  isOpen,
  onClose,
}: {
  items: ContentData[];
  onSelect: (item: ContentData) => void;
  activeId?: string;
  onNewChat: () => void;
  isOpen: boolean;
  onClose: () => void;
}) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
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
  ).sort((a, b) => b.createdAt - a.createdAt); // Sort by latest message time DESC

  return (
    <>
      {isOpen && (
        <div className="sidebarOverlay" onClick={onClose} />
      )}

      <aside className={`sidebar ${isOpen? "open" : ""}`}>
        <div className="sidebarHeader">
          <span>History</span>
          <button
            className="lg:hidden"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <button className="newChatBtn" onClick={onNewChat}>
          <Plus size={18} />
          New Chat
        </button>

        <div className="sidebarContent">
          {threads.length === 0? (
            <p className="empty">No history yet</p>
          ) : (
            threads.map((i) => (
              <div
                key={i.chatId}
                className={`historyItem ${activeId === i.chatId? "active" : ""}`}
                onClick={() => onSelect(i)}
              >
                <div className="historyMeta">
                  <span className="tag">{i.type}</span>
                  <span className="historyTime">{formatTime(i.createdAt)}</span>
                </div>
                <p className="historyPrompt">{i.prompt}</p>
              </div>
            ))
          )}
        </div>

        <div className="sidebarFooter">
          <p>Powered by 0G Chain & Storage</p>
        </div>
      </aside>
    </>
  );
}
