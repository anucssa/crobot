const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

require('dotenv').config();

// Discord.js
client.on('ready', () => {
    client.user.setPresence({
        activities: [{
            name: "the door sensor boot",
            type: 3,
        }],
        status: "idle"
    });
    console.log(`Logged into discord as ${client.user.tag}!`);
});

client.login(process.env.DISCORD_TOKEN);

/// Express things
const express = require('express')
const app = express()
const port = 9000

app.use(express.urlencoded({ extended: true }));

const timeout = () => {
    client.user.setPresence({
        activities: [{
            name: "sensor dead poke #general",
            type: 3
        }],
        status: "idle"
    })
} 

// Timer to set sensor dead message
let timer = setTimeout(timeout, 1000*60);

// Old http method
// TODO: Use mqtt
app.post('/commonRoom/status', (req, res) => {
    const time = new Date();
    console.log(time.toUTCString() + ": " + JSON.stringify(req.body));
    if (req.body.code == process.env.STATUS_PWD) {
        if (req.body.state == '1') {
            client.user.setPresence({
                activities: [{
                    name: "room is Open ✨",
                    type: 3
                }],
                status: "online"
            });
        } else {
            client.user.setPresence({
                activities: [{
                    name: "room is Closed",
                    type: 3
                }],
                status: "dnd"
            });
        }

        // Reset timer
        clearTimeout(timer)
        timer = setTimeout(timeout, 1000*60);
        res.end(req.body.status)
    } else {
        res.end("Invalid code")
    }
})

// Make all other http requests go to qpay
app.get('*', function(req, res) {
    res.redirect('https://webapp.getqpay.com/')
});

app.listen(port, () => {
    console.log(`CROBot listening on ${port}`)
})