const { spawn } = require('child_process');
const http = require('http');

console.log("🚀 [Worker Hub] Starting...");

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

server.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🌐 [Worker Hub] Health server listening on port ${PORT}`);
});

const spawnWorker = (name, path) => {
  console.log(`[Worker Hub] Spawning ${name}...`);
  // We wrap the workers in xvfb-run here, so the main server starts instantly
  const worker = spawn(`xvfb-run --auto-servernum --server-args="-screen 0 1280x1024x24" ./node_modules/.bin/tsx ${path}`, {
    stdio: 'inherit',
    env: { ...process.env },
    shell: true
  });

  worker.on('close', (code) => {
    console.error(`[Worker Hub] ${name} exited with code ${code}. Restarting in 5s...`);
    setTimeout(() => spawnWorker(name, path), 5000);
  });
};

spawnWorker('DiscoveryWorker', 'src/workers/discovery.worker.ts');
spawnWorker('ApplicationWorker', 'src/workers/application.worker.ts');

process.on('SIGTERM', () => {
  console.log("SIGTERM received, shutting down gracefully...");
  server.close(() => process.exit(0));
});
