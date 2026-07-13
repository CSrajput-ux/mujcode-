import { createServer } from 'node:http';
import { createApp } from './app.js';
import { config } from './config.js';
import { setupSockets } from './sockets/index.js';
import { connectDB } from './config/db.js';

const app = await createApp();
const server = createServer(app);
setupSockets(server);

// Connect to MongoDB Database
connectDB();

server.listen(config.port, config.host, () => {
  console.log(`MujCode backend running at http://localhost:${config.port}`);
});
