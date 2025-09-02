import logoImage from "@assets/FB4C6AC4-CEF5-4C60-975D-F44A12C9E74B_1754846550421.png";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className = "", size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "h-12 w-12",
    md: "h-16 w-16", 
    lg: "h-24 w-24"
  };

  return (
    <div className={`flex items-center justify-center ${sizeClasses[size]} ${className}`}>
      <img 
        src={logoImage} 
        alt="Rodrigues Modas - Moda Íntima" 
        className="w-full h-full object-contain"
      />
    </div>
  );
}