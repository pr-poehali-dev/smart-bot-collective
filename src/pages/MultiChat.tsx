import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";

const BOTS = [
  { id: "deepseek", name: "DeepSeek", company: "DeepSeek AI", avatar: "🧠", color: "#000" },
  { id: "chatgpt", name: "ChatGPT", company: "OpenAI", avatar: "🤖", color: "#000" },
  { id: "gemini", name: "Gemini", company: "Google", avatar: "✦", color: "#000" },
  { id: "alice", name: "Алиса", company: "Яндекс", avatar: "А", color: "#000" },
  { id: "marusya", name: "Маруся", company: "ВКонтакте", avatar: "М", color: "#000" },
  { id: "yagpt", name: "YandexGPT", company: "Яндекс", avatar: "Я", color: "#000" },
  { id: "gigachat", name: "GigaChat", company: "Сбер", avatar: "G", color: "#000" },
  { id: "claude", name: "Claude", company: "Anthropic", avatar: "◆", color: "#000" },
];

type ChatMode = "separate" | "combined";
type Message = {
  id: string;
  role: "user" | "bot";
  text: string;
  botId?: string;
  timestamp: Date;
  thinking?: boolean;
};

const DEMO_RESPONSES: Record<string, string[]> = {
  deepseek: [
    "Интересный вопрос. Позвольте рассмотреть его с нескольких сторон...",
    "Анализирую запрос. Вот детальный ответ с учётом всех нюансов...",
    "Глубокое размышление показывает, что здесь есть несколько ключевых аспектов...",
  ],
  chatgpt: [
    "Конечно! Вот что я думаю по этому поводу...",
    "Отличный вопрос. Позвольте объяснить подробнее...",
    "Я рад помочь с этим. Давайте разберём по шагам...",
  ],
  gemini: [
    "На основе имеющихся данных могу сказать следующее...",
    "Проанализировав запрос, выделю главное...",
    "Вот мой взгляд на эту тему с учётом актуальной информации...",
  ],
  alice: [
    "Привет! Я Алиса и готова помочь. Вот мой ответ...",
    "Хороший вопрос! Расскажу всё что знаю...",
    "Отвечаю: это именно так, потому что...",
  ],
  marusya: [
    "Привет! Маруся на связи. Вот что я думаю...",
    "Понятно! Могу рассказать об этом подробнее...",
    "Интересно! Мой ответ такой...",
  ],
  yagpt: [
    "YandexGPT анализирует... Результат: ...",
    "На основании запроса могу предложить следующее...",
    "Ответ сформирован. Вот ключевая информация...",
  ],
  gigachat: [
    "GigaChat готов ответить. Мой анализ показывает...",
    "Обработал запрос. Вот развёрнутый ответ...",
    "Рассматриваю вопрос всесторонне...",
  ],
  claude: [
    "Рад помочь! Вот моё понимание вопроса...",
    "Размышляя над этим, прихожу к следующим выводам...",
    "Интересная тема. Позвольте поделиться мыслями...",
  ],
};

