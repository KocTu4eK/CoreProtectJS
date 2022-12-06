let session = null;

function initDatabase() {
	if (session === null) session = new DBSession("sqlite", { path: "./plugins/nodejs/CoreProtectMini/database.db" });

	session.exec("CREATE TABLE IF NOT EXISTS co_art_map (id INTEGER PRIMARY KEY AUTOINCREMENT, block TEXT UNIQUE)");
	session.exec("CREATE TABLE IF NOT EXISTS co_user (id INTEGER PRIMARY KEY AUTOINCREMENT, nickname TEXT UNIQUE, inspector INT DEFAULT 0, wid INT DEFAULT -1, x INT DEFAULT 0, y INT DEFAULT -256, z INT DEFAULT 0)");
	session.exec("CREATE TABLE IF NOT EXISTS co_item (id INTEGER PRIMARY KEY AUTOINCREMENT, item TEXT UNIQUE)");
	session.exec("CREATE TABLE IF NOT EXISTS co_block (time TIMESTAMP DEFAULT (CAST (((julianday('now') - 2440587.5) * 86400.0 * 1000) AS INT)), block INT, user INT, action INT, wid INT, x INT, y INT, z INT)");
}

function getUserId(playerName) {
	let userId = session.query(`SELECT id FROM co_user WHERE nickname = "${playerName}"`);

	if (userId === undefined) {
		session.exec(`INSERT INTO co_user (nickname) VALUES ("${playerName}")`);
		return session.query(`SELECT id FROM co_user WHERE nickname = "${playerName}"`)[1][0];
	}

	return userId[1][0];
}

function getUserName(userId) {
	return session.query(`SELECT nickname FROM co_user WHERE id = ${userId}`)[1][0];
}

function getBlockId(blockName) {
	blockName = blockName.replace("minecraft:", "");
	let blockId = session.query(`SELECT id FROM co_art_map WHERE block = "${blockName}"`);

	if (blockId === undefined) {
		session.exec(`INSERT INTO co_art_map (block) VALUES ("${blockName}")`);
		return session.query(`SELECT id FROM co_art_map WHERE block = "${blockName}"`)[1][0];
	}

	return blockId[1][0];
}

function getBlockName(blockId) {
	return session.query(`SELECT block FROM co_art_map WHERE id = ${blockId}`)[1][0];
}

function logBlock(pl, blockName, wid, x, y, z, action) {
	if (!isInspector(pl.realName)) session.exec(`INSERT INTO co_block (block, user, action, wid, x, y, z) VALUES (${getBlockId(blockName)}, ${getUserId(pl.realName)}, ${action}, ${wid}, ${x}, ${y}, ${z})`);
	else {
		if (action === 1) mc.setBlock(x, y, z, wid, "minecraft:air", 0);
		let pageCount = getPageCount(wid, x, y, z);

		if (pageCount > 0) {
			let output = `---- §3CoreProtect §r---- §7(x${x}/y${y}/z${z})§r\n`;

			let blockPage = getBlockPage(wid, x, y, z, 0);
			for (i = 1; i < blockPage.length; i++) {
				output += `§7${timeFormat(blockPage[i][0])} ago§r - §3${getUserName(blockPage[i][1])} §r${blockPage[i][3] === 0 ? "broke" : blockPage[i][3] === 1 ? "placed" : blockPage[i][3] === 2 ? "clicked" : blockPage[i][3] === 3 ? "add" : blockPage[i][3] === 4 ? "remove" : "?"} §3${getBlockName(blockPage[i][2])}§r.\n`;
			}

			if (pageCount > 1) output += `-----\nPage 1/${pageCount}. View older data by typing "§3/co l <page>§r".`; 
			pl.tell(output);
		}
		else pl.tell(action ? `§3CoreProtect §r- No data found at this location.` : `§3CoreProtect §r- No data found at §o${blockName.replace("minecraft:", "")}§r.`);
		
		session.exec(`UPDATE co_user SET x = ${x}, y = ${y}, z = ${z}, wid = ${wid} WHERE id = ${getUserId(pl.realName)}`);

		return false;
	}

	return true;
}

function lookupPage(pl, page, out) {
	if (!isInspector(pl.realName)) return out.error("First enter inspector mode!");
	
	let userId = getUserId(pl.realName);
	let userData = session.query(`SELECT wid, x, y, z FROM co_user WHERE id = ${userId}`)[1];
	let pageCount = getPageCount(userData[0], userData[1], userData[2], userData[3]);

	if (pageCount < page) return out.success("§3CoreProtect §r- No data found for that page.");

	let output = `---- §3CoreProtect §r---- §7(x${userData[1]}/y${userData[2]}/z${userData[3]})§r\n`;

	let blockPage = getBlockPage(userData[0], userData[1], userData[2], userData[3], (page - 1) * 7);
	for (i = 1; i < blockPage.length; i++) {
		output += `§7${timeFormat(blockPage[i][0])} ago§r - §3${getUserName(blockPage[i][1])} §r${blockPage[i][3] === 0 ? "broke" : blockPage[i][3] === 1 ? "placed" : blockPage[i][3] === 2 ? "clicked" : blockPage[i][3] === 3 ? "add" : blockPage[i][3] === 4 ? "remove" : "?"} §3${getBlockName(blockPage[i][2])}§r.\n`;
	}

	if (pageCount > 1) output += `-----\nPage ${page}/${pageCount}. View older data by typing "§3/co l <page>§r".`; 
	return out.success(output);
}

function isInspector(playerName) {
	return session.query(`SELECT inspector FROM co_user WHERE id = ${getUserId(playerName)}`)[1][0];
}

function setInspector(playerName, inspector) {
	session.exec(`UPDATE co_user SET inspector = ${inspector} WHERE id = ${getUserId(playerName)}`);
}

function clearUserPos(playerName) {
	session.exec(`UPDATE co_user SET y = -256 WHERE id = ${getUserId(playerName)}`);
}

function getBlockPage(wid, x, y, z, offset) {
	return session.query(`SELECT time, user, block, action FROM co_block WHERE wid = ${wid} AND x = ${x} AND y = ${y} AND z = ${z} ORDER BY time DESC LIMIT ${offset}, 7`);
}

function getPageCount(wid, x, y, z) {
	return Math.ceil(session.query(`SELECT COUNT(block) FROM co_block WHERE wid = ${wid} AND x = ${x} AND y = ${y} AND z = ${z}`)[1][0] / 7);
}

function timeFormat(time) {
	return `${((Date.now() - time) / 3600000).toFixed(2)}/h`.replace(".", ",");
}

module.exports = {
	initDatabase,
	logBlock,
	isInspector,
	setInspector,
	lookupPage,
	clearUserPos
};
