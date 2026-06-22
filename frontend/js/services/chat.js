import { api } from './api.js';

export async function sendMessage(content, conversationId, store) {
  store.set('loading', true);
  try {
    const data = await api.post('/chat/message', { content, conversation_id: conversationId });
    return data;
  } finally {
    store.set('loading', false);
  }
}

export async function loadConversations(store) {
  const data = await api.get('/chat/conversations');
  store.set('conversations', data.conversations);
  return data.conversations;
}

export async function loadMessages(conversationId, store) {
  const data = await api.get(`/chat/conversations/${conversationId}`);
  store.update({ messages: data.messages, activeConvId: conversationId });
  return data;
}

export async function deleteConversation(id, store) {
  await api.delete(`/chat/conversations/${id}`);
  const convs = store.get('conversations').filter(c => c.id !== id);
  store.update({ conversations: convs });
  if (store.get('activeConvId') === id) store.update({ activeConvId: null, messages: [] });
}
