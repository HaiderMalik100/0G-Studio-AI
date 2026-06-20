require('dotenv').config();
const og = require('./dist/services/ogStorage');
const queue = require('./dist/services/ogQueue');
const fs = require('fs');
const os = require('os');

const addr = '0xbce1097b25160fb9e908bd98c72899b5bef8a2ba';
const id = `live-${Date.now()}`;
const data = {
  id,
  chatId: `chat-${id}`,
  userAddress: addr,
  type: 'marketing',
  prompt: 'Live test: marketing content',
  content: 'Live test content to verify optimistic save',
  wordCount: 8,
  qualityScore: 60,
  createdAt: Date.now()
};

(async ()=>{
  console.log('Saving pending entry and adding to queue:', id);
  await og.savePendingEntry(addr, id);
  queue.addTo0GQueue(data);

  console.log('Manifest snapshot (first 200 chars):');
  console.log(fs.readFileSync(os.tmpdir() + '/0g_manifests.json','utf8').slice(0,200));

  console.log('Now waiting 35s for upload to finish...');
  await new Promise(r=>setTimeout(r,35000));

  console.log('Manifest after upload (search for id):');
  const m = JSON.parse(fs.readFileSync(os.tmpdir() + '/0g_manifests.json','utf8'));
  console.log(JSON.stringify(m[addr.toLowerCase()].slice(-5), null, 2));

  const latest = m[addr.toLowerCase()].slice(-1)[0];
  console.log('Latest entry:', latest);
  if (latest && latest.rootHash && !latest.rootHash.startsWith('PENDING:')){
    try{
      const content = await og.downloadFrom0G(latest.rootHash);
      console.log('Downloaded latest content id:', content.id, 'createdAt:', content.createdAt);
      console.log('Preview:', (content.content||'').slice(0,200));
    }catch(e){
      console.error('Download failed', e && e.message);
    }
  }
})();
