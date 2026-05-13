import fs from 'fs';
import { fallbackProducts } from './components/fallback-products.js';

const outputPath = '../Backend/products.json';
fs.writeFileSync(outputPath, JSON.stringify(fallbackProducts, null, 2), 'utf-8');
console.log(`Exported ${fallbackProducts.length} products to ${outputPath}`);
