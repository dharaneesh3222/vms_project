import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';

export default function WebcamCapture({ onCapture, initialImage = '' }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(initialImage);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState(null);

  const startCamera = async () => {
    setError(null);
    setIsCapturing(true);
    setImgSrc('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 400, height: 300, facingMode: 'user' } 
      });
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
    } catch (err) {
      console.error('Error accessing webcam:', err);
      setError('Could not access camera. Please make sure permissions are allowed or upload a file.');
      setIsCapturing(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setImgSrc(dataUrl);
      onCapture(dataUrl);
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  };

  const resetCamera = () => {
    setImgSrc('');
    onCapture('');
    startCamera();
  };

  useEffect(() => {
    return () => {
      // Clean up camera stream on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="d-flex flex-column align-items-center gap-3">
      {imgSrc ? (
        <div className="position-relative border rounded overflow-hidden" style={{ width: '100%', maxWidth: '320px', aspectRatio: '4/3' }}>
          <img src={imgSrc} alt="Captured face" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div className="position-absolute bottom-0 start-0 end-0 bg-dark bg-opacity-70 text-white text-center py-1">
            <CheckCircle size={16} className="text-success me-1 d-inline" /> Photo Captured
          </div>
        </div>
      ) : isCapturing ? (
        <div className="position-relative border rounded bg-black overflow-hidden" style={{ width: '100%', maxWidth: '320px', aspectRatio: '4/3' }}>
          <video ref={videoRef} autoPlay playsInline muted className="w-100 h-100" style={{ objectFit: 'cover' }} />
        </div>
      ) : (
        <div className="border rounded bg-secondary bg-opacity-10 d-flex flex-column align-items-center justify-content-center text-muted" style={{ width: '100%', maxWidth: '320px', aspectRatio: '4/3' }}>
          <Camera size={40} className="mb-2" />
          <span className="small">No Photo Captured</span>
        </div>
      )}

      {error && (
        <div className="alert alert-warning py-2 px-3 small d-flex align-items-center gap-2" style={{ maxWidth: '320px' }}>
          <AlertTriangle size={16} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="d-flex gap-2">
        {imgSrc ? (
          <button type="button" className="btn btn-outline-light btn-sm d-flex align-items-center gap-1" onClick={resetCamera}>
            <RefreshCw size={14} /> Retake Photo
          </button>
        ) : isCapturing ? (
          <>
            <button type="button" className="btn btn-primary btn-sm d-flex align-items-center gap-1" onClick={capturePhoto}>
              <Camera size={14} /> Snap Photo
            </button>
            <button type="button" className="btn btn-outline-danger btn-sm" onClick={stopCamera}>
              Cancel
            </button>
          </>
        ) : (
          <button type="button" className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1" onClick={startCamera}>
            <Camera size={14} /> Use Webcam
          </button>
        )}
      </div>
    </div>
  );
}
