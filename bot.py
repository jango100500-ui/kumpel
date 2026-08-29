import os
import random
import string
import math
import html
from datetime import datetime, timedelta
import pytz
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import certifi
import telebot

TELEGRAM_TOKEN = (os.getenv("TELEGRAM_TOKEN") or "").strip().strip("'").strip('"')
MONGO_URI = (os.getenv("MONGO_URI") or "").strip().strip("'").strip('"')
RENDER_URL = "https://kumpel.onrender.com"

app = Flask(__name__)
CORS(app)

bot = telebot.TeleBot(TELEGRAM_TOKEN, threaded=False) if TELEGRAM_TOKEN else None

client = None
db = None
users_coll = None
auth_codes_coll = None
transactions_coll = None
market_coll = None
qr_coll = None

if MONGO_URI:
    try:
        client = MongoClient(
            MONGO_URI,
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000,
            socketTimeoutMS=5000,
            retryWrites=True
        )
        db = client['kumpel_bank']
        users_coll = db['users']
        auth_codes_coll = db['auth_codes']
        transactions_coll = db['transactions']
        market_coll = db['market']
        qr_coll = db['qr_codes']
        print("Connected to MongoDB successfully with certifi", flush=True)
    except Exception as e:
        print(f"MongoDB init error: {e}", flush=True)

MSK_TZ = pytz.timezone('Europe/Moscow')

def get_current_msk_time():
    return datetime.now(MSK_TZ)

if bot:
    try:
        bot.remove_webhook()
        webhook_res = bot.set_webhook(url=f"{RENDER_URL}/api/telegram/webhook")
        print(f"Webhook set result: {webhook_res}", flush=True)
    except Exception as e:
        print(f"Webhook setup error: {e}", flush=True)

    @bot.message_handler(commands=['start'])
    def send_auth_code(message):
        try:
            tg_id = message.from_user.id
            username = message.from_user.username or f"user_{tg_id}"
            first_name = html.escape(message.from_user.first_name or "User")
            now = get_current_msk_time()

            code = None
            if auth_codes_coll is not None:
                try:
                    existing = auth_codes_coll.find_one({"tg_id": tg_id})
                    if existing and "created_at" in existing:
                        created_at = existing["created_at"]
                        if isinstance(created_at, datetime):
                            if created_at.tzinfo is None:
                                created_at = MSK_TZ.localize(created_at)
                            if now - created_at < timedelta(hours=24):
                                code = existing.get("code")

                    if not code:
                        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
                        auth_codes_coll.update_one(
                            {"tg_id": tg_id},
                            {"$set": {
                                "code": code,
                                "username": username,
                                "first_name": first_name,
                                "created_at": now
                            }},
                            upsert=True
                        )
                except Exception as dbe:
                    print(f"Database lookup error in bot: {dbe}", flush=True)
                    if not code:
                        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            else:
                code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

            text = (
                f"Welcome to Kumpel, {first_name}!\n\n"
                f"Here is your code to login via Kumpel — <tg-spoiler>{code}</tg-spoiler>\n\n"
                f"This code is valid for 24 hours. Please save it and don’t delete this chat. Have good finances!"
            )
            bot.send_message(message.chat.id, text, parse_mode="HTML")
            print(f"Sent code {code} to {tg_id}", flush=True)
        except Exception as e:
            print(f"Error in send_auth_code: {e}", flush=True)

@app.route('/', methods=['GET'])
def index():
    return jsonify({"status": "ok", "service": "Kumpel Bank API"})

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "time": get_current_msk_time().isoformat()})

