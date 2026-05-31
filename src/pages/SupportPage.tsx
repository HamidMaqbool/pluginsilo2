import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SupportTicket, SupportMessage, SupportAttachment } from '../types';
import { Icon } from '../components/Icon';
import { useCompanyAPIStore } from '../config';
import { useSupportTicketsStore } from '../store/supportTicketsStore';
import { useSupportMessagesStore } from '../store/supportMessagesStore';
import { ajaxRequest } from '../helpers/ajaxHelper';

interface SupportPageProps {
  onBack: () => void;
  initialTicketData?: {
    subject: string;
    description: string;
    category: string;
  };
}

export default function SupportPage({ onBack, initialTicketData }: SupportPageProps) {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(!!initialTicketData);
  const [replyText, setReplyText] = useState('');
  const [ticketLoading, setTicketLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ajaxRequest({
      type: 'ps_get_tickets',
      data: {}
    }).then(res => {
      if (res && res.success && res.data.tickets) {
        setTickets(res.data.tickets);
      }
      setTicketLoading(false);
    }).catch(() => {
      setTicketLoading(false);
    });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendReply = async () => {
    if ((!replyText.trim() && selectedFiles.length === 0) || !selectedTicketId) return;

    const formData = new FormData();
    formData.append('ticket_id', selectedTicketId);
    formData.append('text', replyText);
    formData.append('sender', 'user');
    selectedFiles.forEach((file, idx) => {
      if (file.type.startsWith('image/')) {
        formData.append('attachments[]', file);
      }
    });
    let currentTime = new Date();
    let hrs = currentTime.getUTCHours();
    let curentPeriod = 'AM';
    if (hrs > 12) {
      curentPeriod = 'PM';
    }
    let min = currentTime.getMinutes().toString();
    let sec = currentTime.getSeconds();
    let year = currentTime.getFullYear();
    let month = currentTime.getUTCMonth();
    let date = currentTime.getDate();
    let Time = year + '-' + month + '-' + date + ' ' + hrs + ':' + min + ':' + sec;
    Time = Time.toString();
    let thisMessage = {
      'id': null,
      'text': replyText,
      'ticket_id': selectedTicketId,
      'sender': 'user',
      'timestamp': Time
    }

    // scrollToBottom();

    messages.push(thisMessage);
    setSendingMessage(true);
    // scrollToBottom();

    setReplyText('');
    setSelectedFiles([]);
    await ajaxRequest({
      type: 'ps_add_ticket_message',
      data: formData
    }).then(res => {
      if (res && res.success && res.data.messages) {
        setMessages(res.data.messages);
      }
    });
    setSendingMessage(false);
    scrollToBottom();


  };

  const handleCreateTicket = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const ticketData = {
      subject: formData.get('subject'),
      category: formData.get('category'),
      priority: formData.get('priority'),
      api_id: formData.get('apiId'),
      status: 'Open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      description: formData.get('description')
    };
    ajaxRequest({
      type: 'ps_create_ticket',
      data: ticketData
    }).then(res => {
      if (res && res.success && res.data.ticket) {
        setTickets([res.data.ticket, ...tickets]);
        setSelectedTicketId(res.data.ticket.id);
        setIsNewTicketModalOpen(false);
        handleSelectTicket(res.data.ticket.id);
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {

      // scrollToBottom();
      e.preventDefault();
      handleSendReply();
    }
  };

  const apis = useCompanyAPIStore(state => state.apis);
  const tickets = useSupportTicketsStore(state => state.tickets);
  const setTickets = useSupportTicketsStore(state => state.setTickets);
  const messages = useSupportMessagesStore(state => state.messages);
  const setMessages = useSupportMessagesStore(state => state.setMessages);
  const [messageLoading, setMessageLoading] = useState(true);
  const selectedTicket = useMemo(() =>
    tickets.find(t => t.id === selectedTicketId),
    [tickets, selectedTicketId]);
  function scrollToBottom() {
    const chat = document.getElementById('chatMessages');
    chat.scrollTop = chat.scrollHeight;
  }
  const messagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!messagesRef.current) return;

    messagesRef.current.scrollTop =
      messagesRef.current.scrollHeight;
  }, [messages]);
  const handleSelectTicket = (ticketId: string) => {

    setMessages([]);
    setMessageLoading(true);
    setSelectedTicketId(ticketId);
    ajaxRequest({
      type: 'ps_get_ticket_messages',
      data: { ticket_id: ticketId }
    }).then(res => {
      if (res && res.success && res.data.messages) {
        setMessages(res.data.messages);
      }
    });
  };
  useEffect(() => {
    if (tickets.length > 0) {

      setTicketLoading(false)
    }

  }, [tickets]);
  useEffect(() => {
    if (messages.length > 0) {
      setMessageLoading(false)
    }
  }, [messages]);
  return (
    <div className="nx-support-page">
      <div className="nx-page-header nx-support-header">
        <div className="nx-header-left">
          <button onClick={onBack} className="nx-back-button">
            <Icon name="arrow-left" size={18} />
            Back to Marketplace
          </button>
          <h1>Support Center</h1>
        </div>
        <div className="nx-header-right">
          {!ticketLoading && tickets.length > 0 && (
            <button onClick={() => setIsNewTicketModalOpen(true)} className="nx-btn nx-btn-primary">
              <Icon name="plus" size={18} />
              New Ticket
            </button>
          )}
        </div>
      </div>

      {!ticketLoading && tickets.length === 0 ? (
        <div className="nx-support-empty-view">
          <div className="nx-support-empty-card">
            <div className="nx-support-empty-icon">
              <Icon name="bell" size={40} />
            </div>
            <h2>No Support Tickets Yet</h2>
            <p className="nx-support-empty-text">
              Welcome to the Support Center! You do not have any active or previous support tickets.
              If you need help with API integrations, billing questions, or if you have any feature requests,
              feel free to create a ticket and our engineering team will get back to you promptly.
            </p>
            <button 
              onClick={() => setIsNewTicketModalOpen(true)} 
              className="nx-btn nx-btn-primary"
              style={{ padding: '12px 28px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', margin: '24px auto 0', height: 'auto' }}
            >
              <Icon name="plus" size={18} />
              Create Support Ticket
            </button>
          </div>
        </div>
      ) : (
        <div className="nx-support-layout">
          <div className="nx-ticket-list-panel">
            <div className="nx-panel-header">
              <h3>Your Tickets</h3>
            </div>
            <div className="nx-ticket-items">
              {ticketLoading ?
                (
                  <div className="nx-ticket-items-loading">
                    <div className="nx-ticket-loading">
                      <div className="nx-skeleton-wave"></div>
                    </div>
                    <div className="nx-ticket-loading">
                      <div className="nx-skeleton-wave"></div>
                    </div>
                    <div className="nx-ticket-loading">
                      <div className="nx-skeleton-wave"></div>
                    </div>
                  </div>
                ) :
                tickets.map(ticket => (
                  <div
                    key={ticket.id}
                    onClick={() => handleSelectTicket(ticket.id)}
                    className={`nx-ticket-item ${selectedTicketId === ticket.id ? 'nx-active' : ''}`}
                  >
                    <div className="nx-ticket-meta">
                      <span className="nx-ticket-id">{ticket.id}</span>
                      <span className={`nx-status-pill nx-status-${ticket.status ? ticket.status.toLowerCase().replace(' ', '-') : 'unknown'}`}>
                        {ticket.status}
                      </span>
                    </div>
                    <h4 className="nx-ticket-subject">{ticket.subject}</h4>
                    <div className="nx-ticket-footer">
                      <span className="nx-ticket-cat">{ticket.category}</span>
                      <span className="nx-ticket-date">{new Date(ticket.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="nx-ticket-detail-panel">
            {selectedTicket ? (
              <div className="nx-detail-wrapper">
                <div className="nx-detail-header">
                  <div className="nx-detail-title">
                    <div className="nx-detail-subject">
                      <h2>{selectedTicket.subject}</h2>
                      <span className="nx-ticket-id">{selectedTicket.id}</span>
                    </div>
                    <div className="nx-detail-meta">
                      <span className={`nx-priority-tag nx-priority-${selectedTicket.priority.toLowerCase()}`}>
                        {selectedTicket.priority} Priority
                      </span>
                      {selectedTicket.apiId && (
                        <span className="nx-api-tag">
                          API: {apis.find(a => a.id === selectedTicket.apiId)?.name || 'Unknown'}
                        </span>
                      )}
                      <span>Created on {new Date(selectedTicket.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className={`nx-messages-container ${sendingMessage ? 'sending-message' : ''}`} ref={messagesRef} id="chatMessages">
                  {

                    messageLoading && (
                      <div className="nx-detail-loading">
                        <div className="nx-detail-skeleton">
                          <div className="nx-skeleton-wave"></div>
                        </div>
                        <div className="nx-detail-skeleton">
                          <div className="nx-skeleton-wave"></div>
                        </div>
                        {/* <div className="nx-detail-skeleton">
                          <div className="nx-skeleton-wave"></div>
                        </div> */}
                      </div>
                    )
                  }
                  {messages.map(msg => (
                    <div key={msg.id} className={`nx-message-bubble ${msg.sender === 'user' ? 'nx-user' : 'nx-agent'}`}>
                      <div className="nx-message-header">
                        <span className="nx-sender-name">{msg.sender === 'user' ? 'You' : 'Support Agent'}</span>
                        <span className="nx-message-time">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="nx-message-text">{msg.text}</p>
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="nx-message-attachments">
                          {msg.attachments.map(att => (
                            <div key={att.id} className="nx-attachment-preview">
                              {att.type.startsWith('image/') ? (
                                <img
                                  src={att.url}
                                  alt={att.name}
                                  className="nx-attachment-image"
                                  onClick={() => setViewingImage(att.url)}
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="nx-attachment-file">
                                  <Icon name="external" size={16} />
                                  <span>{att.name}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {selectedTicket.status !== 'Closed' && (
                  <div className="nx-reply-box">
                    {selectedFiles.length > 0 && (
                      <div className="nx-selected-files">
                        {selectedFiles.map((file, idx) => (
                          <div key={idx} className="nx-selected-file-tag">
                            <span>{file.name}</span>
                            <button onClick={() => removeFile(idx)} className="nx-remove-file">
                              <Icon name="x" size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="nx-compact-reply">
                      <textarea
                        placeholder="Type your reply here... (Press Enter to send)"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={handleKeyDown}
                      />
                      <div className="nx-compact-actions">
                        <button onClick={() => fileInputRef.current?.click()} className="nx-action-btn" title="Attach File">
                          <Icon name="external" size={18} />
                        </button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          style={{ display: 'none' }}
                          multiple
                          onChange={handleFileChange}
                        />
                        <button onClick={handleSendReply} className="nx-send-btn" title="Send Reply">
                          <Icon name="save" size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
              : (
                <div className="nx-empty-detail">
                  <Icon name="bell" size={48} />
                  <h3>Select a ticket to view conversation</h3>
                  <p>Or create a new one if you need help.</p>
                </div>
              )
            }
          </div>
        </div>
      )}

      <AnimatePresence>
        {isNewTicketModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="nx-modal-overlay"
            onClick={() => setIsNewTicketModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="nx-modal-container nx-new-ticket-modal"
              onClick={e => e.stopPropagation()}
            >
              <div className="nx-modal-header">
                <h2>Create New Support Ticket</h2>
                <button onClick={() => setIsNewTicketModalOpen(false)} className="nx-close-btn">
                  <Icon name="x" size={24} />
                </button>
              </div>
              <form onSubmit={handleCreateTicket} className="nx-modal-body">
                <div className="nx-form-group">
                  <label>Subject</label>
                  <input
                    name="subject"
                    type="text"
                    placeholder="Brief summary of the issue"
                    defaultValue={initialTicketData?.subject}
                    required
                  />
                </div>
                <div className="nx-form-row">
                  <div className="nx-form-group">
                    <label>Category</label>
                    <select name="category" defaultValue={initialTicketData?.category || 'Technical'}>
                      <option>Technical</option>
                      <option>Billing</option>
                      <option>Account</option>
                      <option>Feature Request</option>
                      <option>Custom Development</option>
                    </select>
                  </div>
                  <div className="nx-form-group">
                    <label>Related API</label>
                    <select name="apiId">
                      <option value="">None / General</option>
                      {apis.map(api => (
                        <option key={api.id} value={api.id}>{api.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="nx-form-row">
                  <div className="nx-form-group">
                    <label>Priority</label>
                    <select name="priority">
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>
                <div className="nx-form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    placeholder="Describe your issue in detail..."
                    defaultValue={initialTicketData?.description}
                    required
                    rows={5}
                  />
                </div>
                <div className="nx-modal-footer">
                  <button type="button" onClick={() => setIsNewTicketModalOpen(false)} className="nx-btn nx-btn-ghost">Cancel</button>
                  <button type="submit" className="nx-btn nx-btn-primary">Create Ticket</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {viewingImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="nx-modal-overlay nx-lightbox"
            onClick={() => setViewingImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="nx-lightbox-content"
              onClick={e => e.stopPropagation()}
            >
              <img src={viewingImage} alt="Large view" className="nx-full-image" referrerPolicy="no-referrer" />
              <button onClick={() => setViewingImage(null)} className="nx-lightbox-close">
                <Icon name="x" size={32} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
