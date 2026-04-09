"use client";

export function Btn({ children, variant = "primary", onClick, className, style, disabled, type = "button" }) {
  const baseClasses = "border-none rounded-brand-sm font-extrabold font-sans transition-all duration-150 inline-flex items-center gap-2 min-h-[44px] justify-center transform translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed hover:disabled:translate-y-0 active:disabled:translate-y-0 hover:-translate-y-[1px] active:translate-y-[1px] px-[18px] py-[14px] text-[15px] md:py-[13px] md:text-[14px]";

  const variantClasses = {
    primary: "bg-gradient-to-b from-brand-green to-brand-green-dark text-white shadow-brand",
    secondary: "bg-brand-surface text-brand-primary border border-brand-line shadow-none",
    hero: "bg-gradient-to-b from-brand-gold to-[#b7862d] text-[#1f2937] font-black shadow-brand",
    ghost: "bg-white/10 text-white border border-white/20 shadow-none",
  };

  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses[variant] || variantClasses.primary} ${className || ""}`}
      style={style}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export function Card({ children, className, style }) {
  return (
    <div
      className={`bg-brand-surface border border-brand-line rounded-[24px] shadow-brand p-[18px] md:p-[22px] transition-all duration-200 ease-in-out ${className || ""}`}
      style={style}
    >
      {children}
    </div>
  );
}

export function Notice({ children, color = "blue", className, style }) {
  const colors = {
    blue: "bg-brand-blue-soft text-brand-primary",
    green: "bg-brand-green-soft text-[#166534]",
    gold: "bg-[#caa14a]/16 text-[#6b4e13]",
    red: "bg-brand-red-soft text-[#991b1b]",
  };
  return (
    <div
      className={`p-[12px_14px] rounded-brand-sm text-[13px] leading-[1.55] font-semibold mb-[14px] font-sans ${colors[color]} ${className || ""}`}
      style={style}
    >
      {children}
    </div>
  );
}

export function Pill({ children, className, style }) {
  return (
    <span
      className={`inline-flex items-center gap-[6px] py-[7px] px-[10px] rounded-full bg-brand-blue-soft text-brand-primary text-[12px] font-extrabold whitespace-nowrap font-sans ${className || ""}`}
      style={style}
    >
      {children}
    </span>
  );
}

export function Loader({ text = "Generating...", className, style }) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-[48px_24px] gap-[16px] ${className || ""}`}
      style={style}
    >
      <div
        className="w-10 h-10 border-[3px] border-brand-line border-t-brand-gold rounded-full animate-spin"
      />
      <span className="text-brand-muted text-[14px] font-semibold font-sans">
        {text}
      </span>
    </div>
  );
}

export function Field({ label, children, className, style }) {
  return (
    <div 
      className={`grid gap-[8px] ${className || ""}`}
      style={style}
    >
      <label
        className="text-[13px] font-bold text-[#334155] font-sans"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
