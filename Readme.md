

!
# **Problem**

Managing personal finances is harder than it should be. Most people stop tracking their expenses because:

• Manual expense entry is slow and boring -- Typing and categorizing every transaction takes too much effort.

• Bank SMS/emails are messy and inconsistent -- Amounts, merchants, and descriptions come in different formats, making it difficult to extract insights.

• Existing finance apps aren’t intelligent -- They rely on manual data entry, lack NLP, and offer no voice input — making tracking feel like extra work.

• Users don’t get real insights into their money -- Without automated analysis, people can’t see where their money goes or how to improve their habits.

• Many apps feel overly complicated -- Too many steps, too many charts — not enough simplicity.



# **Solution**

Velar makes personal finance management effortless by combining automation, intelligence, and simplicity:

• Voice-powered expense tracking -- Users can speak their transactions, and Velar converts them into structured entries instantly.

• NLP-based auto-categorization -- Velar extracts amounts, merchants, and categories from voice input, emails, or typed text — reducing manual work.

• Smart insights and analytics -- Clean dashboards show spending patterns, category breakdowns, monthly summaries, and savings trends.

• Seamless cross-device sync -- All data is synced securely across devices using a scalable backend.

• Simple, modern, and intuitive UI -- Designed to minimize friction — fewer steps, fewer forms, and a smooth user experience.

• Built for real-life usage -- Handles inconsistent bank messages, learns from user corrections, and adapts over time.


# **Features**


• Real-time data synchronization and notification workflows implemented using RabbitMQ for instant updates across devices.

• Intelligent expense categorization using regex-based transaction parsing and automated bank email data extraction.

• Modular and scalable architecture with well-structured RESTful APIs, enabling future integration of analytics and ML models.

• Interactive dashboards and chart-based visual summaries for clear insights into spending patterns and financial behavior.

• Robust authentication system using OAuth 2.0 for secure and reliable access control.




# **Folder Structure**
```txt
Velar/
│
├── .github/
│   └── workflows/
│       └── deploy.yaml
│
├── .vscode/
│   └── settings.json
│
├── Backend/
│   ├── AI/
│   │   ├── model/
│   │   │   ├── category_model.pkl
│   │   │   └── vectorizer.pkl
│   │   ├── Rules/
│   │   │   ├── __pycache__/
│   │   │   │   └── transaction_rules.cpython-313.pyc
│   │   │   └── transaction_rules.py
│   │   ├── train/
│   │   │   └── training.ipynb
│   │   ├── Dockerfile
│   │   ├── predict_api.py
│   │   └── requirements.txt
│   │
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js
│   │   │   └── rabbitmq.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   └── transactionController.js
│   │   ├── database/
│   │   │   ├── archiveJob.js
│   │   │   └── archiveService.js
│   │   ├── models/
│   │   │   ├── ArchivedTransaction.js
│   │   │   ├── Transaction.js
│   │   │   └── User.js
│   │   ├── queues/
│   │   │   ├── producer.js
│   │   │   └── worker.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── syncRoutes.js
│   │   │   └── transactionRoutes.js
│   │   ├── services/
│   │   │   ├── gmailService.js
│   │   │   └── nlpService.js
│   │   ├── utils/
│   │   │   ├── bankRules.js
│   │   │   └── parser.js
│   │   ├── app.js
│   │   └── server.js
│   │
│   ├── docker-compose.yaml
│   ├── Dockerfile
│   ├── index.js
│   ├── package.json
│   ├── package-lock.json
│   └── predict.js
|── Frontend/
│
├── android/
├── assets/
├── ios/
├── lib/
│   ├── main_pages/
│   │   ├── HomePage/
│   │   │   ├── Backend_Support/
│   │   │   │   ├── fetch_service.dart
│   │   │   │   └── transcations_recent.dart
│   │   │   ├── Components/
│   │   │   │   ├── Email/e_dialog.dart
│   │   │   │   ├── Home/
│   │   │   │   │   ├── greeting.dart
│   │   │   │   │   ├── hero_card.dart
│   │   │   │   │   ├── navbar.dart
│   │   │   │   │   ├── quick_actions.dart
│   │   │   │   │   └── transaction_button.dart
│   │   │   │   ├── Manual/add_expense.dart
│   │   │   │   └── Voice/
│   │   │   │       ├── confirm.dart
│   │   │   │       └── voice_dialog.dart
│   │   │   ├── animated.dart
│   │   │   └── homepage.dart
│   │   ├── Statistics/
│   │   │   ├── Budget/
│   │   │   │   ├── budget_manager.dart
│   │   │   │   └── update_budget.dart
│   │   │   ├── Widgets/
│   │   │   │   ├── category/
│   │   │   │   │   ├── category_chips.dart
│   │   │   │   │   ├── category_colors.dart
│   │   │   │   │   └── category_icons.dart
│   │   │   │   ├── buildTransactionCard.dart
│   │   │   │   ├── category_breakdown.dart
│   │   │   │   ├── category_row.dart
│   │   │   │   ├── Custom_Snackbar.dart
│   │   │   │   └── total_spent_card.dart
│   │   │   └── statistics.dart
│   │   ├── other_pages/
│   │   │   ├── colors.dart
│   │   │   ├── enviroment.dart
│   │   │   └── reponsive.dart
│   │   └── testing_pages/
│   │       ├── emai_screen.dart
│   │       ├── email.dart
│   │       └── speech.dart
│   ├── login.dart
│   └── main.dart
├── linux/
├── macos/
├── screenshots/
├── test/
├── web/
├── windows/
│
├── pubspec.yaml
├── pubspec.lock
├── instructions.md
└── README.md
```



