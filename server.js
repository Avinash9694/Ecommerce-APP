import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import connectDB from './config/db.js';
import authRoute from './routes/authRoute.js';

//configure .env
dotenv.config()

//database config
connectDB();

//rest object
const app = express();

//middlewares
app.use(express.json());
app.use(morgan('dev'));

//routes
app.use('/api/v1/auth',authRoute);

//rest api
app.get('/', (req,res) => {
    res.send(
        "Ecommerce app"
    );
});

//PORT
const PORT = process.env.PORT || 8080;


app.listen(PORT,() =>{
    console.log(`Server is running on ${PORT}`);
});