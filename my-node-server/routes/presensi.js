// my-node-server/routes/presensi.js

const express = require('express');
const router = express.Router();
const presensiController = require('../controllers/presensiController');
const { authenticateToken } = require('../middleware/permissionMiddleware'); 
const { body, validationResult } = require('express-validator');

// Ambil instance Multer dari controller
const { upload } = presensiController; 


// Middleware otentikasi diterapkan ke semua rute di bawah ini
router.use(authenticateToken);

// =======================================================
// CHECK-IN ROUTE (Route yang menggunakan file upload)
// =======================================================
router.post(
  '/checkin', 
  upload.single('buktiFoto'), 
  presensiController.CheckIn
);

// =======================================================
// ROUTE LAINNYA
// =======================================================

// CHECK-OUT ROUTE
router.post('/checkout', presensiController.CheckOut);

// ROUTE UPDATE/DELETE
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