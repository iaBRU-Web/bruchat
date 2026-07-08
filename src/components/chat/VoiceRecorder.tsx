import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, Square, Send, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface VoiceRecorderProps {
  onVoiceSent: (msg: { content: string; message_type: string; audio_url: string; file_name: string; file_size: number; file_type: string }) => void;
}

const VoiceRecorder = ({ onVoiceSent }: VoiceRecorderProps) => {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [uploading, setUploading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      ctx.fillStyle = "hsl(var(--muted))";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = "hsl(var(--primary))";
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    draw();
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.start(100);
      setRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);

      drawWaveform();
    } catch {
      toast({ title: "Microphone access denied 🎤", variant: "destructive" });
    }
  };

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
  }, []);

  const cancelRecording = () => {
    stopRecording();
    chunksRef.current = [];
    setDuration(0);
  };

  const sendRecording = async () => {
    stopRecording();

    // Small delay to ensure all chunks are collected
    await new Promise((r) => setTimeout(r, 200));

    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    if (blob.size === 0) {
      toast({ title: "Recording too short. Try again.", variant: "destructive" });
      return;
    }

    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast({ title: "Please sign in first", variant: "destructive" }); setUploading(false); return; }
    const path = `${user.id}/${crypto.randomUUID()}.webm`;
    const { error } = await supabase.storage.from("audio-messages").upload(path, blob, { cacheControl: "3600", contentType: "audio/webm" });


    if (error) {
      toast({ title: "Upload failed 😅", variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("audio-messages").getPublicUrl(path);

    onVoiceSent({
      content: `🎤 Voice message (${formatDuration(duration)})`,
      message_type: "audio",
      audio_url: publicUrl,
      file_name: `voice-${Date.now()}.webm`,
      file_size: blob.size,
      file_type: "audio/webm",
    });

    chunksRef.current = [];
    setDuration(0);
    setUploading(false);
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (uploading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-full">
        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-muted-foreground">Sending...</span>
      </div>
    );
  }

  if (recording) {
    return (
      <div className="flex items-center gap-2 flex-1 bg-muted rounded-full px-3 py-1.5">
        <button onClick={cancelRecording} className="p-1.5 rounded-full hover:bg-destructive/10 text-destructive transition-colors" title="Cancel">
          <Trash2 className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
          <span className="text-xs text-foreground font-medium tabular-nums">{formatDuration(duration)}</span>
          <canvas ref={canvasRef} width={120} height={28} className="flex-1 rounded" />
        </div>
        <button onClick={sendRecording} className="p-1.5 rounded-full bg-primary text-primary-foreground" title="Send">
          <Send className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={startRecording}
      className="text-muted-foreground hover:text-foreground p-2 transition-colors"
      title="Record voice message"
    >
      <Mic className="h-4 w-4" />
    </button>
  );
};

export default VoiceRecorder;
