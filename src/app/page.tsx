"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [room, setRoom] = useState("");

  const createRoom = () => {
    const id = Math.random().toString(36).substring(2, 9);
    router.push(`/call/${id}`);
  };

  const joinRoom = () => {
    if (room) {
      router.push(`/call/${room}`);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-10">
      <h1 className="text-2xl font-bold">Video Call App</h1>

      <button
        onClick={createRoom}
        className="bg-green-500 text-white px-4 py-2 rounded"
      >
        Create Room
      </button>

      <input
        placeholder="Enter Room ID"
        value={room}
        onChange={(e) => setRoom(e.target.value)}
        className="border p-2"
      />

      <button
        onClick={joinRoom}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Join Room
      </button>
    </div>
  );
}