@app.route('/api/set_webhook', methods=['GET'])
def trigger_set_webhook():
    if not bot:
        return jsonify({"error": "No bot instance"}), 500
    try:
        bot.remove_webhook()
        res = bot.set_webhook(url=f"{RENDER_URL}/api/telegram/webhook")
        return jsonify({"success": res, "url": f"{RENDER_URL}/api/telegram/webhook"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/telegram/webhook', methods=['POST'])
def webhook():
    if bot:
        try:
            json_data = request.get_json(force=True)
            if json_data:
                update = telebot.types.Update.de_json(json_data)
                if update:
                    bot.process_new_updates([update])
        except Exception as e:
            print(f"Webhook processing error: {e}", flush=True)
    return 'OK', 200

def get_or_create_market_rate():
    if market_coll is None:
        return 1.00
    try:
        if market_coll.count_documents({}) == 0:
            r = 1.00
            for i in range(30, -1, -1):
                d = (get_current_msk_time() - timedelta(days=i)).strftime('%Y-%m-%d')
                r = round(max(0.60, min(1.80, r * (1 + random.uniform(-0.08, 0.10)))), 2)
                market_coll.insert_one({"date": d, "rate": r})

        today_str = get_current_msk_time().strftime('%Y-%m-%d')
        today_record = market_coll.find_one({"date": today_str})
        if not today_record:
            yesterday_str = (get_current_msk_time() - timedelta(days=1)).strftime('%Y-%m-%d')
            prev_record = market_coll.find_one({"date": yesterday_str})
            base_rate = prev_record["rate"] if prev_record else 1.00
            new_rate = round(max(0.60, min(1.80, base_rate * (1 + random.uniform(-0.08, 0.10)))), 2)
            market_coll.insert_one({"date": today_str, "rate": new_rate})
            return new_rate
        return today_record["rate"]
    except Exception as e:
        print(f"Market rate error: {e}", flush=True)
        return 1.00

def process_weekly_payout(user):
    if users_coll is None:
        return user.get("balance", 300)
    try:
        now = get_current_msk_time()
        last_monday = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
        last_payout = user.get("last_weekly_payout")
        
        if not last_payout or last_payout < last_monday:
            new_bal = min(2000, user.get("balance", 0) + 150)
            users_coll.update_one({"_id": user["_id"]}, {"$set": {"balance": new_bal, "last_weekly_payout": now}})
            return new_bal
    except Exception as e:
        print(f"Weekly payout error: {e}", flush=True)
    return user.get("balance", 0)

@app.route('/api/auth/verify', methods=['POST'])
def verify_code():
    if auth_codes_coll is None or users_coll is None:
        return jsonify({"success": False, "error": "База данных недоступна. Проверьте переменную MONGO_URI на Render."}), 500
    
    data = request.json or {}
    code = (data.get('code') or '').strip().upper()
    print(f"Verifying code: '{code}'", flush=True)
    
    if not code:
        return jsonify({"success": False, "error": "Введите код"}), 400

    now = get_current_msk_time()
    try:
        record = auth_codes_coll.find_one({"code": code})
        if not record:
            return jsonify({"success": False, "error": "Неверный или устаревший код"}), 400

        created_at = record.get("created_at")
        if isinstance(created_at, datetime):
            if created_at.tzinfo is None:
                created_at = MSK_TZ.localize(created_at)
            if now - created_at > timedelta(hours=24):
                return jsonify({"success": False, "error": "Срок действия кода (24 часа) истек. Запросите новый в боте."}), 400
            
        tg_id = record["tg_id"]
        user = users_coll.find_one({"tg_id": tg_id})
        
        if not user:
            users_coll.insert_one({
                "tg_id": tg_id,
                "username": record.get("username", f"user_{tg_id}"),
                "name": record.get("first_name", "User"),
                "avatar": None,
                "balance": 300,
                "last_weekly_payout": now
            })
            return jsonify({
                "success": True,
                "token": str(tg_id),
                "is_new": True,
                "initial_name": record.get("first_name", "User"),
                "initial_username": record.get("username", f"user_{tg_id}")
            })
            
        return jsonify({
            "success": True,
            "token": str(tg_id),
            "is_new": False,
            "initial_name": user.get("name", "User"),
            "initial_username": user.get("username", f"user_{tg_id}")
        })
    except Exception as e:
        print(f"Auth verify DB exception: {e}", flush=True)
        return jsonify({"success": False, "error": f"Ошибка базы данных: {str(e)}"}), 500

@app.route('/api/user/setup', methods=['POST'])
def setup_profile():
    if users_coll is None:
        return jsonify({"success": False}), 500
    data = request.json or {}
    try:
        users_coll.update_one(
            {"tg_id": int(data['token'])},
            {"$set": {
                "name": data.get('name'),
                "username": (data.get('username') or '').replace('@', '').strip().lower(),
                "avatar": data.get('avatar')
            }}
        )
        return jsonify({"success": True})
    except Exception as e:
        print(f"Setup error: {e}", flush=True)
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/user/sync', methods=['GET'])
def sync_user():
    try:
        if users_coll is None:
            return jsonify({"error": "DB offline"}), 500
        token = request.args.get('token')
        if not token:
            return jsonify({"error": "No token"}), 400
            
        user = users_coll.find_one({"tg_id": int(token)})
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        balance = process_weekly_payout(user)
        current_rate = get_or_create_market_rate()
        
        raw_txs = list(transactions_coll.find({
            "$or": [{"sender_tg": int(token)}, {"receiver_tg": int(token)}]
        }).sort("timestamp", -1)) if transactions_coll is not None else []
        
        txs = []
        for tx in raw_txs:
            is_pos = (tx.get("receiver_tg") == int(token))
            sender_n = tx.get("sender_name") or "Пользователь"
            recv_n = tx.get("receiver_name") or "Пользователь"
            amt = tx.get("amount", 0)
            ts = tx.get("timestamp")
            
            txs.append({
                "id": str(tx.get("_id")),
                "name": sender_n if is_pos else recv_n,
                "type": "Входящий перевод" if is_pos else "Перевод",
                "amount": f"{'+' if is_pos else '-'}{amt} ₭",
                "isPositive": is_pos,
                "date": ts.strftime('%d.%m, %H:%M') if isinstance(ts, datetime) else "Недавно"
            })
            
        market_history = list(market_coll.find().sort("date", 1)) if market_coll is not None else []
        return jsonify({
            "profile": {
                "name": user.get("name") or "Пользователь",
                "username": user.get("username") or "username",
                "avatar": user.get("avatar")
            },
            "balance": balance,
            "rate": current_rate,
            "transactions": txs,
            "market_history": [{"date": str(m.get("date", ""))[-5:], "rate": float(m.get("rate", 1.0))} for m in market_history[-30:]]
        })
    except Exception as e:
        print(f"Error in sync_user: {e}", flush=True)
        return jsonify({"error": str(e)}), 500

@app.route('/api/transfer', methods=['POST'])
def transfer():
    if users_coll is None or transactions_coll is None:
        return jsonify({"success": False, "error": "DB offline"}), 500
        
    data = request.json or {}
    amount = int(data.get('amount', 0))
    sender = users_coll.find_one({"tg_id": int(data['token'])})
    recipient_tag = (data.get('recipient') or '').replace('@', '').strip().lower()
    recipient = users_coll.find_one({"username": {"$regex": f"^{recipient_tag}$", "$options": "i"}})
    
    if not recipient:
        return jsonify({"success": False, "error": "Пользователь не найден"}), 404
    if recipient["tg_id"] == sender["tg_id"]:
        return jsonify({"success": False, "error": "Нельзя перевести себе"}), 400
        
    comm = 0 if amount <= 75 else math.ceil(amount * 0.05)
    total = amount + comm
    if sender.get("balance", 0) < total:
        return jsonify({"success": False, "error": f"Нужно {total} ₭ (комиссия {comm} ₭)"}), 400
        
    users_coll.update_one({"_id": sender["_id"]}, {"$set": {"balance": sender["balance"] - total}})
    users_coll.update_one({"_id": recipient["_id"]}, {"$set": {"balance": min(2000, recipient.get("balance", 0) + amount)}})
    
    transactions_coll.insert_one({
        "sender_tg": sender["tg_id"],
        "sender_name": sender.get("name", "Аноним"),
        "receiver_tg": recipient["tg_id"],
        "receiver_name": recipient.get("name", recipient_tag),
        "amount": amount,
        "timestamp": get_current_msk_time()
    })
    
    if bot:
        try:
            bot.send_message(
                recipient["tg_id"],
                f"🎉 <b>Вам переведено {amount} ₭</b> от @{sender.get('username', 'пользователя')}!",
                parse_mode="HTML"
            )
        except Exception as be:
            print(f"Bot notify error: {be}", flush=True)
            
    return jsonify({"success": True})

@app.route('/api/qr/create', methods=['POST'])
def create_qr():
    if qr_coll is None:
        return jsonify({"success": False}), 500
    data = request.json or {}
    token = ''.join(random.choices(string.ascii_letters + string.digits, k=12))
    qr_coll.insert_one({
        "token": token,
        "creator_tg": int(data['token']),
        "amount": int(data.get('amount', 0)),
        "claimed": False,
        "created_at": get_current_msk_time()
    })
    return jsonify({"success": True, "qr_token": token})

@app.route('/api/qr/info', methods=['GET'])
def qr_info():
    if qr_coll is None or users_coll is None:
        return jsonify({"success": False}), 500
    qr = qr_coll.find_one({"token": request.args.get('token'), "claimed": False})
    if not qr:
        return jsonify({"success": False})
    creator = users_coll.find_one({"tg_id": qr["creator_tg"]})
    return jsonify({
        "success": True,
        "amount": qr["amount"],
        "name": creator.get("name", "Пользователь"),
        "username": creator.get("username", "username")
    })

@app.route('/api/qr/pay', methods=['POST'])
def pay_qr():
    if qr_coll is None or users_coll is None or transactions_coll is None:
        return jsonify({"success": False, "error": "DB offline"}), 500
    data = request.json or {}
    qr = qr_coll.find_one({"token": data.get('qr_token'), "claimed": False})
    if not qr:
        return jsonify({"success": False, "error": "Счет уже оплачен или не существует"}), 400
        
    sender = users_coll.find_one({"tg_id": int(data['token'])})
    amount = qr["amount"]
    
    if sender.get("balance", 0) < amount:
        return jsonify({"success": False, "error": "Недостаточно средств"}), 400
    if sender["tg_id"] == qr["creator_tg"]:
        return jsonify({"success": False, "error": "Нельзя оплатить свой счет"}), 400
        
    recipient = users_coll.find_one({"tg_id": qr["creator_tg"]})
    
    users_coll.update_one({"_id": sender["_id"]}, {"$set": {"balance": sender["balance"] - amount}})
    users_coll.update_one({"_id": recipient["_id"]}, {"$set": {"balance": min(2000, recipient.get("balance", 0) + amount)}})
    qr_coll.update_one({"_id": qr["_id"]}, {"$set": {"claimed": True}})
    
    transactions_coll.insert_one({
        "sender_tg": sender["tg_id"],
        "sender_name": sender.get("name", "Аноним"),
        "receiver_tg": recipient["tg_id"],
        "receiver_name": recipient.get("name", recipient.get("username", "Пользователь")),
        "amount": amount,
        "timestamp": get_current_msk_time()
    })
    
    if bot:
        try:
            bot.send_message(
                recipient["tg_id"],
                f"🎉 <b>Счет на {amount} ₭ оплачен</b> пользователем @{sender.get('username', 'пользователем')}!",
                parse_mode="HTML"
            )
        except Exception as be:
            print(f"Bot notify error: {be}", flush=True)
            
    return jsonify({"success": True})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get("PORT", 5000)))
