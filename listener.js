const { logBlock } = require("./database.js");

mc.listen("onDestroyBlock", (pl, bl) => logBlock(pl, bl.name, bl.pos.dimid, bl.pos.x, bl.pos.y, bl.pos.z, 0));
mc.listen("afterPlaceBlock", (pl, bl) => logBlock(pl, bl.name, bl.pos.dimid, bl.pos.x, bl.pos.y, bl.pos.z, 1));
mc.listen("onBlockInteracted", (pl, bl) => logBlock(pl, bl.name, bl.pos.dimid, bl.pos.x, bl.pos.y, bl.pos.z, 2));

mc.listen("onUseItemOn", (pl, it, bl, side, pos) => {
	if (it.type === "minecraft:bucket" && (bl.type === "minecraft:powder_snow" || bl.type === "minecraft:water" || bl.type === "minecraft:flowing_water" || bl.type === "minecraft:lava" ||  bl.type === "minecraft:flowing_lava")) {
		return logBlock(pl, bl.type.replace("flowing_", ""), bl.pos.dimid, bl.pos.x, bl.pos.y, bl.pos.z, 0);
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
		if (!logBlock(pl, it.type.replace("_bucket", ""), bl.pos.dimid, bl.pos.x, bl.pos.y, bl.pos.z, 1)) {
			mc.setBlock(bl.pos, bl.type, bl.tileData);
			return false;
		}
	}

	return true;
});

mc.listen("onContainerChange", (pl, bl, slotNum, oldIt, newIt) => {
	if (!oldIt.isNull() && newIt.isNull()) logBlock(pl, oldIt.type, bl.pos.dimid, bl.pos.x, bl.pos.y, bl.pos.z, 3); // take out

	if (oldIt.isNull() && !newIt.isNull()) logBlock(pl, newIt.type, bl.pos.dimid, bl.pos.x, bl.pos.y, bl.pos.z, 4); // put

	if (!oldIt.isNull() && !newIt.isNull()) { // replace
		logBlock(pl, oldIt.type, bl.pos.dimid, bl.pos.x, bl.pos.y, bl.pos.z, 3);
		logBlock(pl, newIt.type, bl.pos.dimid, bl.pos.x, bl.pos.y, bl.pos.z, 4);
	}
});

module.exports = null;
