let session = null;

function initDatabase() {
	if (session === null) session = new DBSession("sqlite", { path: "./plugins/nodejs/CoreProtectMini/database.db" });

	session.exec("CREATE TABLE IF NOT EXISTS co_art_map (id INTEGER PRIMARY KEY AUTOINCREMENT, block TEXT UNIQUE)");
	session.exec("CREATE TABLE IF NOT EXISTS co_user (id INTEGER PRIMARY KEY AUTOINCREMENT, nickname TEXT UNIQUE, inspector INT DEFAULT 0, wid INT DEFAULT -1, x INT DEFAULT 0, y INT DEFAULT -256, z INT DEFAULT 0)");
	session.exec("CREATE TABLE IF NOT EXISTS co_block (time TIMESTAMP DEFAULT (CAST (((julianday('now') - 2440587.5) * 86400.0 * 1000) AS INT)), block INT, user INT, action INT, wid INT, x INT, y INT, z INT, data INT, count INT, slot INT, explode TEXT DEFAULT -1, rollback INT DEFAULT 0)");
}

function logBlock(pl, blockName, wid, x, y, z, action, tileData, count = -1, slot = -1, chest = false) {
	if (chest) session.exec(`INSERT INTO co_block (block, user, action, wid, x, y, z, data, count, slot) VALUES (${getBlockId(blockName)}, -1, ${action}, ${wid}, ${x}, ${y}, ${z}, ${tileData}, ${count}, ${slot})`);
	else if (!isInspector(pl.realName)) session.exec(`INSERT INTO co_block (block, user, action, wid, x, y, z, data, count, slot) VALUES (${getBlockId(blockName)}, ${getUserId(pl.realName)}, ${action}, ${wid}, ${x}, ${y}, ${z}, ${tileData}, ${count}, ${slot})`);
	else {
		if (action === 1) mc.setBlock(x, y, z, wid, "minecraft:air", 0);
		let pageCount = getPageCount(wid, x, y, z);

		if (pageCount > 0) {
			let output = `---- §3CoreProtect §r---- §7(x${x}/y${y}/z${z})§r\n`;

			let blockPage = getBlockPage(wid, x, y, z, 0);
			for (i = 1; i < blockPage.length; i++) {
				if (blockPage[i][1] === -1) continue;
				let actionText = blockPage[i][3] === 0 ? "broke" : blockPage[i][3] === 1 ? "placed" : blockPage[i][3] === 2 ? "clicked" : blockPage[i][3] === 3 ? `remove §3x${blockPage[i][4]}` : blockPage[i][3] === 4 ? `add §3x${blockPage[i][4]}` : blockPage[i][3] === 5 ? "blew up" : "?";
				if (blockPage[i][3] === 5) {
					let timeFormatted = timeFormat(blockPage[i][0]);
					let temp = `§7${timeFormat(blockPage[i][0])} ago§r - `;
					output += `${temp}§3${getUserName(blockPage[i][1])} §r${actionText} §3${getBlockName(blockPage[i][2])}§r.\n${" ".repeat((temp.length - 4.65) * 1.4 + ((temp.length - temp.replaceAll(/[0-9]/g, "").length) % 2 === 0 ? 0 : 1))}^ §7${blockPage[i][6]}§r\n`
				}
				else if (blockPage[i][5] !== 1) output += `§7${timeFormat(blockPage[i][0])} ago§r - §3${getUserName(blockPage[i][1])} §r${actionText} §3${getBlockName(blockPage[i][2])}§r.\n`;
				else output += `§o§7${timeFormat(blockPage[i][0])} ago§r§o - §3${getUserName(blockPage[i][1])} §r§o${actionText} §3${getBlockName(blockPage[i][2])}§r§o.§r\n`;
			}

			if (pageCount > 1) output += `-----\nPage 1/${pageCount}. View older data by typing "§3/co l <page>§r".`; 
			pl.tell(output);
		}
		else pl.tell(action ? "§3CoreProtect §r- No data found at this location." : `§3CoreProtect §r- No data found at §o${blockName.replace("minecraft:", "")}§r.`);
		
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
		if (blockPage[i][1] === -1) continue;
		let actionText = blockPage[i][3] === 0 ? "broke" : blockPage[i][3] === 1 ? "placed" : blockPage[i][3] === 2 ? "clicked" : blockPage[i][3] === 3 ? `remove x${blockPage[i][4]}` : blockPage[i][3] === 4 ? `add x${blockPage[i][4]}` : blockPage[i][3] === 5 ? "blew up" : "?";
		if (blockPage[i][3] === 5) {
			let timeFormatted = timeFormat(blockPage[i][0]);
			let temp = `§7${timeFormat(blockPage[i][0])} ago§r - `;
			output += `${temp}§3${getUserName(blockPage[i][1])} §r${actionText} §3${getBlockName(blockPage[i][2])}§r.\n${" ".repeat((temp.length - 4.65) * 1.4)}^ §7${blockPage[i][6]}§r\n`
		}
		if (blockPage[i][5] !== 1) output += `§7${timeFormat(blockPage[i][0])} ago§r - §3${getUserName(blockPage[i][1])} §r${actionText} §3${getBlockName(blockPage[i][2])}§r.\n`;
		else output += `§o§7${timeFormat(blockPage[i][0])} ago§r§o - §3${getUserName(blockPage[i][1])} §r§o${actionText} §3${getBlockName(blockPage[i][2])}§r§o.§r\n`;
	}

	if (pageCount > 1) output += `-----\nPage ${page}/${pageCount}. View older data by typing "§3/co l <page>§r".`; 
	return out.success(output);
}

