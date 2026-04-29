import { useAuth } from '../../hooks/useAuth'
import Avatar from '../common/Avatar'

export default function ChatMessage({ message }) {
  const { user } = useAuth()
  const isUser = message.role === 'user'

  return (
    <div className={`flex items-end gap-2 mb-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {isUser ? (
        <Avatar name={user?.name} role={user?.role} size="xs" />
      ) : (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-xs text-white font-bold flex-shrink-0">
          AI
        </div>
      )}
      <div className={`max-w-xs lg:max-w-md xl:max-w-lg rounded-2xl px-4 py-3 text-sm leading-relaxed ${
        isUser
          ? 'bg-teal-600 text-white rounded-br-sm'
          : 'chatbot-assistant-message rounded-bl-sm'
      }`}>
        {message.content}
      </div>
    </div>
  )
}
