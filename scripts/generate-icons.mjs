import sharp from 'sharp';
import { readFileSync } from 'fs';

const iconPath = 'C:\\Users\\chima\\.gemini\\antigravity\\brain\\9955eadd-387d-4e32-9df1-c1b61c822110\\app_icon_1773224645585.png';

const img = readFileSync(iconPath);

// 192x192
await sharp(img).resize(192, 192).toFile('./public/icon-192.png');
console.log('✅ icon-192.png created');

// 512x512
await sharp(img).resize(512, 512).toFile('./public/icon-512.png');
console.log('✅ icon-512.png created');

// 180x180 apple touch icon
await sharp(img).resize(180, 180).toFile('./public/apple-touch-icon.png');
console.log('✅ apple-touch-icon.png created');

// 32x32 favicon
await sharp(img).resize(32, 32).toFile('./public/favicon-32.png');
console.log('✅ favicon-32.png created');

// screenshot placeholder (for PWA install UI)
await sharp(img).resize(390, 844, { fit: 'contain', background: '#050505' }).toFile('./public/screenshot-mobile.png');
console.log('✅ screenshot-mobile.png created');

console.log('\n🎉 All icons generated successfully!');