# **Tech Stack**

## **Frontend (Flutter)**

* **Flutter (Dart)** for cross-platform mobile development
* **Material Design & Custom UI Components** for a modern, responsive interface
* **State Management** using Provider / setState (based on your code structure)
* **Speech-to-Text APIs** for voice-based transaction input
* **Charts & Data Visualization Widgets** for financial insights
* **Offline-first architecture** with local caching
* **Platform Integrations**

  * Android (Kotlin bridge)
  * iOS (Swift & Storyboards)
  * Web, macOS, Windows, Linux builds

---

## **Backend (Node.js + Express)**

* **Node.js + Express.js** as the primary backend framework
* **RESTful API Architecture** for clean and scalable communication
* **MongoDB (Mongoose ORM)** for transaction, user, and archive storage
* **RabbitMQ** for background workers, real-time sync, and event-driven workflows
* **JWT Authentication** for secure user access
* **Email Parsing Service** using Gmail API + rule-based extraction
* **NLP Pipeline** (custom ML + rules) for intelligent categorization
* **Modular Microservice-ready Structure** with workers, queues, controllers, services

---

## **AI & NLP**

* Custom ML model trained with **Scikit-learn**
* Vectorization using **TF-IDF**
* Category prediction using **regex rules + ML hybrid approach**
* Model served via **Python FastAPI** (`predict_api.py`)
* Pickled models:

  * `category_model.pkl`
  * `vectorizer.pkl`

---

## **DevOps, Deployment & Tooling**

* **Docker** for containerized services (backend + ML API)
* **Coolify** for deployment & environment management
* **CI/CD Pipeline** using GitHub Actions
* **Docker Compose** for local service orchestration
* **Environment-based config system** (dev + prod ready)

---



## **Frontend Architecture (Flutter)**

The Flutter app acts as the client-side interface for:

* Voice-based expense input
* Manual input
* Insights dashboard
* Email-based transaction fetch
* Real-time updates
* Account management

### **Key components**

* `main_pages/HomePage/` – UI for expense display, quick actions, recent transactions
* `Statistics/` – dashboard, budget manager, category breakdown
* `Voice/` – voice dialog → STT → backend NLP pipeline
* `Backend_Support/` – API integration + transaction fetch
* `other_pages/` – environment settings, responsive helpers
* Offline-first architecture (local caching before sync)

Flutter compiles the same codebase to **Android**, **iOS**, **Web**, **Windows**, **Linux**, and **macOS**.

---

##  **Backend Architecture (Node.js + Express)**

