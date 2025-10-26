// jest.config.js
module.exports = {
    transform: {
      '^.+\\.vue$': 'vue-jest',  // Transforme les fichiers .vue pour Jest
      '^.+\\.js$': 'babel-jest'  // Transforme les fichiers JS pour Jest
    },
    moduleFileExtensions: [
      'js',
      'json',
      'vue'
    ],
    testMatch: [
      '**/tests/**/*.spec.js',  // Indique où Jest chercher les tests
      '**/src/**/*.test.js'
    ],
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/src/$1',  // Ajout de la configuration pour résoudre l'alias "@"
    },
    transformIgnorePatterns: [
      '/node_modules/(?!axios)/',  // Permettre la transformation d'axios
    ],
  };
  