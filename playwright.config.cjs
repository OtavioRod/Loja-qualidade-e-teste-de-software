const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir:'./tests/interface',workers:1,
  use:{baseURL:process.env.BASE_URL || 'http://127.0.0.1:3000',trace:'retain-on-failure'},
  reporter:[['list'],['html',{open:'never'}]]
});
