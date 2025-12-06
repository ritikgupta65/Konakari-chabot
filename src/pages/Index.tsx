
import ChatInterface from '@/components/chat/ChatInterface';
import { ThemeProvider } from '@/contexts/ThemeContext';

const Index = () => {
  return (
    <ThemeProvider>
      {/* Elegant background with black and white theme */}
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        {/* Compact professional widget-style chatbot container */}
        <div className="w-full max-w-sm h-[600px] bg-gradient-to-r from-[#20335412] to-[#20335412] rounded-2xl shadow-2xl border border-gray-300/50 relative overflow-hidden">
          {/* Main Chat Interface */}
          <ChatInterface />
        </div>
      </div>
    </ThemeProvider>
  );
};

export default Index;
