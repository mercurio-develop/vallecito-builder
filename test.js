const fs = require('fs');
const code = fs.readFileSync('src/features/explore/components/explore-map.tsx', 'utf8');
console.log(code.includes('isComplete'));
