import React, { useState } from "react";
import imageCompression from "browser-image-compression";
import lamejs from "lamejs";

const App = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedAudio, setSelectedAudio] = useState(null);
  const [processImage, setProcessImage] = useState(null);
  const [processAudio, setProcessAudio] = useState(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    setSelectedImage(file);
    setProcessAudio(null);
  };

  const handleAudioUpload = (e) => {
    const file = e.target.files[0];
    setSelectedAudio(file);
    setSelectedImage(null);
  };

  const handleImageResize = async () => {
    if (selectedImage) {
      try {
        const options = {
          maxSizeMB: 50,
          maxWidthOrHeight: 300,
          useWebWorker: true,
        };
        const compressedImage = await imageCompression(selectedImage, options);
        setProcessImage(compressedImage);
      } catch (error) {
        console.log(error);
      }
    }
  };

  const compressAudio = (audioBuffer) => {
    const mp3Encoder = new lamejs.Mp3Encoder(1, audioBuffer.sampleRate, 32);
    const samples = audioBuffer.getChannelData(0);
    const sampleBlockSize = 1152;
    const mp3Data = [];

    for (let i = 0; i < samples.length; i += sampleBlockSize) {
      const sampleChunk = samples.subarray(i, i + sampleBlockSize);
      const mp3buf = mp3Encoder.encodeBuffer(sampleChunk);
      if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
      }
    }

    const mp3buf = mp3Encoder.flush();
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }

    const mergedMp3Data = new Uint8Array(
      mp3Data.reduce((acc, val) => acc + val.length, 0)
    );
    let offset = 0;
    for (let i = 0; i < mp3Data.length; i++) {
      mergedMp3Data.set(mp3Data[i], offset);
      offset += mp3Data[i].length;
    }

    const blob = new Blob([mergedMp3Data], { type: "audio/mp3" });
    return blob;
  };

  const handleAudioCompression = async () => {
    if (selectedAudio) {
      try {
        const audioContext = new (window.AudioContext ||
          window.webkitAudioContext)();
        const reader = new FileReader();
        reader.onload = async (event) => {
          const arrayBuffer = event.target.result;
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          const compressedAudioBlob = compressAudio(audioBuffer);
          setProcessAudio(compressedAudioBlob);
        };
        reader.readAsArrayBuffer(selectedAudio);
      } catch (error) {
        console.log(error);
      }
    }
  };

  const handleDownloadImage = () => {
    const url = URL.createObjectURL(processImage);
    const link = document.createElement("a");
    link.href = url;
    link.download = "resized_image.jpg";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAudio = () => {
    const url = URL.createObjectURL(processAudio);
    const link = document.createElement("a");
    link.href = url;
    link.download = "compressed_audio.mp3";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h1>Image and Audio Processing</h1>
      <div>
        <h3>Image Processing</h3>
        <input type="file" accept="image/*" onChange={handleImageUpload} />
        <button onClick={handleImageResize}>Resize this Image</button>
        {processImage && (
          <div>
            <h4>Process Image</h4>
            <img src={URL.createObjectURL(processImage)} alt="Result" />
            <button onClick={handleDownloadImage}>Download this Image</button>
          </div>
        )}
      </div>
      <div>
        <h3>Audio Processing</h3>
        <input type="file" accept="audio/*" onChange={handleAudioUpload} />
        {selectedAudio && (
          <audio controls>
            <source src={URL.createObjectURL(selectedAudio)} type="audio/mp3" />
          </audio>
        )}
        <button onClick={handleAudioCompression}>Compress Audio</button>
        {processAudio && (
          <div>
            <h4>Processed Audio</h4>
            <audio controls>
              <source
                src={URL.createObjectURL(processAudio)}
                type="audio/mp3"
              />
            </audio>
            <button onClick={handleDownloadAudio}>Download Audio</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
