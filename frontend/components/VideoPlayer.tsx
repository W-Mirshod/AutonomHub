
import React from 'react';

interface VideoPlayerProps {
  src: string;
  title?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, title }) => {
  if (!src) {
    return null;
  }

  return (
    <div className="w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl border border-gray-700">
      <video
        src={src}
        controls
        autoPlay
        playsInline
        className="w-full h-full"
        title={title || 'Generated Video'}
      />
    </div>
  );
};

export default VideoPlayer;
