import { useState, useEffect } from "react";

function App() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [faces, setFaces] = useState([]);
  const [loading, setLoading] = useState(false);

  const [s3Images, setS3Images] = useState([]);
  const [selectedImage, setSelectedImage] = useState("");
  const [s3Preview, setS3Preview] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5000/s3-images")
      .then(res => res.json())
      .then(data => setS3Images(data))
      .catch(err => console.error(err));
  }, []);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!image) return alert("Select image");

    setLoading(true);

    const formData = new FormData();
    formData.append("image", image);

    const res = await fetch("http://localhost:5000/analyze-image", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setFaces(data.faces || []);
    setLoading(false);
  };

  const handleS3Analyze = async () => {
    if (!selectedImage) return alert("Select S3 image");

    setLoading(true);

    const res = await fetch("http://localhost:5000/analyze-s3", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ key: selectedImage }),
    });

    const data = await res.json();
    setFaces(data.faces || []);
    setLoading(false);
  };

  const handleS3Change = async (value) => {
    setSelectedImage(value);

    try {
      const res = await fetch(`http://localhost:5000/s3-url/${value}`);
      const data = await res.json();

      setS3Preview(data.url);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg,#0f172a,#1e293b)",
      color: "white",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "40px"
    }}>

      <h1 style={{ fontSize: "2.8rem", marginBottom: "30px" }}>
        🧑 AI Face Analyzer
      </h1>

      {/* Upload Card */}
      <div style={{
        background: "#1e293b",
        padding: "25px",
        borderRadius: "15px",
        width: "350px",
        marginBottom: "25px",
        boxShadow: "0 0 15px rgba(0,0,0,0.4)"
      }}>
        <h2>📸 Upload Image</h2>

        <input type="file" onChange={handleImage} style={{ marginTop: "10px" }} />

        {preview && (
          <img
            src={preview}
            width="100%"
            style={{ marginTop: "10px", borderRadius: "10px" }}
          />
        )}

        <button
          onClick={handleUpload}
          style={{
            marginTop: "15px",
            width: "100%",
            padding: "10px",
            background: "#3b82f6",
            border: "none",
            borderRadius: "8px",
            color: "white"
          }}
        >
          Analyze Upload
        </button>
      </div>

      {/* S3 Card */}
      <div style={{
        background: "#1e293b",
        padding: "25px",
        borderRadius: "15px",
        width: "350px",
        boxShadow: "0 0 15px rgba(0,0,0,0.4)"
      }}>
        <h2>📂 Select from S3</h2>

        <select
          onChange={(e) => handleS3Change(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "8px",
            marginTop: "10px"
          }}
        >
          <option>Select image</option>
          {s3Images.map((img, i) => (
            <option key={i} value={img}>{img}</option>
          ))}
        </select>

        {/* ✅ S3 Preview */}
        {s3Preview && (
          <img
            src={s3Preview}
            width="100%"
            style={{ marginTop: "10px", borderRadius: "10px" }}
          />
        )}

        <button
          onClick={handleS3Analyze}
          style={{
            marginTop: "15px",
            width: "100%",
            padding: "10px",
            background: "#22c55e",
            border: "none",
            borderRadius: "8px",
            color: "white"
          }}
        >
          Analyze from S3
        </button>
      </div>

      {/* Loader */}
      {loading && (
        <p style={{ marginTop: "20px" }}>🔄 Processing...</p>
      )}

      {/* Results */}
      <div style={{ marginTop: "30px" }}>
        {faces.map((face, i) => (
          <div key={i} style={{
            background: "#1e293b",
            padding: "20px",
            margin: "15px",
            borderRadius: "12px",
            width: "320px"
          }}>
            <p><b>Gender:</b> {face.Gender?.Value}</p>
            <p><b>Age:</b> {face.AgeRange?.Low} - {face.AgeRange?.High}</p>
            <p><b>Confidence:</b> {face.Confidence?.toFixed(2)}%</p>

            <hr />

            <p>😊 Smile: {face.Smile?.Value ? "Yes" : "No"}</p>
            <p>🧔 Beard: {face.Beard?.Value ? "Yes" : "No"}</p>
            <p>👓 Glasses: {face.Eyeglasses?.Value ? "Yes" : "No"}</p>
            <p>👀 Eyes Open: {face.EyesOpen?.Value ? "Yes" : "No"}</p>
          </div>
        ))}
      </div>

    </div>
  );
}

export default App;