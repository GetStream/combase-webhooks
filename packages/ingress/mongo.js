import 'dotenv/config';
import mongoose from 'mongoose';

export const mongo = await mongoose.connect(process.env.MONGODB_URI, {
    autoIndex: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useNewUrlParser: true,
    poolSize: 10,
    useUnifiedTopology: true,
});