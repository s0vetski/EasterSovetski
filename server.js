const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ========== АНТИ-ЧИТ НА СЕРВЕРЕ ==========

// Хранилище рекордов (в реальном проекте используйте базу данных)
// Для начала используем обычный массив — при перезапуске сервера данные сотрутся
let leaderboard = [];

// Проверка валидности результата
function isValidScore(gameData) {
    const { score, gameDuration, totalCatches, goldenCatches, clientSignature } = gameData;
    
    // 1. Проверка на максимальный счет
    if (score > 500) return false;
    
    // 2. Проверка времени игры (минимум 70 мс на очко)
    const minPossibleTime = score * 70;
    if (gameDuration < minPossibleTime && score > 30) return false;
    
    // 3. Проверка на слишком много золотых яиц (макс 30%)
    if (totalCatches > 0) {
        const goldenPercent = (goldenCatches / totalCatches) * 100;
        if (goldenPercent > 35) return false;
    }
    
    // 4. Проверка на слишком частую поимку
    const catchesPerSecond = totalCatches / (gameDuration / 1000);
    if (catchesPerSecond > 8) return false;
    
    return true;
}

// API: сохранить результат
app.post('/api/save-score', (req, res) => {
    const { playerName, score, gameData } = req.body;
    
    // Валидация на сервере
    if (!isValidScore(gameData)) {
        console.log(`Читер заблокирован: ${playerName}, счет ${score}`);
        return res.status(403).json({ 
            success: false, 
            message: 'Результат не прошел проверку' 
        });
    }
    
    // Сохраняем рекорд
    leaderboard.push({
        name: playerName.substring(0, 20),
        score: parseInt(score),
        timestamp: Date.now(),
        gameData: gameData
    });
    
    // Сортируем и оставляем топ-50
    leaderboard.sort((a, b) => b.score - a.score);
    if (leaderboard.length > 50) leaderboard = leaderboard.slice(0, 50);
    
    console.log(`Сохранен рекорд: ${playerName} - ${score} очков`);
    res.json({ success: true });
});

// API: получить топ
app.get('/api/top-scores', (req, res) => {
    const top5 = leaderboard.slice(0, 5).map(entry => ({
        name: entry.name,
        score: entry.score
    }));
    res.json({ top: top5 });
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});