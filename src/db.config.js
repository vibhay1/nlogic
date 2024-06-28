
import mongoose from 'mongoose'
const DB_URL = process.env.NODE_ENV === "development" ? process.env.MONGO_URI : process.env.MONGO_ATLAS_URI;

export default mongoose
    .connect(DB_URL)
    .then(() => {
        console.log('DB Connected')

    });

mongoose.connection.on('error', err => {
    console.log(`DB connection error: ${err.message}`);
    console.timeEnd('connect')
});

