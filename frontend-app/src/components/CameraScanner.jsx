import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function CameraScanner({ onScan, onClose }) {
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const lastScanRef = useRef({ text: '', time: 0 });

  useEffect(() => {
    const config = { 
      fps: 5, 
      qrbox: { width: 200, height: 200 },
      aspectRatio: 1.0
    };
    
    html5QrCodeRef.current = new Html5Qrcode("reader");
    
    html5QrCodeRef.current.start(
      { facingMode: "environment" },
      config,
      (decodedText) => {
        const now = Date.now();
        if (decodedText === lastScanRef.current.text && now - lastScanRef.current.time < 1000) {
          return;
        }
        lastScanRef.current = { text: decodedText, time: now };
        if (navigator.vibrate) navigator.vibrate(200);
        onScan(decodedText);
        stopScanner();
      },
      (errorMessage) => {
        // Ignorar errores de escaneo continuo
      }
    ).catch(err => {
      console.error("Error iniciando cámara:", err);
      alert("No se pudo acceder a la cámara");
      onClose();
    });

    return () => {
      stopScanner();
    };
  }, []);

  const stopScanner = () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      html5QrCodeRef.current.stop().catch(err => console.error(err));
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0,0,0,0.9)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      transform: 'translateZ(0)',
      willChange: 'transform'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '500px',
        backgroundColor: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        transform: 'translateZ(0)'
      }}>
        <div id="reader" ref={scannerRef}></div>
      </div>
      <button 
        className="btn btn-danger mt-3"
        onClick={() => {
          stopScanner();
          onClose();
        }}
        style={{width: '100%', maxWidth: '500px'}}
      >
        <i className="bi bi-x-circle"></i> Cerrar Cámara
      </button>
    </div>
  );
}
