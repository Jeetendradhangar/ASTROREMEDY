'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Trash2, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import MysticalAudioPlayer from './MysticalAudioPlayer';
import { useToastStore } from '../../store/toastStore';

interface VoiceUploaderProps {
  onUploadSuccess: (fileUrl: string) => void;
  consultationId: number | null;
  apiClient: any;
}

export default function VoiceUploader({ onUploadSuccess, consultationId, apiClient }: VoiceUploaderProps) {
  const { addToast } = useToastStore();
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    audioChunksRef.current = [];
    setAudioUrl(null);
    setAudioBlob(null);
    setRecordingTime(0);
    setErrorMessage('');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setAudioBlob(audioBlob);
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Failed to access microphone", err);
      setErrorMessage("Microphone access denied or not supported. Please upload a file instead.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const deleteRecording = () => {
    setAudioUrl(null);
    setAudioBlob(null);
    setRecordingTime(0);
    setUploadStatus('idle');
    setErrorMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processFile = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("File exceeds 10MB limit.");
      return;
    }
    setErrorMessage('');
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setAudioBlob(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('audio/')) {
        processFile(file);
      } else {
        setErrorMessage("Please drop an audio file only.");
      }
    }
  };

  const uploadVoice = async () => {
    if (!audioBlob || !consultationId) return;

    setUploadStatus('uploading');
    setUploadProgress(0);
    setErrorMessage('');

    const formData = new FormData();
    const fileType = audioBlob.type || 'audio/wav';
    const extension = fileType.includes('mp3') ? 'mp3' : fileType.includes('ogg') ? 'ogg' : 'wav';
    formData.append('voice_note', audioBlob, `voice_note_${consultationId}.${extension}`);

    try {
      const response = await apiClient.post(`/api/consultations/${consultationId}/upload-voice/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent: any) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        }
      });
      setUploadStatus('success');
      addToast('Voice note uploaded successfully!', 'success');
      onUploadSuccess(response.data.file_url);
    } catch (err: any) {
      console.error(err);
      setUploadStatus('error');
      const errTxt = err.response?.data?.error || err.response?.data?.detail || "Failed to upload audio.";
      setErrorMessage(errTxt);
      addToast(errTxt, 'error');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="nm-card p-6">
      <div className="mb-4 flex items-baseline justify-between border-b border-gold/15 pb-3">
        <h3 className="font-display-h3 text-base text-ink">Voice Note Intake</h3>
        <span className="text-xs font-sans text-mist font-semibold">Max: 10MB (MP3/WAV/OGG)</span>
      </div>

      {errorMessage && (
        <div className="mb-4 nm-inset p-4 text-xs font-semibold text-danger flex items-center gap-3">
          <AlertCircle className="h-4 w-4 shrink-0 text-danger" />
          <span>{errorMessage}</span>
        </div>
      )}

      {uploadStatus === 'success' && (
        <div className="mb-4 nm-inset p-4 text-xs font-semibold text-mystic flex items-center gap-3">
          <CheckCircle className="h-4 w-4 shrink-0 text-mystic" />
          <span>Voice note uploaded successfully!</span>
        </div>
      )}

      <div 
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center py-6 rounded-xl transition-all duration-300 ${
          isDragActive 
            ? 'nm-inset bg-bloom/5' 
            : ''
        }`}
      >
        {!audioUrl ? (
          <div className="flex flex-col items-center gap-4">
            {isRecording ? (
              <button
                type="button"
                onClick={stopRecording}
                className="group relative flex h-20 w-20 items-center justify-center rounded-full text-white recording-ripple-active cursor-pointer shadow-lg"
              >
                <Square className="h-7 w-7 fill-white text-white" />
              </button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                disabled={uploadStatus === 'uploading'}
                className="flex h-20 w-20 items-center justify-center rounded-full nm-btn text-mystic hover:text-gold hover:scale-105 disabled:opacity-50 transition-all cursor-pointer"
              >
                <Mic className="h-8 w-8 stroke-[2]" />
              </button>
            )}
            
            <div className="text-center space-y-1">
              <p className="text-xs font-sans font-bold tracking-wider text-ink uppercase">
                {isRecording ? `Recording... ${formatTime(recordingTime)}` : "TAP TO RECORD QUESTION"}
              </p>
              <p className="text-[11px] font-sans text-mist leading-relaxed max-w-sm">
                Describe your planetary details, problem contexts, or specific remedy queries.
              </p>
            </div>

            <div className="my-2 text-[9px] font-sans font-bold text-mist tracking-widest">— OR DRAG & DROP FILE —</div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadStatus === 'uploading'}
              className="nm-btn px-4 py-2.5 text-[10px] font-bold text-mystic hover:text-gold flex items-center gap-2 cursor-pointer transition-all"
            >
              <Upload className="h-3.5 w-3.5" />
              Upload Audio File
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="audio/*"
              className="hidden"
            />
          </div>
        ) : (
          <div className="w-full space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-sans font-bold text-ink tracking-widest uppercase">
                {recordingTime > 0 ? `RECORDED INTAKE` : "UPLOADED INTAKE"}
              </p>
              
              <button
                type="button"
                onClick={deleteRecording}
                disabled={uploadStatus === 'uploading'}
                className="nm-btn px-3 py-2 text-xs font-bold text-danger flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>
            {audioUrl && <MysticalAudioPlayer src={audioUrl} className="nm-dark-card" />}

            {audioBlob && (
              <div className="text-[11px] font-sans text-mist flex gap-4 nm-inset p-3">
                <span>File Size: <strong>{formatBytes(audioBlob.size)}</strong></span>
                {recordingTime > 0 && <span>Recorded Duration: <strong>{formatTime(recordingTime)}</strong></span>}
              </div>
            )}

            {consultationId && uploadStatus !== 'success' && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={uploadVoice}
                  disabled={uploadStatus === 'uploading'}
                  className="nm-btn-gold w-full py-4 text-xs font-bold tracking-widest uppercase cursor-pointer"
                >
                  {uploadStatus === 'uploading' ? `Saving Voice Note (${uploadProgress}%)` : 'Save Voice Note'}
                </button>
                {uploadStatus === 'uploading' && (
                  <div className="w-full nm-inset h-2 overflow-hidden">
                    <div 
                      className="bg-gold h-full transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
