module.exports = {
  apps: [
    {
      name: "main-server-3001",
      script: "node ./dist/src/server/start-server.js",
      env: {
        ENV_FILE: ".env"
      }
    },
    {
      name: "main-server-3004",
      script: "node ./dist/src/server/start-server.js",
      env: {
        PORT: 3004,
        ENV_FILE: ".env.3004"
      }
    },
    {
      name: "crypto-currency-prices",
      script: "node ./dist/src/crypto-currency-prices/main.js",
    },
    {
      name: "fiat-exchange-rates-stub",
      script: "node ./dist/src/fiat-exchange-rates/start-stub.js",
    },
  ],
};
