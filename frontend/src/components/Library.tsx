import { useState, useEffect } from 'react';
import { ContentData } from '../types';
import { getLibrary } from '../services/api';
import ContentCard from './ContentCard';

export default function Library({ newContent }: { newContent?: ContentData }) {
  const [library, setLibrary] = useState<ContentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const loadLibrary = async (pageNum = 0) => {
    try {
      setLoading(true);
      // FIX: Pass limit + offset
      const { data, hasMore: more } = await getLibrary({
        limit: 20,
        offset: pageNum * 20
      });
      setLibrary(prev => pageNum === 0? data : [...prev,...data]);
      setHasMore(more);
      setPage(pageNum);
    } catch (e) {
      console.error('Failed to load library', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLibrary(0) }, []);

  useEffect(() => {
    if (newContent) setLibrary(prev => [newContent,...prev]);
  }, [newContent]);

  const loadMore = () => {
    if (!loading && hasMore) {
      loadLibrary(page + 1);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h2 className="text-xl mb-4 font-semibold">Content Library - Stored on 0G</h2>
      {loading && library.length === 0? (
        <p className="text-gray-400">Loading from MongoDB...</p>
      ) : library.length === 0? (
        <p className="text-gray-400">No content yet. Generate something!</p>
      ) : (
        <>
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {library.map(item => <ContentCard key={item.id} item={item} />)}
          </div>
          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loading}
              className="mt-4 w-full py-2 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50"
            >
              {loading? 'Loading...' : 'Load More'}
            </button>
          )}
        </>
      )}
    </div>
  );
}
