const pool = require('../utils/dbHelper');
const crypto = require('crypto');
const { resultRequest } = require('../utils/requestUtils');

const POSTIT_COLUMNS = `id, message, categoryname as "categoryName", sprintretroteamlinkid as "sprintRetroTeamLinkId", trigramme, color, memberid as "memberId", annotation, isanonymous as "isAnonymous"`;

// Couleur commune des post-its anonymes : la couleur propre à chaque membre trahirait l'auteur
const ANONYMOUS_COLOR = '#e4e1d8';

// Ce qu'un utilisateur reçoit d'un post-it : l'auteur d'un post-it anonyme n'est jamais
// transmis à quelqu'un d'autre que l'auteur lui-même (ni à l'équipe, ni au Scrum Master)
function forViewer(postit, userId) {
  const isMine = postit.memberId === userId;
  if (!postit.isAnonymous || isMine) return { ...postit, isMine };
  return { ...postit, isMine, memberId: null, trigramme: '', color: ANONYMOUS_COLOR };
}

// Rétro accessible à l'utilisateur : même compagnie, et sa propre équipe (sauf Scrum Master).
// L'équipe est relue en base (le jeton peut être antérieur à un changement d'équipe).
async function getAccessibleLink(req, linkId) {
  if (!req.user || !linkId) return null;
  const link = await pool.queryOne(
    'SELECT id, teamid, isretroinprogress, isretrodone, isclosed FROM sprintsretrosteams WHERE id = $1 AND companyid = $2',
    [linkId, req.user.companyId]
  );
  if (!link) return null;
  if (req.user.isScrumMaster) return link;
  const member = await pool.queryOne('SELECT teamid FROM members WHERE id = $1', [req.user.id]);
  return member && member.teamid === link.teamid ? link : null;
}

// Phase de collecte : la rétro n'est ni lancée ni terminée
const isCollecting = (link) => !link.isretroinprogress && !link.isretrodone && !link.isclosed;

const forbidden = (res) =>
  resultRequest(res, false, 'Action non autorisée sur ce post-it', {}, 'POSTIT_FORBIDDEN');

const notFound = (res) => resultRequest(res, false, 'Lien non trouvé', {}, 'LINK_NOT_FOUND');

exports.getMine = async (req, res) => {
  try {
    const link = await getAccessibleLink(req, req.params.linkId);
    if (!link) return notFound(res);

    const postits = await pool.query(
      `SELECT ${POSTIT_COLUMNS} FROM postits WHERE sprintretroteamlinkid = $1 AND memberid = $2`,
      [link.id, req.user.id]
    );
    resultRequest(
      res,
      true,
      '',
      postits.map((postit) => forViewer(postit, req.user.id))
    );
  } catch (err) {
    console.error('[postit.getMine] erreur', err);
    let message = 'Erreur lors de la récupération de vos post-its';
    if (process.env.LOG_STATUS == 'all') {
      message = err.message;
    }
    resultRequest(res, false, message, {}, 'POSTITS_FETCH_ERROR');
  }
};

// Tous les post-its d'une rétro : Scrum Master, ou tout le monde une fois la rétro lancée.
// Pendant la collecte, un membre ne voit jamais les post-its des autres.
exports.getAllByLink = async (req, res) => {
  try {
    const link = await getAccessibleLink(req, req.params.linkId);
    if (!link) return notFound(res);
    if (!req.user.isScrumMaster && isCollecting(link)) return forbidden(res);

    const postits = await pool.query(
      `SELECT ${POSTIT_COLUMNS} FROM postits WHERE sprintretroteamlinkid = $1`,
      [link.id]
    );
    resultRequest(
      res,
      true,
      '',
      postits.map((postit) => forViewer(postit, req.user.id))
    );
  } catch (err) {
    console.error('[postit.getAllByLink] erreur', err);
    let message = 'Erreur lors de la récupération des post-its du sprint en cours';
    if (process.env.LOG_STATUS == 'all') {
      message = err.message;
    }
    resultRequest(res, false, message, {}, 'SPRINT_POSTITS_FETCH_ERROR');
  }
};

// Participation pendant la collecte (Scrum Master uniquement) : des chiffres, jamais de contenu
exports.getStats = async (req, res) => {
  try {
    if (!req.user?.isScrumMaster) return forbidden(res);
    const link = await getAccessibleLink(req, req.params.linkId);
    if (!link) return notFound(res);

    const byCategory = await pool.query(
      'SELECT categoryname AS "categoryName", COUNT(*)::int AS count FROM postits WHERE sprintretroteamlinkid = $1 GROUP BY categoryname',
      [link.id]
    );
    const totals = await pool.queryOne(
      `SELECT COUNT(*)::int AS total, COUNT(DISTINCT memberid)::int AS participants,
        (SELECT COUNT(*)::int FROM members WHERE teamid = $2) AS "teamMembers"
       FROM postits WHERE sprintretroteamlinkid = $1`,
      [link.id, link.teamid]
    );
    resultRequest(res, true, '', { ...totals, byCategory });
  } catch (err) {
    console.error('[postit.getStats] erreur', err);
    let message = 'Erreur lors de la récupération de la participation';
    if (process.env.LOG_STATUS == 'all') {
      message = err.message;
    }
    resultRequest(res, false, message, {}, 'POSTITS_FETCH_ERROR');
  }
};