function rollback(pl, radius, time, user, out) {
	let blockData = session.query(`SELECT block, action, wid, x, y, z, data, count, slot FROM co_block WHERE ((x - ${pl.blockPos.x}) * (x - ${pl.blockPos.x}) + (y - ${pl.blockPos.y}) * (y - ${pl.blockPos.y}) + (z - ${pl.blockPos.z}) * (z - ${pl.blockPos.z}) <= ${radius ** 2}) and time > ${time !== undefined ? Date.now() - time * 3600000 : 0} and rollback == 0 and action != 2 ${user !== undefined ? `and user = ${getUserId(user)} ` : ""}ORDER BY time DESC`);
	if (blockData === undefined) return out.success("§3CoreProtect §r- No rollback data found at this location.");
	session.exec(`UPDATE co_block SET rollback = 1 WHERE ((x - ${pl.blockPos.x}) * (x - ${pl.blockPos.x}) + (y - ${pl.blockPos.y}) * (y - ${pl.blockPos.y}) + (z - ${pl.blockPos.z}) * (z - ${pl.blockPos.z}) <= ${radius ** 2}) and time > ${time !== undefined ? Date.now() - time * 3600000 : 0} and action != 2`);

	for (i = 1; i < blockData.length; i++) {
		switch (blockData[i][1]) {
		case 0: // break
		case 5: // explode
			let blockName = getBlockName(blockData[i][0]);
			mc.setBlock(blockData[i][3], blockData[i][4], blockData[i][5], blockData[i][2], `minecraft:${blockName === "water" || blockName === "lava" ? "flowing_" + blockName : blockName}`, blockData[i][6]);
			break;
		case 1: // place
			mc.setBlock(blockData[i][3], blockData[i][4], blockData[i][5], blockData[i][2], "minecraft:air", 0);
			break;
		case 3: // take out
			let ct = mc.getBlock(blockData[i][3], blockData[i][4], blockData[i][5], blockData[i][2]).getContainer();
			let it = mc.newItem(`minecraft:${getBlockName(blockData[i][0])}`, blockData[i][7] + ct.getAllItems()[blockData[i][8]].count);
			it.setAux(blockData[i][6]);
			ct.setItem(blockData[i][8], it);
			break;
		case 4: // put
			mc.getBlock(blockData[i][3], blockData[i][4], blockData[i][5], blockData[i][2]).getContainer().removeItem(blockData[i][8], blockData[i][7]);
			break;
		}
	}

	return out.success("§3CoreProtect §r- Rollback completed.");
}

function logExplode(srcType, srcX, srcY, srcZ, blockName, wid, x, y, z, tileData) {
	session.exec(`INSERT INTO co_block (block, user, action, wid, x, y, z, data, count, slot, explode) VALUES (${getBlockId(blockName)}, ${getUserId(srcType === "minecraft:tnt" ? "TNT" : srcType === "minecraft:creeper" ? "Creeper" : "?")}, 5, ${wid}, ${x}, ${y}, ${z}, ${tileData}, -1, -1, "${Math.floor(srcX)}/${Math.floor(srcY)}/${Math.floor(srcZ)}")`);
}

function getBlockPage(wid, x, y, z, offset) {
	return session.query(`SELECT time, user, block, action, count, rollback, explode FROM co_block WHERE wid = ${wid} AND x = ${x} AND y = ${y} AND z = ${z} ORDER BY time DESC LIMIT ${offset}, 7`);
}

function getPageCount(wid, x, y, z) {
	return Math.ceil(session.query(`SELECT COUNT(block) FROM co_block WHERE wid = ${wid} AND x = ${x} AND y = ${y} AND z = ${z}`)[1][0] / 7);
}

function timeFormat(time) {
	return `${((Date.now() - time) / 3600000).toFixed(2)}/h`.replace(".", ",");
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

function isInspector(playerName) {
	return session.query(`SELECT inspector FROM co_user WHERE id = ${getUserId(playerName)}`)[1][0];
}

function setInspector(playerName, inspector) {
	session.exec(`UPDATE co_user SET inspector = ${inspector} WHERE id = ${getUserId(playerName)}`);
}

function clearUserPos(playerName) {
	session.exec(`UPDATE co_user SET y = -256 WHERE id = ${getUserId(playerName)}`);
}

module.exports = {
	initDatabase,
	logBlock,
	isInspector,
	setInspector,
	lookupPage,
	clearUserPos,
	rollback,
	logExplode
};
