require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

// Middlewares pour renforcer la sécurité de l'application
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");

const userRoutes = require("./routes/User");
const sauceRoutes = require("./routes/sauce");

mongoose
  .connect(
    `mongodb+srv://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_CLUSTER}/?retryWrites=true&w=majority`,
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => console.log("Connexion à MongoDB réussie !"))
  .catch(() => console.log("Connexion à MongoDB échouée !"));

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  next();
});

// Configure divers en-têtes HTTP pour améliorer la sécurité. Aide à protéger contre les attaques courantes telles que l'injection de scripts intersites (XSS), le reniflement des en-têtes HTTP et d'autres vulnérabilités.
app.use(helmet());

// Créez un middleware rateLimit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Nombre maximal de requêtes par IP pendant la période définie
  message:
    "Trop de requêtes depuis cette adresse IP, veuillez réessayer plus tard.",
});
app.use(limiter);

// By default, $ and . characters are removed completely from user-supplied input in the following places:
// - req.body
// - req.params
// - req.headers
// - req.query
app.use(mongoSanitize());

app.use("/images", express.static(path.join(__dirname, "images")));
app.use("/api/auth", userRoutes);
app.use("/api/sauces", sauceRoutes);

module.exports = app;
