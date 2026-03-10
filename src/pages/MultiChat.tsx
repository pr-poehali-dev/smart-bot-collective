import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";

const BOTS = [
  { id: "deepseek", name: "DeepSeek", company: "DeepSeek AI", avatar: "🧠" },
  { id: "chatgpt", name: "ChatGPT", company: "OpenAI", avatar: "🤖" },
  { id: "gemini", name: "Gemini", company: "Google", avatar: "✦" },
  { id: "alice", name: "Алиса", company: "Яндекс", avatar: "А" },
  { id: "marusya", name: "Маруся", company: "ВКонтакте", avatar: "М" },
  { id: "yagpt", name: "YandexGPT", company: "Яндекс", avatar: "Я" },
  { id: "gigachat", name: "GigaChat", company: "Сбер", avatar: "G" },
  { id: "claude", name: "Claude", company: "Anthropic", avatar: "◆" },
];

type ChatMode = "separate" | "combined";
type AppMode = "single" | "multi";
type Theme = "light" | "dark";
type Message = {
  id: string;
  role: "user" | "bot";
  text: string;
  botId?: string;
  timestamp: Date;
  cancelled?: boolean;
};

const DEMO_RESPONSES: Record<string, string[]> = {
  deepseek: [
    "Интересный вопрос. Позвольте рассмотреть его с нескольких сторон — есть технический аспект, философский и практический...",
    "Анализирую запрос. Вот детальный ответ с учётом всех нюансов: во-первых, необходимо понять контекст, во-вторых...",
    "Глубокое размышление показывает, что здесь есть несколько ключевых аспектов, которые большинство игнорирует...",
  ],
  chatgpt: [
    "Конечно! Вот что я думаю по этому поводу. Это действительно интересная тема, и я рад её обсудить подробнее...",
    "Отличный вопрос. Позвольте объяснить подробнее: существует несколько подходов к этой проблеме...",
    "Я рад помочь с этим. Давайте разберём по шагам, чтобы всё было максимально понятно...",
  ],
  gemini: [
    "На основе имеющихся данных могу сказать следующее: тема обширная и требует структурированного подхода...",
    "Проанализировав запрос, выделю главное — есть три ключевых момента, которые стоит рассмотреть отдельно...",
    "Вот мой взгляд на эту тему с учётом актуальной информации и различных точек зрения специалистов...",
  ],
  alice: [
    "Привет! Я Алиса и готова помочь. Вот мой ответ: это действительно интересная тема, давай разберёмся...",
    "Хороший вопрос! Расскажу всё что знаю — информации довольно много, поэтому постараюсь быть краткой...",
    "Отвечаю: это именно так, потому что существует ряд фундаментальных причин, объясняющих это явление...",
  ],
  marusya: [
    "Привет! Маруся на связи. Вот что я думаю: тема непростая, но я постараюсь объяснить доступно...",
    "Понятно! Могу рассказать об этом подробнее. Здесь важно учитывать несколько факторов сразу...",
    "Интересно! Мой ответ такой: если смотреть с разных сторон, то можно выделить несколько точек зрения...",
  ],
  yagpt: [
    "YandexGPT анализирует запрос... Результат: данная тема охватывает несколько важных направлений...",
    "На основании запроса могу предложить следующее развёрнутое объяснение с примерами из практики...",
    "Ответ сформирован. Вот ключевая информация, которая поможет разобраться в вопросе досконально...",
  ],
  gigachat: [
    "GigaChat готов ответить. Мой анализ показывает, что вопрос многогранен и требует детального рассмотрения...",
    "Обработал запрос. Вот развёрнутый ответ с учётом контекста и возможных интерпретаций...",
    "Рассматриваю вопрос всесторонне. Позвольте поделиться комплексным взглядом на проблему...",
  ],
  claude: [
    "Рад помочь! Вот моё понимание вопроса: стоит начать с основ, а затем перейти к нюансам...",
    "Размышляя над этим, прихожу к следующим выводам: есть несколько интерпретаций, каждая по-своему верна...",
    "Интересная тема. Позвольте поделиться мыслями — я постараюсь дать максимально полный и честный ответ...",
  ],
};

