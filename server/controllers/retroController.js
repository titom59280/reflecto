const { supabase } = require('../utils/supabase');
const path = require('path');
const crypto = require('crypto');
const qs = require('qs');
const fs = require('fs').promises;
const pool = require('../utils/dbHelper');
const db = require('../utils/db');
const { resultRequest } = require('../utils/requestUtils');

exports.getAll = async (req, res) => {
  try {
    if (req.user === undefined || req.user === null)
      return resultRequest(res, false, 'Methode non accessible', {}, 'METHOD_NOT_ALLOWED');

    const retros = await pool.query(
      `SELECT id, companyid as "companyId", name, createdat as "createdAt", isarchived as "isArchived" FROM retros WHERE companyid = $1`,
      [req.user.companyId]
    );
    resultRequest(res, true, '', retros);
  } catch (err) {
    let message = 'Erreur lors de la récupération des rétros';
    if (process.env.LOG_STATUS == 'all') {
      message = err.message;
    }
    resultRequest(res, false, message, {}, 'RETROS_FETCH_ERROR');
  }
};

exports.getCategories = async (req, res) => {
  try {
    if (req.user === undefined || req.user === null)
      return resultRequest(res, false, 'Methode non accessible', {}, 'METHOD_NOT_ALLOWED');

    // Seules les catégories d'une rétro de la compagnie de l'utilisateur sont renvoyées
    const categories = await pool.query(
      `SELECT c.id, c.name, c.description, c.image FROM retrocategories c
       JOIN retros r ON r.id = c.retroid
       WHERE c.retroid = $1 AND r.companyid = $2`,
      [req.params.id, req.user.companyId]
    );
    resultRequest(res, true, '', categories);
  } catch (err) {
    let message = 'Erreur lors de la récupération des catégories';
    if (process.env.LOG_STATUS == 'all') {
      message = err.message;
    }
    resultRequest(res, false, message, {}, 'CATEGORIES_FETCH_ERROR');
  }
};

exports.create = async (req, res) => {
  const retroId = crypto.randomUUID();
  try {
    if (req.user === undefined || req.user === null)
      return resultRequest(res, false, 'Methode non accessible', {}, 'METHOD_NOT_ALLOWED');
    const body = qs.parse(req.body);
    const sprintAssetsPath = `retros/${retroId}`;
    if (!body.name || !Array.isArray(body.categories) || body.categories.length < 2)
      return resultRequest(
        res,
        false,
        'Nom requis et au moins 2 catégories',
        {},
        'RETRO_NAME_CATEGORIES_REQUIRED'
      );

    const retroName = body.name.trim();
    const retro = await pool.queryOne('SELECT * FROM retros WHERE UPPER(name) = UPPER($1)', [
      retroName,
    ]);

    if (retro)
      return resultRequest(
        res,
        false,
        'Une rétro avec ce nom existe déjà.',
        {},
        'RETRO_NAME_EXISTS'
      );

    const company = await pool.queryOne('SELECT * FROM companies WHERE id = $1', [
      req.user.companyId,
    ]);

    if (!company) return resultRequest(res, false, 'Compagnie non trouvé', {}, 'COMPANY_NOT_FOUND');

    await pool.query(
      'INSERT INTO retros (id, companyid, name, createdat) VALUES ($1, $2, $3, $4)',
      [retroId, req.user.companyId, retroName, new Date().toISOString()]
    );

    const categories = await Promise.all(
      body.categories.map(async (cat, index) => {
        const file = req.files?.find((f) => f.fieldname === `categories[${index}][image]`);
        let imagePath;

        if (file) {
          const fileBuffer = await fs.readFile(file.path);
          const ext = path.extname(file.originalname);
          const imageName = `${Date.now()}_${index}${ext}`;
          const { error } = await supabase.storage
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
          'INSERT INTO retrocategories (id, retroid, name, description, image) VALUES ($1, $2, $3, $4, $5)',
          [crypto.randomUUID(), retroId, cat.name, cat.description, imagePath]
        );
      })
    );

    const newRetro = {
      id: retroId,
      companyId: req.user.companyId,
      name: retroName,
      createdAt: new Date().toISOString(),
      categories,
    };

    resultRequest(res, true, '', newRetro);
  } catch (err) {
    let message = 'Erreur lors de la création de la rétro';
    if (process.env.LOG_STATUS == 'all') {
      message = err.message;
    }
    resultRequest(res, false, message, {}, 'RETRO_CREATE_ERROR');
  }
};

