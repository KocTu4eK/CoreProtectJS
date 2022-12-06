const { isInspector, setInspector, lookupPage, clearUserPos } = require("./database.js");

mc.listen("onServerStarted", () => {
	let command = mc.newCommand("coreprotect", "CoreProtect by KocTu4eK.", PermType.Any);
	command.setAlias("co");
	command.setEnum("Inspect", ["inspect", "i"]);
	command.setEnum("Lookup", ["lookup", "l"]);
	command.mandatory("inspect", ParamType.Enum, "Inspect", 1);
	command.mandatory("lookup", ParamType.Enum, "Lookup", 1);
	command.mandatory("page", ParamType.Int);
	command.overload(["inspect"]);
	command.overload(["lookup", "page"]);

	command.setCallback((_cmd, ori, out, res) => {
		if (ori.player === undefined) return out.error("You are not a player!");

		if (ori.player.hasTag("coreprotect")) {
			if (res.inspect !== undefined) {
				if (!isInspector(ori.player.realName)) {
					setInspector(ori.player.realName, 1);
					return out.success("§3CoreProtect §r- Inspector now enabled.");
				}

				setInspector(ori.player.realName, 0);
				clearUserPos(ori.player.realName);
				return out.success("§3CoreProtect §r- Inspector now disabled.");
			}

			if (res.lookup !== undefined) {
				if (res.page < 1) return out.error("Invalid integer specified!");
				return lookupPage(ori.player, res.page, out);
			}
		}
		
		return out.error("You don't have permission for this!");
	});

	command.setup();

	let coperms = mc.newCommand("coperms", "Grant or revoke CoreProtect permissions.", PermType.GameMasters);
	coperms.mandatory("player", ParamType.Player);
	coperms.overload(["player"]);

	coperms.setCallback((_cmd, ori, out, res) => {
		if (res["player"].length !== 1) return out.error("Choose one player!");
		let pl = res["player"][0];

		if (pl.hasTag("coreprotect")) {
			pl.removeTag("coreprotect");
			setInspector(pl.realName, 0);
			return out.success(`§3CoreProtect §r- Permissions have been successfully removed from ${pl.realName}.`);
		}

		pl.addTag("coreprotect");
		return out.success(`§3CoreProtect §r- Permissions have been successfully added to ${pl.realName}.`);
	});

	coperms.setup();
});

module.exports = null;
