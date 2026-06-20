import { ContentData } from '../types';

export default function ContentCard({ item }: { item: ContentData }) {
  return (
    <div className="bg-gray-700 p-4 rounded-lg">
      <div className="flex justify-between text-xs text-gray-400 mb-2">
        <span className="uppercase bg-blue-600/20 text-blue-400 px-2 py-1 rounded">{item.type}</span>
        <span>{new Date(item.createdAt).toLocaleString()}</span>
      </div>
      <p className="text-sm mb-2 text-gray-300"><span className="text-gray-500">Prompt:</span> {item.prompt}</p>
      <p className="whitespace-pre-wrap text-sm mb-3">{item.content}</p>
      <div className="flex justify-between items-center">
        <button
          onClick={() => navigator.clipboard.writeText(item.content)}
          className="text-blue-400 text-xs hover:text-blue-300">Copy
        </button>
        {item.hash && (
          <a
            href={`https://storage-testnet.0g.ai/download/${item.hash}`}
            target="_blank"
            className="text-gray-500 text-xs hover:text-gray-300"
            title="View on 0G Storage">
            {item.hash.slice(0,10)}...
          </a>
        )}
      </div>
    </div>
  )
}