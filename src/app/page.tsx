"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

const socket: Socket = io("http://localhost:5000");

export default function Home() {
  const localVideo = useRef<HTMLVideoElement | null>(null);
  const remoteVideo = useRef<HTMLVideoElement | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    startVideo();
  }, []);

  const startVideo = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    if (localVideo.current) {
      localVideo.current.srcObject = stream;
    }

    peerConnection.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    stream.getTracks().forEach((track) => {
      peerConnection.current?.addTrack(track, stream);
    });

    peerConnection.current.ontrack = (event) => {
      if (remoteVideo.current) {
        remoteVideo.current.srcObject = event.streams[0];
      }
    };

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          candidate: event.candidate,
          to: "other-user-id"
        });
      }
    };
  };

  const callUser = async () => {
    if (!peerConnection.current) return;

    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);

    socket.emit("offer", {
      offer,
      to: "other-user-id"
    });
  };

  useEffect(() => {
    socket.on("offer", async (data: any) => {
      await peerConnection.current?.setRemoteDescription(data.offer);

      const answer = await peerConnection.current?.createAnswer();
      if (!answer) return;

      await peerConnection.current?.setLocalDescription(answer);

      socket.emit("answer", {
        answer,
        to: data.from
      });
    });

    socket.on("answer", async (data: any) => {
      await peerConnection.current?.setRemoteDescription(data.answer);
    });

    socket.on("ice-candidate", async (data: any) => {
      await peerConnection.current?.addIceCandidate(data.candidate);
    });

    return () => {
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 p-10">
      <video ref={localVideo} autoPlay muted className="w-64" />
      <video ref={remoteVideo} autoPlay className="w-64" />

      <button
        onClick={callUser}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Start Call
      </button>
    </div>
  );
}