const ogQueue = require('./dist/services/ogQueue');

const now = Date.now();
const items = [
  {
    id: `test-marketing-${now}`,
    chatId: `chat-${now}`,
    userAddress: '0xDEADBEEF',
    type: 'marketing',
    prompt: 'Test marketing prompt about product launch',
    content: 'Marketing content test\n# Heading\nSome details about launch',
    wordCount: 20,
    qualityScore: 60,
    createdAt: Date.now()
  },
  {
    id: `test-linkedin-${now}`,
    chatId: `chat-${now+1}`,
    userAddress: '0xDEADBEEF',
    type: 'linkedin',
    prompt: 'Test linkedin prompt about career advice',
    content: 'LinkedIn content test\n# Header\nTips and insights',
    wordCount: 20,
    qualityScore: 65,
    createdAt: Date.now()
  }
];

console.log('Adding items to queue');
items.forEach(item => ogQueue.addTo0GQueue(item));

console.log('Waiting 90 seconds for queue to process (watch logs)');
setTimeout(() => {
  console.log('Exiting test script');
  process.exit(0);
}, 90000);
