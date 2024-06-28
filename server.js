import app from './src/app.js';
process.on('uncaughtException', (err) => {
    console.log(err)
    process.kill(0);
})
app.listen(process.env.PORT, () => {
    console.log(process.env.NODE_ENV, "Server launched @ ", process.env.PORT)
})