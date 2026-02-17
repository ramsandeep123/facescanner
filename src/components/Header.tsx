import logo from "@/assets/oex-logo-white.png";
import PWAInstallButton from "./PWAInstallButton";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass transition-all duration-300">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <img src={logo} alt="OPTIC EXCLUSIVE" className="h-8 w-auto hover:opacity-80 transition-opacity" />
        <PWAInstallButton />
      </div>
    </header>
  );
};

export default Header;
