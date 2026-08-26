import bcrypt from 'bcrypt';

const hash = '$2b$10$hA2RhQwwpvky/PO6HiF2Juv7yy5KmMTjRdy61HR8i29NYBPNFKXdO';
const passwords = ['Admin@123', 'admin123', 'password123', 'Admin123', 'mujcode123', 'admin@123', 'Admin@1234'];

for (const p of passwords) {
  const match = await bcrypt.compare(p, hash);
  console.log(`${p}: ${match}`);
}
