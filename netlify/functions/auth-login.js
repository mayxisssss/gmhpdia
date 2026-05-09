
const { db, json, options, parseBody, hashPassword, sign, safeUser, logAction, ipFromEvent } = require('./_utils');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return options(event);
  if (event.httpMethod !== 'POST') return json(405, { error:'Método não permitido' }, event);

  const ip = ipFromEvent(event);
  const { usuario, senha } = parseBody(event);
  const username = String(usuario || '').trim();

  try {
    if (!username || !senha) {
      await logAction(username || 'desconhecido', 'Falha de login', 'auth', { ip, motivo:'campos vazios' }, null);
      return json(401, { error:'Usuário ou senha incorretos.' }, event);
    }

    const { data:user, error } = await db.from('admin_users').select('*').eq('username', username).maybeSingle();
    if (error || !user || !user.active) {
      await logAction(username, 'Falha de login', 'auth', { ip, motivo:'usuário inexistente ou inativo' }, null);
      return json(401, { error:'Usuário ou senha incorretos.' }, event);
    }

    const attempt = hashPassword(String(senha || ''), user.salt);
    if (attempt !== user.password_hash) {
      await logAction(username, 'Falha de login', 'auth', { ip, motivo:'senha incorreta' }, null);
      return json(401, { error:'Usuário ou senha incorretos.' }, event);
    }

    const token = sign({ id:user.id });
    await logAction(user.username, 'Entrou no painel', 'auth', { ip }, null);
    return json(200, { ok:true, token, user:safeUser(user) }, event);
  } catch(error){
    return json(500, { error:error.message }, event);
  }
};
