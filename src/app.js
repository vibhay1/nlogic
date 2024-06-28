import express from 'express';
import 'dotenv/config';
import './db.config.js'
import './service.js'
import helmet from 'helmet';

const app = express();
app.use(express.json({ limit: '1024mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(helmet());

app.use('/', (req, res) => {
    res.send({
        msg: "Hello, there!"
    })
});



export default app;
