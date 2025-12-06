
// import { useState, useEffect } from 'react';
// import WelcomeScreenWidget from './WelcomeScreenWidget';
// import ChatWindow from './ChatWindow';
// import NavigationBar from './NavigationBar';
// import { Message, ChatState } from '@/types/chat';
// import { useVapi } from '@/hooks/useVapi';

// const ChatInterface = () => {
//   const [chatState, setChatState] = useState<ChatState>('welcome');
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [isLoading, setIsLoading] = useState(false);

//   const apiKey = '4990af9d-ee12-4591-a103-2810f3d78126';
//   const assistantId = 'ea3b9464-bb40-43ec-a4d0-6c9728923143';
//   const { isConnected, isSpeaking, startCall, stopCall, transcript, clearTranscript } = useVapi(apiKey, assistantId);

//   const startChat = (initialMessage?: string) => {
//     setChatState('chatting');
//     if (initialMessage) {
//       handleSendMessage(initialMessage);
//     }
//   };

//   const handleSendMessage = async (content: string) => {
//     const userMessage: Message = {
//       id: Date.now().toString(),
//       content,
//       sender: 'user',
//       timestamp: new Date(),
//     };

//     setMessages((prev) => [...prev, userMessage]);
//     setIsLoading(true);
//     try {
//       const response = await fetch('http://localhost:5678/webhook/5165540a-b829-4b9c-bac4-ce5a0ffe9aed', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ message: content }),
//       });

//       if (!response.ok) {
//         throw new Error('Failed to send message');
//       }

//       const data = await response.json();
//       const botMessage: Message = {
//         id: (Date.now() + 1).toString(),
//         content: data.reply || 'Sorry, I couldn\'t understand that.',
//         sender: 'bot',
//         timestamp: new Date(),
//       };

//       setMessages((prev) => [...prev, botMessage]);
//     } catch (error) {
//       console.error('Error sending message:', error);

//       const errorMessage: Message = {
//         id: (Date.now() + 1).toString(),
//         content: 'Oops! Something went wrong. Try again later.',
//         sender: 'bot',
//         timestamp: new Date(),
//       };

//       setMessages((prev) => [...prev, errorMessage]);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const goHome = () => {
//     setChatState('welcome');
//   };

//   const startNewChat = () => {
//     setMessages([]);
//     clearTranscript();
//     setIsLoading(false);
//   };

//   return (
//     <div className="h-full flex flex-col">
//       <div className="flex-1 overflow-hidden">
//         {chatState === 'welcome' ? (
//           <div className="h-full flex flex-col">
//             <div className="h-full flex-1 overflow-y-auto scrollbar-hide">
//               <WelcomeScreenWidget onStartChat={startChat} />
//             </div>
//             {/* Navigation Bar only on welcome screen */}
//             <div className="flex-shrink-0">
//               <NavigationBar currentView={chatState} onNavigate={setChatState} />
//             </div>
//           </div>
//         ) : (
//           <ChatWindow
//             messages={messages}
//             isLoading={isLoading}
//             onSendMessage={handleSendMessage}
//             onGoHome={goHome}
//             onNewChat={startNewChat}
//             isConnected={isConnected}
//             transcript={transcript}
//             startCall={startCall}
//             stopCall={stopCall}
//           />
//         )}
//       </div>
//     </div>
//   );
// };

// export default ChatInterface;





import { useState } from 'react';
import WelcomeScreenWidget from './WelcomeScreenWidget';
import ChatWindow from './ChatWindow';
import NavigationBar from './NavigationBar';
import ContactForm from './ContactForm';
import { Message, ChatState } from '@/types/chat';
import { useVapi } from '@/hooks/useVapi';

const BACKEND_URL = 'https://ritik-n8n-e9673da43cf4.herokuapp.com/webhook/134acdeb-6476-4398-a7f2-195754f49034';

type Product = {
  name?: string;
  description?: string;
  productUrl?: string;
  imageUrl?: string;
};

