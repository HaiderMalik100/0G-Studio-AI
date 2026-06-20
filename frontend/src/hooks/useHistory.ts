import { useEffect, useState } from "react";
import { ContentData } from "../types";

const KEY = "0g_workspace_history";

export const useHistory = () => {
  const [history, setHistory] = useState<ContentData[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const data = localStorage.getItem(KEY);
    if (data) setHistory(JSON.parse(data));
  }, []);

  const add = (item: ContentData) => {
    setHistory((prev) => {
      const updated = [item, ...prev].slice(0, 100);
      localStorage.setItem(KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const filtered = history.filter(
    (h) =>
      h.prompt.toLowerCase().includes(query.toLowerCase()) ||
      h.content.toLowerCase().includes(query.toLowerCase())
  );

  return { history: filtered, add, query, setQuery };
};