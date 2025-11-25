import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Check } from 'lucide-react';

/**
 * PhotoCapture Component
 *
 * Componente reutilizable para captura de fotografías con las siguientes características:
 * - Subir archivo desde explorador
 * - Capturar desde cámara web
 * - Preview de la imagen seleccionada
 * - Validación de tipo y tamaño
 * - Callback para manejar la imagen seleccionada
 *
 * @param {Object} props
 * @param {Function} props.onPhotoSelected - Callback que recibe el File seleccionado
 * @param {boolean} props.required - Si la foto es obligatoria
 * @param {string} props.label - Etiqueta del campo (default: "Fotografía")
 * @param {number} props.maxSizeMB - Tamaño máximo en MB (default: 5)
 */
export default function PhotoCapture({
  onPhotoSelected,
  required = false,
  label = "Fotografía",
  maxSizeMB = 5
}) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState('');
  const [captureMode, setCaptureMode] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const validateFile = (file) => {
    // Validar tipo
    if (!file.type.startsWith('image/')) {
      setError('El archivo debe ser una imagen');
      return false;
    }

    // Validar tamaño
    const maxSize = maxSizeMB * 1024 * 1024; // Convertir a bytes
    if (file.size > maxSize) {
      setError(`La imagen debe ser menor a ${maxSizeMB}MB`);
      return false;
    }

    setError('');
    return true;
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && validateFile(file)) {
      processFile(file);
    }
  };

  const processFile = (file) => {
    setSelectedFile(file);

    // Crear preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);

    // Notificar al padre
    onPhotoSelected(file);
  };

  const startCamera = async () => {
    try {
      setError('');
      setCaptureMode(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Preferir cámara trasera en móviles
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError('No se pudo acceder a la cámara. Verifica los permisos.');
      console.error('Error accessing camera:', err);
      setCaptureMode(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCaptureMode(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      // Configurar canvas con las dimensiones del video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Dibujar el frame actual del video en el canvas
      context.drawImage(video, 0, 0);

      // Convertir canvas a Blob y luego a File
      canvas.toBlob((blob) => {
        const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
        processFile(file);
        stopCamera();
      }, 'image/jpeg', 0.95);
    }
  };

  const clearPhoto = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    setError('');
    onPhotoSelected(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="photo-capture-container">
      <label className="photo-capture-label">
        {label} {required && <span className="required-asterisk">*</span>}
      </label>

      {error && (
        <div className="photo-capture-error">
          <X size={16} />
          {error}
        </div>
      )}

      {!previewUrl && !captureMode && (
        <div className="photo-capture-actions">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="photo-capture-btn primary"
          >
            <Upload size={18} />
            Subir Archivo
          </button>

          <button
            type="button"
            onClick={startCamera}
            className="photo-capture-btn secondary"
          >
            <Camera size={18} />
            Usar Cámara
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>
      )}

      {captureMode && (
        <div className="photo-capture-video-container">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="photo-capture-video"
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          <div className="photo-capture-video-actions">
            <button
              type="button"
              onClick={capturePhoto}
              className="photo-capture-btn capture"
            >
              <Camera size={24} />
              Capturar
            </button>
            <button
              type="button"
              onClick={stopCamera}
              className="photo-capture-btn cancel"
            >
              <X size={18} />
              Cancelar
            </button>
          </div>
        </div>
      )}

      {previewUrl && (
        <div className="photo-capture-preview-container">
          <div className="photo-capture-preview">
            <img src={previewUrl} alt="Preview" className="photo-capture-preview-img" />
            <div className="photo-capture-preview-overlay">
              <Check size={48} className="photo-capture-check-icon" />
            </div>
          </div>

          <div className="photo-capture-preview-actions">
            <span className="photo-capture-filename">
              {selectedFile?.name || 'Fotografía capturada'}
            </span>
            <button
              type="button"
              onClick={clearPhoto}
              className="photo-capture-btn remove"
            >
              <X size={16} />
              Cambiar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