const ChatInterface = () => {
  const [chatState, setChatState] = useState<ChatState>('welcome');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const apiKey = 'c24b5ae5-acc4-446a-a601-f590170aba94';
  const assistantId = 'f6eb5237-b933-4dc0-9257-c049347309fc';
  const { isConnected, startCall, stopCall, transcript, clearTranscript } = useVapi(apiKey, assistantId);

  const startChat = (initialMessage?: string) => {
    setChatState('chatting');
    if (initialMessage) handleSendMessage(initialMessage);
  };

  const appendMessages = (newMessages: Message[]) => {
    setMessages((prev) => [...prev, ...newMessages]);
  };

  // ---------- Helpers to parse backend responses ----------
  const safeJsonParse = (s: any) => {
    if (typeof s !== 'string') return null;
    try {
      return JSON.parse(s);
    } catch {
      return null;
    }
  };

  const extractJSONFromText = (text: string): { preText: string; json: any | null } => {
    if (!text) return { preText: '', json: null };

    const firstBracket = text.indexOf('[');
    const firstBrace = text.indexOf('{');
    let start = -1;
    let end = -1;

    if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
      start = firstBracket;
      end = text.lastIndexOf(']');
    } else if (firstBrace !== -1) {
      start = firstBrace;
      end = text.lastIndexOf('}');
    }

    if (start !== -1 && end > start) {
      const candidate = text.slice(start, end + 1).trim();
      const parsed = safeJsonParse(candidate);
      if (parsed) {
        const preText = text.slice(0, start).trim();
        return { preText, json: parsed };
      }
    }

    const parsedWhole = safeJsonParse(text.trim());
    if (parsedWhole) return { preText: '', json: parsedWhole };

    return { preText: text.trim(), json: null };
  };

  const extractProducts = (payload: any): Product[] | null => {
    if (!payload) return null;

    // Case: { products: [...] }
    if (Array.isArray(payload.products)) return payload.products;

    // Case: [ { products: [...] } ] or nested chunks
    if (Array.isArray(payload) && payload.length > 0) {
      // [{ output: "json" }]
      if (payload[0] && typeof payload[0] === 'object' && typeof payload[0].output === 'string') {
        const parsed = safeJsonParse(payload[0].output);
        if (parsed) return extractProducts(parsed) as Product[] | null;
      }

      // [ { products: [...] }, ... ] -> flatten
      if (payload.every((p) => p && Array.isArray(p.products))) {
        return payload.flatMap((p) => p.products);
      }

      // Direct array of product objects
      if (payload[0] && typeof payload[0] === 'object' && ('name' in payload[0] || 'productUrl' in payload[0])) {
        return payload as Product[];
      }
    }

    // Case: { output: "json-string" }
    if (typeof payload.output === 'string') {
      const parsed = safeJsonParse(payload.output);
      if (parsed) return extractProducts(parsed) as Product[] | null;
    }

    return null;
  };

  // Collect plain texts (intros) AND product arrays from any shape
  const collectTextsAndProducts = (input: any): { texts: string[]; products: Product[] } => {
    const texts: string[] = [];
    const products: Product[] = [];

    const addText = (t?: string) => {
      if (t && t.trim().length) texts.push(t.trim());
    };
    const addProducts = (arr: Product[] | null) => {
      if (arr && arr.length) products.push(...arr);
    };

    const visit = (x: any) => {
      if (x == null) return;

      if (typeof x === 'string') {
        // Check if the string contains product markdown format
        if (x.includes('**Product Name**') && x.includes('**Image URL**')) {
          // This is already formatted markdown, keep it as text
          addText(x);
          return;
        }
        
        const { preText, json } = extractJSONFromText(x);
        if (preText) addText(preText);
        if (json != null) visit(json);
        else if (!preText) addText(x);
        return;
      }

      if (Array.isArray(x)) {
        x.forEach(visit);
        return;
      }

      if (typeof x === 'object') {
        // Common keys
        if (Array.isArray(x.messages)) {
          x.messages.forEach((m: any) => {
            if (m?.content) visit(m.content);
            if (m?.card) {
              const prods = extractProducts(m.card);
              if (prods) addProducts(prods);
            }
          });
        }
        if (x.reply) visit(x.reply);
        if (x.card) addProducts(extractProducts(x.card));
        if (Array.isArray(x.cards)) x.cards.forEach((c: any) => addProducts(extractProducts(c)));
        if (x.output) visit(x.output);

        // Raw products on object
        addProducts(extractProducts(x));
      }
    };

    visit(input);
    return { texts, products };
  };

  // Turn products into the exact markdown formats MessageBubble expects
  const productsToMarkdown = (products: Product[], introText?: string): string => {
    const blocks = products
      .filter((p) => p?.name && p?.imageUrl) // imageUrl required by your parser
      .map((p) => {
        const name = p.name ?? '';
        const desc = p.description ? `**Description**: ${p.description}\n` : '';
        const url = p.productUrl ? `**Product URL**: [View Product](${p.productUrl})\n` : '';
        const img = `**Image URL**: ![${name}](${p.imageUrl})`;
        return `**Product Name**: ${name}\n${desc}${url}${img}`;
      });

    const intro = introText && introText.trim().length ? `${introText.trim()}\n\n` : '';
    return `${intro}${blocks.join('\n\n')}`;
  };
  // ---------- End helpers ----------

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date(),
    };

    appendMessages([userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          history: messages.map((m) => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.content,
          })),
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const data = await response.json();
      
      // Debug log
      console.log('[ChatInterface] Received data:', data);

      const { texts, products } = collectTextsAndProducts(data);
      
      console.log('[ChatInterface] Parsed texts:', texts);
      console.log('[ChatInterface] Parsed products:', products);
      
      const toAppend: Message[] = [];

      if (products.length > 0) {
        // Build ONE markdown message that contains optional intro + product blocks
        const markdown = productsToMarkdown(products, texts[0]); // include first text as intro
        toAppend.push({
          id: `${Date.now()}-products`,
          content: markdown,
          sender: 'bot',
          timestamp: new Date(),
        } as Message);

        // If there are additional plain texts beyond the first, append them as separate messages
        if (texts.length > 1) {
          texts.slice(1).forEach((t) =>
            toAppend.push({
              id: `${Date.now()}-text-${Math.random()}`,
              content: t,
              sender: 'bot',
              timestamp: new Date(),
            } as Message)
          );
        }
      } else if (texts.length > 0) {
        // No products, just plain text responses (including already-formatted markdown)
        texts.forEach((t) =>
          toAppend.push({
            id: `${Date.now()}-text-${Math.random()}`,
            content: t,
            sender: 'bot',
            timestamp: new Date(),
          } as Message)
        );
      } else {
        // Fallback if nothing parsed
        toAppend.push({
          id: (Date.now() + 10).toString(),
          content: "Sorry, I couldn't understand that.",
          sender: 'bot',
          timestamp: new Date(),
        } as Message);
      }

      // Debug: verify what's being appended
      console.log('[chat] appending messages:', toAppend);
      appendMessages(toAppend);
    } catch (error) {
      console.error('Error sending message:', error);
      appendMessages([
        {
          id: (Date.now() + 1).toString(),
          content: 'Oops! Something went wrong. Try again later.',
          sender: 'bot',
          timestamp: new Date(),
        } as Message,
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const goHome = () => setChatState('welcome');

  const startNewChat = () => {
    setMessages([]);
    clearTranscript();
    setIsLoading(false);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-hidden">
        {chatState === 'welcome' ? (
          <div className="h-full flex flex-col">
            <div className="h-full flex-1 overflow-y-auto scrollbar-hide">
              <WelcomeScreenWidget onStartChat={startChat} />
            </div>
            <div className="flex-shrink-0">
              <NavigationBar currentView={chatState} onNavigate={setChatState} />
            </div>
          </div>
        ) : chatState === 'faq' ? (
          <ContactForm onGoHome={goHome} />
        ) : (
          <ChatWindow
            messages={messages}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
            onGoHome={goHome}
            onNewChat={startNewChat}
            isConnected={isConnected}
            transcript={transcript}
            startCall={startCall}
            stopCall={stopCall}
          />
        )}
      </div>
    </div>
  );
};

export default ChatInterface;