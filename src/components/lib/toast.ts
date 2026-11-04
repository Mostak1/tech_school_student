import { toast } from "sonner";

// Toast utility functions for consistent notifications using shadcn/ui Sonner
export const toastUtils = {
  // Success toast
  success: (message: string) => {
    toast.success(message, {
      duration: 3000,
    });
  },

  // Error toast
  error: (message: string) => {
    toast.error(message, {
      duration: 5000,
    });
  },

  // Loading toast
  loading: (message: string) => {
    return toast.loading(message);
  },

  // Promise toast - shows loading, then success/error based on promise result
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(promise, messages);
  },

  // Dismiss specific toast
  dismiss: (toastId: string | number) => {
    toast.dismiss(toastId);
  },

  // Dismiss all toasts
  dismissAll: () => {
    toast.dismiss();
  },
};

// Export individual functions for convenience
export const { success, error, loading, promise, dismiss, dismissAll } =
  toastUtils;
