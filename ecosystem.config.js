module.exports = {
  apps: [
    {
      name: "server",
      cwd: "apps/server",
      script: "pnpm",
      args: "start",
      interpreter: "bash"
    },
    {
      name: "web",
      cwd: "apps/web",
      script: "pnpm",
      args: "start",
      interpreter: "bash"
    },
    {
      name: "landing",
      cwd: "apps/landing",
      script: "pnpm",
      args: "start",
      interpreter: "bash"
    }
  ]
};
