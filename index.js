require('dotenv').config();

const express = require('express');
const cors = require('cors');

const server = express();

require('./config/db');

const route = require('./router/route');

// Middleware
server.use(cors());
server.use(express.json()); // Must come BEFORE routes

// Routes
server.use(route);

server.get('/', (req, res) => {
    res.send('Welcome to Stock Master');
});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});