exports.create = async (req, res) => {
  try {
    const { message, categoryName, sprintRetroTeamLinkId } = req.body;
    const isAnonymous = req.body.isAnonymous === true;

    if (!message || !categoryName || !sprintRetroTeamLinkId)
      return resultRequest(res, false, 'Champs requis manquants', {}, 'FIELDS_REQUIRED');

    const link = await getAccessibleLink(req, sprintRetroTeamLinkId);
    if (!link) return notFound(res);
    // Plus d'ajout une fois la rétro lancée
    if (!isCollecting(link))
      return resultRequest(
        res,
        false,
        'La rétro a commencé : plus aucun post-it ne peut être ajouté',
        {},
        'POSTIT_LOCKED'
      );

    const member = await pool.queryOne('SELECT * FROM members WHERE id = $1', [req.user.id]);
    if (!member) return resultRequest(res, false, 'Membre introuvable', {}, 'MEMBER_NOT_FOUND');

    const newPostit = {
      id: crypto.randomUUID(),
      message,
      categoryName,
      sprintRetroTeamLinkId: link.id,
      trigramme: isAnonymous ? '' : member.trigramme,
      color: isAnonymous ? ANONYMOUS_COLOR : member.color,
      memberId: member.id,
      annotation: '',
      isAnonymous,
    };
    await pool.query(
      "INSERT INTO postits (id, message, categoryname, sprintretroteamlinkid, trigramme, memberid, annotation, color, isanonymous) VALUES ($1, $2, $3, $4, $5, $6, '', $7, $8)",
      [
        newPostit.id,
        message,
        categoryName,
        link.id,
        newPostit.trigramme,
        member.id,
        newPostit.color,
        isAnonymous,
      ]
    );
    resultRequest(res, true, '', forViewer(newPostit, req.user.id));
  } catch (err) {
    console.error('[postit.create] erreur', err);
    let message = 'Erreur lors de la création du post-it';
    if (process.env.LOG_STATUS == 'all') {
      message = err.message;
    }
    resultRequest(res, false, message, {}, 'POSTIT_CREATE_ERROR');
  }
};

// Texte et catégorie : l'auteur, pendant la collecte. Annotation : le Scrum Master.
exports.update = async (req, res) => {
  try {
    const { id, message, categoryName, annotation } = req.body;
    const postIt = await pool.queryOne(`SELECT ${POSTIT_COLUMNS} FROM postits WHERE id = $1`, [id]);
    if (!postIt) return resultRequest(res, false, 'Post-it introuvable', {}, 'POSTIT_NOT_FOUND');

    const link = await getAccessibleLink(req, postIt.sprintRetroTeamLinkId);
    if (!link) return forbidden(res);

    const canEditContent = postIt.memberId === req.user.id && isCollecting(link);
    const canAnnotate = !!req.user.isScrumMaster;
    if (!canEditContent && !canAnnotate) return forbidden(res);

    if (canEditContent) {
      postIt.message = message ?? postIt.message;
      postIt.categoryName = categoryName ?? postIt.categoryName;
      if (
        typeof req.body.isAnonymous === 'boolean' &&
        req.body.isAnonymous !== postIt.isAnonymous
      ) {
        postIt.isAnonymous = req.body.isAnonymous;
        if (postIt.isAnonymous) {
          postIt.trigramme = '';
          postIt.color = ANONYMOUS_COLOR;
        } else {
          const member = await pool.queryOne('SELECT trigramme, color FROM members WHERE id = $1', [
            req.user.id,
          ]);
          postIt.trigramme = member?.trigramme || '';
          postIt.color = member?.color || null;
        }
      }
    }
    if (canAnnotate) postIt.annotation = annotation ?? postIt.annotation;

    await pool.query(
      'UPDATE postits SET categoryname = $1, message = $2, annotation = $3, isanonymous = $4, trigramme = $5, color = $6 WHERE id = $7',
      [
        postIt.categoryName,
        postIt.message,
        postIt.annotation,
        postIt.isAnonymous,
        postIt.trigramme,
        postIt.color,
        id,
      ]
    );
    resultRequest(res, true, '', forViewer(postIt, req.user.id));
  } catch (err) {
    console.error('[postit.update] erreur', err);
    let message = 'Erreur lors de la mise à jour du post-it';
    if (process.env.LOG_STATUS == 'all') {
      message = err.message;
    }
    resultRequest(res, false, message, {}, 'POSTIT_UPDATE_ERROR');
  }
};

// Suppression : l'auteur pendant la collecte, ou le Scrum Master
exports.remove = async (req, res) => {
  try {
    const postIt = await pool.queryOne(
      'SELECT id, memberid, sprintretroteamlinkid FROM postits WHERE id = $1',
      [req.params.id]
    );
    if (!postIt) return resultRequest(res, false, 'Post-it introuvable', {}, 'POSTIT_NOT_FOUND');

    const link = await getAccessibleLink(req, postIt.sprintretroteamlinkid);
    if (!link) return forbidden(res);

    const isAuthor = postIt.memberid === req.user.id && isCollecting(link);
    if (!isAuthor && !req.user.isScrumMaster) return forbidden(res);

    await pool.query('DELETE FROM postits WHERE id = $1', [postIt.id]);
    resultRequest(res, true, '', {});
  } catch (err) {
    console.error('[postit.remove] erreur', err);
    let message = 'Erreur lors de la suppression du post-it';
    if (process.env.LOG_STATUS == 'all') {
      message = err.message;
    }
    resultRequest(res, false, message, {}, 'POSTIT_DELETE_ERROR');
  }
};
