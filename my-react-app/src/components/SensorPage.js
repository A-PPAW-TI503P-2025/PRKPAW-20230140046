// src/components/SensorPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// 1. Registrasi komponen Chart.js [cite: 84-92]
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function SensorPage() {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });
  const [latestData, setLatestData] = useState(null); // Untuk Tugas: Kartu Indikator [cite: 187]
  const [loading, setLoading] = useState(true);

  // 2. Fungsi ambil data dari Backend [cite: 100-137]
  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/iot/history');
      const dataSensor = response.data.data;

      if (dataSensor && dataSensor.length > 0) {
        // Ambil data terbaru untuk kartu indikator [cite: 187]
        setLatestData(dataSensor[dataSensor.length - 1]);

        // Siapkan sumbu X (Waktu) [cite: 107-109]
        const labels = dataSensor.map(item => 
          new Date(item.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second:'2-digit' })
        );
        
        const dataSuhu = dataSensor.map(item => item.suhu);
        const dataLembab = dataSensor.map(item => item.kelembaban);
        const dataCahaya = dataSensor.map(item => item.cahaya); // Data LDR untuk Tugas [cite: 184]

        setChartData({
          labels: labels,
          datasets: [
            {
              label: 'Suhu (°C)',
              data: dataSuhu,
              borderColor: 'rgb(255, 99, 132)',
              backgroundColor: 'rgba(255, 99, 132, 0.5)',
              tension: 0.2,
            },
            {
              label: 'Kelembaban (%)',
              data: dataLembab,
              borderColor: 'rgb(53, 162, 235)',
              backgroundColor: 'rgba(53, 162, 235, 0.5)',
              tension: 0.2,
            },
            {
              // TUGAS 1: Menambahkan garis Cahaya (LDR) [cite: 184]
              label: 'Cahaya (LDR)',
              data: dataCahaya,
              borderColor: 'rgb(255, 205, 86)', // Warna Kuning [cite: 185]
              backgroundColor: 'rgba(255, 205, 86, 0.5)',
              tension: 0.2,
              hidden: false, // Set true jika ingin disembunyikan di awal agar tidak timpang [cite: 185]
            },
          ],
        });
      }
      setLoading(false);
    } catch (err) {
      console.error("Gagal ambil data sensor:", err);
      setLoading(false);
    }
  };

  // 3. Auto Refresh tiap 5 detik [cite: 139-145]
  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Monitoring Sensor Real-time' },
    },
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard IoT</h1>

      {/* TUGAS 2: Kartu Indikator [cite: 187-188] */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-red-500 text-white p-6 rounded-lg shadow-md">
          <p className="text-sm uppercase font-bold">Suhu Terakhir</p>
          <h2 className="text-4xl font-bold">{latestData ? `${latestData.suhu}°C` : '--'}</h2>
        </div>
        <div className="bg-blue-500 text-white p-6 rounded-lg shadow-md">
          <p className="text-sm uppercase font-bold">Kelembaban Terakhir</p>
          <h2 className="text-4xl font-bold">{latestData ? `${latestData.kelembaban}%` : '--'}</h2>
        </div>
        <div className="bg-yellow-500 text-white p-6 rounded-lg shadow-md">
          <p className="text-sm uppercase font-bold">Cahaya Terakhir</p>
          <h2 className="text-4xl font-bold">{latestData ? latestData.cahaya : '--'}</h2>
        </div>
      </div>
      
      {/* Grafik [cite: 157-163] */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        {loading ? (
          <p className="text-center">Memuat data...</p>
        ) : chartData.labels.length === 0 ? (
          <p className="text-center text-gray-500">Tidak ada data untuk ditampilkan. Pastikan Backend & ESP32 aktif.</p>
        ) : (
          <Line options={options} data={chartData} />
        )}
      </div>
    </div>
  );
}

export default SensorPage;