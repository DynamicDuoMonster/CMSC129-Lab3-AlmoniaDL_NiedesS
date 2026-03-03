const express = require("express");
const cors = require("cors");
const connectDB = require('./config/db');
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

const shoe_routes = require('./routes/shoes')
const user_routes = require('./routes/user')

connectDB();
 
// Middleware
app.use(cors({origin: 'http://localhost:3000'}));
app.use(express.json());

// Routes
app.get('/', (req, res) => res.send("API is running...")); // test route

app.use('/api/shoes',shoe_routes)
app.use('/api/user', user_routes);

app.get('/')

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