The backend acts as the **core API layer** responsible for:

* User authentication
* Transaction CRUD
* Category management
* Sync system
* Email ingestion
* Delegating NLP jobs to the AI service

### **Backend Structure**

```
Backend/
├── src/
│   ├── config/        → DB + RabbitMQ setup  
│   ├── controllers/   → Request handlers  
│   ├── routes/        → API routes  
│   ├── models/        → Mongoose schemas  
│   ├── services/      → NLP, Gmail, business logic  
│   ├── queues/        → Producers & Workers  
│   ├── database/      → Archival jobs  
│   └── utils/         → Parsers, rule engines  
```

### **Responsibilities**

* REST API for mobile clients
* Fetch bank emails → send to NLP service
* Queue-based background processing
* Manage user accounts
* Build transaction insights
* Maintain archive for old transactions

---

## **AI / NLP Microservice (Python)**

The AI layer encapsulates intelligent features:

### **Components**

```
Backend/AI/
├── model/
│   ├── category_model.pkl
│   └── vectorizer.pkl
├── Rules/transaction_rules.py
├── train/training.ipynb
├── predict_api.py (FastAPI service)
```

### **Pipeline**

1. **Input**: text (voice transcript, email text, or manual entry)
2. **Regex Pre-processing**: extract amount, merchant, date
3. **TF-IDF Vectorization**
4. **ML Model Classification** → predicts category
5. **Rule Engine Override** (if certain patterns match)
6. **Response back to Node.js API**

This approach gives Velar a **hybrid ML + Rules NLP engine**, making it both accurate and predictable.

---

## **Event-Driven Sync System (RabbitMQ)**

RabbitMQ handles asynchronous and real-time processing.

### **Used For**

* Email ingestion
* NLP inference jobs
* Transaction archiving
* Background sync
* Push updates back to client

### **Architecture**

```
Producer → Queue → Worker
```

### **Why RabbitMQ?**

* Decouples heavy workloads from API
* Enables retries and reliability
* Makes sync feel instant for the user

---

##  **Database Architecture (MongoDB)**

MongoDB stores:

### **Collections**

* `User`
* `Transaction`
* `ArchivedTransaction`

### **Advantages**

* Schema flexibility
* Great for JSON-like financial records
* Fast for querying date ranges & categories

Older transactions are moved into **archive collections** by a scheduled worker job.

---

##  **Deployment Architecture**

Velar uses containerized deployment:

### **Technologies**

* **Docker** for backend, AI service, workers
* **Docker Compose** for local orchestration
* **Coolify** for hosting backend microservices
* **GitHub Actions** for CI/CD

### **Pipeline**

1. Push to GitHub
2. CI builds Docker images
3. Coolify deploys containers
4. Service restarts with zero downtime

---

##  **High-Level Architecture Diagram (ASCII)**

```txt
                   ┌───────────────────────────┐
                   │       Flutter App         │
                   │  (Android / iOS / Web)    │
                   └─────────────┬─────────────┘
                                 │ REST API
                                 ▼
                  ┌─────────────────────────────┐
                  │     Node.js Backend API     │
                  │ Auth | Transactions | Sync  │
                  └───────┬─────────────┬───────┘
                          │             │
                NLP Req   │             │  Queue Jobs
                          ▼             ▼
             ┌─────────────────┐   ┌─────────────────┐
             │  Python NLP     │   │   RabbitMQ      │
             │  (FastAPI ML)   │   │Producers/Worker │
             └───────┬─────────┘   └────────┬────────┘
                     │                      │
                     └──────────┬───────────┘
                                ▼
                     ┌──────────────────────┐
                     │      MongoDB         │
                     │ Users | Txn | Archive│
                     └──────────────────────┘
```

---

##  **Key Architectural Advantages**

* **Modular** → AI, backend, queues, frontend all independent
* **Scalable** → Workers can scale horizontally
* **Reliable** → Queue-based job processing prevents failures
* **Smart** → Hybrid ML + rules gives accuracy in categorization
* **Multi-platform** → Single Flutter codebase for multiple devices
* **Secure** → JWT auth, Docker isolation, controlled API access





