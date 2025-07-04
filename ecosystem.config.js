module.exports = {
  apps: [
    {
      name: "server",
      cwd: "apps/server",
      script: "pnpm",
      args: "start"
    },
    {
      name: "web",
      cwd: "apps/web",
      script: "pnpm",
      args: "start"
    },
    {
      name: "landing",
      cwd: "apps/landing",
      script: "pnpm",
      args: "start"
    }
  ]
}
