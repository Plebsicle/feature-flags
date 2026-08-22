module.exports = {
  apps: [
    {
      name: "server",
      cwd: "apps/server",
      script: "dist/index.js",
      env: { NODE_ENV: "production" }
    },
    {
      name: "web",
      cwd: "apps/web",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      env: { NODE_ENV: "production" }
    },
    {
      name: "landing",
      cwd: "apps/landing",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      env: { NODE_ENV: "production" }
    }
  ]
}
