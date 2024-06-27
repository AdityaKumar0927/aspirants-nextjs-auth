// hooks/useSound.ts
import { useRef } from 'react';

const useSound = (url: string) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = () => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  const SoundComponent = () => (
    <audio ref={audioRef} src={url} preload="auto" />
  );

  return { play, SoundComponent };
};

export default useSound;
