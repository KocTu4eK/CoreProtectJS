# CoreProtectMini
This is an incomplete port of CoreProtect written in NodeJS with few features. Made by order https://t.me/caliuzz.
## Logged
— Destroying/placing of the block  
— Placing something with a bucket  
— Interaction with the block  
— Changing the container
## Features
— Write (only) in SQLite  
— Paginated log output  
— Permission for the command  
— Rollback of all actions
## Commands
— /coreprotect <inspect|i>  
⠀⠀/coreprotect <l|lookup> <page>  
⠀⠀/coreprotect <rollback|r> <radius: int> [time: float] [user: string]  
⠀⠀/co — alias  
— /coperms <player: target>
## Importantly
— Do not try to inspect the block with flint and steel on TNT.  
— After inspecting the block with a hoe, a farmland will remain.  
— If you inspect a liquid by placing a block in it, the liquid will disappear.
— After the container is rolled back, the item auxiliary/data value is not preserved.