const SUGGESTIONS = [
  "Объясни квантовую механику просто",
  "Напиши стихотворение на русском",
  "Что такое сознание?",
  "Придумай детективную историю",
  "Как работает ядерный реактор?",
  "Расскажи о тайнах океана",
];

export default function MultiChat() {
  const [theme, setTheme] = useState<Theme>("light");
  const [appMode, setAppMode] = useState<AppMode>("multi");
  const [singleBotId, setSingleBotId] = useState("chatgpt");
  const [activeBots, setActiveBots] = useState<string[]>(["deepseek", "chatgpt", "gemini"]);
  const [chatMode, setChatMode] = useState<ChatMode>("separate");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [safetyOff, setSafetyOff] = useState(false);
  const [memoryTokens, setMemoryTokens] = useState(128000);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState<"chat" | "image">("chat");
  const [imagePrompt, setImagePrompt] = useState("");
  const [cancelledIds, setCancelledIds] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pendingTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const isDark = theme === "dark";

  const t = {
    bg: isDark ? "bg-[#0a0a0a]" : "bg-white",
    sidebar: isDark ? "bg-[#111] border-white/10" : "bg-white border-black/10",
    header: isDark ? "bg-[#0a0a0a] border-white/10" : "bg-white border-black/10",
    text: isDark ? "text-white" : "text-black",
    textMuted: isDark ? "text-white/40" : "text-black/40",
    textFaint: isDark ? "text-white/20" : "text-black/20",
    border: isDark ? "border-white/10" : "border-black/10",
    borderMid: isDark ? "border-white/20" : "border-black/15",
    divider: isDark ? "bg-white/10" : "bg-black/10",
    navActive: isDark ? "bg-white text-black" : "bg-black text-white",
    navHover: isDark ? "text-white/50 hover:text-white hover:bg-white/8" : "text-black/50 hover:text-black hover:bg-black/5",
    chipActive: isDark ? "border-white bg-white text-black" : "border-black bg-black text-white",
    chipInactive: isDark ? "border-white/20 text-white/50" : "border-black/20 text-black/50",
    botActive: isDark ? "bg-white/8" : "bg-black/5",
    userBubble: isDark ? "bg-white text-black" : "bg-black text-white",
    botBubble: isDark ? "bg-white/10 text-white" : "bg-black/5 text-black",
    inputBorder: isDark ? "border-white/15 focus-within:border-white/50" : "border-black/15 focus-within:border-black",
    inputBg: isDark ? "bg-[#111]" : "bg-white",
    inputText: isDark ? "text-white placeholder:text-white/20" : "text-black placeholder:text-black/25",
    btnPrimary: isDark ? "bg-white text-black hover:bg-white/80" : "bg-black text-white hover:bg-black/80",
    btnOutline: isDark ? "border-white/15 text-white/50 hover:border-white/40 hover:text-white" : "border-black/15 text-black/50 hover:border-black/40 hover:text-black",
    modeActive: isDark ? "bg-white text-black" : "bg-black text-white",
    modeInactive: isDark ? "text-white/50 hover:text-white" : "text-black/50 hover:text-black",
    suggCard: isDark ? "border-white/10 text-white/40 hover:border-white/30 hover:text-white" : "border-black/10 text-black/40 hover:border-black/30 hover:text-black",
    safetyOn: isDark ? "border-white/15 text-white/50" : "border-black/15 text-black/50",
    safetyOff: isDark ? "border-white bg-white text-black" : "border-black bg-black text-white",
    settingsBg: isDark ? "bg-[#111] border-white/10" : "bg-white border-black/10",
    toggleOn: isDark ? "bg-white" : "bg-black",
    toggleOff: isDark ? "bg-white/15" : "bg-black/15",
    dotActive: isDark ? "bg-white" : "bg-black",
    thinkDot: isDark ? "bg-white/40" : "bg-black/40",
    singleBotActive: isDark ? "border-white/40 bg-white/5" : "border-black/40 bg-black/5",
    singleBotInactive: isDark ? "border-white/10 hover:border-white/30" : "border-black/10 hover:border-black/20",
  };

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

  const cancelGeneration = () => {
    pendingTimers.current.forEach(clearTimeout);
    pendingTimers.current = [];
    setIsThinking(false);
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

    const botsToUse = appMode === "single" ? [singleBotId] : activeBots;

    botsToUse.forEach((botId, idx) => {
      const delay = appMode === "single" ? 800 : chatMode === "separate" ? idx * 700 + 500 : 1200;
      const timer = setTimeout(() => {
        const responses = DEMO_RESPONSES[botId] || ["Ответ обрабатывается..."];
        const text = responses[Math.floor(Math.random() * responses.length)];
        setMessages(prev => [...prev, {
          id: `${Date.now()}-${botId}`,
          role: "bot",
          text,
          botId,
          timestamp: new Date(),
        }]);
        if (idx === botsToUse.length - 1) setIsThinking(false);
      }, delay);
      pendingTimers.current.push(timer);
    });
  };

  const clearChat = () => { setMessages([]); cancelGeneration(); };
  const getBot = (id: string) => BOTS.find(b => b.id === id);

  return (
    <div className={`flex h-screen font-sans overflow-hidden transition-colors duration-300 ${t.bg}`}>

      {/* Sidebar */}
      <aside className={`flex flex-col border-r transition-all duration-300 ${t.sidebar} ${sidebarOpen ? "w-64" : "w-0 overflow-hidden"}`}
        style={{ minWidth: sidebarOpen ? 256 : 0 }}>

        {/* Logo */}
        <div className={`flex items-center justify-between px-6 py-5 border-b ${t.border}`}>
          <span className={`font-mono font-medium text-sm tracking-widest uppercase ${t.text}`}>NeuralChat</span>
          <button onClick={() => setSidebarOpen(false)} className={`${t.textMuted} hover:${t.text} transition-colors`}>
            <Icon name="PanelLeftClose" size={16} />
          </button>
        </div>

        {/* App mode switcher */}
        <div className="px-4 pt-4 pb-2">
          <p className={`text-[10px] font-medium tracking-widest uppercase mb-2 ${t.textMuted}`}>Режим</p>
          <div className={`flex border rounded overflow-hidden ${t.border}`}>
            <button
              onClick={() => setAppMode("single")}
              className={`flex-1 py-1.5 text-xs font-medium transition-all ${appMode === "single" ? t.modeActive : t.modeInactive}`}
            >
              Один бот
            </button>
            <button
              onClick={() => setAppMode("multi")}
              className={`flex-1 py-1.5 text-xs font-medium transition-all ${appMode === "multi" ? t.modeActive : t.modeInactive}`}
            >
              Много
            </button>
          </div>
        </div>

        <div className={`mx-4 h-px my-3 ${t.divider}`} />

        {/* Bot list */}
        <div className="px-4 flex-1 overflow-y-auto">
          <p className={`text-[10px] font-medium tracking-widest uppercase mb-3 ${t.textMuted}`}>
            {appMode === "single" ? "Выбери бота" : "Боты"}
          </p>
          <div className="flex flex-col gap-1">
            {BOTS.map(bot => {
              const isActiveSingle = appMode === "single" && singleBotId === bot.id;
              const isActiveMulti = appMode === "multi" && activeBots.includes(bot.id);
              const active = isActiveSingle || isActiveMulti;

              return (
                <button
                  key={bot.id}
                  onClick={() => appMode === "single" ? setSingleBotId(bot.id) : toggleBot(bot.id)}
                  className={`flex items-center gap-3 px-3 py-2 rounded text-sm transition-all ${active ? t.botActive : ""}`}
                >
                  <span className={`w-6 h-6 flex items-center justify-center text-xs font-medium rounded border transition-all ${active ? t.chipActive : t.chipInactive}`}>
                    {bot.avatar}
                  </span>
                  <div className="flex-1 text-left">
                    <div className={`font-medium text-sm leading-tight ${active ? t.text : t.textMuted}`}>{bot.name}</div>
                    <div className={`text-[10px] ${t.textFaint}`}>{bot.company}</div>
                  </div>
                  {active && <div className={`w-1.5 h-1.5 rounded-full ${t.dotActive}`} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom */}
        <div className={`px-4 py-4 border-t ${t.border}`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-[10px] tracking-widest uppercase ${t.textMuted}`}>Память</span>
            <span className={`font-mono text-[10px] ${t.textMuted}`}>{(memoryTokens / 1000).toFixed(0)}k</span>
          </div>
          <div className={`h-1 rounded-full mb-4 ${isDark ? "bg-white/10" : "bg-black/10"}`}>
            <div className={`h-1 rounded-full ${isDark ? "bg-white" : "bg-black"}`} style={{ width: "12%" }} />
          </div>
          <button onClick={() => setShowSettings(true)} className={`flex items-center gap-2 text-xs transition-colors ${t.textMuted}`}>
            <Icon name="Settings" size={12} />
            Настройки
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header className={`flex items-center justify-between px-6 py-4 border-b ${t.header}`}>
          <div className="flex items-center gap-4">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className={`${t.textMuted} transition-colors`}>
                <Icon name="PanelLeftOpen" size={16} />
              </button>
            )}

            {/* Active bot chips */}
            <div className="flex items-center gap-2 flex-wrap">
              {appMode === "single" ? (
                <div className={`flex items-center gap-1.5 border rounded px-2.5 py-1 ${t.borderMid}`}>
                  <span className="text-xs">{getBot(singleBotId)?.avatar}</span>
                  <span className={`text-xs font-medium ${t.text}`}>{getBot(singleBotId)?.name}</span>
                </div>
              ) : (
                activeBots.map(id => {
                  const bot = getBot(id);
                  return bot ? (
                    <div key={id} className={`flex items-center gap-1.5 border rounded px-2.5 py-1 ${t.borderMid}`}>
                      <span className="text-xs">{bot.avatar}</span>
                      <span className={`text-xs font-medium ${t.text}`}>{bot.name}</span>
                    </div>
                  ) : null;
                })
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Multi mode: combined/separate */}
            {appMode === "multi" && (
              <div className={`flex items-center border rounded overflow-hidden ${t.border}`}>
                <button onClick={() => setChatMode("separate")} className={`px-3 py-1.5 text-xs font-medium transition-all ${chatMode === "separate" ? t.modeActive : t.modeInactive}`}>
                  Раздельно
                </button>
                <button onClick={() => setChatMode("combined")} className={`px-3 py-1.5 text-xs font-medium transition-all ${chatMode === "combined" ? t.modeActive : t.modeInactive}`}>
                  Вместе
                </button>
              </div>
            )}

            {/* Safety */}
            <button
              onClick={() => setSafetyOff(!safetyOff)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border transition-all ${safetyOff ? t.safetyOff : t.safetyOn}`}
            >
              <Icon name={safetyOff ? "ShieldOff" : "Shield"} size={12} />
              {safetyOff ? "Без фильтра" : "Фильтр"}
            </button>

            {/* Theme toggle */}
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className={`w-8 h-8 flex items-center justify-center rounded border transition-all ${t.btnOutline}`}
              title={isDark ? "Светлая тема" : "Тёмная тема"}
            >
              <Icon name={isDark ? "Sun" : "Moon"} size={14} />
            </button>

            {/* Sections */}
            <button
              onClick={() => setActiveSection(activeSection === "chat" ? "image" : "chat")}
              className={`w-8 h-8 flex items-center justify-center rounded border transition-all ${t.btnOutline}`}
              title={activeSection === "chat" ? "Изображения" : "Чат"}
            >
              <Icon name={activeSection === "chat" ? "Image" : "MessageSquare"} size={14} />
            </button>

            <button onClick={clearChat} className={`${t.textMuted} transition-colors`} title="Очистить чат">
              <Icon name="Trash2" size={15} />
            </button>
          </div>
        </header>

        {/* Chat area */}
        {activeSection === "chat" ? (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center animate-fade-in">
                  <div className={`text-5xl mb-4 font-mono font-light select-none ${t.textFaint}`}>
                    {appMode === "single" ? getBot(singleBotId)?.avatar : "◈"}
                  </div>
                  <p className={`text-lg font-light mb-1 ${t.text}`}>
                    {appMode === "single" ? getBot(singleBotId)?.name : "NeuralChat"}
                  </p>
                  <p className={`text-sm mb-10 ${t.textMuted}`}>
                    {appMode === "single"
                      ? `${getBot(singleBotId)?.company} · Готов к диалогу`
                      : `${activeBots.length} ${activeBots.length === 1 ? "бот" : "бота"} активно · Начните диалог`}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl">
                    {SUGGESTIONS.map(s => (
                      <button key={s} onClick={() => setInput(s)}
                        className={`text-left border rounded p-3 text-xs transition-all leading-snug ${t.suggCard}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="max-w-3xl mx-auto flex flex-col gap-5">
                  {messages.map(msg => (
                    <div key={msg.id} className={`animate-fade-in flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                      {msg.role === "bot" && (
                        <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center border rounded text-xs font-medium ${t.chipInactive}`}>
                          {getBot(msg.botId!)?.avatar}
                        </div>
                      )}
                      <div className={`flex flex-col gap-1 max-w-[75%] ${msg.role === "user" ? "items-end" : ""}`}>
                        {msg.role === "bot" && (
                          <span className={`text-[10px] ml-1 font-mono ${t.textFaint}`}>
                            {getBot(msg.botId!)?.name}
                          </span>
                        )}
                        <div className={`px-4 py-3 rounded-xl text-sm leading-relaxed ${msg.role === "user" ? t.userBubble : t.botBubble}`}>
                          {msg.text}
                        </div>
                        <span className={`text-[10px] mx-1 ${t.textFaint}`}>
                          {msg.timestamp.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  ))}

                  {isThinking && (
                    <div className="flex gap-3 animate-fade-in">
                      <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center border rounded text-xs ${t.chipInactive}`}>···</div>
                      <div className={`px-4 py-3 rounded-xl flex items-center gap-1.5 ${isDark ? "bg-white/10" : "bg-black/5"}`}>
                        {[0, 1, 2].map(i => (
                          <div key={i} className={`w-1.5 h-1.5 rounded-full animate-dot-bounce ${t.thinkDot}`}
                            style={{ animationDelay: `${i * 0.2}s` }} />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input */}
            <div className={`px-6 py-4 border-t ${isDark ? "bg-[#0a0a0a] border-white/10" : "bg-white border-black/10"}`}>
              <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  {[
                    { icon: "Zap", label: "Рассуждение" },
                    { icon: "Search", label: "Поиск" },
                    { icon: "Paperclip", label: "Файл" },
                    { icon: "ImagePlus", label: "Картинка" },
                    { icon: "Mic", label: "Голос" },
                  ].map(btn => (
                    <button key={btn.label}
                      className={`flex items-center gap-1.5 text-[11px] border rounded px-2.5 py-1 transition-all ${t.btnOutline}`}>
                      <Icon name={btn.icon} size={11} />
                      {btn.label}
                    </button>
                  ))}
                </div>

                <div className={`flex items-end gap-3 border rounded-xl transition-colors ${t.inputBorder} ${t.inputBg}`}>
                  <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder="Напишите сообщение... (Enter — отправить)"
                    rows={1}
                    className={`flex-1 resize-none bg-transparent px-4 py-3 text-sm outline-none leading-relaxed ${t.inputText}`}
                    style={{ maxHeight: 160, minHeight: 48 }}
                  />
                  {isThinking ? (
                    <button onClick={cancelGeneration}
                      className={`m-2 w-9 h-9 flex items-center justify-center rounded border transition-all ${t.btnOutline}`}>
                      <Icon name="Square" size={14} />
                    </button>
                  ) : (
                    <button onClick={sendMessage} disabled={!input.trim()}
                      className={`m-2 w-9 h-9 flex items-center justify-center rounded disabled:opacity-20 transition-all ${t.btnPrimary}`}>
                      <Icon name="ArrowUp" size={16} />
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between mt-2 px-1">
                  <span className={`text-[10px] ${t.textFaint}`}>
                    {appMode === "single"
                      ? getBot(singleBotId)?.name
                      : `${activeBots.length} ${activeBots.length === 1 ? "бот" : "бота"} активно`}
                    {safetyOff && " · Без фильтра"}
                  </span>
                  <span className={`text-[10px] font-mono ${t.textFaint}`}>{input.length}</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Image section */
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
            <div className="w-full max-w-xl animate-fade-in">
              <h2 className={`text-2xl font-light mb-2 ${t.text}`}>Генерация изображений</h2>
              <p className={`text-sm mb-8 ${t.textMuted}`}>Опишите изображение — боты создадут его для вас</p>
              <div className={`border rounded-xl overflow-hidden mb-4 ${t.borderMid} ${t.inputBg}`}>
                <textarea value={imagePrompt} onChange={e => setImagePrompt(e.target.value)}
                  placeholder="Опишите изображение подробно..."
                  rows={4}
                  className={`w-full px-4 py-3 text-sm outline-none resize-none bg-transparent ${t.inputText}`}
                />
                <div className={`flex items-center justify-between px-4 py-3 border-t ${t.border}`}>
                  <div className="flex gap-2">
                    {["1:1", "16:9", "9:16"].map(r => (
                      <button key={r} className={`text-[11px] border rounded px-2 py-1 transition-colors font-mono ${t.btnOutline}`}>{r}</button>
                    ))}
                  </div>
                  <button disabled={!imagePrompt.trim()}
                    className={`flex items-center gap-2 text-xs px-4 py-2 rounded disabled:opacity-20 transition-all ${t.btnPrimary}`}>
                    <Icon name="Sparkles" size={13} />
                    Создать
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {["Портрет в стиле аниме", "Футуристический город", "Абстрактное искусство", "Природа, фотореализм"].map(p => (
                  <button key={p} onClick={() => setImagePrompt(p)}
                    className={`text-left border rounded p-3 text-xs transition-all ${t.suggCard}`}>{p}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Settings modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowSettings(false)}>
          <div className={`rounded-xl border p-8 w-full max-w-md animate-slide-up shadow-2xl ${t.settingsBg}`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`font-medium ${t.text}`}>Настройки</h3>
              <button onClick={() => setShowSettings(false)} className={t.textMuted}><Icon name="X" size={16} /></button>
            </div>

            <div className="flex flex-col gap-5">
              {/* Theme */}
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-sm font-medium ${t.text}`}>Тёмная тема</div>
                  <div className={`text-xs mt-0.5 ${t.textMuted}`}>Чёрный фон интерфейса</div>
                </div>
                <button onClick={() => setTheme(isDark ? "light" : "dark")}
                  className={`w-11 h-6 rounded-full transition-all relative ${isDark ? t.toggleOn : t.toggleOff}`}>
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all shadow ${isDark ? "left-[22px]" : "left-0.5"}`}
                    style={{ backgroundColor: isDark ? "#000" : "#fff" }} />
                </button>
              </div>

              <div className={`h-px ${t.divider}`} />

              {/* Safety */}
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-sm font-medium ${t.text}`}>Фильтр безопасности</div>
                  <div className={`text-xs mt-0.5 ${t.textMuted}`}>Включить цензуру</div>
                </div>
                <button onClick={() => setSafetyOff(!safetyOff)}
                  className={`w-11 h-6 rounded-full transition-all relative ${!safetyOff ? t.toggleOn : t.toggleOff}`}>
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full transition-all shadow ${!safetyOff ? "left-[22px]" : "left-0.5"}`}
                    style={{ backgroundColor: isDark ? "#000" : "#fff" }} />
                </button>
              </div>

              <div className={`h-px ${t.divider}`} />

              {/* Memory */}
              <div>
                <div className={`text-sm font-medium mb-1 ${t.text}`}>Токены памяти</div>
                <div className={`text-xs mb-3 ${t.textMuted}`}>Сколько контекста помнят боты</div>
                <input type="range" min={4000} max={200000} step={4000} value={memoryTokens}
                  onChange={e => setMemoryTokens(Number(e.target.value))}
                  className="w-full accent-black" />
                <div className={`flex justify-between text-[10px] mt-1 font-mono ${t.textFaint}`}>
                  <span>4k</span><span className="font-medium">{(memoryTokens / 1000).toFixed(0)}k</span><span>200k</span>
                </div>
              </div>

              <div className={`h-px ${t.divider}`} />

              {/* Mode */}
              <div>
                <div className={`text-sm font-medium mb-3 ${t.text}`}>Режим ответа (много ботов)</div>
                <div className="flex gap-2">
                  {(["separate", "combined"] as const).map(m => (
                    <button key={m} onClick={() => setChatMode(m)}
                      className={`flex-1 py-2 text-xs rounded border transition-all ${chatMode === m
                        ? (isDark ? "bg-white text-black border-white" : "bg-black text-white border-black")
                        : t.btnOutline}`}>
                      {m === "separate" ? "Раздельные" : "Единый"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
