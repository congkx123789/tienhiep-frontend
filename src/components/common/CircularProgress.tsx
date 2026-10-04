import React from 'react';

interface CircularProgressProps {
  /** Giá trị tiến độ từ 0 đến 100 */
  progress: number;
  /** Kích thước đường kính vòng tròn (px), mặc định 80 */
  size?: number;
  /** Độ dày nét vẽ vòng tròn (px), mặc định 6 */
  strokeWidth?: number;
  /** Tiêu đề phụ hiển thị bên dưới %, ví dụ: "Đang tải trang..." */
  subtitle?: string;
  /** Chi tiết phụ ví dụ: url hoặc tiến trình */
  detail?: string;
  /** Màu gradient chính */
  gradientStart?: string;
  gradientEnd?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  size = 80,
  strokeWidth = 6,
  subtitle,
  detail,
  gradientStart = '#6366f1', // indigo-500
  gradientEnd = '#a855f7'    // purple-500
}) => {
  const clampedProgress = Math.max(0, Math.min(100, Math.round(progress)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;
  const gradientId = React.useId().replace(/:/g, '');

  return (
    <div className="flex flex-col items-center justify-center select-none">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        {/* Glow hiệu ứng vòng hào quang mờ phía sau */}
        <div
          className="absolute inset-2 rounded-full opacity-40 blur-md pointer-events-none transition-all duration-300"
          style={{
            background: `radial-gradient(circle, ${gradientEnd} 0%, transparent 70%)`
          }}
        />

        <svg
          width={size}
          height={size}
          className="transform -rotate-90 origin-center drop-shadow-md"
          viewBox={`0 0 ${size} ${size}`}
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={gradientStart} />
              <stop offset="100%" stopColor={gradientEnd} />
            </linearGradient>
          </defs>

          {/* Vòng nền mờ màu tối */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-white/10 fill-none"
          />

          {/* Vòng tiến độ xoay có màu gradient */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="fill-none transition-[stroke-dashoffset] duration-300 ease-out"
          />
        </svg>

        {/* Text hiển thị % ở giữa vòng tròn */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-base font-extrabold tracking-tight text-white font-mono leading-none">
            {clampedProgress}
            <span className="text-[10px] font-normal text-indigo-300 ml-0.5">%</span>
          </span>
        </div>
      </div>

      {/* Subtitle / Trạng thái */}
      {subtitle && (
        <span className="text-xs font-semibold text-slate-200 mt-3 text-center tracking-wide drop-shadow">
          {subtitle}
        </span>
      )}

      {/* Chi tiết phụ / URL */}
      {detail && (
        <span className="text-[11px] text-slate-400 max-w-xs sm:max-w-md truncate mt-1 px-4 text-center font-mono opacity-80">
          {detail}
        </span>
      )}
    </div>
  );
};
