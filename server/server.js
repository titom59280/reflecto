const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Routes
app.use('/api/members', require('./routes/memberRoutes'));
app.use('/api/teams', require('./routes/teamRoutes'));
app.use('/api/sprints', require('./routes/sprintRoutes'));
app.use('/api/retros', require('./routes/retroRoutes'));
app.use('/api/postits', require('./routes/postitRoutes'));
app.use('/api/sprint-retro-team', require('./routes/linkRoutes'));
app.use('/api', require('./routes/authRoutes'));
app.use('/api/companies', require('./routes/companyRoutes'));


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../dist/index.html"));
  });
}
app.listen(port, () => {
  console.log(`✅ Server is running at http://localhost:${port}`);
});
