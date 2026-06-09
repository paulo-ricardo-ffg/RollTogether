# 🎲 RollTogether

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Online-222222?logo=githubpages\&logoColor=white)](https://paulo-ricardo-ffg.github.io/RollTogether/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript\&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Three.js](https://img.shields.io/badge/Three.js-r128-000000?logo=threedotjs\&logoColor=white)](https://threejs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Realtime%20Database-FFCA28?logo=firebase\&logoColor=black)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

A virtual tabletop for RPGs and board games featuring immersive 3D dice rolling, real-time multiplayer synchronization, and modern web technologies.

---

# 🌐 Live Demo

https://paulo-ricardo-ffg.github.io/RollTogether/

---

# 📸 Screenshots
<img width="1920" height="966" alt="image" src="https://github.com/user-attachments/assets/fc60e592-ca91-47b4-bdda-2bffa023be3b" />
<img width="1920" height="966" alt="image" src="https://github.com/user-attachments/assets/f3f1fd7a-e755-4a54-ae90-edee7fbd1940" />
<img width="1920" height="1453" alt="image" src="https://github.com/user-attachments/assets/df078060-8352-44ae-aece-a149743740c8" />



---

# ✨ Features

## 🎲 Dice Collection

| Dice | Description              |
| ---- | ------------------------ |
| D4   | Tetrahedron              |
| D6   | Cube                     |
| D8   | Octahedron               |
| D10  | Pentagonal Trapezohedron |
| D12  | Dodecahedron             |
| D20  | Icosahedron              |
| D100 | Percentile Dice          |

## 🌍 Real-Time Multiplayer

* Shared game rooms
* Invitation codes
* Synchronized dice rolls
* Roll history
* Firebase Realtime Database
* Fast room sharing

## 🎨 Modern User Experience

* Animated 3D dice
* Responsive design
* Mobile-friendly interface
* Smooth animations
* Fast loading times
* Clean and intuitive UI

---

# 🛠 Technology Stack

| Technology                 | Purpose                     |
| -------------------------- | --------------------------- |
| HTML5                      | Structure                   |
| CSS3                       | Styling                     |
| JavaScript ES6+            | Application Logic           |
| Three.js                   | 3D Rendering                |
| Dice Box ThreeJS           | Dice Physics & Simulation   |
| Firebase Realtime Database | Multiplayer Synchronization |
| GitHub Pages               | Hosting                     |

---

# 🙏 Open Source References

This project would not be possible without the amazing open-source tools and libraries created by the community.

## Dice Physics Engine

RollTogether uses concepts and assets inspired by:

* https://github.com/3d-dice/dice-box-threejs

Special thanks to the Dice Box ThreeJS contributors for making advanced 3D dice simulation accessible to developers.

## Additional Technologies

* https://threejs.org/
* https://firebase.google.com/
* https://pages.github.com/

---

# 📂 Project Structure

```text
RollTogether/
│
├── assets/
│   └── dice/
│       └── textures/
│
├── libs/
│   └── dice-box-threejs.umd.js
│
├── index.html
├── twopiece.html
│
├── LICENSE
└── README.md
```

---

# 🚀 Running Locally

## Clone the Repository

```bash
git clone https://github.com/paulo-ricardo-ffg/RollTogether.git
```

```bash
cd RollTogether
```

## Start a Local Server

### Python

```bash
python -m http.server 8000
```

### Node.js

```bash
npx live-server
```

Open:

```text
http://localhost:8000
```

---

# 🎮 How to Play

## Single Player

1. Select a dice.
2. Click to roll.
3. View the result.

## Multiplayer

1. Create a room.
2. Share the room code.
3. Invite friends.
4. Watch everyone's rolls synchronize in real time.

---

# 🔥 Highlights

* Dice ranging from D2 to D100
* Immersive 3D physics
* Online multiplayer rooms
* Real-time synchronization
* Mobile and desktop support
* Free deployment via GitHub Pages

---

# 🔧 Firebase Configuration

Example:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

---

# 🤝 Contributing

```bash
git checkout -b feature/my-feature
git commit -m "feat: add new feature"
git push origin feature/my-feature
```

Open a Pull Request and describe your changes.

---

# 📊 Project Status

| Feature              | Status         |
| -------------------- | -------------- |
| D4-D20 Dice          | ✅ Complete     |
| D100 Dice            | ✅ Complete     |
| 3D Physics           | ✅ Complete     |
| Multiplayer          | ✅ Complete     |
| Firebase Integration | ✅ Complete     |
| Roll History         | ✅ Complete |
| Statistics Dashboard         | 📅 Planned |
| Security Implementation      | 📅 Planned |
| File Organization & Structure| 📅 Planned |

---

# 🐛 Bug Reports

Found a bug?

1. Open an issue.
2. Describe the problem.
3. Include your browser version.
4. Add screenshots if possible.

Issues:

https://github.com/paulo-ricardo-ffg/RollTogether/issues

---

# 🎨 Vibe Coding Project

This project was heavily developed using a **Vibe Coding** workflow, combining creativity, rapid prototyping, and AI-assisted development.

The goal was to focus on:

* Fast iteration
* User experience first
* Visual polish
* Experimental ideas
* Continuous refinement
* AI-assisted coding and design

RollTogether is a practical example of how modern developers can leverage AI tools to transform ideas into functional products quickly while maintaining creativity and technical quality.

---

# 📜 License

This project is licensed under the MIT License.

### Permissions

* Commercial Use
* Modification
* Distribution
* Private Use

### Requirement

* Preserve copyright notice and license.

MIT License:

https://opensource.org/licenses/MIT

---

# 👨‍💻 Author

## Paulo Ricardo Silva

### GitHub

https://github.com/paulo-ricardo-ffg

---

# ⭐ Support the Project

If this project helped you:

* ⭐ Star the repository
* 🍴 Fork the project
* 🐛 Report bugs
* 💡 Suggest improvements
* 📢 Share with fellow RPG players

---

# 🎲 RollTogether

### Roll Dice. Create Rooms. Play Together.

Built with JavaScript, Three.js, Firebase, and a healthy amount of Vibe Coding.