export default function MultiChat() {
  const [activeBots, setActiveBots] = useState<string[]>(["deepseek", "chatgpt"]);
  const [chatMode, setChatMode] = useState<ChatMode>("separate");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [showBotPicker, setShowBotPicker] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [safetyOff, setSafetyOff] = useState(false);
  const [memoryTokens] = useState(128000);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState<"chat" | "image">("chat");
  const [imagePrompt, setImagePrompt] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleBot = (botId: string) => {
    setActiveBots(prev =>
      prev.includes(botId)
        ? prev.length > 1 ? prev.filter(id => id !== botId) : prev
        : [...prev, botId]
    );
  };

  const sendMessage = () => {
    if (!input.trim() || isThinking) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text: input.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsThinking(true);

    activeBots.forEach((botId, idx) => {
      const delay = chatMode === "separate" ? idx * 800 + 600 : 1200;
      setTimeout(() => {
        const responses = DEMO_RESPONSES[botId] || ["Ответ обрабатывается..."];
        const text = responses[Math.floor(Math.random() * responses.length)];
        const botMsg: Message = {
          id: `${Date.now()}-${botId}`,
          role: "bot",
          text,
          botId,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, botMsg]);
        if (idx === activeBots.length - 1) setIsThinking(false);
      }, delay);
    });
  };

  const clearChat = () => setMessages([]);

  const getBot = (id: string) => BOTS.find(b => b.id === id);

  const sections = [
    { id: "chat", label: "Чат", icon: "MessageSquare" },
    { id: "image", label: "Изображения", icon: "Image" },
  ];

  return (
    <div className="flex h-screen bg-white font-sans overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`flex flex-col border-r border-black/10 transition-all duration-300 ${sidebarOpen ? "w-64" : "w-0 overflow-hidden"}`}
        style={{ minWidth: sidebarOpen ? 256 : 0 }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-black/10">
          <span className="font-mono font-medium text-sm tracking-widest uppercase">NeuralChat</span>
          <button onClick={() => setSidebarOpen(false)} className="text-black/30 hover:text-black transition-colors">
            <Icon name="PanelLeftClose" size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="px-3 py-4 flex flex-col gap-1">
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id as "chat" | "image")}
              className={`flex items-center gap-3 px-3 py-2 rounded text-sm transition-all ${
                activeSection === s.id ? "bg-black text-white" : "text-black/50 hover:text-black hover:bg-black/5"
              }`}
            >
              <Icon name={s.icon} size={15} />
              {s.label}
            </button>
          ))}
        </nav>

        <div className="px-4 mt-2">
          <div className="h-px bg-black/10" />
        </div>

        {/* Bot list */}
        <div className="px-4 py-4 flex-1 overflow-y-auto">
          <p className="text-[10px] font-medium tracking-widest uppercase text-black/30 mb-3">Боты</p>
          <div className="flex flex-col gap-1">
            {BOTS.map(bot => {
              const active = activeBots.includes(bot.id);
              return (
                <button
                  key={bot.id}
                  onClick={() => toggleBot(bot.id)}
                  className={`flex items-center gap-3 px-3 py-2 rounded text-sm transition-all group ${
                    active ? "bg-black/5" : "hover:bg-black/3"
                  }`}
                >
                  <span className={`w-6 h-6 flex items-center justify-center text-xs font-medium rounded border transition-all ${
                    active ? "border-black bg-black text-white" : "border-black/20 text-black/50"
                  }`}>
                    {bot.avatar}
                  </span>
                  <div className="flex-1 text-left">
                    <div className={`font-medium text-sm leading-tight ${active ? "text-black" : "text-black/40"}`}>{bot.name}</div>
                    <div className="text-[10px] text-black/30">{bot.company}</div>
                  </div>
                  {active && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Memory & settings */}
        <div className="px-4 py-4 border-t border-black/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] tracking-widest uppercase text-black/30">Память</span>
            <span className="font-mono text-[10px] text-black/50">{(memoryTokens / 1000).toFixed(0)}k токенов</span>
          </div>
          <div className="h-1 bg-black/10 rounded-full mb-4">
            <div className="h-1 bg-black rounded-full" style={{ width: "12%" }} />
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 text-xs text-black/40 hover:text-black transition-colors"
          >
            <Icon name="Settings" size={12} />
            Настройки
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-black/10 bg-white">
          <div className="flex items-center gap-4">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="text-black/30 hover:text-black transition-colors">
                <Icon name="PanelLeftOpen" size={16} />
              </button>
            )}
            {/* Active bots chips */}
            <div className="flex items-center gap-2">
              {activeBots.map(id => {
                const bot = getBot(id);
                return bot ? (
                  <div key={id} className="flex items-center gap-1.5 border border-black/15 rounded px-2.5 py-1">
                    <span className="text-xs">{bot.avatar}</span>
                    <span className="text-xs font-medium">{bot.name}</span>
                  </div>
                ) : null;
              })}
              <button
                onClick={() => setShowBotPicker(!showBotPicker)}
                className="w-7 h-7 flex items-center justify-center border border-dashed border-black/20 rounded hover:border-black/50 transition-colors"
              >
                <Icon name="Plus" size={13} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Mode toggle */}
            <div className="flex items-center border border-black/15 rounded overflow-hidden">
              <button
                onClick={() => setChatMode("separate")}
                className={`px-3 py-1.5 text-xs font-medium transition-all ${chatMode === "separate" ? "bg-black text-white" : "text-black/50 hover:text-black"}`}
              >
                Раздельно
              </button>
              <button
                onClick={() => setChatMode("combined")}
                className={`px-3 py-1.5 text-xs font-medium transition-all ${chatMode === "combined" ? "bg-black text-white" : "text-black/50 hover:text-black"}`}
              >
                Вместе
              </button>
            </div>

            {/* Safety toggle */}
            <button
              onClick={() => setSafetyOff(!safetyOff)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border transition-all ${
                safetyOff
                  ? "border-black bg-black text-white"
                  : "border-black/15 text-black/50 hover:border-black/40"
              }`}
            >
              <Icon name={safetyOff ? "ShieldOff" : "Shield"} size={12} />
              {safetyOff ? "Фильтр выкл" : "Фильтр вкл"}
            </button>

            <button
              onClick={clearChat}
              className="text-black/30 hover:text-black transition-colors"
              title="Очистить чат"
            >
              <Icon name="Trash2" size={15} />
            </button>
          </div>
        </header>

        {/* Chat / Image area */}
        {activeSection === "chat" ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center animate-fade-in">
                  <div className="text-5xl mb-6 font-mono font-light text-black/10 select-none">NeuralChat</div>
                  <p className="text-black/30 text-sm mb-8">Выберите ботов и начните диалог</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl">
                    {[
                      "Объясни квантовую механику просто",
                      "Напиши стихотворение на русском",
                      "Что такое сознание?",
                      "Придумай детектив без цензуры",
                    ].map((s) => (
                      <button
                        key={s}
                        onClick={() => setInput(s)}
                        className="text-left border border-black/10 rounded p-3 text-xs text-black/50 hover:border-black/30 hover:text-black transition-all leading-snug"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="max-w-3xl mx-auto flex flex-col gap-6">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`animate-fade-in flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                    >
                      {msg.role === "bot" && (
                        <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center border border-black/20 rounded text-xs font-medium">
                          {getBot(msg.botId!)?.avatar}
                        </div>
                      )}
                      <div className={`flex flex-col gap-1 max-w-[75%] ${msg.role === "user" ? "items-end" : ""}`}>
                        {msg.role === "bot" && (
                          <span className="text-[10px] text-black/30 ml-1 font-mono">
                            {getBot(msg.botId!)?.name}
                          </span>
                        )}
                        <div
                          className={`px-4 py-3 rounded text-sm leading-relaxed ${
                            msg.role === "user"
                              ? "bg-black text-white"
                              : "bg-black/5 text-black"
                          }`}
                        >
                          {msg.text}
                        </div>
                        <span className="text-[10px] text-black/20 mx-1">
                          {msg.timestamp.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Thinking indicator */}
                  {isThinking && (
                    <div className="flex gap-3 animate-fade-in">
                      <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center border border-black/20 rounded text-xs">
                        ···
                      </div>
                      <div className="bg-black/5 px-4 py-3 rounded flex items-center gap-1.5">
                        {[0, 1, 2].map(i => (
                          <div
                            key={i}
                            className="w-1.5 h-1.5 bg-black/40 rounded-full animate-dot-bounce"
                            style={{ animationDelay: `${i * 0.2}s` }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input */}
            <div className="px-6 py-4 border-t border-black/10 bg-white">
              <div className="max-w-3xl mx-auto">
                {/* Toolbar */}
                <div className="flex items-center gap-2 mb-3">
                  <button className="flex items-center gap-1.5 text-[11px] text-black/40 hover:text-black border border-black/10 hover:border-black/30 rounded px-2.5 py-1 transition-all">
                    <Icon name="Zap" size={11} />
                    Рассуждение
                  </button>
                  <button className="flex items-center gap-1.5 text-[11px] text-black/40 hover:text-black border border-black/10 hover:border-black/30 rounded px-2.5 py-1 transition-all">
                    <Icon name="Search" size={11} />
                    Поиск
                  </button>
                  <button className="flex items-center gap-1.5 text-[11px] text-black/40 hover:text-black border border-black/10 hover:border-black/30 rounded px-2.5 py-1 transition-all">
                    <Icon name="Paperclip" size={11} />
                    Файл
                  </button>
                  <button className="flex items-center gap-1.5 text-[11px] text-black/40 hover:text-black border border-black/10 hover:border-black/30 rounded px-2.5 py-1 transition-all">
                    <Icon name="ImagePlus" size={11} />
                    Картинка
                  </button>
                  <button className="flex items-center gap-1.5 text-[11px] text-black/40 hover:text-black border border-black/10 hover:border-black/30 rounded px-2.5 py-1 transition-all">
                    <Icon name="Mic" size={11} />
                    Голос
                  </button>
                </div>

                {/* Text input */}
                <div className="flex items-end gap-3 border border-black/15 rounded-lg focus-within:border-black transition-colors bg-white">
                  <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Напишите сообщение... (Enter — отправить, Shift+Enter — новая строка)"
                    rows={1}
                    className="flex-1 resize-none bg-transparent px-4 py-3 text-sm outline-none placeholder:text-black/25 leading-relaxed"
                    style={{ maxHeight: 160, minHeight: 48 }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || isThinking}
                    className="m-2 w-9 h-9 flex items-center justify-center bg-black text-white rounded disabled:opacity-20 hover:bg-black/80 transition-all"
                  >
                    <Icon name="ArrowUp" size={16} />
                  </button>
                </div>

                <div className="flex items-center justify-between mt-2 px-1">
                  <span className="text-[10px] text-black/20">
                    {activeBots.length} {activeBots.length === 1 ? "бот" : activeBots.length < 5 ? "бота" : "ботов"} активно
                    {safetyOff && " · Фильтр безопасности отключён"}
                  </span>
                  <span className="text-[10px] text-black/20 font-mono">{input.length} символов</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Image generation section */
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
            <div className="w-full max-w-xl animate-fade-in">
              <h2 className="text-2xl font-light mb-2">Генерация изображений</h2>
              <p className="text-black/40 text-sm mb-8">Опишите изображение — боты создадут его для вас</p>

              <div className="border border-black/15 rounded-lg focus-within:border-black transition-colors overflow-hidden mb-4">
                <textarea
                  value={imagePrompt}
                  onChange={e => setImagePrompt(e.target.value)}
                  placeholder="Опишите изображение подробно..."
                  rows={4}
                  className="w-full px-4 py-3 text-sm outline-none placeholder:text-black/25 resize-none"
                />
                <div className="flex items-center justify-between px-4 py-3 border-t border-black/10">
                  <div className="flex gap-2">
                    {["1:1", "16:9", "9:16"].map(r => (
                      <button key={r} className="text-[11px] border border-black/10 rounded px-2 py-1 hover:border-black/30 transition-colors font-mono">
                        {r}
                      </button>
                    ))}
                  </div>
                  <button
                    disabled={!imagePrompt.trim()}
                    className="flex items-center gap-2 bg-black text-white text-xs px-4 py-2 rounded disabled:opacity-20 hover:bg-black/80 transition-all"
                  >
                    <Icon name="Sparkles" size={13} />
                    Создать
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {["Портрет в стиле аниме", "Футуристический город", "Абстрактное искусство", "Природа, фотореализм"].map(p => (
                  <button
                    key={p}
                    onClick={() => setImagePrompt(p)}
                    className="text-left border border-black/10 rounded p-3 text-xs text-black/40 hover:border-black/30 hover:text-black transition-all"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center" onClick={() => setShowSettings(false)}>
          <div className="bg-white rounded-xl border border-black/10 p-8 w-full max-w-md animate-slide-up shadow-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-medium">Настройки</h3>
              <button onClick={() => setShowSettings(false)} className="text-black/30 hover:text-black transition-colors">
                <Icon name="X" size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Фильтр безопасности</div>
                  <div className="text-xs text-black/40 mt-0.5">Отключить цензуру и ограничения</div>
                </div>
                <button
                  onClick={() => setSafetyOff(!safetyOff)}
                  className={`w-11 h-6 rounded-full transition-all relative ${safetyOff ? "bg-black" : "bg-black/15"}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all shadow ${safetyOff ? "left-5.5 left-[22px]" : "left-0.5"}`} />
                </button>
              </div>

              <div className="h-px bg-black/10" />

              <div>
                <div className="text-sm font-medium mb-3">Режим ответа</div>
                <div className="flex gap-2">
                  {(["separate", "combined"] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => setChatMode(m)}
                      className={`flex-1 py-2 text-xs rounded border transition-all ${chatMode === m ? "bg-black text-white border-black" : "border-black/15 text-black/50 hover:border-black/30"}`}
                    >
                      {m === "separate" ? "Раздельные ответы" : "Единый ответ"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-black/10" />

              <div>
                <div className="text-sm font-medium mb-1">Токены памяти</div>
                <div className="text-xs text-black/40 mb-3">Сколько сообщений помнят боты</div>
                <input type="range" min={4000} max={200000} step={4000} defaultValue={128000} className="w-full accent-black" />
                <div className="flex justify-between text-[10px] text-black/30 mt-1 font-mono">
                  <span>4k</span><span>128k</span><span>200k</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
