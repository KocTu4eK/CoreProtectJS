const { initDatabase } = require("./database.js");
const listener = require("./listener.js");
const command = require("./command.js");

ll.registerPlugin("CoreProtectMini", "Stripped down version of CoreProtect", [1, 0, 0]);

initDatabase();
