// scripts/game-manager.js
class DnDGame {
    constructor() {
        this.gameData = null;
        this.currentCharacter = null;
        this.diceResults = [];
        this.gameLog = [];
        this.voiceManager = null;
        this.deepseek = null;
    }
    
    async init() {
        console.log('Инициализация игры...');
        
        try {
            // Загружаем данные игры
            await this.loadGameData();
            console.log('Данные игры загружены:', this.gameData.campaignName);
            
            // Инициализируем голосовой менеджер
            this.voiceManager = new VoiceManager();
            console.log('Голосовой менеджер инициализирован');
            
            // Настраиваем колбэки
            this.setupVoiceCallbacks();
            console.log('Колбэки настроены');
            
            // Проверяем, что deepseek загружен
            if (typeof deepseek !== 'undefined') {
                this.deepseek = deepseek;
                console.log('DeepSeek API подключен');
            } else {
                console.warn('DeepSeek API не загружен, используем заглушку');
                this.deepseek = this.createMockDeepSeek();
            }
            
            // Обновляем UI
            this.updatePartyStatus();
            this.updateCharacterActions();
            
            // Начальное сообщение
            this.addToLog('DM', this.getInitialMessage());
            
            // Назначаем обработчики кнопок
            this.setupButtonListeners();
            
            console.log('Игра успешно инициализирована');
            return true;
            
        } catch (error) {
            console.error('Ошибка инициализации игры:', error);
            this.addToLog('💥', `Ошибка инициализации: ${error.message}`, 'action');
            return false;
        }
    }
    
