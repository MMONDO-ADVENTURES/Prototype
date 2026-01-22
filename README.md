# MMONDO Web Application

**MMONDO** is a web application designed to showcase and manage tour packages for exploring Uganda, the Pearl of Africa. It allows users to browse tours, view details, and administrators to manage tour listings.

---

## 🛠 Technologies Used

- **Backend:** Python, FastAPI
- **Frontend:** HTML, CSS, JavaScript, Bootstrap, Tailwind
- **Database:** MySQL (SQLite for development/testing)
- **Containerization:** Docker, Docker Compose

---

## 📁 Project Structure

├── app/ # Main application folder
│ ├── templates/ # HTML templates
│ ├── static/ # Static files (CSS, JS, images)
│ ├── main.py # FastAPI application entry point
│ ├── models.py # Database models
│ ├── routes.py # Application routes
│ └── ... # Other Python modules
├── static/ # Public static assets
├── test.db # SQLite database file
├── .gitignore
├── Dockerfile # Docker configuration
├── docker-compose.yaml # Docker Compose config
├── requirements.txt # Python dependencies
├── start.sh # Startup script
├── Tests/ # pytest tests
└── .github/workflows/ # GitHub Actions workflows

yaml
Copy code

---

## 👨‍💻 Developers

- **Backend:** Rhyan Lubega
- **Frontend:** Boaz Onyango
- **Database & Product Manager:** Oscar Kyamuwendo
- **Business Role:** George Mutale

---

## 🌟 Special Features

- Secure payment using bank cards and PayPal
- Terminal system for secure admin creation
- Quick tour booking system
- Tokenized emails for password recovery & support
- Email system for tour updates and receiving receipts
- Newsletter integration
- Live AI-powered chatbot

---

## 🔐 Admin & Super Admin Management

MMONDO uses a role-based access system to manage platform permissions.

### User Roles
- **Customer:** Default role on public registration
- **Admin:** Manages tours, bookings, newsletters, and platform content
- **Super Admin:** Creates and manages admin accounts

### Admin Creation
Admins can only be created by a **Super Admin** via:

POST /register/admin

csharp
Copy code

This endpoint is protected and cannot be accessed by normal users.

### Super Admin Creation
A Super Admin can be created via:

POST /superadmin/create

yaml
Copy code

This route is strictly restricted and intended for:
- Initial system setup
- Terminal-based execution
- Secure environment-based access

> ⚠️ It is recommended to disable this route after the first Super Admin is created.

---

## ⚙️ Setup and Running the Project

### Prerequisites

- Python 3.8+
- pip
- Docker (optional)
- Docker Compose (optional)

---

## 🚀 Running the App

### ✅ Using Uvicorn (Local)

1. **Start the app:**

```bash
python -m venv venv && source venv/bin/activate && pip install -r requirements.txt && python -m uvicorn app.main:app --reload --host localhost
Sample Accounts

For testing purposes, the following sample accounts have been added. Replace the placeholders with your own emails and passwords as needed:

Super Admin:

Email: <superadmin_email>

Password: <superadmin_password>

Admin:

Email: <admin_email>

Password: <admin_password>

Customer:

Email: <customer_email>

Password: <customer_password>

You can use these accounts to log in and explore the application features.

🐳 Using Docker
Docker creates a separate database. You must manually create admin and customer accounts inside the container.

Build and run the services:

bash
Copy code
chmod +x start.sh
./start.sh
Sample Accounts

The same sample accounts are available inside the container.

Stop the services:

bash
Copy code
Ctrl + C
# Or stop the container manually
docker ps
docker stop <container_id>
🤝 Contributing
We welcome contributions!

Steps to Contribute
Fork the repository

Create a new feature branch: git checkout -b feature-name

Commit your changes: git commit -m "Description of changes"

Push to your fork: git push origin feature-name

Open a pull request

Please follow standard coding practices and ensure your code passes tests.

📄 License
Specify the license for the project here. (e.g., MIT, Apache 2.0)

yaml
Copy code

---

✅ This version is **ready for GitHub Markdown**. All headings, code blocks, bullet points, and spacing match your original format.  

If you want, I can also **add a small ASCII-style workflow diagram** like:

Customer → Admin → Super Admin

vbnet
Copy code

inside the Markdown to make it visually clear for GitHub.  

Do you want me to do that?






