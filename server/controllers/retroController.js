const { supabase } = require('../utils/supabase');
const path = require('path');
const crypto = require('crypto');
const qs = require('qs');
const fs = require('fs').promises;
const pool = require('../utils/dbHelper');
const { resultRequest } = require('../utils/requestUtils');

exports.getAll = async (req, res) => {
  try{
    if (req.user === undefined || req.user === null) return resultRequest(res, false, 'Methode non accessible', { });
    
    const retros = await pool.query(
      `SELECT id, companyid as "companyId", name, createdat as "createdAt" FROM retros WHERE companyid = $1`,
      [req.user.companyId]
    )
    resultRequest(res, true, '', retros); 
  }catch(err){
    let message = "Erreur lors de la récupération des rétros";
    if (process.env.LOG_STATUS == "all"){
      message = err.message;
    }
    resultRequest(res, false, message, { });
  }
};

exports.getCategories = async(req, res) =>{
  try{
    if (req.user === undefined || req.user === null) return resultRequest(res, false, 'Methode non accessible', { });
    
    const categories = await pool.query(
      `SELECT id, name, description, image FROM retrocategories WHERE retroid = $1`,
      [req.params.id]
    )
    resultRequest(res, true, '', categories); 
  }catch(err){
    let message = "Erreur lors de la récupération des catégories";
    if (process.env.LOG_STATUS == "all"){
      message = err.message;
    }
    resultRequest(res, false, message, { });
  }
};

exports.create = async (req, res) => {
  const retroId = crypto.randomUUID();
  try{
    if (req.user === undefined || req.user === null) return resultRequest(res, false, 'Methode non accessible', { });
    const body = qs.parse(req.body);
    const sprintAssetsPath = `retros/${retroId}`;
    if (!body.name || !Array.isArray(body.categories) || body.categories.length < 2) return resultRequest(res, false, 'Nom requis et au moins 2 catégories', { });

    const retroName = body.name.trim();
    const retro = await pool.queryOne(
      "SELECT * FROM retros WHERE UPPER(name) = UPPER($1)",
      [retroName]
    );

    if (retro) return resultRequest(res, false, "Une rétro avec ce nom existe déjà.", { });
    
    const company = await pool.queryOne(
      "SELECT * FROM companies WHERE id = $1",
      [req.user.companyId]
    );

    if (!company) return resultRequest(res, false, 'Compagnie non trouvé', { });
    
    await pool.query(
      "INSERT INTO retros (id, companyid, name, createdat) VALUES ($1, $2, $3, $4)",
      [retroId, req.user.companyId, retroName, new Date().toISOString()]
    );


    const categories = await Promise.all(body.categories.map(async (cat, index) => {
      const file = req.files?.find(f => f.fieldname === `categories[${index}][image]`);
      let imagePath;

      if (file) {
        const fileBuffer = await fs.readFile(file.path);
        const ext = path.extname(file.originalname);
        const imageName = `${Date.now()}_${index}${ext}`
        const {data, error} = await supabase.storage
          .from('uploads')
          .upload(`${sprintAssetsPath}/${imageName}`, fileBuffer, {
            contentType: file.mimetype,
            upsert: true, // remplace si existe déjà
        });
        
        if (error) throw new Error('Erreur upload Supabase: ' + error.message);

        const { data: publicUrlData } = supabase.storage
          .from('uploads')
          .getPublicUrl(`${sprintAssetsPath}/${imageName}`);
        
        imagePath = publicUrlData.publicUrl;
      }
      await pool.query(
        "INSERT INTO retrocategories (id, retroid, name, description, image) VALUES ($1, $2, $3, $4, $5)",
        [crypto.randomUUID(), retroId, cat.name, cat.description, imagePath]
      );
    }));

    const newRetro = {
      id: retroId,
      companyId: req.user.companyId,
      name: retroName,
      createdAt: new Date().toISOString(),
      categories
    };
    
    resultRequest(res, true, '', newRetro); 
  }catch(err){
    let message = "Erreur lors de la création de la rétro";
    if (process.env.LOG_STATUS == "all"){
      message = err.message;
    }
    resultRequest(res, false, message, { });
  }
};


exports.remove = async (req, res) => {
  try{
    if (req.user === undefined || req.user === null) return resultRequest(res, false, 'Methode non accessible', { });
    const retroId = req.params.id;
    const retro = await pool.queryOne(
      "SELECT * FROM retros where id = $1",
      [retroId]
    );
    const sprintAssetsPath = `retros/${retroId}`;
    if (!retro) return resultRequest(res, false, 'Rétro non trouvée', { });

    const link = await pool.queryOne(
      "SELECT * FROM sprintsretrosteams WHERE retroid = $1 AND isretrodone= false AND isclosed= false",
      [retroId]
    );
    if (link) return resultRequest(res, false, "Une équipe a déja un sprint en cours avec cette retro.", { });

    //supprimer les images s'il y a 
    const categories = await pool.query(
      "SELECT * FROM retrocategories where retroid = $1",
      [retroId]
    );
    let images = [];
    if (categories && categories.length > 0) {
       categories.forEach(c => {
        if (c.image && c.image != "") {
          images.push(`${sprintAssetsPath}/${c.image}`);
        }
       });
    }

    if(images.length > 0) {
      const { data, error } = await supabase.storage
        .from('uploads')
        .remove(images);
    }

    //supprimer les categories
    await pool.query(
      "DELETE FROM retrocategories where retroid = $1",
      [retroId]
    );

    await pool.query(
      "DELETE FROM retros WHERE id = $1",
      [retroId]
    );
    resultRequest(res, true, '', { });
  }catch(err){
    let message = "Erreur lors de la suppression de la rétro";
    if (process.env.LOG_STATUS == "all"){
      message = err.message;
    }
    resultRequest(res, false, message, { });
  }
};
