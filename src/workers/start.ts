import { spawn } from 'child_process';
import http from 'http';

console.log("🚀 [Worker Hub] Starting...");

// 1. Create a lightweight HTTP server to satisfy Render's health checks
// and to allow cron-job.org to keep the service awake.
const PORT = process.env.PORT || 8080;
const server = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'OK', message: 'Worker is running' }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, () => {
  console.log(`🌐 [Worker Hub] Health server listening on port ${PORT}`);
});

// 2. Spawn both workers concurrently
const spawnWorker = (name: string, path: string) => {
  console.log(`[Worker Hub] Spawning ${name}...`);
  const worker = spawn('tsx', [path], {
    stdio: 'inherit',
    env: { ...process.env } // Pass all environment variables (including XVFB display)
  });

  worker.on('close', (code) => {
    console.error(`[Worker Hub] ${name} exited with code ${code}. Restarting in 5s...`);
    setTimeout(() => spawnWorker(name, path), 5000);
  });
};

spawnWorker('DiscoveryWorker', 'src/workers/discovery.worker.ts');
spawnWorker('ApplicationWorker', 'src/workers/application.worker.ts');

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log("SIGTERM received, shutting down gracefully...");
  server.close(() => process.exit(0));
});
