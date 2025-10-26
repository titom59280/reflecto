const { readJson, writeJson, addItem, deleteItem } = require('../utils/jsonFileHelper');
const fs = require('fs');
const path = require('path');
const { DATA_DIR } = require('../config');
const crypto = require('crypto');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // temporaire, tu peux déplacer après
const qs = require('qs');
const RETRO_FILE = path.join(DATA_DIR, 'retros.json');
const LINK_FILE = path.join(DATA_DIR, 'sprints-retros-teams.json');
const COMPANY_FILE = path.join(DATA_DIR, 'companies.json');
const MEMBER_FILE = path.join(DATA_DIR, 'members.json');
const { resultRequest } = require('../utils/requestUtils');

exports.getAll = async (req, res) => {
  try{
    if (req.user === undefined || req.user === null) return resultRequest(res, false, 'Methode non accessible', { });
    const allRetros = await readJson(RETRO_FILE);
    const retros = allRetros.filter(r => r.companyId === req.user.companyId);
    resultRequest(res, true, '', retros); 
  }catch(err){
    resultRequest(res, false, 'Erreur lors de la récupération des rétros', { });
  }
};

exports.create = async (req, res) => {
  try{
    if (req.user === undefined || req.user === null) return resultRequest(res, false, 'Methode non accessible', { });
    const body = qs.parse(req.body);
    const retroId = crypto.randomUUID();

    // Création du dossier pour les images
    const sprintAssetsPath = path.join(__dirname, '..', 'public/uploads/retros', retroId);
    if (!fs.existsSync(sprintAssetsPath)) {
      fs.mkdirSync(sprintAssetsPath, { recursive: true });
    }

    if (!body.name || !Array.isArray(body.categories) || body.categories.length < 2) return resultRequest(res, false, 'Nom requis et au moins 2 catégories', { });

    const retros = await readJson(RETRO_FILE);
    const retroName = body.name.trim();

    const nameExists = retros.some(r => r.name.toLowerCase() === retroName.toLowerCase());
    if (nameExists) return resultRequest(res, false, "Une rétro avec ce nom existe déjà.", { });
    
    const companies = await readJson(COMPANY_FILE);
    
    const indexCompany = companies.findIndex(m => m.id === req.user.companyId);
    if (indexCompany === -1) return resultRequest(res, false, 'Compagnie non trouvé', { });
    

    const categories = body.categories.map((cat, index) => {
      const file = req.files?.find(f => f.fieldname === `categories[${index}][image]`);
      let imageName = '';

      if (file) {
        const ext = path.extname(file.originalname);
        imageName = `${Date.now()}_${index}${ext}`;
        const imagePath = path.join(sprintAssetsPath, imageName);
        fs.renameSync(file.path, imagePath);
      }

      return {
        name: cat.name,
        description: cat.description,
        image: imageName
      };
    });

    const newRetro = {
      id: retroId,
      companyId: req.user.companyId,
      name: retroName,
      createdAt: new Date().toISOString(),
      categories
    };

    const result = await addItem(RETRO_FILE, newRetro);
    resultRequest(res, true, '', result); 
  }catch(err){
    resultRequest(res, false, 'Erreur lors de la création de la rétro', { });
  }
};

exports.remove = async (req, res) => {
  try{
    if (req.user === undefined || req.user === null) return resultRequest(res, false, 'Methode non accessible', { });
    const retroId = req.params.id;
    const retros = await readJson(RETRO_FILE);
    const index = retros.findIndex(r => r.id === retroId);

    if (index === -1) return resultRequest(res, false, 'Rétro non trouvée', { });

    const links = await readJson(LINK_FILE);
    const linkExist = links.some(l => l.retroId === req.params.id && !l.isRetroDone && !l.isClosed);
    if (linkExist) return resultRequest(res, false, "Une équipe a déja un sprint en cours avec cete retro.", { });
    // Supprimer les fichiers image associés
    const retroFolderPath = path.join(__dirname, '..', 'public/uploads/retros', retroId);

    if (fs.existsSync(retroFolderPath)) {
      fs.rmSync(retroFolderPath, { recursive: true, force: true });
    }

    await deleteItem(RETRO_FILE, req.params.id);
    resultRequest(res, true, '', { });
  }catch(err){
    resultRequest(res, false, 'Erreur lors de la suppression de la rétro', { });
  }
};
