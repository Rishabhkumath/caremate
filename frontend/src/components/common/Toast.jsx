// Toast is handled via react-hot-toast in main.jsx
// This is a helper for programmatic toasts
import toast from 'react-hot-toast'

export const showToast = {
  success: (msg) => toast.success(msg),
  error: (msg) => toast.error(msg),
  info: (msg) => toast(msg, { icon: 'ℹ️' }),
  warning: (msg) => toast(msg, { icon: '⚠️' }),
  loading: (msg) => toast.loading(msg),
  dismiss: (id) => toast.dismiss(id),
}

export default showToast
