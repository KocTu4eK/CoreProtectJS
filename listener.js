const { logBlock, isInspector, logExplode } = require("./database.js");

mc.listen("onDestroyBlock", (pl, bl) => {
	if (bl.type === "minecraft:chest" || bl.type === "minecraft:trapped_chest") {
		bl.getContainer().getAllItems().forEach((it, index) => {
			if (!it.isNull() && !isInspector(pl.realName)) logBlock(pl, it.type, bl.pos.dimid, bl.pos.x, bl.pos.y, bl.pos.z, 3, it.aux, it.count, index, true);
		});
	}
	return logBlock(pl, bl.type, bl.pos.dimid, bl.pos.x, bl.pos.y, bl.pos.z, 0, bl.tileData);
});

mc.listen("afterPlaceBlock", (pl, bl) => logBlock(pl, bl.type, bl.pos.dimid, bl.pos.x, bl.pos.y, bl.pos.z, 1, bl.tileData));
mc.listen("onBlockInteracted", (pl, bl) => (bl.type !== "minecraft:chest" && bl.type !== "minecraft:trapped_chest" && bl.type !== "minecraft:ender_chest") || isInspector(pl.realName) ? logBlock(pl, bl.type, bl.pos.dimid, bl.pos.x, bl.pos.y, bl.pos.z, 2, bl.tileData) : true);
mc.listen("onOpenContainer", (pl) => isInspector(pl.realName) ? false : true);

mc.listen("onUseItemOn", (pl, it, bl, side, pos) => {
	if (it.type.includes("_hoe")) logBlock(pl, bl.type, bl.pos.dimid, bl.pos.x, bl.pos.y, bl.pos.z, 2, bl.tileData);
	else if (it.type === "minecraft:bucket" && (bl.type === "minecraft:powder_snow" || bl.type === "minecraft:water" || bl.type === "minecraft:flowing_water" || bl.type === "minecraft:lava" ||  bl.type === "minecraft:flowing_lava")) {
		return logBlock(pl, bl.type.replace("flowing_", ""), bl.pos.dimid, bl.pos.x, bl.pos.y, bl.pos.z, 0, bl.tileData);
	}

	let x = bl.pos.x, y = bl.pos.y, z = bl.pos.z;
	switch (side) {
		case 0:
		y -= 1;
		break;
		case 1:
		y += 1;
		break;
		case 2:
		z -= 1;
		break;
		case 3:
		z += 1;
		break;
		case 4:
		x -= 1;
		break;
		case 5:
		x += 1;
	}
	bl = mc.getBlock(x, y, z, bl.pos.dimid);

	if (it.type !== "minecraft:bucket" && it.type.includes("_bucket") && (bl.type === "minecraft:air" || bl.type === "minecraft:powder_snow" || bl.type === "minecraft:water" || bl.type === "minecraft:flowing_water" || bl.type === "minecraft:lava" ||  bl.type === "minecraft:flowing_lava")) {
		if (!logBlock(pl, it.type.replace("_bucket", ""), bl.pos.dimid, bl.pos.x, bl.pos.y, bl.pos.z, 1, bl.tileData)) {
			mc.setBlock(bl.pos, bl.type, bl.tileData);
			return false;
		}
	}
	else if (it.type === "minecraft:flint_and_steel") logBlock(pl, bl.type, bl.pos.dimid, bl.pos.x, bl.pos.y, bl.pos.z, 2, bl.tileData); // зажигалка не откатывается

	return true;
});

mc.listen("onContainerChange", (pl, bl, slotNum, oldIt, newIt) => {
	if (bl.type === "minecraft:ender_chest") return true;

	if (!oldIt.isNull() && newIt.isNull()) return logBlock(pl, oldIt.type, bl.pos.dimid, bl.pos.x, bl.pos.y, bl.pos.z, 3, oldIt.aux, oldIt.count, slotNum); // take out
	if (oldIt.isNull() && !newIt.isNull()) return logBlock(pl, newIt.type, bl.pos.dimid, bl.pos.x, bl.pos.y, bl.pos.z, 4, newIt.aux, newIt.count, slotNum); // put

	if (oldIt.type === newIt.type && oldIt.count > newIt.count) return logBlock(pl, oldIt.type, bl.pos.dimid, bl.pos.x, bl.pos.y, bl.pos.z, 3, oldIt.aux, oldIt.count - newIt.count, slotNum); // -
	if (oldIt.type === newIt.type && oldIt.count < newIt.count) return logBlock(pl, oldIt.type, bl.pos.dimid, bl.pos.x, bl.pos.y, bl.pos.z, 4, oldIt.aux, newIt.count - oldIt.count, slotNum); // +

	if (oldIt.type !== newIt.type && !oldIt.isNull() && !newIt.isNull()) { // replace
		logBlock(pl, oldIt.type, bl.pos.dimid, bl.pos.x, bl.pos.y, bl.pos.z, 3, oldIt.aux, oldIt.count, slotNum);
		return logBlock(pl, newIt.type, bl.pos.dimid, bl.pos.x, bl.pos.y, bl.pos.z, 4, newIt.aux, newIt.count, slotNum);
	}
});

mc.listen("onBlockExploded", (bl, src) => {
	if (bl.type === "minecraft:chest" || bl.type === "minecraft:trapped_chest") {
		bl.getContainer().getAllItems().forEach((it, index) => {
			if (!it.isNull()) logBlock(0, it.type, bl.pos.dimid, bl.pos.x, bl.pos.y, bl.pos.z, 3, it.aux, it.count, index, true);
		});
	}
	logExplode(src.type, src.pos.x, src.pos.y, src.pos.z, bl.type, bl.pos.dimid, bl.pos.x, bl.pos.y, bl.pos.z, bl.tileData);
});

module.exports = null;
