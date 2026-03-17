"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

const socket: Socket = io("https://video-backend-l6u6.onrender.com");

const myId = Math.random().toString(36).substring(2, 9); // random user id
const otherUserId = prompt("Enter other user ID");

export default function Home() {
  const localVideo = useRef<HTMLVideoElement | null>(null);
  const remoteVideo = useRef<HTMLVideoElement | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    socket.emit("join", myId);
    console.log("🧑 My ID:", myId);

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
      console.log("📺 Remote stream received");
      if (remoteVideo.current) {
        remoteVideo.current.srcObject = event.streams[0];
      }
    };

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("🧊 Sending ICE");
        socket.emit("ice-candidate", {
          candidate: event.candidate,
          to: otherUserId,
          from: myId
        });
      }
    };
  };

  const callUser = async () => {
    if (!peerConnection.current) return;

    console.log("📞 Calling user:", otherUserId);

    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);

    socket.emit("offer", {
      offer,
      to: otherUserId,
      from: myId
    });
  };

  useEffect(() => {
    socket.on("offer", async (data: any) => {
      console.log("📩 Received offer");

      await peerConnection.current?.setRemoteDescription(data.offer);

      const answer = await peerConnection.current?.createAnswer();
      await peerConnection.current?.setLocalDescription(answer);

      socket.emit("answer", {
        answer,
        to: data.from,
        from: myId
      });
    });

    socket.on("answer", async (data: any) => {
      console.log("✅ Received answer");
      await peerConnection.current?.setRemoteDescription(data.answer);
    });

    socket.on("ice-candidate", async (data: any) => {
      console.log("🧊 Received ICE");
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
      <h1>Your ID: {myId}</h1>

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