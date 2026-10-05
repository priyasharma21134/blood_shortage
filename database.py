from pymongo import MongoClient

client = MongoClient("mongodb://127.0.0.1:27017/")

db = client["blood_emergency_network"]

blood_inventory = db["blood_inventory"]
emergency_requests = db["emergency_requests"]
users_collection = db["users"]

print("MongoDB Connected Successfully!")
print("Database:", db.name)