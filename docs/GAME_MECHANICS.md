# ⚙️ آليات اللعب المتقدمة  
## 🧪 نظام الفيزياء الديناميكي  
```javascript
// physics.js (مختصر)
const calculateObstacleSpeed = (baseSpeed, level) => 
  baseSpeed * Math.pow(1.05, level); // تصاعد أسي مع تقدم الجولة
