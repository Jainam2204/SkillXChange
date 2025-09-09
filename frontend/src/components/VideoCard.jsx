import React from 'react';

const VideoCard = ({ video }) => {
  return (
    <div style={{
      width: '300px',
      border: '1px solid #ccc',
      borderRadius: '10px',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <img src={video.thumbnail} alt={video.title} style={{ width: '100%' }} />
      <div style={{ padding: '10px' }}>
        <h4>{video.title}</h4>
        <a href={video.videoUrl} target="_blank" rel="noopener noreferrer">Watch</a>
      </div>
    </div>
  );
};

export default VideoCard;
