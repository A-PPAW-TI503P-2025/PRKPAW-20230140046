# Di folder my-node-server
- npm install jsonwebtoken bcryptjs
- npx sequelize-cli migration:generate --name remove-nama-from-presensi
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  // Fungsi 'up' diterapkan saat Anda menjalankan db:migrate
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Presensis', 'nama'); // Hapus kolom 'nama'
  },

  // Fungsi 'down' diterapkan saat Anda ingin membatalkan migration (db:undo)
  async down(queryInterface, Sequelize) {
    // Tambahkan kembali kolom 'nama' (sebagai fallback)
    await queryInterface.addColumn('Presensis', 'nama', {
      type: Sequelize.STRING,
      allowNull: true, // Asumsikan nilai default
    });
  }
};
- npx sequelize-cli db:migrate

# Di folder models



# Di folder my node server/ middleware



// ... (exports.deletePresensi dan exports.updatePresensi)
// Pastikan menghapus semua referensi 'nama' di sini juga.




# Di folder my-react-app
- npm install axios jwt-decode react-router-dom




# src





- // src/components/ReportPage.js

import React, { useState, useEffect } from 'react';
import axios from 'axios'; // <-- WAJIB: Import axios
import { useNavigate } from 'react-router-dom';

const REPORTS_URL = "http://localhost:3001/api/reports/daily"; // Endpoint API

function ReportPage() {
    // State yang diperlukan
    const [reports, setReports] = useState([]); // [cite: 85]
    const [error, setError] = useState(null); // [cite: 85]
    const navigate = useNavigate(); // [cite: 85]
    const [searchTerm, setSearchTerm] = useState(""); // [cite: 85]
    // Tambahkan state loading jika diperlukan

    // --- FUNGSI UTAMA: Mengambil Laporan dari Backend ---
    const fetchReports = async (term) => {
        const token = localStorage.getItem("token"); // [cite: 87]
        
        // 1. Pengamanan Token
        if (!token) {
            navigate("/login"); // [cite: 89]
            return;
        }

        try {
            // Logika untuk menambahkan Query Parameter (?nama=...)
            const query = term ? `?nama=${term}` : ''; 
            const url = `${REPORTS_URL}${query}`;

            const config = {
                headers: {
                    Authorization: `Bearer ${token}`, // [cite: 94]
                },
            };

            // 2. Panggil API Admin (Dilindungi oleh JWT dan isAdmin)
            const response = await axios.get(url, config); // <-- PANGGILAN API DITAMBAHKAN

            setReports(response.data.data); // Asumsi data laporan ada di response.data.data
            setError(null);

        } catch (err) {
            // 3. Tangani Error Akses (403 Forbidden atau 401 Unauthorized)
            console.error("Error fetching reports:", err);
            const message = err.response 
                ? err.response.data.message // Ambil pesan dari middleware/controller
                : "Gagal memuat laporan: Server tidak merespons.";
            
            setError(message);
            setReports([]); // Kosongkan laporan jika gagal
        }
    };
    
    // --- Lifecycle dan Event Handlers ---

    // Mengambil data saat komponen dimuat (useEffect)
    useEffect(() => {
        fetchReports(""); // [cite: 104-106]
    }, [navigate]);

    // Menangani pengiriman form pencarian [cite: 107-110]
    const handleSearchSubmit = (e) => {
        e.preventDefault(); // Mencegah refresh halaman
        fetchReports(searchTerm);
    };

    // --- Rendering UI ---

    return (
        <div className="max-w-6xl mx-auto p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">
                Laporan Presensi Harian
            </h1>

            {/* Form Pencarian */}
            <form onSubmit={handleSearchSubmit} className="mb-6 flex space-x-2">
                <input
                    type="text"
                    placeholder="Cari berdasarkan nama..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                    type="submit"
                    className="py-2 px-4 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700"
                >
                    Cari
                </button>
            </form>

            {/* Menampilkan Error */}
            {error && (
                <p className="text-red-600 bg-red-100 p-4 rounded-md mb-4">{error}</p>
            )}

            {/* Tampilan Tabel Laporan */}
            {!error && (
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-In</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-Out</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {reports.length > 0 ? (
                                reports.map((presensi) => (
                                    <tr key={presensi.id}>
                                        {/* Mengakses data User melalui relasi 'user' */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {presensi.user ? presensi.user.nama : "N/A"}
                                        </td>
                                        {/* Menampilkan Check-In dengan format zona waktu */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(presensi.checkIn).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}
                                        </td>
                                        {/* Menampilkan Check-Out dengan format zona waktu */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {presensi.checkOut
                                                ? new Date(presensi.checkOut).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })
                                                : "Belum Check-Out"}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                                        Tidak ada data yang ditemukan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default ReportPage;
