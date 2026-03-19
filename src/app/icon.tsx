
import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const size = {
  width: 512,
  height: 512,
};
export const contentType = 'image/png';

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          background: 'linear-gradient(to bottom right, #000005, #000080)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '24%',
          border: '12px solid rgba(230, 230, 250, 0.1)',
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="320"
          height="320"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#E6E6FA"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Minimalist IQ pulse circle */}
          <circle cx="12" cy="12" r="10" stroke-opacity="0.2" />
          <path d="M12 2a10 10 0 0 1 10 10" />
          {/* Central 'intelligence' node */}
          <path d="M12 7v5l3 3" />
        </svg>
      </div>
    ),
    // ImageResponse options
    {
      ...size,
    }
  );
}