exports.remove = async (req, res) => {
  try {
    if (req.user === undefined || req.user === null)
      return resultRequest(res, false, 'Methode non accessible', {}, 'METHOD_NOT_ALLOWED');
    const retroId = req.params.id;
    // La rétro doit appartenir à la compagnie de l'utilisateur
    const retro = await pool.queryOne('SELECT * FROM retros WHERE id = $1 AND companyid = $2', [
      retroId,
      req.user.companyId,
    ]);
    const sprintAssetsPath = `retros/${retroId}`;
    if (!retro) return resultRequest(res, false, 'Rétro non trouvée', {}, 'RETRO_NOT_FOUND');

    const link = await pool.queryOne(
      'SELECT * FROM sprintsretrosteams WHERE retroid = $1 AND isretrodone= false AND isclosed= false',
      [retroId]
    );
    if (link)
      return resultRequest(
        res,
        false,
        'Une équipe a déja un sprint en cours avec cette retro.',
        {},
        'RETRO_IN_USE'
      );

    // Une rétro déjà utilisée sur un sprint est conservée pour l'historique : on l'archive
    const usedBefore = await pool.queryOne(
      'SELECT id FROM sprintsretrosteams WHERE retroid = $1 LIMIT 1',
      [retroId]
    );
    if (usedBefore)
      return resultRequest(
        res,
        false,
        'Cette rétro a déjà été utilisée : archivez-la plutôt que de la supprimer.',
        {},
        'RETRO_HAS_HISTORY'
      );
    // Nettoyage des images : un échec (Supabase injoignable, « fetch failed »…)
    // ne doit pas bloquer la suppression de la rétro en base
    try {
      const { data: files, error: listError } = await supabase.storage
        .from('uploads')
        .list(sprintAssetsPath, { limit: 1000 });
      if (listError) throw listError;

      if (files && files.length > 0) {
        const filePaths = files.map((f) => `${sprintAssetsPath}/${f.name}`);
        const { error: removeError } = await supabase.storage.from('uploads').remove(filePaths);
        if (removeError) throw removeError;
      }
    } catch (storageError) {
      console.error(
        `[retro.remove] Nettoyage des images Supabase impossible pour ${sprintAssetsPath} :`,
        storageError.message,
        storageError.cause || storageError.originalError || ''
      );
    }
    //supprimer les categories
    await pool.query('DELETE FROM retrocategories where retroid = $1', [retroId]);

    await pool.query('DELETE FROM retros WHERE id = $1', [retroId]);
    resultRequest(res, true, '', {});
  } catch (err) {
    console.error('[retro.remove] erreur', err);
    let message = 'Erreur lors de la suppression de la rétro';
    if (process.env.LOG_STATUS == 'all') {
      message = err.message;
    }
    resultRequest(res, false, message, {}, 'RETRO_DELETE_ERROR');
  }
};

// Chemin Supabase ("retros/<id>/<fichier>") à partir de l'URL publique d'une image
function storagePathFromUrl(url) {
  const marker = '/object/public/uploads/';
  const index = url ? url.indexOf(marker) : -1;
  return index >= 0 ? decodeURIComponent(url.slice(index + marker.length)) : null;
}

async function removeStorageFiles(paths) {
  if (paths.length === 0) return;
  const { error } = await supabase.storage.from('uploads').remove(paths);
  // Un échec de nettoyage ne doit pas faire échouer la requête
  if (error) console.error('Suppression des images Supabase impossible :', error.message);
}

