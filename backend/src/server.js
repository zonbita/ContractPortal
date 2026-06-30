import 'dotenv/config';
import http from 'http';
import app from './app.js';
import { connectDB } from './config/db.js';
import { startReminderCron } from './jobs/reminderCron.js';
import { initSocket } from './socket/index.js';

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  startReminderCron();
  const server = http.createServer(app);
  initSocket(server);
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
