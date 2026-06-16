import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, RotateCcw, X } from 'lucide-react';

/**
 * Full-screen camera capture modal.
 * Opens the device camera, shows live preview, and lets the user snap a photo.
 */
export default function CameraCapture({ isOpen, onCapture, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [error, setError] = useState(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async (facing) => {
    stopCamera();
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.error('Camera error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else {
        setError('Could not access camera. Please try again.');
      }
    }
  }, [stopCamera]);

  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode);
    } else {
      stopCamera();
    }
    return stopCamera;
  }, [isOpen, facingMode, startCamera, stopCamera]);

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `camera_${Date.now()}.jpg`, { type: 'image/jpeg' });
          stopCamera();
          onCapture(file);
        }
      },
      'image/jpeg',
      0.85,
    );
  };

  const toggleFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: '#000' }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3" style={{ background: 'rgba(0,0,0,0.6)' }}>
        <button
          type="button"
          onClick={() => { stopCamera(); onClose(); }}
          className="flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: 'rgba(255,255,255,0.15)' }}
        >
          <X className="h-5 w-5 text-white" />
        </button>
        <p className="text-sm font-semibold text-white">Take Photo</p>
        <button
          type="button"
          onClick={toggleFacing}
          className="flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: 'rgba(255,255,255,0.15)' }}
        >
          <RotateCcw className="h-5 w-5 text-white" />
        </button>
      </div>

      {/* Camera preview */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {error ? (
          <div className="px-8 text-center">
            <Camera className="mx-auto h-12 w-12 text-white/40" />
            <p className="mt-4 text-sm text-white/80">{error}</p>
            <button
              type="button"
              className="mt-4 rounded-full px-6 py-2 text-sm font-semibold text-white"
              style={{ background: 'rgba(255,255,255,0.15)' }}
              onClick={() => startCamera(facingMode)}
            >
              Try Again
            </button>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
        )}
      </div>

      {/* Capture button */}
      {!error && (
        <div className="flex items-center justify-center py-6" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <button
            type="button"
            onClick={handleCapture}
            className="flex h-18 w-18 items-center justify-center rounded-full"
            style={{
              width: '72px',
              height: '72px',
              border: '4px solid rgba(255,255,255,0.8)',
              background: 'rgba(255,255,255,0.2)',
              transition: 'transform 0.15s',
            }}
            onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.9)'; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <div
              className="rounded-full"
              style={{ width: '56px', height: '56px', background: 'white' }}
            />
          </button>
        </div>
      )}

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
