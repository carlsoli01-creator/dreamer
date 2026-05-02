export default function Header() {
  return (
    <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-center pt-5 pointer-events-none">
      <div className="flex items-baseline gap-3">
        <div className="text-[20px] font-extralight tracking-[0.5em]">N O I S</div>
        <div className="text-[20px] font-extrabold tracking-[0.5em] relative">
          L E S S
          <span className="absolute left-0 -bottom-1 w-6 h-[2px] bg-accent" />
        </div>
        <div className="text-[9px] font-mono tracking-[0.4em] text-white/40 ml-4 uppercase">
          map atlas · v0.2
        </div>
      </div>
    </div>
  );
}
