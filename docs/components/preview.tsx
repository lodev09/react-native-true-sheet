type PreviewProps = {
  src: string;
  label: string;
  radius?: number;
};

export function Preview({ src, label, radius = 29 }: PreviewProps) {
  return (
    <div
      className="not-prose w-fit border-2 border-[#3d4048] bg-[#101113] p-[7px] shadow-[0_6px_18px_rgba(0,0,0,0.28)] dark:shadow-[0_6px_18px_rgba(0,0,0,0.55)]"
      style={{ borderRadius: radius + 9 }}
    >
      <video
        src={src}
        aria-label={label}
        autoPlay
        loop
        muted
        playsInline
        className="block h-[439px] w-auto"
        style={{ borderRadius: radius }}
      />
    </div>
  );
}
