export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
  github: {
    appId: process.env.GITHUB_APP_ID,
    privateKey: process.env.GITHUB_PRIVATE_KEY
      ? Buffer.from(process.env.GITHUB_PRIVATE_KEY, 'base64').toString('utf8')
      : '',
    webhookSecret: process.env.GITHUB_WEBHOOK_SECRET,
  },
});
