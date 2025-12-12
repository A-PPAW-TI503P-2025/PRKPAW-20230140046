// my-node-server/controllers/presensiController.js

const { Presensi, User, sequelize } = require("../models");
const { format } = require("date-fns-tz");
const timeZone = "Asia/Jakarta";
const fs = require('fs');
const path = require('path');
const multer = require('multer'); // DIIMPOR PERTAMA

// =======================================================
// A. Konfigurasi Multer (File Handling)
// =======================================================

// 1. Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Folder penyimpanan file, relatif terhadap root proyek (my-node-server)
        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
        // Format nama file: userId-timestamp.ext
        cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

// 2. File Filter (Hanya gambar)
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Hanya file gambar yang diperbolehkan!'), false);
    }
};

// 3. Export Middleware
exports.upload = multer({ storage: storage, fileFilter: fileFilter }); 

// ====================================================================
// CHECK-IN
// ====================================================================
exports.CheckIn = async (req, res) => {
    let namaFileTersimpan = null;
    try {
        const userId = req.user.id;
        const namaUser = req.user.nama;
        const waktuSekarang = new Date();
        const { latitude, longitude } = req.body;
        
        // Ambil nama file dari Multer (req.file)
        namaFileTersimpan = req.file ? req.file.filename : null;

        // 1. Validasi Foto
        if (!namaFileTersimpan) {
            return res.status(400).json({ message: "Bukti foto wajib diunggah." });
        }

        // 2. Cek apakah sudah check-in sebelumnya (belum check-out)
        const existingRecord = await Presensi.findOne({
            where: { userId: userId, checkOut: null },
        });

        if (existingRecord) {
            // HAPUS FILE yang baru saja diupload Multer untuk menghindari sampah
            const filePath = path.join(__dirname, '..', 'uploads', namaFileTersimpan);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath); 
            }
            return res.status(400).json({
                message: "Anda sudah melakukan check-in dan belum check-out. File yang baru diupload telah dihapus.",
            });
        }

        // 3. Buat presensi baru
        const newRecord = await Presensi.create({
            userId: userId,
            checkIn: waktuSekarang,
            latitude: latitude,
            longitude: longitude,
            buktiFoto: `uploads/${namaFileTersimpan}`, // Menyimpan PATH RELATIF (uploads/namafile.jpg)
        });

        return res.status(201).json({
            message: `Halo ${namaUser}, check-in berhasil pada pukul ${format(
                waktuSekarang,
                "HH:mm:ss",
                { timeZone }
            )} WIB`,
            data: {
                id: newRecord.id,
                userId: newRecord.userId,
                checkIn: newRecord.checkIn,
                checkOut: null,
                buktiFoto: newRecord.buktiFoto // Mengirim path lengkap untuk frontend
            }
        });

    } catch (error) {
        console.error("Error CheckIn:", error);
        
        // 4. Penanganan Error (Hapus file jika terjadi kegagalan database atau server)
        if (namaFileTersimpan) {
            const filePath = path.join(__dirname, '..', 'uploads', namaFileTersimpan);
            if (fs.existsSync(filePath)) {
                console.log(`Menghapus file yang gagal disimpan: ${namaFileTersimpan}`);
                fs.unlinkSync(filePath);
            }
        }
        
        return res.status(500).json({
            message: "Terjadi kesalahan pada server",
            error: error.message,
        });
    }
};

// ====================================================================
// CHECK-OUT
// ====================================================================
exports.CheckOut = async (req, res) => {
    try {
        const userId = req.user.id;
        const namaUser = req.user.nama;
        const waktuSekarang = new Date();

        const record = await Presensi.findOne({
            where: { userId: userId, checkOut: null },
        });

        if (!record) {
            return res.status(404).json({
                message: "Anda belum melakukan check-in atau sudah check-out.",
            });
        }

        record.checkOut = waktuSekarang;
        await record.save();

        return res.json({
            message: `Selamat jalan ${namaUser}, check-out berhasil pada pukul ${format(
                waktuSekarang,
                "HH:mm:ss",
                { timeZone }
            )} WIB`,
            data: {
                id: record.id,
                userId: record.userId,
                checkIn: record.checkIn,
                checkOut: record.checkOut,
            }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Terjadi kesalahan pada server",
            error: error.message,
        });
    }
};

// ====================================================================
// UPDATE PRESENSI (ADMIN)
// ====================================================================
exports.updatePresensi = async (req, res) => {
    try {
        const presensiId = req.params.id;
        const { checkIn, checkOut } = req.body;

        if (checkIn === undefined && checkOut === undefined) {
            return res.status(400).json({
                message: "Tidak ada data valid (checkIn/checkOut) untuk diperbarui.",
            });
        }

        const record = await Presensi.findByPk(presensiId);
        if (!record) {
            return res.status(404).json({
                message: "Catatan presensi tidak ditemukan.",
            });
        }

        record.checkIn = checkIn || record.checkIn;
        record.checkOut = checkOut || record.checkOut;
        await record.save();

        return res.json({
            message: "Data presensi berhasil diperbarui.",
            data: record,
        });

    } catch (error) {
        return res.status(500).json({
            message: "Terjadi kesalahan pada server",
            error: error.message,
        });
    }
};

// ====================================================================
// DELETE PRESENSI
// ====================================================================
exports.deletePresensi = async (req, res) => {
    try {
        const presensiId = req.params.id;

        const record = await Presensi.findByPk(presensiId);

        if (!record) {
            return res.status(200).json({ message: "Data tidak ditemukan atau sudah dihapus" });
        }

        // Hapus file foto dari server sebelum menghapus record database
        if (record.buktiFoto) {
            const filePath = path.join(__dirname, '..', 'uploads', record.buktiFoto);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await record.destroy();
        return res.status(200).json({ message: "Data berhasil dihapus" });

    } catch (error) {
        return res.status(500).json({
            message: "Terjadi kesalahan pada server",
            error: error.message,
        });
    }
};