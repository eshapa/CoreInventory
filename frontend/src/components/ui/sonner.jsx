import { Toaster as Sonner, toast } from "sonner";

const Toaster = ({ ...props }) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="bottom-right"
      toastOptions={{
        style: {
          background: "hsl(222, 20%, 18%)",
          color: "#ffffff",
          border: "1px solid hsl(214, 32%, 30%)",
        },
        classNames: {
          error:
            "!bg-red-600 !text-white !border-red-700",
          success:
            "!bg-green-600 !text-white !border-green-700",
          warning:
            "!bg-orange-500 !text-white !border-orange-600",
          info:
            "!bg-blue-600 !text-white !border-blue-700",
          description: "!text-gray-200",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };