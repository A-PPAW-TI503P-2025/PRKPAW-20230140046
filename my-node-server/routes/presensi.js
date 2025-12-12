// my-node-server/routes/presensi.js

const express = require('express');
const router = express.Router();
const presensiController = require('../controllers/presensiController');
const { authenticateToken } = require('../middleware/permissionMiddleware'); 
const { body, validationResult } = require('express-validator');

// Impor modul Multer (ditempatkan di sini)
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Path ke folder uploads dari root server
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// 🎯 KONFIGURASI MULTER
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); 
  },
  filename: (req, file, cb) => {
    const userId = req.user ? req.user.id : 'unknown'; 
    const ext = path.extname(file.originalname);
    cb(null, `${userId}-${Date.now()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Hanya file gambar yang diperbolehkan!'), false);
    }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } 
});
// -------------------- END MULTER CONFIG --------------------


// Middleware otentikasi diterapkan ke semua rute di bawah ini
router.use(authenticateToken);

// CHECK-IN ROUTE
router.post(
  '/check-in', 
  upload.single('buktiFoto'), 
  presensiController.CheckIn
);

// CHECK-OUT ROUTE
router.post('/check-out', presensiController.CheckOut);

// ROUTE UPDATE/DELETE (Contoh route lain)
router.put(
  '/:id',
  [
    body('checkIn').optional().isISO8601().withMessage('checkIn harus berupa format tanggal yang valid'),
    body('checkOut').optional().isISO8601().withMessage('checkOut harus berupa format tanggal yang valid'),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validasi gagal',
        errors: errors.array(),
      });
    }
    next();
  },
  presensiController.updatePresensi
);

router.delete('/:id', presensiController.deletePresensi);

module.exports = router;