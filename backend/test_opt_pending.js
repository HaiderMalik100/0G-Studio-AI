require('dotenv').config();
const og = require('./dist/services/ogStorage');
const queue = require('./dist/services/ogQueue');

const addr = '0xdeadbeef';
const id = `opt-${Date.now()}`;
const data = {
  id,
  chatId: `chat-${id}`,
  userAddress: addr,
  type: 'marketing',
  prompt: 'Optimistic save test',
  content: 'This is a test content to check optimistic manifest',
  wordCount: 10,
  qualityScore: 60,
  createdAt: Date.now()
};

(async ()=>{
  console.log('Saving pending entry and adding to queue:', id);
  await og.savePendingEntry(addr, id);
  queue.addTo0GQueue(data);

  console.log('Manifest after pending save:');
  console.log(JSON.stringify(require('fs').readFileSync(require('os').tmpdir() + '/0g_manifests.json','utf8').slice(0,800)));

  console.log('Waiting 30s for upload to finish...');
  await new Promise(r=>setTimeout(r,30000));

  console.log('Manifest after upload:');
  console.log(require('fs').readFileSync(require('os').tmpdir() + '/0g_manifests.json','utf8'));
})();
