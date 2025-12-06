// public/scripts/deepseek-api.js - ОБНОВЛЕННЫЙ
class DeepSeekAPI {
    constructor() {
        this.conversationHistory = [];
        // Используем Vercel функцию как прокси
        this.baseURL = '/api/deepseek-proxy'; // Относительный путь!
        
        // Для отладки - разные URL для разных окружений
        this.proxyURLs = {
            local: '/api/deepseek-proxy',
            vercel: '/api/deepseek-proxy',
            test: 'https://dnd-proxy.vercel.app/api/deepseek-proxy' // Тестовый прокси
        };
        
        // Автоматически определяем окружение
        this.detectEnvironment();
    }
    
    detectEnvironment() {
        const hostname = window.location.hostname;
        
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            this.baseURL = this.proxyURLs.local;
            console.log('Локальное окружение, прокси:', this.baseURL);
        } else if (hostname.includes('vercel.app')) {
            this.baseURL = this.proxyURLs.vercel;
            console.log('Vercel окружение, прокси:', this.baseURL);
        } else {
            // Для других хостингов используем тестовый прокси
            this.baseURL = this.proxyURLs.test;
            console.log('Продакшен окружение, тестовый прокси:', this.baseURL);
        }
    }
    
    async sendMessage(userMessage, gameContext) {
        try {
            const systemPrompt = this.createSystemPrompt(gameContext);
            
            const messages = [
                { role: 'system', content: systemPrompt },
                ...this.conversationHistory.slice(-6),
                { role: 'user', content: userMessage }
            ];
            
            console.log('Отправляю запрос через прокси:', this.baseURL);
            console.log('Сообщения:', messages.length);
            
            const response = await fetch(this.baseURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'deepseek-chat',
                    messages: messages,
                    max_tokens: 500,
                    temperature: 0.9,
                    presence_penalty: 0.6,
                    frequency_penalty: 0.3,
                    stream: false
                })
            });
            
            console.log('Ответ прокси:', response.status, response.statusText);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Ошибка прокси:', response.status, errorText);
                
                // Если прокси не работает, пробуем заглушку
                if (response.status === 404 || response.status === 500) {
                    console.log('Прокси недоступен, использую заглушку');
                    return this.getMockResponse(userMessage);
                }
                
                throw new Error(`Прокси ошибка: ${response.status} - ${errorText}`);
            }
            
            const data = await response.json();
            console.log('Получены данные:', data);
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                console.error('Некорректная структура ответа:', data);
                throw new Error('Некорректный ответ от сервера');
            }
            
            const assistantMessage = data.choices[0].message.content;
            
            // Сохраняем в историю
            this.conversationHistory.push(
                { role: 'user', content: userMessage },
                { role: 'assistant', content: assistantMessage }
            );
            
            // Ограничиваем размер истории
            if (this.conversationHistory.length > 20) {
                this.conversationHistory = this.conversationHistory.slice(-20);
            }
            
            console.log('Успешно получен ответ от DM');
            return assistantMessage;
            
        } catch (error) {
            console.error('DeepSeek API Error:', error);
            
            // Запасной ответ
            return this.getMockResponse(userMessage);
        }
    }
    
    getMockResponse(userMessage) {
        const mockResponses = [
            `[звон колокольчиков] "${userMessage}"? Отличная идея! Что дальше?`,
            `[скрип сапог] Вы сказали "${userMessage.substring(0, 30)}..." Интересно! Как реагируете?`,
            `[треск огня] Так, так... ${userMessage.substring(0, 20)}... Продолжайте!`,
            `[шёпот ветра] ${userMessage.substring(0, 25)}... И что из этого выйдет?`
        ];
        
        return mockResponses[Math.floor(Math.random() * mockResponses.length)];
    }
    
    createSystemPrompt(gameContext) {
        // ... тот же код что и раньше, без изменений ...
        // (вставьте сюда ваш старый код createSystemPrompt)
    }
    
    clearHistory() {
        this.conversationHistory = [];
    }
    
    // Тест соединения
    async testConnection() {
        try {
            console.log('Тестирую соединение с:', this.baseURL);
            
            const response = await fetch(this.baseURL, {
                method: 'OPTIONS'
            });
            
            return {
                success: response.ok,
                status: response.status,
                url: this.baseURL,
                environment: window.location.hostname
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                url: this.baseURL,
                environment: window.location.hostname
            };
        }
    }
}

const deepseek = new DeepSeekAPI();