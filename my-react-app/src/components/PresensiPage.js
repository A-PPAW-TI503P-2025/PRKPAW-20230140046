import React, { useState, useEffect, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";


L.Marker.prototype.options.icon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconRetinaUrl: icon,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

function PresensiPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [coords, setCoords] = useState(null); // {lat, lng}
  const [isLoading, setIsLoading] = useState(true);
  const [image, setImage] = useState(null); // State untuk menyimpan hasil foto
  const webcamRef = useRef(null);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();

    if (!imageSrc) {
      console.log("GAGAL CAPTURE: webcam belum ready");
      setError("Gagal mengambil foto. Coba ulangi.");
      return;
    }

    setImage(imageSrc);
  }, [webcamRef]);

  const getToken = () => {
    return localStorage.getItem("token");
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setIsLoading(false);
        },
        (error) => {
          setError("Gagal mendapatkan lokasi: " + error.message);
          setIsLoading(false);
        }
      );
    } else {
      setError("Geolocation tidak didukung oleh browser ini.");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getLocation();
  }, []);

  const handleCheckIn = async () => {
    if (!coords) {
      setError("Lokasi belum didapatkan. Mohon izinkan akses lokasi.");
      return;
    }
    if (!image) {
      setError("Anda harus mengambil foto sebelum Check-In.");
      return;
    }
      try {
        setError("");
        setMessage("Sedang memproses Check-In...");
        
        const blob = await (await fetch(image)).blob();
    
        const formData = new FormData();
        formData.append("latitude", coords.lat);
        formData.append("longitude", coords.lng);
        formData.append("buktiFoto", blob, "selfie.jpg"); 
    
        const response = await axios.post(
          "http://localhost:3001/api/presensi/check-in",
          formData,
          { headers: { Authorization: `Bearer ${getToken()}` } }
        );
    
        setMessage(response.data.message);
        setImage(null); 
      } catch (err) {
        setMessage("");
        setError(err.response ? err.response.data.message : "Check-in gagal. Pastikan kamera dan lokasi diizinkan.");
      }
    };

  const handleCheckOut = async () => {
    setError("");
    setMessage("Sedang memproses Check-Out...");

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      };

      const response = await axios.post(
        "http://localhost:3001/api/presensi/check-out",
        {},
        config
      );

      setMessage(response.data.message);
    } catch (err) {
      setMessage("");
      setError(err.response ? err.response.data.message : "Check-out gagal");
    }
  };

  return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center pt-10 pb-10">
        {isLoading ? (
          <div className="bg-white p-10 rounded-lg shadow-md w-full max-w-6xl mb-8 text-center">
            <p className="text-xl font-semibold text-blue-600 animate-pulse">
              Memuat Peta dan Mendeteksi Lokasi...
            </p>
            {error && <p className="text-red-600 mt-4">{error}</p>}
          </div>
        ) : (
          <div className="bg-white p-4 rounded-lg shadow-md w-full mb-8 px-8 max-w-6xl">
            <h3 className="text-xl font-semibold mb-2">Lokasi Terdeteksi:</h3>
            <div className="my-4 border rounded-lg overflow-hidden">
              <MapContainer
                center={[coords.lat, coords.lng]}
                zoom={15}
                style={{ height: "300px", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[coords.lat, coords.lng]}>
                  <Popup>Lokasi Presensi Anda</Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>
        )}
      
        <div className="my-4 border rounded-lg overflow-hidden bg-black w-full max-w-6xl">
          {image ? (
            <img src={image} alt="Selfie" className="w-full" />
          ) : (
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="w-full"
              mirrored={true} // <--- DIUBAH MENJADI TRUE AGAR KAMERA MIRROR
              videoConstraints={{
                width: 1280,
                height: 720,
                facingMode: "user",
                }}
                // MENGHAPUS STYLE TRANSFORM scaleX(1) JIKA TIDAK DIPERLUKAN, 
                // TETAPI DI SINI SAYA UBAH MENJADI scaleX(-1) UNTUK MEMASTIKAN MIRROR BERFUNGSI
                style={{ transform: "scaleX(-1)" }} 
            />
          )}
        </div>
      
        <div className="mb-4 w-full max-w-6xl flex justify-center"> 
          {!image ? (
            <button
              onClick={capture}
              className="bg-blue-500 text-white px-4 py-2 rounded" 
            >
              Ambil Foto
            </button>
          ) : (
            <button
              onClick={() => setImage(null)}
              className="bg-gray-500 text-white px-4 py-2 rounded"
            >
              Foto Ulang
            </button>
          )}
        </div>
      
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
          <h2 className="text-3xl font-bold mb-6 text-gray-800">
            Lakukan Presensi
          </h2>
      
          {message && <p className="text-green-600 mb-4">{message}</p>}
          {error && <p className="text-red-600 mb-4">{error}</p>}
      
          <div className="flex space-x-4">
            <button
              onClick={handleCheckIn}
              className="w-full py-3 px-4 bg-green-600 text-white font-semibold rounded-md shadow-sm hover:bg-green-700"
            >
              Check-In
            </button>
      
            <button
              onClick={handleCheckOut}
              className="w-full py-3 px-4 bg-red-600 text-white font-semibold rounded-md shadow-sm hover:bg-red-700"
            >
              Check-Out
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  export default PresensiPage;