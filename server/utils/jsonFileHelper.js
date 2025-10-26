const fs = require('fs').promises;
const path = require('path');


async function readJson(file) {
  const data = await fs.readFile(file, 'utf8');
  return JSON.parse(data || '[]');
}

async function writeJson(file, data) {
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

async function addItem(file, item) {
  const items = await readJson(file);
  items.push(item);
  await writeJson(file, items);
  return item;
}

async function deleteItem(file, id) {
  const items = await readJson(file);
  const index = items.findIndex(item => item.id === id);
  if (index === -1) throw new Error('Élément introuvable');
  items.splice(index, 1);
  await writeJson(file, items);
  return true;
}
module.exports = {
  readJson,
  addItem,
  deleteItem,
  writeJson
};
