export default function Inspector({ item }: any) {
  if (!item) {
    return (
      <div className="w-[320px] glass p-4 text-gray-500">
        Select a response
      </div>
    );
  }

  return (
    <div className="w-[320px] glass p-4 flex flex-col gap-3">
      <div className="text-xs text-purple-400">{item.type}</div>

      <div className="text-sm whitespace-pre-wrap">
        {item.content}
      </div>

      <button
        className="btn"
        onClick={() => navigator.clipboard.writeText(item.content)}
      >
        Copy
      </button>
    </div>
  );
}