/* This script is used to perform server-side functionality needed for the application. */

require('dotenv').config();

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/api/config', (req, res) => {
    res.header("Access-Control-Allow-Origin", "http://127.0.0.1:5500");
    res.json({ API_KEY: process.env.API_KEY });
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});