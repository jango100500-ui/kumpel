import os
import random
import string
import math
from datetime import datetime, timedelta
import pytz
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import telebot
import threading

# Конфигурация окружения
TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")
MONGO_URI = os.getenv("MONGO_URI")

app = Flask(__name__)
CORS(app)

bot = telebot.TeleBot(TELEGRAM_TOKEN)
client = MongoClient(MONGO_URI)
db = client['kumpel_bank']

# Коллекции MongoDB
users_coll = db['users']
auth_codes_coll = db['auth_codes']
transactions_coll = db['transactions']
market_coll = db['market']

MSK_TZ = pytz.timezone('Europe/Moscow')

def get_current_msk_time():
    return datetime.now(MSK_TZ)

# --- 1. ЛОГИКА ТЕЛЕГРАМ БОТА ---
@bot.message_handler(commands=['start'])
def send_auth_code(message):
    tg_id = message.from_user.id
    username = message.from_user.username or f"user_{tg_id}"
    first_name = message.from_user.first_name or "User"

    # Генерируем 6-значный код
    code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    
    # Сохраняем в базу (срок годности можно сделать 15 минут)
    auth_codes_coll.insert_one({
        "code": code,
        "tg_id": tg_id,
        "username": username,
        "first_name": first_name,
        "created_at": get_current_msk_time()
    })

    text = f"Welcome to Kumpel, {first_name}! Here is your code to login via Kumpel — ||{code}||\n\nPlease save the code and don’t delete this chat. It can be requested in the future. Have good finances!"
    bot.send_message(message.chat.id, text, parse_mode="MarkdownV2")

# Запуск бота в отдельном потоке (для Render)
def start_bot():
    bot.polling(none_stop=True)

threading.Thread(target=start_bot, daemon=True).start()


# --- 2. ЛОГИКА ЭКОНОМИКИ И РЫНКА ---
def update_market_rate_if_needed():
    today_str = get_current_msk_time().strftime('%Y-%m-%d')
    today_rate = market_coll.find_one({"date": today_str})
    
    if not today_rate:
        yesterday = get_current_msk_time() - timedelta(days=1)
        yesterday_str = yesterday.strftime('%Y-%m-%d')
        prev_rate = market_coll.find_one({"date": yesterday_str})
        
        base_rate = prev_rate["rate"] if prev_rate else 1.00
        change = random.uniform(-0.08, 0.10) # от -8% до +10%
        new_rate = round(base_rate * (1 + change), 2)
        
        # Хардкап коридора
        new_rate = max(0.60, min(1.80, new_rate))
        
        market_coll.insert_one({"date": today_str, "rate": new_rate})

def process_weekly_payout(user):
    now = get_current_msk_time()
    # Вычисляем дату последнего прошедшего понедельника 00:00
    days_since_monday = now.weekday()
    last_monday = (now - timedelta(days=days_since_monday)).replace(hour=0, minute=0, second=0, microsecond=0)
    
    last_payout = user.get("last_weekly_payout")
    
    # Если выплаты не было или она была до последнего понедельника
    if not last_payout or last_payout < last_monday:
        current_balance = user["balance"]
        payout = 150
        new_balance = current_balance + payout
        
        if new_balance > 2000:
            new_balance = 2000
            
        users_coll.update_one(
            {"_id": user["_id"]},
            {"$set": {"balance": new_balance, "last_weekly_payout": now}}
        )
        return new_balance
    return user["balance"]

# --- 3. REST API ЭНДПОИНТЫ ДЛЯ REACT ---

@app.route('/api/auth/verify', methods=['POST'])
def verify_code():
    data = request.json
    code = data.get('code')
    record = auth_codes_coll.find_one({"code": code})
    
    if not record:
        return jsonify({"success": False, "error": "Invalid code"}), 400
        
    tg_id = record["tg_id"]
    user = users_coll.find_one({"tg_id": tg_id})
    
    if not user:
        # Новый пользователь: баланс 300
        users_coll.insert_one({
            "tg_id": tg_id,
            "username": record["username"],
            "name": record["first_name"],
            "avatar": None,
            "balance": 300,
            "last_weekly_payout": get_current_msk_time()
        })
        user_token = str(tg_id) # В проде нужен JWT
        return jsonify({"success": True, "token": user_token, "is_new": True})
        
    return jsonify({"success": True, "token": str(tg_id), "is_new": False})

@app.route('/api/user/<token>', methods=['GET'])
def get_user(token):
    user = users_coll.find_one({"tg_id": int(token)})
    if not user: return jsonify({"error": "Not found"}), 404
    
    # Ленивая выплата по понедельникам
    new_balance = process_weekly_payout(user)
    
    txs = list(transactions_coll.find({"$or": [{"sender": token}, {"receiver": token}]}).sort("timestamp", -1).limit(20))
    for tx in txs: tx["_id"] = str(tx["_id"])
    
    return jsonify({
        "username": user["username"],
        "name": user["name"],
        "avatar": user["avatar"],
        "balance": new_balance,
        "transactions": txs
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
