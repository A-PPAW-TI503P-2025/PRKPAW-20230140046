// my-node-server/server.js

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path"); 

const app = express();
const PORT = 3001;

// Impor router
const presensiRoutes = require("./routes/presensi");
const reportRoutes = require("./routes/reports");
const authRoutes = require("./routes/auth");
const ruteBuku = require("./routes/books"); // Pastikan ini juga diimpor jika digunakan

// =======================================================
// MIDDLEWARE UTAMA
// =======================================================
app.use(cors()); 
app.use(express.json()); 
app.use(morgan("dev")); 

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// =======================================================
// KONFIGURASI FILE STATIS (SOLUSI FOTO)
// =======================================================
// Menyajikan file statis dari folder 'uploads' di URL /uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// =======================================================
// ROUTE HANDLER
// =======================================================
app.get("/", (req, res) => {
    res.send("Home Page for API");
});

app.use("/api/books", ruteBuku);
app.use("/api/presensi", presensiRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/auth", authRoutes);

// =======================================================
// SERVER START
// =======================================================

app.listen(PORT, () => {
    console.log(`Express server running at http://localhost:${PORT}/`);
});