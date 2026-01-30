import { Toaster as Sonner } from "sonner";

const Toaster = () => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="top-right"
      richColors
      closeButton
    />
  );
};

export { Toaster };
