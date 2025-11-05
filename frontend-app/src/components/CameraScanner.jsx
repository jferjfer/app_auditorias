import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function CameraScanner({ onScan, onClose }) {
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    
    html5QrCodeRef.current = new Html5Qrcode("reader");
    
    html5QrCodeRef.current.start(
      { facingMode: "environment" },
      config,
      (decodedText) => {
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
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '500px',
        backgroundColor: 'white',
        borderRadius: '12px',
        overflow: 'hidden'
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
