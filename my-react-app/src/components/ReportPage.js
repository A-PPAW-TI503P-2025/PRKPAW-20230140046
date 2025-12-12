import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// =======================================================
// Komponen Modal (Popup) - DIDEKLARASIKAN DI LUAR FUNGSI UTAMA
// =======================================================
const PhotoModal = ({ isOpen, onClose, imageUrl }) => {
    if (!isOpen || !imageUrl) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-4 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto relative">
                <button 
                    onClick={onClose} 
                    className="absolute top-2 right-4 text-gray-700 hover:text-red-600 font-bold text-3xl transition-colors"
                >
                    &times;
                </button>
                <img 
                    src={imageUrl} 
                    alt="Bukti Foto Presensi Penuh" 
                    className="w-full h-auto object-contain" 
                />
            </div>
        </div>
    );
};


function ReportPage() {
    // STATE LAMA
    const [reports, setReports] = useState([]);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");

    // STATE BARU DITAMBAHKAN UNTUK MODAL
    const [modalOpen, setModalOpen] = useState(false);
    const [modalImage, setModalImage] = useState('');

    const openModal = (url) => {
        setModalImage(url);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setModalImage('');
    };

    // FUNGSI LAMA
    const formatDateTime = (dateString) => {
        if (!dateString) return "N/A";
        try {
            return new Date(dateString).toLocaleString("id-ID", {
                year: 'numeric', month: 'numeric', day: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit',
                timeZone: "Asia/Jakarta",
            });
        } catch (e) {
            return "Format Tanggal Salah";
        }
    };

    const fetchReports = async (query) => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }

        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };

            const baseUrl = "http://localhost:3001/api/reports/daily";
            const url = query ? `${baseUrl}?nama=${query}` : baseUrl;

            const response = await axios.get(url, config);

            setReports(response.data.data);
            setError(null);
        } catch (err) {
            setReports([]);
            setError(
                err.response ? err.response.data.message : "Gagal mengambil data"
            );
        }
    };

    useEffect(() => {
        fetchReports("");
    }, []);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchReports(searchTerm);
    };

    return (
        <div className="max-w-7xl mx-auto p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">
                Laporan Presensi Harian
            </h1>

            {/* Form Pencarian dan Error */}
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

            {error && (
                <p className="text-red-600 bg-red-100 p-4 rounded-md mb-4">{error}</p>
            )}

            {/* Tabel */}
            {!error && (
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-In</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-Out</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Latitude</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Longitude</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Foto</th> 
                            </tr>
                        </thead>

                        <tbody className="bg-white divide-y divide-gray-200">
                            {reports.length > 0 ? (
                                reports.map((presensi) => (
                                    <tr key={presensi.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{presensi.user?.nama ?? "N/A"}</td>

                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDateTime(presensi.checkIn)}
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {presensi.checkOut ? formatDateTime(presensi.checkOut) : "Belum Check-Out"}
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {presensi.latitude || "N/A"}
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {presensi.longitude || "N/A"}
                                        </td>

                                        {/* TAMPILAN FOTO DAN ONCLICK MODAL */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {presensi.buktiFoto ? ( 
                                                <img
                                                    // src: http://localhost:3001/uploads/1-timestamp.jpg
                                                    src={`http://localhost:3001/${presensi.buktiFoto}`} 
                                                    alt="Foto Presensi"
                                                    className="w-16 h-16 object-cover rounded-md shadow cursor-pointer" 
                                                    onClick={() => openModal(`http://localhost:3001/${presensi.buktiFoto}`)}
                                                />
                                            ) : (
                                                <span className="text-gray-400 italic">
                                                    Tidak ada foto
                                                </span>
                                            )}
                                        </td>
                                        
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                                        Tidak ada data yang ditemukan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* KOMPONEN MODAL */}
            <PhotoModal
                isOpen={modalOpen}
                onClose={closeModal}
                imageUrl={modalImage}
            />

        </div>
    );
}

export default ReportPage;