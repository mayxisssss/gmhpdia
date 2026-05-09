
const { json, getCurrentUser, safeUser } = require('./_utils');
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return options(event);
  const user = await getCurrentUser(event);
  if (!user) return json(401, { error:'Sessão inválida' }, event);
  return json(200, { user:safeUser(user) });
};
