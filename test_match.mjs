import fs from 'fs';
const algorithm = fs.readFileSync('src/utils/rosterAlgorithm.ts', 'utf-8');
console.log(algorithm.substring(algorithm.indexOf('days.forEach(day => {') - 100, algorithm.indexOf('days.forEach(day => {') + 3000));
