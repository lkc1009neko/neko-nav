export default function BgVideo() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <video autoPlay muted loop playsInline className="w-full h-full object-cover opacity-30">
        <source src="/bg/1.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0" style={{ background: 'rgba(10, 10, 15, 0.7)' }} />
    </div>
  )
}
