import { useTheme } from '@/contexts/ThemeContext';
import { Message } from '@/types/chat';
import { User } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const { theme } = useTheme();
  const isUser = message.sender === 'user';
  
  // Typing animation states
  const [displayedText, setDisplayedText] = useState(isUser ? message.content as string : '');
  const [isTyping, setIsTyping] = useState(!isUser);
  const typingSpeed = 10; // milliseconds per character
  const messageRef = useRef<HTMLDivElement>(null);
  
  // Typing animation effect for bot messages
  useEffect(() => {
    if (isUser) return; // Only animate bot messages
    
    // Check if this is a product recommendation - if so, skip typing animation
    const isProductMsg = typeof message.content === 'string' &&
      /\*\*Product Name\*\*:/.test(message.content) &&
      /\*\*Image URL\*\*:/.test(message.content);
    
    if (isProductMsg) {
      // Show products immediately without typing animation
      setDisplayedText(message.content as string);
      setIsTyping(false);
      return;
    }
    
    let currentText = '';
    let currentIndex = 0;
    const fullText = message.content as string;
    
    setIsTyping(true);
    
    const typingInterval = setInterval(() => {
      if (currentIndex < fullText.length) {
        currentText += fullText[currentIndex];
        setDisplayedText(currentText);
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        setIsTyping(false);
      }
    }, typingSpeed);
    
    return () => clearInterval(typingInterval);
  }, [message.content, isUser]);

  // --- PRODUCT PARSER ---
  const parseProductMarkdown = (text: string) => {
    if (!text) return { products: [], textBefore: '', textAfter: '' };
    
    // Check if the text is complete enough to parse products
    // Only try to parse if we have at least one complete product block
    if (!text.includes('**Product Name**') || !text.includes('**Image URL**')) {
      return { products: [], textBefore: text, textAfter: '' };
    }
    
    // Updated regex to match the actual format from the backend
    // Looking for blocks that start with **Product Name** and end with **Image URL**
    const productRegex = /\*\*Product Name\*\*:([\s\S]*?)(?=\*\*Product Name\*\*:|$)/g;

    let match;
    const products = [];
    let firstIndex = -1;
    let lastIndex = -1;

    while ((match = productRegex.exec(text)) !== null) {
      const block = match[0];
      const start = match.index;
      const end = start + block.length;

      if (firstIndex === -1) firstIndex = start;
      lastIndex = end;

      // Extract product details from the block
      const titleMatch = block.match(/\*\*Product Name\*\*:\s*(.*?)(?:\n|$)/);
      const descriptionMatch = block.match(/\*\*Description\*\*:\s*(.*?)(?:\n|$)/);
      const urlMatch = block.match(/\*\*Product URL\*\*:\s*\[(.*?)\]\((.*?)\)/);
      const markdownImageMatch = block.match(/\*\*Image URL\*\*:\s*!?\[[^\]]*\]\(([^)\n]+)\)/);
      const directImageMatch = block.match(/\*\*Image URL\*\*:\s*(https?:[^\s]+)/);
      const rawImageUrl = markdownImageMatch?.[1]?.trim() ?? directImageMatch?.[1]?.trim() ?? '';
      const imageUrl = rawImageUrl.replace(/\)+$/, '');

      // Only add if we have at least title and image
      if (titleMatch && imageUrl) {
        products.push({
          title: titleMatch[1]?.trim() ?? '',
          description: descriptionMatch?.[1]?.trim() ?? '',
          url: urlMatch?.[2]?.trim() ?? '',
          image: imageUrl,
        });
      }
    }

    // Handle partial text during typing animation
    return {
      products,
      textBefore: firstIndex >= 0 ? text.slice(0, firstIndex).trim() : text.trim(),
      textAfter: lastIndex >= 0 ? text.slice(lastIndex).trim() : '',
    };
  };

  // --- CARD RENDER ---
  const renderProductCards = (text: string) => {
    const { products, textBefore, textAfter } = parseProductMarkdown(text);
    
    // Debug logging
    console.log('Parsing product markdown:', { 
      textLength: text.length, 
      productsFound: products.length, 
      textBefore: textBefore.substring(0, 100),
      products 
    });

    return (
      <div className="space-y-4 max-w-full">
        {textBefore && (
          <p
            className="text-sm text-gray-900"
            dangerouslySetInnerHTML={{ __html: formatMessage(textBefore) }}
          />
        )}

        {products.length > 0 && (
          <div className="flex flex-col gap-4">
            {products.map((product, index) => (
              <div
                key={index}
                className="bg-[#3d1a5f] border border-[#5a2d7d] rounded-2xl p-4 w-[280px] text-white shadow-xl"
              >
                {product.image && (
                  <img
                    src={product.image}
                    alt={product.title}
                    className="rounded-xl w-full h-48 object-cover mb-3"
                    onError={(e) => {
                      console.error('Image failed to load:', product.image);
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                <h3 className="text-white font-semibold text-base mb-2 leading-tight">{product.title}</h3>
                <p className="text-sm text-purple-200 mb-4 leading-relaxed">{product.description}</p>
                {product.url && (
                  <a
                    href={product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center bg-green-500 hover:bg-green-600 transition text-white rounded-lg py-2.5 text-sm font-semibold"
                  >
                    View Product
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {textAfter && (
          <p
            className="text-sm text-gray-900"
            dangerouslySetInnerHTML={{ __html: formatMessage(textAfter) }}
          />
        )}
      </div>
    );
  };

  // --- DEFAULT TEXT FORMATTER ---
  const formatMessage = (text: string) => {
    return text
      .replace(/^###\s+(.*)$/gm, '<strong>$1</strong>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" class="underline text-blue-400">$1</a>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
      .replace(/^\*\s+(.*)$/gm, '• $1')
      .replace(/\n/g, '<br/>');
  };

  const isProductRecommendation =
    typeof message.content === 'string' &&
    /\*\*Product Name\*\*:/.test(message.content) &&
    /\*\*Image URL\*\*:/.test(message.content);

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex ${isProductRecommendation ? 'max-w-full' : 'max-w-[70vw] sm:max-w-[300px] lg:max-w-[300px]'} ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* <div className={`flex max-w-[70vw] sm:max-w-[300px] lg:max-w-[300px] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}></div> */}
        {/* Compact Avatar */}
        <div className={`flex-shrink-0 ${isUser ? 'ml-2' : 'mr-2'}`}>
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gray-700 to-black flex items-center justify-center shadow-md">
              <User className="w-4 h-4 text-white" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full overflow-hidden shadow-md bg-white">
              <img
                src={theme.logoUrl}
                alt={theme.brandName}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        {/* Compact Message Bubble */}
        <div
          className={`relative p-3 rounded-xl ${isUser
            ? 'bg-gradient-to-r from-gray-700 to-black backdrop-blur-md border border-gray-600/30 text-white ml-auto shadow-md'
            : 'bg-gradient-to-r from-white/30 to-gray-100/30 backdrop-blur-md border border-gray-200/30 text-gray-900 shadow-md'} shadow-lg`}
        >
          {isProductRecommendation ? (
             renderProductCards(message.content as string)
          ) : (
            <div ref={messageRef} className="text-xs leading-relaxed">
              <p dangerouslySetInnerHTML={{ __html: formatMessage(isUser ? message.content as string : displayedText) }} />
              {isTyping && <span className="inline-block w-1.5 h-3 ml-0.5 bg-current animate-pulse">|</span>}
            </div>
          )}

          <p className={`text-xs mt-1 ${isUser ? 'text-white/80' : 'text-gray-600'}`}>
            {message.timestamp.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>

          {/* Compact Tail */}
          <div className={`absolute top-3 ${isUser ? 'right-0 translate-x-1' : 'left-0 -translate-x-1'}`}>
            <div
              className={`w-2.5 h-2.5 rotate-45 ${isUser
                ? 'bg-gradient-to-r from-gray-700 to-black border-l border-t border-gray-600/30'
                : 'bg-gradient-to-r from-white/30 to-gray-100/30 border-l border-t border-gray-200/30'}`}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;