    async loadGameData() {
        try {
            // Пробуем загрузить из URL
            const urlParams = new URLSearchParams(window.location.search);
            const gameId = urlParams.get('game');
            
            if (gameId && gameId !== 'undefined') {
                console.log('Загружаю игру по ID:', gameId);
                // Проверяем localStorage
                const savedGame = localStorage.getItem(`dndGame_${gameId}`);
                if (savedGame) {
                    this.gameData = JSON.parse(savedGame);
                    console.log('Игра загружена из localStorage');
                    return;
                }
            }
            
            // Пробуем загрузить файл characters.json
            console.log('Пробую загрузить characters.json...');
            const response = await fetch('./data/characters.json');
            if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }
            
            this.gameData = await response.json();
            console.log('characters.json загружен успешно');
            
        } catch (error) {
            console.warn('Не удалось загрузить данные, использую резервные:', error);
            this.gameData = this.getDefaultGameData();
        }
    }
    
    getDefaultGameData() {
        return {
            campaignName: 'Новогодний Заговор в Златогриве',
            dmStyle: 'Лёгкий, быстрый, с постоянным фоновым хулиганским подтекстом. Как анимация от «Рика и Морти», если бы её делали гномы-пивовары. Смех и нелепость — наши цели.',
            currentSituation: 'Город Златогрив. Канун Нового Года. Воздух дрожит от магии подарков и запаха жареного гуся.',
            diceRules: {
                criticals: 'Натуральные 1 и 20 — абсолютны. Без модов. 1 = эпикфейл с последствиями. 20 = чудо.',
                groupChecks: 'Если действуют конкретные герои — они кидают свои кубы. Остальная группа кидает ОБЩИЙ КУБ (один d20 за всех). К общему кубу применяется ХУДШИЙ модификатор из тех, кто в нём участвует. Итог = худший результат между спецами и группой.'
            },
            characters: [
                {
                    id: 'grom',
                    name: 'ГРОМ УЩЕРБНЫЙ',
                    race: 'Полуорк',
                    class: 'Воин-танк',
                    health: 16,
                    maxHealth: 16,
                    modifiers: {
                        strength: '+4',
                        dexterity: '-1',
                        constitution: '+3',
                        intelligence: '-2',
                        wisdom: '+1',
                        charisma: '0'
                    },
                    abilities: [
                        { name: 'УЩЕРБНЫЙ ГНЕВ', description: 'После получения критического удара следующая атака Грома наносит двойной урон.' }
                    ],
                    personality: {
                        trait: 'Прямолинеен как удар топором. Не понимает тонких намёков.',
                        weakness: 'Слишком доверяет "честному" противнику. Легко обмануть.',
                        mantra: 'Лучшая защита - это когда враг уже мёртв.'
                    }
                },
                {
                    id: 'zaebasha',
                    name: 'ЗАЕБАША ПЛАМЕДЫШАЩАЯ',
                    race: 'Драконорождённая',
                    class: 'Жрица',
                    health: 10,
                    maxHealth: 10,
                    modifiers: {
                        strength: '0',
                        dexterity: '+2',
                        constitution: '+1',
                        intelligence: '+2',
                        wisdom: '+4',
                        charisma: '+3'
                    },
                    abilities: [
                        { name: 'ИСЦЕЛЯЮЩЕЕ ПЛАМЯ', description: 'Дыхание огнем лечит союзников на половину нанесенного урона.' }
                    ],
                    personality: {
                        trait: 'Спокойная и терпеливая, как пламя в очаге.',
                        weakness: 'Панически боится ледяной магии.',
                        mantra: 'Тепло лечит не только тело, но и душу.'
                    }
                }
            ]
        };
    }
    
    createMockDeepSeek() {
        return {
            sendMessage: async (message, context) => {
                console.log('Mock DeepSeek:', message.substring(0, 50));
                
                const mockResponses = [
                    '[звон колокольчиков] Отличное начало! Что дальше, банда абсурда?',
                    '[скрип сапог по снегу] Итак, вы на улице Златогрива. Куда направляетесь?',
                    '[шёпот монет] Кот-жид что-то учуял! Что делаете?',
                    '[потрескивание огня] У костра в таверне тепло. Какие планы?'
                ];
                
                // Имитация задержки API
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                return mockResponses[Math.floor(Math.random() * mockResponses.length)];
            }
        };
    }
    
    setupVoiceCallbacks() {
        if (!this.voiceManager) return;
        
        this.voiceManager.onListeningStart = () => {
            const btn = document.getElementById('recordBtn');
            if (btn) btn.classList.add('listening');
            
            const statusBar = document.getElementById('statusBar');
            if (statusBar) statusBar.textContent = '🎤 Слушаю... Говорите!';
        };
        
        this.voiceManager.onListeningEnd = () => {
            const btn = document.getElementById('recordBtn');
            if (btn) btn.classList.remove('listening');
            
            const statusBar = document.getElementById('statusBar');
            if (statusBar) statusBar.textContent = 'Обработка...';
        };
        
        this.voiceManager.onSpeechResult = async (text) => {
            await this.processPlayerAction(text);
        };
        
        this.voiceManager.onError = (error) => {
            console.error('Голосовая ошибка:', error);
            this.addToLog('🎤', `Ошибка микрофона: ${error}`, 'action');
            
            const statusBar = document.getElementById('statusBar');
            if (statusBar) statusBar.textContent = 'Ошибка микрофона';
        };
    }
    
    setupButtonListeners() {
        // Кнопка записи
        const recordBtn = document.getElementById('recordBtn');
        if (recordBtn) {
            recordBtn.onclick = () => {
                if (this.voiceManager) {
                    this.voiceManager.startListening();
                }
            };
        }
        
        // Кнопка остановки
        const stopBtn = document.getElementById('stopBtn');
        if (stopBtn) {
            stopBtn.onclick = () => {
                if (this.voiceManager) {
                    this.voiceManager.stopListening();
                }
            };
        }
        
        // Меню кнопки
        const menuBtn = document.getElementById('menuBtn');
        if (menuBtn) {
            menuBtn.onclick = () => this.toggleMenu();
        }
        
        // Кнопка настроек
        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
            settingsBtn.onclick = () => this.showSettings();
        }
    }
    
    async processPlayerAction(actionText) {
        if (!actionText || actionText.trim() === '') {
            console.log('Пустое действие');
            return;
        }
        
        console.log('Действие игрока:', actionText);
        this.addToLog('Игрок', actionText, 'player');
        
        // Определяем, нужно ли бросать кубик
        const needsRoll = this.checkIfNeedsRoll(actionText);
        let rollResult = null;
        
        if (needsRoll) {
            rollResult = this.rollDice('d20');
            console.log('Бросок d20:', rollResult);
            this.addToLog('🎲', `Бросок d20: ${rollResult}`, 'action');
        }
        
        // Формируем сообщение для DM
        const fullMessage = rollResult ? 
            `${actionText} (Результат броска: ${rollResult})` : 
            actionText;
        
        // Получаем ответ от DM
        const dmResponse = await this.getDMResponse(fullMessage);
        
        // Обрабатываем ответ
        this.processDMResponse(dmResponse);
    }
    
    async getDMResponse(playerMessage) {
        try {
            if (!this.deepseek) {
                throw new Error('DeepSeek не инициализирован');
            }
            
            const context = {
                characters: this.gameData.characters,
                dmStyle: this.gameData.dmStyle,
                diceRules: this.gameData.diceRules,
                currentSituation: this.gameData.currentSituation
            };
            
            console.log('Запрос к DeepSeek с контекстом:', {
                charactersCount: context.characters.length,
                situation: context.currentSituation.substring(0, 50)
            });
            
            const response = await this.deepseek.sendMessage(playerMessage, context);
            console.log('Ответ от DeepSeek:', response.substring(0, 100));
            
            this.updateCurrentSituation(response);
            
            return response;
            
        } catch (error) {
            console.error('Ошибка получения ответа от DM:', error);
            return `[помехи в эфире] Магия дала сбой! ${error.message}. Попробуйте снова!`;
        }
    }
    
    processDMResponse(response) {
        this.addToLog('DM', response, 'dm');
        
        // Ищем броски кубов в ответе
        const rollMatch = response.match(/d20:\s*(\d+)/i);
        if (rollMatch) {
            const roll = parseInt(rollMatch[1]);
            this.handleDiceResult(roll);
        }
        
        // Озвучиваем ответ (без метаданных)
        const cleanText = this.cleanTextForSpeech(response);
        if (this.voiceManager) {
            this.voiceManager.speak(cleanText, {
                onStart: () => {
                    const statusBar = document.getElementById('statusBar');
                    if (statusBar) statusBar.textContent = '🗣️ DM говорит...';
                },
                onEnd: () => {
                    const statusBar = document.getElementById('statusBar');
                    if (statusBar) statusBar.textContent = 'Готов к следующему действию';
                }
            });
        }
    }
    
    addToLog(sender, message, type = 'dm') {
        const logEntry = {
            sender,
            message,
            type,
            timestamp: new Date().toISOString()
        };
        
        this.gameLog.push(logEntry);
        this.updateGameLogUI(logEntry);
    }
    
    updateGameLogUI(logEntry) {
        const gameLog = document.getElementById('gameLog');
        if (!gameLog) {
            console.error('Элемент gameLog не найден');
            return;
        }
        
        const logElement = document.createElement('div');
        
        let message = logEntry.message || '';
        
        // Обработка звуковых эффектов
        message = message.replace(/\[(.*?)\]/g, 
            '<span class="sound-effect">[$1]</span>');
        
        // Обработка бросков кубов
        message = message.replace(/d20:\s*(\d+)/gi, 
            (match, roll) => {
                const isCritical = roll == 20 || roll == 1;
                return `<span class="roll-result ${isCritical ? 'critical' : ''}">d20: ${roll}</span>`;
            });
        
        logElement.className = `log-entry ${logEntry.type}-message`;
        logElement.innerHTML = `
            <div class="sender">${logEntry.sender}</div>
            <div class="message">${message}</div>
        `;
        
        gameLog.appendChild(logElement);
        gameLog.scrollTop = gameLog.scrollHeight;
    }
    
    updatePartyStatus() {
        const container = document.getElementById('partyStatus');
        if (!container || !this.gameData.characters) return;
        
        container.innerHTML = this.gameData.characters.map(char => `
            <div class="character-status" data-character-id="${char.id}">
                <div class="character-name">${char.name.split(' ')[0]}</div>
                <div class="hp-bar">
                    <div class="hp-fill" style="width: ${(char.health / char.maxHealth) * 100}%"></div>
                </div>
                <div class="hp-text">${char.health}/${char.maxHealth}</div>
            </div>
        `).join('');
        
        // Назначаем обработчики кликов
        container.querySelectorAll('.character-status').forEach(el => {
            const charId = el.getAttribute('data-character-id');
            el.onclick = () => this.selectCharacter(charId);
        });
    }
    
    updateCharacterActions() {
        const container = document.getElementById('characterActions');
        if (!container || !this.currentCharacter) return;
        
        const char = this.gameData.characters.find(c => c.id === this.currentCharacter);
        if (!char || !char.abilities) return;
        
        container.innerHTML = char.abilities.map(ability => `
            <button class="char-action-btn" data-ability="${ability.name}">
                ${ability.name}
            </button>
        `).join('');
        
        // Назначаем обработчики
        container.querySelectorAll('.char-action-btn').forEach(btn => {
            const abilityName = btn.getAttribute('data-ability');
            btn.onclick = () => this.useAbility(this.currentCharacter, abilityName);
        });
    }
    
    rollDice(type = 'd20', modifier = 0) {
        let result;
        
        switch(type) {
            case 'd20':
                result = Math.floor(Math.random() * 20) + 1;
                break;
            case 'group':
                result = Math.floor(Math.random() * 20) + 1;
                // Находим худший модификатор ловкости
                const worstMod = this.gameData.characters.reduce((min, char) => {
                    const mod = parseInt(char.modifiers.dexterity) || 0;
                    return Math.min(min, mod);
                }, 0);
                result += worstMod;
                break;
            default:
                // Обработка других типов кубов (d6, d8 и т.д.)
                const matches = type.match(/d(\d+)/i);
                if (matches) {
                    const sides = parseInt(matches[1]);
                    result = Math.floor(Math.random() * sides) + 1;
                } else {
                    result = Math.floor(Math.random() * 20) + 1;
                }
        }
        
        result += modifier;
        this.diceResults.push({ type, result, timestamp: Date.now() });
        return result;
    }
    
    cleanTextForSpeech(text) {
        if (!text) return '';
        
        return text
            .replace(/\[.*?\]/g, '')  // Удаляем звуковые эффекты
            .replace(/\(.*?\)/g, '')   // Удаляем броски в скобках
            .replace(/d20:\s*\d+/gi, '') // Удаляем упоминания бросков
            .replace(/\s+/g, ' ')      // Убираем лишние пробелы
            .trim();
    }
    
    getInitialMessage() {
        return `[треск камина, звон колокольчиков] Добро пожаловать в ${this.gameData.campaignName}! 
        ${this.gameData.currentSituation} Куда вас занесло в этот новогодний вечер, банда абсурдных героев?`;
    }
    
    checkIfNeedsRoll(actionText) {
        if (!actionText) return false;
        
        const rollTriggers = [
            'проверк', 'броса', 'кида', 'кубик', 'd20', 'бросок',
            'скрыт', 'убежд', 'атак', 'заклина', 'проверя', 'кину'
        ];
        
        const lowerText = actionText.toLowerCase();
        return rollTriggers.some(trigger => lowerText.includes(trigger));
    }
    
    handleDiceResult(roll) {
        if (roll === 1) {
            this.addToLog('💥', 'КРИТИЧЕСКИЙ ПРОВАЛ!', 'action');
        } else if (roll === 20) {
            this.addToLog('🎯', 'НАТУРАЛЬНАЯ 20!', 'action');
        }
    }
    
    updateCurrentSituation(dmResponse) {
        if (!dmResponse) return;
        
        const lowerResponse = dmResponse.toLowerCase();
        
        if (lowerResponse.includes('таверн')) {
            this.gameData.currentSituation = 'Вы в таверне "Пьяный гном"';
        } else if (lowerResponse.includes('улиц')) {
            this.gameData.currentSituation = 'Вы на улицах Златогрива';
        } else if (lowerResponse.includes('подземел')) {
            this.gameData.currentSituation = 'Вы в подземельях под городом';
        } else if (lowerResponse.includes('лес') || lowerResponse.includes('лесу')) {
            this.gameData.currentSituation = 'Вы в заснеженном лесу';
        } else if (lowerResponse.includes('дворц') || lowerResponse.includes('замк')) {
            this.gameData.currentSituation = 'Вы у ворот дворца';
        }
        
        // Обновляем отображение локации
        const locationInfo = document.getElementById('locationInfo');
        if (locationInfo) {
            locationInfo.textContent = `📍 ${this.gameData.currentSituation}`;
        }
    }
    
    selectCharacter(characterId) {
        this.currentCharacter = characterId;
        this.updateCharacterActions();
        
        const char = this.gameData.characters.find(c => c.id === characterId);
        if (char) {
            document.getElementById('statusBar').textContent = 
                `Выбран: ${char.name}. Используйте способности ниже`;
        }
    }
    
    useAbility(characterId, abilityName) {
        const char = this.gameData.characters.find(c => c.id === characterId);
        if (!char) return;
        
        const ability = char.abilities.find(a => a.name === abilityName);
        if (!ability) return;
        
        this.addToLog(char.name, `Использует "${abilityName}": ${ability.description}`, 'player');
        
        // Автоматически отправляем действие
        this.processPlayerAction(`Использую способность "${abilityName}"`);
    }
    
    quickAction(action) {
        console.log('Быстрое действие:', action);
        
        switch(action) {
            case 'd20':
                const roll = this.rollDice('d20');
                this.processPlayerAction(`Быстрый бросок d20: ${roll}`);
                break;
            case 'group':
                const groupRoll = this.rollDice('group');
                this.processPlayerAction(`Групповая проверка: ${groupRoll}`);
                break;
            case 'stealth':
                this.processPlayerAction('Пытаемся скрыться');
                break;
            case 'persuade':
                this.processPlayerAction('Пытаемся убедить');
                break;
            default:
                console.warn('Неизвестное быстрое действие:', action);
        }
    }
    
    // Методы для меню
    toggleMenu() {
        const menu = document.getElementById('sideMenu');
        if (menu) {
            menu.classList.toggle('active');
        }
    }
    
    showSettings() {
        alert('Настройки игры\n\nИспользуйте кнопку 🎤 для голосовых команд.\n\nБыстрые действия:\n🎲 d20 - бросить кубик\n👥 Группа - групповая проверка\n🥷 Скрыться - проверка скрытности\n💬 Убедить - проверка убеждения');
    }
    
    showCharacters() {
        const modal = document.getElementById('characterModal');
        if (!modal) return;
        
        modal.innerHTML = `
            <div class="modal-content" style="
                background: #1a1a4a;
                padding: 20px;
                border-radius: 15px;
                max-width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                color: white;
                border: 2px solid #ffd700;
            ">
                <h2 style="color: #ffd700; margin-bottom: 20px;">👥 Персонажи</h2>
                ${this.gameData.characters.map(char => `
                    <div style="
                        background: rgba(255,255,255,0.1);
                        padding: 15px;
                        margin-bottom: 15px;
                        border-radius: 10px;
                        border-left: 4px solid #4cc9f0;
                    ">
                        <h3 style="color: #4cc9f0; margin-bottom: 10px;">${char.name}</h3>
                        <p><strong>Раса/Класс:</strong> ${char.race} - ${char.class}</p>
                        <p><strong>ХП:</strong> ${char.health}/${char.maxHealth}</p>
                        <p><strong>Характеристики:</strong> 
                            СИЛ ${char.modifiers.strength}, 
                            ЛОВ ${char.modifiers.dexterity}, 
                            ТЕЛ ${char.modifiers.constitution}
                        </p>
                        ${char.personality ? `
                            <p><strong>Черта:</strong> ${char.personality.trait || 'Не указано'}</p>
                            <p><strong>Слабость:</strong> ${char.personality.weakness || 'Не указано'}</p>
                        ` : ''}
                    </div>
                `).join('')}
                <button onclick="document.getElementById('characterModal').style.display='none'" style="
                    background: #ff3366;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    margin-top: 20px;
                    width: 100%;
                ">
                    Закрыть
                </button>
            </div>
        `;
        modal.style.display = 'flex';
        
        // Закрытие по клику вне модального окна
        modal.onclick = function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        };
    }
    
    showRules() {
        alert(`🎲 ПРАВИЛА ИГРЫ:

Критические броски:
Натуральные 1 и 20 — абсолютны.
1 = эпикфейл с последствиями.
20 = чудо.

Групповые проверки:
Конкретные герои кидают свои кубы.
Остальная группа — ОБЩИЙ КУБ (один d20 за всех).
Применяется ХУДШИЙ модификатор.

Как играть:
1. Нажмите 🎤 и говорите что делать
2. DM ответит и озвучит ответ
3. Используйте быстрые кнопки для бросков
4. Нажмите на персонажа для выбора способностей`);
    }
    
    saveSession() {
        const sessionData = {
            gameLog: this.gameLog,
            characters: this.gameData.characters,
            currentSituation: this.gameData.currentSituation,
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('dndSession', JSON.stringify(sessionData));
        this.addToLog('💾', 'Сессия сохранена в браузере!', 'action');
    }
    
    resetGame() {
        if (confirm('Начать новую игру? Текущий прогресс будет потерян.')) {
            localStorage.removeItem('dndSession');
            this.gameLog = [];
            this.diceResults = [];
            this.currentCharacter = null;
            
            // Очищаем лог
            const gameLog = document.getElementById('gameLog');
            if (gameLog) {
                gameLog.innerHTML = '';
            }
            
            // Сбрасываем здоровье персонажей
            if (this.gameData.characters) {
                this.gameData.characters.forEach(char => {
                    char.health = char.maxHealth;
                });
            }
            
            this.updatePartyStatus();
            this.addToLog('🔄', 'Новая игра начата!', 'action');
            this.addToLog('DM', this.getInitialMessage(), 'dm');
            
            const statusBar = document.getElementById('statusBar');
            if (statusBar) {
                statusBar.textContent = 'Новая игра начата! Нажмите 🎤 чтобы говорить';
            }
        }
    }
    
    // Вспомогательные методы
    log(message) {
        console.log(`[DnDGame] ${message}`);
    }
    
    error(message) {
        console.error(`[DnDGame] ${message}`);
    }
}

// Глобальная инициализация
if (typeof window !== 'undefined') {
    // Экспортируем класс для глобального использования
    window.DnDGame = DnDGame;
    
    // Автоматически создаем экземпляр, если скрипт загружен отдельно
    if (!window.game && document.readyState === 'complete') {
        console.log('Автоматическая инициализация игры');
        window.game = new DnDGame();
        window.game.init().catch(error => {
            console.error('Ошибка автоматической инициализации:', error);
        });
    }
}