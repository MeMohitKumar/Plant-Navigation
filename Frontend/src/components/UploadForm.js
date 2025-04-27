import React, { useState } from "react";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

const UploadForm = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return alert("Please select a file.");

    const formData = new FormData();
    formData.append("image", selectedFile);

    setLoading(true);
    try {
      const response = await axios.post("http://127.0.0.1:5000/predict", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setPrediction(response.data);
    } catch (error) {
      console.error("Prediction error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-form">
      <h1>Plant Classifier</h1>
      <form onSubmit={handleSubmit}>
        <input type="file" onChange={handleFileChange} />
        <button type="submit" disabled={loading}>
          {loading ? "Classifying..." : "Upload and Classify"}
        </button>
      </form>

      {prediction && (
        <div style={{ marginTop: "20px" }}>
          <h3>Result:</h3>
          <p><strong>Plant:</strong> {prediction.predicted_label}</p>
          <p><strong>Confidence:</strong> {Math.round(prediction.confidence * 100)}%</p>
          <p><strong>Latitude:</strong> {prediction.location.latitude}</p>
          <p><strong>Longitude:</strong> {prediction.location.longitude}</p>

          {prediction.location.latitude && prediction.location.longitude ? (
  <MapContainer
    center={[prediction.location.latitude, prediction.location.longitude]}
    zoom={15}
    scrollWheelZoom={false}
    style={{ height: "400px", width: "100%", marginTop: "20px" }}
  >
    <TileLayer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution="&copy; OpenStreetMap contributors"
    />
    <Marker position={[prediction.location.latitude, prediction.location.longitude]}>
      <Popup>
        {prediction.predicted_label}<br />
        Lat: {prediction.location.latitude},<br />
        Lng: {prediction.location.longitude}
      </Popup>
    </Marker>
  </MapContainer>
) : (
  <p style={{ color: "red" }}>
    ❌ Location not found in dataset. Please check your Excel file.
  </p>
)}


          <div style={{ marginTop: "15px" }}>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${prediction.location.latitude},${prediction.location.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: "16px", color: "#007bff", textDecoration: "underline" }}
            >
              🚶 Navigate to Plant
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadForm;
