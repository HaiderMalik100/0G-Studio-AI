import { useState, useEffect } from 'react';
import { ContentData } from '../types';
import { getLibrary } from '../services/api';
import ContentCard from './ContentCard';

export default function Library({ newContent }: { newContent?: ContentData }) {
  const [library, setLibrary] = useState<ContentData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLibrary = async () => {
    try {
      const { data } = await getLibrary();
      setLibrary(data);
    } catch (e) {
      console.error('Failed to load library');
    }
    setLoading(false);
  };

  useEffect(() => { loadLibrary() }, []);

  useEffect(() => {
    if (newContent) setLibrary(prev => [newContent,...prev]);
  }, [newContent]);

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h2 className="text-xl mb-4 font-semibold">Content Library - Stored on 0G</h2>
      {loading? (
        <p className="text-gray-400">Loading from 0G Storage...</p>
      ) : library.length === 0? (
        <p className="text-gray-400">No content yet. Generate something!</p>
      ) : (
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
          {library.map(item => <ContentCard key={item.id} item={item} />)}
        </div>
      )}
    </div>
  )
}
