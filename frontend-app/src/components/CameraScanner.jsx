import React, { useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

export default function CameraScanner({ onScan, onClose, continuousMode = false }) {
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const lastScanRef = useRef(0);
  const [scanCount, setScanCount] = React.useState(0);
  const [flashVisible, setFlashVisible] = React.useState(false);

  useEffect(() => {
    const config = { 
      fps: 10, 
      qrbox: { width: 250, height: 250 },
      formatsToSupport: [
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.UPC_A
      ]
    };
    
    html5QrCodeRef.current = new Html5Qrcode("reader");
    
    html5QrCodeRef.current.start(
      { facingMode: "environment" },
      config,
      (decodedText) => {
        // Prevenir escaneos duplicados (2 segundos de bloqueo)
        const now = Date.now();
        if (now - lastScanRef.current < 2000) return;
        lastScanRef.current = now;
        
        // Feedback: Beep + Vibración + Flash
        playBeep();
        if (navigator.vibrate) navigator.vibrate(200);
        showFlash();
        
        setScanCount(prev => prev + 1);
        onScan(decodedText);
        
        // Solo cerrar si NO es modo continuo
        if (!continuousMode) {
          stopScanner();
        }
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
  
  const playBeep = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.3;
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  };
  
  const showFlash = () => {
    setFlashVisible(true);
    setTimeout(() => setFlashVisible(false), 300);
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
      {continuousMode && (
        <div style={{
          backgroundColor: 'white',
          padding: '15px',
          borderRadius: '8px',
          marginTop: '15px',
          textAlign: 'center',
          width: '100%',
          maxWidth: '500px'
        }}>
          <h5 style={{margin: 0, color: '#28a745'}}>
            ✅ {scanCount} productos escaneados
          </h5>
        </div>
      )}
      
      {flashVisible && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 255, 0, 0.3)',
          pointerEvents: 'none',
          zIndex: 10000
        }} />
      )}
      
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
