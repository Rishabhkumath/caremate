import { useState, useCallback } from 'react'
import { chatbotApi } from '../api/chatbotApi'

export const useChatbot = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I'm CareMate AI, your virtual nursing assistant. How can I help you today? You can ask me about symptoms, medications, or general health questions." }
  ])
  const [typing, setTyping] = useState(false)

  const sendMessage = useCallback(async (content) => {
    const userMsg = { role: 'user', content }
    setMessages(prev => [...prev, userMsg])
    setTyping(true)

    try {
      const history = messages
        .concat(userMsg)
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }))

      const response = await chatbotApi.sendMessage(content, { history })
      const payload = response?.data ?? response
      const reply = payload?.response || payload?.message || 'Sorry, I could not generate a response right now.'

      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Sorry, I encountered an error. Please try again.'

      setMessages(prev => [...prev, { role: 'assistant', content: errorMessage }])
    } finally {
      setTyping(false)
    }
  }, [messages])

  const clearChat = () => {
    setMessages([{ role: 'assistant', content: "Chat cleared. How can I help you today?" }])
  }

  return { messages, typing, sendMessage, clearChat }
}
