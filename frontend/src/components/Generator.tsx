import { useState } from "react";
import { generateContent } from "../services/api";
import { ContentData, ContentType } from "../types";

export default function Generator({
  onNew,
}: {
  onNew: (d: ContentData) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [type, setType] = useState<ContentType>("tweet");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!prompt) return;
    setLoading(true);

    try {
      const { data } = await generateContent(prompt, type);
      onNew(data);
      setPrompt("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col h-full">
      {/* output area placeholder */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <div className="text-gray-500 text-sm">
          Your AI responses will appear here...
        </div>
      </div>

      {/* input bar */}
      <div className="p-4 border-t border-white/10 bg-[#0E0E13]">
        <div className="flex gap-2 mb-2">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ContentType)}
            className="bg-white/5 px-3 py-2 rounded-lg text-sm"
          >
            <option value="tweet">Tweet</option>
            <option value="blog">Blog</option>
            <option value="linkedin">LinkedIn</option>
            <option value="marketing">Marketing</option>
          </select>
        </div>

        <div className="flex gap-2">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="flex-1 bg-white/5 rounded-xl p-3 outline-none resize-none"
            placeholder="Ask something..."
          />

          <button
            onClick={submit}
            disabled={loading}
            className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 rounded-xl"
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}