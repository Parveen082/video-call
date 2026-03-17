"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { socket } from "../../../../lib/socket";

export default function CallPage() {
  const { roomId } = useParams();

  const [incoming, setIncoming] = useState(false);

  const localVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const pc = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    socket.emit("join-room", roomId);
    init();
  }, []);

  const init = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    if (localVideo.current) {
      localVideo.current.srcObject = stream;
    }

    pc.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    stream.getTracks().forEach((track) => {
      pc.current?.addTrack(track, stream);
    });

    pc.current.ontrack = (e) => {
      if (remoteVideo.current) {
        remoteVideo.current.srcObject = e.streams[0];
      }
    };

    pc.current.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("ice-candidate", {
          candidate: e.candidate,
          roomId
        });
      }
    };
  };

  const call = async () => {
    const offer = await pc.current?.createOffer();
    await pc.current?.setLocalDescription(offer);

    socket.emit("offer", { offer, roomId });
  };

  const accept = async () => {
    const answer = await pc.current?.createAnswer();
    await pc.current?.setLocalDescription(answer);

    socket.emit("answer", { answer, roomId });
    setIncoming(false);
  };

  useEffect(() => {
    socket.on("offer", async (data) => {
      setIncoming(true);
      await pc.current?.setRemoteDescription(data.offer);
    });

    socket.on("answer", async (data) => {
      await pc.current?.setRemoteDescription(data.answer);
    });

    socket.on("ice-candidate", async (data) => {
      await pc.current?.addIceCandidate(data.candidate);
    });

    return () => {
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 p-10">
      <h1>Room: {roomId}</h1>

      <video ref={localVideo} autoPlay muted className="w-64" />
      <video ref={remoteVideo} autoPlay className="w-64" />

      <button onClick={call} className="bg-green-500 px-4 py-2 text-white">
        Call
      </button>

      {incoming && (
        <button onClick={accept} className="bg-blue-500 px-4 py-2 text-white">
          Accept Call
        </button>
      )}
    </div>
  );
}