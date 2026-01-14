
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Order, Product } from "../types";

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface AiChatProps {
  products: Product[];
  orders: Order[];
}

const AiChat: React.FC<AiChatProps> = ({ products, orders }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'สวัสดีครับ! ผมคือ AI ผู้ช่วยวิเคราะห์สต็อกและยอดขาย มีอะไรให้ผมช่วยตรวจสอบข้อมูลในระบบให้ไหมครับ?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      // Create a new instance right before use
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const systemContext = `
        You are a specialized stock and sales analyst for a Modern Trade retail application.
        Current Inventory Data: ${JSON.stringify(products)}
        Order History Data: ${JSON.stringify(orders)}
        
        Guidelines:
        - Answer in Thai language professionally.
        - Analyze stock levels, risks of running out, and sales patterns based on the provided JSON data.
        - Be concise but helpful.
        - If asked about specific store orders or product SKU, use the data accurately.
      `;

      // Use the chat interface as recommended for conversational history
      const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: systemContext,
          temperature: 0.7,
        },
        // We initialize history from our state to maintain context
        history: messages.map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }))
      });

      const response: GenerateContentResponse = await chat.sendMessage({
        message: userMessage
      });

      const aiText = response.text || "ขออภัยครับ ไม่สามารถประมวลผลคำตอบได้ในขณะนี้";
      setMessages(prev => [...prev, { role: 'model', text: aiText }]);
    } catch (error) {
      console.error("AI Chat Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI กรุณาลองใหม่อีกครั้ง" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-indigo-50/30 flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xl">
          🤖
        </div>
        <div>
          <h3 className="font-bold text-slate-800">Talks with AI</h3>
          <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Stock & Sales Analyst</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl text-sm shadow-sm ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
            }`}>
              <div className="whitespace-pre-line leading-relaxed">
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200"></div>
              </div>
              <span className="text-xs text-slate-400 italic">AI กำลังวิเคราะห์ข้อมูล...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-white">
        <div className="flex gap-2">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="ถามคำถามเกี่ยวกับสต็อกหรือยอดขายที่นี่..."
            className="flex-1 p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            disabled={isLoading}
          />
          <button 
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-md shadow-indigo-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-2 text-center">Gemini AI model may provide inaccurate information, please verify critical data.</p>
      </form>
    </div>
  );
};

export default AiChat;
