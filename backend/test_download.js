require('dotenv').config();

(async ()=>{
  const og = require('./dist/services/ogStorage');
  const addr = '0xbce1097b25160fb9e908bd98c72899b5bef8a2ba';
  console.log('Getting hashes for', addr);
  const hashes = await og.getUserHashes(addr);
  console.log('Found', (hashes||[]).length, 'entries');
  for (let i=0;i<Math.min(6, hashes.length);i++){
    const h = hashes[i];
    console.log('\n#', i, h);
    try{
      const data = await og.downloadFrom0G(h.rootHash);
      console.log('Downloaded content id:', data.id, 'createdAt:', data.createdAt);
      console.log('Content preview:', (data.content||'').slice(0,200).replace(/\n/g,' '));
    }catch(e){
      console.error('Download failed for', h.rootHash, e && e.message);
    }
  }
})();