exports.update = async (req, res) => {
  const retroId = req.params.id;
  const uploadedPaths = [];
  let client;
  try {
    if (req.user === undefined || req.user === null)
      return resultRequest(res, false, 'Methode non accessible', {}, 'METHOD_NOT_ALLOWED');

    const retro = await pool.queryOne('SELECT id FROM retros WHERE id = $1 AND companyid = $2', [
      retroId,
      req.user.companyId,
    ]);
    if (!retro) return resultRequest(res, false, 'Rétro non trouvée', {}, 'RETRO_NOT_FOUND');

    const body = qs.parse(req.body, { arrayLimit: 100 });
    const retroName = (body.name || '').trim();
    const categories = (Array.isArray(body.categories) ? body.categories : []).map((cat) => ({
      id: cat.id || null,
      name: (cat.name || '').trim(),
      description: (cat.description || '').trim(),
      removeImage: cat.removeImage === '1',
    }));

    if (!retroName || categories.length < 2 || categories.some((cat) => !cat.name))
      return resultRequest(
        res,
        false,
        'Nom requis et au moins 2 catégories',
        {},
        'RETRO_NAME_CATEGORIES_REQUIRED'
      );

    const names = categories.map((cat) => cat.name.toUpperCase());
    if (new Set(names).size !== names.length)
      return resultRequest(
        res,
        false,
        'Deux catégories ne peuvent pas avoir le même nom',
        {},
        'CATEGORY_NAME_DUPLICATE'
      );

    const sameName = await pool.queryOne(
      'SELECT id FROM retros WHERE UPPER(name) = UPPER($1) AND companyid = $2 AND id <> $3',
      [retroName, req.user.companyId, retroId]
    );
    if (sameName)
      return resultRequest(
        res,
        false,
        'Une rétro avec ce nom existe déjà.',
        {},
        'RETRO_NAME_EXISTS'
      );

    // Les images de catégories sont réservées à l'offre la plus haute (comme dans le formulaire)
    const files = req.files || [];
    if (files.length > 0) {
      const company = await pool.queryOne('SELECT subscriptionlevel FROM companies WHERE id = $1', [
        req.user.companyId,
      ]);
      if (String(company?.subscriptionlevel) !== '2')
        return resultRequest(
          res,
          false,
          'Les images ne sont pas incluses dans votre offre',
          {},
          'IMAGES_NOT_IN_PLAN'
        );
    }

    const existing = await pool.query(
      'SELECT id, name, description, image FROM retrocategories WHERE retroid = $1',
      [retroId]
    );
    const existingById = new Map(existing.map((cat) => [cat.id, cat]));
    const keptIds = new Set(
      categories.filter((cat) => existingById.has(cat.id)).map((cat) => cat.id)
    );
    const deleted = existing.filter((cat) => !keptIds.has(cat.id));

    // Les post-its sont rattachés à une catégorie par son nom :
    // on refuse de supprimer une catégorie qui en contient (sauf si une catégorie garde ce nom)
    for (const cat of deleted) {
      if (names.includes(cat.name.toUpperCase())) continue;
      const used = await pool.queryOne(
        `SELECT COUNT(*)::int AS count FROM postits p
         JOIN sprintsretrosteams s ON s.id = p.sprintretroteamlinkid
         WHERE s.retroid = $1 AND p.categoryname = $2`,
        [retroId, cat.name]
      );
      if (used.count > 0)
        return resultRequest(
          res,
          false,
          `La catégorie « ${cat.name} » contient des post-its et ne peut pas être supprimée`,
          { category: cat.name },
          'CATEGORY_HAS_POSTITS'
        );
    }

    // Envoi des nouvelles images avant d'écrire en base
    const newImageByIndex = new Map();
    for (const [index] of categories.entries()) {
      const file = files.find((f) => f.fieldname === `categories[${index}][image]`);
      if (!file) continue;
      const fileBuffer = await fs.readFile(file.path);
      const ext = path.extname(file.originalname);
      const storagePath = `retros/${retroId}/${Date.now()}_${index}${ext}`;
      const { error } = await supabase.storage
        .from('uploads')
        .upload(storagePath, fileBuffer, { contentType: file.mimetype, upsert: true });
      if (error) throw new Error('Erreur upload Supabase: ' + error.message);
      uploadedPaths.push(storagePath);
      const { data } = supabase.storage.from('uploads').getPublicUrl(storagePath);
      newImageByIndex.set(index, data.publicUrl);
    }

    const obsoleteImages = [];
    const renames = [];
    client = await db.connect();
    await client.query('BEGIN');
    await client.query('UPDATE retros SET name = $1 WHERE id = $2', [retroName, retroId]);

    for (const [index, cat] of categories.entries()) {
      const previous = existingById.get(cat.id);
      let image = previous ? previous.image : null;
      if (newImageByIndex.has(index)) image = newImageByIndex.get(index);
      else if (cat.removeImage) image = null;

      if (previous) {
        if (previous.image && previous.image !== image) obsoleteImages.push(previous.image);
        if (previous.name !== cat.name) renames.push([previous.name, cat.name]);
        await client.query(
          'UPDATE retrocategories SET name = $1, description = $2, image = $3 WHERE id = $4 AND retroid = $5',
          [cat.name, cat.description, image, cat.id, retroId]
        );
      } else {
        await client.query(
          'INSERT INTO retrocategories (id, retroid, name, description, image) VALUES ($1, $2, $3, $4, $5)',
          [crypto.randomUUID(), retroId, cat.name, cat.description, image]
        );
      }
    }

    // Renommage des post-its en une seule requête (gère aussi l'échange de deux noms)
    if (renames.length > 0) {
      const values = renames.map((_, i) => `($${i * 2 + 2}, $${i * 2 + 3})`).join(', ');
      await client.query(
        `UPDATE postits p SET categoryname = m.newname
         FROM (VALUES ${values}) AS m(oldname, newname), sprintsretrosteams s
         WHERE s.id = p.sprintretroteamlinkid AND s.retroid = $1 AND p.categoryname = m.oldname`,
        [retroId, ...renames.flat()]
      );
    }

    for (const cat of deleted) {
      if (cat.image) obsoleteImages.push(cat.image);
      await client.query('DELETE FROM retrocategories WHERE id = $1 AND retroid = $2', [
        cat.id,
        retroId,
      ]);
    }

    await client.query('COMMIT');

    await removeStorageFiles(obsoleteImages.map(storagePathFromUrl).filter(Boolean));

    const updatedCategories = await pool.query(
      'SELECT id, name, description, image FROM retrocategories WHERE retroid = $1',
      [retroId]
    );
    resultRequest(res, true, '', { id: retroId, name: retroName, categories: updatedCategories });
  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    // Les images envoyées pour une modification annulée ne servent plus
    await removeStorageFiles(uploadedPaths).catch(() => {});
    let message = 'Erreur lors de la modification de la rétro';
    if (process.env.LOG_STATUS == 'all') {
      message = err.message;
    }
    resultRequest(res, false, message, {}, 'RETRO_UPDATE_ERROR');
  } finally {
    if (client) client.release();
    // Fichiers temporaires de multer
    await Promise.all((req.files || []).map((f) => fs.unlink(f.path).catch(() => {})));
  }
};

