console.log("initializing...")

// Config Initialize
let rawdata = fs.readFileSync('config.json');
let data = JSON.parse(rawdata);

// Setting stuff up
var host = data["ip"];
var port = data["port"]
var username = data["name"]
var version = data["version"]
var authmepassword = data["authme_pw"]

const mineflayer = require('mineflayer')
const {
	pathfinder,
	Movements,
	goals: {
		GoalBlock
	}
} = require('mineflayer-pathfinder')

const options = {
  host: host,  // Server to connect
  port: port, // You know the rules, and so do I
  username: username, // Username
  version: version // Version
}

const bot = mineflayer.createBot(options)
const mcData = require('minecraft-data')(bot.version)
const defaultMove = new Movements(bot, mcData)
bot.loadPlugin(pathfinder)

function goSkyblock () {
  bot.activateItem()
  bot.on('windowOpen', async (window) => {
  	window.requiresConfirmation = false // fix
  	await bot.clickWindow(21, 0, 0)
  })
}

bot.once('spawn', () => {
  bot.chat('/login ' + authmepassword)
  console.log("logged in!")
  bot.pathfinder.setMovements(defaultMove)
  bot.pathfinder.setGoal(new GoalBlock(28, 68, 0))
  bot.on('goal_reached', (goal) => {
    //console.log("JUMPP!")
  	bot.setControlState('jump', true)
  	bot.setControlState('jump', false)
  })
})

bot.chatAddPattern(
  /(ตอนนี้กำลังเล่นเพลง)/,
  'nowplayingdetected',
  'we know that we logged in'
)

const NowPlaying =  () => {
  //console.log("less go")
  setTimeout(goSkyblock, 500);
}

bot.on('nowplayingdetected', NowPlaying)

bot.on('message', (cm) => {
  if (cm.toString().includes('!startfish')) {
  	bot.chat("/home")
  	bot.chat("i love fishing so much :D")
    startFishing()
  }

  if (cm.toString().includes('!stopfish')) {
  	bot.chat("ok, no more fishing")
    stopFishing()
  }

  if (cm.toString().includes('!eat')) {
    eat()
  }

  const item = itemByName("fish")
  if (cm.toString().includes('!tossall')) {
  	bot.tossStack(item, checkIfTossed)
  }
})


let nowFishing = false

function onCollect (player, entity) {
  if (entity.kind === 'Drops' && player === bot.entity) {
    bot.removeListener('playerCollect', onCollect)
    startFishing()
  }
}

async function startFishing () {
  //bot.chat('Fishing')
  try {
    await bot.equip(mcData.itemsByName.fishing_rod.id, 'hand')
  } catch (err) {
    return bot.chat(err.message)
  }

  nowFishing = true
  bot.on('playerCollect', onCollect)

  try {
    await bot.fish()
  } catch (err) {
    bot.chat(err.message)
  }
  nowFishing = false
}

function stopFishing () {
  bot.removeListener('playerCollect', onCollect)

  if (nowFishing) {
    bot.activateItem()
  }
}

async function eat () {
  stopFishing()

  try {
    await bot.equip(mcData.itemsByName.fish.id, 'hand')
  } catch (err) {
    return bot.chat(err.message)
  }

  try {
    await bot.consume()
  } catch (err) {
    return bot.chat(err.message)
  }
}

function checkIfTossed (err) {
    if (err) {
      bot.chat(`unable to toss: ${err.message}`)
    } else {
      bot.chat(`Here's your fish ^_^`)
    }
  }

function itemToString (item) {
  if (item) {
    return `${item.name} x ${item.count}`
  } else {
    return '(nothing)'
  }
}

function itemByName (name) {
  return bot.inventory.items().filter(item => item.name === name)[0]
}