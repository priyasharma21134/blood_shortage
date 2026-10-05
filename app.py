from flask import Flask, render_template, request, jsonify, session, redirect
from database import (
    blood_inventory,
    emergency_requests,
    users_collection
)
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps


app = Flask(__name__)

# Session security
app.secret_key = "blood-emergency-network-secret-key"


# =====================================================
# CREATE DEFAULT ADMIN
# =====================================================

def create_default_admin():

    existing_user = users_collection.find_one({
        "username": "admin"
    })

    if not existing_user:

        users_collection.insert_one({
            "username": "admin",
            "password": generate_password_hash("admin123"),
            "role": "Administrator"
        })

        print("Default admin account created")
        print("Username: admin")
        print("Password: admin123")


create_default_admin()


# =====================================================
# LOGIN PROTECTION
# =====================================================

def login_required(function):

    @wraps(function)
    def wrapper(*args, **kwargs):

        if "user" not in session:
            return redirect("/login")

        return function(*args, **kwargs)

    return wrapper


# =====================================================
# LOGIN PAGE
# =====================================================

@app.route("/login")
def login_page():

    if "user" in session:
        return redirect("/")

    return render_template("login.html")


# =====================================================
# LOGIN API
# =====================================================

@app.route("/api/login", methods=["POST"])
def login():

    data = request.get_json()

    username = data.get("username", "").strip()
    password = data.get("password", "")

    user = users_collection.find_one({
        "username": username
    })

    if not user:

        return jsonify({
            "success": False,
            "message": "Invalid username or password"
        }), 401

    if not check_password_hash(user["password"], password):

        return jsonify({
            "success": False,
            "message": "Invalid username or password"
        }), 401

    session["user"] = username
    session["role"] = user.get("role", "Administrator")

    return jsonify({
        "success": True,
        "message": "Login successful"
    })


# =====================================================
# LOGOUT
# =====================================================

@app.route("/logout")
def logout():

    session.clear()

    return redirect("/login")


# =====================================================
# DASHBOARD
# =====================================================

@app.route("/")
@login_required
def home():

    return render_template("index.html")


# =====================================================
# GET INVENTORY
# =====================================================

@app.route("/api/inventory", methods=["GET"])
@login_required
def get_inventory():

    data = list(
        blood_inventory.find(
            {},
            {"_id": 0}
        )
    )

    return jsonify(data)


# =====================================================
# ADD / UPDATE INVENTORY
# =====================================================

@app.route("/api/inventory", methods=["POST"])
@login_required
def add_inventory():

    data = request.get_json()

    hospital = data.get("hospital")
    blood_group = data.get("blood_group")

    available = int(data.get("available", 0))
    capacity = int(data.get("capacity", 0))

    if not hospital or not blood_group:

        return jsonify({
            "success": False,
            "message": "Hospital and Blood Group are required"
        }), 400

    existing = blood_inventory.find_one({
        "hospital": hospital,
        "blood_group": blood_group
    })

    if existing:

        blood_inventory.update_one(
            {
                "hospital": hospital,
                "blood_group": blood_group
            },
            {
                "$set": {
                    "available": available,
                    "capacity": capacity
                }
            }
        )

        message = "Blood inventory updated successfully"

    else:

        blood_inventory.insert_one({
            "hospital": hospital,
            "blood_group": blood_group,
            "available": available,
            "capacity": capacity
        })

        message = "Blood inventory added successfully"

    return jsonify({
        "success": True,
        "message": message
    })


# =====================================================
# DELETE INVENTORY
# =====================================================

@app.route(
    "/api/inventory/<hospital>/<blood_group>",
    methods=["DELETE"]
)
@login_required
def delete_inventory(hospital, blood_group):

    result = blood_inventory.delete_one({
        "hospital": hospital,
        "blood_group": blood_group
    })

    if result.deleted_count == 0:

        return jsonify({
            "success": False,
            "message": "Record not found"
        }), 404

    return jsonify({
        "success": True,
        "message": "Inventory deleted successfully"
    })


# =====================================================
# EMERGENCY REQUEST
# =====================================================

@app.route("/api/emergency", methods=["POST"])
@login_required
def emergency_request():

    data = request.get_json()

    patient = data.get("patient")
    hospital = data.get("hospital")
    blood_group = data.get("blood_group")

    units = int(data.get("units", 0))
    urgency = data.get("urgency")

    if not patient or not hospital or not blood_group:

        return jsonify({
            "success": False,
            "message": "Please fill all required fields"
        }), 400

    emergency_requests.insert_one({

        "patient": patient,
        "hospital": hospital,
        "blood_group": blood_group,
        "units": units,
        "urgency": urgency,
        "status": "Pending"

    })

    return jsonify({
        "success": True,
        "message": "Emergency request submitted successfully"
    })


# =====================================================
# GET EMERGENCY REQUESTS
# =====================================================

@app.route("/api/emergency", methods=["GET"])
@login_required
def get_emergency_requests():

    data = list(
        emergency_requests.find(
            {},
            {"_id": 0}
        )
    )

    return jsonify(data)


# =====================================================
# DASHBOARD STATS
# =====================================================

@app.route("/api/dashboard", methods=["GET"])
@login_required
def dashboard():

    inventory = list(
        blood_inventory.find({})
    )

    total_units = sum(
        int(item.get("available", 0))
        for item in inventory
    )

    hospitals = len(
        set(
            item.get("hospital")
            for item in inventory
        )
    )

    critical = 0

    for item in inventory:

        available = int(
            item.get("available", 0)
        )

        capacity = int(
            item.get("capacity", 0)
        )

        if capacity > 0:

            percentage = (
                available / capacity
            ) * 100

            if percentage <= 20:

                critical += 1

    emergency_count = emergency_requests.count_documents({
        "status": "Pending"
    })

    return jsonify({

        "total_units": total_units,
        "hospitals": hospitals,
        "critical": critical,
        "emergency_requests": emergency_count

    })


# =====================================================
# RUN
# =====================================================

if __name__ == "__main__":

    app.run(
        debug=True
    )