// Archivage logique : la rétro n'est plus proposée mais reste dans l'historique
exports.setArchived = async (req, res) => {
  try {
    if (req.user === undefined || req.user === null)
      return resultRequest(res, false, 'Methode non accessible', {}, 'METHOD_NOT_ALLOWED');
    const retroId = req.params.id;
    const archived = req.body.archived === true;

    const retro = await pool.queryOne('SELECT id FROM retros WHERE id = $1 AND companyid = $2', [
      retroId,
      req.user.companyId,
    ]);
    if (!retro) return resultRequest(res, false, 'Rétro non trouvée', {}, 'RETRO_NOT_FOUND');

    if (archived) {
      const link = await pool.queryOne(
        'SELECT id FROM sprintsretrosteams WHERE retroid = $1 AND isretrodone= false AND isclosed= false',
        [retroId]
      );
      if (link)
        return resultRequest(
          res,
          false,
          'Une équipe a déja un sprint en cours avec cette retro.',
          {},
          'RETRO_IN_USE'
        );
    }

    await pool.query('UPDATE retros SET isarchived = $1 WHERE id = $2', [archived, retroId]);
    resultRequest(res, true, '', { id: retroId, isArchived: archived });
  } catch (err) {
    console.error('[retro.setArchived] erreur', err);
    let message = "Erreur lors de l'archivage de la rétro";
    if (process.env.LOG_STATUS == 'all') {
      message = err.message;
    }
    resultRequest(res, false, message, {}, 'RETRO_ARCHIVE_ERROR');
  }
};
