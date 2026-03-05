const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

const shoe_routes = require('./routes/shoes')
const user_routes = require('./routes/user')
const cart_routes = require('./routes/cart')
connectDB();
 
// Middleware
app.use(cors({origin: 'http://localhost:3000'}));
app.use(express.json());

// Routes
app.use('/api/shoes',shoe_routes)
app.use('/api/cart', cart_routes)
app.use('/api/user', user_routes);

app.get('/')

app.get('/', (req, res) => res.send("API is running...")); // test route

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
