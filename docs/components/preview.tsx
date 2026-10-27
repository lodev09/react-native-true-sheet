// Screen aspect, corner radius and bezel (ratios of the screen width) of each recording device
const DEVICES = {
  ios: { aspect: 600 / 1304, radius: 0.1423, bezel: 0.035 },
  android: { aspect: 600 / 1336, radius: 0.127, bezel: 0.035 },
  ipad: { aspect: 1500 / 1126, radius: 0.0223, bezel: 0.016 },
  // Device Hub window capture: the phone is in the video, so no bezel
  duo: { aspect: 980 / 1304, radius: 0.03, bezel: 0 },
};

type PreviewProps = {
  src: string;
  label: string;
  device?: keyof typeof DEVICES;
  height?: number;
};

export function Preview({ src, label, device = 'ios', height = 652 }: PreviewProps) {
  const { aspect, radius, bezel: bezelRatio } = DEVICES[device];
  const width = height * aspect;
  const screenRadius = Math.round(width * radius);
  const bezel = Math.round(width * bezelRatio);

  return (
    <div
      className="not-prose w-fit max-w-full border-2 border-[#3d4048] bg-[#101113] shadow-[0_6px_18px_rgba(0,0,0,0.28)] dark:shadow-[0_6px_18px_rgba(0,0,0,0.55)]"
      style={{ padding: bezel, borderRadius: screenRadius + bezel + 2 }}
    >
      <video
        src={src}
        aria-label={label}
        autoPlay
        loop
        muted
        playsInline
        className="block h-auto max-w-full"
        style={{ width, aspectRatio: aspect, borderRadius: screenRadius }}
      />
    </div>
  );
}
