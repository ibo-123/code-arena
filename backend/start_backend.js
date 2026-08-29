const { MongoMemoryServer } = require('mongodb-memory-server');
const { spawn } = require('child_process');

async function main() {
  const mongod = await MongoMemoryServer.create({
    instance: { dbName: 'code_arena_dev' },
    binary: { checkMD5: false },
  });
  const uri = mongod.getUri();
  console.log('MongoDB Memory Server started at', uri);

  const backend = spawn('node', ['src/server.js'], {
    cwd: __dirname,
    env: { ...process.env, MONGO_URI: uri, PORT: '5000', JWT_SECRET: 'dev-secret-only' },
    stdio: 'inherit',
  });

  process.on('SIGINT', async () => {
    backend.kill('SIGINT');
    await mongod.stop();
    process.exit(0);
  });

  backend.on('exit', async (code) => {
    await mongod.stop();
    process.exit(code);
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
