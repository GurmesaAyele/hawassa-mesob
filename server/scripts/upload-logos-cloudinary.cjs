const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const cloudinary = require('cloudinary').v2;
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Configure Cloudinary
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloudinary_url: process.env.CLOUDINARY_URL,
    secure: true,
  });
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME || process.env.CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY || process.env.API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET || process.env.API_SECRET,
    secure: true,
  });
}

const LOGOS_DIR = path.resolve(__dirname, '../public/logos');

const INSTITUTION_LOGOS = [
  { code: 'NATIONAL_ID_PROGRAM', file: 'fayda.png' },
  { code: 'ICS', file: 'immigration.png' },
  { code: 'ETHIO_POST', file: 'post.png' },
  { code: 'HAWASSA_TRADE', file: 'Trade_and_Market.png' },
  { code: 'EEU', file: 'eeu.png' },
  { code: 'URBAN_DEV_CONSTRUCTION', file: 'Urban_Development.png' },
  { code: 'HAWASSA_LAND', file: 'Land_Administration.png' },
  { code: 'LABOR_AND_SKILLS', file: 'LABOR_AND_SKILLS.png' },
  { code: 'HAWASSA_REVENUE', file: 'HAWASSA_REVENUE.png' },
  { code: 'JUSTICE_DEPT', file: 'JUSTICE_DEPT.png' },
  { code: 'ETHIO_TELECOM', file: 'telecom.png' },
  { code: 'CBE', file: 'cbe.png' },
  { code: 'SIDAMA_BANK', file: 'sidama_bank.png' },
];

async function main() {
  const config = cloudinary.config();
  console.log('=== Cloudinary Configuration Check ===');
  console.log(`Cloud Name : ${config.cloud_name ? config.cloud_name : 'MISSING'}`);
  console.log(`API Key    : ${config.api_key ? '******' + String(config.api_key).slice(-4) : 'MISSING'}`);
  console.log(`API Secret : ${config.api_secret ? 'EXISTS' : 'MISSING'}`);

  if (!config.cloud_name || !config.api_key || !config.api_secret) {
    console.error('\n[ERROR] Cloudinary credentials are not found in server/.env');
    console.error('Please ensure the following environment variables are saved in server/.env:');
    console.error('  CLOUDINARY_CLOUD_NAME=your_cloud_name');
    console.error('  CLOUDINARY_API_KEY=your_api_key');
    console.error('  CLOUDINARY_API_SECRET=your_api_secret');
    console.error('Or:');
    console.error('  CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>\n');
    process.exit(1);
  }

  console.log('\n[START] Uploading logos to Cloudinary and updating database...\n');
  const results = [];

  for (const item of INSTITUTION_LOGOS) {
    const filePath = path.join(LOGOS_DIR, item.file);
    if (!fs.existsSync(filePath)) {
      console.warn(`[SKIP] Logo file not found: ${filePath}`);
      continue;
    }

    try {
      console.log(`Uploading ${item.file} for ${item.code}...`);
      const uploadRes = await cloudinary.uploader.upload(filePath, {
        folder: 'hawassa-mesob/logos',
        public_id: path.parse(item.file).name,
        overwrite: true,
        use_filename: true,
        unique_filename: false,
        resource_type: 'image',
      });

      console.log(` -> Cloudinary URL: ${uploadRes.secure_url}`);

      // Update in Neon PostgreSQL database
      const updated = await prisma.serviceProvider.update({
        where: { code: item.code },
        data: { icon: uploadRes.secure_url },
        select: { code: true, icon: true },
      });

      results.push({
        code: updated.code,
        status: 'SUCCESS',
        icon: updated.icon,
      });
      console.log(` -> DB updated successfully for ${item.code}\n`);
    } catch (err) {
      console.error(`[ERROR] Failed for ${item.code}:`, err.message);
      results.push({
        code: item.code,
        status: 'FAILED',
        error: err.message,
      });
    }
  }

  console.log('\n=== Summary of Institution Logos Upload ===');
  console.table(results);
}

main()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
